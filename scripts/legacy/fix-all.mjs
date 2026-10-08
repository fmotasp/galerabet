import fs from 'fs';

let content = fs.readFileSync('src/components/modals/task/components/TaskMembersAndClients.tsx', 'utf8');

// 1. Remove 'relative' from the main wrappers
content = content.replace(
  'className={`grid grid-cols-1 gap-4 items-start relative ${',
  'className={`grid grid-cols-1 gap-4 items-start static ${'
);
content = content.replace(
  'className={`relative ${isMembersPopoverOpen ? \'z-50\' : \'z-20\'}`}',
  'className={`static ${isMembersPopoverOpen ? \'z-50\' : \'z-20\'}`}'
);
content = content.replace(
  'className={`relative ${isLabelsPopoverOpen ? \'z-50\' : \'z-20\'}`}',
  'className={`static ${isLabelsPopoverOpen ? \'z-50\' : \'z-20\'}`}'
);

// 2. We need to move the popovers OUT of their button wrappers so they anchor to the right column correctly.
// For Membros:
const membersButtonOld = `              <button
                type="button"
                onClick={() => {
                  setIsMembersPopoverOpen(!isMembersPopoverOpen);
                  setIsLabelsPopoverOpen(false);
                }}
                className="w-9 h-9 rounded-full bg-[#1C1C1C] hover:bg-[#E4007E]/20 flex items-center justify-center text-slate-400 hover:text-[#E4007E] transition-all hover:scale-105 active:scale-95 cursor-pointer border-transparent"
                title="Adicionar Membro"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
              </button>

              {/* Members Popover Dropdown */}
            {isMembersPopoverOpen && (`;

const membersButtonNew = `              <button
                type="button"
                onClick={() => {
                  setIsMembersPopoverOpen(!isMembersPopoverOpen);
                  setIsLabelsPopoverOpen(false);
                }}
                className="w-9 h-9 rounded-full bg-[#1C1C1C] hover:bg-[#E4007E]/20 flex items-center justify-center text-slate-400 hover:text-[#E4007E] transition-all hover:scale-105 active:scale-95 cursor-pointer border-transparent"
                title="Adicionar Membro"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>
        </div>

        {/* Members Popover Dropdown */}
        {isMembersPopoverOpen && (`;
content = content.replace(membersButtonOld, membersButtonNew);

// Remove the extra closing tags for Membros
const membersEndOld = `                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Clientes */}`;
const membersEndNew = `                    </div>
                  </div>
                </div>
              </>
            )}
      </div>

      {/* Clientes */}`;
content = content.replace(membersEndOld, membersEndNew);

// For Clientes:
// The Clientes popover is already outside of the button wrapper!
// It's just right after `<div className="flex items-center gap-2 flex-wrap"> ... </div>`
// Let's verify:
//   <div className="flex items-center gap-2 flex-wrap"> (avatars & button) </div>
//   {/* Clientes Popover Dropdown */} {isLabelsPopoverOpen && ...}
// So Clientes structure is already correct for bubbling to the Right Column.

// 3. Update the popover wrappers themselves
const membersPopoverOld = /className="fixed top-1\/2 left-1\/2 -translate-x-1\/2 -translate-y-1\/2 w-\[90vw\] max-w-\[320px\] bg-\[#141414\] border border-\[#2E2E2E\] rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-200"/g;
const membersPopoverNew = 'className="absolute bottom-0 left-0 right-0 w-full bg-[#141414] border-t border-l border-[#2A2A2A] rounded-tl-2xl shadow-[0_-20px_50px_rgba(0,0,0,0.5)] p-4 sm:p-6 z-[60] animate-in slide-in-from-bottom-12 duration-200 flex flex-col max-h-[85vh]"';
content = content.replace(membersPopoverOld, membersPopoverNew);

const clientsPopoverOld = /className="fixed top-1\/2 left-1\/2 -translate-x-1\/2 -translate-y-1\/2 w-\[90vw\] max-w-\[320px\] bg-\[#141414\] border border-\[#2A2A2A\] rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-200"/g;
const clientsPopoverNew = 'className="absolute bottom-0 left-0 right-0 w-full bg-[#141414] border-t border-l border-[#2A2A2A] rounded-tl-2xl shadow-[0_-20px_50px_rgba(0,0,0,0.5)] p-4 sm:p-6 z-[60] animate-in slide-in-from-bottom-12 duration-200 flex flex-col max-h-[85vh]"';
content = content.replace(clientsPopoverOld, clientsPopoverNew);

// Fix backdrop z-indexes to [55] (above right column which is nothing, but under [60])
content = content.replace(/z-40/g, 'z-[55]');
content = content.replace(/z-50/g, 'z-[60]');

// 4. Update heights
content = content.replace('max-h-56 overflow-y-auto', 'max-h-[60vh] overflow-y-auto');
content = content.replace('max-h-60 overflow-y-auto', 'max-h-[60vh] overflow-y-auto');

// 5. Unify Membros UI
const membersUIOldRegex = /<div\s*key=\{emp\.id\}[\s\S]*?onClick=\{[\s\S]*?\}[\s\S]*?className=\{`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-colors active:scale-98 \$\{[\s\S]*?\}[\s\S]*?\{isSelected && \(\s*<Check className="w-4 h-4 text-\[#E4007E\] shrink-0 stroke-\[2\.5\]" \/>\s*\)\}\s*<\/div>/g;
const membersUINew = `<div
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
content = content.replace(membersUIOldRegex, membersUINew);

fs.writeFileSync('src/components/modals/task/components/TaskMembersAndClients.tsx', content);

