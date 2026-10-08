import fs from 'fs';

function replaceInFile(filePath, regex, replacement) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(regex, replacement);
  fs.writeFileSync(filePath, content);
}

const membersFile = 'src/components/modals/task/components/TaskMembersAndClients.tsx';
replaceInFile(membersFile, /<div className=\{\`w-4 h-4 rounded border flex items-center justify-center shrink-0 \$\{\n?\s*isSelected \? 'bg-gradient-to-r from-\[#E4007E\] to-\[#E94E18\] border-transparent' : 'border-\[#3E3E3E\]'\n?\s*\}\`\}>/g, `<div 
                            className={\`w-4 h-4 rounded flex items-center justify-center shrink-0 \${isSelected ? 'bg-gradient-to-r from-[#E4007E] to-[#E94E18]' : ''}\`}
                            style={{ border: isSelected ? 'none' : '1px solid #3E3E3E' }}
                          >`);

