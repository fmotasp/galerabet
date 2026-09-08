-- ==============================================================================
-- MIGRATION: ROW LEVEL SECURITY (RLS) & AUTORIZAÇÃO SEGURA (HARDENED V2)
-- Data: 2026-09-08
-- Descrição: Implementação rigorosa de RLS para public.employees, public.projects
--            e public.tasks. Remoção de policies permissivas, mitigação de elevação
--            de privilégios, proteção de system-settings, anulação de senhas
--            e RPC segura claim_task() para atribuição de demandas não alocadas.
-- ==============================================================================

-- 1. Habilitar RLS em todas as tabelas públicas essenciais
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- 2. Remoção de todas as policies legadas e permissivas (USING true / FOR ALL para anon)
DROP POLICY IF EXISTS "Allow public all on employees" ON public.employees;
DROP POLICY IF EXISTS "Allow public all on projects" ON public.projects;
DROP POLICY IF EXISTS "Allow public read on tasks" ON public.tasks;
DROP POLICY IF EXISTS "Allow public insert on tasks" ON public.tasks;
DROP POLICY IF EXISTS "Allow public update on tasks" ON public.tasks;
DROP POLICY IF EXISTS "Allow public delete on tasks" ON public.tasks;

-- Remoção de policies v1 se já existentes
DROP POLICY IF EXISTS "employees_select_authenticated" ON public.employees;
DROP POLICY IF EXISTS "employees_insert_admin_or_manager" ON public.employees;
DROP POLICY IF EXISTS "employees_update_admin_or_self" ON public.employees;
DROP POLICY IF EXISTS "employees_delete_admin_or_manager" ON public.employees;

DROP POLICY IF EXISTS "projects_select_anon_system_settings" ON public.projects;
DROP POLICY IF EXISTS "projects_select_authenticated" ON public.projects;
DROP POLICY IF EXISTS "projects_insert_admin_or_manager" ON public.projects;
DROP POLICY IF EXISTS "projects_update_admin_or_manager" ON public.projects;
DROP POLICY IF EXISTS "projects_delete_admin_or_manager" ON public.projects;

DROP POLICY IF EXISTS "tasks_select_authenticated" ON public.tasks;
DROP POLICY IF EXISTS "tasks_insert_authenticated" ON public.tasks;
DROP POLICY IF EXISTS "tasks_update_collaborative" ON public.tasks;
DROP POLICY IF EXISTS "tasks_delete_admin_or_manager" ON public.tasks;

-- 3. Limpeza de dados confidenciais: Anular senhas legadas em texto puro
UPDATE public.employees
SET password = NULL
WHERE password IS NOT NULL;

-- 4. Garantir colunas necessárias caso a migration de auth não tenha sido executada
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS needs_password_change BOOLEAN DEFAULT FALSE;

-- 5. Criação de índices de performance para otimização das checagens de RLS
CREATE INDEX IF NOT EXISTS idx_employees_auth_user_id ON public.employees(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_employees_role_type ON public.employees(role_type);
CREATE INDEX IF NOT EXISTS idx_employees_email ON public.employees(email);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON public.tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);
-- Índice GIN para busca performática de membros da tarefa no JSONB
CREATE INDEX IF NOT EXISTS idx_tasks_members_gin ON public.tasks USING GIN (members);

-- ==============================================================================
-- 5. FUNÇÕES AUXILIARES DE AUTORIZAÇÃO (SECURITY DEFINER com search_path explícito)
-- NOTA ARQUITETURAL: SECURITY DEFINER é obrigatório nestas funções para evitar
-- recursão infinita no RLS (infinite recursion) ao consultar public.employees
-- dentro das próprias policies de public.employees e public.tasks.
-- ==============================================================================

-- Função: Verifica se o usuário autenticado atual é Administrador Geral ou Gestor
CREATE OR REPLACE FUNCTION public.is_admin_or_manager()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT 
    -- 1. Metadados do JWT (garante validação mesmo antes do vínculo de auth_user_id)
    (COALESCE(auth.jwt() ->> 'email', '') = 'admin@empresa.com')
    OR (COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin')
    -- 2. Verificação no registro de funcionários vinculado ao auth.uid()
    OR EXISTS (
      SELECT 1 
      FROM public.employees e
      WHERE e.auth_user_id = auth.uid()
        AND (
          e.role_type = 'admin'
          OR LOWER(COALESCE(e.role, '')) IN ('admin', 'administrador')
          OR LOWER(COALESCE(e.role, '')) LIKE '%gestor%'
          OR LOWER(COALESCE(e.role, '')) LIKE '%gerente%'
          OR LOWER(COALESCE(e.role, '')) LIKE '%manager%'
          OR LOWER(COALESCE(e.role, '')) LIKE '%gestão%'
          OR LOWER(COALESCE(e.role, '')) LIKE '%gestao%'
          OR LOWER(COALESCE(e.department, '')) LIKE '%gest%'
          OR LOWER(COALESCE(e.department, '')) LIKE '%geren%'
        )
    );
$$;

-- Função: Verifica se o usuário autenticado atual é estritamente Administrador Geral
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT 
    (COALESCE(auth.jwt() ->> 'email', '') = 'admin@empresa.com')
    OR (COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin')
    OR EXISTS (
      SELECT 1 
      FROM public.employees e
      WHERE e.auth_user_id = auth.uid()
        AND (
          e.role_type = 'admin'
          OR LOWER(COALESCE(e.role, '')) IN ('admin', 'administrador')
        )
    );
$$;

-- Função: Retorna o ID interno de funcionário correspondente ao auth.uid() logado
CREATE OR REPLACE FUNCTION public.get_current_employee_id()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT id 
  FROM public.employees 
  WHERE auth_user_id = auth.uid() 
  LIMIT 1;
$$;

-- Restringir permissões de execução das funções auxiliares
REVOKE ALL ON FUNCTION public.is_admin_or_manager() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_current_employee_id() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.is_admin_or_manager() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_employee_id() TO authenticated;

-- ==============================================================================
-- 6. RPC: ASSUMIR DEMANDA NÃO ATRIBUÍDA (CLAIM TASK)
-- Permite que colaboradores assumam uma demanda sem conceder UPDATE arbitrário
-- em todos os campos de demandas sem responsável via RLS.
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.claim_task(p_task_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_emp_id TEXT;
  v_emp_name TEXT;
  v_emp_initials TEXT;
  v_existing_assignee TEXT;
  v_updated_task RECORD;
BEGIN
  -- 1. Verifica se há usuário autenticado
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Acesso negado: operação requer autenticação.';
  END IF;

  -- 2. Identifica o employee correspondente ao auth.uid()
  SELECT id, name, initials INTO v_emp_id, v_emp_name, v_emp_initials
  FROM public.employees
  WHERE auth_user_id = auth.uid()
  LIMIT 1;

  IF v_emp_id IS NULL THEN
    RAISE EXCEPTION 'Perfil de colaborador não encontrado para o usuário autenticado.';
  END IF;

  -- 3. Verifica se a tarefa existe e se está desatribuída
  SELECT assignee_id INTO v_existing_assignee
  FROM public.tasks
  WHERE id = p_task_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tarefa não encontrada.';
  END IF;

  IF v_existing_assignee IS NOT NULL 
     AND v_existing_assignee <> '' 
     AND v_existing_assignee <> 'unassigned' 
     AND v_existing_assignee <> v_emp_id THEN
    RAISE EXCEPTION 'Esta demanda já possui um responsável atribuído.';
  END IF;

  -- 4. Atribui estritamente a demanda ao colaborador autenticado
  UPDATE public.tasks
  SET 
    assignee_id = v_emp_id,
    assignee_name = v_emp_name,
    assignee_initials = v_emp_initials,
    members = CASE 
      WHEN members IS NULL OR jsonb_array_length(members) = 0 THEN 
        jsonb_build_array(jsonb_build_object('id', v_emp_id, 'name', v_emp_name, 'initials', v_emp_initials))
      WHEN NOT (members @> jsonb_build_array(jsonb_build_object('id', v_emp_id))) THEN
        members || jsonb_build_array(jsonb_build_object('id', v_emp_id, 'name', v_emp_name, 'initials', v_emp_initials))
      ELSE members
    END,
    updated_at = NOW()
  WHERE id = p_task_id
  RETURNING * INTO v_updated_task;

  RETURN to_jsonb(v_updated_task);
END;
$$;

REVOKE ALL ON FUNCTION public.claim_task(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_task(TEXT) TO authenticated;

-- ==============================================================================
-- 7. PROTEÇÃO CONTRA ELEVAÇÃO DE PRIVILÉGIOS (TRIGGER EM EMPLOYEES)
-- Protege campos sensíveis de controle administrativo (role_type, role, department,
-- auth_user_id, email, current_workload).
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.prevent_employee_privilege_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Se o autor da alteração for Admin ou Gestor, a alteração é autorizada
  IF public.is_admin_or_manager() THEN
    RETURN NEW;
  END IF;

  -- Para colaboradores comuns editando seu próprio registro:
  -- 1. Bloqueia terminantemente alteração de campos de segurança e cargos
  IF (NEW.role_type IS DISTINCT FROM OLD.role_type) THEN
    RAISE EXCEPTION 'Acesso negado: colaboradores não têm permissão para alterar o tipo de perfil (role_type).';
  END IF;

  IF (NEW.role IS DISTINCT FROM OLD.role) THEN
    RAISE EXCEPTION 'Acesso negado: colaboradores não têm permissão para alterar o cargo (role).';
  END IF;

  IF (NEW.department IS DISTINCT FROM OLD.department) THEN
    RAISE EXCEPTION 'Acesso negado: colaboradores não têm permissão para alterar o departamento.';
  END IF;

  -- 2. Bloqueia sequestro de conta: auth_user_id só pode ser vinculado se estava NULL e o novo valor for o auth.uid()
  IF (OLD.auth_user_id IS NOT NULL AND NEW.auth_user_id IS DISTINCT FROM OLD.auth_user_id) THEN
    RAISE EXCEPTION 'Acesso negado: não é permitido alterar o identificador de autenticação (auth_user_id).';
  END IF;

  IF (OLD.auth_user_id IS NULL AND NEW.auth_user_id IS NOT NULL AND NEW.auth_user_id <> auth.uid()) THEN
    RAISE EXCEPTION 'Acesso negado: o auth_user_id só pode ser vinculado ao próprio usuário autenticado.';
  END IF;

  -- 3. Bloqueia alteração arbitrária de email do registro
  IF (NEW.email IS DISTINCT FROM OLD.email) THEN
    RAISE EXCEPTION 'Acesso negado: o e-mail cadastral só pode ser alterado por administradores.';
  END IF;

  -- 4. Bloqueia manipulação da carga de trabalho
  IF (NEW.current_workload IS DISTINCT FROM OLD.current_workload) THEN
    RAISE EXCEPTION 'Acesso negado: a carga de trabalho só pode ser gerenciada pela administração.';
  END IF;

  -- 5. needs_password_change só pode transitar de true para false pelo próprio usuário
  IF (OLD.needs_password_change IS FALSE AND NEW.needs_password_change IS TRUE) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem exigir troca obrigatória de senha.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_employee_privilege_escalation ON public.employees;
CREATE TRIGGER trg_prevent_employee_privilege_escalation
  BEFORE UPDATE ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_employee_privilege_escalation();

-- ==============================================================================
-- 8. POLICIES: PUBLIC.EMPLOYEES
-- ==============================================================================

-- SELECT: Usuários autenticados podem consultar a lista de membros da agência
CREATE POLICY "employees_select_authenticated"
  ON public.employees FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: Somente Administradores e Gestores podem cadastrar novos membros
CREATE POLICY "employees_insert_admin_or_manager"
  ON public.employees FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_or_manager());

-- UPDATE: Administradores/Gestores podem editar qualquer membro;
-- Colaboradores podem atualizar seus próprios dados permitidos (status, avatar, username, location etc.)
CREATE POLICY "employees_update_admin_or_self"
  ON public.employees FOR UPDATE
  TO authenticated
  USING (
    public.is_admin_or_manager()
    OR auth_user_id = auth.uid()
    OR (auth_user_id IS NULL AND LOWER(email) = LOWER(COALESCE(auth.jwt() ->> 'email', '')))
  )
  WITH CHECK (
    public.is_admin_or_manager()
    OR auth_user_id = auth.uid()
    OR (auth_user_id IS NULL AND LOWER(email) = LOWER(COALESCE(auth.jwt() ->> 'email', '')))
  );

-- DELETE: Somente Administradores e Gestores podem excluir membros
CREATE POLICY "employees_delete_admin_or_manager"
  ON public.employees FOR DELETE
  TO authenticated
  USING (public.is_admin_or_manager());

-- ==============================================================================
-- 9. POLICIES: PUBLIC.PROJECTS
-- ==============================================================================

-- SELECT para anônimos: Estritamente restrito às configurações públicas de login (logo / arte)
CREATE POLICY "projects_select_anon_system_settings"
  ON public.projects FOR SELECT
  TO anon
  USING (id = 'system-settings');

-- SELECT para autenticados: Todos os membros da agência podem visualizar projetos
CREATE POLICY "projects_select_authenticated"
  ON public.projects FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: Somente Administradores e Gestores podem criar projetos/clientes
CREATE POLICY "projects_insert_admin_or_manager"
  ON public.projects FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_or_manager());

-- UPDATE: Somente Administradores e Gestores podem atualizar projetos
-- (Bloqueia alterações em system-settings por colaboradores comuns)
CREATE POLICY "projects_update_admin_or_manager"
  ON public.projects FOR UPDATE
  TO authenticated
  USING (public.is_admin_or_manager())
  WITH CHECK (public.is_admin_or_manager());

-- DELETE: Somente Administradores e Gestores podem remover projetos
CREATE POLICY "projects_delete_admin_or_manager"
  ON public.projects FOR DELETE
  TO authenticated
  USING (public.is_admin_or_manager());

-- ==============================================================================
-- 10. POLICIES: PUBLIC.TASKS
-- ==============================================================================

-- SELECT: Somente usuários autenticados da agência podem ver o fluxo de demandas
CREATE POLICY "tasks_select_authenticated"
  ON public.tasks FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: Usuários autenticados podem criar tarefas
CREATE POLICY "tasks_insert_authenticated"
  ON public.tasks FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- UPDATE:
-- 1. Admin/Gestor pode atualizar qualquer tarefa;
-- 2. O responsável direto (assignee_id) pode atualizar a tarefa;
-- 3. Membros participantes (no array JSONB members) podem atualizar a tarefa.
-- NOTA DE SEGURANÇA: Tarefas desatribuídas NÃO têm UPDATE arbitrário via RLS;
-- Para assumir uma demanda não alocada, colaboradores usam a RPC claim_task().
CREATE POLICY "tasks_update_collaborative"
  ON public.tasks FOR UPDATE
  TO authenticated
  USING (
    public.is_admin_or_manager()
    OR assignee_id = public.get_current_employee_id()
    OR members @> jsonb_build_array(jsonb_build_object('id', public.get_current_employee_id()))
  )
  WITH CHECK (
    public.is_admin_or_manager()
    OR assignee_id = public.get_current_employee_id()
    OR members @> jsonb_build_array(jsonb_build_object('id', public.get_current_employee_id()))
  );

-- DELETE: Somente Administradores e Gestores podem excluir tarefas do sistema
CREATE POLICY "tasks_delete_admin_or_manager"
  ON public.tasks FOR DELETE
  TO authenticated
  USING (public.is_admin_or_manager());
