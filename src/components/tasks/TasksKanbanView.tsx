import React, { useState, useRef } from 'react';
import {
  CheckSquare,
  MessageSquare,
  Paperclip,
  Plus,
  CheckCheck,
} from 'lucide-react';
import { Task, TaskStatus, Project, SpineStatusConfig } from '../../types';
import { getTaskOverdueDays, isTaskOverdue } from '../../lib/taskDateUtils';
import { TaskMembersStack } from './TaskMembersStack';
import { TaskKanbanCard } from './TaskKanbanCard';
import { compareTaskDueDatesAscending } from './useTasksFilter';

export interface TasksKanbanColumn {
  id: TaskStatus;
  label: string;
  color: string;
  bg: string;
  dotColor?: string;
}

export interface TasksKanbanViewProps {
  columns: TasksKanbanColumn[];
  filteredTasks: Task[];
  projects: Project[];
  spineStatuses: SpineStatusConfig[];
  getTaskNumericTimestamp: (t: Task) => number;
  getLabelColorHex: (labelName: string, labelColor?: string) => { bg: string; text: string; border: string };
  getTaskCardBgStyle: (task: Task, projects: Project[]) => { className: string; style?: React.CSSProperties };
  moveTaskStatus: (taskId: string, newStatus: TaskStatus) => void;
  moveAllBacklogToDoneLocally: () => void;
  setIsNewTaskModalOpen: (open: boolean) => void;
  setEditingTask: (task: Task) => void;
}

export const TasksKanbanView: React.FC<TasksKanbanViewProps> = React.memo(({
  columns,
  filteredTasks,
  projects,
  spineStatuses,
  getTaskNumericTimestamp,
  getLabelColorHex,
  getTaskCardBgStyle,
  moveTaskStatus,
  moveAllBacklogToDoneLocally,
  setIsNewTaskModalOpen,
  setEditingTask,
}) => {
  const kanbanRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);
  const [columnLimits, setColumnLimits] = useState<Record<string, number>>({});

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!kanbanRef.current) return;
    // Only initiate canvas drag if clicking background (not buttons/inputs/cards click)
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('select')) return;
    setIsDragging(true);
    setStartX(e.pageX - kanbanRef.current.offsetLeft);
    setScrollLeft(kanbanRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !kanbanRef.current) return;
    e.preventDefault();
    const x = e.pageX - kanbanRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    kanbanRef.current.scrollLeft = scrollLeft - walk;
  };

  return (
    <div
      ref={kanbanRef}
      onMouseDown={handleMouseDown}
      onMouseLeave={handleMouseLeave}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
      className="flex gap-5 overflow-x-auto pb-4 pt-2 items-start no-scrollbar select-none cursor-grab active:cursor-grabbing w-full h-full min-h-0"
    >
      {columns.map((col) => {
        const columnTasks = filteredTasks
          .filter((t) => t.status === col.id)
          .sort(compareTaskDueDatesAscending);

        const limit = columnLimits[col.id] || 10;
        const visibleTasks = columnTasks.slice(0, limit);

        return (
          <div
            key={col.id}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
              if (dragOverColumnId !== col.id) {
                setDragOverColumnId(col.id);
              }
            }}
            onDragLeave={(e) => {
              // Só reseta se estiver saindo do container principal da coluna
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                setDragOverColumnId(null);
              }
            }}
            onDrop={(e) => {
              e.preventDefault();
              setDragOverColumnId(null);
              const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
              if (taskId) {
                moveTaskStatus(taskId, col.id);
              }
              setDraggedTaskId(null);
            }}
            className={`w-80 shrink-0 min-w-[320px] rounded-2xl p-4 h-full flex flex-col transition-all duration-200 border border-[#262626] ${
              dragOverColumnId === col.id
                ? 'bg-[#222222] ring-2 ring-[#E4007E] scale-[1.01]'
                : 'bg-[#181818]'
            }`}
          >
            <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
              {/* Column Header */}
              <div className="flex items-center justify-between mb-4 px-1 pt-1 shrink-0">
                <div className="flex items-center gap-2.5">
                  <span className={`text-sm font-extrabold ${col.color}`}>{col.label}</span>
                  <span className="text-xs font-extrabold bg-[#262626] text-white px-2.5 py-0.5 rounded-full border border-[#333333]">
                    {columnTasks.length}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {col.id === 'backlog' && columnTasks.length > 0 && (
                    <button
                      onClick={moveAllBacklogToDoneLocally}
                      className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/60 px-2 py-1 rounded-xl transition-all"
                      title="Mover todas as tarefas do Backlog para Concluídas"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>Concluir Tudo</span>
                    </button>
                  )}
                  <button
                    onClick={() => setIsNewTaskModalOpen(true)}
                    className="text-[#A0A0A0] hover:text-white p-1.5 rounded-xl hover:bg-[#262626] transition-colors"
                    title="Adicionar tarefa nesta coluna"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Cards in this column */}
              <div className="space-y-3 flex-1 overflow-y-auto no-scrollbar pr-0.5 min-h-[100px] pb-1">
                {visibleTasks.map((task) => (
                  <TaskKanbanCard
                    key={task.id}
                    task={task}
                    projects={projects}
                    spineStatuses={spineStatuses}
                    getLabelColorHex={getLabelColorHex}
                    getTaskCardBgStyle={getTaskCardBgStyle}
                    isBeingDragged={draggedTaskId === task.id}
                    onDragStart={(e) => {
                      e.stopPropagation();
                      setDraggedTaskId(task.id);
                      e.dataTransfer.setData('text/plain', task.id);
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    onDragEnd={() => {
                      setDraggedTaskId(null);
                      setDragOverColumnId(null);
                    }}
                    onClick={() => setEditingTask(task)}
                  />
                ))}

                {columnTasks.length > limit && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setColumnLimits((prev) => ({
                        ...prev,
                        [col.id]: (prev[col.id] || 10) + 10,
                      }));
                    }}
                    className="w-full py-2.5 my-2 bg-[#1a1a1a] hover:bg-[#E4007E]/10 text-slate-400 hover:text-[#E4007E] rounded-xl text-xs font-bold transition-all border border-[#333333] hover:border-[#E4007E]/40 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-[0.99]"
                  >
                    <span>Ver mais · {columnTasks.length - limit} restantes</span>
                  </button>
                )}
              </div>
            </div>

            <button
              onClick={() => setIsNewTaskModalOpen(true)}
              className="w-full mt-4 py-2.5 bg-[#222222] hover:bg-[#282828] text-[#A0A0A0] hover:text-white border border-[#2E2E2E] rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar Cartão</span>
            </button>
          </div>
        );
      })}
    </div>
  );
});
