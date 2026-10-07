import fs from 'fs';

let content = fs.readFileSync('src/components/modals/task/components/TaskMembersAndClients.tsx', 'utf8');

// Update Membros popover
const membersPopoverOld = /<div className="absolute bottom-0 left-0 right-0 w-full bg-\[#141414\] border-t border-l border-\[#2A2A2A\] rounded-tl-2xl shadow-\[0_-20px_50px_rgba\(0,0,0,0\.5\)\] p-4 sm:p-6 z-\[60\] animate-in slide-in-from-bottom-12 duration-200 flex flex-col max-h-\[85vh\]">[\s\S]*?<div className="flex items-center justify-between pb-3 border-b border-\[#2E2E2E\] mb-3">[\s\S]*?<div className="space-y-3">[\s\S]*?<div className="relative">[\s\S]*?<div className="text-\[11px\] font-bold text-slate-400 pt-1">Membros do Time<\/div>\s*<div className="space-y-1 max-h-\[60vh\] overflow-y-auto pr-1">/g;

// To make this robust, I'll just replace the specific wrapper strings.
content = content.replace(/max-h-\[85vh\]/g, 'max-h-full');
content = content.replace(/<div className="space-y-3">/g, '<div className="flex flex-col flex-1 min-h-0 space-y-3">');
content = content.replace(/<div className="flex items-center justify-between pb-3 border-b border-\[#2E2E2E\] mb-3">/g, '<div className="flex items-center justify-between pb-3 border-b border-[#2E2E2E] mb-3 shrink-0">');
content = content.replace(/<div className="flex items-center justify-between pb-3 border-b border-\[#262626\] mb-3">/g, '<div className="flex items-center justify-between pb-3 border-b border-[#262626] mb-3 shrink-0">');
content = content.replace(/<div className="relative">/g, '<div className="relative shrink-0">');
content = content.replace(/<div className="text-\[11px\] font-bold text-slate-400 pt-1">/g, '<div className="text-[11px] font-bold text-slate-400 pt-1 shrink-0">');
content = content.replace(/<div className="space-y-1 max-h-\[60vh\] overflow-y-auto pr-1">/g, '<div className="flex-1 overflow-y-auto pr-1 space-y-1 custom-scrollbar">');


fs.writeFileSync('src/components/modals/task/components/TaskMembersAndClients.tsx', content);

