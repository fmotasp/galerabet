import React, { useState } from 'react';
import { MoreHorizontal, ChevronDown } from 'lucide-react';
import { Task } from '../../types';
import { Button } from '../ui';
import { getLabelColorHex } from '../tasks/TasksView';
import {
  isTaskOverdue,
  isTaskCompleted,
  getTaskOverdueDays,
} from '../../lib/taskDateUtils';
import { getIndicatorColor } from './dashboardUtils';

interface DashboardActiveTasksProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onAddTaskClick: () => void;
}

const getStatusBadge = (task: Task) => {
  const overdueDays = getTaskOverdueDays(task);
  if (overdueDays > 0) {
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-950/80 text-rose-300 border border-rose-800 whitespace-nowrap">
        Atrasada ({overdueDays}d)
      </span>
    );
  }
  if (isTaskCompleted(task)) {
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800 whitespace-nowrap">
        Concluída
      </span>
    );
  }
  switch (task.status) {
    case 'in_progress':
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-950/80 text-blue-300 border border-blue-800 whitespace-nowrap">
          Em progresso
        </span>
      );
    case 'in_review':
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-sky-950/80 text-sky-300 border border-sky-800 whitespace-nowrap">
          Em Aprovação
        </span>
      );
    case 'overdue':
      if (isTaskOverdue(task)) {
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-950/80 text-rose-300 border border-rose-800 whitespace-nowrap">
            Atrasada
          </span>
        );
      }
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-950/80 text-blue-300 border border-blue-800 whitespace-nowrap">
          Em progresso
        </span>
      );
    case 'blocked':
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700 whitespace-nowrap">
          Bloqueada
        </span>
      );
    case 'backlog':
    default:
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#011C39] text-slate-300 border border-slate-700 whitespace-nowrap">
          Backlog
        </span>
      );
  }
};

export const DashboardActiveTasks: React.FC<DashboardActiveTasksProps> = React.memo(
  ({ tasks, onTaskClick, onAddTaskClick }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
      <div className="bg-[#181818] rounded-2xl p-6 border border-[#2A2A2A] shadow-lg">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-white text-base sm:text-lg">Tarefas Ativas</h3>
            <span className="bg-[#222222] text-[#E4007E] border border-[#303030] text-xs font-bold px-2.5 py-0.5 rounded-full">
              {tasks.length} tarefas
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onAddTaskClick}
            className="text-slate-400 hover:text-white p-1"
            title="Adicionar tarefa"
            aria-label="Adicionar tarefa"
          >
            <MoreHorizontal className="w-5 h-5" />
          </Button>
        </div>

        {/* Task rows */}
        <div className="space-y-3">
          {tasks.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm font-medium">
              Nenhuma tarefa corresponde ao filtro ativo.
            </div>
          ) : (
            (isExpanded ? tasks : tasks.slice(0, 5)).map((task) => (
              <div
                key={task.id}
                id={`task-row-${task.id}`}
                onClick={() => onTaskClick(task)}
                className="group flex items-center justify-between gap-3 p-3.5 rounded-xl border border-[#2A2A2A] bg-[#202020]/60 hover:bg-[#262626] hover:border-[#383838] transition-all cursor-pointer"
              >
                {/* Left indicator & Title */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className={`w-3.5 h-3.5 rounded-md ${getIndicatorColor(
                      task
                    )} shrink-0 transition-transform group-hover:scale-110`}
                  />
                  <span className="font-semibold text-white text-sm truncate group-hover:text-[#E4007E] transition-colors">
                    {task.title}
                  </span>
                </div>

                {/* Right Metadata: Category, Assignee, Date, Status */}
                <div className="flex items-center gap-3 shrink-0">
                  {(() => {
                    const firstLabel =
                      task.labels && task.labels.length > 0
                        ? task.labels[0]
                        : task.category
                        ? { name: task.category.split(',')[0].trim() }
                        : null;
                    if (!firstLabel || !firstLabel.name || firstLabel.name === 'Geral')
                      return null;
                    const style = getLabelColorHex(firstLabel.name, firstLabel.color);
                    return (
                      <span
                        className="hidden sm:inline-flex items-center gap-1 text-[11px] px-2.5 py-0.8 rounded-lg font-black tracking-wide uppercase shadow-2xs border"
                        style={{
                          backgroundColor: style.bg,
                          color: style.text,
                          borderColor: style.border,
                        }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-white/80" />
                        {firstLabel.name}
                      </span>
                    );
                  })()}

                  {/* Assignee Avatar */}
                  <div
                    className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#02376F] to-[#011C39] border border-[#FFB903]/40 text-white font-bold text-[11px] flex items-center justify-center shadow-xs"
                    title={task.assigneeName}
                  >
                    {task.assigneeInitials}
                  </div>

                  <span className="hidden md:inline-block text-xs text-slate-300 font-semibold min-w-[50px] text-right">
                    {task.dueDate || 'Sem prazo'}
                  </span>

                  <div>{getStatusBadge(task)}</div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Expand / Collapse Button for Active Tasks */}
        {tasks.length > 5 && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full py-2.5 text-center text-xs font-bold text-[#E4007E] hover:text-pink-400 transition-colors flex items-center justify-center gap-1 cursor-pointer pt-3 border-t border-[#262626] mt-4"
          >
            <span>
              {isExpanded
                ? 'Mostrar menos tarefas'
                : `Ver mais tarefas (+${tasks.length - 5})`}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform ${
                isExpanded ? 'rotate-180' : ''
              }`}
            />
          </button>
        )}
      </div>
    );
  }
);

DashboardActiveTasks.displayName = 'DashboardActiveTasks';
