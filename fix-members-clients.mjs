import fs from 'fs';

let content = fs.readFileSync('src/components/modals/task/components/TaskMembersAndClients.tsx', 'utf8');

// Remove relative from main wrapper
content = content.replace(
  'className={`grid grid-cols-1 gap-4 items-start relative ${',
  'className={`grid grid-cols-1 gap-4 items-start static ${'
);

// Remove relative from Membros wrapper
content = content.replace(
  'className={`relative ${isMembersPopoverOpen ? \'z-50\' : \'z-20\'}`}',
  'className={`static ${isMembersPopoverOpen ? \'z-50\' : \'z-20\'}`}'
);

// Remove relative from Clientes wrapper
content = content.replace(
  'className={`relative ${isLabelsPopoverOpen ? \'z-50\' : \'z-20\'}`}',
  'className={`static ${isLabelsPopoverOpen ? \'z-50\' : \'z-20\'}`}'
);

// Modify Members Popover
const membersPopoverOld = /className="fixed top-1\/2 left-1\/2 -translate-x-1\/2 -translate-y-1\/2 w-\[90vw\] max-w-\[320px\] bg-\[#141414\] border border-\[#2E2E2E\] rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-200"/g;
const membersPopoverNew = 'className="absolute bottom-0 left-0 right-0 w-full bg-[#141414] border-t border-l border-[#2A2A2A] rounded-tl-2xl shadow-[0_-20px_50px_rgba(0,0,0,0.5)] p-4 sm:p-6 z-50 animate-in slide-in-from-bottom-12 duration-200 flex flex-col max-h-[85vh]"';
content = content.replace(membersPopoverOld, membersPopoverNew);

// Modify Clients Popover
const clientsPopoverOld = /className="fixed top-1\/2 left-1\/2 -translate-x-1\/2 -translate-y-1\/2 w-\[90vw\] max-w-\[320px\] bg-\[#141414\] border border-\[#2A2A2A\] rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-200"/g;
const clientsPopoverNew = 'className="absolute bottom-0 left-0 right-0 w-full bg-[#141414] border-t border-l border-[#2A2A2A] rounded-tl-2xl shadow-[0_-20px_50px_rgba(0,0,0,0.5)] p-4 sm:p-6 z-50 animate-in slide-in-from-bottom-12 duration-200 flex flex-col max-h-[85vh]"';
content = content.replace(clientsPopoverOld, clientsPopoverNew);

fs.writeFileSync('src/components/modals/task/components/TaskMembersAndClients.tsx', content);

