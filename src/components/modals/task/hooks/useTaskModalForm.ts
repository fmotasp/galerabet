import { useState, useEffect, useRef, useMemo } from 'react';
import { Task, Employee, Project, Sprint, TaskMember, SpineStatusConfig, TaskAttachment, TaskComment, TaskStatus, TaskChecklistItem } from '../../../../types';
import {
  listTaskBriefingFiles,
  listTaskDeliveredFiles,
  createDriveFolder,
  uploadFileToDrive,
  deleteDriveFolder,
} from '../../../../lib/googleDrive';
import { TaskModalFormData, TaskReferenceImage, TimelineActionItem } from '../types';

export const useTaskModalForm = ({
  isOpen,
  editingTask,
  setEditingTask,
  employees,
  projects,
  currentSprint,
  spineStatuses,
  currentUser,
  addTask,
  updateTask,
  moveTaskStatus,
  setIsNewTaskModalOpen,
  addToast,
}: {
  isOpen: boolean;
  editingTask: Task | null;
  setEditingTask: React.Dispatch<React.SetStateAction<Task | null>>;
  employees: Employee[];
  projects: Project[];
  currentSprint: Sprint | null;
  spineStatuses: SpineStatusConfig[];
  currentUser: any;
  addTask: (task: any) => Promise<void> | void;
  updateTask: (id: string, updates: any) => Promise<void> | void;
  moveTaskStatus?: (id: string, newStatus: TaskStatus) => Promise<void> | void;
  setIsNewTaskModalOpen: (open: boolean) => void;
  addToast: (title: string, message?: string, type?: any) => void;
}) => {
  const [activeDrawerTab, setActiveDrawerTab] = useState<'details' | 'attachments' | 'history'>('details');
  const [loadingActions] = useState(false);

  const getCurrentActor = () => {
    let actor = currentUser;
    if (!actor || !actor.name) {
      try {
        const saved = localStorage.getItem('spine_logged_user');
        if (saved) {
          actor = JSON.parse(saved);
        }
      } catch {}
    }

    const matchedEmp = employees.find(
      (e) =>
        (actor?.id && e.id === actor.id) ||
        (actor?.email && e.email?.toLowerCase() === actor.email.toLowerCase()) ||
        (actor?.name && e.name.toLowerCase() === actor.name.toLowerCase())
    );

    return {
      id: matchedEmp?.id || actor?.id || 'unassigned',
      name: matchedEmp?.name || actor?.name || 'Membro',
      initials: matchedEmp?.initials || actor?.initials || 'MB',
      avatarUrl: matchedEmp?.avatarUrl || actor?.avatarUrl,
    };
  };

  const DEFAULT_TASK_DESCRIPTION = `**Briefing:** 
**Identidade:** 
**Copy principal:** 
**Copy secundário:** 
**Dados:** 
**Observação:** 
**Tamanho:** 
**Referência:** `;

  const [formData, setFormData] = useState<TaskModalFormData>({
    title: '',
    description: DEFAULT_TASK_DESCRIPTION,
    category: '',
    assigneeId: employees[0]?.id || '',
    projectId: '',
    sprintId: currentSprint?.id || 'sprint-1',
    dueDate: '',
    deliveredAt: '',
    status: 'backlog' as TaskStatus,
    points: 1,
    isFlagged: false,
  });

  const [comments, setComments] = useState<TaskComment[]>([]);
  const [loadingComments] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);

  const [checklists, setChecklists] = useState<TaskChecklistItem[]>([]);

  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [loadingAttachments] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [currentDriveFolderId, setCurrentDriveFolderId] = useState<string>('');
  const [currentDriveFolderUrl, setCurrentDriveFolderUrl] = useState<string>('');

  const [referenceImages, setReferenceImages] = useState<TaskReferenceImage[]>([]);
  const [isUploadingReference, setIsUploadingReference] = useState(false);
  const [uploadingReferenceName, setUploadingReferenceName] = useState('');
  const [previewingReference, setPreviewingReference] = useState<{ name: string; url: string } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [taskMembers, setTaskMembers] = useState<TaskMember[]>(() => {
    const actor = getCurrentActor();
    if (actor.name && actor.name !== 'Membro') {
      return [{
        id: actor.id,
        name: actor.name,
        initials: actor.initials,
        avatarUrl: actor.avatarUrl,
      }];
    }
    return [];
  });

  const DEFAULT_CLIENT_LABELS = [
    { id: 'lbl-galera', name: 'GALERABET', color: 'blue', hex: '#002B66' },
    { id: 'lbl-f12', name: 'F12BET', color: 'green', hex: '#0D3827' },
    { id: 'lbl-luva', name: 'LUVABET', color: 'purple', hex: '#2D1E5E' },
    { id: 'lbl-brasilbet', name: 'BRASILBET', color: 'green', hex: '#0A3D2E' },
  ];

  const handleShareTask = async () => {
    if (!editingTask) return;
    try {
      const taskUrl = `${window.location.origin}${window.location.pathname}?task=${encodeURIComponent(editingTask.id)}`;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(taskUrl);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = taskUrl;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      setCopiedLink(true);
      addToast('Link da Tarefa Copiado! 🔗', 'O link direto desta tarefa foi copiado para sua área de transferência.', 'success');
      setTimeout(() => setCopiedLink(false), 2500);
    } catch (err) {
      addToast('Erro ao copiar link', 'Não foi possível copiar o link automaticamente.', 'error');
    }
  };

  const handleClose = () => {
    setIsNewTaskModalOpen(false);
    setEditingTask(null);
    setActiveDrawerTab('details');

    // Remove ?task= da URL para manter a barra de endereços limpa ao fechar
    try {
      if (window.location.search.includes('task=')) {
        const url = new URL(window.location.href);
        url.searchParams.delete('task');
        const cleanUrl = url.pathname + (url.search ? url.search : '') + (url.hash ? url.hash : '');
        window.history.replaceState({}, document.title, cleanUrl);
      }
    } catch {}
  };

  const handleAddMember = (empId: string) => {
    if (!empId || empId === 'unassigned') return;
    const emp = employees.find((e) => e.id === empId);
    if (!emp) return;
    if (taskMembers.some((m) => m.id === emp.id)) return;

    const newMember: TaskMember = {
      id: emp.id,
      name: emp.name,
      initials: emp.initials,
      avatarUrl: emp.avatarUrl,
    };

    const nextMembers = [...taskMembers, newMember];
    setTaskMembers(nextMembers);

    const primaryAssigneeId = nextMembers[0]?.id || 'unassigned';
    setFormData((prev) => ({
      ...prev,
      assigneeId: primaryAssigneeId,
    }));

    if (editingTask) {
      updateTask(editingTask.id, {
        members: nextMembers,
        assigneeId: primaryAssigneeId,
        assigneeName: nextMembers[0]?.name || 'Sem membro',
        assigneeInitials: nextMembers[0]?.initials || 'SM',
      });
      setEditingTask((prev) =>
        prev
          ? {
              ...prev,
              members: nextMembers,
              assigneeId: primaryAssigneeId,
              assigneeName: nextMembers[0]?.name || 'Sem membro',
              assigneeInitials: nextMembers[0]?.initials || 'SM',
            }
          : null
      );
    }
  };

  const handleRemoveMember = (memberId: string) => {
    const nextMembers = taskMembers.filter((m) => m.id !== memberId);
    setTaskMembers(nextMembers);

    const primaryAssigneeId = nextMembers[0]?.id || 'unassigned';
    setFormData((prev) => ({
      ...prev,
      assigneeId: primaryAssigneeId,
    }));

    if (editingTask) {
      updateTask(editingTask.id, {
        members: nextMembers,
        assigneeId: primaryAssigneeId,
        assigneeName: nextMembers[0]?.name || 'Sem membro',
        assigneeInitials: nextMembers[0]?.initials || 'SM',
      });
      setEditingTask((prev) =>
        prev
          ? {
              ...prev,
              members: nextMembers,
              assigneeId: primaryAssigneeId,
              assigneeName: nextMembers[0]?.name || 'Sem membro',
              assigneeInitials: nextMembers[0]?.initials || 'SM',
            }
          : null
      );
    }
  };

  const handleToggleLabel = (clientName: string) => {
    if (!clientName) return;
    const formattedName = clientName.trim();
    const isAlreadySelected = selectedLabels.some(
      (l) => l.toLowerCase() === formattedName.toLowerCase()
    );

    const nextLabels = isAlreadySelected
      ? selectedLabels.filter((l) => l.toLowerCase() !== formattedName.toLowerCase())
      : [...selectedLabels, formattedName];

    setSelectedLabels(nextLabels);

    const clientObj = projects.find(
      (p) => p.name.toLowerCase().trim() === formattedName.toLowerCase()
    );

    const newProjectId = clientObj?.id || (nextLabels.length > 0 ? nextLabels[0] : '');
    const newProjectName = clientObj?.name || (nextLabels.length > 0 ? nextLabels[0] : '');

    setFormData((prev) => ({
      ...prev,
      projectId: newProjectId,
      category: nextLabels.join(', ') || 'Geral',
    }));

    if (editingTask) {
      const updatedLabels = nextLabels.map((name) => {
        const found = projects.find((p) => p.name.toLowerCase() === name.toLowerCase());
        return {
          id: found?.labelId || `lbl-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          name,
          color: found?.labelColor || '#E4007E',
        };
      });

      updateTask(editingTask.id, {
        labels: updatedLabels,
        projectId: newProjectId,
        projectName: newProjectName,
        category: nextLabels.join(', ') || 'Geral',
      });
    }
  };

  // Safe date helper functions
  const safeParseTimestamp = (val?: string | number | null, fallback = Date.now()): number => {
    if (!val) return fallback;
    if (typeof val === 'number') {
      return isNaN(val) ? fallback : val;
    }
    if (typeof val === 'string') {
      const trimmed = val.trim();
      if (trimmed.includes('/')) {
        const parts = trimmed.split(' ')[0].split('/');
        if (parts.length === 3) {
          const isoLike = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
          const parsed = new Date(isoLike).getTime();
          if (!isNaN(parsed)) return parsed;
        }
      }
      const t = new Date(trimmed).getTime();
      if (!isNaN(t)) return t;
    }
    return fallback;
  };

  const safeFormatISO = (val?: string | number | null, fallback = Date.now()): string => {
    const ts = safeParseTimestamp(val, fallback);
    try {
      const d = new Date(ts);
      return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
    } catch {
      return new Date().toISOString();
    }
  };

  // Unified Timeline Calculation
  const timelineActions = useMemo(() => {
    if (!editingTask) return [];
    const list: TimelineActionItem[] = [];

    // 1. Process explicit activityLog items if recorded
    if (editingTask.activityLog && editingTask.activityLog.length > 0) {
      editingTask.activityLog.forEach((act) => {
        const userName = (act.user || '').trim().toLowerCase();
        const userIn = (act.userInitials || '').trim().toUpperCase();
        // Ignorar registros automáticos do sistema ou genéricos como Equipe
        if (userName === 'sistema' || userIn === 'SYS' || userName === 'equipe' || userIn === 'EQ') {
          return;
        }

        const ts = safeParseTimestamp(act.timestamp, Date.now());
        let itemType: TimelineActionItem['type'] = 'general';
        if (act.type === 'created') itemType = 'created';
        else if (act.type === 'status_changed') itemType = 'status';
        else if (act.type === 'delivered') itemType = 'delivery';
        else if (act.type === 'attachment_added') itemType = 'file';
        else if (act.type === 'comment_added') itemType = 'comment';
        else if (act.type === 'edited') itemType = 'edited';
        else if (act.type === 'member_added') itemType = 'member';

        list.push({
          id: act.id,
          type: itemType,
          user: act.user || editingTask.assigneeName || 'Membro',
          userInitials: act.userInitials || editingTask.assigneeInitials || 'MB',
          avatarUrl: act.avatarUrl,
          title: act.description,
          details: act.details,
          date: safeFormatISO(ts),
          rawTimestamp: ts,
        });
      });
    }

    // 2. Add comments to timeline if not already represented
    if (comments && comments.length > 0) {
      comments.forEach((c) => {
        if (!list.some((l) => l.id === c.id)) {
          const cTs = safeParseTimestamp(c.date, Date.now());
          list.push({
            id: c.id,
            type: 'comment',
            user: c.authorName || 'Membro',
            userInitials: c.authorInitials || 'MB',
            title: 'Comentário adicionado',
            details: c.text,
            date: safeFormatISO(cTs),
            rawTimestamp: cTs,
          });
        }
      });
    }

    // 3. Add attachments to timeline if not already represented
    if (attachments && attachments.length > 0) {
      attachments.forEach((a) => {
        const attId = `file-${a.id}`;
        if (!list.some((l) => l.id === attId || l.id === a.id)) {
          const aTs = safeParseTimestamp(a.date, Date.now());
          list.push({
            id: attId,
            type: 'file',
            user: editingTask.assigneeName || 'Membro',
            userInitials: editingTask.assigneeInitials || 'MB',
            title: `Arquivo anexado: "${a.name}"`,
            details: a.bytes ? `${(a.bytes / (1024 * 1024)).toFixed(2)} MB` : undefined,
            date: safeFormatISO(aTs),
            rawTimestamp: aTs,
          });
        }
      });
    }

    return list.sort((a, b) => b.rawTimestamp - a.rawTimestamp);
  }, [editingTask, comments, attachments]);

  const prevIsOpenRef = useRef(false);
  const prevEditingTaskIdRef = useRef<string | null>(null);
  const isStatusDirtyRef = useRef(false);

  useEffect(() => {
    const justOpened = isOpen && !prevIsOpenRef.current;
    const taskChanged = editingTask?.id !== prevEditingTaskIdRef.current;

    if (justOpened || taskChanged) {
      isStatusDirtyRef.current = false;
      if (editingTask) {
        setFormData({
          title: editingTask.title || '',
          description: editingTask.description || '',
          category: editingTask.category || 'Geral',
          assigneeId: editingTask.assigneeId || employees[0]?.id || 'unassigned',
          projectId: editingTask.projectId || projects[0]?.id || '',
          sprintId: editingTask.sprintId || currentSprint?.id || 'sprint-1',
          dueDate: editingTask.dueDate || '',
          deliveredAt: editingTask.deliveredAt || '',
          status: editingTask.status || 'backlog',
          points: editingTask.points || 1,
          isFlagged: !!editingTask.isFlagged,
        });

        setCurrentDriveFolderId(editingTask.driveFolderId || '');
        setCurrentDriveFolderUrl(editingTask.driveFolderUrl || '');

        if (editingTask.members && editingTask.members.length > 0) {
          // Enriquecer membros com avatarUrl atualizado dos funcionários cadastrados
          const enrichedMembers = editingTask.members.map((m) => {
            const matchedEmp = employees.find(
              (emp) =>
                (m.id && emp.id && emp.id === m.id) ||
                (m.name && emp.name && emp.name.toLowerCase().trim() === m.name.toLowerCase().trim())
            );
            return {
              ...m,
              avatarUrl: m.avatarUrl || matchedEmp?.avatarUrl || '',
              name: m.name || matchedEmp?.name || 'Membro',
              initials: m.initials || matchedEmp?.initials || 'MB',
            };
          });
          setTaskMembers(enrichedMembers);
        } else if (editingTask.assigneeId && editingTask.assigneeId !== 'unassigned') {
          const foundEmp = employees.find((e) => e.id === editingTask.assigneeId);
          setTaskMembers([
            {
              id: editingTask.assigneeId,
              name: editingTask.assigneeName || foundEmp?.name || 'Membro',
              initials: editingTask.assigneeInitials || foundEmp?.initials || 'MB',
              avatarUrl: foundEmp?.avatarUrl,
            },
          ]);
        } else {
          setTaskMembers([]);
        }

        const initLabels: string[] = [];
        if (editingTask.labels && editingTask.labels.length > 0) {
          editingTask.labels.forEach((l) => {
            if (l.name && l.name.toUpperCase().trim() !== 'GERAL') {
              initLabels.push(l.name.toUpperCase().trim());
            }
          });
        } else if (editingTask.category && editingTask.category.toUpperCase().trim() !== 'GERAL') {
          editingTask.category.split(',').forEach((c) => {
            const tr = c.toUpperCase().trim();
            if (tr && tr !== 'GERAL') initLabels.push(tr);
          });
        }
        setSelectedLabels([...new Set(initLabels)]);

        setIsEditingDescription(!editingTask.description);
        setReferenceImages(editingTask.referenceImages || []);
        setComments(editingTask.comments || []);
        setChecklists(editingTask.checklists || []);
        setAttachments(editingTask.attachments || []);

        const folderId = editingTask.driveFolderId;
        const taskTitle = editingTask.title;

        if (folderId || taskTitle) {
          listTaskBriefingFiles(folderId, taskTitle)
            .then((driveFiles) => {
              if (driveFiles && driveFiles.length > 0) {
                const mappedRefs = driveFiles.map((f) => ({
                  id: `ref-${f.id}`,
                  name: f.name,
                  url: `https://drive.google.com/thumbnail?id=${f.id}&sz=w1000`,
                  date: f.createdTime ? new Date(f.createdTime).toLocaleDateString('pt-BR') : 'Referência',
                  driveFileId: f.id,
                }));

                setReferenceImages((prev) => {
                  const map = new Map<string, any>();
                  prev.forEach((r) => map.set(r.driveFileId || r.name || r.id, r));
                  mappedRefs.forEach((mr) => map.set(mr.driveFileId || mr.name || mr.id, mr));
                  const merged = Array.from(map.values());
                  updateTask(editingTask.id, { referenceImages: merged });
                  return merged;
                });
              }
            })
            .catch((e) => console.warn('Could not sync briefing files from drive:', e));

          listTaskDeliveredFiles(folderId, taskTitle)
            .then((driveDelFiles) => {
              if (driveDelFiles && driveDelFiles.length > 0) {
                const mappedAtts: TaskAttachment[] = driveDelFiles.map((f) => ({
                  id: f.id,
                  name: f.name,
                  url: f.webContentLink || f.webViewLink || `https://drive.google.com/file/d/${f.id}/view`,
                  mimeType: f.mimeType,
                  bytes: f.size ? Number(f.size) : 0,
                  date: f.createdTime || new Date().toISOString(),
                  previews: f.thumbnailLink ? [{ url: f.thumbnailLink, width: 300, height: 300 }] : [],
                  driveFileId: f.id,
                }));

                setAttachments((prev) => {
                  const map = new Map<string, TaskAttachment>();
                  prev.forEach((a) => map.set(a.driveFileId || a.id || a.name, a));
                  mappedAtts.forEach((ma) => map.set(ma.driveFileId || ma.id || ma.name, ma));
                  const merged = Array.from(map.values());
                  updateTask(editingTask.id, { attachments: merged });
                  return merged;
                });
              }
            })
            .catch((e) => console.warn('Could not sync delivered files from drive:', e));
        }
      } else if (isOpen) {
        const actor = getCurrentActor();
        const initialMember: TaskMember | null = actor.name && actor.name !== 'Membro' ? {
          id: actor.id,
          name: actor.name,
          initials: actor.initials,
          avatarUrl: actor.avatarUrl,
        } : (employees[0] ? {
          id: employees[0].id,
          name: employees[0].name,
          initials: employees[0].initials,
          avatarUrl: employees[0].avatarUrl,
        } : null);

        const initialMembers = initialMember ? [initialMember] : [];

        setFormData({
          title: '',
          description: DEFAULT_TASK_DESCRIPTION,
          category: '',
          assigneeId: initialMember?.id || 'unassigned',
          projectId: '',
          sprintId: currentSprint?.id || 'sprint-1',
          dueDate: '',
          deliveredAt: '',
          status: 'backlog',
          points: 1,
          isFlagged: false,
        });
        setCurrentDriveFolderId('');
        setCurrentDriveFolderUrl('');
        setSelectedLabels([]);
        setTaskMembers(initialMembers);
        setIsEditingDescription(true);
        setReferenceImages([]);
        setComments([]);
        setChecklists([]);
        setAttachments([]);
      }
    }

    prevIsOpenRef.current = isOpen;
    prevEditingTaskIdRef.current = editingTask?.id || null;
  }, [isOpen, editingTask?.id]);

  // Sincroniza o status do formulário se a tarefa for alterada externamente (ex: Realtime/Kanban) sem sujar o form
  useEffect(() => {
    if (editingTask && !isStatusDirtyRef.current && editingTask.status && editingTask.status !== formData.status) {
      setFormData((prev) => ({
        ...prev,
        status: editingTask.status,
      }));
    }
  }, [editingTask?.status]);

  const handleAddComment = async (e?: React.FormEvent | React.MouseEvent | React.KeyboardEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!editingTask || !newCommentText.trim()) return;

    setIsPostingComment(true);
    const actor = getCurrentActor();
    const newComment: TaskComment = {
      id: `comment-${Date.now()}`,
      authorName: actor.name || 'Usuário',
      authorInitials: actor.initials || 'U',
      text: newCommentText.trim(),
      date: new Date().toISOString(),
    };
    const nextComments = [newComment, ...comments];
    setComments(nextComments);
    await updateTask(editingTask.id, {
      comments: nextComments,
    });
    setEditingTask((prev) => (prev ? { ...prev, comments: nextComments } : null));
    setNewCommentText('');
    addToast('Comentário Adicionado', 'Seu comentário foi salvo.', 'success');
    setIsPostingComment(false);
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!editingTask) return;
    if (window.confirm('Deseja excluir seu comentário?')) {
      const nextComments = comments.filter((c) => c.id !== commentId);
      setComments(nextComments);
      await updateTask(editingTask.id, { comments: nextComments });
      addToast('Comentário Excluído', 'Seu comentário foi removido.', 'info');
    }
  };

  const handleAddChecklistItem = async (title: string) => {
    if (!title.trim()) return;
    const newItem: TaskChecklistItem = {
      id: `check-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title: title.trim(),
      completed: false,
    };
    const nextList = [...checklists, newItem];
    setChecklists(nextList);
    if (editingTask) {
      await updateTask(editingTask.id, {
        checklists: nextList,
        checklistsCount: nextList.length,
      });
      setEditingTask((prev) => (prev ? { ...prev, checklists: nextList, checklistsCount: nextList.length } : null));
    }
  };

  const handleToggleChecklistItem = async (itemId: string) => {
    const nextList = checklists.map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    setChecklists(nextList);
    if (editingTask) {
      await updateTask(editingTask.id, {
        checklists: nextList,
        checklistsCount: nextList.length,
      });
      setEditingTask((prev) => (prev ? { ...prev, checklists: nextList, checklistsCount: nextList.length } : null));
    }
  };

  const handleDeleteChecklistItem = async (itemId: string) => {
    const nextList = checklists.filter((item) => item.id !== itemId);
    setChecklists(nextList);
    if (editingTask) {
      await updateTask(editingTask.id, {
        checklists: nextList,
        checklistsCount: nextList.length,
      });
      setEditingTask((prev) => (prev ? { ...prev, checklists: nextList, checklistsCount: nextList.length } : null));
    }
  };

  const handleUploadReferenceImage = async (file: File) => {
    setIsUploadingReference(true);
    setUploadingReferenceName(file.name);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) {
        setIsUploadingReference(false);
        setUploadingReferenceName('');
        return;
      }

      let driveFileId = '';
      let driveFolderId = currentDriveFolderId || editingTask?.driveFolderId || '';
      let driveFolderUrl = currentDriveFolderUrl || editingTask?.driveFolderUrl || '';

      try {
        const taskName = editingTask?.title || formData.title || `Demanda ${Date.now()}`;
        if (!driveFolderId) {
          addToast('Google Drive 📁', `Localizando / Criando pasta "${taskName}" no Drive...`, 'info');
          const folderRes = await createDriveFolder(taskName);
          if (folderRes) {
            driveFolderId = folderRes.id;
            driveFolderUrl = folderRes.webViewLink;
            setCurrentDriveFolderId(driveFolderId);
            setCurrentDriveFolderUrl(driveFolderUrl);
            if (editingTask) {
              updateTask(editingTask.id, {
                driveFolderId,
                driveFolderUrl,
              });
            }
            addToast('Pasta Única no Drive ✅', 'Vinculada à pasta da demanda.', 'success');
          }
        }

        if (driveFolderId) {
          const upRes = await uploadFileToDrive(file, driveFolderId, 'reference');
          if (upRes && upRes.id) {
            driveFileId = upRes.id;
          }
        }
      } catch (err) {
        console.warn('Drive upload error:', err);
      }

      const newRef: TaskReferenceImage = {
        id: `ref-${Date.now()}`,
        name: file.name,
        url: driveFileId ? `https://drive.google.com/thumbnail?id=${driveFileId}&sz=w1000` : dataUrl,
        date: new Date().toLocaleDateString('pt-BR'),
        driveFileId,
      };

      const nextRefs = [...referenceImages, newRef];
      setReferenceImages(nextRefs);

      if (editingTask) {
        await updateTask(editingTask.id, {
          referenceImages: nextRefs,
          coverImageUrl: editingTask.coverImageUrl || newRef.url,
        });
      }

      addToast('Referência Adicionada! 🖼️', `"${file.name}" anexada à demanda com sucesso.`, 'success');
      setIsUploadingReference(false);
      setUploadingReferenceName('');
    };

    reader.readAsDataURL(file);
  };

  const handleDeleteReferenceImage = async (refId: string) => {
    const targetRef = referenceImages.find((r) => r.id === refId);
    if (!targetRef) return;

    if (targetRef.driveFileId) {
      deleteDriveFolder(targetRef.driveFileId).catch(() => {});
    }

    const nextRefs = referenceImages.filter((r) => r.id !== refId);
    setReferenceImages(nextRefs);

    if (editingTask) {
      await updateTask(editingTask.id, {
        referenceImages: nextRefs,
      });
      addToast('Referência Excluída', `"${targetRef.name}" removida.`, 'info');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      addToast('Título Obrigatório ⚠️', 'Por favor, informe o título da tarefa antes de salvar.', 'warning');
      return;
    }

    // Validação obrigatória de prazo previsto
    if (!formData.dueDate || !formData.dueDate.trim() || formData.dueDate === 'Sem prazo') {
      addToast('Prazo Previsto Obrigatório ⚠️', 'Por favor, informe o prazo previsto da tarefa antes de salvar.', 'error');
      return;
    }

    // Validação obrigatória de cliente
    if (selectedLabels.length === 0 && !formData.projectId) {
      addToast('Cliente Obrigatório ⚠️', 'Por favor, selecione um cliente para a tarefa antes de salvar.', 'error');
      return;
    }

    const primaryAssignee = taskMembers[0] || (formData.assigneeId ? employees.find((e) => e.id === formData.assigneeId) : null);

    const labelsPayload = selectedLabels.map((name) => {
      const found = projects.find((p) => p.name.toLowerCase() === name.toLowerCase());
      return {
        id: found?.labelId || `lbl-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name,
        color: found?.labelColor || '#E4007E',
      };
    });

    const firstRefUrl = (referenceImages && referenceImages.length > 0) ? referenceImages[0].url : undefined;
    const resolvedCover = editingTask?.coverImageUrl || firstRefUrl;

    const isStatusChanged = isStatusDirtyRef.current && editingTask && formData.status !== editingTask.status;

    const taskPayload: any = {
      title: formData.title,
      description: formData.description,
      category: selectedLabels.join(', ') || formData.category || 'Geral',
      assigneeId: primaryAssignee?.id || 'unassigned',
      assigneeName: primaryAssignee?.name || 'Sem membro',
      assigneeInitials: primaryAssignee?.initials || 'SM',
      members: taskMembers,
      projectId: formData.projectId || (selectedLabels.length > 0 ? selectedLabels[0] : ''),
      projectName: projects.find((p) => p.id === formData.projectId)?.name || (selectedLabels.length > 0 ? selectedLabels[0] : 'Geral'),
      sprintId: formData.sprintId,
      dueDate: formData.dueDate,
      deliveredAt: formData.deliveredAt,
      
      points: Number(formData.points) || 1,
      isFlagged: formData.isFlagged,
      labels: labelsPayload,
      referenceImages,
      attachments,
      comments,
      checklists,
      coverImageUrl: resolvedCover,
      driveFolderId: currentDriveFolderId,
      driveFolderUrl: currentDriveFolderUrl,
    };
    if (isStatusDirtyRef.current || !editingTask) {
      taskPayload.status = formData.status;
    }

    if (editingTask) {
      if (isStatusChanged && moveTaskStatus) {
        await moveTaskStatus(editingTask.id, formData.status);
      }
      await updateTask(editingTask.id, taskPayload);
      addToast('Alterações Salvas! ✅', `Tarefa "${taskPayload.title}" atualizada no Sistema e Supabase.`, 'success');
    } else {
      await addTask(taskPayload);
    }

    handleClose();
  };

  return {
    activeDrawerTab,
    setActiveDrawerTab,
    loadingActions,
    formData,
    setFormData,
    comments,
    setComments,
    loadingComments,
    newCommentText,
    setNewCommentText,
    isPostingComment,
    checklists,
    setChecklists,
    attachments,
    setAttachments,
    loadingAttachments,
    isEditingDescription,
    setIsEditingDescription,
    currentDriveFolderId,
    setCurrentDriveFolderId,
    currentDriveFolderUrl,
    setCurrentDriveFolderUrl,
    referenceImages,
    setReferenceImages,
    isUploadingReference,
    uploadingReferenceName,
    previewingReference,
    setPreviewingReference,
    copiedLink,
    selectedLabels,
    taskMembers,
    timelineActions,
    handleShareTask,
    handleClose,
    handleAddMember,
    handleRemoveMember,
    handleToggleLabel,
    handleAddComment,
    handleDeleteComment,
    handleAddChecklistItem,
    handleToggleChecklistItem,
    handleDeleteChecklistItem,
    handleUploadReferenceImage,
    handleDeleteReferenceImage,
    handleSubmit,
    handleStatusChange: () => {
      isStatusDirtyRef.current = true;
    },
  };
};
