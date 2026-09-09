import { useState, useEffect, useRef, useMemo } from 'react';
import { Task, Employee, Project, Sprint, TaskMember, SpineStatusConfig, TaskAttachment, TaskComment, TaskStatus } from '../../../../types';
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
  setIsNewTaskModalOpen: (open: boolean) => void;
  addToast: (title: string, message?: string, type?: any) => void;
}) => {
  const [activeDrawerTab, setActiveDrawerTab] = useState<'details' | 'attachments' | 'history'>('details');
  const [loadingActions] = useState(false);

  const [formData, setFormData] = useState<TaskModalFormData>({
    title: '',
    description: '',
    category: 'Geral',
    assigneeId: employees[0]?.id || '',
    projectId: projects[0]?.id || '',
    sprintId: currentSprint?.id || 'sprint-1',
    dueDate: 'Sem prazo',
    deliveredAt: '',
    status: 'backlog' as TaskStatus,
    points: 1,
    isFlagged: false,
  });

  const [comments, setComments] = useState<TaskComment[]>([]);
  const [loadingComments] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);

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
  const [taskMembers, setTaskMembers] = useState<TaskMember[]>([]);

  const DEFAULT_CLIENT_LABELS = [
    { id: 'lbl-galera', name: 'GALERABET', color: 'blue', hex: '#002B66' },
    { id: 'lbl-f12', name: 'F12BET', color: 'green', hex: '#0D3827' },
    { id: 'lbl-luva', name: 'LUVABET', color: 'purple', hex: '#2D1E5E' },
    { id: 'lbl-brasilbet', name: 'BRASILBET', color: 'green', hex: '#0A3D2E' },
  ];

  const handleShareTask = async () => {
    if (!editingTask) return;
    try {
      const taskUrl = `${window.location.origin}/?task=${editingTask.id}`;
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
      addToast('Link da Tarefa Copiado!', 'O link direto desta tarefa foi copiado para sua área de transferência.', 'success');
      setTimeout(() => setCopiedLink(false), 2500);
    } catch (err) {
      addToast('Erro ao copiar link', 'Não foi possível copiar o link automaticamente.', 'error');
    }
  };

  const handleClose = () => {
    setIsNewTaskModalOpen(false);
    setEditingTask(null);
    setActiveDrawerTab('details');
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

    if (editingTask.deliveredAt) {
      const delTimestamp = safeParseTimestamp(editingTask.lastMovedAt || editingTask.deliveredAt, Date.now());
      list.push({
        id: `synth-del-${editingTask.id}`,
        type: 'delivery',
        user: editingTask.assigneeName || currentUser?.name || 'Membro',
        userInitials: editingTask.assigneeInitials || currentUser?.initials || 'MB',
        title: 'Demanda entregue para aprovação',
        details: `Data registrada de entrega realizada: ${editingTask.deliveredAt}`,
        date: safeFormatISO(delTimestamp),
        rawTimestamp: delTimestamp,
      });
    }

    if (editingTask.lastMovedAt) {
      const stLabel = spineStatuses.find((s) => s.id === editingTask.status)?.label || editingTask.status;
      if (!list.some((l) => l.type === 'status' && l.title.includes(stLabel))) {
        const moveTimestamp = safeParseTimestamp(editingTask.lastMovedAt, Date.now());
        list.push({
          id: `synth-status-${editingTask.id}`,
          type: 'status',
          user: currentUser?.name || editingTask.assigneeName || 'Equipe',
          userInitials: currentUser?.initials || editingTask.assigneeInitials || 'EQ',
          title: `Status atual: "${stLabel}"`,
          details: `Movida para a coluna ${stLabel}`,
          date: safeFormatISO(moveTimestamp),
          rawTimestamp: moveTimestamp,
        });
      }
    }

    return list.sort((a, b) => b.rawTimestamp - a.rawTimestamp);
  }, [editingTask, attachments, referenceImages, spineStatuses, currentUser]);

  const prevIsOpenRef = useRef(false);
  const prevEditingTaskIdRef = useRef<string | null>(null);

  useEffect(() => {
    const justOpened = isOpen && !prevIsOpenRef.current;
    const taskChanged = editingTask?.id !== prevEditingTaskIdRef.current;

    if (justOpened || taskChanged) {
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
          setTaskMembers(editingTask.members);
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
        setFormData({
          title: '',
          description: '',
          category: '',
          assigneeId: employees[0]?.id || 'unassigned',
          projectId: projects[0]?.id || '',
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
        setTaskMembers([]);
        setIsEditingDescription(true);
        setReferenceImages([]);
        setComments([]);
        setAttachments([]);
      }
    }

    prevIsOpenRef.current = isOpen;
    prevEditingTaskIdRef.current = editingTask?.id || null;
  }, [isOpen, editingTask?.id]);

  const handleAddComment = async (e?: React.FormEvent | React.MouseEvent | React.KeyboardEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!editingTask || !newCommentText.trim()) return;

    setIsPostingComment(true);
    const newComment: TaskComment = {
      id: `comment-${Date.now()}`,
      authorName: currentUser?.name || 'Usuário',
      authorInitials: currentUser?.initials || 'U',
      text: newCommentText.trim(),
      date: new Date().toISOString(),
    };
    const nextComments = [newComment, ...comments];
    setComments(nextComments);
    await updateTask(editingTask.id, {
      comments: nextComments,
      status: editingTask.status || formData.status,
    });
    setEditingTask((prev) => (prev ? { ...prev, comments: nextComments, status: prev.status || editingTask.status } : null));
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
          const upRes = await uploadFileToDrive(driveFolderId, file, 'briefing');
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
    if (!formData.title.trim()) return;

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

    const taskPayload = {
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
      status: formData.status,
      points: Number(formData.points) || 1,
      isFlagged: formData.isFlagged,
      labels: labelsPayload,
      referenceImages,
      attachments,
      comments,
      coverImageUrl: resolvedCover,
      driveFolderId: currentDriveFolderId,
      driveFolderUrl: currentDriveFolderUrl,
    };

    if (editingTask) {
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
    handleUploadReferenceImage,
    handleDeleteReferenceImage,
    handleSubmit,
  };
};
