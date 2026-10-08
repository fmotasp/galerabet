import fs from 'fs';

function replaceInFile(filePath, regex, replacement) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(regex, replacement);
  fs.writeFileSync(filePath, content);
}

const membersFile = 'src/components/modals/task/components/TaskMembersAndClients.tsx';
replaceInFile(membersFile, /hover:bg-\[#1C1C1C\] border !border-transparent/g, 'hover:bg-[#1C1C1C] border-transparent');

