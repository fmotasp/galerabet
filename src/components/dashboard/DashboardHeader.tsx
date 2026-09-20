import React from 'react';
import { Layers, Plus } from 'lucide-react';
import { Button } from '../ui';

interface DashboardHeaderProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  onNewTaskClick: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = React.memo(
  ({ activeFilter, onFilterChange, onNewTaskClick }) => {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Header Title */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-[#E4007E] flex items-center justify-center text-white shadow-lg shadow-[#E4007E]/25">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-white tracking-tight">
              Painel Geral
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              Visão executiva e métricas em tempo real
            </p>
          </div>
        </div>

        {/* Right Header Controls: Filter Pill + New Task */}
        <div className="flex items-center gap-3">
          {/* Segmented Filter Pill */}
          <div className="flex items-center bg-[#161616] p-1 rounded-2xl border border-[#262626] shadow-sm">
            <button
              id="filter-all"
              onClick={() => onFilterChange('all')}
              className={`px-4 py-1.5 rounded-xl text-[13px] font-medium transition-all cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-[#222222] text-white shadow-sm ring-1 ring-white/5'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Todas
            </button>
            <button
              id="filter-flagged"
              onClick={() => onFilterChange('flagged')}
              className={`px-4 py-1.5 rounded-xl text-[13px] font-medium transition-all cursor-pointer ${
                activeFilter === 'flagged'
                  ? 'bg-[#222222] text-white shadow-sm ring-1 ring-white/5'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Com alerta
            </button>
          </div>

          <Button
            id="btn-dashboard-new-task"
            onClick={onNewTaskClick}
            leftIcon={<Plus className="w-4 h-4 stroke-[2.5]" />}
            className="text-[13px] sm:text-[14px]"
          >
            <span>Nova tarefa</span>
          </Button>
        </div>
      </div>
    );
  }
);

DashboardHeader.displayName = 'DashboardHeader';
