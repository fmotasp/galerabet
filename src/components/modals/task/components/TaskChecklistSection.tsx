import React, { useState } from 'react';
import { CheckSquare, Plus, Trash2, Check } from 'lucide-react';
import { TaskChecklistItem } from '../../../../types';

interface TaskChecklistSectionProps {
  checklists: TaskChecklistItem[];
  onAddChecklistItem: (title: string) => void;
  onToggleChecklistItem: (id: string) => void;
  onDeleteChecklistItem: (id: string) => void;
}

export const TaskChecklistSection: React.FC<TaskChecklistSectionProps> = ({
  checklists,
  onAddChecklistItem,
  onToggleChecklistItem,
  onDeleteChecklistItem,
}) => {
  const [newItemTitle, setNewItemTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const completedCount = checklists.filter((item) => item.completed).length;
  const totalCount = checklists.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleAddNewItem = (e?: React.FormEvent | React.MouseEvent | React.KeyboardEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!newItemTitle.trim()) return;
    onAddChecklistItem(newItemTitle.trim());
    setNewItemTitle('');
  };

  return (
    <div className="space-y-3 flex-1 flex flex-col min-w-0">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckSquare className="w-4 h-4 text-[#00A723]" />
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Checklist ({completedCount}/{totalCount})
          </h3>
        </div>

        {totalCount > 0 && (
          <span className="text-[11px] font-black text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
            {progressPercent}%
          </span>
        )}
      </div>

      {/* Progress Bar */}
      {totalCount > 0 && (
        <div className="w-full bg-[#1C1C1C] h-1.5 rounded-full overflow-hidden border border-[#2E2E2E]">
          <div
            className="bg-gradient-to-r from-[#00A723] to-emerald-400 h-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}

      {/* Checklist items */}
      <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
        {checklists.map((item) => (
          <div
            key={item.id}
            className={`group flex items-center justify-between p-2.5 rounded-xl border transition-all ${
              item.completed
                ? 'bg-[#181818]/60 border-[#262626] text-slate-400'
                : 'bg-[#1C1C1C] border-[#2E2E2E] hover:border-[#00A723]/40 text-slate-200'
            }`}
          >
            <div
              className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer select-none"
              onClick={() => onToggleChecklistItem(item.id)}
            >
              <button
                type="button"
                className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all flex-shrink-0 ${
                  item.completed
                    ? 'bg-[#00A723] border-[#00A723] text-white shadow-xs'
                    : 'border-[#444] bg-[#222] hover:border-[#00A723]'
                }`}
              >
                {item.completed && <Check className="w-3 h-3 stroke-[3]" />}
              </button>
              <span
                className={`text-xs font-semibold truncate ${
                  item.completed ? 'line-through text-slate-400' : 'text-slate-100'
                }`}
              >
                {item.title}
              </span>
            </div>

            <button
              type="button"
              onClick={() => onDeleteChecklistItem(item.id)}
              className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-400 text-slate-400 transition-all rounded"
              title="Excluir item"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        {checklists.length === 0 && !isAdding && (
          <div className="p-4 bg-[#1C1C1C]/50 border border-dashed border-[#2E2E2E] rounded-xl text-center text-xs text-slate-400 font-medium">
            Nenhum item no checklist ainda.
          </div>
        )}
      </div>

      {/* Add Item Trigger / Input */}
      {isAdding ? (
        <div className="space-y-2 pt-1">
          <div className="flex gap-2">
            <input
              type="text"
              autoFocus
              placeholder="Descreva o item do checklist..."
              value={newItemTitle}
              onChange={(e) => setNewItemTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  e.stopPropagation();
                  handleAddNewItem(e);
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsAdding(false);
                  setNewItemTitle('');
                }
              }}
              className="flex-1 p-2.5 bg-[#1C1C1C] border border-[#2E2E2E] rounded-xl text-xs font-semibold text-white placeholder-slate-400 focus:outline-none focus:border-[#00A723]"
            />
            <button
              type="button"
              disabled={!newItemTitle.trim()}
              onClick={handleAddNewItem}
              className="px-3.5 py-2.5 bg-gradient-to-r from-[#00A723] to-emerald-600 hover:opacity-95 disabled:opacity-50 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Adicionar</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setNewItemTitle('');
              }}
              className="px-3 py-2.5 bg-[#262626] hover:bg-[#333] text-slate-300 rounded-xl text-xs font-semibold transition-all cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-1.5 py-2 px-3 text-xs font-bold text-slate-300 hover:text-white bg-[#1C1C1C] hover:bg-[#252525] border border-[#2E2E2E] hover:border-[#00A723]/50 rounded-xl transition-all cursor-pointer w-fit"
        >
          <Plus className="w-3.5 h-3.5 text-[#00A723] stroke-[2.5]" />
          <span>Criar item no checklist</span>
        </button>
      )}
    </div>
  );
};
