import React, { useState } from 'react';
import { Plus, X, Check, Building2, ChevronDown } from 'lucide-react';
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
    <div
      className={`grid grid-cols-1 sm:grid-cols-2 gap-4 items-start relative ${
        isMembersPopoverOpen || isLabelsPopoverOpen ? 'z-50' : 'z-10'
      }`}
    >
      {/* Membros */}
      <div className={`relative ${isMembersPopoverOpen ? 'z-50' : 'z-20'}`}>
        <label className="block text-xs font-bold text-slate-200 mb-2">
          Membros
        </label>
        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-2 -mb-2">
          {[...taskMembers]
            .sort((a, b) => {
              const empA = employees.find(
                (emp) =>
                  (a.id && emp.id && emp.id === a.id) ||
                  (a.name && emp.name && emp.name.toLowerCase().trim() === a.name.toLowerCase().trim())
              );
              const empB = employees.find(
                (emp) =>
                  (b.id && emp.id && emp.id === b.id) ||
                  (b.name && emp.name && emp.name.toLowerCase().trim() === b.name.toLowerCase().trim())
              );

              const getGroup = (emp?: Employee) => {
                if (!emp) return 3;
                const role = (emp.role || '').toLowerCase();
                const roleType = (emp.roleType || '').toLowerCase();
                
                if (role.includes('gestor') || role.includes('gerente') || role.includes('manager') || roleType === 'manager' || roleType === 'admin') return 1;
                if (role.includes('design') || role.includes('video') || role.includes('vídeo') || role.includes('maker')) return 2;
                return 3;
              };

              return getGroup(empA) - getGroup(empB);
            })
            .map((m) => {
            // Cruza com funcionários cadastrados para obter avatar atualizado
            const matchedEmp = employees.find(
              (emp) =>
                (m.id && emp.id && emp.id === m.id) ||
                (m.name && emp.name && emp.name.toLowerCase().trim() === m.name.toLowerCase().trim())
            );
            const resolvedAvatar = m.avatarUrl || matchedEmp?.avatarUrl || '';
            return (
              <div
                key={m.id}
                className="relative group cursor-pointer shrink-0"
                onClick={() => handleRemoveMember(m.id)}
                title={`${m.name} (Clique para remover)`}
              >
                <Avatar
                  src={resolvedAvatar}
                  name={m.name}
                  alt={m.name}
                  size="sm"
                  ring
                  className="!w-9 !h-9 ring-2 ring-[#E4007E]/60 group-hover:ring-rose-500 transition-all shadow-xs text-xs font-black"
                />
                <div className="absolute -top-1 -right-1 bg-rose-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <X className="w-2.5 h-2.5" />
                </div>
              </div>
            );
          })}

          {/* Add Member Button with Popover */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => {
                setIsMembersPopoverOpen(!isMembersPopoverOpen);
                setIsLabelsPopoverOpen(false);
              }}
              className="w-9 h-9 rounded-full bg-[#1C1C1C] border border-[#2E2E2E] hover:border-[#E4007E] flex items-center justify-center text-slate-200 hover:text-white transition-all shadow-sm hover:scale-105 active:scale-95 cursor-pointer"
              title="Adicionar Membro"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
            </button>

            {/* Members Popover Dropdown */}
            {isMembersPopoverOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsMembersPopoverOpen(false)}
                />
                <div className="absolute left-0 top-11 w-72 bg-[#141414] border border-[#2E2E2E] rounded-2xl shadow-2xl p-3.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="flex items-center justify-between pb-3 border-b border-[#2E2E2E] mb-3">
                    <div className="w-5" />
                    <h4 className="text-sm font-black text-center text-white">
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

                    <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
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
                              className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-colors ${
                                isSelected
                                  ? 'bg-[#2E2E2E]/60 border border-[#E4007E]/40'
                                  : 'hover:bg-[#1C1C1C]'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <Avatar
                                  src={emp.avatarUrl}
                                  name={emp.name}
                                  alt={emp.name}
                                  size="xs"
                                  ring
                                  className={`!w-7 !h-7 ring-2 font-bold text-xs ${
                                    isSelected ? 'ring-[#E4007E]' : 'ring-[#2E2E2E]'
                                  }`}
                                />
                                <div className="truncate">
                                  <span className="font-bold text-xs block truncate text-slate-200">
                                    {emp.name}
                                  </span>
                                  <span className="text-[10px] text-slate-400 block truncate">
                                    {emp.role}
                                  </span>
                                </div>
                              </div>
                              {isSelected && (
                                <Check className="w-4 h-4 text-[#E4007E] shrink-0 stroke-[2.5]" />
                              )}
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
      </div>

      {/* Clientes */}
      <div className={`relative ${isLabelsPopoverOpen ? 'z-50' : 'z-20'}`}>
        <label className="block text-xs font-bold text-slate-200 mb-2">
          Clientes <span className="text-rose-500">*</span>
        </label>
        <div className="flex items-center gap-2 flex-wrap">
          {selectedLabels.length > 0 ? (
            selectedLabels.map((lbl) => {
              const clientObj = projects.find(
                (p) => p.name.toLowerCase().trim() === lbl.toLowerCase().trim()
              );
              return (
                <div
                  key={lbl}
                  onClick={() => {
                    setIsLabelsPopoverOpen(!isLabelsPopoverOpen);
                    setIsMembersPopoverOpen(false);
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold tracking-wide shadow-xs inline-flex items-center gap-2 cursor-pointer bg-[#1C1C1C] border border-[#2E2E2E] hover:border-[#E4007E]/60 text-slate-200 hover:text-white transition-all group/client"
                >
                  <div className="w-5 h-5 rounded-md bg-[#141414] border border-[#2E2E2E] flex items-center justify-center overflow-hidden shrink-0 p-0.5">
                    {clientObj?.logoUrl ? (
                      <img
                        src={clientObj.logoUrl}
                        alt={lbl}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full rounded-xs bg-gradient-to-tr from-[#E4007E] to-[#E94E18] text-white flex items-center justify-center font-black text-[9px]">
                        {lbl.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <span className="font-extrabold text-white truncate max-w-[130px]">{lbl}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400 group-hover/client:text-white ml-0.5" />
                </div>
              );
            })
          ) : (
            <button
              type="button"
              onClick={() => {
                setIsLabelsPopoverOpen(!isLabelsPopoverOpen);
                setIsMembersPopoverOpen(false);
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold tracking-wide shadow-xs inline-flex items-center gap-2 cursor-pointer bg-[#1C1C1C] border border-[#2E2E2E] text-slate-300 hover:text-white hover:border-[#E4007E] transition-all"
            >
              <Building2 className="w-3.5 h-3.5 text-[#E4007E]" />
              <span>Selecionar Cliente</span>
              <ChevronDown className="w-3 h-3 opacity-60 ml-0.5" />
            </button>
          )}

          {selectedLabels.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setIsLabelsPopoverOpen(!isLabelsPopoverOpen);
                setIsMembersPopoverOpen(false);
              }}
              className="w-8 h-8 rounded-full bg-[#1C1C1C] border border-[#2E2E2E] hover:border-[#E4007E] flex items-center justify-center text-slate-200 hover:text-white transition-all shadow-sm hover:scale-105 active:scale-95 cursor-pointer"
              title="Adicionar outro cliente"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
            </button>
          )}

          {/* Clientes Popover Dropdown */}
          {isLabelsPopoverOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsLabelsPopoverOpen(false)}
              />
              <div className="absolute left-0 top-11 w-80 bg-[#141414] border border-[#2A2A2A] rounded-2xl shadow-2xl p-3.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="flex items-center justify-between pb-3 border-b border-[#262626] mb-3">
                  <div className="w-5" />
                  <h4 className="text-sm font-black text-center text-white">
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

                  <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
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
                            className={`flex items-center gap-2.5 p-2 rounded-xl cursor-pointer transition-colors ${
                              isSelected ? 'bg-[#262626] border border-[#E4007E]/50' : 'hover:bg-[#1C1C1C] border border-transparent'
                            }`}
                          >
                            <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${isSelected ? 'bg-gradient-to-r from-[#E4007E] to-[#E94E18] border-transparent' : 'border-[#3E3E3E]'}`}>
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
                                <div className="w-full h-full rounded-md bg-gradient-to-tr from-[#E4007E] to-[#E94E18] text-white flex items-center justify-center font-black text-[10px]">
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
    </div>
  );
};
