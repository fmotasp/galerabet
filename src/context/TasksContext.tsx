import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { isTaskOverdue, isTaskCompleted, getTaskOverdueDays } from '../lib/taskDateUtils';
import { Task, TaskStatus, SpineStatusConfig, Employee } from '../types';
import { INITIAL_TASKS } from '../data/mockData';

export interface TasksContextType {
  tasks: Task[];
  addTask: (newTaskData: Omit<Task, 'id' | 'createdAt'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  moveTaskStatus: (id: string, newStatus: TaskStatus) => Promise<void>;
  moveAllBacklogToDoneLocally: () => void;
  toggleFlagTask: (id: string) => Promise<void>;
  clearAllTasks: () => void;
  resetSystemKeepCredentials: () => void;
  computedMetrics: {
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
    completionPercentage: number;
    velocity: number;
    activeProjectsCount: number;
    escalatedCount: number;
  };
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}

const STORAGE_KEYS = {
  TASKS: 'spine_tasks_v1',
};

const TasksContext = createContext<TasksContextType | null>(null);

export const TasksProvider: React.FC<{
  children: React.ReactNode;
  spineStatuses: SpineStatusConfig[];
  employees: Employee[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  projectsCount: number;
  currentUser: any;
  addToast: (title: string, message?: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  addActivity: (userName: string, userInitials: string, message: string, dotColor?: any) => void;
  resetAllStores?: () => void;
}> = ({
  children,
  spineStatuses,
  employees,
  setEmployees,
  projectsCount,
  currentUser,
  addToast,
  addActivity,
  resetAllStores,
}) => {
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

  // Helper para mapear linha bruta do Supabase para objeto Task tipado
  const mapRowToTask = (row: any): Task => ({
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
    referenceImages: row.reference_images || [],
    comments: row.comments || [],
    coverImageUrl: row.cover_image_url,
    coverAttachmentId: row.cover_attachment_id,
    lastMovedAt: Number(row.last_moved_at) || Date.now(),
    createdAt: row.created_at ? row.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
  });

  // Inscrição em tempo real (Supabase Realtime WebSockets) para os 15+ usuários simultâneos
  useEffect(() => {
    const channel = supabase
      .channel('realtime:tasks')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'tasks' },
        (payload) => {
          if (!payload.new || !payload.new.id) return;
          const incomingTask = mapRowToTask(payload.new);
          setTasks((prev) => {
            if (prev.some((t) => t.id === incomingTask.id)) {
              return prev.map((t) => (t.id === incomingTask.id ? { ...t, ...incomingTask } : t));
            }
            return [incomingTask, ...prev];
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'tasks' },
        (payload) => {
          if (!payload.new || !payload.new.id) return;
          const updatedTask = mapRowToTask(payload.new);
          setTasks((prev) =>
            prev.map((t) => (t.id === updatedTask.id ? { ...t, ...updatedTask } : t))
          );
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'tasks' },
        (payload) => {
          if (!payload.old || !payload.old.id) return;
          setTasks((prev) => prev.filter((t) => t.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Cache inteligente e seguro no LocalStorage (armazena apenas as 50 mais recentes para evitar QuotaExceededError em 10.000+ tarefas)
  useEffect(() => {
    try {
      const topRecentTasks = tasks.slice(0, 50).map(({ referenceImages, attachments, comments, ...rest }) => ({
        ...rest,
        attachments: (attachments || []).slice(0, 3).map((a) => ({ id: a.id, name: a.name })),
      }));
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(topRecentTasks));
    } catch {
      // Ignora silenciosamente se o navegador desabilitar ou limitar o LocalStorage
    }
  }, [tasks]);

  // Notifications for tasks due in <= 2 days
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

  // Auto-move overdue tasks (2+ days delayed) to 'overdue'
  useEffect(() => {
    if (!tasks || tasks.length === 0) return;

    const overdueCandidateTasks = tasks.filter((t) => {
      if (isTaskCompleted(t)) return false;
      if (t.status === 'overdue') return false;
      const overdueDays = getTaskOverdueDays(t);
      return overdueDays >= 2;
    });

    if (overdueCandidateTasks.length === 0) return;

    const now = Date.now();
    const overdueIds = overdueCandidateTasks.map((t) => t.id);

    setTasks((prev) =>
      prev.map((t) =>
        overdueIds.includes(t.id)
          ? {
              ...t,
              status: 'overdue',
              lastMovedAt: now,
            }
          : t
      )
    );

    (async () => {
      try {
        for (const t of overdueCandidateTasks) {
          await supabase
            .from('tasks')
            .update({
              status: 'overdue',
              last_moved_at: now,
              updated_at: new Date().toISOString(),
            })
            .eq('id', t.id);
        }
      } catch (err) {
        console.warn('Auto-move overdue tasks to Supabase error:', err);
      }
    })();
  }, [tasks]);

  // Task Actions
  const addTask = async (newTaskData: Omit<Task, 'id' | 'createdAt'>) => {
    const newId = `task-${Date.now()}`;
    const newTask: Task = {
      ...newTaskData,
      id: newId,
      createdAt: new Date().toISOString().split('T')[0],
      commentsCount: 0,
      attachmentsCount: 0,
      lastMovedAt: Date.now(),
    };

    setTasks((prev) => [newTask, ...prev]);

    try {
      const payload = {
        id: newTask.id,
        title: newTask.title,
        description: newTask.description || '',
        category: newTask.category || 'Geral',
        status: newTask.status || 'backlog',
        due_date: newTask.dueDate || null,
        points: newTask.points || 0,
        is_flagged: Boolean(newTask.isFlagged),
        project_id: newTask.projectId || null,
        project_name: newTask.projectName || 'General',
        sprint_id: newTask.sprintId || 'sprint-1',
        assignee_id: newTask.assigneeId || null,
        assignee_name: newTask.assigneeName || null,
        assignee_initials: newTask.assigneeInitials || null,
        members: newTask.members || [],
        labels: newTask.labels || [],
        reference_images: newTask.referenceImages || [],
        attachments: newTask.attachments || [],
        comments: newTask.comments || [],
        cover_image_url: newTask.coverImageUrl || null,
        cover_attachment_id: newTask.coverAttachmentId || null,
        last_moved_at: newTask.lastMovedAt,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error: sbErr } = await supabase.from('tasks').insert([payload]);
      if (sbErr) {
        console.error('[Supabase] Falha ao inserir tarefa:', sbErr.message);
      }
    } catch (sbErr) {
      console.warn('Supabase task insert warning:', sbErr);
    }

    if (newTask.assigneeId) {
      setEmployees((prev) =>
        prev.map((emp) =>
          emp.id === newTask.assigneeId
            ? {
                ...emp,
                assignedTaskCount: emp.assignedTaskCount + 1,
                currentWorkload: Math.min(100, emp.currentWorkload + 15),
              }
            : emp
        )
      );
    }

    addActivity(currentUser?.name || 'Theo R.', currentUser?.initials || 'TR', `criou a tarefa "${newTask.title}"`, 'blue');
    addToast('Task Created! 🚀', `"${newTask.title}" added to board.`);
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    const now = Date.now();
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const next = { ...t, ...updates };
          if (updates.status && updates.status !== t.status) {
            next.lastMovedAt = now;
          }
          return next;
        }
        return t;
      })
    );

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
      }
    } catch (sbErr) {
      console.warn('Supabase task update warning:', sbErr);
    }
  };

  const deleteTask = async (id: string) => {
    const taskToDelete = tasks.find((t) => t.id === id);

    import('../lib/googleDrive').then(({ deleteDriveFolder }) => {
      deleteDriveFolder(taskToDelete?.driveFolderId, taskToDelete?.title).then((success) => {
        if (success) {
          console.log(`Pasta do Google Drive referente a "${taskToDelete?.title}" excluída com sucesso.`);
        }
      });
    });

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

    let nextAssigneeId = targetTask.assigneeId;
    let nextAssigneeName = targetTask.assigneeName;
    let nextAssigneeInitials = targetTask.assigneeInitials;
    let nextMembers = targetTask.members ? [...targetTask.members] : [];

    const isReview = newStatus === 'in_review' || statusLabel.toLowerCase().includes('revis') || statusLabel.toLowerCase().includes('aprov');
    if (isReview) {
      const fabio = employees.find((e) => e.name.toLowerCase().includes('fabio mozart'));
      if (fabio) {
        nextAssigneeId = fabio.id;
        nextAssigneeName = fabio.name;
        nextAssigneeInitials = fabio.initials;
        if (!nextMembers.some((m) => m.id === fabio.id)) {
          nextMembers.push({
            id: fabio.id,
            name: fabio.name,
            initials: fabio.initials,
            avatarUrl: fabio.avatarUrl,
          });
        }
      }
    }

    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          return {
            ...t,
            status: newStatus,
            assigneeId: nextAssigneeId,
            assigneeName: nextAssigneeName,
            assigneeInitials: nextAssigneeInitials,
            members: nextMembers,
            lastMovedAt: now,
            deliveredAt: nextDeliveredAt,
          };
        }
        return t;
      })
    );

    try {
      const { error: sbErr } = await supabase
        .from('tasks')
        .update({
          status: newStatus,
          assignee_id: nextAssigneeId,
          assignee_name: nextAssigneeName,
          assignee_initials: nextAssigneeInitials,
          members: nextMembers,
          last_moved_at: now,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (sbErr) {
        console.error('[Supabase] Falha ao atualizar status:', sbErr.message);
      }
    } catch (sbErr) {
      console.warn('Supabase move status warning:', sbErr);
    }

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
      `${count} tarefas do Backlog foram marcadas como concluídas.`,
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
    setTasks([]);
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify([]));
    supabase.from('tasks').delete().neq('id', '0').then();

    addActivity('Admin', 'AD', 'limpou todas as tarefas do sistema', 'orange');
    addToast('Tarefas Limpas', 'Todas as tarefas do sistema foram removidas com sucesso.', 'info');
  };

  const resetSystemKeepCredentials = () => {
    setTasks([]);
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify([]));
    supabase.from('tasks').delete().neq('id', '0').then();

    if (resetAllStores) {
      resetAllStores();
    }

    addToast('Sistema Limpo! 🧹', 'Todo o sistema foi resetado com sucesso.', 'success');
  };

  // Visibility & computed metrics
  const visibleTasks = useMemo(() => tasks, [tasks]);

  const completedTasksCount = visibleTasks.filter((t) => isTaskCompleted(t)).length;
  const overdueTasksCount = visibleTasks.filter((t) => isTaskOverdue(t)).length;
  const totalTasksCount = visibleTasks.length;
  const completionPercentage = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;
  const uniqueProjectsCount = new Set(visibleTasks.map((t) => t.projectId).filter(Boolean)).size || projectsCount;
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
    <TasksContext.Provider
      value={{
        tasks: visibleTasks,
        addTask,
        updateTask,
        deleteTask,
        moveTaskStatus,
        moveAllBacklogToDoneLocally,
        toggleFlagTask,
        clearAllTasks,
        resetSystemKeepCredentials,
        computedMetrics,
        setTasks,
      }}
    >
      {children}
    </TasksContext.Provider>
  );
};

export const useTasks = (): TasksContextType => {
  const context = useContext(TasksContext);
  if (!context) {
    throw new Error('useTasks must be used within a TasksProvider');
  }
  return context;
};
