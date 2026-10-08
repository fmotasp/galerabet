import fs from 'fs';

const filePath = 'src/components/reports/ReportsView.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. In ReportsView, change:
// <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
// to:
// <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
// 2. Remove `flex flex-col justify-between` from the cards so they don't stretch empty space in the middle!
// 3. Make client list naturally fill top-down (`flex-1 space-y-4` instead of pushing to bottom).

content = content.replace(
  '<div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">',
  '<div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">'
);

content = content.replace(
  '<div className="xl:col-span-7 p-6 bg-[#141414] border border-[#262626] rounded-2xl space-y-4 flex flex-col justify-between shadow-xs">',
  '<div className="xl:col-span-7 p-6 bg-[#141414] border border-[#262626] rounded-2xl space-y-4 shadow-xs">'
);

content = content.replace(
  '<div className="xl:col-span-5 p-6 bg-[#141414] border border-[#262626] rounded-2xl space-y-4 flex flex-col justify-between shadow-xs">',
  '<div className="xl:col-span-5 p-6 bg-[#141414] border border-[#262626] rounded-2xl space-y-4 shadow-xs">'
);

// Also remove max-h-[460px] constraint if not needed, or let it scroll naturally without pushing content down
content = content.replace(
  'max-h-[460px] overflow-y-auto pr-1.5 custom-scrollbar',
  ''
);

fs.writeFileSync(filePath, content);
console.log("Card spacing fixed successfully!");
