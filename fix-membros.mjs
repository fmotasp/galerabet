import fs from 'fs';

let content = fs.readFileSync('src/components/modals/task/components/TaskMembersAndClients.tsx', 'utf8');

// Update heights
content = content.replace('max-h-56 overflow-y-auto', 'max-h-[60vh] overflow-y-auto');
content = content.replace('max-h-60 overflow-y-auto', 'max-h-[60vh] overflow-y-auto');

// Update Membros list items layout
const regex = /<div\s*key=\{emp\.id\}[\s\S]*?onClick=\{[\s\S]*?\}[\s\S]*?className=\{`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-colors active:scale-98 \$\{[\s\S]*?\}[\s\S]*?\{isSelected && \(\s*<Check className="w-4 h-4 text-\[#E4007E\] shrink-0 stroke-\[2\.5\]" \/>\s*\)\}\s*<\/div>/g;

const replacement = `<div
                              key={emp.id}
                              onClick={() => {
                                if (isSelected) handleRemoveMember(emp.id);
                                else handleAddMember(emp.id);
                              }}
                              className={\`flex items-center gap-2.5 p-2 rounded-xl cursor-pointer transition-colors \${
                                isSelected ? 'bg-[#262626] border border-[#E4007E]/50' : 'hover:bg-[#1C1C1C] border border-transparent'
                              }\`}
                            >
                              <div className={\`w-4 h-4 rounded border flex items-center justify-center shrink-0 \${isSelected ? 'bg-gradient-to-r from-[#E4007E] to-[#E94E18] border-transparent' : 'border-[#3E3E3E]'}\`}>
                                {isSelected && <Check className="w-3 h-3 text-white stroke-[3]" />}
                              </div>
                              
                              <Avatar
                                src={emp.avatarUrl}
                                name={emp.name}
                                alt={emp.name}
                                size="xs"
                                ring={false}
                                className="!w-7 !h-7 rounded-lg shrink-0"
                              />
                              
                              <div className="truncate flex-1 min-w-0">
                                <span className="font-bold text-xs block truncate text-white">
                                  {emp.name}
                                </span>
                                <span className="text-[10px] text-slate-400 block truncate">
                                  {emp.role}
                                </span>
                              </div>
                            </div>`;

content = content.replace(regex, replacement);

fs.writeFileSync('src/components/modals/task/components/TaskMembersAndClients.tsx', content);

