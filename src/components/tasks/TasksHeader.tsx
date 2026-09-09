import React from 'react';
import { Kanban, List, Plus } from 'lucide-react';

export interface TasksHeaderProps {
  viewMode: 'kanban' | 'list';
  onViewModeChange: (mode: 'kanban' | 'list') => void;
  onNewTask: () => void;
}

export const TasksHeader: React.FC<TasksHeaderProps> = ({
  viewMode,
  onViewModeChange,
  onNewTask,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight">Tarefas</h1>
        <p className="text-sm text-slate-400 mt-1">Acompanhe suas demandas, tarefas e entregas em tempo real.</p>
      </div>

      <div className="flex items-center gap-3">
        {/* View mode toggle */}
        <div className="flex items-center bg-[#181818] p-1 rounded-2xl border border-[#2A2A2A]">
          <button
            onClick={() => onViewModeChange('kanban')}
            aria-label="Visualização em Quadro Kanban"
            className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'kanban'
                ? 'bg-gradient-to-r from-[#E4007E] to-[#E94E18] text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Visualização em Quadro Kanban"
          >
            <Kanban className="w-4 h-4" />
            <span className="hidden sm:inline">Quadro</span>
          </button>
          <button
            onClick={() => onViewModeChange('list')}
            aria-label="Visualização em Lista / Tabela"
            className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'list'
                ? 'bg-gradient-to-r from-[#E4007E] to-[#E94E18] text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Visualização em Lista"
          >
            <List className="w-4 h-4" />
            <span className="hidden sm:inline">Lista</span>
          </button>
        </div>

        <button
          id="btn-tasks-new-task"
          onClick={onNewTask}
          aria-label="Adicionar Nova Tarefa"
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#E4007E] to-[#E94E18] hover:opacity-95 text-white rounded-2xl text-xs font-black shadow-md shadow-[#E4007E]/25 transition-all active:scale-98 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Nova Tarefa</span>
        </button>
      </div>
    </div>
  );
};
