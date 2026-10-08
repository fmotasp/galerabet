import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  CheckCircle2,
  AlertCircle,
  Plus,
  Filter,
  X,
  Command,
  ArrowRight,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Task } from '../../types';
import { Button, Badge } from '../ui';

export const CommandPaletteModal: React.FC = () => {
  const {
    isSearchModalOpen,
    setIsSearchModalOpen,
    tasks,
    setEditingTask,
    setIsNewTaskModalOpen,
    setActiveFilter,
    setActiveTab,
    spineStatuses,
  } = useApp();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global shortcut Cmd+K or Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchModalOpen(!isSearchModalOpen);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchModalOpen, setIsSearchModalOpen]);

  // Focus input on open
  useEffect(() => {
    if (isSearchModalOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isSearchModalOpen]);

  if (!isSearchModalOpen) return null;

  // Filter items
  const cleanQuery = query.toLowerCase().trim();

  const quickActions = [
    {
      id: 'action-new-task',
      title: 'Criar Nova Tarefa',
      subtitle: 'Adicionar tarefa ao quadro',
      icon: Plus,
      color: 'bg-brand text-white',
      onSelect: () => {
        setIsSearchModalOpen(false);
        setActiveTab('tasks');
        setEditingTask(null);
        setIsNewTaskModalOpen(true);
      },
    },
    {
      id: 'action-filter-mine',
      title: 'Ver Minhas Tarefas',
      subtitle: 'Filtrar cartões atribuídos a você',
      icon: Filter,
      color: 'bg-raised text-brand border border-line',
      onSelect: () => {
        setIsSearchModalOpen(false);
        setActiveTab('tasks');
        setActiveFilter('mine');
      },
    },
    {
      id: 'action-filter-alerts',
      title: 'Ver Tarefas com Alerta',
      subtitle: 'Prazos a vencer em menos de 2 dias ou atrasados',
      icon: AlertCircle,
      color: 'bg-rose-500/20 text-rose-400 border border-rose-500/30',
      onSelect: () => {
        setIsSearchModalOpen(false);
        setActiveTab('tasks');
        setActiveFilter('flagged');
      },
    },
  ].filter(
    (a) =>
      a.title.toLowerCase().includes(cleanQuery) ||
      a.subtitle.toLowerCase().includes(cleanQuery)
  );

  const matchedTasks = tasks
    .filter(
      (t) =>
        t.title.toLowerCase().includes(cleanQuery) ||
        (t.description && t.description.toLowerCase().includes(cleanQuery)) ||
        (t.assigneeName && t.assigneeName.toLowerCase().includes(cleanQuery)) ||
        (t.projectName && t.projectName.toLowerCase().includes(cleanQuery)) ||
        (t.category && t.category.toLowerCase().includes(cleanQuery))
    )
    .slice(0, 8);

  // Consolidated results list (Only Actions & Tasks)
  const allResults: Array<{ type: 'action' | 'task'; item: any }> = [
    ...quickActions.map((item) => ({ type: 'action' as const, item })),
    ...matchedTasks.map((item) => ({ type: 'task' as const, item })),
  ];

  const handleSelect = (result: (typeof allResults)[0]) => {
    if (!result) return;
    setIsSearchModalOpen(false);

    if (result.type === 'task') {
      setActiveTab('tasks');
      setEditingTask(result.item as Task);
    } else if (result.type === 'action') {
      result.item.onSelect();
    }
  };

  const handleKeyDownModal = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, allResults.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + allResults.length) % Math.max(1, allResults.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (allResults[selectedIndex]) {
        handleSelect(allResults[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsSearchModalOpen(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Paleta de Comandos e Busca Rápida"
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-16 sm:pt-24 px-4 animate-in fade-in duration-150"
      onClick={() => setIsSearchModalOpen(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDownModal}
        className="w-full max-w-2xl bg-surface rounded-3xl shadow-2xl border border-white/5 overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-150"
      >
        {/* Search Input Bar */}
        <div className="relative flex items-center px-4 border-b border-white/5 bg-canvas">
          <Search className="w-5 h-5 text-brand shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Buscar tarefas ou ações (Cmd + K)..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            className="w-full py-4 text-sm sm:text-base font-bold bg-transparent border-none text-white placeholder:text-slate-400 focus:outline-none"
          />
          {query && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setQuery('')}
              className="text-slate-400 hover:text-white p-1 rounded-lg"
              aria-label="Limpar busca"
              title="Limpar busca"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
          <span className="hidden sm:flex items-center gap-1 text-xs font-semibold text-slate-300 bg-canvas px-2.5 py-1 rounded-xl border border-white/5 shadow-sm ml-2">
            <Command className="w-3.5 h-3.5 text-brand" /> K
          </span>
        </div>

        {/* Results Body */}
        <div className="overflow-y-auto p-3 space-y-4">
          {allResults.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Search className="w-8 h-8 mx-auto text-slate-500 stroke-1" />
              <p className="text-sm font-bold text-white">Nenhum resultado encontrado</p>
              <p className="text-xs text-slate-400">Tente buscar por título da tarefa, membro ou cliente.</p>
            </div>
          ) : (
            <>
              {/* Quick Actions */}
              {quickActions.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-xs font-medium text-slate-400 tracking-wide px-3 py-1">
                    Ações Rápidas
                  </div>
                  {quickActions.map((action) => {
                    const globalIdx = allResults.findIndex((r) => r.item === action);
                    const isSelected = globalIdx === selectedIndex;

                    return (
                      <div
                        key={action.id}
                        onClick={() => handleSelect({ type: 'action', item: action })}
                        onMouseEnter={() => setSelectedIndex(globalIdx)}
                        className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-gradient-to-r from-brand to-brand-alt text-white shadow-lg shadow-brand/25 font-semibold'
                            : 'bg-canvas/70 hover:bg-canvas border border-line text-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded-xl shrink-0 ${
                              isSelected
                                ? 'bg-canvas text-brand'
                                : action.color
                            }`}
                          >
                            <action.icon className="w-4 h-4 stroke-[2.5]" />
                          </div>
                          <div>
                            <div
                              className={`text-xs ${
                                isSelected ? 'font-semibold text-white' : 'font-bold text-white'
                              }`}
                            >
                              {action.title}
                            </div>
                            <div
                              className={`text-xs ${
                                isSelected ? 'font-bold text-white/80' : 'font-medium text-slate-400'
                              }`}
                            >
                              {action.subtitle}
                            </div>
                          </div>
                        </div>
                        {isSelected && <ArrowRight className="w-4 h-4 text-white stroke-[3]" />}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Tasks */}
              {matchedTasks.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-xs font-medium text-slate-400 tracking-wide px-3 py-1">
                    Tarefas ({matchedTasks.length})
                  </div>
                  {matchedTasks.map((t) => {
                    const globalIdx = allResults.findIndex((r) => r.item === t);
                    const isSelected = globalIdx === selectedIndex;

                    const customStatus = spineStatuses?.find((s) => s.id === t.status);
                    const statusLabel = customStatus
                      ? customStatus.label
                      : t.status === 'done'
                      ? 'Concluído'
                      : t.status === 'in_progress'
                      ? 'Em Progresso'
                      : t.status === 'in_review'
                      ? 'Em Aprovação'
                      : t.status === 'overdue'
                      ? 'Atrasada'
                      : 'Backlog';

                    return (
                      <div
                        key={t.id}
                        onClick={() => handleSelect({ type: 'task', item: t })}
                        onMouseEnter={() => setSelectedIndex(globalIdx)}
                        className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-gradient-to-r from-brand to-brand-alt text-white shadow-lg shadow-brand/25 font-semibold'
                            : 'bg-canvas/70 hover:bg-canvas border border-line text-white'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1 pr-3">
                          <div
                            className={`p-2 rounded-xl shrink-0 ${
                              isSelected
                                ? 'bg-canvas text-brand'
                                : 'bg-surface border border-white/5 text-slate-300'
                            }`}
                          >
                            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div
                              className={`text-xs truncate ${
                                isSelected ? 'font-semibold text-white' : 'font-bold text-white'
                              }`}
                            >
                              {t.title}
                            </div>
                            <div
                              className={`text-xs truncate ${
                                isSelected ? 'font-bold text-white/80' : 'font-medium text-slate-400'
                              }`}
                            >
                              {t.projectName || 'Geral'} {t.assigneeName ? `· ${t.assigneeName}` : ''}
                            </div>
                          </div>
                        </div>

                        <Badge
                          size="sm"
                          className={`shrink-0 ${
                            isSelected
                              ? '!bg-canvas !text-brand !border-transparent'
                              : '!bg-surface !text-slate-300 !border-white/5'
                          }`}
                        >
                          {statusLabel}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer Bar */}
        <div className="px-4 py-3 bg-[#000A17] border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-medium">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="bg-field border border-slate-700 text-white px-1.5 py-0.5 rounded-lg font-mono text-[11px] font-bold">↑</span>
              <span className="bg-field border border-slate-700 text-white px-1.5 py-0.5 rounded-lg font-mono text-[11px] font-bold">↓</span> Navegar
            </span>
            <span className="flex items-center gap-1.5">
              <span className="bg-field border border-slate-700 text-white px-1.5 py-0.5 rounded-lg font-mono text-[11px] font-bold">↵</span> Selecionar
            </span>
          </div>
          <span className="flex items-center gap-1.5">
            <span className="bg-field border border-slate-700 text-white px-1.5 py-0.5 rounded-lg font-mono text-[11px] font-bold">ESC</span> Fechar
          </span>
        </div>
      </div>
    </div>
  );
};
