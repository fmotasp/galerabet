import fs from 'fs';

let content = fs.readFileSync('src/components/modals/task/components/TaskActivityTimelineTab.tsx', 'utf8');

content = content.replace(
  '<div className="absolute -left-6 top-1.5 w-3 h-3 rounded-full bg-[#E94E18] -translate-x-1/2 z-10 ring-[5px] ring-[#101010]" />',
  '<div className="absolute left-[-17px] top-[7px] w-2.5 h-2.5 rounded-full bg-[#E94E18] -translate-x-1/2 z-10 ring-[4px] ring-[#101010]" />'
);

fs.writeFileSync('src/components/modals/task/components/TaskActivityTimelineTab.tsx', content);
