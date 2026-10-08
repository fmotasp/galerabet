import React from 'react';
import { Users, Star, ChevronDown, Check, CheckCircle2, Plus } from 'lucide-react';
import { Employee } from '../../types';
import { CurrentUserType } from '../../context/AuthContext';
import { isDesignerOrVideomaker } from '../../lib/taskUtils';
import { useDropdownA11y } from '../../hooks/useDropdownA11y';

export interface RegisteredClient {
  id: string;
  name: string;
  color: string;
  icon?: string;
}

export interface TasksFilterToolbarProps {
  onNewTask?: () => void;
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
  onNewTask,
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
  const [isClientDropdownOpen, setIsClientDropdownOpen] = React.useState(false);
  useDropdownA11y(isClientDropdownOpen, () => setIsClientDropdownOpen(false));
  const [clientFilterSearch, setClientFilterSearch] = React.useState('');

  return (
    <div className="flex flex-row items-center justify-between gap-2 md:gap-3 w-full relative z-40">
      <div className="flex flex-row items-center gap-2 md:gap-3 w-auto min-w-0 flex-1 md:flex-none">
        {/* Client Filter (Responsive) */}
        <div className="flex flex-row items-center gap-2 flex-1 md:flex-none">
        <div className="relative md:hidden flex-1">
          <button aria-haspopup="true" aria-expanded={isClientDropdownOpen}
            type="button"
            onClick={() => setIsClientDropdownOpen(!isClientDropdownOpen)}
            className="flex items-center justify-between w-full md:min-w-[160px] h-10 gap-1.5 md:gap-2.5 bg-canvas hover:bg-chip border border-white/5 text-white rounded-xl px-2 md:px-3.5 text-[11px] md:text-xs font-bold transition-all active:scale-98 cursor-pointer whitespace-nowrap overflow-hidden"
          >
            <div className="flex items-center gap-2 truncate">
              {selectedClient === 'all' ? (
                <span>Todos os Clientes</span>
              ) : (
                (() => {
                  const client = registeredClients.find(c => c.id === selectedClient);
                  if (!client) return <span>Todos os Clientes</span>;
                  return (
                    <>
                      {client.icon ? (
                        <img
                          src={client.icon}
                          alt={client.name}
                          className="w-4 h-4 rounded-md object-contain shrink-0"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <span
                          className="w-4 h-4 rounded-md flex items-center justify-center text-[11px] font-semibold text-white shrink-0"
                          style={{ backgroundColor: client.color }}
                        >
                          {client.name.substring(0, 1).toUpperCase()}
                        </span>
                      )}
                      <span className="truncate max-w-[100px]">{client.name}</span>
                    </>
                  );
                })()
              )}
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-fg-muted transition-transform duration-200 ${isClientDropdownOpen ? 'rotate-180 text-brand' : ''}`} />
          </button>

          {isClientDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsClientDropdownOpen(false)}
              />
              <div data-menu className="absolute left-0 top-full mt-2 w-64 bg-raised rounded-2xl border border-white/5 shadow-2xl p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="relative mb-2 px-1">
                  <input
                    type="text"
                    placeholder="Buscar cliente..."
                    value={clientFilterSearch}
                    onChange={(e) => setClientFilterSearch(e.target.value)}
                    className="w-full p-2 bg-surface border border-white/5 rounded-xl text-xs text-white placeholder-slate-500 font-medium focus:outline-none focus:border-brand/50 focus:ring-2 focus:ring-brand/30 transition-all"
                  />
                </div>
                
                <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
                  <div
                    onClick={() => {
                      onClientChange('all');
                      setIsClientDropdownOpen(false);
                    }}
                    className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all ${
                      selectedClient === 'all'
                        ? 'bg-brand/15 text-brand font-bold border border-brand/30'
                        : 'text-fg-muted hover:bg-line hover:text-white'
                    }`}
                  >
                    <span className="text-xs font-semibold">Todos os Clientes</span>
                    {selectedClient === 'all' && <Check className="w-3.5 h-3.5 text-brand stroke-[3]" />}
                  </div>
                  
                  <div className="h-px bg-white/5 my-1.5" />

                  {registeredClients
                    .filter(c => c.name.toLowerCase().includes(clientFilterSearch.toLowerCase()))
                    .map((client) => {
                      const isSelected = selectedClient === client.id;
                      return (
                        <div
                          key={client.id}
                          onClick={() => {
                            onClientChange(isSelected ? 'all' : client.id);
                            setIsClientDropdownOpen(false);
                          }}
                          className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-brand/15 text-brand font-bold border border-brand/30'
                              : 'text-fg-muted hover:bg-line hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {client.icon ? (
                              <img
                                src={client.icon}
                                alt={client.name}
                                className="w-5 h-5 rounded-md object-contain shrink-0"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            ) : (
                              <span
                                className="w-5 h-5 rounded-md flex items-center justify-center text-[11px] font-semibold text-white shrink-0"
                                style={{ backgroundColor: client.color }}
                              >
                                {client.name.substring(0, 1).toUpperCase()}
                              </span>
                            )}
                            <span className="text-xs font-semibold truncate">{client.name}</span>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-brand stroke-[3] shrink-0" />}
                        </div>
                      );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

          {/* Desktop Filter (Icon Buttons) */}
          <div className="hidden md:flex flex-nowrap items-center bg-canvas p-1 rounded-xl gap-1 border border-white/5 overflow-x-auto min-w-0 [scrollbar-hide::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <button
              onClick={() => onClientChange('all')}
              aria-label="Filtrar por todos os clientes"
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedClient === 'all'
                  ? 'bg-gradient-to-r from-brand to-brand-alt text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-chip'
              }`}
              title="Todos os Clientes"
            >
              Todos
            </button>

            {registeredClients.map((client) => {
              const isSelected = selectedClient === client.id;
              return (
                <button
                  key={client.id}
                  onClick={() => onClientChange(isSelected ? 'all' : client.id)}
                  aria-label={`Filtrar por cliente ${client.name}`}
                  className={`flex items-center shrink-0 gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-brand to-brand-alt text-white shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-chip'
                  }`}
                  title={`Filtrar por ${client.name}`}
                >
                  {client.icon ? (
                    <img
                      src={client.icon}
                      alt={client.name}
                      className="w-4 h-4 rounded-md object-contain shrink-0 drop-shadow-xs"
                      onError={(e) => {
                        const target = e.currentTarget;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent && !parent.querySelector('.client-fallback-badge')) {
                          const span = document.createElement('span');
                          span.className = 'client-fallback-badge w-4 h-4 rounded-md flex items-center justify-center text-[11px] font-semibold text-white shrink-0';
                          span.style.backgroundColor = client.color || '#10B981';
                          span.textContent = client.name.substring(0, 1).toUpperCase();
                          parent.insertBefore(span, target);
                        }
                      }}
                    />
                  ) : (
                    <span
                      className="w-4 h-4 rounded-md flex items-center justify-center text-[11px] font-semibold text-white shrink-0"
                      style={{ backgroundColor: client.color }}
                    >
                      {client.name.substring(0, 1).toUpperCase()}
                    </span>
                  )}
                  <span className="truncate max-w-[100px] hidden lg:block">{client.name}</span>
                </button>
              );
            })}
          </div>

        </div>

        {/* Custom Modern Member Filter Dropdown */}
        <div className="relative flex-1 md:flex-none">
          <button
            type="button"
            onClick={onMemberDropdownToggle}
            className="flex items-center justify-between md:justify-start w-full h-10 gap-1.5 md:gap-2.5 bg-canvas hover:bg-chip border border-white/5 text-white rounded-xl px-2 md:px-3.5 text-[11px] md:text-xs font-bold transition-all active:scale-98 cursor-pointer whitespace-nowrap overflow-hidden"
          >
            {selectedMember === 'all' && (
              <div className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-brand" />
                <span>Todos os Membros</span>
              </div>
            )}
            {selectedMember === 'mine' && (
              <div className="flex items-center gap-2 text-brand">
                <Star className="w-3.5 h-3.5 fill-brand text-brand" />
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
                    <div className="w-4 h-4 rounded-full bg-line border border-white/5 text-[11px] font-semibold flex items-center justify-center text-brand">
                      {emp.initials}
                    </div>
                  )}
                  <span className="truncate max-w-[140px]">{emp.name}</span>
                </div>
              );
            })()}
            <ChevronDown className={`w-3.5 h-3.5 text-fg-muted transition-transform duration-200 ${isMemberDropdownOpen ? 'rotate-180 text-brand' : ''}`} />
          </button>

          {isMemberDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={onMemberDropdownClose}
              />
              <div className="absolute left-0 top-full mt-2 w-72 bg-raised rounded-2xl border border-white/5 shadow-2xl p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                {/* Search Member */}
                <div className="relative mb-2 px-1">
                  <input
                    type="text"
                    placeholder="Buscar membro..."
                    value={memberFilterSearch}
                    onChange={(e) => onMemberFilterSearchChange(e.target.value)}
                    className="w-full p-2 bg-surface border border-white/5 rounded-xl text-xs text-white placeholder-slate-500 font-medium focus:outline-none focus:border-brand/50 focus:ring-2 focus:ring-brand/30 transition-all"
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
                        ? 'bg-brand/15 text-brand font-bold border border-brand/30'
                        : 'text-fg-muted hover:bg-line hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-line flex items-center justify-center text-brand">
                        <Users className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-semibold">Todos os Membros</span>
                    </div>
                    {selectedMember === 'all' && <Check className="w-3.5 h-3.5 text-brand stroke-[3]" />}
                  </div>

                  {/* Mine option */}
                  <div
                    onClick={() => {
                      onMemberChange('mine');
                      onMemberDropdownClose();
                    }}
                    className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all ${
                      selectedMember === 'mine'
                        ? 'bg-brand/15 text-brand font-bold border border-brand/30'
                        : 'text-fg-muted hover:bg-line hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-brand/20 flex items-center justify-center text-brand">
                        <Star className="w-3.5 h-3.5 fill-brand" />
                      </div>
                      <div className="truncate">
                        <span className="text-xs font-semibold block">Minhas Atividades</span>
                        <span className="text-[11px] text-brand/80 block">
                          {currentUser?.name || currentUser?.username || 'Minhas Tarefas'}
                        </span>
                      </div>
                    </div>
                    {selectedMember === 'mine' && <Check className="w-3.5 h-3.5 text-brand stroke-[3]" />}
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
                              ? 'bg-brand/15 text-brand font-bold border border-brand/30'
                              : 'text-fg-muted hover:bg-line hover:text-white'
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
                              <div className="w-6 h-6 rounded-full bg-line text-brand font-semibold text-[11px] flex items-center justify-center shrink-0">
                                {emp.initials}
                              </div>
                            )}
                            <div className="min-w-0">
                              <span className="text-xs font-semibold block truncate">
                                {emp.name}
                              </span>
                              <span className="text-[11px] text-fg-muted block truncate">
                                {emp.role || 'Membro'}
                              </span>
                            </div>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-brand stroke-[3] shrink-0" />}
                        </div>
                      );
                    })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      

      <div className="hidden md:flex items-center gap-3 shrink-0">
        {/* Toggle Switch para Exibir/Ocultar Coluna de Concluídas */}
        
          <button aria-label="Exibir Concluídas"
            id="toggle-done-column" title="Exibir Concluídas"
            type="button"
            role="switch"
            aria-checked={showDoneColumn}
            onClick={onShowDoneColumnToggle}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              showDoneColumn ? 'bg-emerald-500' : 'bg-line-hover'
            }`}
          >
            <span
              aria-hidden="true"
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                showDoneColumn ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>

        <div className="text-xs text-slate-400 font-medium hidden sm:block">
          Exibindo <span className="font-bold text-white">{totalFilteredTasks}</span> tarefas
        </div>
      </div>
    </div>
  );
});
