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
        <div className="bg-[#181818] rounded-2xl p-5 border border-[#2A2A2A] shadow-lg relative flex flex-col justify-between hover:border-[#383838] transition-all">
          <div className="flex items-start justify-between">
            <span className="text-3xl font-black text-white tracking-tight">
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
          <span className="text-xs text-slate-300 font-bold uppercase tracking-wider mt-1">
            total de tarefas
          </span>
          <div className="mt-4 pt-3 border-t border-[#2A2A2A] flex items-center justify-between text-xs">
            <span className="text-[#E4007E] font-bold">
              {metrics.activeProjectsCount} projetos ativos
            </span>
            <span className="text-slate-400 font-medium">sprint atual</span>
          </div>
        </div>

        {/* Card 2: Completed */}
        <div className="bg-[#181818] rounded-2xl p-5 border border-[#2A2A2A] shadow-lg relative flex flex-col justify-between hover:border-[#383838] transition-all overflow-hidden">
          <div className="flex items-start justify-between">
            <span className="text-3xl font-black text-[#10B981] tracking-tight">
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
          <span className="text-xs text-slate-300 font-bold uppercase tracking-wider mt-1">
            concluídas
          </span>
          <div className="mt-4 pt-3 border-t border-[#2A2A2A] flex items-center justify-between text-xs">
            <span className="text-[#10B981] font-bold">
              {metrics.completionPercentage}% concluído
            </span>
            <span className="text-slate-400 font-medium">em tempo real</span>
          </div>
          {/* Bottom indicator */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#10B981]" />
        </div>

        {/* Card 3: Overdue / Alerted */}
        <div className="bg-[#181818] rounded-2xl p-5 border border-[#2A2A2A] shadow-lg relative flex flex-col justify-between hover:border-[#383838] transition-all overflow-hidden">
          <div className="flex items-start justify-between">
            <span className="text-3xl font-black text-rose-400 tracking-tight">
              {metrics.overdueTasks}
            </span>
            <div className="flex items-center gap-1">
              <div className="group relative">
                <HelpCircle className="w-4 h-4 text-slate-400 cursor-help hover:text-white transition-colors mt-1" />
                <div className="absolute right-0 top-8 w-56 p-3 bg-[#262626] border border-[#3A3A3A] rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none">
                  <p className="text-xs text-slate-200 font-bold mb-1.5">
                    Critérios de Alerta:
                  </p>
                  <ul className="text-[10px] text-slate-400 space-y-1.5 list-disc pl-3">
                    <li><strong className="text-rose-400">Atrasadas:</strong> Mais de 2 dias (D+2) do prazo</li>
                    <li><strong className="text-amber-400">Vencendo:</strong> Prazo é hoje, amanhã ou depois</li>
                    <li><strong className="text-cyan-400">Urgentes:</strong> Marcadas com flag manualmente</li>
                  </ul>
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
          <span className="text-xs text-slate-300 font-bold uppercase tracking-wider mt-1">
            atrasadas
          </span>
          <div className="mt-4 pt-3 border-t border-[#2A2A2A] flex items-center justify-between text-xs">
            <span className="text-rose-400 font-bold">
              {metrics.escalatedCount} com alerta / pendência
            </span>
            <span className="text-slate-400 font-medium">atenção</span>
          </div>
          {/* Accent bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-rose-500" />
        </div>
      </div>
    );
  }
);

DashboardStatCards.displayName = 'DashboardStatCards';
