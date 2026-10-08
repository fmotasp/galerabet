import fs from 'fs';

function replaceInFile(filePath, regex, replacement) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(regex, replacement);
  fs.writeFileSync(filePath, content);
}

const membersFile = 'src/components/modals/task/components/TaskMembersAndClients.tsx';
replaceInFile(membersFile, /text-\[10px\] text-slate-400/g, 'text-[11px] text-slate-300');
replaceInFile(membersFile, /text-\[11px\] font-bold text-slate-400/g, 'text-xs font-bold text-slate-300');
replaceInFile(membersFile, /text-xs font-medium text-slate-200/g, 'text-sm font-semibold text-slate-200'); // Labels like "Membros" and "Clientes"

const timelineFile = 'src/components/modals/task/components/TaskActivityTimelineTab.tsx';
replaceInFile(timelineFile, /text-\[10px\] text-slate-500/g, 'text-[11px] text-slate-400');
replaceInFile(timelineFile, /text-\[10px\] text-slate-600/g, 'text-[11px] text-slate-500');
replaceInFile(timelineFile, /text-slate-600 text-\[10px\]/g, 'text-slate-500 text-[11px]');

