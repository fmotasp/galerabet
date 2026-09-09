import { Task, Employee, Project, Sprint, SpineStatusConfig, TaskMember, TaskComment, TaskAttachment, TaskStatus } from '../../../types';

export interface TaskModalFormData {
  title: string;
  description: string;
  category: string;
  assigneeId: string;
  projectId: string;
  sprintId: string;
  dueDate: string;
  deliveredAt: string;
  status: TaskStatus;
  points: number;
  isFlagged: boolean;
}

export interface TaskReferenceImage {
  id: string;
  name: string;
  url: string;
  date?: string;
  driveFileId?: string;
}

export interface TimelineActionItem {
  id: string;
  type: 'created' | 'status' | 'file' | 'comment' | 'delivery' | 'member' | 'general' | 'edited';
  user: string;
  userInitials: string;
  avatarUrl?: string;
  title: string;
  details?: string;
  date: string;
  rawTimestamp: number;
}
