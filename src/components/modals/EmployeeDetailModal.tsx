import React, { useState, useMemo } from 'react';
import {
  X,
  Mail,
  MapPin,
  CheckCircle2,
  Edit2,
  Plus,
  Layers,
  MessageSquare,
  Paperclip,
  Folder,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Task } from '../../types';
import { isTaskCompleted, isTaskOverdue, getTaskOverdueDays } from '../../lib/taskDateUtils';
import { getLabelColorHex } from '../tasks/TasksView';
import { Button, Badge, Avatar } from '../ui';

export const EmployeeDetailModal: React.FC = () => {
  const {
    selectedEmployeeForDetail,
    setSelectedEmployeeForDetail,
    setEditingEmployee,
    tasks,
    setEditingTask,
    setIsNewTaskModalOpen,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'all' | 'doing' | 'backlog' | 'review' | 'done'>('all');

  const emp = selectedEmployeeForDetail;

  // Busca todas as tarefas reais deste colaborador
  const allEmpTasks = useMemo(() => {
    if (!emp) return [];

    const empId = emp.id.toLowerCase().trim();
    const empFullName = emp.name.toLowerCase().trim();
    const empFirstName = empFullName.split(' ')[0].trim();
    const empEmailPrefix = (emp.email || '').split('@')[0].toLowerCase().trim();

    return tasks.filter((t) => {
      // 1. Assignee direto
      if (t.assigneeId && (t.assigneeId === emp.id || t.assigneeId.toLowerCase().trim() === empId)) {
        return true;
      }
      if (t.assigneeName) {
        const aName = t.assigneeName.toLowerCase().trim();
        if (aName === empFullName || (empFirstName.length > 2 && aName.includes(empFirstName))) {
          return true;
        }
      }
      // 2. Membros da tarefa
      if (t.members && t.members.length > 0) {
        const isMember = t.members.some((m) => {
          if (!m) return false;
          const mId = (m.id || '').toLowerCase().trim();
          const mName = (m.name || '').toLowerCase().trim();
          return (
            mId === empId ||
            mName === empFullName ||
            (empFirstName.length > 2 && mName.includes(empFirstName))
          );
        });
        if (isMember) return true;
      }
      // 3. Coluna nominal no Trello
      if (t.trelloListName) {
        const lName = t.trelloListName.toLowerCase();
        if (
          (empFirstName.length > 2 && lName.includes(empFirstName)) ||
          (empEmailPrefix.length > 2 && lName.includes(empEmailPrefix)) ||
          (empFirstName === 'bismarques' && lName.includes('marques')) ||
          (empFirstName === 'gerdson' && lName.includes('gerdeson')) ||
          (empFirstName === 'felipe' && (lName.includes('fmota') || lName.includes('mota'))) ||
          (empFirstName === 'daiane' && lName.includes('dai'))
        ) {
          return true;
        }
      }
      return false;
    });
  }, [emp, tasks]);

  if (!emp) return null;

  // Agrupamento por status
  const doneTasks = allEmpTasks.filter((t) => isTaskCompleted(t));
  const doingTasks = allEmpTasks.filter((t) => {
    const s = (t.status || '').toLowerCase();
    return !isTaskCompleted(t) && (s === 'in_progress' || s.includes('doing') || s.includes('andamento') || s.includes('progresso'));
  });
  const reviewTasks = allEmpTasks.filter((t) => {
    const s = (t.status || '').toLowerCase();
    const l = (t.trelloListName || '').toLowerCase();
    return !isTaskCompleted(t) && (s === 'in_review' || s.includes('revis') || s.includes('aprov') || l.includes('revis') || l.includes('aprov'));
  });
  const backlogTasks = allEmpTasks.filter((t) => {
    const s = (t.status || '').toLowerCase();
    return !isTaskCompleted(t) && (s === 'backlog' || s === 'blocked' || s.includes('backlog') || s.includes('novo') || (!s && !doingTasks.includes(t) && !reviewTasks.includes(t)));
  });

  const totalCount = allEmpTasks.length;
  const doneCount = doneTasks.length;
  const doingCount = doingTasks.length;
  const reviewCount = reviewTasks.length;
  const backlogCount = backlogTasks.length;
  const rate = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  // Tarefas visíveis conforme a aba selecionada
  const displayedTasks = (() => {
    switch (activeTab) {
      case 'doing':
        return doingTasks;
      case 'backlog':
        return backlogTasks;
      case 'review':
        return reviewTasks;
      case 'done':
        return doneTasks;
      default:
        return allEmpTasks;
    }
  })();

  const renderStatusBadge = (task: Task) => {
    const isDone = isTaskCompleted(task);
    if (isDone) {
      return (
        <Badge variant="success" size="sm" className="flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" />
          <span>Concluída / Postar</span>
        </Badge>
      );
    }
    const overdueDays = getTaskOverdueDays(task);
    if (overdueDays > 0) {
      return (
        <Badge variant="danger" size="sm">
          Atrasada ({overdueDays}d)
        </Badge>
      );
    }
    const s = (task.status || '').toLowerCase();
    if (s === 'in_progress' || s.includes('doing') || s.includes('andamento')) {
      return (
        <Badge variant="primary" size="sm">
          Em Produção
        </Badge>
      );
    }
    if (s === 'in_review' || s.includes('revis') || s.includes('aprov')) {
      return (
        <Badge variant="warning" size="sm">
          Em Revisão
        </Badge>
      );
    }
    return (
      <Badge variant="default" size="sm">
        Backlog
      </Badge>
    );
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Detalhes de ${emp.name}`}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={() => setSelectedEmployeeForDetail(null)}
      />

      {/* Modal Card */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative bg-[#181818] rounded-3xl shadow-2xl border border-[#2E2E2E] max-w-3xl w-full p-6 sm:p-8 z-10 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto space-y-6 text-white"
      >
        {/* Glow de fundo */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#E4007E]/15 rounded-full blur-3xl pointer-events-none" />

        {/* 1. Header do Perfil */}
        <div className="flex items-start justify-between pb-6 border-b border-[#282828] relative z-10">
          <div className="flex items-center gap-4">
            <Avatar
              src={emp.avatarUrl}
              name={emp.name}
              alt={emp.name}
              size="xl"
              ring
              status={emp.status === 'online' ? 'online' : emp.status === 'busy' ? 'busy' : 'offline'}
              className="!w-20 !h-20 rounded-2xl shadow-lg [&>img]:rounded-2xl [&>div]:rounded-2xl [&>div]:text-2xl [&>div]:bg-gradient-to-tr [&>div]:from-[#222222] [&>div]:to-[#121212] [&>div]:border-2 [&>div]:border-[#E4007E]/50 [&>div]:text-[#E4007E]"
            />

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {emp.name}
                </h2>
                <Badge variant="primary" size="sm">
                  {emp.role || 'Colaborador'}
                </Badge>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Departamento: <strong className="text-slate-200">{emp.department || 'Criação'}</strong>
              </p>

              <div className="flex items-center gap-3 text-xs text-slate-400 mt-2 flex-wrap">
                <span className="flex items-center gap-1.5 bg-[#121212] px-2.5 py-1 rounded-lg border border-[#282828]">
                  <Mail className="w-3.5 h-3.5 text-[#E4007E]" />
                  {emp.email}
                </span>
                {emp.location && (
                  <span className="flex items-center gap-1.5 bg-[#121212] px-2.5 py-1 rounded-lg border border-[#282828]">
                    <MapPin className="w-3.5 h-3.5 text-[#E94E18]" />
                    {emp.location}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="icon"
              onClick={() => {
                setSelectedEmployeeForDetail(null);
                setEditingEmployee(emp);
              }}
              className="bg-[#222222] hover:bg-[#2A2A2A] border-[#303030]"
              title="Editar Perfil"
              aria-label="Editar Perfil"
            >
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              onClick={() => setSelectedEmployeeForDetail(null)}
              className="bg-[#222222] hover:bg-[#2A2A2A] border-[#303030]"
              title="Fechar Detalhes"
              aria-label="Fechar Detalhes"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* 2. Métricas & Desempenho */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 relative z-10">
          <div className="bg-[#121212] border border-[#282828] rounded-2xl p-3.5 text-center">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
              Total Atribuídas
            </span>
            <span className="text-2xl font-black text-white">{totalCount}</span>
          </div>

          <div className="bg-[#121212] border border-[#282828] rounded-2xl p-3.5 text-center">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block mb-1">
              Concluídas / Postar
            </span>
            <span className="text-2xl font-black text-emerald-400">{doneCount}</span>
          </div>

          <div className="bg-[#121212] border border-[#282828] rounded-2xl p-3.5 text-center">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#E4007E] block mb-1">
              Em Produção
            </span>
            <span className="text-2xl font-black text-[#E4007E]">{doingCount}</span>
          </div>

          <div className="bg-[#121212] border border-[#282828] rounded-2xl p-3.5 text-center">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#FFB903] block mb-1">
              Taxa de Eficiência
            </span>
            <span className="text-2xl font-black text-[#FFB903]">{rate}%</span>
          </div>
        </div>

        {/* 3. Seção de Demandas com Abas por Status */}
        <div className="space-y-4 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#E4007E]" />
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                Demandas do Colaborador ({displayedTasks.length})
              </h3>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setSelectedEmployeeForDetail(null);
                setIsNewTaskModalOpen(true);
              }}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              className="self-start sm:self-auto font-black shadow-xs"
            >
              Nova Tarefa
            </Button>
          </div>

          {/* Filtro de Abas por Status */}
          <div className="flex items-center gap-1 bg-[#121212] p-1 rounded-xl border border-[#2A2A2A] overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'all'
                  ? 'bg-[#282828] text-white shadow-xs font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Todas ({totalCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('doing')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'doing'
                  ? 'bg-[#E4007E]/20 text-[#E4007E] border border-[#E4007E]/40 font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Em Produção ({doingCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('review')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'review'
                  ? 'bg-amber-950/60 text-amber-300 border border-amber-800/60 font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Em Revisão ({reviewCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('backlog')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'backlog'
                  ? 'bg-slate-800 text-slate-200 border border-slate-700 font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Backlog ({backlogCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('done')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'done'
                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Concluídas ({doneCount})
            </button>
          </div>

          {/* Lista de Cards de Tarefas */}
          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {displayedTasks.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-500 bg-[#141414] border border-[#262626] rounded-2xl flex flex-col items-center gap-2">
                <Folder className="w-8 h-8 text-slate-600" />
                <span>Nenhuma demanda encontrada nesta categoria.</span>
              </div>
            ) : (
              displayedTasks.map((t) => {
                const isDone = isTaskCompleted(t);

                return (
                  <div
                    key={t.id}
                    onClick={() => {
                      setSelectedEmployeeForDetail(null);
                      setEditingTask(t);
                    }}
                    className="p-3.5 bg-[#141414] border border-[#282828] hover:border-[#3E3E3E] hover:bg-[#1E1E1E] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs cursor-pointer group transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span
                        className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                          isDone
                            ? 'bg-emerald-400'
                            : isTaskOverdue(t)
                            ? 'bg-rose-500'
                            : t.status === 'in_progress'
                            ? 'bg-[#E4007E]'
                            : 'bg-slate-500'
                        }`}
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4
                            className={`font-black text-sm text-white group-hover:text-[#E4007E] transition-colors truncate max-w-[280px] sm:max-w-[340px] ${
                              isDone ? 'line-through text-slate-400' : ''
                            }`}
                          >
                            {t.title}
                          </h4>

                          {/* Cliente / Label Tag */}
                          {(() => {
                            const firstLabel = (t.labels && t.labels.length > 0) ? t.labels[0] : (t.category ? { name: t.category.split(',')[0].trim() } : null);
                            if (!firstLabel || !firstLabel.name || firstLabel.name === 'Geral') return null;
                            const style = getLabelColorHex(firstLabel.name, firstLabel.color);
                            return (
                              <span
                                className="text-[10px] px-2 py-0.2 rounded-md font-black uppercase shadow-2xs border"
                                style={{
                                  backgroundColor: style.bg,
                                  color: style.text,
                                  borderColor: style.border,
                                }}
                              >
                                {firstLabel.name}
                              </span>
                            );
                          })()}
                        </div>

                        {/* Metadados: Anexos e Comentários */}
                        <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                          {t.projectName && (
                            <span className="font-semibold text-slate-300 truncate max-w-[120px]">
                              {t.projectName}
                            </span>
                          )}
                          {(t.commentsCount || (t.comments && t.comments.length)) ? (
                            <span className="flex items-center gap-1 text-[#E4007E] font-bold">
                              <MessageSquare className="w-3 h-3" />
                              <span>{t.commentsCount || t.comments?.length}</span>
                            </span>
                          ) : null}
                          {(t.attachmentsCount || (t.attachments && t.attachments.length)) ? (
                            <span className="flex items-center gap-1 text-[#E4007E] font-bold">
                              <Paperclip className="w-3 h-3" />
                              <span>{t.attachmentsCount || t.attachments?.length}</span>
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {/* Lado Direito: Status e Prazo */}
                    <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                      <span className="text-[11px] text-slate-300 font-bold">
                        {t.dueDate && t.dueDate !== 'Sem prazo' ? t.dueDate : 'Sem prazo'}
                      </span>
                      {renderStatusBadge(t)}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
