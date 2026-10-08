import React, { useState, useRef, useEffect } from 'react';
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
  isLoadingTasks?: boolean;
  getTaskNumericTimestamp: (t: Task) => number;
  getLabelColorHex: (labelName: string, labelColor?: string) => { bg: string; text: string; border: string };
  getTaskCardBgStyle: (task: Task, projects: Project[]) => { className: string; style?: React.CSSProperties };
  moveTaskStatus: (taskId: string, newStatus: TaskStatus) => void;
  moveAllBacklogToDoneLocally: () => void;
  setIsNewTaskModalOpen: (open: boolean) => void;
  setEditingTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  addTask: (newTaskData: Omit<Task, 'id' | 'createdAt'>) => Promise<Task>;
}

export const TasksKanbanView: React.FC<TasksKanbanViewProps> = React.memo(({
  columns,
  filteredTasks,
  projects,
  spineStatuses,
  isLoadingTasks,
  getTaskNumericTimestamp,
  getLabelColorHex,
  getTaskCardBgStyle,
  moveTaskStatus,
  moveAllBacklogToDoneLocally,
  setIsNewTaskModalOpen,
  setEditingTask,
  updateTask,
  addTask,
}) => {
  const kanbanRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);

  // Região aria-live: leitores de tela anunciam o resultado de movimentos feitos pelo teclado
  const [liveMessage, setLiveMessage] = useState('');
  const announce = (message: string) => {
    setLiveMessage('');
    setTimeout(() => setLiveMessage(message), 50);
  };

  // Celular: uma coluna por vez, escolhida por abas (o quadro largo não cabe em 375 px)
  const [mobileColumnId, setMobileColumnId] = useState<string | null>(null);
  const columnsWithTasks = columns
    .map((col) => ({ col, count: filteredTasks.filter((t) => t.status === col.id).length }))
    .filter((c) => c.count > 0);
  const activeMobileId = columnsWithTasks.find((c) => c.col.id === mobileColumnId)?.col.id ?? columnsWithTasks[0]?.col.id;

  // "Concluir Tudo" move muitas tarefas de uma vez: exige um segundo clique e se cancela sozinho
  const [isConfirmingCompleteAll, setIsConfirmingCompleteAll] = useState(false);
  useEffect(() => {
    if (!isConfirmingCompleteAll) return;
    const timer = setTimeout(() => setIsConfirmingCompleteAll(false), 5000);
    return () => clearTimeout(timer);
  }, [isConfirmingCompleteAll]);

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
    <>
    <div aria-live="polite" role="status" className="sr-only">{liveMessage}</div>
    <div role="tablist" aria-label="Colunas do quadro" className="sm:hidden flex gap-2 overflow-x-auto no-scrollbar pb-2 shrink-0">
      {columnsWithTasks.map(({ col, count }) => (
        <button
          key={col.id}
          type="button"
          role="tab"
          aria-selected={col.id === activeMobileId}
          onClick={() => setMobileColumnId(col.id)}
          className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
            col.id === activeMobileId ? 'bg-brand text-white border-brand' : 'bg-surface text-fg-muted border-line'
          }`}
        >
          {col.label} <span className="opacity-80">{count}</span>
        </button>
      ))}
    </div>
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

        const isCollapsed = columnTasks.length === 0 && dragOverColumnId !== col.id;

        if (isCollapsed) {
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
              onClick={() => setIsNewTaskModalOpen(true)}
              className="hidden sm:flex w-12 shrink-0 min-w-[48px] rounded-2xl bg-surface hover:bg-raised h-[240px] flex-col items-center justify-center transition-all duration-300 cursor-pointer border border-line mt-0"
              title={`Adicionar tarefa em ${col.label}`}
            >
              <div
                className="flex items-center gap-3 text-slate-400 opacity-60 hover:opacity-100 transition-opacity whitespace-nowrap font-bold"
                style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
              >
                <span className="text-sm tracking-wider">{col.label}</span>
                <span className="text-xs">{columnTasks.length}</span>
              </div>
            </div>
          );
        }

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
            className={`${col.id === activeMobileId ? 'flex' : 'hidden sm:flex'} w-full sm:w-80 shrink-0 sm:min-w-[320px] rounded-2xl p-4 h-full flex-col transition-all duration-300 ease-in-out ${
              dragOverColumnId === col.id
                ? 'bg-surface ring-1 ring-brand scale-[1.01]'
                : 'bg-transparent'
            }`}
          >
            <div className="flex flex-col flex-1 min-h-0 overflow-hidden animate-in fade-in duration-300">
              {/* Column Header */}
              <div className="flex items-center justify-between mb-4 px-1 pt-1 shrink-0">
                <div className="flex items-center gap-2.5">
                  <span className={`text-sm font-bold ${col.color}`}>{col.label}</span>
                  <span className="text-xs font-bold bg-line text-white px-2.5 py-0.5 rounded-full border border-line-hover">
                    {columnTasks.length}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {col.id === 'backlog' && columnTasks.length > 0 && (
                    isConfirmingCompleteAll ? (
                      <div className="flex items-center gap-1" role="alertdialog" aria-label="Confirmar conclusão de todas as tarefas do Backlog">
                        <button
                          type="button"
                          autoFocus
                          onClick={() => {
                            setIsConfirmingCompleteAll(false);
                            moveAllBacklogToDoneLocally();
                          }}
                          className="flex items-center gap-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 px-2 py-1 rounded-xl transition-all focus-visible:outline-2 focus-visible:outline-brand"
                        >
                          <CheckCheck className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Concluir {columnTasks.length} {columnTasks.length === 1 ? 'tarefa' : 'tarefas'}?</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsConfirmingCompleteAll(false)}
                          className="text-xs font-bold text-fg-muted hover:text-white px-2 py-1 rounded-xl transition-colors focus-visible:outline-2 focus-visible:outline-brand"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsConfirmingCompleteAll(true)}
                        className="flex items-center gap-1 text-xs font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/60 px-2 py-1 rounded-xl transition-all focus-visible:outline-2 focus-visible:outline-brand"
                        title="Mover todas as tarefas do Backlog para Concluídas"
                      >
                        <CheckCheck className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Concluir Tudo</span>
                      </button>
                    )
                  )}
                  <button
                    onClick={() => setIsNewTaskModalOpen(true)}
                    className="text-fg-muted hover:text-white p-1.5 rounded-xl hover:bg-line transition-colors focus-visible:outline-2 focus-visible:outline-brand"
                    title="Adicionar tarefa nesta coluna"
                    aria-label="Adicionar tarefa nesta coluna"
                  >
                    <Plus className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </div>

              {/* Cards in this column */}
              <div className="space-y-3 flex-1 overflow-y-auto no-scrollbar pr-0.5 min-h-[100px] pb-1">
                {isLoadingTasks ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="w-full h-[160px] bg-surface rounded-xl animate-pulse border border-line overflow-hidden flex flex-col">
                      <div className="w-full h-7 bg-raised" />
                      <div className="p-4 flex-1 flex flex-col gap-3">
                        <div className="w-1/3 h-5 bg-line rounded-full" />
                        <div className="w-3/4 h-3.5 bg-line rounded" />
                        <div className="w-1/2 h-3.5 bg-line rounded" />
                        <div className="mt-auto flex justify-between items-center pt-2">
                          <div className="flex gap-1.5">
                            <div className="w-5 h-5 bg-line rounded-full" />
                            <div className="w-5 h-5 bg-line rounded-full" />
                          </div>
                          <div className="w-12 h-3 bg-line rounded" />
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  columnTasks.map((task) => (
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
                    onKeyboardMove={(direction) => {
                      // Alt + ←/→ com o card focado: mesma ação do arrastar, para quem usa teclado
                      const target = columns[columns.findIndex((c) => c.id === col.id) + direction];
                      if (!target) return;
                      moveTaskStatus(task.id, target.id as TaskStatus);
                      announce(`Tarefa ${task.title} movida para ${target.label}`);
                      // O card é remontado na nova coluna: devolve o foco a ele
                      setTimeout(() => document.querySelector<HTMLElement>(`[data-task-id="${task.id}"]`)?.focus(), 150);
                    }}
                    onClone={(clonedTask) => setEditingTask(clonedTask)}
                    updateTask={updateTask}
                    addTask={addTask}
                  />
                )))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
    </>
  );
});
