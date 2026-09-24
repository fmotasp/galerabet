import fs from 'fs';

let content = fs.readFileSync('src/components/modals/task/components/TaskDriveAttachmentsTab.tsx', 'utf8');

// External link button
content = content.replace(
  "className=\"p-2 bg-[#141414] hover:bg-[#E4007E] text-slate-400 hover:text-white rounded-xl transition-all shadow-xs flex items-center justify-center cursor-pointer active:scale-95 border border-[#2E2E2E] hover:border-[#E4007E]\"",
  "className=\"p-2 hover:bg-white/5 text-slate-400 hover:text-white rounded-xl transition-all flex items-center justify-center cursor-pointer active:scale-95 border-transparent\""
);

// Trash button
content = content.replace(
  "className=\"p-2 bg-[#141414] hover:bg-rose-600 text-slate-400 hover:text-white rounded-xl transition-all shadow-xs flex items-center justify-center cursor-pointer disabled:opacity-50 active:scale-95 border border-[#2E2E2E] hover:border-rose-600\"",
  "className=\"p-2 hover:bg-white/5 text-slate-400 hover:text-rose-400 rounded-xl transition-all flex items-center justify-center cursor-pointer disabled:opacity-50 active:scale-95 border-transparent\""
);

// More options button
content = content.replace(
  ": 'bg-[#141414] hover:bg-[#262626] text-slate-300 hover:text-white border-[#2E2E2E]'",
  ": 'hover:bg-white/5 text-slate-400 hover:text-white border-transparent'"
);

fs.writeFileSync('src/components/modals/task/components/TaskDriveAttachmentsTab.tsx', content);
