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
            <span className="text-sm font-semibold text-white leading-tight">{timelineActions.length}</span>
          </div>
        </div>

        <div className="px-3 py-2 bg-[#181818] border border-[#2E2E2E] rounded-xl flex items-center gap-2.5 shadow-xs">
          <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30 shrink-0">
            <PlusCircle className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block leading-none mb-0.5">Criada Em</span>
            <span className="text-xs font-semibold text-white truncate block">
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
            <span className="text-xs font-semibold text-white truncate block">
              {editingTask.deliveredAt ? `Entregue: ${editingTask.deliveredAt}` : (editingTask.dueDate || 'Sem prazo')}
            </span>
          </div>
        </div>
      </div>

      {/* Timeline Container - Ultra Compact */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between pb-1.5 border-b border-[#2E2E2E]">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#E4007E] flex items-center gap-1.5">
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
          <div className="relative pl-6 space-y-4 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-px before:bg-[#2E2E2E]">
            {timelineActions.map((act) => {
              let formattedDate = act.date;
              try {
                const d = new Date(act.date);
                if (!isNaN(d.getTime())) {
                  formattedDate = `${d.toLocaleDateString('pt-BR')} ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
                }
              } catch (err) {}

              return (
                <div key={act.id} className="relative group">
                  {/* Timeline node dot */}
                  <div className="absolute left-[-17px] top-[7px] w-2.5 h-2.5 rounded-full bg-[#E94E18] -translate-x-1/2 z-10 ring-[4px] ring-[#101010]" />

                  {/* Clean Text Layout */}
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-slate-400 leading-relaxed">
                      <strong className="text-white font-bold">{act.user}</strong>{' '}
                      {act.title}{' '}
                      {act.details && act.type !== 'comment' && (
                        <span className="inline-block bg-[#1C1C1C] border border-[#2E2E2E] px-2 py-0.5 rounded-lg text-slate-200 font-semibold ml-1 shadow-sm">
                          {act.details}
                        </span>
                      )}
                    </p>
                    {act.details && act.type === 'comment' && (
                      <p className="text-[11px] text-slate-300 bg-[#1A1A1A] p-2 rounded-lg mt-1 border border-[#262626]">
                        {act.details}
                      </p>
                    )}
                    <span className="text-[10px] font-medium text-slate-500 block">
                      {formattedDate}
                    </span>
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
