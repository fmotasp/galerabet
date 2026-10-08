const fs = require('fs');
let content = fs.readFileSync('src/context/ProjectsContext.tsx', 'utf8');

content = content.replace(
  "const { error: fallbackErr } = await supabase.from('projects').upsert(payload);",
  "const { error: fallbackErr } = await supabase.from('projects').upsert(payload);\n        if (fallbackErr) console.error('[CRITICAL] fallbackErr:', fallbackErr);"
);

fs.writeFileSync('src/context/ProjectsContext.tsx', content);
