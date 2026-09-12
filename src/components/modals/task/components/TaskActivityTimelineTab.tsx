import React from 'react';
import {
  Activity,
  PlusCircle,
  Clock,
  History,
  ArrowRight,
  Edit2,
  Paperclip,
  MessageSquare,
  CheckCircle2,
  UserCheck,
} from 'lucide-react';
import { Task } from '../../../../types';
import { TimelineActionItem } from '../types';

export const TaskActivityTimelineTab: React.FC<{
  editingTask: Task;
  timelineActions: TimelineActionItem[];
  loadingActions: boolean;
}> = ({ editingTask, timelineActions, loadingActions }) => {
  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#101010] text-white">
      {/* Summary Cards Row - Ultra Compact */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div className="px-3 py-2 bg-[#181818] border border-[#2E2E2E] rounded-xl flex items-center gap-2.5 shadow-xs">
          <div className="p-1.5 bg-[#E4007E]/20 text-[#E4007E] rounded-lg border border-[#E4007E]/30 shrink-0">
            <Activity className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block leading-none mb-0.5">Total de Ações</span>
            <span className="text-sm font-black text-white leading-tight">{timelineActions.length}</span>
          </div>
        </div>

        <div className="px-3 py-2 bg-[#181818] border border-[#2E2E2E] rounded-xl flex items-center gap-2.5 shadow-xs">
          <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30 shrink-0">
            <PlusCircle className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block leading-none mb-0.5">Criada Em</span>
            <span className="text-xs font-black text-white truncate block">
              {editingTask.createdAt ? editingTask.createdAt : 'Recentemente'}
            </span>
          </div>
        </div>

        <div className="px-3 py-2 bg-[#181818] border border-[#2E2E2E] rounded-xl flex items-center gap-2.5 shadow-xs">
          <div className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/30 shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block leading-none mb-0.5">Prazo / Entrega</span>
            <span className="text-xs font-black text-white truncate block">
              {editingTask.deliveredAt ? `Entregue: ${editingTask.deliveredAt}` : (editingTask.dueDate || 'Sem prazo')}
            </span>
          </div>
        </div>
      </div>

      {/* Timeline Container - Ultra Compact */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between pb-1.5 border-b border-[#2E2E2E]">
          <h3 className="text-[11px] font-black uppercase tracking-wider text-[#E4007E] flex items-center gap-1.5">
            <History className="w-3.5 h-3.5 text-[#E4007E]" />
            <span>Linha do Tempo de Ações</span>
          </h3>
          {loadingActions && (
            <span className="text-[10px] font-bold text-slate-400 animate-pulse">
              Sincronizando ações...
            </span>
          )}
        </div>

        {timelineActions.length === 0 ? (
          <div className="py-8 text-center bg-[#181818] rounded-xl border border-[#2E2E2E]">
            <History className="w-8 h-8 text-slate-600 mx-auto mb-1.5" />
            <p className="text-xs font-bold text-slate-300">Nenhuma ação registrada nesta demanda ainda.</p>
          </div>
        ) : (
          <div className="relative pl-5 space-y-2.5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#2E2E2E]">
            {timelineActions.map((act) => {
              const getIconAndStyle = () => {
                switch (act.type) {
                  case 'created':
                    return {
                      icon: <PlusCircle className="w-3 h-3 text-emerald-400" />,
                      badgeBg: 'bg-emerald-950 text-emerald-300 border-emerald-500/30',
                      label: 'Criação',
                    };
                  case 'status':
                    return {
                      icon: <ArrowRight className="w-3 h-3 text-sky-400" />,
                      badgeBg: 'bg-sky-950 text-sky-300 border-sky-500/30',
                      label: 'Status',
                    };
                  case 'edited':
                    return {
                      icon: <Edit2 className="w-3 h-3 text-amber-400" />,
                      badgeBg: 'bg-amber-950 text-amber-300 border-amber-500/30',
                      label: 'Edição',
                    };
                  case 'file':
                    return {
                      icon: <Paperclip className="w-3 h-3 text-[#E4007E]" />,
                      badgeBg: 'bg-amber-950 text-amber-300 border-amber-500/30',
                      label: 'Arquivo',
                    };
                  case 'comment':
                    return {
                      icon: <MessageSquare className="w-3 h-3 text-purple-400" />,
                      badgeBg: 'bg-purple-950 text-purple-300 border-purple-500/30',
                      label: 'Comentário',
                    };
                  case 'delivery':
                    return {
                      icon: <CheckCircle2 className="w-3 h-3 text-[#00A723]" />,
                      badgeBg: 'bg-emerald-950 text-emerald-300 border-emerald-500/30',
                      label: 'Entrega',
                    };
                  case 'member':
                    return {
                      icon: <UserCheck className="w-3 h-3 text-orange-400" />,
                      badgeBg: 'bg-orange-950 text-orange-300 border-orange-500/30',
                      label: 'Membro',
                    };
                  default:
                    return {
                      icon: <Activity className="w-3 h-3 text-slate-300" />,
                      badgeBg: 'bg-slate-800 text-slate-300 border-slate-700',
                      label: 'Atualização',
                    };
                }
              };

              const style = getIconAndStyle();
              let formattedDate = act.date;
              try {
                const d = new Date(act.date);
                if (!isNaN(d.getTime())) {
                  formattedDate = `${d.toLocaleDateString('pt-BR')} às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
                }
              } catch (err) {}

              return (
                <div key={act.id} className="relative group">
                  {/* Timeline node dot */}
                  <div className="absolute -left-5 top-2.5 w-3.5 h-3.5 rounded-full bg-[#101010] border-2 border-[#2E2E2E] flex items-center justify-center -translate-x-1/2 z-10 shadow-xs group-hover:border-[#E4007E] transition-colors">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#E4007E]" />
                  </div>

                  {/* Compact Action Card */}
                  <div className="p-2.5 sm:p-3 bg-[#181818] border border-[#2E2E2E] rounded-xl shadow-xs space-y-1 hover:border-[#E4007E]/40 transition-colors">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        {act.avatarUrl ? (
                          <img
                            src={act.avatarUrl}
                            alt={act.user}
                            className="w-5 h-5 rounded-full object-cover ring-1 ring-white/20"
                          />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-[#1C1C1C] border border-[#2E2E2E] text-white font-black text-[9px] flex items-center justify-center">
                            {act.userInitials}
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-white">{act.user}</span>
                          <span className="text-[10px] font-medium text-slate-400">• {formattedDate}</span>
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1 border ${style.badgeBg}`}>
                        {style.icon}
                        <span>{style.label}</span>
                      </span>
                    </div>

                    <p className="text-xs font-bold text-slate-100 leading-snug">{act.title}</p>
                    {act.details && (
                      <p className="text-[11px] text-slate-300 bg-[#101010] px-2.5 py-1.5 rounded-lg border border-[#2E2E2E]/60 font-medium whitespace-pre-wrap break-words mt-1">
                        {act.details}
                      </p>
                    )}
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
