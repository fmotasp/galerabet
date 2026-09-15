-- 1. Cria o índice para ordenar as tarefas instantaneamente
CREATE INDEX IF NOT EXISTS idx_tasks_last_moved_at ON public.tasks(last_moved_at);

-- 2. Limpa o "lixo" acumulado (Dead Tuples) que faz a tabela ficar lenta e pesada no Supabase
VACUUM FULL public.tasks;
VACUUM ANALYZE public.tasks;

-- 3. Atualiza as estatísticas do banco
ANALYZE public.tasks;
