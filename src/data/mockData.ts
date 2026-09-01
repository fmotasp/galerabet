import { Employee, Project, Task, Sprint, ActivityItem, TrelloSettings, SpineStatusConfig } from '../types';

export const DEFAULT_SPINE_STATUSES: SpineStatusConfig[] = [
  {
    id: 'backlog',
    label: 'Backlog',
    color: 'text-slate-600',
    bg: 'bg-slate-100',
    dotColor: '#64748B',
    gradient: 'from-slate-500 to-slate-700',
    isDefault: true,
  },
  {
    id: 'novos_pedidos',
    label: 'Novos Pedidos',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/20',
    dotColor: '#06B6D4',
    gradient: 'from-cyan-500 to-blue-600',
    isDefault: true,
  },
  {
    id: 'in_progress',
    label: 'Em Progresso',
    color: 'text-[#5D55F9]',
    bg: 'bg-[#ECEBFF]',
    dotColor: '#5D55F9',
    gradient: 'from-sky-400 via-blue-500 to-sky-600',
    isDefault: true,
  },
  {
    id: 'in_review',
    label: 'Em Revisão',
    color: 'text-[#0284C7]',
    bg: 'bg-[#E0F2FE]',
    dotColor: '#0284C7',
    gradient: 'from-purple-500 to-indigo-600',
    isDefault: true,
  },
  {
    id: 'overdue',
    label: 'Atrasadas / Urgente',
    color: 'text-[#E11D48]',
    bg: 'bg-[#FFE4E6]',
    dotColor: '#E11D48',
    gradient: 'from-rose-500 to-red-600',
    isDefault: true,
  },
  {
    id: 'aprovar',
    label: 'Aprovar',
    color: 'text-amber-400',
    bg: 'bg-amber-500/20',
    dotColor: '#F59E0B',
    gradient: 'from-amber-500 to-yellow-600',
    isDefault: true,
  },
  {
    id: 'postar',
    label: 'Postar',
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/20',
    dotColor: '#6366F1',
    gradient: 'from-indigo-500 to-purple-600',
    isDefault: true,
  },
  {
    id: 'done',
    label: 'Concluídas',
    color: 'text-emerald-600',
    bg: 'bg-emerald-100',
    dotColor: '#10B981',
    gradient: 'from-emerald-500 to-green-600',
    isDefault: true,
  },
];

export const INITIAL_SPRINT: Sprint = {
  id: 'sprint-active',
  name: 'Sprint Ativa',
  period: 'Atual',
  goal: 'Sincronizado diretamente do Trello',
  totalTasks: 0,
  completedTasks: 0,
  overdueTasks: 0,
  velocity: 0,
  velocityChange: '0%',
  isCurrent: true,
};

export const INITIAL_SPRINT_LIST: Sprint[] = [INITIAL_SPRINT];

export const INITIAL_EMPLOYEES: Employee[] = [];

export const INITIAL_PROJECTS: Project[] = [];

export const INITIAL_TASKS: Task[] = [];

export const INITIAL_ACTIVITIES: ActivityItem[] = [];

export const INITIAL_TRELLO_SETTINGS: TrelloSettings = {
  isConnected: false,
  workspaceName: '',
  apiKey: '',
  serverToken: '',
  autoSync: true,
  syncMemberAssignments: true,
  importLabelsAndTags: false,
  targetBoard: '',
  boardMappings: [],
  lastSyncedAt: undefined,
};
