-- ==========================================================
-- MIGRATION: Sistema de Notificações em Tempo Real
-- ==========================================================

-- 1. Tabela de notificações
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Destinatário (employee_id do usuário que deve receber)
    recipient_id TEXT NOT NULL,

    -- Remetente
    actor_name TEXT NOT NULL,
    actor_initials TEXT DEFAULT '',
    actor_avatar_url TEXT,

    -- Tipo de evento
    type TEXT NOT NULL CHECK (type IN (
        'task_status_changed',
        'task_comment_added',
        'task_member_added',
        'task_overdue',
        'task_created',
        'task_flagged'
    )),

    -- Payload do evento
    task_id TEXT,
    task_title TEXT,
    detail TEXT,        -- ex: "para Em Revisão", "comentou: Ficou ótimo!"

    -- Estado
    is_read BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Índices para queries comuns
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id
    ON public.notifications (recipient_id);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_unread
    ON public.notifications (recipient_id, is_read)
    WHERE is_read = FALSE;

CREATE INDEX IF NOT EXISTS idx_notifications_created_at
    ON public.notifications (created_at DESC);

-- 3. RLS permissivo (mesma política do restante do sistema)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on notifications"
    ON public.notifications FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Allow public insert on notifications"
    ON public.notifications FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Allow public update on notifications"
    ON public.notifications FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow public delete on notifications"
    ON public.notifications FOR DELETE
    TO anon, authenticated
    USING (true);

-- 4. Limpar notificações antigas (mais de 30 dias) — rodar como cron ou manualmente
-- DELETE FROM public.notifications WHERE created_at < NOW() - INTERVAL '30 days';
