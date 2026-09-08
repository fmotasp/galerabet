-- ==============================================================================
-- SCRIPT SQL DE PROVISIONAMENTO DIRETO (FALLBACK SEGURO VIA SQL EDITOR)
-- Data: 2026-09-08
-- Objetivo: Criar usuários em auth.users para cada colaborador existente em 
--           public.employees que estiver com auth_user_id IS NULL, atribuindo
--           uma senha temporária individual segura e marcando needs_password_change = true.
--
-- CARACTERÍSTICAS DE SEGURANÇA:
-- 1. Idempotente: se o usuário já existir no auth.users ou o employee já tiver
--    auth_user_id preenchido, ele NÃO é recriado nem duplicado.
-- 2. Proteção contra ambiguidades: se houver e-mails duplicados na tabela employees,
--    o registro é ignorado para auditoria manual.
-- 3. Hashing nativo do PostgreSQL (crypt com blowfish gen_salt('bf', 10)), idêntico
--    ao formato padrão do Supabase Auth.
-- 4. NÃO grava senha em public.employees.password.
-- ==============================================================================

DO $$
DECLARE
  r RECORD;
  v_new_auth_id UUID;
  v_temp_password TEXT;
  v_encrypted_pass TEXT;
  v_created_count INT := 0;
  v_linked_count INT := 0;
  v_skipped_count INT := 0;
BEGIN
  -- 1. Certificar extensões necessárias
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
  CREATE EXTENSION IF NOT EXISTS "pgcrypto";

  RAISE NOTICE '>>> INICIANDO PROVISIONAMENTO DE CONTAS AUTH.USERS...';

  -- 2. Iterar sobre todos os colaboradores que ainda não possuem auth_user_id
  FOR r IN (
    SELECT e.id AS emp_id, e.name AS emp_name, LOWER(TRIM(e.email)) AS clean_email, e.role AS emp_role
    FROM public.employees e
    WHERE e.auth_user_id IS NULL
      AND e.email IS NOT NULL
      AND TRIM(e.email) <> ''
      AND e.email LIKE '%@%'
      -- Excluir e-mails duplicados em public.employees por precaução de identidade
      AND (
        SELECT COUNT(*) 
        FROM public.employees e2 
        WHERE LOWER(TRIM(e2.email)) = LOWER(TRIM(e.email))
      ) = 1
    ORDER BY e.name ASC
  ) LOOP

    -- 3. Verificar se já existe uma conta em auth.users com esse e-mail
    SELECT id INTO v_new_auth_id
    FROM auth.users
    WHERE LOWER(TRIM(email)) = r.clean_email
    LIMIT 1;

    IF v_new_auth_id IS NOT NULL THEN
      -- Já existe em auth.users: vincula o auth_user_id existente
      UPDATE public.employees
      SET 
        auth_user_id = v_new_auth_id,
        needs_password_change = TRUE
      WHERE id = r.emp_id;

      v_linked_count := v_linked_count + 1;
      RAISE NOTICE 'VINCULADO: % (%) -> auth.users existente ID %', r.emp_name, r.clean_email, v_new_auth_id;

    ELSE
      -- Não existe em auth.users: gera novo UUID e senha temporária criptografada
      v_new_auth_id := gen_random_uuid();
      
      -- Gera senha temporária única e individual para o primeiro acesso
      -- Formato: Temp! + 6 bytes hexadecimais aleatórios (ex: Temp!a3f89c1b)
      v_temp_password := 'Temp!' || encode(gen_random_bytes(4), 'hex') || '!2026';
      v_encrypted_pass := crypt(v_temp_password, gen_salt('bf', 10));

      -- Insere no auth.users oficial do Supabase
      INSERT INTO auth.users (
        id,
        instance_id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        is_super_admin
      ) VALUES (
        v_new_auth_id,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        r.clean_email,
        v_encrypted_pass,
        NOW(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object(
          'name', r.emp_name,
          'role', r.emp_role,
          'employee_id', r.emp_id,
          'needs_password_change', true
        ),
        NOW(),
        NOW(),
        FALSE
      );

      -- Vincula o auth_user_id no registro de public.employees
      UPDATE public.employees
      SET 
        auth_user_id = v_new_auth_id,
        needs_password_change = TRUE
      WHERE id = r.emp_id;

      v_created_count := v_created_count + 1;

      -- Imprime a senha temporária gerada no console/notices do SQL Editor
      -- para que o administrador possa fornecê-la individualmente ao colaborador
      RAISE NOTICE 'CRIADO E VINCULADO: % (%) | Senha Temporária: %', r.emp_name, r.clean_email, v_temp_password;

    END IF;

  END LOOP;

  RAISE NOTICE '==================================================';
  RAISE NOTICE 'RESUMO DO PROVISIONAMENTO:';
  RAISE NOTICE 'Novos usuários criados em auth.users: %', v_created_count;
  RAISE NOTICE 'Usuários existentes vinculados: %', v_linked_count;
  RAISE NOTICE '==================================================';

END $$;
