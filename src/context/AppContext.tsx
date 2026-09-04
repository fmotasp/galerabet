import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { isTaskOverdue, isTaskCompleted } from '../lib/taskDateUtils';
import {
  saveLoginArtToIndexedDB,
  loadLoginArtFromIndexedDB,
  deleteLoginArtFromIndexedDB,
} from '../lib/indexedDbStorage';
import {
  NavigationTab,
  Task,
  Project,
  Employee,
  Sprint,
  ActivityItem,
  TrelloSettings,
  ToastNotification,
  TaskStatus,
  SpineStatusConfig,
  TrelloComment,
  TrelloLabel,
  TrelloAttachment,
  TaskMember,
  BrandColor,
} from '../types';
import {
  INITIAL_SPRINT,
  INITIAL_SPRINT_LIST,
  INITIAL_EMPLOYEES,
  INITIAL_PROJECTS,
  INITIAL_TASKS,
  INITIAL_ACTIVITIES,
  INITIAL_TRELLO_SETTINGS,
  DEFAULT_SPINE_STATUSES,
} from '../data/mockData';

interface AppContextType {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean | ((prev: boolean) => boolean)) => void;
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (open: boolean) => void;

  // Dashboard & Filter State
  activeFilter: 'all' | 'mine' | 'flagged';
  setActiveFilter: (filter: 'all' | 'mine' | 'flagged') => void;
  globalSearchQuery: string;
  setGlobalSearchQuery: (query: string) => void;

  // Sprints
  sprints: Sprint[];
  currentSprint: Sprint;
  setCurrentSprintId: (id: string) => void;
  updateCurrentSprintGoal: (goal: string) => void;

  // Spine Statuses (Customizable)
  spineStatuses: SpineStatusConfig[];
  addSpineStatus: (status: Omit<SpineStatusConfig, 'id'>) => void;
  updateSpineStatus: (id: string, updates: Partial<SpineStatusConfig>) => void;
  deleteSpineStatus: (id: string, fallbackStatusId?: string) => void;
  reorderSpineStatuses: (newStatuses: SpineStatusConfig[]) => void;
  resetSpineStatusesToDefault: () => void;

  // Tasks
  tasks: Task[];
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  moveTaskStatus: (id: string, newStatus: TaskStatus) => void;
  moveAllBacklogToDoneLocally: () => void;
  toggleFlagTask: (id: string) => void;
  clearAllTasks: () => void;
  clearTrelloTasks: () => void;
  resetSystemKeepCredentials: () => void;

  // Projects
  projects: Project[];
  addProject: (project: Omit<Project, 'id'>) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;

  // Employees
  employees: Employee[];
  addEmployee: (employee: Omit<Employee, 'id'>) => void;
  updateEmployee: (id: string, updates: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;

  // Activities
  activities: ActivityItem[];
  addActivity: (userName: string, userInitials: string, message: string, dotColor?: ActivityItem['dotColor']) => void;

  // Trello & Integrations
  trelloSettings: TrelloSettings;
  updateTrelloSettings: (updates: Partial<TrelloSettings>) => void;
  testTrelloConnection: (overrideApiKey?: string, overrideToken?: string) => Promise<boolean>;
  syncTrelloNow: () => Promise<void>;
  isSyncing: boolean;
  trelloLabels: TrelloLabel[];
  fetchTrelloCardComments: (taskId: string) => Promise<TrelloComment[]>;
  addTrelloComment: (taskId: string, commentText: string) => Promise<boolean>;
  deleteTrelloComment: (taskId: string, commentId: string) => Promise<boolean>;
  fetchTrelloCardAttachments: (taskId: string) => Promise<TrelloAttachment[]>;
  addTrelloAttachment: (taskId: string, source: string | File, name?: string) => Promise<boolean>;
  createTrelloLabel: (name: string, color: string) => Promise<TrelloLabel | null>;
  updateTrelloLabel: (labelId: string, name: string, color: string) => Promise<boolean>;
  deleteTrelloLabel: (labelId: string) => Promise<boolean>;

  // Modals & Drawers
  isNewTaskModalOpen: boolean;
  setIsNewTaskModalOpen: (open: boolean) => void;
  editingTask: Task | null;
  setEditingTask: (task: Task | null) => void;

  isNewProjectModalOpen: boolean;
  setIsNewProjectModalOpen: (open: boolean) => void;
  editingProject: Project | null;
  setEditingProject: (project: Project | null) => void;

  isNewEmployeeModalOpen: boolean;
  setIsNewEmployeeModalOpen: (open: boolean) => void;
  editingEmployee: Employee | null;
  setEditingEmployee: (emp: Employee | null) => void;

  selectedEmployeeForDetail: Employee | null;
  setSelectedEmployeeForDetail: (emp: Employee | null) => void;

  selectedProjectForDetail: Project | null;
  setSelectedProjectForDetail: (proj: Project | null) => void;

  isSearchModalOpen: boolean;
  setIsSearchModalOpen: (open: boolean) => void;

  // Toasts
  toasts: ToastNotification[];
  addToast: (title: string, message?: string, type?: ToastNotification['type']) => void;
  removeToast: (id: string) => void;

  // Auth
  currentUser: {
    id: string;
    name: string;
    email: string;
    role: string;
    roleType: 'admin' | 'employee';
    avatarUrl?: string;
    initials: string;
    department?: string;
  } | null;
  setCurrentUser: (user: any) => void;
  logout: () => void;
  isManagerOrAdmin: (user?: any) => boolean;

  // Computed Metrics
  computedMetrics: {
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
    completionPercentage: number;
    velocity: number;
    activeProjectsCount: number;
    escalatedCount: number;
  };

  // Branding & Login Art
  loginArtUrl: string;
  updateLoginArtUrl: (url: string) => void;

  // Initial Data Loading State
  isInitialLoading: boolean;
}

const AppContext = createContext<AppContextType | null>(null);

const formatTrelloDueDate = (due: string | null | undefined): string => {
  if (!due) return 'Sem prazo';
  try {
    const d = new Date(due);
    if (isNaN(d.getTime())) return 'Sem prazo';
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return 'Sem prazo';
  }
};

export interface BrandMeta {
  colorPalette?: BrandColor[];
  brandManualUrl?: string;
  logosPackUrl?: string;
  typographyUrl?: string;
  additionalMaterialsUrl?: string;
}

export const encodeProjectDescription = (description: string = '', brand: BrandMeta): string => {
  const cleanDesc = (description || '').replace(/\n?<!-- __BRAND_META__[\s\S]*?-->/g, '').trim();
  const hasMeta =
    (brand.colorPalette && brand.colorPalette.length > 0) ||
    Boolean(brand.brandManualUrl) ||
    Boolean(brand.logosPackUrl) ||
    Boolean(brand.typographyUrl) ||
    Boolean(brand.additionalMaterialsUrl);

  if (!hasMeta) return cleanDesc;
  const metaJson = JSON.stringify({
    colorPalette: brand.colorPalette || [],
    brandManualUrl: brand.brandManualUrl || '',
    logosPackUrl: brand.logosPackUrl || '',
    typographyUrl: brand.typographyUrl || '',
    additionalMaterialsUrl: brand.additionalMaterialsUrl || '',
  });
  return `${cleanDesc}\n<!-- __BRAND_META__ ${metaJson} -->`.trim();
};

export const decodeProjectDescription = (rawDescription?: string): { cleanDescription: string; brandMeta: BrandMeta } => {
  if (!rawDescription) return { cleanDescription: '', brandMeta: {} };
  const match = rawDescription.match(/<!-- __BRAND_META__ ([\s\S]*?) -->/);
  let brandMeta: BrandMeta = {};
  let cleanDescription = rawDescription;

  if (match && match[1]) {
    try {
      brandMeta = JSON.parse(match[1]);
      cleanDescription = rawDescription.replace(match[0], '').trim();
    } catch {}
  }

  return { cleanDescription, brandMeta };
};

const getTodayDateStr = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const STORAGE_KEYS = {
  TASKS: 'spine_tasks_v1',
  PROJECTS: 'spine_projects_v1',
  EMPLOYEES: 'spine_employees_v1',
  SPRINTS: 'spine_sprints_v1',
  CURRENT_SPRINT_ID: 'spine_current_sprint_id_v1',
  TRELLO: 'spine_trello_settings_v1',
  ACTIVITIES: 'spine_activities_v1',
  DELETED_TRELLO_TASKS: 'spine_deleted_trello_task_ids_v1',
  SPINE_STATUSES: 'spine_custom_statuses_v1',
  LOGIN_ART_URL: 'spine_login_art_url_v1',
  LOGIN_DATE: 'spine_login_date_v1',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Current Authenticated User with Daily 00:00 Expiration
  const [currentUser, setCurrentUserState] = useState<any>(() => {
    const saved = localStorage.getItem('spine_logged_user');
    const loginDate = localStorage.getItem(STORAGE_KEYS.LOGIN_DATE);
    const today = getTodayDateStr();

    if (saved) {
      if (loginDate && loginDate !== today) {
        // Expired on midnight 00:00
        localStorage.removeItem('spine_logged_user');
        localStorage.removeItem(STORAGE_KEYS.LOGIN_DATE);
        return null;
      }
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const setCurrentUser = (user: any) => {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.LOGIN_DATE, getTodayDateStr());
    } else {
      localStorage.removeItem(STORAGE_KEYS.LOGIN_DATE);
    }
    setCurrentUserState(user);
  };

  const logout = () => {
    localStorage.removeItem('spine_logged_user');
    localStorage.removeItem(STORAGE_KEYS.LOGIN_DATE);
    setCurrentUserState(null);
  };

  // Login Art Customization with Persistent IndexedDB + LocalStorage Sync
  const [loginArtUrl, setLoginArtUrl] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.LOGIN_ART_URL) || '';
  });

  // Load from IndexedDB on startup (overcomes 5MB localStorage limit)
  useEffect(() => {
    loadLoginArtFromIndexedDB().then((storedArt) => {
      if (storedArt) {
        setLoginArtUrl(storedArt);
        try {
          localStorage.setItem(STORAGE_KEYS.LOGIN_ART_URL, storedArt);
        } catch {
          // Ignore quota error in localStorage as IndexedDB holds it
        }
      }
    });
  }, []);

  const updateLoginArtUrl = async (url: string) => {
    const cleanUrl = url ? url.trim() : '';
    setLoginArtUrl(cleanUrl);

    if (cleanUrl) {
      saveLoginArtToIndexedDB(cleanUrl);
      try {
        localStorage.setItem(STORAGE_KEYS.LOGIN_ART_URL, cleanUrl);
      } catch {
        // Handled via IndexedDB
      }
    } else {
      deleteLoginArtFromIndexedDB();
      localStorage.removeItem(STORAGE_KEYS.LOGIN_ART_URL);
    }

    // Persist globally in Supabase so EVERY user sees the wallpaper
    try {
      if (cleanUrl) {
        await supabase.from('projects').upsert({
          id: 'system-settings',
          name: 'Configurações Globais do Sistema',
          category: 'System',
          description: cleanUrl,
          logo_url: cleanUrl,
          status: 'system',
        });
      } else {
        await supabase.from('projects').delete().eq('id', 'system-settings');
      }
    } catch (err) {
      console.warn('Error saving login art to Supabase:', err);
    }
  };

  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'mine' | 'flagged'>('all');
  const [globalSearchQuery, setGlobalSearchQuery] = useState<string>('');

  // Spine Statuses (Customizable)
  const [spineStatuses, setSpineStatuses] = useState<SpineStatusConfig[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SPINE_STATUSES);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (
          Array.isArray(parsed) &&
          parsed.some((s: any) => s.id === 'novos_pedidos') &&
          parsed.some((s: any) => s.id === 'aprovar')
        ) {
          return parsed;
        }
      } catch {
        // Fall back to default
      }
    }
    return DEFAULT_SPINE_STATUSES;
  });

  // Sprints
  const [sprints, setSprints] = useState<Sprint[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SPRINTS);
    return saved ? JSON.parse(saved) : INITIAL_SPRINT_LIST;
  });
  const [currentSprintId, setCurrentSprintIdState] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_SPRINT_ID) || INITIAL_SPRINT.id;
  });

  // Tasks (Demandas) - Hidratação imediata síncrona de cache para evitar tela zerada
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TASKS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_TASKS;
  });

  // Projects / Clientes - Hidratação imediata de cache
  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROJECTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_PROJECTS;
  });

  // Members Roles Registry
  const MEMBER_ROLES_MAP: Record<string, string> = {
    'rafael barbosa': 'Video Maker',
    'matheus bahia': 'Video Maker',
    'davi soares felix da silva': 'Video Maker',
    'davi soares': 'Video Maker',
    'gerson sousa': 'Designer',
    'gerdson sousa': 'Designer',
    'dai pessi': 'Designer',
    'bismarques s.': 'Designer',
    'bismarques': 'Designer',
    'fabio mozart': 'Gestor',
    'felipe mota': 'Designer',
    'giovanni dias': 'Gestor',
    'marcos roberto': 'Designer',
  };

  const getRoleForMember = (fullName?: string, username?: string): string => {
    const fn = (fullName || '').toLowerCase().trim();
    const un = (username || '').toLowerCase().trim();

    for (const [key, role] of Object.entries(MEMBER_ROLES_MAP)) {
      if (fn.includes(key) || un.includes(key.replace(/\s+/g, ''))) {
        return role;
      }
    }
    return username ? `@${username}` : 'Membro da Equipe';
  };

  // Employees (Usuários/Membros) - Hidratação imediata de cache
  const [employees, setEmployees] = useState<Employee[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_EMPLOYEES;
  });

  // Activities (Histórico) - Hidratação imediata de cache
  const [activities, setActivities] = useState<ActivityItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACTIVITIES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [];
  });

  // Estado de Carregamento Inicial (True apenas se ainda não houver dados no cache)
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(() => {
    try {
      const savedTasks = localStorage.getItem(STORAGE_KEYS.TASKS);
      if (savedTasks) {
        const parsed = JSON.parse(savedTasks);
        if (Array.isArray(parsed) && parsed.length > 0) return false;
      }
    } catch {}
    return true;
  });

  // Trello
  const [trelloSettings, setTrelloSettings] = useState<TrelloSettings>(() => {
    return INITIAL_TRELLO_SETTINGS;
  });
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [trelloLabels, setTrelloLabels] = useState<TrelloLabel[]>([]);

  // Deleted Trello Card IDs blacklist to prevent auto-sync from restoring cleared/deleted tasks
  const [deletedTrelloTaskIds, setDeletedTrelloTaskIds] = useState<string[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.DELETED_TRELLO_TASKS);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DELETED_TRELLO_TASKS, JSON.stringify(deletedTrelloTaskIds));
  }, [deletedTrelloTaskIds]);

  // Modals
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isNewEmployeeModalOpen, setIsNewEmployeeModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [selectedEmployeeForDetail, setSelectedEmployeeForDetail] = useState<Employee | null>(null);
  const [selectedProjectForDetail, setSelectedProjectForDetail] = useState<Project | null>(null);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  // LocalStorage persistence effects with QuotaExceeded protection & Payload Optimization
  useEffect(() => {
    try {
      // Sanitize tasks for localStorage: strip heavy temporary base64 strings and redundant attachment previews
      const sanitizedTasks = tasks.map((t) => {
        // Keep essential fields and trim oversized data
        const leanAttachments = (t.attachments || []).map((a) => ({
          id: a.id,
          name: a.name,
          url: a.url,
          mimeType: a.mimeType,
          bytes: a.bytes,
          date: a.date,
        }));

        // Limit referenceImages to real URLs (skip huge raw base64 data URLs in local storage)
        const leanRefImages = (t.referenceImages || []).map((r) => {
          let directUrl = r.url;
          if ((!directUrl || directUrl.startsWith('data:')) && r.driveFileId) {
            directUrl = `https://drive.google.com/thumbnail?id=${r.driveFileId}&sz=w1000`;
          }
          return {
            id: r.id,
            name: r.name,
            url: directUrl,
            date: r.date,
            driveFileId: r.driveFileId,
          };
        }).filter((r) => r.url || r.driveFileId);

        return {
          id: t.id,
          title: t.title,
          description: (t.description || '').length > 20000 ? (t.description || '').substring(0, 20000) : t.description,
          category: t.category,
          status: t.status,
          dueDate: t.dueDate,
          createdAt: t.createdAt,
          assigneeId: t.assigneeId,
          assigneeName: t.assigneeName,
          assigneeInitials: t.assigneeInitials,
          members: t.members,
          projectId: t.projectId,
          projectName: t.projectName,
          sprintId: t.sprintId,
          points: t.points,
          isFlagged: t.isFlagged,
          coverImageUrl: t.coverImageUrl,
          coverAttachmentId: t.coverAttachmentId,
          labels: t.labels,
          commentsCount: t.commentsCount,
          trelloListName: t.trelloListName,
          trelloListId: t.trelloListId,
          isDueComplete: t.isDueComplete,
          dueComplete: t.dueComplete,
          lastMovedAt: t.lastMovedAt,
          attachments: leanAttachments,
          referenceImages: leanRefImages,
        };
      });

      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(sanitizedTasks));
    } catch (err) {
      try {
        // Fallback: save ultra-lean tasks without attachments/references
        const minimalTasks = tasks.map((t) => ({
          id: t.id,
          title: t.title,
          description: (t.description || '').substring(0, 500),
          category: t.category,
          status: t.status,
          dueDate: t.dueDate,
          createdAt: t.createdAt,
          assigneeId: t.assigneeId,
          assigneeName: t.assigneeName,
          assigneeInitials: t.assigneeInitials,
          members: t.members,
          projectId: t.projectId,
          projectName: t.projectName,
          sprintId: t.sprintId,
          points: t.points,
          isFlagged: t.isFlagged,
          coverImageUrl: t.coverImageUrl,
          coverAttachmentId: t.coverAttachmentId,
          labels: t.labels,
          commentsCount: t.commentsCount,
          attachmentsCount: t.attachmentsCount,
        }));
        localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(minimalTasks));
      } catch (innerErr) {
        console.warn('LocalStorage quota fallback failed:', innerErr);
      }
    }
  }, [tasks]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
    } catch (e) {
      console.warn('Failed to save projects to localStorage:', e);
    }
  }, [projects]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
    } catch (e) {
      console.warn('Failed to save employees to localStorage:', e);
    }
  }, [employees]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SPRINTS, JSON.stringify(sprints));
    } catch (e) {
      console.warn('Failed to save sprints to localStorage:', e);
    }
  }, [sprints]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CURRENT_SPRINT_ID, currentSprintId);
    } catch (e) {
      console.warn('Failed to save currentSprintId to localStorage:', e);
    }
  }, [currentSprintId]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TRELLO, JSON.stringify(trelloSettings));
    } catch (e) {
      console.warn('Failed to save trelloSettings to localStorage:', e);
    }
  }, [trelloSettings]);

  useEffect(() => {
    try {
      // Keep only the latest 30 activities in localStorage
      localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(activities.slice(0, 30)));
    } catch (e) {
      console.warn('Failed to save activities to localStorage:', e);
    }
  }, [activities]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SPINE_STATUSES, JSON.stringify(spineStatuses));
    } catch (e) {
      console.warn('Failed to save spineStatuses to localStorage:', e);
    }
  }, [spineStatuses]);

  // Deep-linking to open shared task from URL (?task=xxx or #task=xxx)
  useEffect(() => {
    if (!tasks || tasks.length === 0) return;
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const hash = window.location.hash;
      const urlTaskId = urlParams.get('task') || (hash.startsWith('#task=') ? hash.replace('#task=', '') : null);
      if (urlTaskId) {
        const found = tasks.find((t) => t.id === urlTaskId || t.id.toLowerCase() === urlTaskId.toLowerCase());
        if (found) {
          setEditingTask(found);
          setIsTaskModalOpen(true);
        }
      }
    } catch (e) {
      console.warn('Error handling deep link:', e);
    }
  }, [tasks]);

  // Spine Status Actions
  const addSpineStatus = (statusData: Omit<SpineStatusConfig, 'id'>) => {
    const id = `status-${Date.now()}`;
    const newStatus: SpineStatusConfig = {
      ...statusData,
      id,
      isDefault: false,
    };
    setSpineStatuses((prev) => [...prev, newStatus]);
    addToast('Status Criado! 🏷️', `Novo status "${newStatus.label}" foi adicionado com sucesso.`, 'success');
  };

  const updateSpineStatus = (id: string, updates: Partial<SpineStatusConfig>) => {
    setSpineStatuses((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
    addToast('Status Atualizado ✏️', 'As alterações do status foram salvas.', 'success');
  };

  const deleteSpineStatus = (id: string, fallbackStatusId: string = 'backlog') => {
    const statusToDelete = spineStatuses.find((s) => s.id === id);
    if (!statusToDelete) return;

    // Migrate any existing tasks with this status to fallbackStatusId
    setTasks((prev) =>
      prev.map((t) => (t.status === id ? { ...t, status: fallbackStatusId } : t))
    );

    // Update trello mappings using this status
    setTrelloSettings((prev) => ({
      ...prev,
      boardMappings: prev.boardMappings.map((m) =>
        m.spineStatus === id ? { ...m, spineStatus: fallbackStatusId } : m
      ),
    }));

    setSpineStatuses((prev) => prev.filter((s) => s.id !== id));
    addToast(
      'Status Removido 🗑️',
      `O status "${statusToDelete.label}" foi removido e as tarefas foram migradas.`,
      'info'
    );
  };

  const reorderSpineStatuses = (newStatuses: SpineStatusConfig[]) => {
    setSpineStatuses(newStatuses);
  };

  const resetSpineStatusesToDefault = () => {
    setSpineStatuses(DEFAULT_SPINE_STATUSES);
    addToast('Status Restaurados 🔄', 'Os status voltaram para o padrão do sistema.', 'info');
  };

  // Task Actions
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => { });
    }
  }, []);

  // Trigger alert notifications for tasks due in <= 2 days
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const now = new Date();
      tasks.forEach((t) => {
        if (t.status === 'done' || !t.dueDate || t.dueDate === 'Sem prazo') return;
        let dueObj: Date | null = null;
        if (t.dueDate.includes('/')) {
          const parts = t.dueDate.split('/');
          if (parts.length === 3) dueObj = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
        } else if (t.dueDate.includes('-')) {
          dueObj = new Date(t.dueDate);
        }
        if (dueObj && !isNaN(dueObj.getTime())) {
          const diffDays = (dueObj.getTime() - now.getTime()) / (1000 * 3600 * 24);
          if (diffDays >= -0.5 && diffDays <= 2) {
            const notifiedKey = `spine_notified_${t.id}_${t.dueDate}`;
            if (!sessionStorage.getItem(notifiedKey)) {
              sessionStorage.setItem(notifiedKey, 'true');
              new Notification(`Alerta de Prazo Spine 🚨`, {
                body: `A tarefa "${t.title}" vence em breve (${t.dueDate})!`,
              });
            }
          }
        }
      });
    }
  }, [tasks]);

  const addToast = (title: string, message?: string, type: ToastNotification['type'] = 'success') => {
    // Only display notifications if it is an error
    if (type !== 'error') return;

    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Auto-logout at 00:00 (Midnight daily reset for all users)
  useEffect(() => {
    if (!currentUser) return;

    const performMidnightLogout = () => {
      logout();
    };

    const checkMidnightExpiry = () => {
      const loginDate = localStorage.getItem(STORAGE_KEYS.LOGIN_DATE);
      const today = getTodayDateStr();
      if (loginDate && loginDate !== today) {
        performMidnightLogout();
      }
    };

    // 1. Calculate time until next midnight (00:00:00)
    const now = new Date();
    const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
    const msUntilMidnight = Math.max(nextMidnight.getTime() - now.getTime(), 1000);

    const midnightTimer = setTimeout(() => {
      performMidnightLogout();
    }, msUntilMidnight);

    // 2. Periodic safety check every 10 seconds (handles system sleep, tab throttling)
    const interval = setInterval(checkMidnightExpiry, 10000);

    // 3. Multi-tab synchronization (if one tab logs out or hits midnight, logout everywhere)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'spine_logged_user' && !e.newValue) {
        setCurrentUserState(null);
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearTimeout(midnightTimer);
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [currentUser]);

  const addActivity = (userName: string, userInitials: string, message: string, dotColor: ActivityItem['dotColor'] = 'blue') => {
    const newAct: ActivityItem = {
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userName,
      userInitials,
      message,
      timeAgo: 'Just now',
      dotColor,
    };
    setActivities((prev) => [newAct, ...prev.slice(0, 19)]);
  };

  const currentSprint = sprints.find((s) => s.id === currentSprintId) || sprints[0] || INITIAL_SPRINT;

  const setCurrentSprintId = (id: string) => {
    setCurrentSprintIdState(id);
    setSprints((prev) =>
      prev.map((s) => ({
        ...s,
        isCurrent: s.id === id,
      }))
    );
    const sprint = sprints.find((s) => s.id === id);
    if (sprint) {
      addToast('Sprint Changed', `Switched active view to ${sprint.name}`, 'info');
    }
  };

  const updateCurrentSprintGoal = (goal: string) => {
    setSprints((prev) =>
      prev.map((s) => (s.id === currentSprintId ? { ...s, goal } : s))
    );
    addToast('Sprint Goal Updated', 'New sprint objective saved.', 'success');
  };

  // Push changes from Spine to Trello in real-time
  const pushTrelloMutation = async (
    actionType: 'MOVE' | 'UPDATE' | 'DELETE' | 'CREATE',
    task: Partial<Task> & { id?: string; title?: string; status?: TaskStatus },
    extraParams?: { newStatus?: TaskStatus }
  ) => {
    return;
  };

  // Task Actions with Supabase Realtime Persistence
  const addTask = async (newTaskData: Omit<Task, 'id' | 'createdAt'>) => {
    const id = `task-${Date.now()}`;
    const newTask: Task = {
      ...newTaskData,
      id,
      status: newTaskData.status || 'backlog',
      lastMovedAt: Date.now(),
      createdAt: new Date().toISOString().split('T')[0],
    };
    setTasks((prev) => [newTask, ...prev]);

    // 1. Salva no Supabase imediatamente (com fallback seguro caso colunas extras não existam ainda)
    try {
      const fullPayload = {
        id: newTask.id,
        trello_id: null,
        title: newTask.title,
        description: newTask.description || '',
        category: newTask.category || '',
        status: newTask.status,
        due_date: newTask.dueDate,
        points: newTask.points || 0,
        is_flagged: newTask.isFlagged || false,
        project_id: newTask.projectId,
        project_name: newTask.projectName,
        sprint_id: newTask.sprintId,
        assignee_id: newTask.assigneeId,
        assignee_name: newTask.assigneeName,
        assignee_initials: newTask.assigneeInitials,
        members: newTask.members || [],
        labels: newTask.labels || [],
        attachments: newTask.attachments || [],
        reference_images: newTask.referenceImages || [],
        cover_image_url: newTask.coverImageUrl,
        cover_attachment_id: newTask.coverAttachmentId,
        last_moved_at: newTask.lastMovedAt,
      };

      let { error } = await supabase.from('tasks').upsert(fullPayload);

      if (error) {
        console.warn('Full payload error, trying base columns fallback:', error.message);
        // Fallback apenas com colunas essenciais padrão
        const basePayload = {
          id: newTask.id,
          title: newTask.title,
          description: newTask.description || '',
          status: newTask.status,
          category: newTask.category || '',
          due_date: newTask.dueDate,
          assignee_id: newTask.assigneeId,
          assignee_name: newTask.assigneeName,
          project_id: newTask.projectId,
        };
        const resBase = await supabase.from('tasks').upsert(basePayload);
        if (resBase.error) {
          console.error('Supabase base insert error:', resBase.error.message);
        }
      }
    } catch (sbErr: any) {
      console.warn('Supabase task insert exception:', sbErr);
    }

    // Update employee workload & task count
    if (newTask.assigneeId) {
      setEmployees((prev) =>
        prev.map((emp) =>
          emp.id === newTask.assigneeId
            ? {
              ...emp,
              assignedTaskCount: emp.assignedTaskCount + 1,
              currentWorkload: Math.min(130, emp.currentWorkload + 10),
            }
            : emp
        )
      );
    }

    addActivity('You', 'YO', `criou a tarefa "${newTask.title}"`, 'purple');
    addToast('Tarefa Criada', `"${newTask.title}" cadastrada no sistema.`);
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    const now = Date.now();

    // 1. Atualiza estado local e localStorage de forma síncrona e confiável
    setTasks((prev) => {
      const next = prev.map((task) => {
        if (task.id === id) {
          const statusChanged = updates.status !== undefined && updates.status !== task.status;
          return {
            ...task,
            ...updates,
            lastMovedAt: statusChanged ? now : (task.lastMovedAt || now),
          };
        }
        return task;
      });
      try {
        localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(next));
      } catch {}
      return next;
    });

    // 2. Monta o payload completo para gravação persistente no Supabase
    try {
      const payload: any = {
        updated_at: new Date().toISOString(),
      };
      if (updates.status !== undefined) {
        payload.status = updates.status;
        payload.last_moved_at = now;
      }
      if (updates.title !== undefined) payload.title = updates.title;
      if (updates.description !== undefined) payload.description = updates.description;
      if (updates.category !== undefined) payload.category = updates.category;
      if (updates.dueDate !== undefined) payload.due_date = updates.dueDate;
      if (updates.assigneeId !== undefined) payload.assignee_id = updates.assigneeId;
      if (updates.assigneeName !== undefined) payload.assignee_name = updates.assigneeName;
      if (updates.assigneeInitials !== undefined) payload.assignee_initials = updates.assigneeInitials;
      if (updates.members !== undefined) payload.members = updates.members;
      if (updates.labels !== undefined) payload.labels = updates.labels;
      if (updates.referenceImages !== undefined) payload.reference_images = updates.referenceImages;
      if (updates.attachments !== undefined) payload.attachments = updates.attachments;
      if (updates.comments !== undefined) payload.comments = updates.comments;
      if (updates.points !== undefined) payload.points = updates.points;
      if (updates.isFlagged !== undefined) payload.is_flagged = updates.isFlagged;
      if (updates.coverImageUrl !== undefined) payload.cover_image_url = updates.coverImageUrl;
      if (updates.coverAttachmentId !== undefined) payload.cover_attachment_id = updates.coverAttachmentId;
      if (updates.projectName !== undefined) payload.project_name = updates.projectName;
      if (updates.projectId !== undefined) payload.project_id = updates.projectId;
      if (updates.sprintId !== undefined) payload.sprint_id = updates.sprintId;
      if (updates.driveFolderId !== undefined) payload.drive_folder_id = updates.driveFolderId;
      if (updates.driveFolderUrl !== undefined) payload.drive_folder_url = updates.driveFolderUrl;

      const { error: sbErr } = await supabase.from('tasks').update(payload).eq('id', id);
      if (sbErr) {
        console.error('[Supabase] Falha ao atualizar tarefa:', sbErr.message);
      } else {
        console.log(`[Supabase] Tarefa "${id}" atualizada com sucesso no banco.`);
      }
    } catch (sbErr) {
      console.warn('Supabase task update warning:', sbErr);
    }
  };

  const deleteTask = async (id: string) => {
    const taskToDelete = tasks.find((t) => t.id === id);

    // 1. Remove pasta correspondente do Google Drive se existir (por ID ou pelo Título da Demanda)
    import('../lib/googleDrive').then(({ deleteDriveFolder }) => {
      deleteDriveFolder(taskToDelete?.driveFolderId, taskToDelete?.title).then((success) => {
        if (success) {
          console.log(`Pasta do Google Drive referente a "${taskToDelete?.title}" excluída com sucesso.`);
        }
      });
    });

    // 2. Remove do Supabase
    try {
      await supabase.from('tasks').delete().eq('id', id);
    } catch (sbErr) {
      console.warn('Supabase task delete warning:', sbErr);
    }

    setTasks((prev) => prev.filter((t) => t.id !== id));
    if (taskToDelete?.assigneeId) {
      setEmployees((prev) =>
        prev.map((emp) =>
          emp.id === taskToDelete.assigneeId
            ? {
              ...emp,
              assignedTaskCount: Math.max(0, emp.assignedTaskCount - 1),
              currentWorkload: Math.max(10, emp.currentWorkload - 10),
            }
            : emp
        )
      );
    }
    addToast('Task Deleted', `Removed "${taskToDelete?.title || 'task'}"`, 'info');
  };

  const moveTaskStatus = async (id: string, newStatus: TaskStatus) => {
    const targetTask = tasks.find((t) => t.id === id);
    if (!targetTask) return;

    const oldStatus = targetTask.status;
    if (oldStatus === newStatus) return;

    const now = Date.now();
    const currentStatusConfig = spineStatuses.find((s) => s.id === newStatus);
    const statusLabel = currentStatusConfig?.label || newStatus;

    const isApprovalOrDone =
      newStatus === 'done' ||
      newStatus === 'postar' ||
      newStatus.toLowerCase().includes('concl') ||
      newStatus.toLowerCase().includes('post') ||
      statusLabel.toLowerCase().includes('concl') ||
      statusLabel.toLowerCase().includes('post') ||
      statusLabel.toLowerCase().includes('entreg');

    const nextDeliveredAt = isApprovalOrDone
      ? (targetTask.deliveredAt || new Date().toLocaleDateString('pt-BR'))
      : (newStatus === 'in_review' || newStatus.toLowerCase().includes('revis') ? undefined : targetTask.deliveredAt);

    // Preserva ou infere o responsável se a coluna anterior era nominal
    let nextAssigneeId = targetTask.assigneeId;
    let nextAssigneeName = targetTask.assigneeName;
    let nextAssigneeInitials = targetTask.assigneeInitials;

    if (!nextAssigneeName && targetTask.trelloListName) {
      const foundEmp = employees.find((e) => {
        const fName = e.name.toLowerCase().split(' ')[0].trim();
        return fName.length > 2 && targetTask.trelloListName!.toLowerCase().includes(fName);
      });
      if (foundEmp) {
        nextAssigneeId = foundEmp.id;
        nextAssigneeName = foundEmp.name;
        nextAssigneeInitials = foundEmp.initials;
      }
    }

    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              status: newStatus,
              trelloListName: statusLabel,
              lastMovedAt: now,
              deliveredAt: nextDeliveredAt,
              assigneeId: nextAssigneeId,
              assigneeName: nextAssigneeName,
              assigneeInitials: nextAssigneeInitials,
            }
          : t
      )
    );

    // 1. Atualiza no Supabase imediatamente em tempo real
    try {
      const updateObj: any = {
        status: newStatus,
        last_moved_at: now,
        updated_at: new Date().toISOString(),
      };
      if (nextAssigneeId) updateObj.assignee_id = nextAssigneeId;
      if (nextAssigneeName) updateObj.assignee_name = nextAssigneeName;
      if (nextAssigneeInitials) updateObj.assignee_initials = nextAssigneeInitials;

      const { error } = await supabase
        .from('tasks')
        .update(updateObj)
        .eq('id', id);
      if (error) {
        console.error('Supabase status move update error:', error);
      }
    } catch (sbErr) {
      console.warn('Supabase status move error:', sbErr);
    }

    // 2. Push status move to Trello in real-time
    pushTrelloMutation('MOVE', { ...targetTask, status: newStatus, trelloListName: statusLabel, lastMovedAt: now, deliveredAt: nextDeliveredAt }, { newStatus });

    if (newStatus === 'done' || newStatus.toLowerCase().includes('concl') || newStatus.toLowerCase().includes('done')) {
      addActivity(targetTask.assigneeName || 'User', targetTask.assigneeInitials || 'US', `completed task "${targetTask.title}"`, 'green');
      addToast('Task Completed! 🎉', `"${targetTask.title}" is now done.`);
    } else {
      addActivity(
        targetTask.assigneeName || 'User',
        targetTask.assigneeInitials || 'US',
        `moved "${targetTask.title}" to ${statusLabel}`,
        newStatus === 'overdue' || newStatus === 'blocked' ? 'orange' : 'blue'
      );
      addToast('Status Updated', `Moved to ${statusLabel}`);
    }
  };

  const moveAllBacklogToDoneLocally = () => {
    const count = tasks.filter(
      (t) => t.status === 'backlog' || t.status.toLowerCase().includes('backlog')
    ).length;

    if (count === 0) {
      addToast('Backlog Vazio', 'Não há tarefas no backlog para mover.', 'info');
      return;
    }

    setTasks((prev) =>
      prev.map((t) => {
        if (t.status === 'backlog' || t.status.toLowerCase().includes('backlog')) {
          return { ...t, status: 'done' };
        }
        return t;
      })
    );

    addToast(
      'Backlog Movido para Concluídas ✅',
      `${count} tarefas do Backlog foram marcadas como concluídas apenas no sistema (Trello permaneceu inalterado).`,
      'success'
    );
  };

  const toggleFlagTask = async (id: string) => {
    let nowFlagged = false;
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          nowFlagged = !t.isFlagged;
          return { ...t, isFlagged: nowFlagged };
        }
        return t;
      })
    );

    try {
      await supabase.from('tasks').update({ is_flagged: nowFlagged, updated_at: new Date().toISOString() }).eq('id', id);
    } catch (sbErr) {
      console.warn('Supabase toggle flag warning:', sbErr);
    }

    const task = tasks.find((t) => t.id === id);
    if (task) {
      if (nowFlagged) {
        addActivity(currentUser?.name || 'Theo R.', currentUser?.initials || 'TR', `marcou a tarefa "${task.title}" como prioritária / alerta`, 'orange');
        addToast('Tarefa Marcada', `"${task.title}" marcada como prioridade / alerta.`, 'warning');
      } else {
        addToast('Alerta Removido', `"${task.title}" desmarcada.`, 'info');
      }
    }
  };

  const clearAllTasks = () => {
    const trelloIds = tasks.filter((t) => t.id.startsWith('trello-')).map((t) => t.id);
    const rawTrelloIds = trelloIds.map((id) => id.replace('trello-', ''));
    setDeletedTrelloTaskIds((prev) => [...new Set([...prev, ...trelloIds, ...rawTrelloIds])]);
    setTasks([]);
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify([]));
    
    // Limpa também do Supabase caso existam tarefas salvas lá
    supabase.from('tasks').delete().neq('id', '0').then();

    addActivity('Admin', 'AD', 'limpou todas as tarefas do sistema', 'orange');
    addToast('Tarefas Limpas', 'Todas as tarefas do sistema foram removidas com sucesso.', 'info');
  };

  const clearTrelloTasks = () => {
    const trelloIds = tasks.filter((t) => t.id.startsWith('trello-')).map((t) => t.id);
    const rawTrelloIds = trelloIds.map((id) => id.replace('trello-', ''));
    setDeletedTrelloTaskIds((prev) => [...new Set([...prev, ...trelloIds, ...rawTrelloIds])]);
    setTasks((prev) => prev.filter((t) => !t.id.startsWith('trello-')));
    
    // Remove do Supabase
    if (trelloIds.length > 0) {
      supabase.from('tasks').delete().in('id', trelloIds).then();
    }

    addActivity('Admin', 'AD', 'limpou as tarefas importadas do Trello', 'blue');
    addToast('Tarefas do Trello Removidas', 'Todas as tarefas sincronizadas do Trello foram limpas.', 'info');
  };

  const resetSystemKeepCredentials = () => {
    setTasks([]);
    setProjects([]);
    setEmployees([]);
    setActivities([]);
    setDeletedTrelloTaskIds([]);

    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.DELETED_TRELLO_TASKS, JSON.stringify([]));

    // Limpa registros do Supabase
    supabase.from('tasks').delete().neq('id', '0').then();

    addToast('Sistema Limpo! 🧹', 'Todo o sistema foi resetado. Suas chaves de API do Trello foram mantidas intactas.', 'success');
  };

  // Project Actions (Salva no Supabase + Local + Trello)
  const addProject = async (newProjData: Omit<Project, 'id'>) => {
    const id = `proj-${Date.now()}`;
    const newProj: Project = {
      ...newProjData,
      id,
      totalTasks: 0,
      completedTasks: 0,
    };

    setProjects((prev) => {
      const next = [newProj, ...prev];
      try {
        localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(next));
      } catch {}
      return next;
    });

    const { cleanDescription } = decodeProjectDescription(newProj.description);
    const packedDescription = encodeProjectDescription(cleanDescription, {
      colorPalette: newProj.colorPalette,
      brandManualUrl: newProj.brandManualUrl,
      logosPackUrl: newProj.logosPackUrl,
      typographyUrl: newProj.typographyUrl,
      additionalMaterialsUrl: newProj.additionalMaterialsUrl,
    });

    // Persiste no Supabase
    try {
      const { error } = await supabase.from('projects').upsert({
        id: newProj.id,
        name: newProj.name,
        category: newProj.category,
        description: packedDescription,
        status: newProj.status,
        progress: newProj.progress,
        current_sprint: newProj.currentSprint,
        icon_type: newProj.iconType,
        icon_color: newProj.iconColor,
        team_member_ids: newProj.teamMemberIds,
        label_id: newProj.labelId,
        label_color: newProj.labelColor,
        logo_url: newProj.logoUrl,
        client_ids: newProj.clientIds,
        client_names: newProj.clientNames,
        client_id: newProj.clientId,
        client_name: newProj.clientName,
        color_palette: newProj.colorPalette,
        brand_manual_url: newProj.brandManualUrl,
        logos_pack_url: newProj.logosPackUrl,
        typography_url: newProj.typographyUrl,
        additional_materials_url: newProj.additionalMaterialsUrl,
      });

      if (error) {
        // Fallback without extra columns if not migrated yet
        await supabase.from('projects').upsert({
          id: newProj.id,
          name: newProj.name,
          category: newProj.category,
          description: packedDescription,
          status: newProj.status,
          progress: newProj.progress,
          current_sprint: newProj.currentSprint,
          icon_type: newProj.iconType,
          icon_color: newProj.iconColor,
          team_member_ids: newProj.teamMemberIds,
          label_id: newProj.labelId,
          label_color: newProj.labelColor,
          logo_url: newProj.logoUrl,
        });
      }
      addToast('Cliente Salvo ☁️', `"${newProj.name}" e materiais gravados com sucesso.`, 'success');
    } catch (sbErr: any) {
      console.warn('Supabase project insert fallback:', sbErr);
    }

    addActivity('Admin', 'AD', `cadastrou o cliente/projeto "${newProj.name}"`, 'purple');
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    let updatedMergedProj: Project | null = null;

    setProjects((prev) => {
      const next = prev.map((proj) => {
        if (proj.id === id) {
          const merged = { ...proj, ...updates };
          updatedMergedProj = merged;
          return merged;
        }
        return proj;
      });
      try {
        localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(next));
      } catch {}
      return next;
    });

    const targetProj = updatedMergedProj || updates;
    const { cleanDescription } = decodeProjectDescription(targetProj.description || '');
    const packedDescription = encodeProjectDescription(cleanDescription, {
      colorPalette: targetProj.colorPalette,
      brandManualUrl: targetProj.brandManualUrl,
      logosPackUrl: targetProj.logosPackUrl,
      typographyUrl: targetProj.typographyUrl,
      additionalMaterialsUrl: targetProj.additionalMaterialsUrl,
    });

    // Atualiza no Supabase
    try {
      const payload: any = { id };
      if (updates.name !== undefined) payload.name = updates.name;
      if (updates.category !== undefined) payload.category = updates.category;
      payload.description = packedDescription;
      if (updates.status !== undefined) payload.status = updates.status;
      if (updates.progress !== undefined) payload.progress = updates.progress;
      if (updates.currentSprint !== undefined) payload.current_sprint = updates.currentSprint;
      if (updates.iconType !== undefined) payload.icon_type = updates.iconType;
      if (updates.iconColor !== undefined) payload.icon_color = updates.iconColor;
      if (updates.teamMemberIds !== undefined) payload.team_member_ids = updates.teamMemberIds;
      if (updates.labelId !== undefined) payload.label_id = updates.labelId;
      if (updates.labelColor !== undefined) payload.label_color = updates.labelColor;
      if (updates.logoUrl !== undefined) payload.logo_url = updates.logoUrl;
      if (updates.clientIds !== undefined) payload.client_ids = updates.clientIds;
      if (updates.clientNames !== undefined) payload.client_names = updates.clientNames;
      if (updates.clientId !== undefined) payload.client_id = updates.clientId;
      if (updates.clientName !== undefined) payload.client_name = updates.clientName;
      if (updates.colorPalette !== undefined) payload.color_palette = updates.colorPalette;
      if (updates.brandManualUrl !== undefined) payload.brand_manual_url = updates.brandManualUrl;
      if (updates.logosPackUrl !== undefined) payload.logos_pack_url = updates.logosPackUrl;
      if (updates.typographyUrl !== undefined) payload.typography_url = updates.typographyUrl;
      if (updates.additionalMaterialsUrl !== undefined) payload.additional_materials_url = updates.additionalMaterialsUrl;

      const { error } = await supabase.from('projects').upsert(payload);
      if (error) {
        // Fallback without dynamic columns
        delete payload.color_palette;
        delete payload.brand_manual_url;
        delete payload.logos_pack_url;
        delete payload.typography_url;
        delete payload.additional_materials_url;
        await supabase.from('projects').upsert(payload);
      }
    } catch (sbErr) {
      console.warn('Supabase project update warning:', sbErr);
    }

    addToast('Cliente Atualizado', 'Alterações e materiais salvos com sucesso.');
  };

  const deleteProject = async (id: string) => {
    const projToDelete = projects.find((p) => p.id === id);
    if (projToDelete?.labelId) {
      deleteTrelloLabel(projToDelete.labelId);
    }
    setProjects((prev) => prev.filter((p) => p.id !== id));

    // Remove do Supabase
    try {
      await supabase.from('projects').delete().eq('id', id);
    } catch (sbErr) {
      console.warn('Supabase project delete warning:', sbErr);
    }

    addToast('Cliente / Projeto Excluído', `Removido "${projToDelete?.name || 'cliente'}" e sua etiqueta no Trello.`, 'info');
  };

  // Employee Actions (Salva no Supabase + Local + Trello)
  const addEmployee = async (newEmpData: Omit<Employee, 'id'>) => {
    const id = `emp-${Date.now()}`;
    const newEmp: Employee = {
      ...newEmpData,
      id,
    };
    setEmployees((prev) => [newEmp, ...prev]);

    // Persiste no Supabase
    try {
      const { data, error } = await supabase.from('employees').upsert({
        id: newEmp.id,
        name: newEmp.name,
        role: newEmp.role,
        department: newEmp.department,
        initials: newEmp.initials,
        status: newEmp.status,
        tags: newEmp.tags,
        current_workload: newEmp.currentWorkload,
        email: newEmp.email,
        password: newEmp.password || '',
        username: newEmp.username || '',
        location: newEmp.location || 'Brasil',
        label_id: newEmp.labelId,
        label_color: newEmp.labelColor,
        needs_password_change: newEmp.needsPasswordChange !== undefined ? newEmp.needsPasswordChange : true,
      });
      if (error) {
        console.error('Supabase employee insert error:', error);
        addToast('Erro Supabase ⚠️', `Falha ao gravar no Supabase: ${error.message}`, 'error');
      } else {
        addToast('Funcionário Salvo no Supabase ☁️', `${newEmp.name} gravado no banco de dados.`, 'success');
      }
    } catch (sbErr: any) {
      console.error('Supabase employee insert exception:', sbErr);
      addToast('Erro Supabase ⚠️', `Exceção ao gravar no Supabase: ${sbErr.message}`, 'error');
    }

    addActivity('Admin', 'AD', `adicionou ${newEmp.name} como colaborador`, 'purple');
  };

  const updateEmployee = async (id: string, updates: Partial<Employee>) => {
    setEmployees((prev) =>
      prev.map((emp) => (emp.id === id ? { ...emp, ...updates } : emp))
    );

    // Atualiza no Supabase
    try {
      const payload: any = { id };
      if (updates.name !== undefined) payload.name = updates.name;
      if (updates.role !== undefined) payload.role = updates.role;
      if (updates.department !== undefined) payload.department = updates.department;
      if (updates.initials !== undefined) payload.initials = updates.initials;
      if (updates.status !== undefined) payload.status = updates.status;
      if (updates.tags !== undefined) payload.tags = updates.tags;
      if (updates.currentWorkload !== undefined) payload.current_workload = updates.currentWorkload;
      if (updates.email !== undefined) payload.email = updates.email;
      if (updates.password !== undefined) payload.password = updates.password;
      if (updates.username !== undefined) payload.username = updates.username;
      if (updates.location !== undefined) payload.location = updates.location;
      if (updates.labelId !== undefined) payload.label_id = updates.labelId;
      if (updates.labelColor !== undefined) payload.label_color = updates.labelColor;
      if (updates.needsPasswordChange !== undefined) payload.needs_password_change = updates.needsPasswordChange;

      await supabase.from('employees').upsert(payload);
    } catch (sbErr) {
      console.warn('Supabase employee update warning:', sbErr);
    }

    addToast('Perfil Atualizado', 'Dados do funcionário salvos no Supabase.');
  };

  const deleteEmployee = async (id: string) => {
    const empToDelete = employees.find((e) => e.id === id);
    if (empToDelete?.labelId) {
      deleteTrelloLabel(empToDelete.labelId);
    }
    setEmployees((prev) => prev.filter((e) => e.id !== id));

    // Remove do Supabase
    try {
      await supabase.from('employees').delete().eq('id', id);
    } catch (sbErr) {
      console.warn('Supabase employee delete warning:', sbErr);
    }

    addToast('Funcionário Removido', `Removido ${empToDelete?.name || 'colaborador'} e sua etiqueta no Trello.`, 'info');
  };

  // Trello Actions
  const updateTrelloSettings = (updates: Partial<TrelloSettings>) => {
    setTrelloSettings((prev) => ({ ...prev, ...updates }));
    addToast('Trello Settings Saved', 'Integration configuration has been updated.', 'success');
  };

  const testTrelloConnection = async (overrideApiKey?: string, overrideToken?: string): Promise<boolean> => {
    const key = overrideApiKey ?? trelloSettings.apiKey;
    const token = overrideToken ?? trelloSettings.serverToken;

    if (!key || !token) {
      addToast('Connection Failed', 'Please enter both your API Key and Server Token.', 'error');
      setTrelloSettings((prev) => ({ ...prev, isConnected: false }));
      return false;
    }

    setIsSyncing(true);
    try {
      const res = await fetch(`https://api.trello.com/1/members/me?key=${key}&token=${token}`);
      if (res.ok) {
        const memberData = await res.json();
        const workspaceName = memberData.fullName || memberData.username || 'Trello Account';
        setTrelloSettings((prev) => ({
          ...prev,
          apiKey: key,
          serverToken: token,
          isConnected: true,
          workspaceName,
          lastSyncedAt: 'Just now',
        }));
        addToast(
          'Conexão Trello Confirmada! 🚀',
          `API Key e Token VÁLIDOS! Conectado a ${workspaceName} (@${memberData.username}).`,
          'success'
        );
        return true;
      } else {
        const errText = await res.text();
        setTrelloSettings((prev) => ({ ...prev, isConnected: false }));
        addToast(
          'Chave/Token Inválidos ❌',
          `A API do Trello recusou as credenciais (Erro ${res.status}: ${errText || 'Não autorizado'}).`,
          'error'
        );
        return false;
      }
    } catch (err: any) {
      setTrelloSettings((prev) => ({ ...prev, isConnected: false }));
      addToast(
        'Erro de Rede Trello',
        `Falha ao conectar à API do Trello: ${err.message || 'Verifique a conexão'}.`,
        'error'
      );
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  const fetchTrelloCardComments = async (taskId: string): Promise<TrelloComment[]> => {
    const key = trelloSettings.apiKey;
    const token = trelloSettings.serverToken;
    const cardId = taskId.replace('trello-', '');

    if (!key || !token || !cardId) return [];

    try {
      const res = await fetch(
        `https://api.trello.com/1/cards/${cardId}/actions?filter=commentCard&key=${key}&token=${token}`
      );
      if (res.ok) {
        const commentsData: any[] = await res.json();
        return commentsData.map((c) => {
          const authorName = c.memberCreator?.fullName || c.memberCreator?.username || 'Usuário Trello';
          const authorInitials = authorName
            .split(' ')
            .map((n: string) => n[0])
            .join('')
            .substring(0, 2)
            .toUpperCase();
          const date = c.date
            ? new Date(c.date).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
            : 'Recentemente';

          return {
            id: c.id,
            authorName,
            authorInitials,
            text: c.data?.text || '',
            date,
          };
        });
      }
    } catch (err) {
      console.error('Failed to fetch card comments:', err);
    }
    return [];
  };

  const addTrelloComment = async (taskId: string, commentText: string): Promise<boolean> => {
    const key = trelloSettings.apiKey;
    const token = trelloSettings.serverToken;
    const cardId = taskId.replace('trello-', '');

    if (!key || !token || !cardId || !commentText.trim()) return false;

    try {
      const res = await fetch(
        `https://api.trello.com/1/cards/${cardId}/actions/comments?text=${encodeURIComponent(
          commentText.trim()
        )}&key=${key}&token=${token}`,
        { method: 'POST' }
      );
      if (res.ok) {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId
              ? { ...t, commentsCount: (t.commentsCount || 0) + 1 }
              : t
          )
        );
        addToast('Comentário Adicionado! 💬', 'Seu comentário foi publicado no Trello em tempo real.', 'success');
        addActivity('Você', 'VC', `comentou no cartão Trello: "${commentText.trim()}"`, 'purple');
        return true;
      }
    } catch (err) {
      console.error('Failed to post comment to Trello:', err);
      addToast('Erro ao Comentar', 'Não foi possível enviar o comentário ao Trello.', 'error');
    }
    return false;
  };

  const deleteTrelloComment = async (taskId: string, commentId: string): Promise<boolean> => {
    const key = trelloSettings.apiKey;
    const token = trelloSettings.serverToken;

    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const nextComments = (t.comments || []).filter((c) => c.id !== commentId);
          return {
            ...t,
            comments: nextComments,
            commentsCount: Math.max(0, (t.commentsCount || nextComments.length || 1) - 1),
          };
        }
        return t;
      })
    );

    if (!key || !token || !commentId) return true;

    try {
      const res = await fetch(
        `https://api.trello.com/1/actions/${commentId}?key=${key}&token=${token}`,
        { method: 'DELETE' }
      );
      if (res.ok) {
        addToast('Comentário Excluído 🗑️', 'O comentário foi removido.', 'info');
        return true;
      }
    } catch (err: any) {
      console.error('Failed to delete comment from Trello:', err);
    }
    return true;
  };

  const fetchTrelloCardAttachments = async (taskId: string): Promise<TrelloAttachment[]> => {
    const key = trelloSettings.apiKey;
    const token = trelloSettings.serverToken;
    const cardId = taskId.replace('trello-', '');

    if (!key || !token || !cardId) return [];

    try {
      const res = await fetch(
        `https://api.trello.com/1/cards/${cardId}/attachments?key=${key}&token=${token}`
      );
      if (res.ok) {
        const data: any[] = await res.json();
        const attachmentsList: TrelloAttachment[] = data.map((att) => ({
          id: att.id,
          name: att.name || 'Anexo',
          url: att.url,
          bytes: att.bytes,
          mimeType: att.mimeType,
          isUpload: att.isUpload,
          date: att.date ? new Date(att.date).toLocaleString('pt-BR') : undefined,
          previews: att.previews,
        }));

        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId
              ? { ...t, attachments: attachmentsList, attachmentsCount: attachmentsList.length }
              : t
          )
        );

        return attachmentsList;
      }
    } catch (err) {
      console.error('Failed to fetch card attachments:', err);
    }
    return [];
  };

  const addTrelloAttachment = async (taskId: string, source: string | File, name?: string): Promise<boolean> => {
    const key = trelloSettings.apiKey;
    const token = trelloSettings.serverToken;
    const cardId = taskId.replace('trello-', '');

    if (!key || !token || !cardId) return false;

    try {
      if (source instanceof File) {
        const formData = new FormData();
        formData.append('file', source);
        if (name) formData.append('name', name);

        const res = await fetch(
          `https://api.trello.com/1/cards/${cardId}/attachments?key=${key}&token=${token}`,
          {
            method: 'POST',
            body: formData,
          }
        );
        if (res.ok) {
          setTasks((prev) =>
            prev.map((t) =>
              t.id === taskId
                ? { ...t, attachmentsCount: (t.attachmentsCount || 0) + 1 }
                : t
            )
          );
          addToast('Arquivo Enviado! 📎', `O arquivo "${source.name}" foi enviado ao Trello.`, 'success');
          return true;
        } else {
          const errText = await res.text();
          addToast('Erro ao Enviar ⚠️', `Falha ao enviar arquivo: ${errText}`, 'error');
        }
      } else {
        if (!source.trim()) return false;
        const res = await fetch(
          `https://api.trello.com/1/cards/${cardId}/attachments?url=${encodeURIComponent(
            source.trim()
          )}&name=${encodeURIComponent(name || 'Anexo')}&key=${key}&token=${token}`,
          { method: 'POST' }
        );
        if (res.ok) {
          setTasks((prev) =>
            prev.map((t) =>
              t.id === taskId
                ? { ...t, attachmentsCount: (t.attachmentsCount || 0) + 1 }
                : t
            )
          );
          addToast('Anexo Adicionado! 📎', 'O link/anexo foi sincronizado com o Trello.', 'success');
          return true;
        }
      }
    } catch (err: any) {
      console.error('Failed to add attachment to Trello:', err);
      addToast('Erro ao Anexar ⚠️', `Não foi possível enviar o anexo: ${err.message}`, 'error');
    }
    return false;
  };

  const deleteTrelloAttachment = async (taskId: string, attachmentId: string): Promise<boolean> => {
    const key = trelloSettings.apiKey;
    const token = trelloSettings.serverToken;
    const cardId = taskId.replace('trello-', '');

    // Optimistically update local task attachments state
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const nextAtts = (t.attachments || []).filter((a) => a.id !== attachmentId);
          return {
            ...t,
            attachments: nextAtts,
            attachmentsCount: Math.max(0, (t.attachmentsCount || nextAtts.length || 1) - 1),
          };
        }
        return t;
      })
    );

    if (!key || !token || !cardId) return true;

    try {
      const res = await fetch(
        `https://api.trello.com/1/cards/${cardId}/attachments/${attachmentId}?key=${key}&token=${token}`,
        { method: 'DELETE' }
      );
      if (res.ok) {
        addToast('Anexo Excluído 🗑️', 'O anexo foi removido com sucesso do Trello e do sistema.', 'info');
        return true;
      } else {
        const errText = await res.text();
        console.warn('Trello attachment delete response:', res.status, errText);
      }
    } catch (err: any) {
      console.error('Failed to delete attachment from Trello:', err);
    }
    return true;
  };

  const createTrelloLabel = async (name: string, color: string): Promise<TrelloLabel | null> => {
    const key = trelloSettings.apiKey;
    const token = trelloSettings.serverToken;

    // Create locally first
    const newLocalLabel: TrelloLabel = {
      id: `lbl-${Date.now()}`,
      name,
      color: color || 'green',
    };

    setTrelloLabels((prev) => {
      if (prev.some((l) => l.name.toLowerCase() === name.toLowerCase())) {
        return prev;
      }
      return [...prev, newLocalLabel];
    });

    if (!key || !token) {
      addToast('Etiqueta Criada', `Etiqueta "${name}" criada localmente.`, 'success');
      return newLocalLabel;
    }

    try {
      // Find active board ID
      let boardId = '';
      const targetBoard = trelloSettings.targetBoard;
      if (targetBoard) {
        if (targetBoard.length >= 20 && !targetBoard.includes(' ')) {
          boardId = targetBoard;
        } else {
          // Fetch boards to find id
          const bRes = await fetch(`https://api.trello.com/1/members/me/boards?key=${key}&token=${token}&fields=id,name`);
          if (bRes.ok) {
            const bData = await bRes.json();
            const found = bData.find((b: any) => b.name.toLowerCase() === targetBoard.toLowerCase());
            if (found) boardId = found.id;
          }
        }
      }

      if (boardId) {
        const res = await fetch(
          `https://api.trello.com/1/labels?name=${encodeURIComponent(name)}&color=${encodeURIComponent(
            color || 'green'
          )}&idBoard=${boardId}&key=${key}&token=${token}`,
          { method: 'POST' }
        );
        if (res.ok) {
          const created: TrelloLabel = await res.json();
          setTrelloLabels((prev) => prev.map((l) => (l.id === newLocalLabel.id ? created : l)));
          addToast('Etiqueta Sincronizada! 🏷️', `Etiqueta "${name}" criada com sucesso no Trello e no sistema.`, 'success');
          return created;
        }
      }
    } catch (e: any) {
      console.warn('Could not push label to Trello API:', e);
    }

    addToast('Etiqueta Criada', `Etiqueta "${name}" criada com sucesso.`, 'success');
    return newLocalLabel;
  };

  const updateTrelloLabel = async (labelId: string, name: string, color: string): Promise<boolean> => {
    const key = trelloSettings.apiKey;
    const token = trelloSettings.serverToken;

    setTrelloLabels((prev) =>
      prev.map((l) => (l.id === labelId ? { ...l, name, color } : l))
    );

    if (!key || !token || labelId.startsWith('lbl-')) {
      return true;
    }

    try {
      const res = await fetch(
        `https://api.trello.com/1/labels/${labelId}?name=${encodeURIComponent(name)}&color=${encodeURIComponent(
          color || 'green'
        )}&key=${key}&token=${token}`,
        { method: 'PUT' }
      );
      return res.ok;
    } catch (e) {
      console.warn('Could not update label on Trello:', e);
      return false;
    }
  };

  const deleteTrelloLabel = async (labelId: string): Promise<boolean> => {
    const key = trelloSettings.apiKey;
    const token = trelloSettings.serverToken;

    setTrelloLabels((prev) => prev.filter((l) => l.id !== labelId));

    if (!key || !token || labelId.startsWith('lbl-')) {
      return true;
    }

    try {
      const res = await fetch(
        `https://api.trello.com/1/labels/${labelId}?key=${key}&token=${token}`,
        { method: 'DELETE' }
      );
      return res.ok;
    } catch (e) {
      console.warn('Could not delete label on Trello:', e);
      return false;
    }
  };

  const syncTrelloNow = async () => {
    return; // Trello sync disabled
  };

  const performSilentTrelloSync = async () => {
    return; // Trello sync disabled
  };

  // Escuta em Tempo Real do Supabase (WebSockets PostgreSQL)
  useEffect(() => {
    // 1. Carrega tarefas, funcionários e projetos iniciais salvos no Supabase
    const loadInitialSupabaseData = async () => {
      try {
        // Load Tasks
        const { data: tasksData, error: tasksErr } = await supabase.from('tasks').select('*');
        if (tasksErr) {
          console.warn('[Supabase] Erro ao carregar tarefas:', tasksErr.message);
        } else if (tasksData && tasksData.length > 0) {
          console.log('[Supabase] Tarefas carregadas:', tasksData.length);
          const loadedFromSb: Task[] = tasksData.map((row: any) => ({
            id: row.id,
            title: row.title,
            description: row.description || '',
            category: row.category || 'Geral',
            status: row.status as TaskStatus,
            dueDate: row.due_date,
            points: Number(row.points) || 0,
            isFlagged: Boolean(row.is_flagged),
            projectId: row.project_id,
            projectName: row.project_name || 'General',
            sprintId: row.sprint_id || 'sprint-1',
            assigneeId: row.assignee_id,
            assigneeName: row.assignee_name,
            assigneeInitials: row.assignee_initials,
            members: row.members || [],
            labels: row.labels || [],
            attachments: row.attachments || [],
            referenceImages: (row.reference_images || []).map((r: any) => ({
              ...r,
              url:
                (!r.url || r.url.startsWith('data:')) && r.driveFileId
                  ? `https://drive.google.com/thumbnail?id=${r.driveFileId}&sz=w1000`
                  : r.url,
            })),
            comments: row.comments || [],
            coverImageUrl: row.cover_image_url,
            coverAttachmentId: row.cover_attachment_id,
            lastMovedAt: Number(row.last_moved_at) || Date.now(),
            createdAt: row.created_at ? row.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
          }));

          setTasks(loadedFromSb);
          try {
            localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(loadedFromSb));
          } catch {}
        }

        // Load Employees
        const { data: empData, error: empErr } = await supabase.from('employees').select('*');
        if (empErr) {
          console.warn('[Supabase] Erro ao carregar funcionários:', empErr.message);
        } else if (empData && empData.length > 0) {
          console.log('[Supabase] Funcionários carregados:', empData.length);
          const loadedEmps: Employee[] = empData.map((row: any) => ({
            id: row.id,
            name: row.name,
            role: row.role || 'Colaborador',
            department: row.department || 'Design',
            initials: row.initials || 'CB',
            status: row.status || 'online',
            tags: Array.isArray(row.tags) ? row.tags : [],
            currentWorkload: Number(row.current_workload) || 50,
            assignedTaskCount: 0,
            collaboratorIds: [],
            email: row.email || '',
            password: row.password || '',
            username: row.username || '',
            location: row.location || 'Brasil',
            labelId: row.label_id,
            labelColor: row.label_color,
            needsPasswordChange: Boolean(row.needs_password_change),
          }));

          setEmployees(loadedEmps);
          try {
            localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(loadedEmps));
          } catch {}
        }

        // Load Projects & Global Settings
        const { data: projData, error: projErr } = await supabase.from('projects').select('*');
        if (projErr) {
          console.warn('[Supabase] Erro ao carregar projetos/clientes:', projErr.message);
        } else if (projData && projData.length > 0) {
          console.log('[Supabase] Clientes carregados:', projData.length);
          // Sync global login wallpaper from system settings if present
          const sysSettings = projData.find((p: any) => p.id === 'system-settings');
          if (sysSettings) {
            const globalArt = sysSettings.logo_url || sysSettings.description;
            if (globalArt) {
              setLoginArtUrl(globalArt);
              saveLoginArtToIndexedDB(globalArt);
              try {
                localStorage.setItem(STORAGE_KEYS.LOGIN_ART_URL, globalArt);
              } catch {
                // Handled via IndexedDB
              }
            }
          }

          // Remove any stray system records from projects table in Supabase
          supabase.from('projects').delete().in('id', ['google-drive-token', 'google_drive_token']).then();

          const isSystemConfig = (row: any) =>
            row.id === 'system-settings' ||
            row.id === 'google-drive-token' ||
            row.id.startsWith('system-') ||
            row.id.startsWith('google-') ||
            row.category?.toLowerCase() === 'system' ||
            row.status === 'system';

          const loadedProjs: Project[] = projData
            .filter((row: any) => !isSystemConfig(row))
            .map((row: any) => {
              const { cleanDescription, brandMeta } = decodeProjectDescription(row.description);
              const colorPalette =
                Array.isArray(row.color_palette) && row.color_palette.length > 0
                  ? row.color_palette
                  : brandMeta.colorPalette || [];
              const brandManualUrl = row.brand_manual_url || brandMeta.brandManualUrl || '';
              const logosPackUrl = row.logos_pack_url || brandMeta.logosPackUrl || '';
              const typographyUrl = row.typography_url || brandMeta.typographyUrl || '';
              const additionalMaterialsUrl = row.additional_materials_url || brandMeta.additionalMaterialsUrl || '';

              return {
                id: row.id,
                name: row.name,
                category: row.category || 'Geral',
                description: cleanDescription,
                status: row.status || 'active',
                progress: Number(row.progress) || 0,
                currentSprint: row.current_sprint || 'Sprint Atual',
                iconType: row.icon_type || 'rocket',
                iconColor: row.icon_color || 'bg-blue-600',
                teamMemberIds: Array.isArray(row.team_member_ids) ? row.team_member_ids : [],
                labelId: row.label_id,
                labelColor: row.label_color,
                logoUrl: row.logo_url,
                colorPalette,
                brandManualUrl,
                logosPackUrl,
                typographyUrl,
                additionalMaterialsUrl,
              };
            });

          setProjects(loadedProjs);
          try {
            localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(loadedProjs));
          } catch {}
        }
      } catch (e) {
        console.warn('Initial Supabase load error:', e);
      } finally {
        setIsInitialLoading(false);
      }
    };

    loadInitialSupabaseData();

    // 2. Realtime WebSocket Channels
    const tasksChannel = supabase
      .channel('public:tasks')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const row: any = payload.new;
            const newTask: Task = {
              id: row.id,
              title: row.title,
              description: row.description || '',
              category: row.category || 'Geral',
              status: row.status as TaskStatus,
              dueDate: row.due_date,
              points: Number(row.points) || 0,
              isFlagged: Boolean(row.is_flagged),
              projectId: row.project_id,
              projectName: row.project_name || 'General',
              sprintId: row.sprint_id || 'sprint-1',
              assigneeId: row.assignee_id,
              assigneeName: row.assignee_name,
              assigneeInitials: row.assignee_initials,
              members: row.members || [],
              labels: row.labels || [],
              attachments: row.attachments || [],
              referenceImages: (row.reference_images || []).map((r: any) => ({
                ...r,
                url:
                  (!r.url || r.url.startsWith('data:')) && r.driveFileId
                    ? `https://drive.google.com/thumbnail?id=${r.driveFileId}&sz=w1000`
                    : r.url,
              })),
              comments: row.comments || [],
              coverImageUrl: row.cover_image_url,
              coverAttachmentId: row.cover_attachment_id,
              deliveredAt: row.delivered_at,
              lastMovedAt: Number(row.last_moved_at) || Date.now(),
              createdAt: row.created_at ? row.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
            };
            setTasks((prev) => (prev.some((t) => t.id === newTask.id) ? prev : [newTask, ...prev]));
          } else if (payload.eventType === 'UPDATE') {
            const row: any = payload.new;
            setTasks((prev) =>
              prev.map((t) => {
                if (t.id === row.id) {
                  return {
                    ...t,
                    title: row.title ?? t.title,
                    description: row.description ?? t.description,
                    category: row.category ?? t.category,
                    status: row.status ? (row.status as TaskStatus) : t.status,
                    dueDate: row.due_date ?? t.dueDate,
                    deliveredAt: row.delivered_at || t.deliveredAt,
                    points: row.points !== undefined ? Number(row.points) : t.points,
                    isFlagged: row.is_flagged !== undefined ? Boolean(row.is_flagged) : t.isFlagged,
                    members: row.members || t.members,
                    labels: row.labels || t.labels,
                    attachments: row.attachments || t.attachments,
                    referenceImages: row.reference_images
                      ? (row.reference_images || []).map((r: any) => ({
                          ...r,
                          url:
                            (!r.url || r.url.startsWith('data:')) && r.driveFileId
                              ? `https://drive.google.com/thumbnail?id=${r.driveFileId}&sz=w1000`
                              : r.url,
                        }))
                      : t.referenceImages,
                    comments: row.comments || t.comments,
                    coverImageUrl: row.cover_image_url || t.coverImageUrl,
                    coverAttachmentId: row.cover_attachment_id || t.coverAttachmentId,
                    lastMovedAt: Number(row.last_moved_at) || t.lastMovedAt,
                  };
                }
                return t;
              })
            );
          } else if (payload.eventType === 'DELETE') {
            const oldId = payload.old?.id;
            if (oldId) {
              setTasks((prev) => prev.filter((t) => t.id !== oldId));
            }
          }
        }
      )
      .subscribe();

    const employeesChannel = supabase
      .channel('public:employees')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'employees' },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const row: any = payload.new;
            const updatedEmp: Employee = {
              id: row.id,
              name: row.name,
              role: row.role || 'Colaborador',
              department: row.department || 'Design',
              initials: row.initials || 'CB',
              status: row.status || 'online',
              tags: Array.isArray(row.tags) ? row.tags : [],
              currentWorkload: Number(row.current_workload) || 50,
              assignedTaskCount: 0,
              collaboratorIds: [],
              email: row.email || '',
              password: row.password || '',
              username: row.username || '',
              location: row.location || 'Brasil',
              labelId: row.label_id,
              labelColor: row.label_color,
              needsPasswordChange: Boolean(row.needs_password_change),
            };
            setEmployees((prev) => {
              const exists = prev.some((e) => e.id === updatedEmp.id);
              if (exists) {
                return prev.map((e) => (e.id === updatedEmp.id ? updatedEmp : e));
              }
              return [updatedEmp, ...prev];
            });
          } else if (payload.eventType === 'DELETE') {
            const oldId = payload.old?.id;
            if (oldId) {
              setEmployees((prev) => prev.filter((e) => e.id !== oldId));
            }
          }
        }
      )
      .subscribe();

    const projectsChannel = supabase
      .channel('public:projects')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'projects' },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const row: any = payload.new;
            if (row.id === 'system-settings') {
              const globalArt = row.logo_url || row.description || '';
              setLoginArtUrl(globalArt);
              if (globalArt) {
                saveLoginArtToIndexedDB(globalArt);
                try {
                  localStorage.setItem(STORAGE_KEYS.LOGIN_ART_URL, globalArt);
                } catch {
                  // Handled via IndexedDB
                }
              } else {
                deleteLoginArtFromIndexedDB();
                localStorage.removeItem(STORAGE_KEYS.LOGIN_ART_URL);
              }
              return;
            }

            if (
              row.id === 'google-drive-token' ||
              row.id.startsWith('system-') ||
              row.id.startsWith('google-') ||
              row.category?.toLowerCase() === 'system' ||
              row.status === 'system'
            ) {
              return;
            }

            const { cleanDescription, brandMeta } = decodeProjectDescription(row.description);
            const colorPalette =
              Array.isArray(row.color_palette) && row.color_palette.length > 0
                ? row.color_palette
                : brandMeta.colorPalette || [];
            const brandManualUrl = row.brand_manual_url || brandMeta.brandManualUrl || '';
            const logosPackUrl = row.logos_pack_url || brandMeta.logosPackUrl || '';
            const typographyUrl = row.typography_url || brandMeta.typographyUrl || '';
            const additionalMaterialsUrl = row.additional_materials_url || brandMeta.additionalMaterialsUrl || '';

            const updatedProj: Project = {
              id: row.id,
              name: row.name,
              category: row.category || 'Geral',
              description: cleanDescription,
              status: row.status || 'active',
              progress: Number(row.progress) || 0,
              currentSprint: row.current_sprint || 'Sprint Atual',
              iconType: row.icon_type || 'rocket',
              iconColor: row.icon_color || 'bg-blue-600',
              teamMemberIds: Array.isArray(row.team_member_ids) ? row.team_member_ids : [],
              labelId: row.label_id,
              labelColor: row.label_color,
              logoUrl: row.logo_url,
              colorPalette,
              brandManualUrl,
              logosPackUrl,
              typographyUrl,
              additionalMaterialsUrl,
            };

            setProjects((prev) => {
              const exists = prev.some((p) => p.id === updatedProj.id);
              const next = exists
                ? prev.map((p) => (p.id === updatedProj.id ? updatedProj : p))
                : [updatedProj, ...prev];
              try {
                localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(next));
              } catch {}
              return next;
            });
          } else if (payload.eventType === 'DELETE') {
            const oldId = payload.old?.id;
            if (oldId === 'system-settings') {
              setLoginArtUrl('');
              deleteLoginArtFromIndexedDB();
              localStorage.removeItem(STORAGE_KEYS.LOGIN_ART_URL);
              return;
            }
            if (oldId) {
              setProjects((prev) => prev.filter((p) => p.id !== oldId));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(tasksChannel);
      supabase.removeChannel(employeesChannel);
      supabase.removeChannel(projectsChannel);
    };
  }, []);

  // Background auto-polling interval for Trello card synchronization (DISABLED)
  useEffect(() => {
    return;
  }, []);

  // Helper: check if a user is Admin or Gestor
  const checkIsManagerOrAdmin = (user: typeof currentUser): boolean => {
    if (!user) return false;
    if (
      user.roleType === 'admin' ||
      user.id === 'usr-admin' ||
      (user.role && (user.role.toLowerCase() === 'admin' || user.role.toLowerCase() === 'administrador'))
    ) {
      return true;
    }
    const r = (user.role || '').toLowerCase().trim();
    const dept = (user.department || '').toLowerCase().trim();
    return (
      r.includes('gestor') ||
      r.includes('gerente') ||
      r.includes('manager') ||
      r.includes('gestão') ||
      r.includes('gestao') ||
      dept.includes('gest') ||
      dept.includes('geren')
    );
  };

  // Task Visibility: Open access for all users (Designers, Videomakers, Gestores and Admins see all tasks)
  const visibleTasks = React.useMemo(() => {
    return tasks;
  }, [tasks]);

  // Real Metrics computation dynamically from visible tasks
  const completedTasksCount = visibleTasks.filter((t) => isTaskCompleted(t)).length;
  const overdueTasksCount = visibleTasks.filter((t) => isTaskOverdue(t)).length;
  const totalTasksCount = visibleTasks.length;
  const completionPercentage = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;
  const uniqueProjectsCount = new Set(visibleTasks.map((t) => t.projectId).filter(Boolean)).size || projects.length;
  const velocityPoints = visibleTasks.reduce((sum, t) => sum + (t.points || 1), 0);
  const flaggedOrOverdueCount = visibleTasks.filter((t) => t.isFlagged || isTaskOverdue(t) || t.status === 'blocked').length;

  const computedMetrics = {
    totalTasks: totalTasksCount,
    completedTasks: completedTasksCount,
    overdueTasks: overdueTasksCount,
    completionPercentage,
    velocity: velocityPoints,
    activeProjectsCount: uniqueProjectsCount,
    escalatedCount: flaggedOrOverdueCount,
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        isSidebarCollapsed,
        setIsSidebarCollapsed,
        isMobileSidebarOpen,
        setIsMobileSidebarOpen,
        activeFilter,
        setActiveFilter,
        globalSearchQuery,
        setGlobalSearchQuery,
        sprints,
        currentSprint,
        setCurrentSprintId,
        updateCurrentSprintGoal,
        spineStatuses,
        addSpineStatus,
        updateSpineStatus,
        deleteSpineStatus,
        reorderSpineStatuses,
        resetSpineStatusesToDefault,
        tasks: visibleTasks,
        addTask,
        updateTask,
        deleteTask,
        moveTaskStatus,
        moveAllBacklogToDoneLocally,
        toggleFlagTask,
        clearAllTasks,
        clearTrelloTasks,
        resetSystemKeepCredentials,
        projects,
        addProject,
        updateProject,
        deleteProject,
        employees,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        activities,
        addActivity,
        trelloSettings,
        updateTrelloSettings,
        testTrelloConnection,
        syncTrelloNow,
        isSyncing,
        trelloLabels,
        fetchTrelloCardComments,
        addTrelloComment,
        deleteTrelloComment,
        fetchTrelloCardAttachments,
        addTrelloAttachment,
        deleteTrelloAttachment,
        createTrelloLabel,
        updateTrelloLabel,
        deleteTrelloLabel,
        isNewTaskModalOpen,
        setIsNewTaskModalOpen,
        editingTask,
        setEditingTask,
        isNewProjectModalOpen,
        setIsNewProjectModalOpen,
        editingProject,
        setEditingProject,
        isNewEmployeeModalOpen,
        setIsNewEmployeeModalOpen,
        editingEmployee,
        setEditingEmployee,
        selectedEmployeeForDetail,
        setSelectedEmployeeForDetail,
        selectedProjectForDetail,
        setSelectedProjectForDetail,
        isSearchModalOpen,
        setIsSearchModalOpen,
        toasts,
        addToast,
        removeToast,
        currentUser,
        setCurrentUser,
        logout,
        isManagerOrAdmin: (u?: any) => checkIsManagerOrAdmin(u !== undefined ? u : currentUser),
        computedMetrics,
        loginArtUrl,
        updateLoginArtUrl,
        isInitialLoading,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
