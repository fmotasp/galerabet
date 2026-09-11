import { Task, Employee, Project } from '../../types';
import {
  isTaskOverdue,
  isTaskCompleted,
  isTaskInProgress,
  parseTaskDueDate,
} from '../../lib/taskDateUtils';
import { isTaskAssignedToMe } from '../../lib/taskUtils';

export interface DashboardMetrics {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  backlogTasks: number;
  overdueTasks: number;
  completionPercentage: number;
  activeProjectsCount: number;
  velocity: number;
  escalatedCount: number;
}

export interface WorkloadMemberItem {
  emp: Employee;
  totalDemands: number;
  activeDemands: number;
  availableCapacity: number;
  maxIdealCapacity: number;
}

/**
 * Verifica se uma tarefa está sob alerta (atrasada, bloqueada, flagged ou a menos de 2 dias do vencimento).
 */
export const isTaskAlerted = (task: Task): boolean => {
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

/**
 * Filtra tarefas com base no filtro ativo da visão geral ('all', 'mine', 'flagged').
 */
export const filterDashboardTasks = (
  tasks: Task[],
  activeFilter: string,
  currentUser: Employee | null
): Task[] => {
  return tasks.filter((task) => {
    if (activeFilter === 'mine') return isTaskAssignedToMe(task, currentUser);
    if (activeFilter === 'flagged') return isTaskAlerted(task);
    return true;
  });
};

/**
 * Calcula as métricas consolidadas para os cards e visão geral da sprint.
 */
export const computeDashboardMetrics = (
  filteredTasks: Task[],
  projects: Project[]
): DashboardMetrics => {
  const completed = filteredTasks.filter((t) => isTaskCompleted(t)).length;
  const inProgress = filteredTasks.filter((t) => isTaskInProgress(t)).length;
  const backlog = filteredTasks.filter(
    (t) =>
      !isTaskCompleted(t) &&
      !isTaskInProgress(t) &&
      (t.status === 'backlog' || t.status === 'blocked')
  ).length;
  const overdue = filteredTasks.filter((t) => isTaskOverdue(t)).length;
  const total = filteredTasks.length;

  const completionPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  const activeProjectsCount =
    new Set(filteredTasks.map((t) => t.projectId).filter(Boolean)).size ||
    projects.filter((p) => !['proj-orion', 'proj-bloom', 'proj-aurora', 'proj-apex'].includes(p.id)).length;
  const velocity = filteredTasks.reduce((acc, t) => acc + (t.points || 1), 0);
  const escalatedCount = filteredTasks.filter((t) => isTaskAlerted(t)).length;

  return {
    totalTasks: total,
    completedTasks: completed,
    inProgressTasks: inProgress,
    backlogTasks: backlog,
    overdueTasks: overdue,
    completionPercentage,
    activeProjectsCount,
    velocity,
    escalatedCount,
  };
};

/**
 * Conta demandas ativas de um colaborador (excluindo aprovação, concluído, revisão e postado).
 */
export const getActiveWorkloadCount = (emp: Employee, filteredTasks: Task[]): number => {
  const empFirstName = emp.name.toLowerCase().split(' ')[0];

  return filteredTasks.filter((t) => {
    const s = (t.status || '').toLowerCase();

    // Se a tarefa está em aprovação, concluída ou postada, não conta como backlog/em andamento do designer
    if (
      s === 'done' ||
      s.includes('aprov') ||
      s.includes('postar') ||
      s.includes('postad') ||
      s.includes('final') ||
      s.includes('revis')
    ) {
      return false;
    }

    // Verifica se a tarefa pertence a este funcionário estritamente
    const empFullName = emp.name.toLowerCase().trim();
    const isAssigned =
      (t.assigneeId && t.assigneeId === emp.id) ||
      (t.assigneeName && t.assigneeName.toLowerCase().trim() === empFullName) ||
      (t.members && t.members.some((m) => m && (m.id === emp.id || (m.name && m.name.toLowerCase().trim() === empFullName))));

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

/**
 * Calcula a lista de membros e suas respectivas capacidades para o widget de carga de trabalho.
 */
export const computeWorkloadMembers = (
  employees: Employee[],
  filteredTasks: Task[]
): { workloadMembers: WorkloadMemberItem[]; totalBacklogCount: number } => {
  const unassignedBacklogTasks = filteredTasks.filter((t) => {
    const s = (t.status || '').toLowerCase();
    const isDone = isTaskCompleted(t);
    return !isDone && (s === 'backlog' || s === 'novos_pedidos' || !t.assigneeId || t.assigneeId === 'unassigned');
  });

  const totalBacklogCount = unassignedBacklogTasks.length;

  const workloadMembers = employees
    .filter((emp) => {
      const roleLower = (emp.role || '').toLowerCase();
      const deptLower = (emp.department || '').toLowerCase();
      const roleType = (emp.roleType || '').toLowerCase();
      
      const isCreative =
        roleLower.includes('designer') ||
        roleLower.includes('video') ||
        roleLower.includes('arte') ||
        roleLower.includes('criativ') ||
        deptLower.includes('design') ||
        deptLower.includes('video');

      const isGestor =
        roleLower.includes('gestor') ||
        roleLower.includes('admin') ||
        roleType === 'manager' ||
        roleType === 'admin';

      return isCreative && !isGestor;
    })
    .map((emp) => {
      const empFullName = emp.name.toLowerCase().trim();
      const empId = emp.id.toLowerCase().trim();

      const allEmpTasks = filteredTasks.filter((t) => {
        const isAssigned =
          (t.assigneeId && (t.assigneeId === emp.id || t.assigneeId.toLowerCase().trim() === empId)) ||
          (t.assigneeName && t.assigneeName.toLowerCase().trim() === empFullName) ||
          (t.members && t.members.some((m) => m && (m.id === emp.id || (m.name && m.name.toLowerCase().trim() === empFullName))));
        return Boolean(isAssigned);
      });

      const totalDemands = allEmpTasks.length;
      const activeDemands = getActiveWorkloadCount(emp, filteredTasks);
      
      // Capacidade baseada no workloadCapacity ou currentWorkload (padrão é 4 ou currentWorkload / 10)
      const rawCap = (emp as any).workloadCapacity ?? (typeof emp.currentWorkload === 'number' ? Math.round(emp.currentWorkload / 10) : 4);
      const maxIdealCapacity = Math.max(2, rawCap);
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

  return { workloadMembers, totalBacklogCount };
};

/**
 * Retorna a cor do indicador visual da tarefa.
 */
export const getIndicatorColor = (task: Task): string => {
  if (isTaskCompleted(task)) {
    return 'bg-[#16A34A]';
  }
  if (isTaskOverdue(task)) {
    return 'bg-[#E11D48]';
  }
  switch (task.status) {
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
