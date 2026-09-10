import fs from 'fs';
const path = './src/components/auth/LoginView.tsx';
let content = fs.readFileSync(path, 'utf8');

const oldLoginLogic = `      // Se o Supabase Auth falhou (ex: usuário criado diretamente na tabela employees ou auth pendente)
      if (authError || !authUser) {
        console.warn('[Supabase Auth] Falha no login padrão:', authError?.message);

        // Busca pelo colaborador no banco de dados e no cache local para conferir credenciais
        let dbEmp: any = null;
        try {
          const { data: fetchedEmp } = await supabase
            .from('employees')
            .select('*')
            .ilike('email', cleanEmail)
            .maybeSingle();
          if (fetchedEmp) dbEmp = fetchedEmp;
        } catch (e) {
          console.warn('[Login Fallback] Falha ao consultar tabela employees via supabase:', e);
        }

        // Se não encontrou no Supabase diretamente, busca na lista de employees em memória/cache
        if (!dbEmp && employees && employees.length > 0) {
          const found = employees.find(
            (e) =>
              (e.email && e.email.trim().toLowerCase() === cleanEmail) ||
              (e.username && e.username.trim().toLowerCase() === cleanEmail)
          );
          if (found) dbEmp = found;
        }

        // Fallback adicional do localStorage
        if (!dbEmp) {
          try {
            const saved = localStorage.getItem('spine_employees_v1');
            if (saved) {
              const list = JSON.parse(saved);
              if (Array.isArray(list)) {
                const found = list.find(
                  (e: any) =>
                    (e.email && e.email.trim().toLowerCase() === cleanEmail) ||
                    (e.username && e.username.trim().toLowerCase() === cleanEmail)
                );
                if (found) dbEmp = found;
              }
            }
          } catch {}
        }

        const dbPass = (dbEmp?.password || '').trim();
        const isMasterAdmin = cleanEmail === 'admin@empresa.com' && (cleanPass === 'admin123' || cleanPass === dbPass);

        if (dbEmp && (dbPass === cleanPass || isMasterAdmin)) {
          // Credenciais válidas no banco de dados!
          profile = dbEmp;

          // Tenta auto-provisionar / sincronizar com Supabase Auth em segundo plano se possível
          try {
            const { data: signUpData } = await supabase.auth.signUp({
              email: cleanEmail,
              password: cleanPass,
              options: {
                data: {
                  name: dbEmp.name,
                  role: dbEmp.role,
                  role_type: dbEmp.role_type || dbEmp.roleType || (dbEmp.role?.toLowerCase().includes('admin') ? 'admin' : 'employee'),
                  needs_password_change: dbEmp.needs_password_change ?? dbEmp.needsPasswordChange ?? false,
                },
              },
            });

            if (signUpData?.user) {
              authUser = signUpData.user;
              // Vincula auth_user_id se ainda não estiver preenchido
              if (!dbEmp.auth_user_id) {
                await supabase
                  .from('employees')
                  .update({ auth_user_id: signUpData.user.id })
                  .eq('id', dbEmp.id);
              }
            }
          } catch (syncErr) {
            console.warn('[Auth Self-Healing] Não foi possível auto-cadastrar no Auth agora:', syncErr);
          }
        } else if (isMasterAdmin) {
          // Master Admin fallback
          profile = {
            id: 'admin-master',
            name: 'Administrador Geral',
            email: 'admin@empresa.com',
            role: 'Administrador',
            role_type: 'admin',
          };
        } else {
          setErrorMsg('E-mail ou senha incorretos. Verifique suas credenciais.');
          setLoading(false);
          return;
        }
      }

      // 3. Busca o perfil do colaborador associado ao auth_user_id ou email se ainda não tiver profile
      if (!profile && authUser) {
        const { data: byAuthId } = await supabase
          .from('employees')
          .select('*')
          .eq('auth_user_id', authUser.id)
          .maybeSingle();

        if (byAuthId) {
          profile = byAuthId;
        } else if (authUser.email) {
          // Fallback por email: vincula automaticamente auth_user_id no primeiro login
          const { data: byEmail } = await supabase
            .from('employees')
            .select('*')
            .ilike('email', authUser.email.trim())
            .maybeSingle();

          if (byEmail) {
            profile = byEmail;
            if (!byEmail.auth_user_id) {
              await supabase
                .from('employees')
                .update({ auth_user_id: authUser.id })
                .eq('id', byEmail.id);
            }
          }
        }
      }`;

const newLoginLogic = `      // Se o Supabase Auth falhou (ex: usuário criado diretamente na tabela employees ou auth pendente)
      if (authError || !authUser) {
        console.warn('[Supabase Auth] Falha no login padrão:', authError?.message);
        let signUpSucceeded = false;

        // Auto-provisionamento: tenta criar o usuário no Supabase Auth com a senha digitada.
        // Se já existir no Auth, vai falhar (isso resolve quando a senha está realmente errada).
        // Se não existir, ele cria a conta, loga automaticamente (se confirm não for obrigatório)
        // e assim passa a ter sessão para poder ler a tabela 'employees' com RLS.
        if (authError?.message?.includes('Invalid login') || authError?.message?.includes('credentials')) {
          try {
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
              email: cleanEmail,
              password: cleanPass,
            });
            if (signUpData?.user && !signUpError) {
              authUser = signUpData.user;
              signUpSucceeded = true;
              console.log('[Auth Self-Healing] Novo usuário auto-provisionado no Supabase Auth!');
            }
          } catch (e) {
            console.warn('[Auth Self-Healing] Falha ao tentar auto-provisionamento:', e);
          }
        }
      }

      // 3. Busca o perfil do colaborador associado ao auth_user_id ou email
      if (!profile && authUser) {
        const { data: byAuthId } = await supabase
          .from('employees')
          .select('*')
          .eq('auth_user_id', authUser.id)
          .maybeSingle();

        if (byAuthId) {
          profile = byAuthId;
        } else if (authUser.email) {
          // Fallback por email: vincula automaticamente auth_user_id no primeiro login
          const { data: byEmail } = await supabase
            .from('employees')
            .select('*')
            .ilike('email', authUser.email.trim())
            .maybeSingle();

          if (byEmail) {
            profile = byEmail;
            if (!byEmail.auth_user_id) {
              await supabase
                .from('employees')
                .update({ auth_user_id: authUser.id })
                .eq('id', byEmail.id);
            }
          }
        }
      }

      // Se ainda não tiver profile, tenta o fallback master admin (bypass banco)
      if (!profile) {
        const isMasterAdmin = cleanEmail === 'admin@empresa.com' && cleanPass === 'admin123';
        if (isMasterAdmin) {
          profile = {
            id: 'admin-master',
            name: 'Administrador Geral',
            email: 'admin@empresa.com',
            role: 'Administrador',
            role_type: 'admin',
          };
        } else {
          // Desloga se o auto-provisionamento criou usuário no Auth mas não existe na tabela employees
          await supabase.auth.signOut();
          setErrorMsg('E-mail ou senha incorretos. Verifique suas credenciais.');
          setLoading(false);
          return;
        }
      }`;

content = content.replace(oldLoginLogic, newLoginLogic);
fs.writeFileSync(path, content, 'utf8');
