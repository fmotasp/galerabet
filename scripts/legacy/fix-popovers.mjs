import fs from 'fs';

let content = fs.readFileSync('src/components/modals/task/components/TaskMembersAndClients.tsx', 'utf8');

// Members Popover
content = content.replace(
  'className="absolute left-0 top-11 w-72 bg-[#141414] border border-[#2E2E2E] rounded-2xl shadow-2xl p-3.5 z-50 animate-in fade-in zoom-in-95 duration-100"',
  'className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-[320px] bg-[#141414] border border-[#2E2E2E] rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-200"'
);

// Clients Popover
content = content.replace(
  'className="absolute left-0 top-11 w-80 bg-[#141414] border border-[#2A2A2A] rounded-2xl shadow-2xl p-3.5 z-50 animate-in fade-in zoom-in-95 duration-100"',
  'className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-[320px] bg-[#141414] border border-[#2A2A2A] rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-200"'
);

fs.writeFileSync('src/components/modals/task/components/TaskMembersAndClients.tsx', content);

