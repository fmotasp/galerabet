import React from 'react';
import { Layers, ExternalLink } from 'lucide-react';
import { Task } from '../../types';
import { getTaskComplexity, getTaskRevisionsCount } from './reportsUtils';
import { isTaskOverdue, isTaskCompleted } from '../../lib/taskDateUtils';

interface ReportsEmployeeTaskListProps {
  tasks: Task[];
  spineStatuses: { id: string; label: string }[];
  onTaskClick: (task: Task) => void;
}

export const ReportsEmployeeTaskList: React.FC<ReportsEmployeeTaskListProps> = React.memo(
  ({ tasks, spineStatuses, onTaskClick }) => {
    return (
      <div className="p-5 sm:p-6 bg-[#101010] border-t border-[#262626] animate-in fade-in duration-150 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#E4007E]" />
            <span>Histórico de Demandas ({tasks.length})</span>
          </h4>
          <span className="text-[11px] text-slate-400 font-medium">
            Clique na tarefa para abrir detalhes
          </span>
        </div>

        {tasks.length === 0 ? (
          <div className="p-6 bg-[#181818] rounded-2xl border border-[#2A2A2A] text-center text-xs text-slate-400">
            Nenhuma demanda encontrada no período selecionado.
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {tasks.map((task) => {
              const complexity = getTaskComplexity(task);
              const revisions = getTaskRevisionsCount(task);
              const isOverdue = isTaskOverdue(task);
              const statusObj = spineStatuses.find((s) => s.id === task.status);

              return (
                <div
                  key={task.id}
                  onClick={() => onTaskClick(task)}
                  className="p-3.5 bg-[#181818] hover:bg-[#222222] border border-[#2A2A2A] hover:border-[#383838] rounded-2xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#E4007E] shrink-0" />
                    <div className="min-w-0">
                      <h5 className="text-xs font-bold text-white group-hover:text-[#E4007E] transition-colors truncate">
                        {task.title}
                      </h5>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        <span>{task.category || task.projectName || 'Geral'}</span>
                        {task.dueDate && (
                          <>
                            <span>•</span>
                            <span className={isOverdue ? 'text-rose-400 font-bold' : ''}>
                              Prazo: {task.dueDate}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 flex-wrap shrink-0">
                    {/* Badge de Complexidade */}
                    <span
                      className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold border ${complexity.color}`}
                    >
                      {complexity.label}
                    </span>

                    {/* Revisões */}
                    {revisions > 0 && (
                      <span className="px-2 py-0.5 bg-amber-950/60 border border-amber-800/50 text-amber-300 rounded-lg text-[10px] font-extrabold">
                        {revisions} rev{revisions > 1 ? 's' : ''}
                      </span>
                    )}

                    {/* Status da Tarefa */}
                    <span className="px-2.5 py-1 bg-[#222222] border border-[#303030] rounded-xl text-[10px] font-bold text-slate-300">
                      {statusObj?.label || task.status}
                    </span>

                    <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition-colors" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }
);

ReportsEmployeeTaskList.displayName = 'ReportsEmployeeTaskList';
