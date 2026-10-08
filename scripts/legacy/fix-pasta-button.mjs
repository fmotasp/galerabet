import fs from 'fs';
let content = fs.readFileSync('src/components/modals/task/components/TaskDriveAttachmentsTab.tsx', 'utf8');

content = content.replace(
  'className="px-4 py-2.5 bg-[#1C1C1C] hover:bg-[#2E2E2E] text-white border border-[#2E2E2E] hover:border-[#E4007E] font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"',
  'className="px-4 py-2.5 bg-[#1C1C1C] hover:bg-[#262626] text-slate-300 hover:text-white font-bold text-xs rounded-xl transition-all shadow-none flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"'
);

fs.writeFileSync('src/components/modals/task/components/TaskDriveAttachmentsTab.tsx', content);
