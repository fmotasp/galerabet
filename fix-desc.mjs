import fs from 'fs';

let content = fs.readFileSync('src/components/modals/task/components/TaskDescriptionSection.tsx', 'utf8');
content = content.replace(
  'className="p-4 bg-[#1C1C1C] text-slate-100 border border-[#2E2E2E] rounded-2xl cursor-pointer hover:border-[#E4007E] transition-colors group relative min-h-[140px] flex-1 overflow-hidden break-words [overflow-wrap:anywhere]"',
  'className="p-4 bg-[#1C1C1C] text-slate-100 border border-[#2E2E2E] rounded-2xl cursor-pointer hover:border-[#E4007E] transition-colors group relative h-[250px] overflow-y-auto custom-scrollbar break-words [overflow-wrap:anywhere]"'
);
fs.writeFileSync('src/components/modals/task/components/TaskDescriptionSection.tsx', content);

let content2 = fs.readFileSync('src/components/modals/task/components/TaskRichTextEditor.tsx', 'utf8');
content2 = content2.replace(
  'className="w-full min-h-[140px] max-h-[300px] overflow-y-auto p-3 text-xs text-white focus:outline-none leading-relaxed bg-[#1C1C1C]"',
  'className="w-full h-[250px] overflow-y-auto custom-scrollbar p-3 text-xs text-white focus:outline-none leading-relaxed bg-[#1C1C1C]"'
);
fs.writeFileSync('src/components/modals/task/components/TaskRichTextEditor.tsx', content2);

