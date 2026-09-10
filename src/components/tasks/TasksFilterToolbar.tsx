import React from 'react';
import { Users, Star, ChevronDown, Check, CheckCircle2 } from 'lucide-react';
import { Employee } from '../../types';
import { CurrentUserType } from '../../context/AuthContext';
import { isDesignerOrVideomaker } from '../../lib/taskUtils';

export interface RegisteredClient {
  id: string;
  name: string;
  color: string;
  icon?: string;
}

export interface TasksFilterToolbarProps {
  registeredClients: RegisteredClient[];
  selectedClient: string;
  onClientChange: (clientId: string) => void;

  employees: Employee[];
  selectedMember: string;
  onMemberChange: (memberId: string) => void;

  isMemberDropdownOpen: boolean;
  onMemberDropdownToggle: () => void;
  onMemberDropdownClose: () => void;

  memberFilterSearch: string;
  onMemberFilterSearchChange: (search: string) => void;

  currentUser: CurrentUserType | null;

  showDoneColumn: boolean;
  onShowDoneColumnToggle: () => void;

  totalFilteredTasks: number;
}

export const TasksFilterToolbar: React.FC<TasksFilterToolbarProps> = React.memo(({
  registeredClients,
  selectedClient,
  onClientChange,
  employees,
  selectedMember,
  onMemberChange,
  isMemberDropdownOpen,
  onMemberDropdownToggle,
  onMemberDropdownClose,
  memberFilterSearch,
  onMemberFilterSearchChange,
  currentUser,
  showDoneColumn,
  onShowDoneColumnToggle,
  totalFilteredTasks,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 bg-[#181818] p-3 rounded-2xl border border-[#2A2A2A]">
      <div className="flex flex-wrap items-center gap-3">
        {/* Client Filter (Icon Buttons) */}
        <div className="flex items-center bg-[#222222] p-1 rounded-xl gap-1 border border-[#303030]">
          <button
            onClick={() => onClientChange('all')}
            aria-label="Filtrar por todos os clientes"
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedClient === 'all'
                ? 'bg-gradient-to-r from-[#E4007E] to-[#E94E18] text-white shadow-xs'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Todos os Clientes
          </button>

          {registeredClients.map((client) => {
            const isSelected = selectedClient === client.id;
            return (
              <button
                key={client.id}
                onClick={() => onClientChange(isSelected ? 'all' : client.id)}
                aria-label={`Filtrar por cliente ${client.name}`}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-r from-[#E4007E] to-[#E94E18] text-white shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-[#303030]'
                }`}
                title={`Filtrar por ${client.name}`}
              >
                {client.icon ? (
                  <img
                    src={client.icon}
                    alt={client.name}
                    className="w-4 h-4 rounded-md object-contain shrink-0 drop-shadow-xs"
                    onError={(e) => {
                      // Se a imagem falhar, esconde e mostra fallback
                      const target = e.currentTarget;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent && !parent.querySelector('.client-fallback-badge')) {
                        const span = document.createElement('span');
                        span.className = 'client-fallback-badge w-4 h-4 rounded-md flex items-center justify-center text-[9px] font-black text-white shrink-0';
                        span.style.backgroundColor = client.color || '#10B981';
                        span.textContent = client.name.substring(0, 1).toUpperCase();
                        parent.insertBefore(span, target);
                      }
                    }}
                  />
                ) : (
                  <span
                    className="w-4 h-4 rounded-md flex items-center justify-center text-[9px] font-black text-white shrink-0"
                    style={{ backgroundColor: client.color }}
                  >
                    {client.name.substring(0, 1).toUpperCase()}
                  </span>
                )}
                <span>{client.name}</span>
              </button>
            );
          })}
        </div>

        {/* Custom Modern Member Filter Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={onMemberDropdownToggle}
            className="flex items-center gap-2.5 bg-[#222222] hover:bg-[#2A2A2A] border border-[#303030] text-white rounded-xl px-3.5 py-2 text-xs font-bold transition-all active:scale-98 cursor-pointer"
          >
            {selectedMember === 'all' && (
              <div className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-[#E4007E]" />
                <span>Todos os Membros</span>
              </div>
            )}
            {selectedMember === 'mine' && (
              <div className="flex items-center gap-2 text-[#E4007E]">
                <Star className="w-3.5 h-3.5 fill-[#E4007E] text-[#E4007E]" />
                <span>Minhas Atividades</span>
              </div>
            )}
            {selectedMember !== 'all' && selectedMember !== 'mine' && (() => {
              const emp = employees.find((e) => e.id === selectedMember);
              if (!emp) return <span>Todos os Membros</span>;
              return (
                <div className="flex items-center gap-2">
                  {emp.avatarUrl ? (
                    <img src={emp.avatarUrl} alt={emp.name} className="w-4 h-4 rounded-full object-cover" />
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-[#262626] border border-[#303030] text-[9px] font-black flex items-center justify-center text-[#E4007E]">
                      {emp.initials}
                    </div>
                  )}
                  <span className="truncate max-w-[140px]">{emp.name}</span>
                </div>
              );
            })()}
            <ChevronDown className={`w-3.5 h-3.5 text-[#A0A0A0] transition-transform duration-200 ${isMemberDropdownOpen ? 'rotate-180 text-[#E4007E]' : ''}`} />
          </button>

          {isMemberDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={onMemberDropdownClose}
              />
              <div className="absolute left-0 top-full mt-2 w-72 bg-[#1C1C1C] rounded-2xl border border-[#303030] shadow-2xl p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                {/* Search Member */}
                <div className="relative mb-2 px-1">
                  <input
                    type="text"
                    placeholder="Buscar membro..."
                    value={memberFilterSearch}
                    onChange={(e) => onMemberFilterSearchChange(e.target.value)}
                    className="w-full p-2 bg-[#141414] border border-[#2A2A2A] rounded-xl text-xs text-white placeholder-slate-500 font-medium focus:outline-none focus:border-[#E4007E] transition-all"
                  />
                </div>

                <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
                  {/* All option */}
                  <div
                    onClick={() => {
                      onMemberChange('all');
                      onMemberDropdownClose();
                    }}
                    className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all ${
                      selectedMember === 'all'
                        ? 'bg-[#E4007E]/15 text-[#E4007E] font-bold border border-[#E4007E]/30'
                        : 'text-[#A0A0A0] hover:bg-[#262626] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-[#262626] flex items-center justify-center text-[#E4007E]">
                        <Users className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-semibold">Todos os Membros</span>
                    </div>
                    {selectedMember === 'all' && <Check className="w-3.5 h-3.5 text-[#E4007E] stroke-[3]" />}
                  </div>

                  {/* Mine option */}
                  <div
                    onClick={() => {
                      onMemberChange('mine');
                      onMemberDropdownClose();
                    }}
                    className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all ${
                      selectedMember === 'mine'
                        ? 'bg-[#E4007E]/15 text-[#E4007E] font-bold border border-[#E4007E]/30'
                        : 'text-[#A0A0A0] hover:bg-[#262626] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-[#E4007E]/20 flex items-center justify-center text-[#E4007E]">
                        <Star className="w-3.5 h-3.5 fill-[#E4007E]" />
                      </div>
                      <div className="truncate">
                        <span className="text-xs font-semibold block">Minhas Atividades</span>
                        <span className="text-[10px] text-[#E4007E]/80 block">
                          {currentUser?.name || currentUser?.username || 'Minhas Tarefas'}
                        </span>
                      </div>
                    </div>
                    {selectedMember === 'mine' && <Check className="w-3.5 h-3.5 text-[#E4007E] stroke-[3]" />}
                  </div>

                  <div className="h-px bg-white/5 my-1.5" />

                  {/* Employees list: apenas Designers e Videomakers */}
                  {employees
                    .filter((emp) => isDesignerOrVideomaker(emp))
                    .filter((emp) =>
                      emp.name.toLowerCase().includes(memberFilterSearch.toLowerCase()) ||
                      (emp.role && emp.role.toLowerCase().includes(memberFilterSearch.toLowerCase()))
                    )
                    .map((emp) => {
                      const isSelected = selectedMember === emp.id;
                      return (
                        <div
                          key={emp.id}
                          onClick={() => {
                            onMemberChange(emp.id);
                            onMemberDropdownClose();
                          }}
                          className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-[#E4007E]/15 text-[#E4007E] font-bold border border-[#E4007E]/30'
                              : 'text-[#A0A0A0] hover:bg-[#262626] hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {emp.avatarUrl ? (
                              <img
                                src={emp.avatarUrl}
                                alt={emp.name}
                                className="w-6 h-6 rounded-full object-cover shrink-0"
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-[#262626] text-[#E4007E] font-black text-[10px] flex items-center justify-center shrink-0">
                                {emp.initials}
                              </div>
                            )}
                            <div className="min-w-0">
                              <span className="text-xs font-semibold block truncate">
                                {emp.name}
                              </span>
                              <span className="text-[10px] text-[#A0A0A0] block truncate">
                                {emp.role || 'Membro'}
                              </span>
                            </div>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-[#E4007E] stroke-[3] shrink-0" />}
                        </div>
                      );
                    })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Toggle Switch para Exibir/Ocultar Coluna de Concluídas */}
        <div className="flex items-center gap-2 bg-[#222222] px-3 py-1.5 rounded-xl border border-[#303030]">
          <label
            htmlFor="toggle-done-column"
            className="text-xs font-bold text-slate-200 select-none cursor-pointer flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Exibir Concluídas</span>
          </label>
          <button
            id="toggle-done-column"
            type="button"
            role="switch"
            aria-checked={showDoneColumn}
            onClick={onShowDoneColumnToggle}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              showDoneColumn ? 'bg-emerald-500' : 'bg-[#333333]'
            }`}
          >
            <span
              aria-hidden="true"
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                showDoneColumn ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="text-xs text-slate-400 font-medium hidden sm:block">
          Exibindo <span className="font-bold text-white">{totalFilteredTasks}</span> tarefas
        </div>
      </div>
    </div>
  );
});
