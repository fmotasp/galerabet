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
  clearTrelloTasks: () => void;
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
  DELETED_TRELLO_TASKS: 'spine_deleted_trello_task_ids_v1',
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
  pushTrelloMutation?: (
    actionType: 'MOVE' | 'UPDATE' | 'DELETE' | 'CREATE',
    task: Partial<Task> & { id?: string; title?: string; status?: TaskStatus },
    extraParams?: { newStatus?: TaskStatus }
  ) => Promise<void>;
  deletedTrelloTaskIds: string[];
  setDeletedTrelloTaskIds: React.Dispatch<React.SetStateAction<string[]>>;
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
  pushTrelloMutation = async () => {},
  deletedTrelloTaskIds,
  setDeletedTrelloTaskIds,
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

  // LocalStorage persistence effects with QuotaExceeded protection & Payload Optimization
  useEffect(() => {
    try {
      // Sanitize tasks for localStorage: strip heavy temporary base64 strings and redundant attachment previews
      const sanitizedTasks = tasks.map((t) => {
        const leanAttachments = (t.attachments || []).map((a) => ({
          id: a.id,
          name: a.name,
          url: a.url,
          mimeType: a.mimeType,
          bytes: a.bytes,
          date: a.date,
        }));

        const leanRefImages = (t.referenceImages || [])
          .map((r) => {
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
          })
          .filter((r) => r.url || r.driveFileId);

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
              trelloListName: 'Atrasadas / Urgente',
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
    const id = `task-${Date.now()}`;
    const newTask: Task = {
      ...newTaskData,
      id,
      status: newTaskData.status || 'backlog',
      lastMovedAt: Date.now(),
      createdAt: new Date().toISOString().split('T')[0],
    };
    setTasks((prev) => [newTask, ...prev]);

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

      const { error } = await supabase.from('tasks').upsert(fullPayload);

      if (error) {
        console.warn('Full payload error, trying base columns fallback:', error.message);
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

    if (!targetTask.assigneeId || targetTask.assigneeId === 'unassigned') {
      try {
        await supabase.rpc('claim_task', { p_task_id: id });
      } catch (claimErr) {
        console.warn('[Supabase] Aviso ao reivindicar demanda:', claimErr);
      }
    }

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

    pushTrelloMutation(
      'MOVE',
      { ...targetTask, status: newStatus, trelloListName: statusLabel, lastMovedAt: now, deliveredAt: nextDeliveredAt },
      { newStatus }
    );

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
    
    supabase.from('tasks').delete().neq('id', '0').then();

    addActivity('Admin', 'AD', 'limpou todas as tarefas do sistema', 'orange');
    addToast('Tarefas Limpas', 'Todas as tarefas do sistema foram removidas com sucesso.', 'info');
  };

  const clearTrelloTasks = () => {
    const trelloIds = tasks.filter((t) => t.id.startsWith('trello-')).map((t) => t.id);
    const rawTrelloIds = trelloIds.map((id) => id.replace('trello-', ''));
    setDeletedTrelloTaskIds((prev) => [...new Set([...prev, ...trelloIds, ...rawTrelloIds])]);
    setTasks((prev) => prev.filter((t) => !t.id.startsWith('trello-')));
    
    if (trelloIds.length > 0) {
      supabase.from('tasks').delete().in('id', trelloIds).then();
    }

    addActivity('Admin', 'AD', 'limpou as tarefas importadas do Trello', 'blue');
    addToast('Tarefas do Trello Removidas', 'Todas as tarefas sincronizadas do Trello foram limpas.', 'info');
  };

  const resetSystemKeepCredentials = () => {
    setTasks([]);
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify([]));
    supabase.from('tasks').delete().neq('id', '0').then();

    if (resetAllStores) {
      resetAllStores();
    }

    addToast('Sistema Limpo! 🧹', 'Todo o sistema foi resetado. Suas chaves de API do Trello foram mantidas intactas.', 'success');
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
        clearTrelloTasks,
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
