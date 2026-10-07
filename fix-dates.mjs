import fs from 'fs';

let content = fs.readFileSync('src/components/modals/task/components/TaskStatusAndDates.tsx', 'utf8');

// The dates are formatted with `text-xs font-semibold text-white`.
// Let's replace `text-xs font-semibold text-white` in date inputs with `tabular-nums` added.
content = content.replace(/className="w-full h-\[46px\] px-3 bg-\[#101010\] border border-white\/5 rounded-xl text-xs font-semibold text-white transition-all shadow-xs focus:outline-none focus:border-\[#E4007E\]\/50 focus:ring-2 focus:ring-\[#E4007E\]\/30 cursor-pointer"/g, 
  'className="w-full h-[46px] px-3 bg-[#101010] border border-white/5 rounded-xl text-xs font-semibold text-white tabular-nums transition-all shadow-xs focus:outline-none focus:border-[#E4007E]/50 focus:ring-2 focus:ring-[#E4007E]/30 cursor-pointer"');

content = content.replace(/className="w-full h-\[46px\] px-3 bg-\[#101010\] border border-white\/5 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-\[#E4007E\]\/50 focus:ring-2 focus:ring-\[#E4007E\]\/30 cursor-pointer"/g, 
  'className="w-full h-[46px] px-3 bg-[#101010] border border-white/5 rounded-xl text-xs font-bold text-white tabular-nums focus:outline-none focus:border-[#E4007E]/50 focus:ring-2 focus:ring-[#E4007E]/30 cursor-pointer"');

fs.writeFileSync('src/components/modals/task/components/TaskStatusAndDates.tsx', content);

