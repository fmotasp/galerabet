-- ==============================================================================
-- MIGRATION: SUPABASE AUTH INTEGRATION & SECURITY HARDENING
-- Data: 2026-09-08
-- Objetivo: Migrar autenticação para Supabase Auth oficial, vincular auth.users
--           à tabela public.employees via auth_user_id e descontinuar senhas em texto puro.
-- ==============================================================================

-- 1. Certificar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Adicionar coluna auth_user_id na tabela public.employees
-- Permite vincular o registro do funcionário diretamente ao usuário autenticado no auth.users
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 3. Criar índice para acelerar a busca de perfil durante a inicialização de sessão
CREATE INDEX IF NOT EXISTS idx_employees_auth_user_id ON public.employees(auth_user_id);

-- 4. Garantir que a coluna needs_password_change exista com padrão false para contas migradas
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS needs_password_change BOOLEAN DEFAULT FALSE;

-- 5. Vincular automaticamente colaboradores existentes que já possuam correspondência de email em auth.users
UPDATE public.employees e
SET auth_user_id = u.id
FROM auth.users u
WHERE LOWER(TRIM(e.email)) = LOWER(TRIM(u.email))
  AND (e.auth_user_id IS NULL OR e.auth_user_id <> u.id);

-- 6. Trigger para auto-vinculação: quando um novo usuário for criado em auth.users,
-- vincula automaticamente ao perfil correspondente em public.employees se houver email idêntico.
CREATE OR REPLACE FUNCTION public.handle_new_auth_user_link()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.employees
  SET auth_user_id = NEW.id
  WHERE LOWER(TRIM(email)) = LOWER(TRIM(NEW.email))
    AND auth_user_id IS NULL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_link ON auth.users;
CREATE TRIGGER on_auth_user_created_link
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user_link();

-- 7. Documentação de segurança sobre public.employees.password:
-- ==============================================================================
-- [AVISO DE DEPRECATION / SEGURANÇA]
-- A coluna public.employees.password NÃO deve mais ser utilizada para armazenar
-- ou validar senhas. Toda autenticação agora é processada pelo Supabase Auth (auth.users)
-- que utiliza hashing seguro (bcrypt/argon2).
--
-- NÃO DROPAMOS a coluna imediatamente nesta migration para garantir total retrocompatibilidade
-- e evitar qualquer bloqueio operacional imediato.
--
-- Quando todos os colaboradores estiverem com suas contas migradas no Supabase Auth,
-- execute a seguinte instrução para limpar as senhas em texto puro:
--
-- UPDATE public.employees SET password = NULL;
-- ALTER TABLE public.employees DROP COLUMN IF EXISTS password;
-- ==============================================================================

-- 8. Instrução de criação/atualização do Administrador Geral no Supabase Auth:
-- Para registrar ou atualizar o Administrador com senha segura no Supabase Auth via SQL (ou Dashboard Supabase):
-- 
-- DO $$
-- DECLARE
--   v_admin_id UUID := gen_random_uuid();
--   v_admin_email TEXT := 'admin@empresa.com';
--   v_encrypted_pass TEXT := crypt('NovaSenhaSeguraAdmin2026!', gen_salt('bf'));
-- BEGIN
--   -- Cria no auth.users se ainda não existir
--   IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = v_admin_email) THEN
--     INSERT INTO auth.users (
--       id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
--       raw_app_meta_data, raw_user_meta_data, created_at, updated_at
--     ) VALUES (
--       v_admin_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
--       v_admin_email, v_encrypted_pass, NOW(),
--       '{"provider":"email","providers":["email"]}',
--       '{"name":"Administrador Geral","role":"admin"}',
--       NOW(), NOW()
--     );
--   END IF;
--   
--   -- Vincula ou cria na tabela public.employees
--   INSERT INTO public.employees (
--     id, name, email, role, role_type, auth_user_id, department, initials, status
--   )
--   SELECT 
--     'usr-admin', 'Administrador Geral', v_admin_email, 'Administrador', 'admin', 
--     id, 'Management', 'AD', 'online'
--   FROM auth.users WHERE email = v_admin_email
--   ON CONFLICT (id) DO UPDATE SET
--     auth_user_id = EXCLUDED.auth_user_id,
--     role_type = 'admin',
--     email = EXCLUDED.email;
-- END $$;
