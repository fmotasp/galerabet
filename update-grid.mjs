import fs from 'fs';

let content = fs.readFileSync('src/components/modals/task/components/TaskStatusAndDates.tsx', 'utf8');
content = content.replace(
  'className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-start"',
  'className="grid grid-cols-1 gap-4 items-start"'
);
fs.writeFileSync('src/components/modals/task/components/TaskStatusAndDates.tsx', content);

let content2 = fs.readFileSync('src/components/modals/task/components/TaskMembersAndClients.tsx', 'utf8');
content2 = content2.replace(
  "className={`grid grid-cols-1 sm:grid-cols-2 gap-4 items-start relative ${",
  "className={`grid grid-cols-1 gap-4 items-start relative ${"
);
fs.writeFileSync('src/components/modals/task/components/TaskMembersAndClients.tsx', content2);
