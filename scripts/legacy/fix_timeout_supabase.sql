-- 1. Força a criação do índice (se a tabela for grande, isso é obrigatório para não dar timeout no order by)
CREATE INDEX IF NOT EXISTS idx_tasks_last_moved_at ON public.tasks(last_moved_at);

-- 2. Cancela qualquer query travada que possa estar segurando a tabela "tasks" (Table Lock)
SELECT pg_cancel_backend(pid)
FROM pg_stat_activity
WHERE state = 'active'
  AND pid <> pg_backend_pid()
  AND query ILIKE '%tasks%';

-- 3. Caso o item 2 não funcione, isso mata a conexão de queries travadas forçadamente
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'active'
  AND pid <> pg_backend_pid()
  AND query ILIKE '%tasks%';
