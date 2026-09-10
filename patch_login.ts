import fs from 'fs';
const path = './src/components/auth/LoginView.tsx';
let content = fs.readFileSync(path, 'utf8');

const target = `      // 3. Busca o perfil do colaborador associado ao auth_user_id ou email
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

const replacement = `      // 3. Busca o perfil do colaborador associado ao auth_user_id ou email
      if (!profile && authUser) {
        console.log('[Login Debug] authUser exists, ID:', authUser.id, 'Email:', authUser.email);
        const { data: byAuthId, error: authIdErr } = await supabase
          .from('employees')
          .select('*')
          .eq('auth_user_id', authUser.id)
          .maybeSingle();

        if (authIdErr) console.warn('[Login Debug] Error checking by auth_user_id:', authIdErr.message);

        if (byAuthId) {
          profile = byAuthId;
          console.log('[Login Debug] Profile found by auth_user_id:', byAuthId.id);
        } else if (authUser.email) {
          console.log('[Login Debug] Not found by auth_user_id. Trying by email:', authUser.email.trim());
          // Fallback por email: vincula automaticamente auth_user_id no primeiro login
          const { data: byEmail, error: emailErr } = await supabase
            .from('employees')
            .select('*')
            .ilike('email', authUser.email.trim())
            .maybeSingle();

          if (emailErr) console.warn('[Login Debug] Error checking by email:', emailErr.message);

          if (byEmail) {
            profile = byEmail;
            console.log('[Login Debug] Profile found by email:', byEmail.id);
            if (!byEmail.auth_user_id) {
              await supabase
                .from('employees')
                .update({ auth_user_id: authUser.id })
                .eq('id', byEmail.id);
            }
          } else {
             console.warn('[Login Debug] No profile found by email either. RLS issue? Or email not in DB?');
             // Tentativa desesperada sem filtro de email (se RLS permitir)
             const { data: allEmps } = await supabase.from('employees').select('id, email, username');
             console.log('[Login Debug] All employees fetched to verify:', allEmps);
          }
        }
      }`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(path, content, 'utf8');
  console.log("Patched successfully");
} else {
  console.log("Could not find target string");
}
