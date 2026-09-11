export type NavigationTab = 'dashboard' | 'tasks' | 'projects' | 'employees' | 'registrations' | 'reports' | 'materials' | 'kvs' | 'settings';

export interface BrandColor {
  id?: string;
  name: string;
  hex: string;
  pantone?: string;
}

export type BuiltinTaskStatus = 'backlog' | 'in_progress' | 'in_review' | 'overdue' | 'blocked' | 'done';

export type TaskStatus = BuiltinTaskStatus | string;

export interface SpineStatusConfig {
  id: string;
  label: string;
  color: string;
  bg: string;
  dotColor?: string;
  gradient?: string;
  isDefault?: boolean;
}

export type TaskCategory = 'Frontend' | 'Backend' | 'Infra' | 'Mobile' | 'Legal' | 'Design' | 'Product' | 'Security';

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface TaskLabel {
  id: string;
  name: string;
  color: string;
}

export interface TaskComment {
  id: string;
  authorName: string;
  authorInitials: string;
  text: string;
  date: string;
}

export interface TaskAttachment {
  id: string;
  name: string;
  url: string;
  bytes?: number;
  mimeType?: string;
  isUpload?: boolean;
  date?: string;
  driveFileId?: string;
  thumbnailUrl?: string;
  previews?: { url: string; width: number; height: number }[];
}

export interface TaskMember {
  id: string;
  name: string;
  initials: string;
  avatarUrl?: string;
}

export interface TaskChecklistItem {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string; // e.g. "May 12" or "2026-05-12"
  deliveredAt?: string; // Data real de entrega
  assigneeId?: string;
  assigneeName?: string;
  assigneeInitials?: string;
  projectId?: string;
  projectName?: string;
  sprintId?: string;
  tags: string[];
  points?: number;
  isFlagged?: boolean;
  members?: TaskMember[];
  isMine?: boolean;
  createdAt?: string;
  lastMovedAt?: number;
  labels?: TaskLabel[];
  comments?: TaskComment[];
  attachments?: TaskAttachment[];
  checklists?: TaskChecklistItem[];
  referenceImages?: Array<{ id: string; name: string; url: string; date?: string; driveFileId?: string }>;
  finalImages?: Array<{ id: string; name: string; url: string; date?: string; driveFileId?: string }>;
  driveFolderId?: string;
  driveFolderUrl?: string;
  driveFiles?: Array<{
    id: string;
    name: string;
    mimeType: string;
    thumbnailLink?: string;
    webViewLink?: string;
    webContentLink?: string;
    type?: 'reference' | 'final' | 'general';
  }>;
  coverImageUrl?: string;
  coverAttachmentId?: string;
  commentsCount?: number;
  attachmentsCount?: number;
  checklistsCount?: number;
  isDueComplete?: boolean;
  dueComplete?: boolean;
  category?: string;
  activityLog?: TaskActivityItem[];
}

export interface TaskActivityItem {
  id: string;
  type: 'created' | 'status_changed' | 'attachment_added' | 'comment_added' | 'edited' | 'delivered' | 'member_added';
  user: string;
  userInitials?: string;
  avatarUrl?: string;
  description: string;
  timestamp: string;
  details?: string;
}

export interface Client {
  id: string;
  name: string;
  category?: string;
  description?: string;
  logoUrl?: string;
  labelColor?: string;
  createdAt?: string;
}

export interface Project {
  id: string;
  name: string;
  category: string;
  description: string;
  clientId?: string;
  clientName?: string;
  clientIds?: string[];
  clientNames?: string[];
  status: 'active' | 'planning' | 'at_risk' | 'completed' | 'on_hold';
  progress: number;
  currentSprint: string;
  iconType: 'rocket' | 'flower' | 'chart' | 'shield' | 'zap' | 'box';
  iconColor: string;
  teamMemberIds: string[];
  totalTasks?: number;
  labelId?: string;
  labelColor?: string;
  logoUrl?: string;
  colorPalette?: BrandColor[];
  brandManualUrl?: string;
  logosPackUrl?: string;
  typographyUrl?: string;
  additionalMaterialsUrl?: string;
  kvDriveUrl?: string;
  kvDriveItems?: Array<{
    id: string;
    title?: string;
    url: string;
    driveFolderId?: string;
  }>;
}

export interface Employee {
  id: string;
  auth_user_id?: string;
  name: string;
  role: string;
  department: 'Engineering' | 'Design' | 'Product' | 'Infrastructure' | 'Operations' | 'Management' | 'Creative' | string;
  avatarUrl?: string;
  initials: string;
  status: 'online' | 'busy' | 'away' | 'offline';
  tags: string[];
  currentWorkload: number;
  assignedTaskCount: number;
  collaboratorIds: string[];
  email: string;
  /** @deprecated Utilizar Supabase Auth. Não armazenar nem comparar senhas no frontend. */
  password?: string;
  username?: string;
  location?: string;
  labelId?: string;
  labelColor?: string;
  needsPasswordChange?: boolean;
  roleType?: 'admin' | 'manager' | 'employee';
}

export interface Sprint {
  id: string;
  name: string;
  period: string;
  goal: string;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  velocity: number;
  velocityChange: string;
  isCurrent: boolean;
}

export interface ActivityItem {
  id: string;
  userName: string;
  userAvatar?: string;
  userInitials: string;
  message: string;
  highlightText?: string;
  timeAgo: string;
  dotColor: 'blue' | 'orange' | 'green' | 'purple';
}

export interface ToastNotification {
  id: string;
  title: string;
  message?: string;
  type: 'success' | 'info' | 'warning' | 'error';
}
