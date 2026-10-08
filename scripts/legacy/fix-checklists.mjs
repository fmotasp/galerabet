import fs from 'fs';

let content = fs.readFileSync('src/components/modals/task/hooks/useTaskModalForm.ts', 'utf8');

// Ensure import
if (!content.includes('decodeTaskDescriptionWithChecklist')) {
  content = content.replace(
    "import { supabase } from '../../../../lib/supabase';",
    "import { supabase } from '../../../../lib/supabase';\nimport { decodeTaskDescriptionWithChecklist } from '../../../../lib/taskUtils';"
  );
}

// Replace the parsing logic
content = content.replace(
  "const desc = data.description || '';\n                const atts",
  "const rawDesc = data.description || '';\n                const { cleanDescription: desc, checklists: decodedChecks } = decodeTaskDescriptionWithChecklist(rawDesc);\n                const atts"
);

content = content.replace(
  "const checks = typeof data.checklists === 'string' ? JSON.parse(data.checklists) : (data.checklists || []);",
  "let checks = typeof data.checklists === 'string' ? JSON.parse(data.checklists) : (data.checklists || []);\n                if (!checks || checks.length === 0) checks = decodedChecks;"
);

fs.writeFileSync('src/components/modals/task/hooks/useTaskModalForm.ts', content);
