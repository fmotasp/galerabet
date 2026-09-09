import { Employee, Project, Task, Sprint, ActivityItem, SpineStatusConfig } from '../types';

export const DEFAULT_SPINE_STATUSES: SpineStatusConfig[] = [
  {
    id: 'backlog',
    label: 'Backlog',
    color: 'text-slate-300',
    bg: 'bg-slate-800/80 border border-slate-700',
    dotColor: '#64748B',
    isDefault: true,
  },
  {
    id: 'novos_pedidos',
    label: 'Novos Pedidos',
    color: 'text-cyan-300',
    bg: 'bg-cyan-950/80 border border-cyan-700/60',
    dotColor: '#06B6D4',
    isDefault: true,
  },
  {
    id: 'in_progress',
    label: 'Em Produção',
    color: 'text-blue-300',
    bg: 'bg-blue-950/80 border border-blue-700/60',
    dotColor: '#3B82F6',
    isDefault: true,
  },
  {
    id: 'in_review',
    label: 'Em Aprovação',
    color: 'text-amber-300',
    bg: 'bg-amber-950/80 border border-amber-700/60',
    dotColor: '#F59E0B',
    isDefault: true,
  },
  {
    id: 'ajustes',
    label: 'Ajustes',
    color: 'text-rose-300',
    bg: 'bg-rose-950/80 border border-rose-700/60',
    dotColor: '#E11D48',
    isDefault: true,
  },
  {
    id: 'postar',
    label: 'Postar',
    color: 'text-indigo-300',
    bg: 'bg-indigo-950/80 border border-indigo-700/60',
    dotColor: '#6366F1',
    isDefault: true,
  },
  {
    id: 'done',
    label: 'Concluído',
    color: 'text-emerald-300',
    bg: 'bg-emerald-950/80 border border-emerald-700/60',
    dotColor: '#10B981',
    isDefault: true,
  },
];

export const INITIAL_SPRINT: Sprint = {
  id: 'sprint-active',
  name: 'Sprint Ativa',
  period: 'Atual',
  goal: 'Foco nas entregas prioritárias da equipe',
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
