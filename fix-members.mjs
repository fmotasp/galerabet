import fs from 'fs';

let content = fs.readFileSync('src/components/modals/task/components/TaskMembersAndClients.tsx', 'utf8');

content = content.replace(
  'className="w-9 h-9 rounded-full bg-[#1C1C1C] border border-[#2E2E2E] hover:border-[#E4007E] flex items-center justify-center text-slate-200 hover:text-white transition-all shadow-sm hover:scale-105 active:scale-95 cursor-pointer"',
  'className="w-9 h-9 rounded-full bg-[#1C1C1C] hover:bg-[#E4007E]/20 flex items-center justify-center text-slate-400 hover:text-[#E4007E] transition-all hover:scale-105 active:scale-95 cursor-pointer border-transparent"'
);

content = content.replace(
  'className="w-8 h-8 rounded-full bg-[#1C1C1C] border border-[#2E2E2E] hover:border-[#E4007E] flex items-center justify-center text-slate-200 hover:text-white transition-all shadow-sm hover:scale-105 active:scale-95 cursor-pointer"',
  'className="w-8 h-8 rounded-full bg-[#1C1C1C] hover:bg-[#E4007E]/20 flex items-center justify-center text-slate-400 hover:text-[#E4007E] transition-all hover:scale-105 active:scale-95 cursor-pointer border-transparent"'
);

fs.writeFileSync('src/components/modals/task/components/TaskMembersAndClients.tsx', content);
