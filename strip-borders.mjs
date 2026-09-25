import fs from 'fs';

let content = fs.readFileSync('src/components/modals/task/components/TaskDriveAttachmentsTab.tsx', 'utf8');

// 1. Remove dashed border from dropzone
content = content.replace(
  'className={`relative p-8 rounded-2xl text-center space-y-2 transition-colors duration-200 border-2 ${',
  'className={`relative p-8 rounded-3xl text-center space-y-2 transition-colors duration-200 ${'
);
content = content.replace(
  "isDragging ? 'bg-[#E4007E]/10 border-[#E4007E]' : 'bg-[#1C1C1C]/40 border-dashed border-[#2E2E2E]'",
  "isDragging ? 'bg-[#E4007E]/10' : 'bg-[#181818]'"
);

// Dropzone when empty (line 211)
content = content.replace(
  'className="p-8 bg-[#1C1C1C]/40 border border-dashed border-[#2E2E2E] rounded-2xl text-center space-y-2"',
  'className="p-8 bg-[#181818] rounded-3xl text-center space-y-2"'
);

// 2. Remove borders from file cards (line 284)
content = content.replace(
  'className="bg-[#1C1C1C] rounded-2xl p-2.5 flex flex-col justify-between gap-2.5 relative border border-[#2E2E2E] hover:border-[#E4007E]/40 transition-colors shadow-sm"',
  'className="bg-[#1C1C1C] rounded-2xl p-2.5 flex flex-col justify-between gap-2.5 relative hover:bg-[#1f1f1f] transition-colors shadow-none"'
);

// 3. Remove border from top header icon inside card
content = content.replace(
  "? 'bg-[#181818] text-[#38BDF8] text-[11px] border border-[#2E2E2E] w-6 h-6 shadow-xs'",
  "? 'bg-[#141414] text-[#38BDF8] text-[11px] w-6 h-6 shadow-none'"
);
content = content.replace(
  "? 'bg-[#2A2000] text-[#FBBF24] border border-[#78350F] w-6 h-6 shadow-xs'",
  "? 'bg-[#2A2000] text-[#FBBF24] w-6 h-6 shadow-none'"
);
content = content.replace(
  ": 'bg-[#101010] text-slate-300 border border-[#2E2E2E] w-6 h-6 shadow-xs'",
  ": 'bg-[#101010] text-slate-300 w-6 h-6 shadow-none'"
);

// 4. Remove borders from PSD and ZIP icons / boxes
content = content.replace(
  'className="flex flex-col items-center justify-center bg-gradient-to-b from-[#181818] to-[#101010] rounded-xl aspect-square w-full border border-[#2E2E2E] hover:border-[#E4007E]/60 p-3 text-center transition-all group/psd cursor-pointer shadow-inner"',
  'className="flex flex-col items-center justify-center bg-[#141414] rounded-xl aspect-square w-full p-3 text-center transition-all group/psd cursor-pointer shadow-none"'
);
content = content.replace(
  'className="w-14 h-14 rounded-2xl bg-[#141414] border-2 border-[#38BDF8]/60 flex items-center justify-center shadow-xl mb-2 group-hover/psd:scale-110 transition-transform"',
  'className="w-14 h-14 rounded-2xl bg-[#1a1a1a] flex items-center justify-center shadow-none mb-2 group-hover/psd:scale-110 transition-transform"'
);
content = content.replace(
  'className="text-[9px] text-slate-300 font-semibold mt-1 uppercase tracking-wider bg-[#141414] px-2 py-0.5 rounded-md border border-[#2E2E2E] shadow-xs"',
  'className="text-[9px] text-slate-400 font-semibold mt-1 uppercase tracking-wider bg-[#101010] px-2 py-0.5 rounded-md shadow-none"'
);

// ZIP Box
content = content.replace(
  'className="flex flex-col items-center justify-center bg-gradient-to-b from-[#1c1710] to-[#141005] rounded-xl aspect-square w-full border border-[#78350F] hover:border-[#FBBF24]/60 p-3 text-center transition-all group/zip cursor-pointer shadow-inner"',
  'className="flex flex-col items-center justify-center bg-[#141414] rounded-xl aspect-square w-full p-3 text-center transition-all group/zip cursor-pointer shadow-none"'
);
content = content.replace(
  'className="w-14 h-14 rounded-2xl bg-[#1e170a] border-2 border-[#FBBF24]/60 flex items-center justify-center shadow-xl mb-2 group-hover/zip:scale-110 transition-transform"',
  'className="w-14 h-14 rounded-2xl bg-[#1e170a] flex items-center justify-center shadow-none mb-2 group-hover/zip:scale-110 transition-transform"'
);
content = content.replace(
  'className="text-[9px] text-amber-400 font-semibold mt-1 uppercase tracking-wider bg-[#141414] px-2 py-0.5 rounded-md border border-[#78350F] shadow-xs"',
  'className="text-[9px] text-amber-400 font-semibold mt-1 uppercase tracking-wider bg-[#101010] px-2 py-0.5 rounded-md shadow-none"'
);

// 5. Remove border from standard image preview
content = content.replace(
  'className="relative aspect-square w-full rounded-xl overflow-hidden bg-[#101010] border border-[#2E2E2E] cursor-pointer group hover:opacity-95 transition-opacity"',
  'className="relative aspect-square w-full rounded-xl overflow-hidden bg-[#101010] cursor-pointer group hover:opacity-95 transition-opacity"'
);
content = content.replace(
  'className="flex flex-col items-center justify-center bg-white/[0.02] rounded-xl aspect-square w-full border border-white/5 opacity-80 group-hover:opacity-100 transition-opacity"',
  'className="flex flex-col items-center justify-center bg-white/[0.02] rounded-xl aspect-square w-full opacity-80 group-hover:opacity-100 transition-opacity"'
);

// 6. Remove border-t from actions row
content = content.replace(
  'className="flex items-center justify-end gap-1.5 pt-2 border-t border-white/5 relative"',
  'className="flex items-center justify-end gap-1.5 pt-2 relative"'
);

// 7. Remove any border class from the More options button just in case
content = content.replace(
  'className={`p-2 rounded-xl transition-all border cursor-pointer active:scale-95 ${',
  'className={`p-2 rounded-xl transition-all cursor-pointer active:scale-95 ${'
);
content = content.replace(
  "? 'bg-gradient-to-tr from-[#E4007E] to-[#E94E18] text-white border-[#E4007E] shadow-md shadow-[#E4007E]/30'",
  "? 'bg-gradient-to-tr from-[#E4007E] to-[#E94E18] text-white shadow-md shadow-[#E4007E]/30'"
);


fs.writeFileSync('src/components/modals/task/components/TaskDriveAttachmentsTab.tsx', content);
