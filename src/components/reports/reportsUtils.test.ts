import { describe, it, expect } from 'vitest';
import {
  getTaskComplexity,
  getTaskRevisionsCount,
  filterReportEmployees,
  computeProductivityStats,
  computeGlobalSummary,
} from './reportsUtils';
import { Task, Employee } from '../../types';

describe('reportsUtils', () => {
  const mockEmployee: Employee = {
    id: 'emp-designer-1',
    name: 'Matheus Bahia',
    email: 'matheus@example.com',
    role: 'Designer Senior',
    avatarUrl: '',
    department: 'Design',
    activeTasksCount: 1,
    completedTasksCount: 5,
    skills: [],
    workloadCapacity: 4,
    status: 'active',
  };

  const mockTasks: Task[] = [
    {
      id: 'task-complex',
      title: 'Campanha de Verão 2026 - Key Visual Completo',
      description: '',
      status: 'in_progress',
      priority: 'urgent',
      dueDate: '2026-12-31',
      assigneeId: 'emp-designer-1',
      assigneeName: 'Matheus Bahia',
      assigneeInitials: 'MB',
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
      comments: [{ id: 'c1', authorName: 'Admin', authorAvatar: '', text: 'Ajuste 2 conforme briefing', createdAt: '2026-01-02' }],
    },
    {
      id: 'task-simple',
      title: 'Ajuste de copy em story',
      description: '',
      status: 'done',
      priority: 'low',
      dueDate: '2026-01-01',
      assigneeId: 'emp-designer-1',
      assigneeName: 'Matheus Bahia',
      assigneeInitials: 'MB',
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
  ];

  it('getTaskComplexity classifica tarefas em complex, medium ou simple', () => {
    const complex = getTaskComplexity(mockTasks[0]);
    expect(complex.level).toBe('complex');
    expect(complex.score).toBe(3);

    const simple = getTaskComplexity(mockTasks[1]);
    expect(simple.level).toBe('medium'); // Contém 'story'
  });

  it('getTaskRevisionsCount detecta número de ciclos de revisão em títulos e comentários', () => {
    const revCount = getTaskRevisionsCount(mockTasks[0]);
    expect(revCount).toBe(2); // 'Ajuste 2'
  });

  it('filterReportEmployees filtra apenas criativos e respeita busca', () => {
    const employees: Employee[] = [
      mockEmployee,
      {
        id: 'emp-other',
        name: 'Financeiro Silva',
        email: 'fin@example.com',
        role: 'Contador',
        avatarUrl: '',
        department: 'Financeiro',
        activeTasksCount: 0,
        completedTasksCount: 0,
        skills: [],
        workloadCapacity: 4,
        status: 'active',
      },
    ];

    const result = filterReportEmployees(employees, 'all', '');
    expect(result.length).toBe(1);
    expect(result[0].name).toBe('Matheus Bahia');
  });

  it('computeProductivityStats e computeGlobalSummary consolidam números corretamente', () => {
    const stats = computeProductivityStats([mockEmployee], mockTasks);
    expect(stats.length).toBe(1);
    expect(stats[0].receivedCount).toBe(2);
    expect(stats[0].finishedCount).toBe(1);
    expect(stats[0].inProgressCount).toBe(1);
    expect(stats[0].totalEffortScore).toBe(5); // 3 (complex) + 2 (story/medium)

    const summary = computeGlobalSummary(stats);
    expect(summary.totalReceived).toBe(2);
    expect(summary.totalFinished).toBe(1);
    expect(summary.totalInProgress).toBe(1);
  });
});
