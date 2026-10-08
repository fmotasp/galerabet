import fs from 'fs';

let content = fs.readFileSync('src/components/tasks/TasksFilterToolbar.tsx', 'utf8');

content = content.replace(
  '<div className="flex flex-wrap md:flex-nowrap items-center justify-between gap-3 bg-[#181818] p-3 rounded-2xl border border-[#2A2A2A]">',
  '<div className="flex flex-row md:flex-nowrap items-center justify-between gap-2 md:gap-3 bg-[#181818] p-2 md:p-3 rounded-2xl border border-[#2A2A2A] overflow-x-auto hide-scrollbar">'
);

content = content.replace(
  '<div className="flex flex-wrap md:flex-nowrap items-center gap-3 w-full md:w-auto min-w-0">',
  '<div className="flex flex-row items-center gap-2 md:gap-3 w-auto min-w-0 flex-1 md:flex-none">'
);

content = content.replace(
  'className="flex items-center justify-between min-w-[160px] gap-2.5 bg-[#222222] hover:bg-[#2A2A2A] border border-[#303030] text-white rounded-xl px-3.5 py-2 text-xs font-bold transition-all active:scale-98 cursor-pointer"',
  'className="flex items-center justify-between w-full md:min-w-[160px] gap-1.5 md:gap-2.5 bg-[#222222] hover:bg-[#2A2A2A] border border-[#303030] text-white rounded-xl px-2 py-2 md:px-3.5 md:py-2 text-[10px] md:text-xs font-bold transition-all active:scale-98 cursor-pointer"'
);

content = content.replace(
  '<div className="relative md:hidden">',
  '<div className="relative md:hidden flex-1">'
);

content = content.replace(
  'className="flex items-center gap-2.5 bg-[#222222] hover:bg-[#2A2A2A] border border-[#303030] text-white rounded-xl px-3.5 py-2 text-xs font-bold transition-all active:scale-98 cursor-pointer"',
  'className="flex items-center justify-between md:justify-start w-full gap-1.5 md:gap-2.5 bg-[#222222] hover:bg-[#2A2A2A] border border-[#303030] text-white rounded-xl px-2 py-2 md:px-3.5 md:py-2 text-[10px] md:text-xs font-bold transition-all active:scale-98 cursor-pointer"'
);

content = content.replace(
  '        <div className="flex items-center gap-2">',
  '        <div className="flex flex-row items-center gap-2 flex-1 md:flex-none">'
);

content = content.replace(
  '        <div className="relative">',
  '        <div className="relative flex-1 md:flex-none">'
);

content = content.replace(
  '<div className="flex items-center gap-4 shrink-0">',
  `
      {onNewTask && (
        <button
          onClick={onNewTask}
          className="md:hidden flex items-center justify-center w-8 h-8 shrink-0 bg-gradient-to-r from-[#E4007E] to-[#E94E18] text-white rounded-xl shadow-md active:scale-98"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
        </button>
      )}
      <div className="flex items-center gap-3 shrink-0">`
);

if (!content.includes('Plus')) {
  content = content.replace('Users, Star, ChevronDown, Check, CheckCircle2', 'Users, Star, ChevronDown, Check, CheckCircle2, Plus');
}

fs.writeFileSync('src/components/tasks/TasksFilterToolbar.tsx', content);
