import React from 'react';
import {
  Activity,
  Clock,
  History,
  ArrowRight,
  Edit2,
  Paperclip,
  MessageSquare,
  CheckCircle2,
  UserPlus,
  Plus,
} from 'lucide-react';
import { Task } from '../../../../types';
import { TimelineActionItem } from '../types';

function formatRelativeDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const now = Date.now();
    const diff = now - d.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 1) return 'agora mesmo';
    if (mins < 60) return `há ${mins} min`;
    if (hours < 24) return `há ${hours}h`;
    if (days === 1) return 'ontem';
    if (days < 7) return `há ${days} dias`;
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: days > 365 ? 'numeric' : undefined });
  } catch {
    return dateStr;
  }
}

function formatAbsoluteDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return `${d.toLocaleDateString('pt-BR')} às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  } catch {
    return dateStr;
  }
}

const TYPE_CONFIG: Record<
  TimelineActionItem['type'],
  { icon: React.ReactNode; color: string; bg: string; border: string }
> = {
  created: {
    icon: <Plus className="w-3 h-3" />,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/20',
    border: 'border-emerald-500/30',
  },
  status: {
    icon: <ArrowRight className="w-3 h-3" />,
    color: 'text-[#E4007E]',
    bg: 'bg-[#E4007E]/20',
    border: 'border-[#E4007E]/30',
  },
  delivery: {
    icon: <CheckCircle2 className="w-3 h-3" />,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/20',
    border: 'border-emerald-500/30',
  },
  comment: {
    icon: <MessageSquare className="w-3 h-3" />,
    color: 'text-blue-400',
    bg: 'bg-blue-500/20',
    border: 'border-blue-500/30',
  },
  file: {
    icon: <Paperclip className="w-3 h-3" />,
    color: 'text-amber-400',
    bg: 'bg-amber-500/20',
    border: 'border-amber-500/30',
  },
  member: {
    icon: <UserPlus className="w-3 h-3" />,
    color: 'text-purple-400',
    bg: 'bg-purple-500/20',
    border: 'border-purple-500/30',
  },
  edited: {
    icon: <Edit2 className="w-3 h-3" />,
    color: 'text-slate-300',
    bg: 'bg-slate-500/20',
    border: 'border-slate-500/30',
  },
  general: {
    icon: <Activity className="w-3 h-3" />,
    color: 'text-slate-400',
    bg: 'bg-slate-500/20',
    border: 'border-slate-500/30',
  },
};

const UserAvatar: React.FC<{ name: string; initials: string; avatarUrl?: string; size?: string }> = ({
  name,
  initials,
  avatarUrl,
  size = 'w-6 h-6',
}) => {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={`${size} rounded-full object-cover ring-1 ring-[#2E2E2E] shrink-0`}
      />
    );
  }
  const colors = [
    'from-[#E4007E] to-[#E94E18]',
    'from-blue-500 to-cyan-500',
    'from-purple-500 to-pink-500',
    'from-emerald-500 to-teal-500',
    'from-amber-500 to-orange-500',
  ];
  const colorClass = colors[(initials.charCodeAt(0) || 0) % colors.length];
  return (
    <div
      className={`${size} rounded-full bg-gradient-to-br ${colorClass} flex items-center justify-center text-white font-bold shrink-0 ring-1 ring-[#2E2E2E]`}
      style={{ fontSize: '9px' }}
    >
      {initials.slice(0, 2)}
    </div>
  );
};

export const TaskActivityTimelineTab: React.FC<{
  editingTask: Task;
  timelineActions: TimelineActionItem[];
  loadingActions: boolean;
}> = ({ editingTask, timelineActions, loadingActions }) => {
  // Count by type for summary
  const statusCount = timelineActions.filter((a) => a.type === 'status' || a.type === 'delivery').length;
  const commentCount = timelineActions.filter((a) => a.type === 'comment').length;
  const memberCount = timelineActions.filter((a) => a.type === 'member').length;

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#101010] text-white">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="px-3 py-2 bg-[#181818] border border-[#2E2E2E] rounded-xl flex items-center gap-2 shadow-xs">
          <div className="p-1.5 bg-[#E4007E]/20 text-[#E4007E] rounded-lg border border-[#E4007E]/30 shrink-0">
            <Activity className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block leading-none mb-0.5">Total</span>
            <span className="text-sm font-semibold text-white">{timelineActions.length}</span>
          </div>
        </div>

        <div className="px-3 py-2 bg-[#181818] border border-[#2E2E2E] rounded-xl flex items-center gap-2 shadow-xs">
          <div className="p-1.5 bg-[#E4007E]/20 text-[#E4007E] rounded-lg border border-[#E4007E]/30 shrink-0">
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block leading-none mb-0.5">Status</span>
            <span className="text-sm font-semibold text-white">{statusCount}</span>
          </div>
        </div>

        <div className="px-3 py-2 bg-[#181818] border border-[#2E2E2E] rounded-xl flex items-center gap-2 shadow-xs">
          <div className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg border border-blue-500/30 shrink-0">
            <MessageSquare className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block leading-none mb-0.5">Comentários</span>
            <span className="text-sm font-semibold text-white">{commentCount}</span>
          </div>
        </div>

        <div className="px-3 py-2 bg-[#181818] border border-[#2E2E2E] rounded-xl flex items-center gap-2 shadow-xs">
          <div className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/30 shrink-0">
            <Clock className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block leading-none mb-0.5">Criada</span>
            <span className="text-[10px] font-semibold text-white truncate block">
              {editingTask.createdAt ? formatRelativeDate(editingTask.createdAt) : 'Recentemente'}
            </span>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-2">
        <div className="flex items-center justify-between pb-1.5 border-b border-[#2E2E2E]">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#E4007E] flex items-center gap-1.5">
            <History className="w-3.5 h-3.5" />
            <span>Histórico de Atividade</span>
          </h3>
          {loadingActions && (
            <span className="text-[10px] font-bold text-slate-400 animate-pulse">Carregando...</span>
          )}
        </div>

        {timelineActions.length === 0 ? (
          <div className="py-10 text-center bg-[#181818] rounded-xl border border-[#2E2E2E]">
            <History className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-300">Nenhuma ação registrada ainda.</p>
            <p className="text-[11px] text-slate-500 mt-1">As ações aparecerão aqui conforme a demanda evolui.</p>
          </div>
        ) : (
          <div className="relative pl-8 space-y-3 before:absolute before:left-[13px] before:top-3 before:bottom-3 before:w-px before:bg-gradient-to-b before:from-[#E4007E]/30 before:via-[#2E2E2E] before:to-transparent">
            {timelineActions.map((act) => {
              const cfg = TYPE_CONFIG[act.type] || TYPE_CONFIG.general;
              return (
                <div key={act.id} className="relative group">
                  {/* Timeline dot */}
                  <div className={`absolute left-[-22px] top-[9px] w-2.5 h-2.5 rounded-full ${cfg.bg} border ${cfg.border} z-10 ring-[3px] ring-[#101010]`} />

                  <div className="bg-[#141414] border border-[#1E1E1E] rounded-xl px-3 py-2.5 hover:border-[#2E2E2E] transition-colors">
                    <div className="flex items-start gap-2.5">
                      {/* Type icon */}
                      <div className={`p-1.5 ${cfg.bg} ${cfg.color} rounded-lg border ${cfg.border} shrink-0 mt-0.5`}>
                        {cfg.icon}
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* User + action */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <UserAvatar name={act.user} initials={act.userInitials} avatarUrl={act.avatarUrl} />
                          <span className="text-xs font-semibold text-white">{act.user}</span>
                          <span className="text-xs text-slate-400">{act.title}</span>
                        </div>

                        {/* Details */}
                        {act.details && act.type !== 'comment' && (
                          <div className="mt-1.5 inline-flex items-center gap-1 bg-[#1C1C1C] border border-[#2E2E2E] px-2 py-0.5 rounded-lg">
                            <span className="text-[11px] text-slate-200 font-medium">{act.details}</span>
                          </div>
                        )}
                        {act.details && act.type === 'comment' && (
                          <div className="mt-1.5 bg-[#1A1A1A] border border-[#262626] rounded-lg px-2.5 py-2">
                            <p className="text-[11px] text-slate-300 leading-relaxed line-clamp-3">{act.details}</p>
                          </div>
                        )}

                        {/* Timestamp */}
                        <div className="flex items-center gap-1 mt-1.5">
                          <Clock className="w-2.5 h-2.5 text-slate-600" />
                          <span
                            className="text-[10px] text-slate-500"
                            title={formatAbsoluteDate(act.date)}
                          >
                            {formatRelativeDate(act.date)}
                          </span>
                          <span className="text-slate-600 text-[10px]">·</span>
                          <span className="text-[10px] text-slate-600">{formatAbsoluteDate(act.date)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
