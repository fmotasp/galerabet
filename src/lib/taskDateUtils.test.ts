import { describe, it, expect } from 'vitest';
import {
  parseTaskDueDate,
  isTaskCompleted,
  isTaskOverdue,
  getTaskOverdueDays,
} from './taskDateUtils';
import { Task } from '../types';

describe('taskDateUtils', () => {
  const createTaskWithDate = (dueDate: string, status: string = 'in_progress'): Task => ({
    id: 'task-1',
    title: 'Teste de Data',
    category: 'Design',
    assigneeId: 'emp-1',
    assigneeName: 'Fulano',
    assigneeInitials: 'FL',
    projectId: 'proj-1',
    projectName: 'Projeto Teste',
    sprintId: 'sprint-1',
    dueDate,
    status,
    points: 3,
  });

  describe('parseTaskDueDate', () => {
    it('retorna null para valores vazios ou "sem prazo"', () => {
      expect(parseTaskDueDate('')).toBeNull();
      expect(parseTaskDueDate('Sem prazo')).toBeNull();
      expect(parseTaskDueDate('sem data')).toBeNull();
    });

    it('faz parse correto de datas no formato ISO (YYYY-MM-DD)', () => {
      const parsed = parseTaskDueDate('2026-10-15');
      expect(parsed).toBeInstanceOf(Date);
      expect(parsed?.getFullYear()).toBe(2026);
      expect(parsed?.getMonth()).toBe(9); // 0-indexed: 9 = outubro
      expect(parsed?.getDate()).toBe(15);
    });

    it('faz parse correto de datas por extenso (ex: 15 de out.)', () => {
      const parsed = parseTaskDueDate('15 de out.');
      expect(parsed).toBeInstanceOf(Date);
      expect(parsed?.getMonth()).toBe(9);
      expect(parsed?.getDate()).toBe(15);
    });
  });

  describe('isTaskCompleted', () => {
    it('retorna true para status concluidos', () => {
      expect(isTaskCompleted(createTaskWithDate('2026-10-15', 'done'))).toBe(true);
      expect(isTaskCompleted(createTaskWithDate('2026-10-15', 'Finalizado'))).toBe(true);
      expect(isTaskCompleted(createTaskWithDate('2026-10-15', 'Concluído'))).toBe(true);
    });

    it('retorna false para status não concluídos', () => {
      expect(isTaskCompleted(createTaskWithDate('2026-10-15', 'in_progress'))).toBe(false);
      expect(isTaskCompleted(createTaskWithDate('2026-10-15', 'backlog'))).toBe(false);
      expect(isTaskCompleted(createTaskWithDate('2026-10-15', 'in_review'))).toBe(false);
    });
  });

  describe('isTaskOverdue & getTaskOverdueDays', () => {
    it('não considera atrasada uma tarefa sem prazo ou com prazo futuro', () => {
      const futureTask = createTaskWithDate('2099-12-31');
      expect(isTaskOverdue(futureTask)).toBe(false);
      expect(getTaskOverdueDays(futureTask)).toBe(0);
    });

    it('não considera atrasada uma tarefa já concluída mesmo com data no passado', () => {
      const donePastTask = createTaskWithDate('2020-01-01', 'done');
      expect(isTaskOverdue(donePastTask)).toBe(false);
      expect(getTaskOverdueDays(donePastTask)).toBe(0);
    });

    it('detecta atraso para tarefa não concluída com data no passado', () => {
      const pastTask = createTaskWithDate('2020-01-01', 'in_progress');
      expect(isTaskOverdue(pastTask)).toBe(true);
      expect(getTaskOverdueDays(pastTask)).toBeGreaterThan(0);
    });
  });
});
