import { describe, it, expect } from 'vitest';
import {
  isTaskAlerted,
  filterDashboardTasks,
  computeDashboardMetrics,
  getActiveWorkloadCount,
  computeWorkloadMembers,
  getIndicatorColor,
} from './dashboardUtils';
import { Task, Employee, Project } from '../../types';

describe('dashboardUtils', () => {
  const mockEmployee: Employee = {
    id: 'emp-1',
    name: 'Rafael Barbosa',
    email: 'rafael@example.com',
    role: 'Designer',
    avatarUrl: '',
    department: 'Design',
    activeTasksCount: 2,
    completedTasksCount: 10,
    skills: ['Photoshop'],
    workloadCapacity: 4,
    status: 'active',
  };

  const mockTasks: Task[] = [
    {
      id: 'task-1',
      title: 'Tarefa 1',
      description: 'Desc',
      status: 'in_progress',
      priority: 'high',
      dueDate: '2026-12-31',
      assigneeId: 'emp-1',
      assigneeName: 'Rafael Barbosa',
      assigneeInitials: 'RB',
      projectId: 'proj-1',
      tags: [],
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
      commentsCount: 0,
      attachmentsCount: 0,
      subtasks: [],
      customFields: {},
      order: 0,
      isFlagged: false,
    },
    {
      id: 'task-2',
      title: 'Tarefa Concluída',
      description: 'Desc',
      status: 'done',
      priority: 'low',
      dueDate: '2026-01-01',
      assigneeId: 'emp-1',
      assigneeName: 'Rafael Barbosa',
      assigneeInitials: 'RB',
      projectId: 'proj-1',
      tags: [],
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
      commentsCount: 0,
      attachmentsCount: 0,
      subtasks: [],
      customFields: {},
      order: 1,
      isFlagged: false,
    },
    {
      id: 'task-3',
      title: 'Tarefa Alerta Flagged',
      description: 'Desc',
      status: 'backlog',
      priority: 'urgent',
      dueDate: '2026-12-31',
      assigneeId: 'unassigned',
      assigneeName: 'Não atribuído',
      assigneeInitials: 'NA',
      projectId: 'proj-2',
      tags: [],
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
      commentsCount: 0,
      attachmentsCount: 0,
      subtasks: [],
      customFields: {},
      order: 2,
      isFlagged: true,
    },
  ];

  const mockProjects: Project[] = [
    {
      id: 'proj-1',
      title: 'Projeto 1',
      name: 'Projeto 1',
      description: 'Desc',
      status: 'active',
      client: 'Cliente A',
      progress: 50,
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      members: [],
      budget: 1000,
      tasksCount: 2,
      completedTasksCount: 1,
      category: 'Design',
      updatedAt: '2026-01-01',
    },
  ];

  it('isTaskAlerted identifica tarefas flagged ou em status de risco', () => {
    expect(isTaskAlerted(mockTasks[0])).toBe(false);
    expect(isTaskAlerted(mockTasks[1])).toBe(false); // Concluída nunca fica em alerta
    expect(isTaskAlerted(mockTasks[2])).toBe(true); // Flagged
  });

  it('filterDashboardTasks filtra adequadamente', () => {
    const all = filterDashboardTasks(mockTasks, 'all', mockEmployee);
    expect(all.length).toBe(3);

    const mine = filterDashboardTasks(mockTasks, 'mine', mockEmployee);
    expect(mine.length).toBe(2);

    const flagged = filterDashboardTasks(mockTasks, 'flagged', mockEmployee);
    expect(flagged.length).toBe(1);
    expect(flagged[0].id).toBe('task-3');
  });

  it('computeDashboardMetrics calcula totais e porcentagem', () => {
    const metrics = computeDashboardMetrics(mockTasks, mockProjects);
    expect(metrics.totalTasks).toBe(3);
    expect(metrics.completedTasks).toBe(1);
    expect(metrics.inProgressTasks).toBe(1);
    expect(metrics.completionPercentage).toBe(33);
    expect(metrics.escalatedCount).toBe(1);
  });

  it('computeWorkloadMembers apura capacidade da equipe de design e video maker', () => {
    const { workloadMembers, totalBacklogCount } = computeWorkloadMembers([mockEmployee], mockTasks);
    expect(workloadMembers.length).toBe(1);
    expect(workloadMembers[0].emp.name).toBe('Rafael Barbosa');
    expect(workloadMembers[0].activeDemands).toBe(1);
    expect(workloadMembers[0].availableCapacity).toBe(3); // 4 - 1
    expect(totalBacklogCount).toBe(1); // task-3 unassigned/backlog
  });

  it('getIndicatorColor retorna classe de cor esperada', () => {
    expect(getIndicatorColor(mockTasks[0])).toBe('bg-[#5D55F9]'); // in_progress
    expect(getIndicatorColor(mockTasks[1])).toBe('bg-[#16A34A]'); // done
  });
});
