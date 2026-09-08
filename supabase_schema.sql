-- ==========================================================
-- SCHEMA SUPABASE: SINCRONIZAÇÃO EM TEMPO REAL TRELLO + SPINE
-- ==========================================================

-- 1. Habilitar extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabela de Tarefas
CREATE TABLE IF NOT EXISTS public.tasks (
    id TEXT PRIMARY KEY,                       -- id Spine ou trello-<id>
    trello_id TEXT UNIQUE,                     -- id bruto do Trello (24 chars)
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

-- 3. Habilitar Row Level Security (RLS) permissivo para anon/authenticated
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on tasks"
    ON public.tasks FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Allow public insert on tasks"
    ON public.tasks FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Allow public update on tasks"
    ON public.tasks FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow public delete on tasks"
    ON public.tasks FOR DELETE
    TO anon, authenticated
    USING (true);

-- 4. Tabela de Funcionários / Membros
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
    needs_password_change BOOLEAN DEFAULT true,
    role_type TEXT DEFAULT 'employee',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public all on employees"
    ON public.employees FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- 5. Tabela de Projetos / Clientes
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

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public all on projects"
    ON public.projects FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- 6. Habilitar Realtime WebSockets
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.employees;
ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;

