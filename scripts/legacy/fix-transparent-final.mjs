import fs from 'fs';

function replaceInFile(filePath, regex, replacement) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(regex, replacement);
  fs.writeFileSync(filePath, content);
}

const membersFile = 'src/components/modals/task/components/TaskMembersAndClients.tsx';
replaceInFile(membersFile, /className=\{\`flex items-center gap-3 p-2\.5 rounded-xl cursor-pointer transition-colors \$\{\n\s*isSelected \? 'bg-\[#262626\] border border-\[#E4007E\]\/50' : 'hover:bg-\[#1C1C1C\] border-transparent'\n\s*\}\`\}/g, `className={\`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-colors \${
                            isSelected ? 'bg-[#262626]' : 'hover:bg-[#1C1C1C]'
                          }\`}
                          style={{ border: isSelected ? '1px solid rgba(228, 0, 126, 0.5)' : '1px solid transparent' }}`);

