import fs from 'fs';

const content = `import React, { useState } from 'react';
import { Plus, X, Check } from 'lucide-react';
import { Employee, Project, TaskMember } from '../../../../types';
import { Avatar } from '../../../ui/Avatar';

export const TaskMembersAndClients: React.FC<{
  taskMembers: TaskMember[];
  employees: Employee[];
  projects: Project[];
  selectedLabels: string[];
  handleAddMember: (empId: string) => void;
  handleRemoveMember: (empId: string) => void;
  handleToggleLabel: (clientName: string) => void;
}> = ({
  taskMembers,
  employees,
  projects,
  selectedLabels,
  handleAddMember,
  handleRemoveMember,
  handleToggleLabel,
}) => {
  const [isMembersPopoverOpen, setIsMembersPopoverOpen] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');

  const [isLabelsPopoverOpen, setIsLabelsPopoverOpen] = useState(false);
  const [labelSearchQuery, setLabelSearchQuery] = useState('');

  return (
    <div className={\`grid grid-cols-1 gap-4 items-start static \${(isMembersPopoverOpen || isLabelsPopoverOpen) ? 'z-[60]' : 'z-10'}\`}>
      {/* Membros */}
      <div className={\`static \${isMembersPopoverOpen ? 'z-[60]' : 'z-20'}\`}>
        <label className="block text-xs font-medium text-slate-200 mb-2">
          Membros
        </label>
        <div className="flex items-start gap-4 flex-wrap pb-2">
          {(() => {
            const getGroup = (emp?: Employee) => {
              if (!emp) return 3;
              if (emp.name === 'Felipe Mota') return 0;
              if (emp.role === 'Admin') return 1;
              if (emp.role === 'Gestor') return 2;
              return 3;
            };

            const sortedMembers = [...taskMembers].sort((a, b) => {
              const empA = employees.find((e) => e.id === a.id);
              const empB = employees.find((e) => e.id === b.id);
              const groupA = getGroup(empA);
              const groupB = getGroup(empB);

              if (groupA !== groupB) {
                return groupA - groupB;
              }
              return (empA?.name || '').localeCompare(empB?.name || '');
            });

            return sortedMembers.map((member) => {
              const emp = employees.find((e) => e.id === member.id);
              if (!emp) return null;
              return (
                <div
                  key={member.id}
                  className="relative flex group cursor-pointer shrink-0 active:scale-95 transition-transform"
                  onClick={() => handleRemoveMember(member.id)}
                  title={\`\${emp.name} (Clique para remover)\`}
                >
                  <Avatar
                    src={emp.avatarUrl}
                    name={emp.name}
                    alt={emp.name}
                    size="md"
                    ring
                    className="!w-9 !h-9 ring-2 ring-[#E4007E]/60 group-hover:ring-rose-500 transition-all shadow-xs text-xs font-semibold"
                  />
                  <div className="absolute -top-1 -right-1 bg-rose-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <X className="w-2.5 h-2.5" />
                  </div>
                </div>
              );
            });
          })()}

          {/* Add Member Button */}
          <div className="flex flex-col gap-1.5 items-center">
            <div className="relative flex shrink-0">
              <button
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
        {isMembersPopoverOpen && (
          <>
            <div
              className="fixed inset-0 z-[55] backdrop-blur-[2px]"
              onClick={() => setIsMembersPopoverOpen(false)}
            />
            <div className="absolute bottom-0 left-0 right-0 w-full bg-[#141414] border-t border-l border-[#2A2A2A] rounded-tl-2xl shadow-[0_-20px_50px_rgba(0,0,0,0.5)] p-4 sm:p-6 z-[60] animate-in slide-in-from-bottom-12 duration-200 flex flex-col max-h-[85vh]">
              <div className="flex items-center justify-between pb-3 border-b border-[#2E2E2E] mb-3">
                <div className="w-5" />
                <h4 className="text-sm font-semibold text-center text-white">
                  Membros
                </h4>
                <button
                  type="button"
                  onClick={() => setIsMembersPopoverOpen(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Buscar membros..."
                    value={memberSearchQuery}
                    onChange={(e) => setMemberSearchQuery(e.target.value)}
                    className="w-full p-2.5 bg-[#1C1C1C] border border-[#2E2E2E] focus:border-[#E4007E] rounded-xl text-xs text-white placeholder-slate-400 font-medium focus:outline-none transition-all"
                  />
                </div>

                <div className="text-[11px] font-bold text-slate-400 pt-1">Membros do Time</div>

                <div className="space-y-1 max-h-[60vh] overflow-y-auto pr-1">
                  {employees
                    .filter((emp) =>
                      emp.name.toLowerCase().includes(memberSearchQuery.toLowerCase())
                    )
                    .map((emp) => {
                      const isSelected = taskMembers.some((m) => m.id === emp.id);
                      return (
                        <div
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
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Clientes */}
      <div className={\`static \${isLabelsPopoverOpen ? 'z-[60]' : 'z-20'}\`}>
        <label className="block text-xs font-medium text-slate-200 mb-2">
          Clientes <span className="text-rose-500">*</span>
        </label>
        <div className="flex items-center gap-2 flex-wrap">
          {selectedLabels.length > 0 && selectedLabels.map((lbl) => {
            const clientObj = projects.find(
              (p) => p.name.toLowerCase().trim() === lbl.toLowerCase().trim()
            );
            return (
              <div
                key={lbl}
                onClick={() => handleToggleLabel(lbl)}
                className="relative flex group cursor-pointer shrink-0 active:scale-95 transition-transform"
                title={\`\${lbl} (Clique para remover)\`}
              >
                <div className="w-9 h-9 rounded-full bg-[#141414] border-2 border-[#E4007E]/60 group-hover:border-rose-500 transition-all flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                  {clientObj?.logoUrl ? (
                    <img
                      src={clientObj.logoUrl}
                      alt={lbl}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-tr from-[#E4007E] to-[#E94E18] text-white flex items-center justify-center font-bold text-xs">
                      {lbl.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="absolute -top-1 -right-1 bg-rose-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <X className="w-2.5 h-2.5" />
                </div>
              </div>
            );
          })}

          <button
            type="button"
            onClick={() => {
              setIsLabelsPopoverOpen(!isLabelsPopoverOpen);
              setIsMembersPopoverOpen(false);
            }}
            className="w-9 h-9 rounded-full bg-[#1A1A1A] hover:bg-[#222] border border-[#333] hover:border-[#E4007E] border-dashed text-slate-400 hover:text-white flex items-center justify-center transition-all shadow-sm active:scale-95 shrink-0"
            title="Adicionar Cliente"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Clientes Popover Dropdown */}
        {isLabelsPopoverOpen && (
          <>
            <div
              className="fixed inset-0 z-[55] backdrop-blur-[2px]"
              onClick={() => setIsLabelsPopoverOpen(false)}
            />
            <div className="absolute bottom-0 left-0 right-0 w-full bg-[#141414] border-t border-l border-[#2A2A2A] rounded-tl-2xl shadow-[0_-20px_50px_rgba(0,0,0,0.5)] p-4 sm:p-6 z-[60] animate-in slide-in-from-bottom-12 duration-200 flex flex-col max-h-[85vh]">
              <div className="flex items-center justify-between pb-3 border-b border-[#262626] mb-3">
                <div className="w-5" />
                <h4 className="text-sm font-semibold text-center text-white">
                  Clientes
                </h4>
                <button
                  type="button"
                  onClick={() => setIsLabelsPopoverOpen(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Buscar cliente..."
                    value={labelSearchQuery}
                    onChange={(e) => setLabelSearchQuery(e.target.value)}
                    className="w-full p-2.5 bg-[#1C1C1C] border border-[#2E2E2E] focus:border-[#E4007E] rounded-xl text-xs text-white placeholder-slate-400 font-medium focus:outline-none transition-all"
                  />
                </div>

                <div className="space-y-1 max-h-[60vh] overflow-y-auto pr-1">
                  {projects
                    .filter((c) => {
                      const id = (c.id || '').toLowerCase();
                      const cat = (c.category || '').toLowerCase();
                      const name = (c.name || '').toLowerCase();
                      const isSystem =
                        id === 'system-settings' ||
                        id === 'google-drive-token' ||
                        id.startsWith('system-') ||
                        cat === 'system' ||
                        name.includes('google drive') ||
                        name.includes('auth token');
                      return !isSystem && name.includes(labelSearchQuery.toLowerCase());
                    })
                    .map((c) => {
                      const isSelected = selectedLabels.some(
                        (l) => l.toLowerCase() === c.name.toLowerCase()
                      );
                      return (
                        <div
                          key={c.id}
                          onClick={() => handleToggleLabel(c.name)}
                          className={\`flex items-center gap-2.5 p-2 rounded-xl cursor-pointer transition-colors \${
                            isSelected ? 'bg-[#262626] border border-[#E4007E]/50' : 'hover:bg-[#1C1C1C] border border-transparent'
                          }\`}
                        >
                          <div className={\`w-4 h-4 rounded border flex items-center justify-center shrink-0 \${isSelected ? 'bg-gradient-to-r from-[#E4007E] to-[#E94E18] border-transparent' : 'border-[#3E3E3E]'}\`}>
                            {isSelected && <Check className="w-3 h-3 text-white stroke-[3]" />}
                          </div>

                          <div className="w-7 h-7 rounded-lg bg-[#101010] border border-[#2E2E2E] flex items-center justify-center overflow-hidden shrink-0 p-0.5">
                            {c.logoUrl ? (
                              <img
                                src={c.logoUrl}
                                alt={c.name}
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <div className="w-full h-full rounded-md bg-gradient-to-tr from-[#E4007E] to-[#E94E18] text-white flex items-center justify-center font-semibold text-[10px]">
                                {c.name.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                          </div>

                          <div className="truncate flex-1 min-w-0">
                            <span className="font-bold text-xs block truncate text-white">{c.name}</span>
                            {c.category && (
                              <span className="text-[10px] text-slate-400 block truncate">{c.category}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
`

fs.writeFileSync('src/components/modals/task/components/TaskMembersAndClients.tsx', content);

