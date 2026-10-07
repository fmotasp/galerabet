import fs from 'fs';

let content = fs.readFileSync('src/components/modals/task/TaskModal.tsx', 'utf8');

// Remove z-20 from right column
content = content.replace(
  'className="relative w-full md:w-[340px] lg:w-[380px] bg-[#141414] shrink-0 z-20 flex flex-col overflow-hidden"',
  'className="relative w-full md:w-[340px] lg:w-[380px] bg-[#141414] shrink-0 flex flex-col overflow-hidden"'
);

fs.writeFileSync('src/components/modals/task/TaskModal.tsx', content);

let mcContent = fs.readFileSync('src/components/modals/task/components/TaskMembersAndClients.tsx', 'utf8');
mcContent = mcContent.replace(/z-50/g, 'z-[60]');
mcContent = mcContent.replace(/z-40/g, 'z-[55]');
fs.writeFileSync('src/components/modals/task/components/TaskMembersAndClients.tsx', mcContent);

