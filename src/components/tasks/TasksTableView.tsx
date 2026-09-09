import React from 'react';
import {
  CheckSquare,
  ChevronDown,
  Download,
  Filter,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import { Task, TaskStatus, Employee, SpineStatusConfig } from '../../types';
import { getTaskOverdueDays } from '../../lib/taskDateUtils';
import { TaskMembersStack } from './TaskMembersStack';

export interface TasksTableViewProps {
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  sortedTasks: Task[];
  paginatedTasks: Task[];
  visibleTasksCount: number;
  onLoadMore: () => void;
  exportTasksToCSV: () => void;
  sortBy: 'default' | 'title' | 'dueDate' | 'points';
  onSortByChange: (sort: 'default' | 'title' | 'dueDate' | 'points') => void;
  setIsNewTaskModalOpen: (open: boolean) => void;
  selectedClient: string;
  onClientClear: () => void;
  selectedMember: string;
  onMemberClear: () => void;
  onClearAllFilters: () => void;
  registeredClients: Array<{ id: string; name: string }>;
  employees: Employee[];
  spineStatuses: SpineStatusConfig[];
  getSpineStatusConfig: (statusId: string) => { label: string; color?: string; bg?: string };
  moveTaskStatus: (taskId: string, newStatus: TaskStatus) => void;
  setEditingTask: (task: Task) => void;
  deleteTask: (taskId: string) => void;
}

export const TasksTableView: React.FC<TasksTableViewProps> = React.memo(({
  searchQuery,
  onSearchQueryChange,
  sortedTasks,
  paginatedTasks,
  visibleTasksCount,
  onLoadMore,
  exportTasksToCSV,
  sortBy,
  onSortByChange,
  setIsNewTaskModalOpen,
  selectedClient,
  onClientClear,
  selectedMember,
  onMemberClear,
  onClearAllFilters,
  registeredClients,
  employees,
  spineStatuses,
  getSpineStatusConfig,
  moveTaskStatus,
  setEditingTask,
  deleteTask,
}) => {
  return (
    <div className="space-y-6 w-full">
      {/* Action Bar (Search, Counter, Export, Sort, Add) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#181818] border border-[#2A2A2A] p-4 rounded-3xl shadow-xl">
        {/* Search Input & Total Tasks count */}
        <div className="flex items-center gap-4 flex-1">
          <div className="relative w-full max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar demandas..."
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#222222] border border-[#303030] rounded-2xl text-xs focus:outline-none focus:border-[#E4007E] text-white placeholder-slate-400 font-semibold shadow-inner transition-colors"
            />
          </div>
          <span className="text-xs text-slate-400 font-bold shrink-0">
            {sortedTasks.length} {sortedTasks.length === 1 ? 'demanda' : 'demandas'}
          </span>
        </div>

        {/* Right Side Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={exportTasksToCSV}
            aria-label="Exportar tarefas para CSV"
            className="px-4 py-2.5 bg-[#222222] hover:bg-[#282828] border border-[#303030] text-white rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>Exportar</span>
          </button>

          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => onSortByChange(e.target.value as 'default' | 'title' | 'dueDate' | 'points')}
              className="appearance-none pl-4 pr-10 py-2.5 bg-[#222222] hover:bg-[#282828] border border-[#303030] rounded-2xl text-xs font-bold text-white focus:outline-none focus:border-[#E4007E] cursor-pointer transition-colors"
            >
              <option value="default">Ordenar: padrão</option>
              <option value="title">Ordenar: nome</option>
              <option value="dueDate">Ordenar: prazo</option>
              <option value="points">Ordenar: pontos</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <button
            onClick={() => setIsNewTaskModalOpen(true)}
            aria-label="Adicionar Nova Demanda"
            className="px-5 py-2.5 bg-[#E4007E] hover:bg-[#c2006b] text-white rounded-2xl text-xs font-black shadow-md shadow-pink-600/10 transition-all active:scale-98 flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Nova Demanda</span>
          </button>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex flex-row items-center justify-between gap-4 px-1">
        <div className="flex flex-wrap items-center gap-2">
          {(selectedClient !== 'all' || selectedMember !== 'all' || searchQuery !== '') && (
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              {selectedClient !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#181818] border border-[#2A2A2A] text-white rounded-xl text-[10px] font-bold">
                  Cliente: {registeredClients.find((c) => c.id === selectedClient)?.name || selectedClient}
                  <button
                    onClick={onClientClear}
                    aria-label="Remover filtro de cliente"
                    className="text-slate-400 hover:text-white font-extrabold ml-1 cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              )}
              {selectedMember !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#181818] border border-[#2A2A2A] text-white rounded-xl text-[10px] font-bold">
                  Membro: {selectedMember === 'mine' ? 'Meus' : employees.find((e) => e.id === selectedMember)?.name || selectedMember}
                  <button
                    onClick={onMemberClear}
                    aria-label="Remover filtro de membro"
                    className="text-slate-400 hover:text-white font-extrabold ml-1 cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              )}
              <button
                onClick={onClearAllFilters}
                className="text-[10px] font-bold text-[#E4007E] hover:underline cursor-pointer"
              >
                Limpar todos
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Table View Container */}
      <div className="bg-[#181818] rounded-3xl border border-[#2A2A2A] shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#2A2A2A] text-[#E4007E] font-black text-[11px] uppercase tracking-wider bg-[#141414]">
                <th className="w-12 px-6 py-4">
                  <input
                    type="checkbox"
                    aria-label="Selecionar todas as tarefas"
                    className="rounded border-[#303030] text-[#E4007E] focus:ring-[#E4007E]/20 bg-[#222222] cursor-pointer"
                  />
                </th>
                <th className="px-6 py-4">Demanda & Projeto</th>
                <th className="px-6 py-4">Responsável</th>
                <th className="px-4 py-4">Categoria</th>
                <th className="px-4 py-4">Prazo</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#262626] font-medium text-white">
              {paginatedTasks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <CheckSquare className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <h3 className="text-base font-bold text-white">Nenhuma demanda encontrada</h3>
                    <p className="text-xs text-slate-400 mt-1">Não há tarefas correspondentes aos filtros selecionados.</p>
                  </td>
                </tr>
              ) : (
                paginatedTasks.map((task) => {
                  const statusConfig = getSpineStatusConfig(task.status);
                  
                  // Decode dynamic label color or fallback
                  const pillColor = `${statusConfig.bg || 'bg-slate-800'} ${statusConfig.color || 'text-slate-200'} border border-current/20`;

                  return (
                    <tr
                      key={task.id}
                      onClick={() => setEditingTask(task)}
                      className="hover:bg-[#222222]/50 transition-all cursor-pointer group"
                    >
                      {/* Checkbox */}
                      <td className="px-6 py-4.5" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          aria-label={`Selecionar tarefa ${task.title}`}
                          className="rounded border-[#303030] text-[#E4007E] focus:ring-[#E4007E]/20 bg-[#222222] cursor-pointer"
                        />
                      </td>

                      {/* Title & Project Subtitle */}
                      <td className="px-6 py-4.5">
                        <div className="flex flex-col min-w-[200px]">
                          <span className="font-extrabold text-white text-sm group-hover:text-[#E4007E] transition-colors">
                            {task.title}
                          </span>
                          <span className="text-[11px] text-slate-400 font-bold mt-0.5">
                            {task.projectName}
                          </span>
                        </div>
                      </td>

                      {/* Assignee / Customer Details */}
                      <td className="px-6 py-4.5">
                        <div className="flex items-center gap-3">
                          <TaskMembersStack task={task} />
                          <div className="flex flex-col">
                            <span className="text-white font-bold text-xs">
                              {task.assigneeName || 'Sem responsável'}
                            </span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              {task.assigneeInitials ? `${task.assigneeInitials}@empresa.com` : 'sem_email'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-4.5">
                        <span className="bg-[#222222] text-white px-2.5 py-1 rounded-xl font-bold text-[10px] uppercase tracking-wide border border-[#2E2E2E]">
                          {task.category || 'Geral'}
                        </span>
                      </td>

                      {/* Due Date & Delivery Date */}
                      <td className="px-4 py-4.5 font-bold text-xs">
                        <div className="flex flex-col gap-1">
                          {(() => {
                            const overdueDays = getTaskOverdueDays(task);
                            if (overdueDays > 0) {
                              return (
                                <span className="text-rose-400 font-bold text-[11px] bg-rose-950/70 px-2 py-0.5 rounded border border-rose-800/70 w-fit whitespace-nowrap" title={`Prazo previsto: ${task.dueDate}`}>
                                  Atrasada ({overdueDays}d)
                                </span>
                              );
                            }
                            return (
                              <span className="text-slate-300">
                                {task.dueDate && task.dueDate !== 'Sem prazo' ? task.dueDate : 'Sem prazo'}
                              </span>
                            );
                          })()}
                          {task.deliveredAt && (
                            <span className="text-[#00A723] font-bold text-[10px] flex items-center gap-1 bg-[#00A723]/15 px-2 py-0.5 rounded border border-[#00A723]/30 w-fit" title="Entregue em">
                              <CheckCircle2 className="w-2.5 h-2.5 text-[#00A723]" />
                              <span>Entregue: {task.deliveredAt}</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status Select dropdown styled like a badge */}
                      <td className="px-4 py-4.5" onClick={(e) => e.stopPropagation()}>
                        <div className="relative inline-block w-full min-w-[120px]">
                          <select
                            value={task.status}
                            onChange={(e) => moveTaskStatus(task.id, e.target.value as TaskStatus)}
                            className={`w-full py-1.5 pl-3 pr-8 rounded-full text-xs font-black border uppercase tracking-wider text-center appearance-none cursor-pointer transition-colors focus:outline-none ${pillColor}`}
                          >
                            {spineStatuses.map((status) => (
                              <option key={status.id} value={status.id} className="text-slate-800 bg-white">
                                {status.label}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="w-3 h-3 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setEditingTask(task)}
                            className="p-2 hover:bg-[#222222] rounded-xl text-slate-400 hover:text-white transition-colors"
                            title="Visualizar Detalhes"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Tem certeza que deseja excluir esta demanda?')) {
                                deleteTask(task.id);
                              }
                            }}
                            className="p-2 hover:bg-rose-950/20 rounded-xl text-slate-400 hover:text-rose-400 transition-colors"
                            title="Excluir Demanda"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {sortedTasks.length > visibleTasksCount && (
        <div className="flex justify-center pt-2">
          <button
            onClick={onLoadMore}
            className="px-6 py-2.5 bg-[#222222] hover:bg-[#E4007E] text-slate-200 hover:text-white rounded-2xl text-xs font-black transition-all shadow-xs flex items-center gap-1.5"
          >
            <span>Mostrar mais</span>
          </button>
        </div>
      )}
    </div>
  );
});
