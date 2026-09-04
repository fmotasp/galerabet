import React, { useState } from 'react';
import {
  MoreHorizontal,
  Plus,
  ArrowUpRight,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ChevronDown,
  Filter,
  Flame,
  Calendar,
  Layers,
  Edit2,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Task, TaskStatus, Employee } from '../../types';
import { getLabelColorHex } from '../tasks/TasksView';
import { isTaskOverdue, isTaskCompleted, isTaskInProgress, getTaskOverdueDays, parseTaskDueDate } from '../../lib/taskDateUtils';
import { CreativeRankingWidget } from './CreativeRankingWidget';

export const DashboardView: React.FC = () => {
  const {
    currentSprint,
    sprints,
    setCurrentSprintId,
    tasks,
    employees,
    projects,
    activeFilter,
    setActiveFilter,
    setIsNewTaskModalOpen,
    setEditingTask,
    moveTaskStatus,
    toggleFlagTask,
    computedMetrics,
    activities,
    setSelectedEmployeeForDetail,
    updateCurrentSprintGoal,
    currentUser,
  } = useApp();

  const [isSprintDropdownOpen, setIsSprintDropdownOpen] = useState(false);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [goalText, setGoalText] = useState(currentSprint.goal);
  const [isTasksExpanded, setIsTasksExpanded] = useState(false);
  const [isWorkloadExpanded, setIsWorkloadExpanded] = useState(false);

  const isTaskAssignedToMe = (task: Task) => {
    if (!currentUser) return false;
    if (task.isMine) return true;

    const myId = (currentUser.id || '').toString().toLowerCase().trim();
    const myEmployeeId = (currentUser.employeeId || '').toString().toLowerCase().trim();
    const myName = (currentUser.name || '').toLowerCase().trim();
    const myFirstName = myName.split(' ')[0].trim();
    const myUsername = (currentUser.username || '').toLowerCase().trim();
    const myEmailPrefix = (currentUser.email || '').split('@')[0].toLowerCase().trim();
    const myInitials = (currentUser.initials || '').toUpperCase().trim();
    const myTrelloId = (currentUser.trelloMemberId || '').toLowerCase().trim();

    // 1. Assignee direto
    if (task.assigneeId) {
      const aId = task.assigneeId.toString().toLowerCase().trim();
      if (myId && aId === myId) return true;
      if (myEmployeeId && aId === myEmployeeId) return true;
      if (myTrelloId && aId === myTrelloId) return true;
    }

    if (task.assigneeName) {
      const aName = task.assigneeName.toLowerCase().trim();
      if (myName && (aName.includes(myName) || myName.includes(aName))) return true;
      if (myFirstName && myFirstName.length > 2 && (aName.includes(myFirstName) || myFirstName.includes(aName))) return true;
      if (myUsername && (aName.includes(myUsername) || myUsername.includes(aName))) return true;
      if (myEmailPrefix && (aName.includes(myEmailPrefix) || myEmailPrefix.includes(aName))) return true;
    }

    if (myInitials && task.assigneeInitials && task.assigneeInitials.toUpperCase().trim() === myInitials) {
      return true;
    }

    // 2. Lista de membros da tarefa
    if (task.members && task.members.length > 0) {
      const isMemberMatch = task.members.some((m) => {
        const mId = (m.id || '').toString().toLowerCase().trim();
        if (myId && mId === myId) return true;
        if (myEmployeeId && mId === myEmployeeId) return true;
        if (myTrelloId && mId === myTrelloId) return true;

        const mName = (m.name || '').toLowerCase().trim();
        if (myName && (mName.includes(myName) || myName.includes(mName))) return true;
        if (myFirstName && myFirstName.length > 2 && (mName.includes(myFirstName) || myFirstName.includes(mName))) return true;
        if (myUsername && (mName.includes(myUsername) || myUsername.includes(mName))) return true;

        const mInitials = (m.initials || '').toUpperCase().trim();
        if (myInitials && mInitials === myInitials) return true;

        return false;
      });
      if (isMemberMatch) return true;
    }

    // 3. Coluna nominal no Trello
    if (task.trelloListName) {
      const lName = task.trelloListName.toLowerCase();
      if (
        (myFirstName && myFirstName.length > 2 && lName.includes(myFirstName)) ||
        (myEmailPrefix && myEmailPrefix.length > 2 && lName.includes(myEmailPrefix)) ||
        (myFirstName === 'bismarques' && lName.includes('marques')) ||
        (myFirstName === 'gerdson' && lName.includes('gerdeson')) ||
        (myFirstName === 'felipe' && (lName.includes('fmota') || lName.includes('mota'))) ||
        (myFirstName === 'daiane' && lName.includes('dai'))
      ) {
        return true;
      }
    }

    return false;
  };

  const isTaskAlerted = (task: Task): boolean => {
    if (isTaskCompleted(task)) return false;
    if (task.isFlagged || isTaskOverdue(task) || task.status === 'blocked') {
      return true;
    }
    const due = parseTaskDueDate(task.dueDate);
    if (due) {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      due.setHours(0, 0, 0, 0);
      const diffTime = due.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays <= 2) return true;
    }
    return false;
  };

  // Filter tasks based on activeFilter
  const filteredTasks = tasks.filter((task) => {
    if (activeFilter === 'mine') return isTaskAssignedToMe(task);
    if (activeFilter === 'flagged') return isTaskAlerted(task);
    return true;
  });

  const getStatusBadge = (task: Task) => {
    const overdueDays = getTaskOverdueDays(task);
    if (overdueDays > 0) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-950/80 text-rose-300 border border-rose-800 whitespace-nowrap">
          Atrasada ({overdueDays}d)
        </span>
      );
    }
    if (isTaskCompleted(task)) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800 whitespace-nowrap">
          Concluída
        </span>
      );
    }
    switch (task.status) {
      case 'in_progress':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-950/80 text-blue-300 border border-blue-800 whitespace-nowrap">
            Em progresso
          </span>
        );
      case 'in_review':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-sky-950/80 text-sky-300 border border-sky-800 whitespace-nowrap">
            Em revisão
          </span>
        );
      case 'overdue':
        if (isTaskOverdue(task)) {
          return (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-950/80 text-rose-300 border border-rose-800 whitespace-nowrap">
              Atrasada
            </span>
          );
        }
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-950/80 text-blue-300 border border-blue-800 whitespace-nowrap">
            Em progresso
          </span>
        );
      case 'blocked':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700 whitespace-nowrap">
            Bloqueada
          </span>
        );
      case 'backlog':
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#011C39] text-slate-300 border border-slate-700 whitespace-nowrap">
            Backlog
          </span>
        );
    }
  };

  const getCategoryColor = (category: string) => {
    return 'bg-[#011C39] text-slate-200 border border-slate-700';
  };

  const getIndicatorColor = (task: Task) => {
    if (isTaskCompleted(task)) {
      return 'bg-[#16A34A]';
    }
    if (isTaskOverdue(task)) {
      return 'bg-[#E11D48]';
    }
    const s = task.status;
    switch (s) {
      case 'in_progress':
        return 'bg-[#5D55F9]';
      case 'in_review':
        return 'bg-[#0284C7]';
      case 'blocked':
        return 'bg-[#94A3B8]';
      case 'done':
        return 'bg-[#16A34A]';
      default:
        return 'bg-slate-500';
    }
  };

  const handleSaveGoal = () => {
    updateCurrentSprintGoal(goalText);
    setIsEditingGoal(false);
  };

  // Dynamic metrics calculated from active filter context (filteredTasks)
  const dashboardMetrics = {
    totalTasks: filteredTasks.length,
    completedTasks: filteredTasks.filter((t) => isTaskCompleted(t)).length,
    inProgressTasks: filteredTasks.filter((t) => isTaskInProgress(t)).length,
    backlogTasks: filteredTasks.filter((t) => !isTaskCompleted(t) && !isTaskInProgress(t) && (t.status === 'backlog' || t.status === 'blocked')).length,
    overdueTasks: filteredTasks.filter((t) => isTaskOverdue(t)).length,
    completionPercentage:
      filteredTasks.length > 0
        ? Math.round((filteredTasks.filter((t) => isTaskCompleted(t)).length / filteredTasks.length) * 100)
        : 0,
    activeProjectsCount: new Set(filteredTasks.map((t) => t.projectId).filter(Boolean)).size || projects.filter((p) => !['proj-orion', 'proj-bloom', 'proj-aurora', 'proj-apex'].includes(p.id)).length,
    velocity: filteredTasks.reduce((acc, t) => acc + (t.points || 1), 0),
    escalatedCount: filteredTasks.filter((t) => isTaskAlerted(t)).length,
  };

  // Helper to count ONLY active demands in user's column or in progress (novos pedidos)
  const getActiveWorkloadCount = (emp: Employee) => {
    const empFirstName = emp.name.toLowerCase().split(' ')[0];
    const empFullName = emp.name.toLowerCase();

    return filteredTasks.filter((t) => {
      const s = (t.status || '').toLowerCase();
      const listName = (t.trelloListName || '').toLowerCase();

      // Se a tarefa está em aprovação, concluída ou postada, não conta como backlog/em andamento do designer
      if (
        s === 'done' ||
        listName.includes('aprov') ||
        listName.includes('postar') ||
        listName.includes('postad') ||
        listName.includes('final') ||
        listName.includes('revis')
      ) {
        return false;
      }

      // Verifica se a tarefa pertence a este funcionário
      const isAssigned =
        (t.assigneeId && t.assigneeId === emp.id) ||
        (t.assigneeName && t.assigneeName.toLowerCase().includes(empFirstName)) ||
        (t.members && t.members.some((m) => m.name.toLowerCase().includes(empFirstName) || m.id === emp.id)) ||
        (listName.includes(empFirstName) && empFirstName.length > 2);

      if (!isAssigned) return false;

      const isStatusActive =
        s === 'in_progress' ||
        s === 'backlog' ||
        s.includes('doing') ||
        s.includes('andamento') ||
        s.includes('progress');

      return isStatusActive;
    }).length;
  };

  // Total unassigned or backlog tasks waiting for assignment/production
  const unassignedBacklogTasks = filteredTasks.filter((t) => {
    const s = (t.status || '').toLowerCase();
    const isDone = isTaskCompleted(t);
    return !isDone && (s === 'backlog' || s === 'novos_pedidos' || !t.assigneeId || t.assigneeId === 'unassigned');
  });

  const totalBacklogCount = unassignedBacklogTasks.length;

  // Filter workload members to ONLY Designers and Video Makers, sorted by Backlog + In Progress tasks
  const workloadMembers = employees
    .filter((emp) => {
      const roleLower = (emp.role || '').toLowerCase();
      const nameLower = (emp.name || '').toLowerCase();
      const isDesignerOrVideoMaker =
        roleLower.includes('designer') ||
        roleLower.includes('video maker') ||
        roleLower.includes('videomaker') ||
        nameLower.includes('rafael barbosa') ||
        nameLower.includes('matheus bahia') ||
        nameLower.includes('davi soares') ||
        nameLower.includes('gerson') ||
        nameLower.includes('gerdson') ||
        nameLower.includes('dai pessi') ||
        nameLower.includes('bismarques') ||
        nameLower.includes('felipe mota') ||
        nameLower.includes('marcos roberto');

      const isGestor = roleLower.includes('gestor') || nameLower.includes('fabio mozart') || nameLower.includes('giovanni dias');

      return isDesignerOrVideoMaker && !isGestor;
    })
    .map((emp) => {
      const empFirstName = emp.name.toLowerCase().split(' ')[0];
      const empId = emp.id.toLowerCase().trim();

      // Todas as demandas do colaborador
      const allEmpTasks = filteredTasks.filter((t) => {
        const isAssigned =
          (t.assigneeId && (t.assigneeId === emp.id || t.assigneeId.toLowerCase().trim() === empId)) ||
          (t.assigneeName && t.assigneeName.toLowerCase().includes(empFirstName)) ||
          (t.members && t.members.some((m) => m.name.toLowerCase().includes(empFirstName) || m.id === emp.id)) ||
          (t.trelloListName && t.trelloListName.toLowerCase().includes(empFirstName) && empFirstName.length > 2);
        return Boolean(isAssigned);
      });

      const totalDemands = allEmpTasks.length;
      const activeDemands = getActiveWorkloadCount(emp);
      
      // Capacidade máxima simultânea recomendada: 4 demandas
      const maxIdealCapacity = 4;
      const availableCapacity = Math.max(0, maxIdealCapacity - activeDemands);

      return {
        emp,
        totalDemands,
        activeDemands,
        availableCapacity,
        maxIdealCapacity,
      };
    })
    .sort((a, b) => b.activeDemands - a.activeDemands);

  // SVG Circular Donut calculations
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const donePercent = dashboardMetrics.completionPercentage;
  const strokeDashoffset = circumference - (donePercent / 100) * circumference;

  return (
    <div className="space-y-6 w-full px-4 sm:px-8 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Header Title */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#E4007E] to-[#E94E18] flex items-center justify-center text-white shadow-lg shadow-[#E4007E]/25">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">Painel Geral</h1>
            <p className="text-xs text-slate-400 font-medium">Visão executiva e métricas em tempo real</p>
          </div>
        </div>

        {/* Right Header Controls: Filter Pill + New Task */}
        <div className="flex items-center gap-3">
          {/* Segmented Filter Pill */}
          <div className="flex items-center bg-[#181818] p-1 rounded-2xl border border-[#2A2A2A] shadow-md">
            <button
              id="filter-all"
              onClick={() => setActiveFilter('all')}
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
              onClick={() => setActiveFilter('flagged')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeFilter === 'flagged'
                  ? 'bg-gradient-to-r from-[#E4007E] to-[#E94E18] text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Com Alerta
            </button>
          </div>

          <button
            id="btn-dashboard-new-task"
            onClick={() => setIsNewTaskModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#E4007E] to-[#E94E18] hover:opacity-95 text-white rounded-xl text-xs sm:text-sm font-black shadow-md shadow-[#E4007E]/25 transition-all active:scale-98 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Nova Tarefa</span>
          </button>
        </div>
      </div>

      {/* 3 Stat KPI Cards - High Contrast Dark Theme */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Card 1: Total Tasks */}
        <div className="bg-[#181818] rounded-2xl p-5 border border-[#2A2A2A] shadow-lg relative flex flex-col justify-between hover:border-[#383838] transition-all">
          <div className="flex items-start justify-between">
            <span className="text-3xl font-black text-white tracking-tight">
              {dashboardMetrics.totalTasks}
            </span>
            <button className="text-slate-400 hover:text-white p-1 transition-colors cursor-pointer">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
          <span className="text-xs text-slate-300 font-bold uppercase tracking-wider mt-1">total de tarefas</span>
          <div className="mt-4 pt-3 border-t border-[#2A2A2A] flex items-center justify-between text-xs">
            <span className="text-[#E4007E] font-bold">
              {dashboardMetrics.activeProjectsCount} projetos ativos
            </span>
            <span className="text-slate-400 font-medium">sprint atual</span>
          </div>
        </div>

        {/* Card 2: Completed */}
        <div className="bg-[#181818] rounded-2xl p-5 border border-[#2A2A2A] shadow-lg relative flex flex-col justify-between hover:border-[#383838] transition-all overflow-hidden">
          <div className="flex items-start justify-between">
            <span className="text-3xl font-black text-[#10B981] tracking-tight">
              {dashboardMetrics.completedTasks}
            </span>
            <button className="text-slate-400 hover:text-white p-1 transition-colors cursor-pointer">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
          <span className="text-xs text-slate-300 font-bold uppercase tracking-wider mt-1">concluídas</span>
          <div className="mt-4 pt-3 border-t border-[#2A2A2A] flex items-center justify-between text-xs">
            <span className="text-[#10B981] font-bold">
              {dashboardMetrics.completionPercentage}% concluído
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
              {dashboardMetrics.overdueTasks}
            </span>
            <button className="text-slate-400 hover:text-white p-1 transition-colors cursor-pointer">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
          <span className="text-xs text-slate-300 font-bold uppercase tracking-wider mt-1">atrasadas</span>
          <div className="mt-4 pt-3 border-t border-[#2A2A2A] flex items-center justify-between text-xs">
            <span className="text-rose-400 font-bold">
              {dashboardMetrics.escalatedCount} com alerta / pendência
            </span>
            <span className="text-slate-400 font-medium">atenção</span>
          </div>
          {/* Accent bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-rose-500" />
        </div>
      </div>

      {/* Main Grid: Left Column (Active Tasks + Team Workload) & Right Column (Creative Ranking + Sprint Overview) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7 cols): Active Tasks & Team Workload */}
        <div className="lg:col-span-7 space-y-6">
          {/* Active Tasks Widget */}
          <div className="bg-[#181818] rounded-2xl p-6 border border-[#2A2A2A] shadow-lg">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <h3 className="font-bold text-white text-base sm:text-lg">Tarefas Ativas</h3>
                <span className="bg-[#222222] text-[#E4007E] border border-[#303030] text-xs font-bold px-2.5 py-0.5 rounded-full">
                  {filteredTasks.length} tarefas
                </span>
              </div>
              <button
                onClick={() => setIsNewTaskModalOpen(true)}
                className="text-slate-400 hover:text-white p-1 transition-colors cursor-pointer"
                title="Adicionar tarefa"
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>

            {/* Task rows */}
            <div className="space-y-3">
              {filteredTasks.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm font-medium">
                  Nenhuma tarefa corresponde ao filtro ativo.
                </div>
              ) : (
                (isTasksExpanded ? filteredTasks : filteredTasks.slice(0, 5)).map((task) => (
                  <div
                    key={task.id}
                    id={`task-row-${task.id}`}
                    onClick={() => setEditingTask(task)}
                    className="group flex items-center justify-between gap-3 p-3.5 rounded-xl border border-[#2A2A2A] bg-[#202020]/60 hover:bg-[#262626] hover:border-[#383838] transition-all cursor-pointer"
                  >
                    {/* Left indicator & Title */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className={`w-3.5 h-3.5 rounded-md ${getIndicatorColor(
                          task
                        )} shrink-0 transition-transform group-hover:scale-110`}
                      />
                      <span className="font-semibold text-white text-sm truncate group-hover:text-[#E4007E] transition-colors">
                        {task.title}
                      </span>
                    </div>

                    {/* Right Metadata: Category, Assignee, Date, Status */}
                    <div className="flex items-center gap-3 shrink-0">
                      {(() => {
                        const firstLabel = (task.labels && task.labels.length > 0) ? task.labels[0] : (task.category ? { name: task.category.split(',')[0].trim() } : null);
                        if (!firstLabel || !firstLabel.name || firstLabel.name === 'Geral') return null;
                        const style = getLabelColorHex(firstLabel.name, firstLabel.color);
                        return (
                          <span
                            className="hidden sm:inline-flex items-center gap-1 text-[11px] px-2.5 py-0.8 rounded-lg font-black tracking-wide uppercase shadow-2xs border"
                            style={{
                              backgroundColor: style.bg,
                              color: style.text,
                              borderColor: style.border,
                            }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-white/80" />
                            {firstLabel.name}
                          </span>
                        );
                      })()}

                      {/* Assignee Avatar */}
                      <div
                        className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#02376F] to-[#011C39] border border-[#FFB903]/40 text-white font-bold text-[11px] flex items-center justify-center shadow-xs"
                        title={task.assigneeName}
                      >
                        {task.assigneeInitials}
                      </div>

                      <span className="hidden md:inline-block text-xs text-slate-300 font-semibold min-w-[50px] text-right">
                        {task.dueDate || 'Sem prazo'}
                      </span>

                      <div>{getStatusBadge(task)}</div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Expand / Collapse Button for Active Tasks */}
            {filteredTasks.length > 5 && (
              <button
                type="button"
                onClick={() => setIsTasksExpanded(!isTasksExpanded)}
                className="w-full py-2.5 text-center text-xs font-bold text-[#E4007E] hover:text-pink-400 transition-colors flex items-center justify-center gap-1 cursor-pointer pt-3 border-t border-[#262626] mt-4"
              >
                <span>{isTasksExpanded ? 'Mostrar menos tarefas' : `Ver mais tarefas (+${filteredTasks.length - 5})`}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isTasksExpanded ? 'rotate-180' : ''}`} />
              </button>
            )}
          </div>

          {/* Team Workload Widget (Posicionado abaixo de Tarefas Ativas) */}
          <div className="bg-[#181818] rounded-2xl p-6 border border-[#2A2A2A] shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-base">Carga de Trabalho da Equipe</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Capacidade ativa e sugestões de distribuição do Backlog
                </p>
              </div>
              {totalBacklogCount > 0 && (
                <span className="text-[10px] font-black bg-[#E4007E]/10 border border-[#E4007E]/30 text-[#E4007E] px-2.5 py-1 rounded-full animate-pulse shrink-0">
                  {totalBacklogCount} no Backlog
                </span>
              )}
            </div>

            <div className="space-y-3.5">
              {workloadMembers.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">
                  Nenhum designer ou video maker ativo encontrado.
                </div>
              ) : (
                (isWorkloadExpanded ? workloadMembers : workloadMembers.slice(0, 5)).map(({ emp, totalDemands, activeDemands, availableCapacity, maxIdealCapacity }) => {
                  const percentUsed = Math.min(100, Math.round((activeDemands / maxIdealCapacity) * 100));

                  return (
                    <div
                      key={emp.id}
                      id={`workload-member-${emp.id}`}
                      onClick={() => setSelectedEmployeeForDetail(emp)}
                      className="group cursor-pointer p-3 -mx-2 rounded-2xl hover:bg-[#262626] border border-transparent hover:border-[#383838] transition-all bg-[#141414]"
                    >
                      <div className="flex items-center justify-between mb-2 gap-2">
                        {/* Member Info */}
                        <div className="flex items-center gap-3 min-w-0">
                          {emp.avatarUrl ? (
                            <img
                              src={emp.avatarUrl}
                              alt={emp.name}
                              className="w-9 h-9 rounded-full object-cover ring-1 ring-[#E4007E]/40 shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-[#222222] border border-[#E4007E]/40 flex items-center justify-center font-bold text-xs text-[#E4007E] shadow-xs shrink-0">
                              {emp.initials}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-bold text-white text-xs sm:text-sm group-hover:text-[#E4007E] transition-colors truncate">
                              {emp.name}
                            </div>
                            <div className="text-[11px] text-slate-400 font-medium">
                              {emp.role || 'Colaborador'}
                            </div>
                          </div>
                        </div>

                        {/* Demands Count Badge */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[11px] bg-[#222222] border border-[#303030] text-slate-200 font-bold px-2 py-0.5 rounded-lg" title="Total de demandas atribuídas">
                            <strong className="text-[#E4007E]">{totalDemands}</strong> total
                          </span>
                          <span className="text-[11px] bg-[#2A2A2A] border border-[#383838] text-pink-300 font-bold px-2 py-0.5 rounded-lg" title="Demandas ativas em produção">
                            {activeDemands} ativas
                          </span>
                        </div>
                      </div>

                      {/* Suggestion Badge (How many tasks can receive) */}
                      <div className="flex items-center justify-between text-[10px] mb-1.5 font-bold">
                        <span className="text-slate-400">Sugestão de Alocação:</span>
                        {availableCapacity > 0 ? (
                          <span className="text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <span>✨ Pode receber até <strong>+{availableCapacity}</strong> {availableCapacity === 1 ? 'demanda' : 'demandas'}</span>
                          </span>
                        ) : activeDemands === maxIdealCapacity ? (
                          <span className="text-amber-400 bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded-md">
                            ⚠️ Carga ideal atingida (0 vagas)
                          </span>
                        ) : (
                          <span className="text-rose-400 bg-rose-950/60 border border-rose-800/60 px-2 py-0.5 rounded-md">
                            🚨 Sobrecarga (+{activeDemands - maxIdealCapacity} acima do limite)
                          </span>
                        )}
                      </div>

                      {/* Capacity Progress Bar */}
                      <div className="w-full h-1.5 bg-[#222222] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            percentUsed >= 100
                              ? 'bg-rose-500'
                              : percentUsed >= 75
                              ? 'bg-[#E94E18]'
                              : percentUsed >= 50
                              ? 'bg-[#E4007E]'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${activeDemands === 0 ? 0 : Math.min(100, Math.max(5, percentUsed))}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Expand / Collapse Button for Team Workload */}
            {workloadMembers.length > 5 && (
              <button
                type="button"
                onClick={() => setIsWorkloadExpanded(!isWorkloadExpanded)}
                className="w-full py-2.5 text-center text-xs font-bold text-[#E4007E] hover:text-pink-400 transition-colors flex items-center justify-center gap-1 cursor-pointer pt-3 border-t border-[#262626] mt-4"
              >
                <span>{isWorkloadExpanded ? 'Mostrar menos colaboradores' : `Ver mais colaboradores (+${workloadMembers.length - 5})`}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isWorkloadExpanded ? 'rotate-180' : ''}`} />
              </button>
            )}
          </div>
        </div>

        {/* Right Column (5 cols): Creative Ranking & Sprint Overview */}
        <div className="lg:col-span-5 space-y-6">
          {/* 🏆 Ranking de Produtividade Criativa (Designers & Video Makers) */}
          <CreativeRankingWidget
            employees={employees}
            tasks={tasks}
            onSelectEmployee={setSelectedEmployeeForDetail}
          />

          {/* Sprint Overview Widget */}
          <div className="bg-[#181818] rounded-2xl p-6 border border-[#2A2A2A] shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white text-base">Visão Geral da Sprint</h3>
              <button className="text-slate-400 hover:text-white p-1 transition-colors cursor-pointer">
                <MoreHorizontal className="w-5 h-5" />
              </button>
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
                    {dashboardMetrics.completionPercentage}%
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
                  <span className="font-bold text-white">{dashboardMetrics.completedTasks}</span>
                </div>

                <div className="flex items-center justify-between text-slate-300 font-medium">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <span>atrasadas</span>
                  </div>
                  <span className="font-bold text-white">{dashboardMetrics.overdueTasks}</span>
                </div>

                <div className="flex items-center justify-between text-slate-300 font-medium">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#E4007E]" />
                    <span>em progresso</span>
                  </div>
                  <span className="font-bold text-white">{dashboardMetrics.inProgressTasks}</span>
                </div>

                <div className="flex items-center justify-between text-slate-300 font-medium">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
                    <span>backlog</span>
                  </div>
                  <span className="font-bold text-white">{dashboardMetrics.backlogTasks}</span>
                </div>

                <div className="flex items-center justify-between text-slate-400 pt-2 border-t border-[#2A2A2A] font-medium">
                  <span>dias restantes</span>
                  <span className="font-bold text-white">7 dias</span>
                </div>
              </div>
            </div>

            {/* Sprint Burndown & Velocity Trajectory */}
            <div className="mt-6 pt-6 border-t border-[#2A2A2A]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-[#E4007E]" />
                  <span className="text-xs font-bold text-white">Desempenho da Sprint (Burndown)</span>
                </div>
                <span className="text-[11px] font-bold text-[#E4007E] bg-[#222222] border border-[#303030] px-2 py-0.5 rounded-full">
                  {dashboardMetrics.completionPercentage >= 50 ? '🔥 Alta Velocidade' : '⚡ Em Andamento'}
                </span>
              </div>

              {/* Burndown SVG Graph */}
              <div className="w-full h-24 bg-[#141414] rounded-xl p-2 relative overflow-hidden border border-[#2A2A2A] flex flex-col justify-between">
                <svg className="w-full h-16 overflow-visible" viewBox="0 0 300 60">
                  <defs>
                    <linearGradient id="burndownGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#E4007E" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#E94E18" stopOpacity="0.05" />
                    </linearGradient>
                    <linearGradient id="burndownStroke" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#E4007E" />
                      <stop offset="100%" stopColor="#E94E18" />
                    </linearGradient>
                  </defs>
                  {/* Ideal Line (Dashed) */}
                  <line x1="10" y1="10" x2="290" y2="50" stroke="#475569" strokeWidth="2" strokeDasharray="4 4" />
                  {/* Real Burn Line Area */}
                  <path
                    d={`M 10 10 Q 80 15, 140 30 T 290 ${60 - Math.max(10, Math.min(50, (dashboardMetrics.completionPercentage / 100) * 45 + 10))}`}
                    fill="url(#burndownGrad)"
                  />
                  {/* Real Burn Line */}
                  <path
                    d={`M 10 10 Q 80 15, 140 30 T 290 ${60 - Math.max(10, Math.min(50, (dashboardMetrics.completionPercentage / 100) * 45 + 10))}`}
                    fill="none"
                    stroke="url(#burndownStroke)"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  {/* Progress Node */}
                  <circle
                    cx="290"
                    cy={60 - Math.max(10, Math.min(50, (dashboardMetrics.completionPercentage / 100) * 45 + 10))}
                    r="4"
                    fill="#E94E18"
                    className="animate-ping opacity-75"
                  />
                  <circle
                    cx="290"
                    cy={60 - Math.max(10, Math.min(50, (dashboardMetrics.completionPercentage / 100) * 45 + 10))}
                    r="4"
                    fill="#E94E18"
                  />
                </svg>
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold px-1">
                  <span>Dia 1</span>
                  <span>Dia 7</span>
                  <span>Dia 14 (Hoje)</span>
                </div>
              </div>
            </div>

            {/* Sprint Goal Box */}
            <div className="mt-5 p-3.5 bg-[#141414] rounded-xl border border-[#2A2A2A] text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-white">
                  {currentSprint.name} · {currentSprint.period}
                </span>
                <button
                  onClick={() => setIsEditingGoal(!isEditingGoal)}
                  className="text-[#E4007E] hover:text-pink-300 p-0.5 transition-colors cursor-pointer"
                  title="Editar objetivo da sprint"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              </div>

              {isEditingGoal ? (
                <div className="mt-2 space-y-2">
                  <textarea
                    value={goalText}
                    onChange={(e) => setGoalText(e.target.value)}
                    rows={2}
                    className="w-full text-xs p-2 rounded-lg border border-[#303030] bg-[#181818] text-white focus:outline-none focus:border-[#E4007E]"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setIsEditingGoal(false)}
                      className="px-2 py-1 text-slate-400 hover:text-white text-[11px] cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSaveGoal}
                      className="px-2.5 py-1 bg-[#E4007E] text-white rounded-md text-[11px] font-black cursor-pointer"
                    >
                      Salvar Objetivo
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-slate-300 leading-relaxed">
                  <span className="font-bold text-white">Objetivo: </span>
                  {currentSprint.goal}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Live Activity Stream Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {activities.slice(0, 3).map((act) => (
          <div
            key={act.id}
            className="bg-[#181818] rounded-2xl p-4 border border-[#2A2A2A] shadow-md flex items-center gap-3 text-xs"
          >
            <span
              className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                act.dotColor === 'orange'
                  ? 'bg-[#E94E18]'
                  : act.dotColor === 'green'
                  ? 'bg-[#10B981]'
                  : act.dotColor === 'purple'
                  ? 'bg-[#E4007E]'
                  : 'bg-[#E4007E]'
              }`}
            />
            <div className="flex-1 min-w-0">
              <p className="text-slate-200 truncate">
                <span className="font-bold text-white">{act.userName}</span> {act.message}
              </p>
              <span className="text-[11px] text-slate-400 block mt-0.5">{act.timeAgo}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
