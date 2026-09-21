import React from 'react';
import { MoreHorizontal, HelpCircle } from 'lucide-react';
import { Button } from '../ui';
import { DashboardMetrics } from './dashboardUtils';

interface DashboardStatCardsProps {
  metrics: DashboardMetrics;
}

export const DashboardStatCards: React.FC<DashboardStatCardsProps> = React.memo(
  ({ metrics }) => {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Card 1: Total Tasks */}
        <div className="bg-[#161616] rounded-2xl p-5 shadow-xs relative flex flex-col justify-between ring-1 ring-white/5">
          <div className="flex items-start justify-between">
            <span className="text-3xl font-semibold text-white tracking-tight">
              {metrics.totalTasks}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-400 hover:text-white p-1"
              title="Mais opções"
              aria-label="Mais opções"
            >
              <MoreHorizontal className="w-5 h-5" />
            </Button>
          </div>
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-widest mt-1">
            Total de tarefas
          </span>
          <div className="mt-4 pt-3 flex items-center justify-between text-xs">
            <span className="text-[#E4007E] font-medium">
              {metrics.activeProjectsCount} projetos ativos
            </span>
            <span className="text-slate-500 font-medium">Sprint atual</span>
          </div>
        </div>

        {/* Card 2: Completed */}
        <div className="bg-[#161616] rounded-2xl p-5 shadow-xs relative flex flex-col justify-between ring-1 ring-emerald-500/10 overflow-hidden">
          <div className="flex items-start justify-between">
            <span className="text-3xl font-semibold text-emerald-400 tracking-tight">
              {metrics.completedTasks}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-400 hover:text-white p-1"
              title="Mais opções"
              aria-label="Mais opções"
            >
              <MoreHorizontal className="w-5 h-5" />
            </Button>
          </div>
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-widest mt-1">
            Concluídas
          </span>
          <div className="mt-4 pt-3 flex items-center justify-between text-xs">
            <span className="text-emerald-400/80 font-medium">
              {metrics.completionPercentage}% concluído
            </span>
            <span className="text-slate-500 font-medium">Sprint atual</span>
          </div>
        </div>

        {/* Card 3: Overdue */}
        <div className="bg-[#161616] rounded-2xl p-5 shadow-xs relative flex flex-col justify-between ring-1 ring-rose-500/10 overflow-hidden">
          <div className="flex items-start justify-between">
            <span className="text-3xl font-semibold text-rose-400 tracking-tight">
              {metrics.overdueTasks}
            </span>
            <div className="flex items-center gap-1">
              <div className="group relative">
                <HelpCircle className="w-4 h-4 text-slate-400 cursor-help hover:text-white transition-colors mt-1" />
                <div className="absolute right-0 top-8 w-64 p-3 bg-[#262626] border border-[#3A3A3A] rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[999] pointer-events-none">
                  <p className="text-xs text-slate-200 font-bold mb-1.5">
                    Critérios de Alerta:
                  </p>
                  <ul className="text-[10px] text-slate-400 space-y-1.5 list-disc pl-3">
                    <li><strong className="text-rose-400">Atrasadas:</strong> Prazo previsto vencido</li>
                    <li><strong className="text-amber-400">Vencendo:</strong> Prazo é hoje, amanhã ou depois (D+2)</li>
                    <li><strong className="text-cyan-400">Urgentes:</strong> Marcadas com estrela (Flag)</li>
                  </ul>
                  <p className="text-[9px] text-slate-500 font-medium mt-2 border-t border-[#3A3A3A] pt-1.5 leading-tight">
                    * Ignora tarefas Concluídas ou já Em Aprovação.
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-slate-400 hover:text-white p-1"
                title="Mais opções"
                aria-label="Mais opções"
              >
                <MoreHorizontal className="w-5 h-5" />
              </Button>
            </div>
          </div>
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-widest mt-1">
            Atrasadas
          </span>
          <div className="mt-4 pt-3 flex items-center justify-between text-xs">
            <span className="text-rose-400 font-medium">
              {metrics.escalatedCount} com alerta / pendência
            </span>
            <span className="text-slate-500 font-medium">Atenção</span>
          </div>
        </div>
      </div>
    );
  }
);

DashboardStatCards.displayName = 'DashboardStatCards';
