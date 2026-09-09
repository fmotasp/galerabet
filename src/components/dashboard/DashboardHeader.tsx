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
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#E4007E] to-[#E94E18] flex items-center justify-center text-white shadow-lg shadow-[#E4007E]/25">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
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
          <div className="flex items-center bg-[#181818] p-1 rounded-2xl border border-[#2A2A2A] shadow-md">
            <button
              id="filter-all"
              onClick={() => onFilterChange('all')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-gradient-to-r from-[#E4007E] to-[#E94E18] text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Todas
            </button>
            <button
              id="filter-flagged"
              onClick={() => onFilterChange('flagged')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeFilter === 'flagged'
                  ? 'bg-gradient-to-r from-[#E4007E] to-[#E94E18] text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Com Alerta
            </button>
          </div>

          <Button
            id="btn-dashboard-new-task"
            onClick={onNewTaskClick}
            leftIcon={<Plus className="w-4 h-4 stroke-[3]" />}
            className="text-xs sm:text-sm shadow-md shadow-[#E4007E]/25"
          >
            <span>Nova Tarefa</span>
          </Button>
        </div>
      </div>
    );
  }
);

DashboardHeader.displayName = 'DashboardHeader';
