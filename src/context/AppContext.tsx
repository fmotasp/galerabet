import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { realtimeHub } from '../lib/realtimeHub';
import {
  NavigationTab,
  Task,
  Project,
  Employee,
  Sprint,
  ActivityItem,
  ToastNotification,
  TaskStatus,
  SpineStatusConfig,
  TaskComment,
  TaskLabel,
  TaskAttachment,
  BrandColor,
} from '../types';
import {
  INITIAL_SPRINT,
  INITIAL_SPRINT_LIST,
  DEFAULT_SPINE_STATUSES,
} from '../data/mockData';

// Sub-contexts and exports
import { AuthProvider, useAuth, CurrentUserType } from './AuthContext';
import { EmployeesProvider, useEmployees } from './EmployeesContext';
import { ProjectsProvider, useProjects, BrandMeta, encodeProjectDescription, decodeProjectDescription } from './ProjectsContext';
import { decodeTaskDescriptionWithChecklist } from '../lib/taskUtils';
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
  isAuthChecking: boolean;
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
  isManagerOrAdmin: (user?: CurrentUserType | null) => boolean;

  // Metrics
  computedMetrics: {
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
    completionPercentage: number;
    velocity: number;
    activeProjectsCount: number;
    escalatedCount: number;
  };

  loginArtUrl: string;
  updateLoginArtUrl: (url: string) => void;
  isInitialLoading: boolean;
  fetchTasksFromSupabase: () => Promise<void>;
}

const STORAGE_KEYS = {
  SPRINTS: 'spine_sprints_v1',
  ACTIVITIES: 'spine_activities_v1',
};

const AppContext = createContext<AppContextType | null>(null);

const AppFacadeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useAuth();
  const tasksContext = useTasks();
  const employeesContext = useEmployees();
  const projectsContext = useProjects();

  const VALID_TABS: NavigationTab[] = [
    'dashboard',
    'tasks',
    'projects',
    'employees',
    'registrations',
    'reports',
    'materials',
    'settings',
  ];

  const getInitialTab = (): NavigationTab => {
    try {
      const hash = window.location.hash.replace('#', '') as NavigationTab;
      if (VALID_TABS.includes(hash)) return hash;

      const saved = sessionStorage.getItem('spine_active_tab') as NavigationTab;
      if (saved && VALID_TABS.includes(saved)) return saved;
    } catch (err) {}
    return 'dashboard';
  };

  const [activeTab, setActiveTabState] = useState<NavigationTab>(getInitialTab);

  const setActiveTab = useCallback((tab: NavigationTab) => {
    setActiveTabState(tab);
    try {
      sessionStorage.setItem('spine_active_tab', tab);
      if (window.location.hash !== `#${tab}`) {
        window.history.replaceState(null, '', `#${tab}`);
      }
    } catch (err) {}
  }, []);

  // Sincroniza se o usuário usar os botões de voltar/avançar do navegador
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') as NavigationTab;
      if (VALID_TABS.includes(hash) && hash !== activeTab) {
        setActiveTabState(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [activeTab]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const [activeFilter, setActiveFilter] = useState<'all' | 'mine' | 'flagged'>('all');
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');

  const [sprints, setSprints] = useState<Sprint[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SPRINTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (err) {}
    return INITIAL_SPRINT_LIST;
  });
  const [currentSprintId, setCurrentSprintId] = useState<string>(INITIAL_SPRINT.id);

  const currentSprint =
    sprints.find((s) => s.id === currentSprintId) || sprints[0] || INITIAL_SPRINT;

  const updateCurrentSprintGoal = (goal: string) => {
    setSprints((prev) =>
      prev.map((s) => (s.id === currentSprint.id ? { ...s, goal } : s))
    );
  };

  const [spineStatuses, setSpineStatuses] = useState<SpineStatusConfig[]>(DEFAULT_SPINE_STATUSES);

  // Helper para persistir alterações de status diretamente no Supabase em tempo real
  const persistStatusesToSupabase = async (nextStatuses: SpineStatusConfig[]) => {
    try {
      await supabase.from('projects').upsert({
        id: 'system-settings',
        name: 'Configurações Globais do Sistema',
        category: 'System',
        color_palette: nextStatuses,
        status: 'system',
      });
    } catch (err) {
      console.error('[Supabase] Erro ao sincronizar status globais:', err);
    }
  };

  // Carrega status globais diretamente do Supabase e assina canal Realtime
  useEffect(() => {
    let isMounted = true;

    const fetchGlobalStatuses = async () => {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('color_palette')
          .eq('id', 'system-settings')
          .maybeSingle();

        if (!error && data && Array.isArray(data.color_palette) && data.color_palette.length > 0) {
          if (isMounted) {
            setSpineStatuses(data.color_palette as SpineStatusConfig[]);
          }
        }
      } catch (err) {
        console.warn('[Supabase] Aviso ao carregar status globais:', err);
      }
    };

    fetchGlobalStatuses();

    // Inscrição Realtime unificada: atualiza status de todos em tempo real
    const unsubscribe = realtimeHub.subscribe(
      'projects',
      (payload: any) => {
        if (payload.new && Array.isArray(payload.new.color_palette) && payload.new.color_palette.length > 0) {
          if (isMounted) {
            setSpineStatuses(payload.new.color_palette as SpineStatusConfig[]);
          }
        }
      },
      'id=eq.system-settings'
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const addSpineStatus = (statusData: Omit<SpineStatusConfig, 'id'>) => {
    const newId = `status-${Date.now()}`;
    const newStatus: SpineStatusConfig = {
      ...statusData,
      id: newId,
      isDefault: false,
    };
    const next = [...spineStatuses, newStatus];
    setSpineStatuses(next);
    persistStatusesToSupabase(next);
    addToast('Status Criado! 🏷️', `O status "${newStatus.label}" foi adicionado com sucesso.`, 'success');
  };

  const updateSpineStatus = (id: string, updates: Partial<SpineStatusConfig>) => {
    const next = spineStatuses.map((s) => (s.id === id ? { ...s, ...updates } : s));
    setSpineStatuses(next);
    persistStatusesToSupabase(next);
    addToast('Status Atualizado ✏️', 'As alterações de status foram salvas.', 'success');
  };

  const deleteSpineStatus = (id: string, fallbackStatusId: string = 'backlog') => {
    const statusToDelete = spineStatuses.find((s) => s.id === id);
    if (!statusToDelete) return;

    tasksContext.setTasks((prev) =>
      prev.map((t) => (t.status === id ? { ...t, status: fallbackStatusId } : t))
    );

    const next = spineStatuses.filter((s) => s.id !== id);
    setSpineStatuses(next);
    persistStatusesToSupabase(next);
    addToast(
      'Status Removido 🗑️',
      `O status "${statusToDelete.label}" foi removido e as tarefas foram migradas.`,
      'info'
    );
  };

  const reorderSpineStatuses = (newStatuses: SpineStatusConfig[]) => {
    setSpineStatuses(newStatuses);
    persistStatusesToSupabase(newStatuses);
  };

  const resetSpineStatusesToDefault = () => {
    setSpineStatuses(DEFAULT_SPINE_STATUSES);
    persistStatusesToSupabase(DEFAULT_SPINE_STATUSES);
    addToast('Status Restaurados 🔄', 'Os status voltaram para o padrão do sistema.', 'info');
  };

  const [activities, setActivities] = useState<ActivityItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACTIVITIES);
      if (saved) return JSON.parse(saved);
    } catch (err) {}
    return [];
  });

  const addActivity = (
    userName: string,
    userInitials: string,
    message: string,
    dotColor: ActivityItem['dotColor'] = 'blue'
  ) => {
    const newActivity: ActivityItem = {
      id: `act-${Date.now()}`,
      userName,
      userInitials,
      message,
      timeAgo: 'Just now',
      dotColor,
    };
    setActivities((prev) => [newActivity, ...prev.slice(0, 19)]);
  };

  // Modais
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
  const addToast = (title: string, message?: string, type: ToastNotification['type'] = 'info') => {
    const newToast: ToastNotification = {
      id: `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title,
      message,
      type,
    };
    setToasts((prev) => [...prev, newToast]);
  };

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(() => {
    try {
      const savedTasks = localStorage.getItem('spine_tasks_v1');
      if (savedTasks) {
        const parsed = JSON.parse(savedTasks);
        if (Array.isArray(parsed) && parsed.length > 0) return false;
      }
    } catch (err) {}
    return true;
  });

  useEffect(() => {
    let isMounted = true;

    // Garante que o TasksContext carregue direto do Supabase quando o usuário estiver pronto
    if (auth.currentUser?.id) {
      // Sincronização garantida
      setIsInitialLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [auth.currentUser?.id]);

  const mapDbRowToTask = (row: any): Task => {
    const rawDesc = row.description || '';
    const { cleanDescription, checklists: decodedChecklists } = decodeTaskDescriptionWithChecklist(rawDesc);
    const resolvedChecklists = (row.checklists && row.checklists.length > 0) ? row.checklists : decodedChecklists;

    return {
      id: row.id,
      title: row.title,
      description: cleanDescription,
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
      checklists: resolvedChecklists,
      checklistsCount: Array.isArray(resolvedChecklists) ? resolvedChecklists.length : (row.checklists_count || 0),
      referenceImages: row.reference_images || [],
      comments: row.comments || [],
      coverImageUrl: row.cover_image_url,
      coverAttachmentId: row.cover_attachment_id,
      lastMovedAt: Number(row.last_moved_at) || Date.now(),
      activityLog: (row.activity_log || row.activityLog || []).filter((act: any) => {
        const userName = (act.user || '').trim().toLowerCase();
        const userIn = (act.userInitials || '').trim().toUpperCase();
        return userName !== 'sistema' && userIn !== 'SYS' && userName !== 'equipe' && userIn !== 'EQ';
      }),
      createdAt: row.created_at ? row.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
    };
  };

  const openedSharedTaskIdRef = useRef<string | null>(null);

  // Deep Link: Abre automaticamente os detalhes da tarefa compartilhada (?task=id)
  useEffect(() => {
    const getSharedId = (): string | null => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const fromSearch = urlParams.get('task');
        if (fromSearch) return fromSearch;

        if (window.location.hash.includes('task=')) {
          const hashParts = window.location.hash.split('?');
          if (hashParts[1]) {
            const fromHash = new URLSearchParams(hashParts[1]).get('task');
            if (fromHash) return fromHash;
          }
        }

        const fromStorage = sessionStorage.getItem('pending_shared_task_id');
        if (fromStorage) return fromStorage;
      } catch (err) {}
      return null;
    };

    const sharedTaskId = getSharedId();
    if (!sharedTaskId) return;

    // Se o usuário ainda não estiver logado, armazena no sessionStorage para abrir pós-login
    if (!auth.currentUser) {
      sessionStorage.setItem('pending_shared_task_id', sharedTaskId);
      return;
    }

    // Se já abriu essa tarefa nesta sessão, não abre em loop
    if (openedSharedTaskIdRef.current === sharedTaskId) return;

    // 1. Procura na lista já carregada de tarefas
    const localTask = tasksContext.tasks.find((t) => t.id === sharedTaskId);
    if (localTask) {
      openedSharedTaskIdRef.current = sharedTaskId;
      sessionStorage.removeItem('pending_shared_task_id');
      setActiveTab('tasks');
      setEditingTask(localTask);
      addToast('Tarefa Compartilhada 🔗', `Abrindo detalhes de "${localTask.title}"`, 'info');
      return;
    }

    // 2. Se não estiver no cache local inicial, busca diretamente no Supabase pelo ID
    supabase
      .from('tasks')
      .select('*')
      .eq('id', sharedTaskId)
      .single()
      .then(({ data, error }) => {
        if (!error && data) {
          const mapped = mapDbRowToTask(data);
          openedSharedTaskIdRef.current = sharedTaskId;
          sessionStorage.removeItem('pending_shared_task_id');
          setActiveTab('tasks');
          setEditingTask(mapped);
          addToast('Tarefa Compartilhada 🔗', `Abrindo detalhes de "${mapped.title}"`, 'info');
        }
      })
      .catch((err) => console.warn('Erro ao carregar tarefa compartilhada:', err));
  }, [auth.currentUser, tasksContext.tasks]);

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        isAuthChecking: auth.isAuthChecking,
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
        fetchTasksFromSupabase: tasksContext.fetchTasksFromSupabase,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AuthProvider>
      <SubProvidersContainer>
        {children}
      </SubProvidersContainer>
    </AuthProvider>
  );
};

const SubProvidersContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useAuth();
  const addToastProxy = () => {};
  const addActivityProxy = () => {};

  return (
    <EmployeesProvider addToast={addToastProxy} addActivity={addActivityProxy}>
      <ProjectsProvider addToast={addToastProxy} addActivity={addActivityProxy}>
        <TasksProviderProxy currentUser={auth.currentUser}>
          <AppFacadeProvider>{children}</AppFacadeProvider>
        </TasksProviderProxy>
      </ProjectsProvider>
    </EmployeesProvider>
  );
};

const TasksProviderProxy: React.FC<{
  children: React.ReactNode;
  currentUser: any;
}> = ({ children, currentUser }) => {
  const employees = useEmployees();
  const projects = useProjects();

  const resetAllStores = () => {
    employees.setEmployees([]);
    projects.setProjects([]);
    localStorage.setItem('spine_projects_v1', JSON.stringify([]));
    localStorage.setItem('spine_employees_v1', JSON.stringify([]));
    localStorage.setItem('spine_activities_v1', JSON.stringify([]));
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
