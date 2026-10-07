import fs from 'fs';
import path from 'path';

function replaceInFile(filePath, regex, replacement) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(regex, replacement);
  fs.writeFileSync(filePath, content);
}

const files = [
  'src/components/modals/task/components/TaskMembersAndClients.tsx',
  'src/components/modals/task/components/TaskStatusAndDates.tsx',
  'src/components/modals/task/components/TaskCommentsSection.tsx',
  'src/components/modals/task/TaskModal.tsx'
];

files.forEach(file => {
  replaceInFile(file, /focus:border-\[#E4007E\]/g, 'focus:border-[#E4007E]/50 focus:ring-2 focus:ring-[#E4007E]/30');
});

