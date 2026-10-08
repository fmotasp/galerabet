import fs from 'fs';
import path from 'path';

const file = path.resolve('src/context/TasksContext.tsx');
let content = fs.readFileSync(file, 'utf8');

// Find moveTaskStatus and add rollback logic
content = content.replace(
  /const { error: sbErr } = await supabase\s*\.from\('tasks'\)\s*\.update\(updatePayload\)\s*\.eq\('id', id\);([\s\S]*?)if \(fallbackErr\) \{[\s\S]*?console\.error\('\[Supabase\] Fallback de status também falhou:', fallbackErr\.message\);\s*\}\s*\}/,
  `const { error: sbErr } = await supabase.from('tasks').update(updatePayload).eq('id', id);
      
      if (sbErr) {
        console.error('[Supabase] Falha ao atualizar status:', sbErr.message);
        const { error: fallbackErr } = await supabase.from('tasks').update({ status: newStatus }).eq('id', id);
        
        if (fallbackErr) {
          console.error('[Supabase] Fallback de status falhou:', fallbackErr.message);
          
          // ROLLBACK
          setTasks((prev) => prev.map((t) => (t.id === id ? targetTask : t)));
          addToast('Erro ao Mover ⚠️', 'Falha ao salvar no servidor. A tarefa voltou ao status anterior.', 'error');
          return;
        }
      }`
);

fs.writeFileSync(file, content);
