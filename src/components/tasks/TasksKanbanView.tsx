import React, { useState, useRef } from 'react';
import {
  CheckSquare,
  MessageSquare,
  Paperclip,
  Plus,
  CheckCheck,
} from 'lucide-react';
import { Task, TaskStatus, Project, SpineStatusConfig } from '../../types';
import { getTaskOverdueDays } from '../../lib/taskDateUtils';
import { TaskMembersStack } from './TaskMembersStack';

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
      className="flex gap-5 overflow-x-auto pb-8 pt-2 items-start no-scrollbar select-none cursor-grab active:cursor-grabbing w-full"
    >
      {columns.map((col) => {
        const columnTasks = filteredTasks
          .filter((t) => t.status === col.id)
          .sort((a, b) => getTaskNumericTimestamp(b) - getTaskNumericTimestamp(a));

        const limit = columnLimits[col.id] || 40;
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
            className={`w-80 shrink-0 min-w-[320px] rounded-2xl p-4 max-h-[calc(100vh-210px)] min-h-[520px] flex flex-col justify-between transition-all duration-200 border border-[#262626] ${
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
                {visibleTasks.map((task) => {
                  // Determine Priority Header Style (matches reference design & custom statuses)
                  const getPriorityInfo = () => {
                    if (task.isFlagged || task.status === 'overdue') {
                      return {
                        label: 'URGENTE',
                        bg: 'bg-rose-600 text-white font-black',
                      };
                    }
                    const customSt = spineStatuses.find((s) => s.id === task.status);
                    if (customSt) {
                      const rawLabel = customSt.label.toLowerCase();
                      let bg = customSt.gradient ? `bg-gradient-to-r ${customSt.gradient} text-white font-black` : 'bg-[#02376F] text-white font-black';
                      if (rawLabel.includes('novo') || rawLabel.includes('pedid')) bg = 'bg-[#0088FF] text-white font-black';
                      else if (rawLabel.includes('andamento') || rawLabel.includes('produ')) bg = 'bg-amber-500 text-[#000A17] font-black';
                      else if (rawLabel.includes('aprov') || rawLabel.includes('revis')) bg = 'bg-purple-600 text-white font-black';
                      else if (rawLabel.includes('concl') || rawLabel.includes('done') || rawLabel.includes('final')) bg = 'bg-emerald-600 text-white font-black';
                      else if (rawLabel.includes('backlog')) bg = 'bg-slate-700 text-white font-black';

                      return {
                        label: customSt.label.toUpperCase(),
                        bg,
                      };
                    }
                    if (task.status === 'blocked') {
                      return {
                        label: 'PRIORIDADE MODERADA',
                        bg: 'bg-orange-600 text-white font-black',
                      };
                    }
                    if (task.status === 'in_progress') {
                      return {
                        label: 'EM ANDAMENTO',
                        bg: 'bg-amber-500 text-[#000A17] font-black',
                      };
                    }
                    if (task.status === 'in_review') {
                      return {
                        label: 'EM REVISÃO',
                        bg: 'bg-purple-600 text-white font-black',
                      };
                    }
                    if (task.status === 'done') {
                      return {
                        label: 'CONCLUÍDO',
                        bg: 'bg-emerald-600 text-white font-black',
                      };
                    }
                    return {
                      label: 'BACKLOG',
                      bg: 'bg-slate-700 text-white font-black',
                    };
                  };

                  const pInfo = getPriorityInfo();
                  const isBeingDragged = draggedTaskId === task.id;
                  const cardTheme = getTaskCardBgStyle(task, projects);

                  return (
                    <div
                      key={task.id}
                      draggable
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
                      style={cardTheme.style}
                      className={`${cardTheme.className} rounded-xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5 cursor-grab active:cursor-grabbing group relative ${
                        isBeingDragged ? 'opacity-40 scale-95 ring-2 ring-indigo-400' : ''
                      }`}
                    >
                      {/* Top Priority Header Bar */}
                      <div className={`w-full py-1.5 px-3 text-[11px] font-black tracking-widest uppercase text-center relative ${pInfo.bg}`}>
                        <span className="relative z-10">{pInfo.label}</span>
                      </div>

                      {/* Cover Image */}
                      {(() => {
                        let coverSrc = task.coverImageUrl;

                        // If explicit cover image is chosen, use it and ensure high quality
                        if (coverSrc) {
                          const driveMatch =
                            coverSrc.match(/[?&]id=([a-zA-Z0-9_-]+)/) ||
                            coverSrc.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
                            coverSrc.match(/\/d\/([a-zA-Z0-9_-]+)/);
                          if (driveMatch && driveMatch[1] && !coverSrc.startsWith('data:')) {
                            coverSrc = `https://lh3.googleusercontent.com/d/${driveMatch[1]}`;
                          }
                        }

                        if (!coverSrc && task.attachments && task.attachments.length > 0) {
                          const imgAtts = task.attachments.filter((a) =>
                            a.mimeType?.startsWith('image/') ||
                            Boolean(a.name?.match(/\.(png|jpg|jpeg|gif|webp|svg)$/i)) ||
                            Boolean(a.url?.match(/\.(png|jpg|jpeg|gif|webp)(\?.*)?$/i)) ||
                            (a.previews && a.previews.length > 0) ||
                            Boolean(a.thumbnailUrl) ||
                            Boolean(a.driveFileId) ||
                            a.url?.includes('google.com')
                          );
                          if (imgAtts.length > 0) {
                            const first = imgAtts[0];
                            const driveMatch = first.driveFileId || first.url?.match(/[?&]id=([a-zA-Z0-9_-]+)/)?.[1] || first.url?.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)?.[1] || first.url?.match(/\/d\/([a-zA-Z0-9_-]+)/)?.[1];
                            if (first.thumbnailUrl) {
                              coverSrc = first.thumbnailUrl;
                            } else if (driveMatch) {
                              coverSrc = `https://lh3.googleusercontent.com/d/${driveMatch}`;
                            } else {
                              coverSrc =
                                first.previews && first.previews.length > 0
                                  ? first.previews[first.previews.length - 1].url
                                  : first.url;
                            }
                          }
                        }

                        // Fallback to first reference image if any
                        if (!coverSrc && task.referenceImages && task.referenceImages.length > 0) {
                          const firstRef = task.referenceImages[0];
                          if (firstRef.url?.startsWith('data:')) {
                            coverSrc = firstRef.url;
                          } else if (firstRef.driveFileId) {
                            coverSrc = `https://lh3.googleusercontent.com/d/${firstRef.driveFileId}`;
                          } else {
                            coverSrc = firstRef.url;
                          }
                        }

                        if (!coverSrc && task.description) {
                          const descImgMatches = task.description.match(/(?:!\[.*?\]\((https?:\/\/[^\s"']+)\)|(https?:\/\/[^\s"']+\.(?:png|jpg|jpeg|gif|webp)(?:\?[^\s"']*)?))/i);
                          if (descImgMatches) {
                            coverSrc = descImgMatches[1] || descImgMatches[2];
                          }
                        }

                        if (!coverSrc) return null;

                        return (
                          <div className="w-full h-36 bg-[#000A17] overflow-hidden relative">
                            <img
                              src={coverSrc}
                              alt={task.title}
                              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                const match = target.src.match(/\/d\/([a-zA-Z0-9_-]+)/) || target.src.match(/id=([a-zA-Z0-9_-]+)/);
                                if (match && match[1] && !target.src.includes('thumbnail?id=')) {
                                  target.src = `https://drive.google.com/thumbnail?id=${match[1]}&sz=w800`;
                                } else {
                                  target.style.display = 'none';
                                }
                              }}
                            />
                          </div>
                        );
                      })()}

                      {/* Main Card Content Body */}
                      <div className="p-3.5 space-y-3 bg-[#181818]">
                        {/* Client / Labels Badges Row */}
                        {(() => {
                          const labelItems: Array<{ name: string; color?: string }> = [];

                          if (task.labels && task.labels.length > 0) {
                            task.labels.forEach((lbl) => {
                              if (lbl.name) {
                                labelItems.push({ name: lbl.name, color: lbl.color });
                              }
                            });
                          }

                          if (labelItems.length === 0 && task.projectName) {
                            labelItems.push({ name: task.projectName });
                          }

                          if (labelItems.length === 0 && task.category) {
                            const cats = task.category.split(',').map((c) => c.trim()).filter(Boolean);
                            cats.forEach((cat) => {
                              const trimmed = cat.replace(/^#/, '').trim();
                              if (trimmed) {
                                labelItems.push({ name: trimmed });
                              }
                            });
                          }

                          if (labelItems.length === 0) return null;

                          return (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {labelItems.map((lbl, lIdx) => {
                                const style = getLabelColorHex(lbl.name, lbl.color);
                                const foundClient = projects.find(
                                  (p) => p.name.toLowerCase().trim() === lbl.name.toLowerCase().trim()
                                );

                                return (
                                  <span
                                    key={lIdx}
                                    className="h-6 px-2.5 rounded-full text-[10px] font-black tracking-wider uppercase inline-flex items-center gap-1.5 shadow-xs border border-white/10"
                                    style={{
                                      backgroundColor: style.bg,
                                      color: style.text,
                                    }}
                                  >
                                    {foundClient?.logoUrl ? (
                                      <img
                                        src={foundClient.logoUrl}
                                        alt={lbl.name}
                                        className="w-3.5 h-3.5 rounded-full object-cover shrink-0"
                                      />
                                    ) : (
                                      <div className="w-3.5 h-3.5 rounded-full bg-white/20 text-white flex items-center justify-center text-[8px] font-black shrink-0">
                                        {lbl.name.slice(0, 1).toUpperCase()}
                                      </div>
                                    )}
                                    <span>{lbl.name}</span>
                                  </span>
                                );
                              })}
                            </div>
                          );
                        })()}

                        {/* Title */}
                        <h4 className="font-black text-sm text-white leading-snug tracking-tight">
                          {task.title}
                        </h4>

                        {/* Middle Row: Members Stack */}
                        <div className="flex items-center justify-between pt-1">
                          <TaskMembersStack task={task} />
                        </div>

                        {/* Bottom Footer: Counts & Date */}
                        {(() => {
                          let cCount = (task.comments ? task.comments.length : 0) || task.commentsCount || 0;
                          let aCount = (task.attachments ? task.attachments.length : 0) || task.attachmentsCount || 0;
                          let chCount = task.checklistsCount || 0;

                          if (task.description) {
                            const descMatches = task.description.match(/(?:!\[.*?\]\(.*?\)|https?:\/\/[^\s"']+\.(?:png|jpg|jpeg|gif|webp|svg|pdf|docx?|xlsx?|zip))/gi);
                            if (descMatches && descMatches.length > aCount) {
                              aCount = descMatches.length;
                            }
                          }

                          return (
                            <div className="flex items-center justify-between pt-2.5 border-t border-[#262626] text-xs font-bold">
                              <div className="flex items-center gap-3.5 text-slate-300">
                                <span className="flex items-center gap-1.5 hover:text-[#E4007E] transition-colors" title="Comentários">
                                  <MessageSquare className="w-3.5 h-3.5 text-[#E4007E]" />
                                  <span className="text-white font-black text-[11px]">{cCount}</span>
                                </span>

                                <span className="flex items-center gap-1.5 hover:text-[#E4007E] transition-colors" title="Arquivos / Anexos">
                                  <Paperclip className="w-3.5 h-3.5 text-[#E4007E]" />
                                  <span className="text-white font-black text-[11px]">{aCount}</span>
                                </span>

                                <span className="flex items-center gap-1.5 hover:text-[#E4007E] transition-colors" title="Checklists">
                                  <CheckSquare className="w-3.5 h-3.5 text-[#00A723]" />
                                  <span className="text-white font-black text-[11px]">{chCount}</span>
                                </span>
                              </div>

                              {(() => {
                                const overdueDays = getTaskOverdueDays(task);
                                if (overdueDays > 0) {
                                  return (
                                    <div className="text-rose-400 font-extrabold text-[11px] bg-rose-950/70 px-2 py-0.5 rounded border border-rose-800/70 shadow-xs whitespace-nowrap" title={`Prazo previsto: ${task.dueDate}`}>
                                      Atrasada ({overdueDays}d)
                                    </div>
                                  );
                                }
                                return (
                                  <div className="text-slate-200 font-extrabold text-[11px]">
                                    {task.dueDate && task.dueDate !== 'Sem prazo' ? task.dueDate : 'Sem prazo'}
                                  </div>
                                );
                              })()}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  );
                })}

                {columnTasks.length > limit && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setColumnLimits((prev) => ({
                        ...prev,
                        [col.id]: (prev[col.id] || 40) + 40,
                      }));
                    }}
                    className="w-full py-2.5 my-2 bg-[#202020] hover:bg-[#282828] text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all border border-[#333333] flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-[0.99]"
                  >
                    <span>Carregar mais (+{columnTasks.length - limit} restantes)</span>
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
