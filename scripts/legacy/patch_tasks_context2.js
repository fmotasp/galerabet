import fs from 'fs';
import path from 'path';

const file = path.resolve('src/context/TasksContext.tsx');
let content = fs.readFileSync(file, 'utf8');

// Update fallback to include last_moved_at
content = content.replace(
  /const \{ error: fallbackErr \} = await supabase\.from\('tasks'\)\.update\(\{ status: newStatus \}\)\.eq\('id', id\);/,
  `const { error: fallbackErr } = await supabase.from('tasks').update({ status: newStatus, last_moved_at: now }).eq('id', id);`
);

fs.writeFileSync(file, content);
