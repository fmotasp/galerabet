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
    color: 'text-brand',
    bg: 'bg-brand/20',
    border: 'border-brand/30',
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
        className={`${size} rounded-full object-cover ring-1 ring-line-strong shrink-0`}
      />
    );
  }
  const colors = [
    'from-brand to-brand-alt',
    'from-blue-500 to-cyan-500',
    'from-purple-500 to-pink-500',
    'from-emerald-500 to-teal-500',
    'from-amber-500 to-orange-500',
  ];
  const colorClass = colors[(initials.charCodeAt(0) || 0) % colors.length];
  return (
    <div
      className={`${size} rounded-full bg-gradient-to-br ${colorClass} flex items-center justify-center text-white font-bold shrink-0 ring-1 ring-line-strong`}
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
  const [filterType, setFilterType] = React.useState<'all' | 'status' | 'file' | 'comment' | 'member'>('all');

  // Count by type for summary and filter tabs
  const statusCount = timelineActions.filter((a) => a.type === 'status' || a.type === 'delivery').length;
  const fileCount = timelineActions.filter((a) => a.type === 'file').length;
  const commentCount = timelineActions.filter((a) => a.type === 'comment').length;
  const memberCount = timelineActions.filter((a) => a.type === 'member').length;

  const filteredActions = React.useMemo(() => {
    if (filterType === 'all') return timelineActions;
    if (filterType === 'status') return timelineActions.filter((a) => a.type === 'status' || a.type === 'delivery');
    if (filterType === 'file') return timelineActions.filter((a) => a.type === 'file');
    if (filterType === 'comment') return timelineActions.filter((a) => a.type === 'comment');
    if (filterType === 'member') return timelineActions.filter((a) => a.type === 'member');
    return timelineActions;
  }, [timelineActions, filterType]);

  const filterOptions = [
    { id: 'all', label: 'Tudo', count: timelineActions.length, icon: Activity },
    { id: 'file', label: 'Arquivos', count: fileCount, icon: Paperclip },
    { id: 'status', label: 'Status & Entregas', count: statusCount, icon: ArrowRight },
    { id: 'comment', label: 'Comentários', count: commentCount, icon: MessageSquare },
    { id: 'member', label: 'Membros', count: memberCount, icon: UserPlus },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-canvas text-white">
      {/* Summary Cards (Also interactive shortcuts) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button
          type="button"
          onClick={() => setFilterType('all')}
          className={`px-4 py-3 rounded-xl flex flex-col justify-center text-left transition-all cursor-pointer ${
            filterType === 'all'
              ? 'bg-canvas ring-1 ring-brand/50 shadow-md'
              : 'bg-surface hover:bg-raised'
          }`}
        >
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Total</span>
          <span className="text-xl font-bold text-white tabular-nums leading-none">{timelineActions.length}</span>
        </button>

        <button
          type="button"
          onClick={() => setFilterType(filterType === 'file' ? 'all' : 'file')}
          className={`px-4 py-3 rounded-xl flex flex-col justify-center text-left transition-all cursor-pointer ${
            filterType === 'file'
              ? 'bg-canvas ring-1 ring-amber-500/50 shadow-md'
              : 'bg-surface hover:bg-raised'
          }`}
        >
          <span className="text-[11px] font-bold text-amber-500/80 uppercase tracking-widest block mb-1">Arquivos</span>
          <span className="text-xl font-bold text-white tabular-nums leading-none">{fileCount}</span>
        </button>

        <button
          type="button"
          onClick={() => setFilterType(filterType === 'status' ? 'all' : 'status')}
          className={`px-4 py-3 rounded-xl flex flex-col justify-center text-left transition-all cursor-pointer ${
            filterType === 'status'
              ? 'bg-canvas ring-1 ring-brand/50 shadow-md'
              : 'bg-surface hover:bg-raised'
          }`}
        >
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Status</span>
          <span className="text-xl font-bold text-white tabular-nums leading-none">{statusCount}</span>
        </button>

        <button
          type="button"
          onClick={() => setFilterType(filterType === 'comment' ? 'all' : 'comment')}
          className={`px-4 py-3 rounded-xl flex flex-col justify-center text-left transition-all cursor-pointer ${
            filterType === 'comment'
              ? 'bg-canvas ring-1 ring-blue-500/50 shadow-md'
              : 'bg-surface hover:bg-raised'
          }`}
        >
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Comentários</span>
          <span className="text-xl font-bold text-white tabular-nums leading-none">{commentCount}</span>
        </button>
      </div>

      {/* Filter Chips Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 hide-scrollbar">
        {filterOptions.map((opt) => {
          const Icon = opt.icon;
          const isActive = filterType === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setFilterType(opt.id as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-brand to-brand-alt text-white shadow-xs'
                  : 'bg-raised hover:bg-[#252525] text-slate-400 hover:text-white border border-line'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{opt.label}</span>
              <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-semibold ${
                isActive ? 'bg-white/20 text-white' : 'bg-white/5 text-slate-500'
              }`}>
                {opt.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Timeline */}
      <div className="space-y-2">
        <div className="flex items-center justify-between pb-1.5 border-b border-line">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-brand flex items-center gap-1.5">
            <History className="w-3.5 h-3.5" />
            <span>
              {filterType === 'all'
                ? 'Histórico de Atividade'
                : `Filtrando por: ${filterOptions.find((o) => o.id === filterType)?.label}`}
            </span>
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium tabular-nums">
              {filteredActions.length} de {timelineActions.length} ações
            </span>
            {loadingActions && (
              <span className="text-[11px] font-bold text-slate-400 animate-pulse">Carregando...</span>
            )}
          </div>
        </div>

        {filteredActions.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center bg-gradient-to-b from-popover to-transparent rounded-xl border border-white/5 border-dashed">
            <div className="w-12 h-12 rounded-full bg-raised flex items-center justify-center mb-3">
              <History className="w-6 h-6 text-slate-500" />
            </div>
            <p className="text-sm font-bold text-slate-300">Nenhum evento neste filtro</p>
            <p className="text-xs text-slate-500 mt-1 max-w-[220px]">
              {filterType === 'all'
                ? 'A jornada desta tarefa ainda não começou. Todas as ações aparecerão aqui.'
                : 'Não há registros desse tipo no histórico desta demanda.'}
            </p>
            {filterType !== 'all' && (
              <button
                type="button"
                onClick={() => setFilterType('all')}
                className="mt-3 text-xs font-bold text-brand hover:underline cursor-pointer"
              >
                Ver histórico completo
              </button>
            )}
          </div>
        ) : (
          <div className="relative pl-8 space-y-3 before:absolute before:left-[13px] before:top-3 before:bottom-3 before:w-px before:bg-gradient-to-b before:from-brand/30 before:via-line-strong before:to-transparent">
            {filteredActions.map((act, index) => {
              const cfg = TYPE_CONFIG[act.type] || TYPE_CONFIG.general;
              return (
                <div key={act.id} className="relative group animate-in slide-in-from-bottom-2 fade-in duration-300 fill-mode-both" style={{ animationDelay: `${index * 50}ms` }}>
                  {/* Timeline dot */}
                  <div className={`absolute left-[-22px] top-[9px] w-2.5 h-2.5 rounded-full ${cfg.bg} border ${cfg.border} z-10 ring-[3px] ring-canvas`} />

                  <div className="py-2">
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
                          <div className="mt-1.5 inline-flex items-center gap-1 bg-raised border-transparent px-2 py-0.5 rounded-lg">
                            <span className="text-xs text-slate-200 font-medium">{act.details}</span>
                          </div>
                        )}
                        {act.details && act.type === 'comment' && (
                          <div className="mt-1.5 bg-field border border-line rounded-lg px-2.5 py-2">
                            <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">{act.details}</p>
                          </div>
                        )}

                        {/* Timestamp */}
                        <div className="flex items-center gap-1 mt-1.5">
                          <Clock className="w-2.5 h-2.5 text-slate-600" />
                          <span
                            className="text-xs text-slate-400 tabular-nums"
                            title={formatAbsoluteDate(act.date)}
                          >
                            {formatRelativeDate(act.date)}
                          </span>
                          <span className="text-slate-500 text-xs">·</span>
                          <span className="text-xs text-slate-500 tabular-nums">{formatAbsoluteDate(act.date)}</span>
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
