import fs from 'fs';

const filePath = 'src/components/dashboard/DashboardWorkloadWidget.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// In full width mode, making the workload list a 2-column or 3-column responsive grid
// makes it look like an elite executive operations panel!
// Let's replace `<div className="space-y-1">` with `<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">`

content = content.replace(
  '<div className="space-y-1">',
  '<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 pt-1">'
);

// In the member item, instead of `-mx-2`, let's make it a clean padded card with border
content = content.replace(
  'className="group cursor-pointer p-3 -mx-2 rounded-xl hover:bg-white/[0.03] transition-colors"',
  'className="group cursor-pointer p-4 rounded-xl bg-[#101010]/60 hover:bg-[#161616] border border-white/5 hover:border-[#E4007E]/30 transition-all shadow-xs flex flex-col justify-between"'
);

fs.writeFileSync(filePath, content);
console.log("Workload widget layout updated!");
