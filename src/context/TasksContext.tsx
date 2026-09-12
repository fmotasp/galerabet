import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { realtimeHub } from '../lib/realtimeHub';
import { logSystemAction } from '../lib/systemLog';
import { isTaskOverdue, isTaskCompleted, getTaskOverdueDays } from '../lib/taskDateUtils';
import { encodeTaskDescriptionWithChecklist, decodeTaskDescriptionWithChecklist } from '../lib/taskUtils';
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
  fetchTasksFromSupabase: () => Promise<void>;
}



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
  // Tasks (Demandas) - Inicializa vazio para garantir dados reais do servidor
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);

  // Helper para obter os dados do usuário autenticado no momento da ação
  const getCurrentActor = () => {
    let actor = currentUser;
    if (!actor || !actor.name) {
      try {
        const saved = localStorage.getItem('spine_logged_user');
        if (saved) {
          actor = JSON.parse(saved);
        }
      } catch (err) {}
    }
    return {
      name: actor?.name || 'Membro',
      initials: actor?.initials || 'MB',
      avatarUrl: actor?.avatarUrl,
    };
  };

  // Helper para mapear linha bruta do Supabase para objeto Task tipado
  const mapRowToTask = (row: any): Task => {
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
      members: typeof row.members === 'string' ? JSON.parse(row.members) : (row.members || []),
      labels: typeof row.labels === 'string' ? JSON.parse(row.labels) : (row.labels || []),
      attachments: typeof row.attachments === 'string' ? JSON.parse(row.attachments) : (row.attachments || []),
      checklists: resolvedChecklists,
      checklistsCount: Array.isArray(resolvedChecklists) ? resolvedChecklists.length : (row.checklists_count || 0),
      referenceImages: typeof row.reference_images === 'string' ? JSON.parse(row.reference_images) : (row.reference_images || []),
      comments: typeof row.comments === 'string' ? JSON.parse(row.comments) : (row.comments || []),
      coverImageUrl: row.cover_image_url,
      coverAttachmentId: row.cover_attachment_id,
      lastMovedAt: Number(row.last_moved_at) || Date.now(),
      activityLog: (typeof (row.activity_log || row.activityLog) === 'string' ? JSON.parse(row.activity_log || row.activityLog) : (row.activity_log || row.activityLog || [])).filter((act: any) => {
        const userName = (act.user || '').trim().toLowerCase();
        const userIn = (act.userInitials || '').trim().toUpperCase();
        return userName !== 'sistema' && userIn !== 'SYS' && userName !== 'equipe' && userIn !== 'EQ';
      }),
      createdAt: row.created_at ? row.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
    };
  };

  // Busca direta e completa de tarefas no Supabase
  const fetchTasksFromSupabase = useCallback(async () => {
    console.log('[Supabase Tasks] Iniciando busca direta na tabela tasks...');
    try {
      const TASK_SELECT_FIELDS = `id, title, description, category, status, due_date, points, is_flagged, project_id, project_name, sprint_id, assignee_id, assignee_name, assignee_initials, members, labels, attachments, reference_images, comments, cover_attachment_id, cover_image_url, last_moved_at, activity_log, created_at, updated_at`;
      let { data, error } = await supabase
        .from('tasks')
        .select(TASK_SELECT_FIELDS)
        .order('last_moved_at', { ascending: false })
        .limit(1000);

      console.log('[Supabase Tasks] Resposta com order:', { count: data?.length, error });

      // Fallback: se falhar com order, tenta sem order
      if (error || !data || data.length === 0) {
        console.log('[Supabase Tasks] Tentando fallback sem order...');
        const fallbackRes = await supabase.from('tasks').select(TASK_SELECT_FIELDS).limit(1000);
        console.log('[Supabase Tasks] Resposta fallback sem order:', { count: fallbackRes.data?.length, error: fallbackRes.error });
        if (fallbackRes.data && fallbackRes.data.length > 0) {
          data = fallbackRes.data;
          error = fallbackRes.error;
        }
      }

      if (error) {
        console.error('[Supabase Tasks] ERRO ao buscar tarefas do banco:', error);
        return;
      }

      if (data && Array.isArray(data)) {
        console.log(`[Supabase Tasks] ✅ Sucesso: ${data.length} tarefas recebidas do Supabase!`);
        const mapped = data.map(mapRowToTask);
        setTasks(mapped);
      } else {
        console.warn('[Supabase Tasks] Supabase retornou array vazio ou nulo.');
      }
    } catch (err) {
      console.error('[Supabase Tasks] Falha de exceção ao carregar tarefas:', err);
    }
  }, []);

  // Busca inicial imediata ao montar o contexto
  useEffect(() => {
    fetchTasksFromSupabase();
  }, [fetchTasksFromSupabase]);

  // Inscrição em tempo real compartilhada (Supabase Realtime WebSockets) para todos os usuários
  useEffect(() => {
    const unsubscribe = realtimeHub.subscribe('tasks', (payload) => {
      if (payload.eventType === 'INSERT' && payload.new?.id) {
        const incomingTask = mapRowToTask(payload.new);
        setTasks((prev) => {
          if (prev.some((t) => t.id === incomingTask.id)) {
            return prev.map((t) => (t.id === incomingTask.id ? { ...t, ...incomingTask } : t));
          }
          return [incomingTask, ...prev];
        });
      } else if (payload.eventType === 'UPDATE' && payload.new?.id) {
        const updatedTask = mapRowToTask(payload.new);
        setTasks((prev) =>
          prev.map((t) => (t.id === updatedTask.id ? { ...t, ...updatedTask } : t))
        );
      } else if (payload.eventType === 'DELETE' && payload.old?.id) {
        setTasks((prev) => prev.filter((t) => t.id !== payload.old.id));
      }
    });

    // Quando o usuário volta para a aba ou desbloqueia o computador, sincroniza com o banco
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchTasksFromSupabase();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Quando qualquer usuário faz login ou troca de conta, busca imediatamente todas as tarefas do Supabase
    const handleLoginEvent = () => {
      fetchTasksFromSupabase();
    };
    window.addEventListener('spine_user_logged_in', handleLoginEvent);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('spine_user_logged_in', handleLoginEvent);
      unsubscribe();
    };
  }, [fetchTasksFromSupabase]);

  // Se o currentUser mudar (ex: login efetuado), dispara a busca no Supabase
  useEffect(() => {
    if (currentUser?.id) {
      fetchTasksFromSupabase();
    }
  }, [currentUser?.id, fetchTasksFromSupabase]);

  // Notifications for tasks due in <= 2 days
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const now = new Date();
      tasks.forEach((t) => {
        if (isTaskCompleted(t) || !t.dueDate || t.dueDate === 'Sem prazo') return;
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


  // Task Actions
  const addTask = async (newTaskData: Omit<Task, 'id' | 'createdAt'>) => {
    const newId = `task-${Date.now()}`;
    const actor = getCurrentActor();
    const hasRealActor = actor.name && actor.name !== 'Membro' && actor.name !== 'Equipe';
    const authorName = hasRealActor ? actor.name : (newTaskData.assigneeName && newTaskData.assigneeName !== 'Sem membro' ? newTaskData.assigneeName : '');
    const authorInitials = hasRealActor ? actor.initials : (newTaskData.assigneeInitials && newTaskData.assigneeInitials !== 'SM' ? newTaskData.assigneeInitials : '');
    const authorAvatar = hasRealActor ? actor.avatarUrl : undefined;

    const initialActivityLog = authorName ? [
      {
        id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        type: 'created' as const,
        user: authorName,
        userInitials: authorInitials || authorName.substring(0, 2).toUpperCase(),
        avatarUrl: authorAvatar,
        description: `Demanda criada`,
        timestamp: new Date().toISOString(),
        details: `Criada no quadro`,
      },
    ] : [];

    // Adiciona os gestores padrão na lista de membros da nova tarefa
    const defaultManagerNames = ['giovanni', 'fernanda', 'guilherme gonçalves', 'fabio mozart'];
    const existingMemberIds = new Set((newTaskData.members || []).map(m => m.id));
    let updatedMembers = [...(newTaskData.members || [])];

    employees.forEach(emp => {
      const isManager = defaultManagerNames.some(name => emp.name.toLowerCase().includes(name));
      if (isManager && !existingMemberIds.has(emp.id)) {
        updatedMembers.push({
          id: emp.id,
          name: emp.name,
          initials: emp.initials,
          avatarUrl: emp.avatarUrl,
        });
        existingMemberIds.add(emp.id);
      }
    });

    const newTask: Task = {
      ...newTaskData,
      members: updatedMembers,
      id: newId,
      createdAt: new Date().toISOString().split('T')[0],
      commentsCount: 0,
      attachmentsCount: 0,
      lastMovedAt: Date.now(),
      activityLog: initialActivityLog,
    };

    setTasks((prev) => [newTask, ...prev]);

    try {
      const payload = {
        id: newTask.id,
        title: newTask.title,
        description: encodeTaskDescriptionWithChecklist(newTask.description || '', newTask.checklists || []),
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
        checklists: newTask.checklists || [],
        cover_image_url: newTask.coverImageUrl || null,
        cover_attachment_id: newTask.coverAttachmentId || null,
        last_moved_at: newTask.lastMovedAt,
        activity_log: initialActivityLog,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error: sbErr } = await supabase.from('tasks').insert([payload]);
      if (sbErr) {
        console.warn('[Supabase] Tentando inserção sem campos adicionais devido a:', sbErr.message);
        const { activity_log, checklists, ...fallbackPayload } = payload;
        const { error: retryErr } = await supabase.from('tasks').insert([fallbackPayload]);
        if (retryErr) {
          console.error('[Supabase] Falha ao inserir tarefa (fallback):', retryErr.message);
        }
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
    logSystemAction('CREATE', newTask.id, newTask.title, authorName || 'Desconhecido', {
      initialStatus: newTask.status
    });
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    const now = Date.now();
    const actor = getCurrentActor();
    const targetTask = tasks.find((t) => t.id === id);

    let nextActivityLog = updates.activityLog ?? (targetTask?.activityLog ? [...targetTask.activityLog] : []);

    if (targetTask && updates.status && updates.status !== targetTask.status) {
      const currentStatusConfig = spineStatuses.find((s) => s.id === updates.status);
      const statusLabel = currentStatusConfig?.label || updates.status;
      const isApprovalOrDone =
        updates.status === 'done' ||
        updates.status === 'postar' ||
        updates.status.toLowerCase().includes('concl') ||
        updates.status.toLowerCase().includes('post') ||
        statusLabel.toLowerCase().includes('concl') ||
        statusLabel.toLowerCase().includes('post') ||
        statusLabel.toLowerCase().includes('entreg');

      const statusActivity = {
        id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        type: (isApprovalOrDone ? 'delivered' : 'status_changed') as any,
        user: actor.name || targetTask.assigneeName || 'Membro',
        userInitials: actor.initials || targetTask.assigneeInitials || 'MB',
        avatarUrl: actor.avatarUrl,
        description: isApprovalOrDone ? 'Demanda entregue para aprovação' : `Status alterado para "${statusLabel}"`,
        timestamp: new Date().toISOString(),
        details: isApprovalOrDone ? `Concluída / Entregue no status "${statusLabel}"` : `Movida para a coluna ${statusLabel}`,
      };

      nextActivityLog = [...nextActivityLog, statusActivity];
      updates.activityLog = nextActivityLog;
    }

    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const next = { ...t, ...updates, activityLog: nextActivityLog };
          if (updates.status && updates.status !== t.status) {
            next.lastMovedAt = now;
          }
          return next;
        }
        return t;
      })
    );

    try {
      const payload: any = {};
      if (updates.status !== undefined) {
        payload.status = updates.status;
        payload.last_moved_at = now;
      }
      if (updates.title !== undefined) payload.title = updates.title;
      if (updates.description !== undefined || updates.checklists !== undefined) {
        const currentTask = tasks.find(t => t.id === id);
        const baseDescription = updates.description !== undefined ? updates.description : (currentTask?.description || '');
        const baseChecklists = updates.checklists !== undefined ? updates.checklists : (currentTask?.checklists || []);
        payload.description = encodeTaskDescriptionWithChecklist(baseDescription, baseChecklists);
      }
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
      if (updates.activityLog !== undefined) payload.activity_log = updates.activityLog;

      const { error: sbErr } = await supabase.from('tasks').update(payload).eq('id', id);
      if (sbErr) {
        console.warn('[Supabase] Tentando atualizar sem campos adicionais devido a:', sbErr.message);
        const { activity_log, checklists, ...fallbackPayload } = payload;
        const { error: retryErr } = await supabase.from('tasks').update(fallbackPayload).eq('id', id);
        if (retryErr) {
          console.error('[Supabase] Fallback update failed:', retryErr.message);
          // Try absolute bare minimum if status was provided
          if (updates.status !== undefined) {
             const { error: thirdErr } = await supabase.from('tasks').update({ status: updates.status, last_moved_at: now }).eq('id', id);
             if (thirdErr) {
                setTasks((prev) => prev.map((t) => (t.id === id ? targetTask : t)));
                addToast('Erro ao Salvar ⚠️', 'Falha ao salvar no servidor.', 'error');
             }
          } else {
             setTasks((prev) => prev.map((t) => (t.id === id ? targetTask : t)));
             addToast('Erro ao Salvar ⚠️', 'Falha ao salvar no servidor.', 'error');
          }
        }
      }
      
      if (targetTask) {
        logSystemAction('UPDATE', id, targetTask.title, actor.name || 'Membro desconhecido', {
          updatedFields: Object.keys(updates)
        });
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
      const actor = getCurrentActor();
      if (taskToDelete) {
        logSystemAction('DELETE', id, taskToDelete.title, actor.name || 'Membro desconhecido', {
          deletedStatus: taskToDelete.status,
          deletedMembers: taskToDelete.members?.map(m => m.name),
        });
      }
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

    const actor = getCurrentActor();
    const actorName = actor.name || targetTask.assigneeName || 'Membro';
    const actorInitials = actor.initials || targetTask.assigneeInitials || 'MB';
    const actorAvatar = actor.avatarUrl;

    const newActivity = {
      id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      type: (isApprovalOrDone ? 'delivered' : 'status_changed') as any,
      user: actorName,
      userInitials: actorInitials,
      avatarUrl: actorAvatar,
      description: isApprovalOrDone ? 'Demanda entregue para aprovação' : `Status alterado para "${statusLabel}"`,
      timestamp: new Date().toISOString(),
      details: isApprovalOrDone ? `Concluída / Entregue no status "${statusLabel}"` : `Movida para a coluna ${statusLabel}`,
    };

    const nextActivityLog = [...(targetTask.activityLog || []), newActivity];

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
            activityLog: nextActivityLog,
          };
        }
        return t;
      })
    );

    try {
      const updatePayload: Record<string, any> = {
        status: newStatus,
        last_moved_at: now,
        activity_log: nextActivityLog,
      };

      if ((newStatus === 'in_review' || newStatus.toLowerCase().includes('revis')) && nextAssigneeId !== targetTask.assigneeId) {
        updatePayload.assignee_id = nextAssigneeId;
        updatePayload.assignee_name = nextAssigneeName;
        updatePayload.assignee_initials = nextAssigneeInitials;
        updatePayload.members = nextMembers;
      }

      const { error: sbErr } = await supabase.from('tasks').update(updatePayload).eq('id', id);
      
      if (sbErr) {
        console.error('[Supabase] Falha ao atualizar status:', sbErr.message);
        const { error: fallbackErr } = await supabase.from('tasks').update({ status: newStatus, last_moved_at: now }).eq('id', id);
        
        if (fallbackErr) {
          console.error('[Supabase] Fallback de status falhou:', fallbackErr.message);
          
          // ROLLBACK
          setTasks((prev) => prev.map((t) => (t.id === id ? targetTask : t)));
          addToast('Erro ao Mover ⚠️', 'Falha ao salvar no servidor. A tarefa voltou ao status anterior.', 'error');
          return;
        }
      }
      
      logSystemAction('UPDATE', id, targetTask.title, actorName, {
        actionDetail: 'Mudança de status da coluna',
        fromStatus: oldStatus,
        toStatus: newStatus
      });
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
    supabase.from('tasks').delete().neq('id', '0').then();

    addActivity('Admin', 'AD', 'limpou todas as tarefas do sistema', 'orange');
    addToast('Tarefas Limpas', 'Todas as tarefas do sistema foram removidas com sucesso.', 'info');
  };

  const resetSystemKeepCredentials = () => {
    setTasks([]);
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
        fetchTasksFromSupabase,
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
