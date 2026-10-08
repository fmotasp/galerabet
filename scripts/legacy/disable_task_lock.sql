-- 1. Remove o Gatilho (Trigger) restrito que bloqueia as atualizações de usuários que não são donos do card
DROP TRIGGER IF EXISTS trg_prevent_task_unauthorized_takeover ON public.tasks;
DROP FUNCTION IF EXISTS public.prevent_task_unauthorized_takeover();

-- 2. Remove a Política de Segurança (RLS) antiga que limitava a edição
DROP POLICY IF EXISTS "tasks_update_collaborative" ON public.tasks;

-- 3. Cria uma nova Política de Segurança (RLS) permitindo que qualquer colaborador autenticado possa mover e atualizar os cards livremente
CREATE POLICY "tasks_update_collaborative"
  ON public.tasks FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
