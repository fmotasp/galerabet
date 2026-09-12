import React, { useRef, useEffect, useState } from 'react';
import {
  CheckSquare,
  MessageSquare,
  Paperclip,
} from 'lucide-react';
import { Task, Project, SpineStatusConfig } from '../../types';
import { getTaskOverdueDays, isTaskOverdue } from '../../lib/taskDateUtils';
import { TaskMembersStack } from './TaskMembersStack';
import { listTaskBriefingFiles } from '../../lib/googleDrive';
import { useTasks } from '../../context/TasksContext';

interface TaskKanbanCardProps {
  task: Task;
  projects: Project[];
  spineStatuses: SpineStatusConfig[];
  getLabelColorHex: (labelName: string, labelColor?: string) => { bg: string; text: string; border: string };
  getTaskCardBgStyle: (task: Task, projects: Project[]) => { className: string; style?: React.CSSProperties };
  isBeingDragged: boolean;
  onDragStart: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd: () => void;
  onClick: () => void;
}

export const TaskKanbanCard: React.FC<TaskKanbanCardProps> = ({
  task,
  projects,
  spineStatuses,
  getLabelColorHex,
  getTaskCardBgStyle,
  isBeingDragged,
  onDragStart,
  onDragEnd,
  onClick,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const { updateTask } = useTasks();
  const [hasScanned, setHasScanned] = useState(false);

  // Lazy loading logic
  useEffect(() => {
    if (task.coverImageUrl || hasScanned) return;

    const currentRef = cardRef.current;
    if (!currentRef) return;

    let timeoutId: NodeJS.Timeout;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Wait 1000ms before scanning to ensure user stopped scrolling
            timeoutId = setTimeout(() => {
              setHasScanned(true);
              observer.unobserve(currentRef);

              if (!task.coverImageUrl && task.driveFolderId) {
                listTaskBriefingFiles(task.driveFolderId, task.title)
                  .then((driveFiles) => {
                    if (driveFiles && driveFiles.length > 0) {
                      const mappedRefs = driveFiles.map((f) => ({
                        id: `ref-${f.id}`,
                        name: f.name,
                        url: `https://drive.google.com/thumbnail?id=${f.id}&sz=w1000`,
                        date: f.createdTime ? new Date(f.createdTime).toLocaleDateString('pt-BR') : 'Referência',
                        driveFileId: f.id,
                      }));

                      const prevRefs = task.referenceImages || [];
                      const map = new Map<string, any>();
                      prevRefs.forEach((r: any) => map.set(r.driveFileId || r.name || r.id, r));
                      mappedRefs.forEach((mr) => map.set(mr.driveFileId || mr.name || mr.id, mr));
                      const merged = Array.from(map.values());

                      const imgAtts = driveFiles.filter((a) =>
                        a.mimeType?.startsWith('image/') ||
                        Boolean(a.name?.match(/\.(png|jpg|jpeg|gif|webp|svg)$/i))
                      );

                      if (imgAtts.length > 0) {
                        const firstImg = imgAtts[0];
                        const newCover = `https://drive.google.com/thumbnail?id=${firstImg.id}&sz=w1000`;
                        updateTask(task.id, { referenceImages: merged, coverImageUrl: newCover });
                      } else {
                        updateTask(task.id, { referenceImages: merged });
                      }
                    }
                  })
                  .catch((e) => console.warn('Could not lazy-sync briefing files from drive:', e));
              }
            }, 1000);
          } else {
            // Cancel scan if it goes out of view before 1s
            if (timeoutId) clearTimeout(timeoutId);
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(currentRef);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (currentRef) observer.unobserve(currentRef);
    };
  }, [task.id, task.coverImageUrl, task.driveFolderId, task.title, hasScanned, updateTask]);

  const getPriorityInfo = () => {
    if (task.isFlagged || isTaskOverdue(task) || task.status === 'overdue') {
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
        label: 'EM APROVAÇÃO',
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
  const cardTheme = getTaskCardBgStyle(task, projects);

  return (
    <div
      ref={cardRef}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
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
};
