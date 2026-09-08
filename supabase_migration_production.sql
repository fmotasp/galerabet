-- ==============================================================================
-- MIGRATION CONSOLIDADA DE PRODUÇÃO: AUTENTICAÇÃO, INTEGRIDADE E RLS (V4 AUDITADA)
-- Data: 2026-09-08
-- Prioridade: SEGURANÇA > INTEGRIDADE DOS DADOS > COMPATIBILIDADE > CONVENIÊNCIA
--
-- AUDITORIAS DE SEGURANÇA IMPLEMENTADAS:
-- 1. Remoção DINÂMICA e EXPLÍCITA de todas as policies legadas em employees, projects e tasks.
--    Elimina especificamente policies do tipo "Permitir acesso completo..." (roles={public}, ALL, USING true).
-- 2. employees.auth_user_id criado na Seção 1 antes de qualquer índice, função, trigger ou policy.
-- 3. Autorização estritamente ancorada em auth.uid() -> employees.auth_user_id -> role_type.
--    Zero dependência de user_metadata.role e zero e-mails hardcoded.
-- 4. Vinculação automática segura de auth.users com employees (apenas correspondências 1:1 não ambíguas).
-- 5. RPC claim_task() concorrente com SELECT ... FOR UPDATE (anti-race condition).
-- 6. Trigger trg_prevent_task_unauthorized_takeover contra contorno de autorização no UPDATE de tarefas.
-- 7. Trigger trg_prevent_employee_privilege_escalation contra elevação de privilégios.
-- 8. Funções SECURITY DEFINER com SET search_path = public, pg_temp e privilégios mínimos.
-- ==============================================================================

-- ==============================================================================
-- SEÇÃO 1: EXTENSÕES E ESTRUTURA BASE (PRÉ-REQUISITOS DDL)
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1.1 Garantir tabelas base
CREATE TABLE IF NOT EXISTS public.employees (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    password TEXT,
    role TEXT DEFAULT 'Designer',
    department TEXT DEFAULT 'Design',
    initials TEXT,
    status TEXT DEFAULT 'online',
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    current_workload NUMERIC DEFAULT 50,
    username TEXT,
    location TEXT DEFAULT 'Brasil',
    label_id TEXT,
    label_color TEXT,
    needs_password_change BOOLEAN DEFAULT FALSE,
    role_type TEXT DEFAULT 'employee',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT DEFAULT 'General',
    description TEXT,
    logo_url TEXT,
    brand_manual_url TEXT,
    logos_pack_url TEXT,
    typography_url TEXT,
    additional_materials_url TEXT,
    color_palette JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tasks (
    id TEXT PRIMARY KEY,
    trello_id TEXT UNIQUE,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    category TEXT DEFAULT 'Geral',
    status TEXT DEFAULT 'backlog',
    due_date TEXT,
    points NUMERIC DEFAULT 0,
    is_flagged BOOLEAN DEFAULT FALSE,
    project_id TEXT,
    project_name TEXT,
    sprint_id TEXT,
    assignee_id TEXT,
    assignee_name TEXT,
    assignee_initials TEXT,
    members JSONB DEFAULT '[]'::jsonb,
    labels JSONB DEFAULT '[]'::jsonb,
    attachments JSONB DEFAULT '[]'::jsonb,
    reference_images JSONB DEFAULT '[]'::jsonb,
    cover_image_url TEXT,
    cover_attachment_id TEXT,
    last_moved_at BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1.2 Garantir colunas essenciais na public.employees ANTES de índices/funções/policies
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS needs_password_change BOOLEAN DEFAULT FALSE;

ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS role_type TEXT DEFAULT 'employee';

-- ==============================================================================
-- SEÇÃO 2: SANITIZAÇÃO DE SENHAS LEGADAS EM TEXTO PURO
-- ==============================================================================

UPDATE public.employees
SET password = NULL
WHERE password IS NOT NULL;

-- ==============================================================================
-- SEÇÃO 3: VINCULAÇÃO SEGURA AUTH.USERS <-> EMPLOYEES (SEM AMBIGUIDADE)
-- ==============================================================================

DO $$
DECLARE
  v_linked_count INT := 0;
BEGIN
  WITH eligible_links AS (
    SELECT e.id AS emp_id, u.id AS auth_id
    FROM public.employees e
    INNER JOIN auth.users u ON LOWER(TRIM(e.email)) = LOWER(TRIM(u.email))
    WHERE e.auth_user_id IS NULL
      AND (
        SELECT COUNT(*) 
        FROM public.employees e2 
        WHERE LOWER(TRIM(e2.email)) = LOWER(TRIM(e.email))
      ) = 1
      AND (
        SELECT COUNT(*) 
        FROM auth.users u2 
        WHERE LOWER(TRIM(u2.email)) = LOWER(TRIM(u.email))
      ) = 1
  )
  UPDATE public.employees emp
  SET auth_user_id = el.auth_id
  FROM eligible_links el
  WHERE emp.id = el.emp_id;

  GET DIAGNOSTICS v_linked_count = ROW_COUNT;
  RAISE NOTICE 'Vinculação automática executada com sucesso. Registros vinculados com segurança: %', v_linked_count;
END $$;

-- 3.2 Trigger para novos usuários: quando um novo auth.user for criado
CREATE OR REPLACE FUNCTION public.handle_new_auth_user_link()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_match_count INT;
BEGIN
  IF NEW.email IS NULL OR TRIM(NEW.email) = '' THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*) INTO v_match_count
  FROM public.employees
  WHERE LOWER(TRIM(email)) = LOWER(TRIM(NEW.email))
    AND auth_user_id IS NULL;

  -- Só vincula se houver correspondência estritamente única
  IF v_match_count = 1 THEN
    UPDATE public.employees
    SET auth_user_id = NEW.id
    WHERE LOWER(TRIM(email)) = LOWER(TRIM(NEW.email))
      AND auth_user_id IS NULL;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_link ON auth.users;
CREATE TRIGGER on_auth_user_created_link
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user_link();

-- ==============================================================================
-- SEÇÃO 4: ÍNDICES DE PERFORMANCE E SUPORTE A RLS
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_employees_auth_user_id ON public.employees(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_employees_role_type ON public.employees(role_type);
CREATE INDEX IF NOT EXISTS idx_employees_email ON public.employees(email);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON public.tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_members_gin ON public.tasks USING GIN (members);

-- ==============================================================================
-- SEÇÃO 5: FUNÇÕES AUXILIARES DE AUTORIZAÇÃO (SECURITY DEFINER AUDITADAS)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.is_admin_or_manager()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
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

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.employees e
    WHERE e.auth_user_id = auth.uid()
      AND (
        e.role_type = 'admin'
        OR LOWER(COALESCE(e.role, '')) IN ('admin', 'administrador')
      )
  );
$$;

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

REVOKE ALL ON FUNCTION public.is_admin_or_manager() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_current_employee_id() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.is_admin_or_manager() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_employee_id() TO authenticated;

-- ==============================================================================
-- SEÇÃO 6: RPC CONCORRENTE E SEGURA: ASSUMIR DEMANDA (CLAIM_TASK)
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
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Acesso negado: operação requer autenticação.';
  END IF;

  SELECT id, name, initials INTO v_emp_id, v_emp_name, v_emp_initials
  FROM public.employees
  WHERE auth_user_id = auth.uid()
  LIMIT 1;

  IF v_emp_id IS NULL THEN
    RAISE EXCEPTION 'Perfil de colaborador não encontrado para o usuário autenticado.';
  END IF;

  -- Lock com FOR UPDATE para mitigar race conditions em concorrência
  SELECT assignee_id INTO v_existing_assignee
  FROM public.tasks
  WHERE id = p_task_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Demanda não encontrada: ID %', p_task_id;
  END IF;

  IF v_existing_assignee IS NOT NULL 
     AND v_existing_assignee <> '' 
     AND v_existing_assignee <> 'unassigned' 
     AND v_existing_assignee <> v_emp_id THEN
    RAISE EXCEPTION 'Esta demanda já foi assumida por outro responsável.';
  END IF;

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
-- SEÇÃO 7: TRIGGERS DE INTEGRIDADE E PREVENÇÃO DE ELEVAÇÃO DE PRIVILÉGIOS
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.prevent_employee_privilege_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF public.is_admin_or_manager() THEN
    RETURN NEW;
  END IF;

  IF (NEW.role_type IS DISTINCT FROM OLD.role_type) THEN
    RAISE EXCEPTION 'Acesso negado: colaboradores não podem alterar o tipo de privilégio (role_type).';
  END IF;

  IF (NEW.role IS DISTINCT FROM OLD.role) THEN
    RAISE EXCEPTION 'Acesso negado: colaboradores não podem alterar seu cargo (role).';
  END IF;

  IF (NEW.department IS DISTINCT FROM OLD.department) THEN
    RAISE EXCEPTION 'Acesso negado: colaboradores não podem alterar o departamento.';
  END IF;

  IF (OLD.auth_user_id IS NOT NULL AND NEW.auth_user_id IS DISTINCT FROM OLD.auth_user_id) THEN
    RAISE EXCEPTION 'Acesso negado: não é permitido alterar o identificador de autenticação vinculado.';
  END IF;

  IF (OLD.auth_user_id IS NULL AND NEW.auth_user_id IS NOT NULL AND NEW.auth_user_id <> auth.uid()) THEN
    RAISE EXCEPTION 'Acesso negado: auth_user_id só pode ser vinculado ao próprio usuário autenticado.';
  END IF;

  IF (NEW.email IS DISTINCT FROM OLD.email) THEN
    RAISE EXCEPTION 'Acesso negado: o e-mail cadastral só pode ser alterado por administradores.';
  END IF;

  IF (NEW.current_workload IS DISTINCT FROM OLD.current_workload) THEN
    RAISE EXCEPTION 'Acesso negado: a carga de trabalho só pode ser gerenciada por gestores.';
  END IF;

  IF (OLD.needs_password_change IS FALSE AND NEW.needs_password_change IS TRUE) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem exigir troca de senha.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_employee_privilege_escalation ON public.employees;
CREATE TRIGGER trg_prevent_employee_privilege_escalation
  BEFORE UPDATE ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_employee_privilege_escalation();

-- Trigger que impede contorno de autorização no UPDATE de tarefas
CREATE OR REPLACE FUNCTION public.prevent_task_unauthorized_takeover()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_my_emp_id TEXT;
  v_is_old_assignee BOOLEAN;
  v_is_old_member BOOLEAN;
BEGIN
  IF public.is_admin_or_manager() THEN
    RETURN NEW;
  END IF;

  v_my_emp_id := public.get_current_employee_id();
  IF v_my_emp_id IS NULL THEN
    RAISE EXCEPTION 'Acesso negado: usuário não possui perfil de colaborador vinculado.';
  END IF;

  v_is_old_assignee := (OLD.assignee_id = v_my_emp_id);
  v_is_old_member := (OLD.members @> jsonb_build_array(jsonb_build_object('id', v_my_emp_id)));

  IF NOT v_is_old_assignee AND NOT v_is_old_member THEN
    RAISE EXCEPTION 'Acesso negado: você não tem permissão para alterar esta tarefa. Use a função Assumir Demanda (claim_task).';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_task_unauthorized_takeover ON public.tasks;
CREATE TRIGGER trg_prevent_task_unauthorized_takeover
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_task_unauthorized_takeover();

-- ==============================================================================
-- SEÇÃO 8: EXPURGO TOTAL DE POLICIES LEGADAS E HABILITAÇÃO RIGOROSA DE RLS
-- ==============================================================================

-- 8.1 Ativar RLS em todas as tabelas
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- 8.2 DROPS EXPLÍCITOS DAS POLICIES LEGADAS CONHECIDAS
DROP POLICY IF EXISTS "Permitir acesso completo employees" ON public.employees;
DROP POLICY IF EXISTS "Permitir acesso completo projects" ON public.projects;
DROP POLICY IF EXISTS "Permitir acesso completo tasks" ON public.tasks;

DROP POLICY IF EXISTS "Allow public all on employees" ON public.employees;
DROP POLICY IF EXISTS "Allow public all on projects" ON public.projects;
DROP POLICY IF EXISTS "Allow public read on tasks" ON public.tasks;
DROP POLICY IF EXISTS "Allow public insert on tasks" ON public.tasks;
DROP POLICY IF EXISTS "Allow public update on tasks" ON public.tasks;
DROP POLICY IF EXISTS "Allow public delete on tasks" ON public.tasks;

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

-- 8.3 EXPURGO DEFENSIVO DINÂMICO DE QUALQUER POLICY LEGADA REMANESCENTE
-- Remove qualquer policy existente que não faça parte estritamente da nova arquitetura.
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('employees', 'projects', 'tasks')
      AND policyname NOT IN (
        -- Lista de permissões estritamente autorizadas na nova arquitetura
        'employees_select_authenticated',
        'employees_insert_admin_or_manager',
        'employees_update_admin_or_self',
        'employees_delete_admin_or_manager',
        'projects_select_anon_system_settings',
        'projects_select_authenticated',
        'projects_insert_admin_or_manager',
        'projects_update_admin_or_manager',
        'projects_delete_admin_or_manager',
        'tasks_select_authenticated',
        'tasks_insert_authenticated',
        'tasks_update_collaborative',
        'tasks_delete_admin_or_manager'
      )
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I;', r.policyname, r.schemaname, r.tablename);
    RAISE NOTICE 'Policy legada expurgada: %.% -> %', r.schemaname, r.tablename, r.policyname;
  END LOOP;
END $$;

-- ==============================================================================
-- SEÇÃO 9: CRIAÇÃO EXCLUSIVA DAS POLICIES AUTORIZADAS
-- ==============================================================================

-- 9.1 POLICIES: PUBLIC.EMPLOYEES
-- SELECT: Usuários autenticados podem consultar a lista de membros
CREATE POLICY "employees_select_authenticated"
  ON public.employees FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: Somente Administradores e Gestores
CREATE POLICY "employees_insert_admin_or_manager"
  ON public.employees FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_or_manager());

-- UPDATE: Admin/Gestor ou o próprio usuário autenticado editando seu registro
CREATE POLICY "employees_update_admin_or_self"
  ON public.employees FOR UPDATE
  TO authenticated
  USING (
    public.is_admin_or_manager()
    OR auth_user_id = auth.uid()
  )
  WITH CHECK (
    public.is_admin_or_manager()
    OR auth_user_id = auth.uid()
  );

-- DELETE: Somente Administradores e Gestores
CREATE POLICY "employees_delete_admin_or_manager"
  ON public.employees FOR DELETE
  TO authenticated
  USING (public.is_admin_or_manager());

-- 9.2 POLICIES: PUBLIC.PROJECTS
-- SELECT anônimo: Estritamente restrito a system-settings (logo/wallpaper de login)
CREATE POLICY "projects_select_anon_system_settings"
  ON public.projects FOR SELECT
  TO anon
  USING (id = 'system-settings');

-- SELECT autenticado: Colaboradores da agência podem ver os projetos/clientes
CREATE POLICY "projects_select_authenticated"
  ON public.projects FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: Somente Administradores e Gestores
CREATE POLICY "projects_insert_admin_or_manager"
  ON public.projects FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_or_manager());

-- UPDATE: Somente Administradores e Gestores (protege system-settings e clientes)
CREATE POLICY "projects_update_admin_or_manager"
  ON public.projects FOR UPDATE
  TO authenticated
  USING (public.is_admin_or_manager())
  WITH CHECK (public.is_admin_or_manager());

-- DELETE: Somente Administradores e Gestores
CREATE POLICY "projects_delete_admin_or_manager"
  ON public.projects FOR DELETE
  TO authenticated
  USING (public.is_admin_or_manager());

-- 9.3 POLICIES: PUBLIC.TASKS
-- SELECT: Somente usuários autenticados
CREATE POLICY "tasks_select_authenticated"
  ON public.tasks FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: Usuários autenticados podem criar tarefas (somente INSERT, sem UPDATE/DELETE)
CREATE POLICY "tasks_insert_authenticated"
  ON public.tasks FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- UPDATE: Admin/Gestor, responsável atual (assignee_id) ou membro participante (members JSONB).
-- O trigger trg_prevent_task_unauthorized_takeover complementa garantindo que
-- usuários não-membros não possam forjar auto-atribuição no payload.
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

-- DELETE: Somente Administradores e Gestores
CREATE POLICY "tasks_delete_admin_or_manager"
  ON public.tasks FOR DELETE
  TO authenticated
  USING (public.is_admin_or_manager());

-- 9.4 Realtime Publications (idempotente)
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.employees;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;
