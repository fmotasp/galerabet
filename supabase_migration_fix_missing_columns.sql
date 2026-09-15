-- ==============================================================================
-- MIGRATION: ADD MISSING COLUMNS TO TASKS
-- ==============================================================================
-- Adiciona colunas que estão sendo solicitadas pelo front-end no arquivo TasksContext.tsx
-- e que estão causando o Erro 500 no Supabase.

ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS comments JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS activity_log JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS checklists JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS drive_folder_id TEXT,
ADD COLUMN IF NOT EXISTS drive_folder_url TEXT;
