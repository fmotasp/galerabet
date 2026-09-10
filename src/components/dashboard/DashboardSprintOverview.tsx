import React from 'react';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '../ui';
import { DashboardMetrics } from './dashboardUtils';

interface DashboardSprintOverviewProps {
  metrics: DashboardMetrics;
}

export const DashboardSprintOverview: React.FC<DashboardSprintOverviewProps> = React.memo(
  ({ metrics }) => {
    // SVG Circular Donut calculations
    const radius = 38;
    const circumference = 2 * Math.PI * radius;
    const donePercent = metrics.completionPercentage;
    const strokeDashoffset = circumference - (donePercent / 100) * circumference;

    return (
      <div className="bg-[#181818] rounded-2xl p-6 border border-[#2A2A2A] shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-white text-base">Visão Geral da Sprint</h3>
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

        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Circular Donut Chart */}
          <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              {/* Background Track */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="transparent"
                stroke="#222222"
                strokeWidth="10"
              />
              {/* Completed Progress */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="transparent"
                stroke="#E4007E"
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            {/* Donut Center Percentage */}
            <div className="absolute flex flex-col items-center justify-center">
              <span className="font-black text-2xl text-white">
                {metrics.completionPercentage}%
              </span>
            </div>
          </div>

          {/* Breakdown Legend */}
          <div className="space-y-2 text-xs flex-1 w-full">
            <div className="flex items-center justify-between text-slate-300 font-medium">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                <span>concluídas</span>
              </div>
              <span className="font-bold text-white">{metrics.completedTasks}</span>
            </div>

            <div className="flex items-center justify-between text-slate-300 font-medium">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>atrasadas</span>
              </div>
              <span className="font-bold text-white">{metrics.overdueTasks}</span>
            </div>

            <div className="flex items-center justify-between text-slate-300 font-medium">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#E4007E]" />
                <span>em progresso</span>
              </div>
              <span className="font-bold text-white">{metrics.inProgressTasks}</span>
            </div>

            <div className="flex items-center justify-between text-slate-300 font-medium">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
                <span>backlog</span>
              </div>
              <span className="font-bold text-white">{metrics.backlogTasks}</span>
            </div>

          </div>
        </div>
      </div>
    );
  }
);

DashboardSprintOverview.displayName = 'DashboardSprintOverview';
