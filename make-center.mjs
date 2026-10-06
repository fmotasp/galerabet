import fs from 'fs';

let content = fs.readFileSync('src/components/modals/task/TaskModal.tsx', 'utf8');

// Change outer wrapper
content = content.replace(
  '    <div className="fixed inset-0 z-50 flex justify-end overflow-hidden animate-in fade-in duration-200">',
  '    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-hidden animate-in fade-in duration-200">'
);

// Change modal box wrapper
content = content.replace(
  '      <div className="relative w-full max-w-2xl lg:max-w-4xl xl:max-w-6xl h-full bg-[#101010] text-white shadow-2xl border-l border-[#2E2E2E] overflow-hidden flex flex-col z-10 animate-in slide-in-from-right duration-300 ease-out">',
  '      <div className="relative w-full max-w-2xl lg:max-w-4xl xl:max-w-6xl max-h-[95vh] h-full sm:h-auto sm:min-h-[600px] bg-[#101010] text-white rounded-2xl shadow-2xl border border-[#2E2E2E] overflow-hidden flex flex-col z-10 animate-in zoom-in-95 duration-300 ease-out">'
);

fs.writeFileSync('src/components/modals/task/TaskModal.tsx', content);
