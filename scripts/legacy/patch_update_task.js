import fs from 'fs';
import path from 'path';

const file = path.resolve('src/context/TasksContext.tsx');
let content = fs.readFileSync(file, 'utf8');

// Add rollback to updateTask
content = content.replace(
  /const \{ error: retryErr \} = await supabase\.from\('tasks'\)\.update\(fallbackPayload\)\.eq\('id', id\);\s*if \(retryErr && updates\.status !== undefined\) \{\s*await supabase\.from\('tasks'\)\.update\(\{ status: updates\.status, last_moved_at: now \}\)\.eq\('id', id\);\s*\}/,
  `const { error: retryErr } = await supabase.from('tasks').update(fallbackPayload).eq('id', id);
        if (retryErr) {
          console.error('[Supabase] Fallback update failed:', retryErr.message);
          // Try absolute bare minimum if status was provided
          if (updates.status !== undefined) {
             const { error: thirdErr } = await supabase.from('tasks').update({ status: updates.status, last_moved_at: now }).eq('id', id);
             if (thirdErr) {
                setTasks((prev) => prev.map((t) => (t.id === id ? targetTask : t)));
                addToast('Erro ao Salvar ⚠️', 'Falha ao salvar no servidor.', 'error');
             }
          } else {
             setTasks((prev) => prev.map((t) => (t.id === id ? targetTask : t)));
             addToast('Erro ao Salvar ⚠️', 'Falha ao salvar no servidor.', 'error');
          }
        }`
);

fs.writeFileSync(file, content);
