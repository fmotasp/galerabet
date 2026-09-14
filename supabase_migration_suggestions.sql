-- Remove a tabela antiga e recria do jeito certo
DROP TABLE IF NOT EXISTS system_suggestions;

CREATE TABLE system_suggestions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_by text, -- Alterado para TEXT para aceitar o ID interno do usuário (Employee ID)
  created_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone
);

-- Ativa o RLS (Row Level Security)
ALTER TABLE system_suggestions ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso
CREATE POLICY "Permitir leitura de sugestões para usuários autenticados" ON system_suggestions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permitir criação de sugestões para usuários autenticados" ON system_suggestions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Permitir atualização de sugestões para usuários autenticados" ON system_suggestions FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Permitir exclusão de sugestões para usuários autenticados" ON system_suggestions FOR DELETE TO authenticated USING (true);
