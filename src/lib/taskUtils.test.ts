import { describe, it, expect } from 'vitest';
import { isTaskAssignedToMe } from './taskUtils';
import { Task } from '../types';
import { CurrentUserType } from '../context/AuthContext';

describe('isTaskAssignedToMe', () => {
  const baseUser: CurrentUserType = {
    id: 'user-123',
    employeeId: 'emp-456',
    name: 'Fabio Mota',
    email: 'fabio@empresa.com',
    role: 'Engenheiro',
    roleType: 'employee',
    initials: 'FM',
    username: 'fabiomota',
  };

  const createBaseTask = (overrides: Partial<Task> = {}): Task => ({
    id: 'task-1',
    title: 'Desenvolver Feature',
    category: 'Frontend',
    assigneeId: 'someone-else',
    assigneeName: 'Outra Pessoa',
    assigneeInitials: 'OP',
    projectId: 'proj-1',
    projectName: 'GaleraBet',
    sprintId: 'sprint-1',
    dueDate: '2026-09-10',
    status: 'in_progress',
    points: 5,
    ...overrides,
  });

  it('retorna false quando currentUser for nulo ou indefinido', () => {
    const task = createBaseTask({ isMine: true });
    expect(isTaskAssignedToMe(task, null)).toBe(false);
    expect(isTaskAssignedToMe(task, undefined)).toBe(false);
  });

  it('retorna true quando task.isMine for verdadeiro', () => {
    const task = createBaseTask({ isMine: true });
    expect(isTaskAssignedToMe(task, baseUser)).toBe(true);
  });

  it('retorna true quando assigneeId for igual ao id do usuário', () => {
    const task = createBaseTask({ assigneeId: 'user-123' });
    expect(isTaskAssignedToMe(task, baseUser)).toBe(true);
  });

  it('retorna true quando assigneeId for igual ao employeeId', () => {
    const task = createBaseTask({ assigneeId: 'emp-456' });
    expect(isTaskAssignedToMe(task, baseUser)).toBe(true);
  });

  it('retorna true quando assigneeName contiver o nome do usuário', () => {
    const task = createBaseTask({ assigneeName: 'Fabio Mota' });
    expect(isTaskAssignedToMe(task, baseUser)).toBe(true);
  });

  it('retorna true quando assigneeInitials bater com as iniciais do usuário', () => {
    const task = createBaseTask({ assigneeInitials: 'FM' });
    expect(isTaskAssignedToMe(task, baseUser)).toBe(true);
  });

  it('retorna true quando o usuário estiver na lista de members da tarefa', () => {
    const task = createBaseTask({
      members: [
        { id: 'random-1', name: 'Alguém', initials: 'AL' },
        { id: 'user-123', name: 'Fabio', initials: 'FM' },
      ],
    });
    expect(isTaskAssignedToMe(task, baseUser)).toBe(true);
  });

  it('retorna false quando nenhum critério for satisfeito', () => {
    const task = createBaseTask({
      assigneeId: 'user-999',
      assigneeName: 'Carlos Silva',
      assigneeInitials: 'CS',
      members: [{ id: 'user-888', name: 'Maria Santos', initials: 'MS' }],
    });
    expect(isTaskAssignedToMe(task, baseUser)).toBe(false);
  });
});
