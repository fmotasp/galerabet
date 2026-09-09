import React from 'react';
import { Layers, CheckCircle2, TrendingUp, Zap } from 'lucide-react';
import { GlobalSummaryMetrics } from './reportsUtils';

interface ReportsGlobalKPIsProps {
  summary: GlobalSummaryMetrics;
}

export const ReportsGlobalKPIs: React.FC<ReportsGlobalKPIsProps> = React.memo(
  ({ summary }) => {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Recebidas */}
        <div className="bg-[#181818] border border-[#2A2A2A] p-5 rounded-3xl shadow-xl flex items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Demandas Recebidas
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white tracking-tight">
                {summary.totalReceived}
              </span>
              <span className="text-xs text-slate-400 font-medium">demandas</span>
            </div>
            <span className="text-[11px] text-emerald-400 font-bold mt-1 inline-block">
              {summary.totalFinished} finalizadas (
              {summary.totalReceived > 0
                ? Math.round((summary.totalFinished / summary.totalReceived) * 100)
                : 0}
              %)
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        {/* Cumprimento de Prazo */}
        <div className="bg-[#181818] border border-[#2A2A2A] p-5 rounded-3xl shadow-xl flex items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Cumprimento de Prazo
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white tracking-tight">
                {summary.avgOnTime}%
              </span>
              <span className="text-xs text-slate-400 font-medium">pontualidade</span>
            </div>
            <span className="text-[11px] text-rose-400 font-bold mt-1 inline-block">
              {summary.totalOverdue} com atraso no período
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Média de Revisões */}
        <div className="bg-[#181818] border border-[#2A2A2A] p-5 rounded-3xl shadow-xl flex items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Média de Revisões
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white tracking-tight">
                {summary.avgRevisionsOverall}
              </span>
              <span className="text-xs text-slate-400 font-medium">ciclos/tarefa</span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium mt-1 inline-block">
              Índice de assertividade criativa
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#E94E18]/10 text-[#E94E18] border border-[#E94E18]/30 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Capacidade Disponível */}
        <div className="bg-[#181818] border border-[#2A2A2A] p-5 rounded-3xl shadow-xl flex items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Capacidade Disponível
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#E4007E] to-[#E94E18] tracking-tight">
                {summary.avgCapacityAvailable}%
              </span>
              <span className="text-xs text-slate-400 font-medium">livre</span>
            </div>
            <span className="text-[11px] text-[#E4007E] font-bold mt-1 inline-block">
              {summary.totalInProgress} demandas em andamento
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#E4007E] to-[#E94E18] text-white shadow-md shadow-[#E4007E]/20 flex items-center justify-center shrink-0">
            <Zap className="w-6 h-6" />
          </div>
        </div>
      </div>
    );
  }
);

ReportsGlobalKPIs.displayName = 'ReportsGlobalKPIs';
