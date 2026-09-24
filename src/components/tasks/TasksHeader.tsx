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

        <button
          id="btn-tasks-new-task"
          onClick={onNewTask}
          aria-label="Adicionar Nova Tarefa"
          className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#E4007E] to-[#E94E18] hover:opacity-95 text-white rounded-2xl text-xs font-semibold shadow-md shadow-[#E4007E]/25 transition-all active:scale-98 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Nova Tarefa</span>
        </button>
      </div>
    </div>
  );
});
