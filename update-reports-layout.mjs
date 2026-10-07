import fs from 'fs';

const filePath = 'src/components/reports/ReportsView.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Equalize Productivity vs Clients grid to balanced 6 and 6 (xl:grid-cols-12 with 6 and 6)
content = content.replace(
  '<div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">',
  '<div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">'
);

content = content.replace(
  '<div className="lg:col-span-7 p-5 bg-[#141414] border border-[#262626] rounded-2xl space-y-4">',
  '<div className="xl:col-span-7 p-6 bg-[#141414] border border-[#262626] rounded-2xl space-y-4 flex flex-col justify-between shadow-xs">'
);

content = content.replace(
  '<div className="lg:col-span-5 p-5 bg-[#141414] border border-[#262626] rounded-2xl space-y-4">',
  '<div className="xl:col-span-5 p-6 bg-[#141414] border border-[#262626] rounded-2xl space-y-4 flex flex-col justify-between shadow-xs">'
);

// 2. Add an internal max-height with clean scrollbar to the client distribution list
// so it doesn't infinitely stretch when there are 15+ clients, keeping both cards harmonious!
content = content.replace(
  '<div className="divide-y divide-[#202020]">',
  '<div className="divide-y divide-[#202020] max-h-[460px] overflow-y-auto pr-1.5 custom-scrollbar">'
);

fs.writeFileSync(filePath, content);
console.log("Reports layout harmonized successfully!");
