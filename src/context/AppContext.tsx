import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  saveLoginArtToIndexedDB,
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
  BrandColor,
} from '../types';
import {
  INITIAL_SPRINT,
  INITIAL_SPRINT_LIST,
  INITIAL_TRELLO_SETTINGS,
  DEFAULT_SPINE_STATUSES,
} from '../data/mockData';

// Sub-contexts and exports
import { AuthProvider, useAuth, CurrentUserType } from './AuthContext';
import { EmployeesProvider, useEmployees } from './EmployeesContext';
import { ProjectsProvider, useProjects, BrandMeta, encodeProjectDescription, decodeProjectDescription } from './ProjectsContext';
import { TasksProvider, useTasks } from './TasksContext';

export type { BrandMeta, CurrentUserType };
export { encodeProjectDescription, decodeProjectDescription };
export { useAuth } from './AuthContext';
export { useEmployees } from './EmployeesContext';
export { useProjects } from './ProjectsContext';
export { useTasks } from './TasksContext';

export interface AppContextType {
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
  addEmployee: (employee: Omit<Employee, 'id'>) => Promise<Employee | null> | void;
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
  currentUser: CurrentUserType | null;
  pendingPasswordChangeUser: any | null;
  setPendingPasswordChangeUser: (user: any | null) => void;
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

const STORAGE_KEYS = {
  SPRINTS: 'spine_sprints_v1',
  CURRENT_SPRINT_ID: 'spine_current_sprint_id_v1',
  TRELLO: 'spine_trello_settings_v1',
  ACTIVITIES: 'spine_activities_v1',
  DELETED_TRELLO_TASKS: 'spine_deleted_trello_task_ids_v1',
  SPINE_STATUSES: 'spine_custom_statuses_v1',
  LOGIN_ART_URL: 'spine_login_art_url_v1',
};

// Internal UI & Facade Provider which sits inside Auth, Employees, Projects, and Tasks Providers
const AppFacadeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useAuth();
  const employeesContext = useEmployees();
  const projectsContext = useProjects();
  const tasksContext = useTasks();

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
          return parsed.filter(
            (s: any) => s.id !== 'in_review' && !s.label?.toLowerCase().includes('revis')
          );
        }
      } catch {}
    }
    return DEFAULT_SPINE_STATUSES.filter(
      (s) => s.id !== 'in_review' && !s.label?.toLowerCase().includes('revis')
    );
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SPINE_STATUSES, JSON.stringify(spineStatuses));
    } catch (e) {
      console.warn('Failed to save spineStatuses to localStorage:', e);
    }
  }, [spineStatuses]);

  // Sprints
  const [sprints, setSprints] = useState<Sprint[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SPRINTS);
    return saved ? JSON.parse(saved) : INITIAL_SPRINT_LIST;
  });
  const [currentSprintId, setCurrentSprintIdState] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_SPRINT_ID) || INITIAL_SPRINT.id;
  });

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

  // Activities
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

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(activities.slice(0, 30)));
    } catch (e) {
      console.warn('Failed to save activities to localStorage:', e);
    }
  }, [activities]);

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

  // Toasts
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const addToast = (title: string, message?: string, type: ToastNotification['type'] = 'success') => {
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

  // Modals & Selection state
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isNewEmployeeModalOpen, setIsNewEmployeeModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [selectedEmployeeForDetail, setSelectedEmployeeForDetail] = useState<Employee | null>(null);
  const [selectedProjectForDetail, setSelectedProjectForDetail] = useState<Project | null>(null);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  // Deep-linking to open shared task from URL (?task=xxx or #task=xxx)
  useEffect(() => {
    if (!tasksContext.tasks || tasksContext.tasks.length === 0) return;
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const hash = window.location.hash;
      const urlTaskId = urlParams.get('task') || (hash.startsWith('#task=') ? hash.replace('#task=', '') : null);
      if (urlTaskId) {
        const found = tasksContext.tasks.find((t) => t.id === urlTaskId || t.id.toLowerCase() === urlTaskId.toLowerCase());
        if (found) {
          setEditingTask(found);
          setIsNewTaskModalOpen(true);
        }
      }
    } catch (e) {
      console.warn('Error handling deep link:', e);
    }
  }, [tasksContext.tasks]);

  // Sprints handling
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

  // Spine status methods
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

    tasksContext.setTasks((prev) =>
      prev.map((t) => (t.status === id ? { ...t, status: fallbackStatusId } : t))
    );

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

  // Trello settings & state
  const [trelloSettings, setTrelloSettings] = useState<TrelloSettings>(() => {
    return INITIAL_TRELLO_SETTINGS;
  });
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [trelloLabels, setTrelloLabels] = useState<TrelloLabel[]>([]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TRELLO, JSON.stringify(trelloSettings));
    } catch (e) {
      console.warn('Failed to save trelloSettings to localStorage:', e);
    }
  }, [trelloSettings]);

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
        tasksContext.setTasks((prev) =>
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

    tasksContext.setTasks((prev) =>
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

        tasksContext.setTasks((prev) =>
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
          tasksContext.setTasks((prev) =>
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
          tasksContext.setTasks((prev) =>
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

    tasksContext.setTasks((prev) =>
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
      let boardId = '';
      const targetBoard = trelloSettings.targetBoard;
      if (targetBoard) {
        if (targetBoard.length >= 20 && !targetBoard.includes(' ')) {
          boardId = targetBoard;
        } else {
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
    return;
  };

  // Estado de Carregamento Inicial (True apenas se ainda não houver dados no cache)
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(() => {
    try {
      const savedTasks = localStorage.getItem('spine_tasks_v1');
      if (savedTasks) {
        const parsed = JSON.parse(savedTasks);
        if (Array.isArray(parsed) && parsed.length > 0) return false;
      }
    } catch {}
    return true;
  });

  // Supabase Initial Fetch and Realtime Subscription
  useEffect(() => {
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

          tasksContext.setTasks(loadedFromSb);
          try {
            localStorage.setItem('spine_tasks_v1', JSON.stringify(loadedFromSb));
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
            username: row.username || '',
            location: row.location || 'Brasil',
            labelId: row.label_id,
            labelColor: row.label_color,
            needsPasswordChange: Boolean(row.needs_password_change),
            auth_user_id: row.auth_user_id,
          }));

          employeesContext.setEmployees(loadedEmps);
          try {
            localStorage.setItem('spine_employees_v1', JSON.stringify(loadedEmps));
          } catch {}
        }

        // Load Projects & Global Settings
        const { data: projData, error: projErr } = await supabase.from('projects').select('*');
        if (projErr) {
          console.warn('[Supabase] Erro ao carregar projetos/clientes:', projErr.message);
        } else if (projData && projData.length > 0) {
          console.log('[Supabase] Clientes carregados:', projData.length);
          const sysSettings = projData.find((p: any) => p.id === 'system-settings');
          if (sysSettings) {
            const globalArt = sysSettings.logo_url || sysSettings.description;
            if (globalArt) {
              auth.updateLoginArtUrl(globalArt);
            }
          }

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

          projectsContext.setProjects(loadedProjs);
          try {
            localStorage.setItem('spine_projects_v1', JSON.stringify(loadedProjs));
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
            tasksContext.setTasks((prev) => (prev.some((t) => t.id === newTask.id) ? prev : [newTask, ...prev]));
          } else if (payload.eventType === 'UPDATE') {
            const row: any = payload.new;
            tasksContext.setTasks((prev) =>
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
              tasksContext.setTasks((prev) => prev.filter((t) => t.id !== oldId));
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
              username: row.username || '',
              location: row.location || 'Brasil',
              labelId: row.label_id,
              labelColor: row.label_color,
              needsPasswordChange: Boolean(row.needs_password_change),
              auth_user_id: row.auth_user_id,
            };
            employeesContext.setEmployees((prev) => {
              const exists = prev.some((e) => e.id === updatedEmp.id);
              if (exists) {
                return prev.map((e) => (e.id === updatedEmp.id ? updatedEmp : e));
              }
              return [updatedEmp, ...prev];
            });
          } else if (payload.eventType === 'DELETE') {
            const oldId = payload.old?.id;
            if (oldId) {
              employeesContext.setEmployees((prev) => prev.filter((e) => e.id !== oldId));
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
              auth.updateLoginArtUrl(globalArt);
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

            projectsContext.setProjects((prev) => {
              const exists = prev.some((p) => p.id === updatedProj.id);
              const next = exists
                ? prev.map((p) => (p.id === updatedProj.id ? updatedProj : p))
                : [updatedProj, ...prev];
              try {
                localStorage.setItem('spine_projects_v1', JSON.stringify(next));
              } catch {}
              return next;
            });
          } else if (payload.eventType === 'DELETE') {
            const oldId = payload.old?.id;
            if (oldId === 'system-settings') {
              auth.updateLoginArtUrl('');
              return;
            }
            if (oldId) {
              projectsContext.setProjects((prev) => prev.filter((p) => p.id !== oldId));
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
        tasks: tasksContext.tasks,
        addTask: tasksContext.addTask,
        updateTask: tasksContext.updateTask,
        deleteTask: tasksContext.deleteTask,
        moveTaskStatus: tasksContext.moveTaskStatus,
        moveAllBacklogToDoneLocally: tasksContext.moveAllBacklogToDoneLocally,
        toggleFlagTask: tasksContext.toggleFlagTask,
        clearAllTasks: tasksContext.clearAllTasks,
        clearTrelloTasks: tasksContext.clearTrelloTasks,
        resetSystemKeepCredentials: tasksContext.resetSystemKeepCredentials,
        projects: projectsContext.projects,
        addProject: projectsContext.addProject,
        updateProject: projectsContext.updateProject,
        deleteProject: projectsContext.deleteProject,
        employees: employeesContext.employees,
        addEmployee: employeesContext.addEmployee,
        updateEmployee: employeesContext.updateEmployee,
        deleteEmployee: employeesContext.deleteEmployee,
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
        currentUser: auth.currentUser,
        setCurrentUser: auth.setCurrentUser,
        pendingPasswordChangeUser: auth.pendingPasswordChangeUser,
        setPendingPasswordChangeUser: auth.setPendingPasswordChangeUser,
        logout: auth.logout,
        isManagerOrAdmin: auth.isManagerOrAdmin,
        computedMetrics: tasksContext.computedMetrics,
        loginArtUrl: auth.loginArtUrl,
        updateLoginArtUrl: auth.updateLoginArtUrl,
        isInitialLoading,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

// Root AppProvider composing Auth, Employees, Projects, and Tasks Providers
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [deletedTrelloTaskIds, setDeletedTrelloTaskIds] = useState<string[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.DELETED_TRELLO_TASKS);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DELETED_TRELLO_TASKS, JSON.stringify(deletedTrelloTaskIds));
  }, [deletedTrelloTaskIds]);

  return (
    <AuthProvider>
      <SubProvidersContainer deletedTrelloTaskIds={deletedTrelloTaskIds} setDeletedTrelloTaskIds={setDeletedTrelloTaskIds}>
        {children}
      </SubProvidersContainer>
    </AuthProvider>
  );
};

const SubProvidersContainer: React.FC<{
  children: React.ReactNode;
  deletedTrelloTaskIds: string[];
  setDeletedTrelloTaskIds: React.Dispatch<React.SetStateAction<string[]>>;
}> = ({ children, deletedTrelloTaskIds, setDeletedTrelloTaskIds }) => {
  const auth = useAuth();

  // Helper toast proxy for inner sub-contexts
  const addToastProxy = (_title: string, _message?: string, _type: any = 'success') => {};
  const addActivityProxy = () => {};

  return (
    <EmployeesProvider addToast={addToastProxy} addActivity={addActivityProxy}>
      <ProjectsProvider addToast={addToastProxy} addActivity={addActivityProxy}>
        <TasksProviderProxy deletedTrelloTaskIds={deletedTrelloTaskIds} setDeletedTrelloTaskIds={setDeletedTrelloTaskIds} currentUser={auth.currentUser}>
          <AppFacadeProvider>{children}</AppFacadeProvider>
        </TasksProviderProxy>
      </ProjectsProvider>
    </EmployeesProvider>
  );
};

const TasksProviderProxy: React.FC<{
  children: React.ReactNode;
  deletedTrelloTaskIds: string[];
  setDeletedTrelloTaskIds: React.Dispatch<React.SetStateAction<string[]>>;
  currentUser: any;
}> = ({ children, deletedTrelloTaskIds, setDeletedTrelloTaskIds, currentUser }) => {
  const employees = useEmployees();
  const projects = useProjects();

  const resetAllStores = () => {
    employees.setEmployees([]);
    projects.setProjects([]);
    localStorage.setItem('spine_projects_v1', JSON.stringify([]));
    localStorage.setItem('spine_employees_v1', JSON.stringify([]));
    localStorage.setItem('spine_activities_v1', JSON.stringify([]));
    localStorage.setItem('spine_deleted_trello_task_ids_v1', JSON.stringify([]));
  };

  return (
    <TasksProvider
      spineStatuses={DEFAULT_SPINE_STATUSES}
      employees={employees.employees}
      setEmployees={employees.setEmployees}
      projectsCount={projects.projects.length}
      currentUser={currentUser}
      addToast={() => {}}
      addActivity={() => {}}
      deletedTrelloTaskIds={deletedTrelloTaskIds}
      setDeletedTrelloTaskIds={setDeletedTrelloTaskIds}
      resetAllStores={resetAllStores}
    >
      {children}
    </TasksProvider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
