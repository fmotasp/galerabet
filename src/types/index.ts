export type NavigationTab = 'dashboard' | 'tasks' | 'projects' | 'employees' | 'registrations' | 'reports' | 'materials' | 'settings';

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

export interface TrelloLabel {
  id: string;
  name: string;
  color: string;
}

export interface TrelloComment {
  id: string;
  authorName: string;
  authorInitials: string;
  text: string;
  date: string;
}

export interface TrelloAttachment {
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

export interface Task {
  id: string;
  title: string;
  description?: string;
  category: TaskCategory | string;
  assigneeId: string;
  assigneeName: string;
  assigneeInitials: string;
  assigneeAvatar?: string;
  members?: TaskMember[];
  projectId: string;
  projectName: string;
  sprintId: string;
  dueDate: string;
  deliveredAt?: string;
  status: TaskStatus;
  points: number;
  isFlagged?: boolean;
  isMine?: boolean;
  createdAt?: string;
  lastMovedAt?: number;
  labels?: TrelloLabel[];
  comments?: TrelloComment[];
  attachments?: TrelloAttachment[];
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
  trelloListName?: string;
  trelloListId?: string;
  isDueComplete?: boolean;
  dueComplete?: boolean;
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
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  department: 'Engineering' | 'Design' | 'Product' | 'Infrastructure' | 'Operations' | 'Management' | 'Creative' | string;
  avatarUrl?: string;
  initials: string;
  status: 'online' | 'busy' | 'away' | 'offline';
  tags: string[];
  currentWorkload: number; // percentage, e.g. 85, 110, 45
  assignedTaskCount: number;
  collaboratorIds: string[];
  email: string;
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
  name: string; // e.g. "Sprint 3 · May 2026"
  period: string; // e.g. "May 1-15"
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

export interface BoardMappingRule {
  id: string;
  trelloList: string;
  spineStatus: TaskStatus;
}

export interface TrelloSettings {
  isConnected: boolean;
  workspaceName: string;
  apiKey: string;
  serverToken: string;
  autoSync: boolean;
  syncMemberAssignments: boolean;
  importLabelsAndTags: boolean;
  targetBoard: string;
  boardMappings: BoardMappingRule[];
  lastSyncedAt?: string;
}

export interface ToastNotification {
  id: string;
  title: string;
  message?: string;
  type: 'success' | 'info' | 'warning' | 'error';
}
