import fs from 'fs';

let content = fs.readFileSync('src/components/modals/task/components/TaskStatusAndDates.tsx', 'utf8');

content = content.replace(
  'type="datetime-local"',
  'type="datetime-local"\n            style={{ colorScheme: \'dark\' }}'
);

// Actually, I should also check if the system already uses `[color-scheme:dark]` class.
// But style={{ colorScheme: 'dark' }} is foolproof.
fs.writeFileSync('src/components/modals/task/components/TaskStatusAndDates.tsx', content);

