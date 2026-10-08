import fs from 'fs';

function replaceInFile(filePath, regex, replacement) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(regex, replacement);
  fs.writeFileSync(filePath, content);
}

const membersFile = 'src/components/modals/task/components/TaskMembersAndClients.tsx';
replaceInFile(membersFile, /bg-\[#1C1C1C\] border border-\[#2E2E2E\]/g, 'bg-[#101010] border border-white/5');

const datesFile = 'src/components/modals/task/components/TaskStatusAndDates.tsx';
replaceInFile(datesFile, /bg-\[#1C1C1C\] border border-white\/5/g, 'bg-[#101010] border border-white/5');

