-- 1. Excluir os falsos funcionários da tabela public.employees que começam com 'i191' no nome ou e-mail
DELETE FROM public.employees 
WHERE email LIKE 'i191%' OR name LIKE 'i191%';

-- 2. Excluir contas falsas no sistema de autenticação (auth.users)
DELETE FROM auth.users 
WHERE email LIKE 'i191%';
