import fs from 'fs';

let content = fs.readFileSync('src/components/modals/task/hooks/useTaskModalForm.ts', 'utf8');

content = content.replace(
  /await updateTask\(editingTask\.id, \{\n\s*checklists: nextList,\n\s*checklistsCount: nextList\.length,\n\s*\}\);/g,
  "await updateTask(editingTask.id, {\n        description: formData.description,\n        checklists: nextList,\n        checklistsCount: nextList.length,\n      });"
);

fs.writeFileSync('src/components/modals/task/hooks/useTaskModalForm.ts', content);
