import fs from 'fs';
import path from 'path';

function replaceInFile(filePath, regex, replacement) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(regex, replacement);
  fs.writeFileSync(filePath, content);
}

const file = 'src/components/modals/task/components/TaskMembersAndClients.tsx';
replaceInFile(file, /className=\{`flex items-center gap-2\.5 p-2 rounded-xl/g, 'className={`flex items-center gap-3 p-2.5 rounded-xl');

