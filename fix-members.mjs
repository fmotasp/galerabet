import fs from 'fs';

let content = fs.readFileSync('src/components/modals/task/components/TaskMembersAndClients.tsx', 'utf8');

// Members
content = content.replace(/\.map\(\(emp\) => \{/g, '.map((emp, index) => {');
content = content.replace(/className=\{\`flex items-center gap-3 p-2\.5 rounded-xl cursor-pointer transition-colors \$\{\n\s*isSelected \? 'bg-\[#262626\]' : 'hover:bg-\[#1C1C1C\]'\n\s*\}\`\}\n\s*style=\{\{ border: isSelected \? '1px solid rgba\(228, 0, 126, 0\.5\)' : '1px solid transparent' \}\}/g, 
`className={\`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-colors animate-in slide-in-from-right-2 fade-in duration-300 fill-mode-both \${
                            isSelected ? 'bg-[#262626]' : 'hover:bg-[#1C1C1C]'
                          }\`}
                          style={{ 
                            border: isSelected ? '1px solid rgba(228, 0, 126, 0.5)' : '1px solid transparent',
                            animationDelay: \`\${index * 20}ms\`
                          }}`);

// Clients
content = content.replace(/\.map\(\(c\) => \{/g, '.map((c, index) => {');
content = content.replace(/className=\{\`flex items-center gap-3 p-2\.5 rounded-xl cursor-pointer transition-colors \$\{\n\s*isSelected \? 'bg-\[#262626\] border border-\[#E4007E\]\/50' : 'hover:bg-\[#1C1C1C\] border-transparent'\n\s*\}\`\}/g,
`className={\`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-colors animate-in slide-in-from-right-2 fade-in duration-300 fill-mode-both \${
                            isSelected ? 'bg-[#262626]' : 'hover:bg-[#1C1C1C]'
                          }\`}
                          style={{ 
                            border: isSelected ? '1px solid rgba(228, 0, 126, 0.5)' : '1px solid transparent',
                            animationDelay: \`\${index * 20}ms\`
                          }}`);

fs.writeFileSync('src/components/modals/task/components/TaskMembersAndClients.tsx', content);

