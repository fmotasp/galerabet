-- Create accesses table
CREATE TABLE IF NOT EXISTS accesses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    site_url TEXT,
    category TEXT,
    login TEXT NOT NULL,
    password TEXT NOT NULL,
    cover_image_url TEXT,
    cover_file_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilita RLS
ALTER TABLE accesses ENABLE ROW LEVEL SECURITY;

-- Permite que usuários logados leiam, criem, atualizem e deletem acessos
CREATE POLICY "Enable all actions for authenticated users" 
ON accesses FOR ALL USING (auth.role() = 'authenticated');

-- Atualiza a trigger de updated_at
CREATE OR REPLACE FUNCTION update_accesses_modtime()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_accesses_updated_at
BEFORE UPDATE ON accesses
FOR EACH ROW EXECUTE PROCEDURE update_accesses_modtime();
