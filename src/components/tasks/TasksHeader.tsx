import React from 'react';
import { Kanban, List, Plus } from 'lucide-react';

export interface TasksHeaderProps {
  viewMode: 'kanban' | 'list';
  onViewModeChange: (mode: 'kanban' | 'list') => void;
  onNewTask: () => void;
}

export const TasksHeader: React.FC<TasksHeaderProps> = React.memo(({
  viewMode,
  onViewModeChange,
  onNewTask,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-semibold text-white tracking-tight">Tarefas</h1>
      </div>

      <div className="flex items-center gap-3">
        <div role="group" aria-label="Modo de visualização" className="flex items-center p-1 bg-surface border border-line rounded-2xl">
          {([
            { mode: 'kanban', label: 'Quadro', Icon: Kanban },
            { mode: 'list', label: 'Lista', Icon: List },
          ] as const).map(({ mode, label, Icon }) => (
            <button
              key={mode}
              type="button"
              onClick={() => onViewModeChange(mode)}
              aria-pressed={viewMode === mode}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                viewMode === mode ? 'bg-raised text-white' : 'text-fg-muted hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" aria-hidden="true" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        <button
          id="btn-tasks-new-task"
          onClick={onNewTask}
          aria-label="Adicionar Nova Tarefa"
          className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-brand to-brand-alt hover:opacity-95 text-white rounded-2xl text-xs font-semibold shadow-md shadow-brand/25 transition-all active:scale-98 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Nova Tarefa</span>
        </button>
      </div>
      {/* Celular: o botão do cabeçalho some, então a ação principal vira um botão flutuante */}
      <button
        type="button"
        onClick={onNewTask}
        aria-label="Adicionar Nova Tarefa"
        className="sm:hidden fixed bottom-20 right-4 z-40 w-14 h-14 rounded-full bg-gradient-to-r from-brand to-brand-alt text-white shadow-lg shadow-brand/30 flex items-center justify-center active:scale-95 transition-transform cursor-pointer"
      >
        <Plus className="w-6 h-6 stroke-[3]" aria-hidden="true" />
      </button>
    </div>
  );
});
