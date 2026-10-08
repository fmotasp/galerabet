import fs from 'fs';
import path from 'path';

const file = path.resolve('src/components/modals/task/hooks/useTaskModalForm.ts');
let content = fs.readFileSync(file, 'utf8');

// We want to avoid sending `status` entirely if it hasn't been explicitly dirtied.
content = content.replace(
  /const isStatusChanged = isStatusDirtyRef\.current && editingTask && formData\.status !== editingTask\.status;\n\s+const resolvedStatus = isStatusDirtyRef\.current \? formData\.status : \(editingTask\?\.status \|\| formData\.status\);\n\n\s+const taskPayload = \{([\s\S]*?)status: resolvedStatus,([\s\S]*?)\};/,
  `const isStatusChanged = isStatusDirtyRef.current && editingTask && formData.status !== editingTask.status;

    const taskPayload: any = {$1$2};
    if (isStatusDirtyRef.current || !editingTask) {
      taskPayload.status = formData.status;
    }`
);

fs.writeFileSync(file, content);
