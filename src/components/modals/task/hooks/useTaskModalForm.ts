import { useState, useEffect, useRef, useMemo } from 'react';
import { Task, Employee, Project, Sprint, TaskMember, SpineStatusConfig, TrelloAttachment, TrelloComment, TaskStatus } from '../../../../types';
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
  trelloSettings,
  trelloLabels,
  currentUser,
  fetchTrelloCardComments,
  fetchTrelloCardAttachments,
  addTrelloComment,
  deleteTrelloComment,
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
  trelloSettings: any;
  trelloLabels: any[];
  currentUser: any;
  fetchTrelloCardComments: (id: string) => Promise<TrelloComment[]>;
  fetchTrelloCardAttachments: (id: string) => Promise<TrelloAttachment[]>;
  addTrelloComment: (id: string, text: string) => Promise<boolean>;
  deleteTrelloComment: (id: string, commentId: string) => Promise<boolean>;
  addTask: (task: any) => Promise<void> | void;
  updateTask: (id: string, updates: any) => Promise<void> | void;
  setIsNewTaskModalOpen: (open: boolean) => void;
  addToast: (title: string, message?: string, type?: any) => void;
}) => {
  const [activeDrawerTab, setActiveDrawerTab] = useState<'details' | 'attachments' | 'history'>('details');
  const [trelloActions, setTrelloActions] = useState<any[]>([]);
  const [loadingActions, setLoadingActions] = useState(false);

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

  const [comments, setComments] = useState<TrelloComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);

  const [attachments, setAttachments] = useState<TrelloAttachment[]>([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
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
  const [customLabelsList, setCustomLabelsList] = useState(DEFAULT_CLIENT_LABELS);

  useEffect(() => {
    if (trelloLabels && trelloLabels.length > 0) {
      const colorMap: Record<string, string> = {
        green: '#0D3827',
        yellow: '#4A3700',
        orange: '#5C2700',
        red: '#5E1410',
        purple: '#2D1E5E',
        blue: '#002B66',
        sky: '#00374C',
        lime: '#26360F',
        pink: '#4A1937',
        black: '#131B29',
      };

      const trelloFormatted = trelloLabels
        .filter((l) => l.name && l.name.trim().length > 0)
        .map((l) => {
          const upper = (l.name || '').toUpperCase().trim();
          let hex = colorMap[l.color] || '#0D3827';
          if (upper.includes('GALERA')) hex = '#002B66';
          if (upper.includes('F12')) hex = '#0D3827';
          if (upper.includes('LUVA')) hex = '#2D1E5E';
          if (upper.includes('BRASIL')) hex = '#0A3D2E';

          return {
            id: l.id,
            name: upper,
            color: l.color || 'green',
            hex,
          };
        });

      const seen = new Set<string>();
      const merged: any[] = [];
      [...DEFAULT_CLIENT_LABELS, ...trelloFormatted].forEach((lbl) => {
        const key = lbl.name.toLowerCase().trim();
        if (!seen.has(key)) {
          seen.add(key);
          merged.push(lbl);
        }
      });
      setCustomLabelsList(merged);
    }
  }, [trelloLabels]);

  const handleShareTask = async () => {
    if (!editingTask) return;
    const taskUrl = `${window.location.origin}${window.location.pathname}?task=${encodeURIComponent(editingTask.id)}`;
    try {
      if (navigator.clipboard && window.isSecureContext) {
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

  // Fetch Trello Actions for Trello Cards
  useEffect(() => {
    if (editingTask && activeDrawerTab === 'history' && editingTask.id && editingTask.id.startsWith('trello-')) {
      const cardId = editingTask.id.replace('trello-', '');
      const key = trelloSettings?.apiKey;
      const token = trelloSettings?.serverToken;
      if (key && token) {
        setLoadingActions(true);
        fetch(`https://api.trello.com/1/cards/${cardId}/actions?key=${key}&token=${token}&limit=50&filter=all`)
          .then((res) => (res.ok ? res.json() : []))
          .then((data) => {
            setTrelloActions(Array.isArray(data) ? data : []);
            setLoadingActions(false);
          })
          .catch(() => setLoadingActions(false));
      }
    }
  }, [editingTask?.id, activeDrawerTab, trelloSettings?.apiKey, trelloSettings?.serverToken]);

  // Unified Timeline Calculation
  const timelineActions = useMemo(() => {
    if (!editingTask) return [];

    const list: TimelineActionItem[] = [];

    if (trelloActions && trelloActions.length > 0) {
      trelloActions.forEach((act) => {
        const creator = act.memberCreator?.fullName || act.memberCreator?.username || 'Usuário';
        const initials = act.memberCreator?.initials || creator.slice(0, 2).toUpperCase();
        const avatarUrl = act.memberCreator?.avatarUrl ? `${act.memberCreator.avatarUrl}/50.png` : undefined;
        const rawTimestamp = safeParseTimestamp(act.date);
        const dateStr = safeFormatISO(act.date);

        let title = 'Ação registrada';
        let details = '';
        let type: any = 'general';

        if (act.type === 'createCard') {
          title = 'Demanda criada no Trello';
          details = `Criada na coluna/lista "${act.data?.list?.name || 'Backlog'}"`;
          type = 'created';
        } else if (act.type === 'updateCard' && act.data?.listAfter) {
          title = `Status alterado para "${act.data.listAfter.name}"`;
          details = `Movido de "${act.data.listBefore?.name || 'Status anterior'}"`;
          type = 'status';
        } else if (act.type === 'updateCard' && act.data?.old?.name) {
          title = 'Título da demanda alterado';
          details = `De: "${act.data.old.name}" → Para: "${act.data.card?.name || ''}"`;
          type = 'edited';
        } else if (act.type === 'updateCard' && act.data?.old?.desc !== undefined) {
          title = 'Descrição / Briefing alterado';
          details = 'O texto de descrição da demanda foi atualizado';
          type = 'edited';
        } else if (act.type === 'commentCard') {
          title = 'Comentário adicionado';
          details = act.data?.text || '';
          type = 'comment';
        } else if (act.type === 'addMemberToCard') {
          title = `Membro adicionado: ${act.member?.fullName || 'Membro'}`;
          type = 'member';
        } else if (act.type === 'removeMemberFromCard') {
          title = `Membro removido: ${act.member?.fullName || 'Membro'}`;
          type = 'member';
        } else if (act.type === 'addAttachmentToCard') {
          title = `Upload de arquivo entregue: ${act.data?.attachment?.name || 'Arquivo'}`;
          type = 'file';
        } else {
          title = act.type === 'updateCard' ? 'Demanda atualizada' : act.type;
        }

        list.push({
          id: act.id,
          type,
          user: creator,
          userInitials: initials,
          avatarUrl,
          title,
          details,
          date: dateStr,
          rawTimestamp,
        });
      });
    }

    if (editingTask.activityLog && editingTask.activityLog.length > 0) {
      editingTask.activityLog.forEach((log) => {
        const rawTimestamp = safeParseTimestamp(log.timestamp);
        list.push({
          id: log.id,
          type: (log.type === 'edited' ? 'edited' : log.type === 'status_changed' ? 'status' : 'general') as any,
          user: log.user || 'Usuário',
          userInitials: log.userInitials || 'US',
          avatarUrl: log.avatarUrl,
          title: log.description || log.title || 'Modificação registrada',
          details: log.details || '',
          date: safeFormatISO(log.timestamp),
          rawTimestamp,
        });
      });
    }

    if (!list.some((l) => l.type === 'created')) {
      const createdTime = safeParseTimestamp(editingTask.createdAt, Date.now() - 3600000);
      list.push({
        id: `synth-created-${editingTask.id}`,
        type: 'created',
        user: editingTask.assigneeName || currentUser?.name || 'Administrador',
        userInitials: editingTask.assigneeInitials || currentUser?.initials || 'AD',
        title: 'Demanda criada no sistema',
        details: `Título: "${editingTask.title}" • Projeto: ${editingTask.projectName || 'Geral'}`,
        date: safeFormatISO(createdTime),
        rawTimestamp: createdTime,
      });
    }

    if (attachments && attachments.length > 0) {
      attachments.forEach((att, idx) => {
        if (!list.some((l) => l.title.includes(att.name))) {
          const fileDate = safeParseTimestamp(att.date, Date.now() - (idx + 1) * 60000);
          list.push({
            id: `synth-att-${att.id || idx}`,
            type: 'file',
            user: editingTask.assigneeName || currentUser?.name || 'Membro',
            userInitials: editingTask.assigneeInitials || currentUser?.initials || 'MB',
            title: `Upload de arquivo entregue: ${att.name}`,
            details: att.bytes ? `Tamanho: ${Math.round(att.bytes / 1024)} KB • Google Drive` : 'Arquivo salvo nos entregues',
            date: safeFormatISO(fileDate),
            rawTimestamp: fileDate,
          });
        }
      });
    }

    if (referenceImages && referenceImages.length > 0) {
      referenceImages.forEach((ref, idx) => {
        if (!list.some((l) => l.title.includes(ref.name))) {
          const refDate = safeParseTimestamp(ref.date, Date.now() - (idx + 2) * 60000);
          list.push({
            id: `synth-ref-${ref.id || idx}`,
            type: 'file',
            user: currentUser?.name || 'Equipe',
            userInitials: currentUser?.initials || 'EQ',
            title: `Imagem de referência adicionada: ${ref.name}`,
            details: 'Anexada ao briefing visual da demanda',
            date: safeFormatISO(refDate),
            rawTimestamp: refDate,
          });
        }
      });
    }

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
  }, [editingTask, trelloActions, attachments, referenceImages, spineStatuses, currentUser]);

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

        if (editingTask.id && editingTask.id.startsWith('trello-')) {
          setLoadingComments(true);
          fetchTrelloCardComments(editingTask.id).then((fetched) => {
            setComments(fetched);
            setLoadingComments(false);
          });

          setLoadingAttachments(true);
          fetchTrelloCardAttachments(editingTask.id).then((fetchedAtts) => {
            setAttachments(fetchedAtts);
            setLoadingAttachments(false);
          });
        } else {
          setComments(editingTask.comments || []);
          setAttachments(editingTask.attachments || []);
        }

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
                const mappedAtts: TrelloAttachment[] = driveDelFiles.map((f) => ({
                  id: f.id,
                  name: f.name,
                  url: f.webContentLink || f.webViewLink || `https://drive.google.com/file/d/${f.id}/view`,
                  mimeType: f.mimeType,
                  bytes: f.size ? Number(f.size) : 0,
                  date: f.createdTime || new Date().toISOString(),
                  previews: f.thumbnailLink ? [{ id: f.id, url: f.thumbnailLink, width: 300, height: 300 }] : [],
                  driveFileId: f.id,
                }));

                setAttachments((prev) => {
                  const map = new Map<string, TrelloAttachment>();
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
    if (editingTask.id && editingTask.id.startsWith('trello-')) {
      const success = await addTrelloComment(editingTask.id, newCommentText.trim());
      if (success) {
        const fresh = await fetchTrelloCardComments(editingTask.id);
        setComments(fresh);
        setNewCommentText('');
      }
    } else {
      const newComment: TrelloComment = {
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
    }
    setIsPostingComment(false);
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!editingTask) return;
    if (window.confirm('Deseja excluir seu comentário?')) {
      if (editingTask.id && editingTask.id.startsWith('trello-')) {
        await deleteTrelloComment(editingTask.id, commentId);
      }
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
          addToast('Enviando para o Drive ☁️', `Fazendo upload de "${file.name}"...`, 'info');
          const uploadRes = await uploadFileToDrive(file, driveFolderId, 'reference');
          if (uploadRes) {
            driveFileId = uploadRes.id;
            addToast('Upload Concluído 🚀', `"${file.name}" salvo no Google Drive.`, 'success');
          }
        }
      } catch (driveErr) {
        console.warn('Google drive upload error:', driveErr);
      } finally {
        setIsUploadingReference(false);
        setUploadingReferenceName('');
      }

      const permanentUrl = driveFileId
        ? `https://drive.google.com/thumbnail?id=${driveFileId}&sz=w1000`
        : dataUrl;

      const newRef: TaskReferenceImage = {
        id: `ref-${Date.now()}`,
        name: file.name,
        url: permanentUrl,
        date: new Date().toISOString(),
        driveFileId,
      };

      const nextRefs = [...referenceImages, newRef];
      setReferenceImages(nextRefs);

      if (editingTask) {
        updateTask(editingTask.id, {
          referenceImages: nextRefs,
          driveFolderId: driveFolderId || currentDriveFolderId || editingTask.driveFolderId,
          driveFolderUrl: driveFolderUrl || currentDriveFolderUrl || editingTask.driveFolderUrl,
        });
      }
      addToast('Referência Salva', `"${file.name}" vinculada à demanda.`, 'success');
    };
    reader.onerror = () => {
      setIsUploadingReference(false);
      setUploadingReferenceName('');
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteReferenceImage = async (refId: string) => {
    const refImg = referenceImages.find((r) => r.id === refId);
    if (refImg?.driveFileId) {
      try {
        await deleteDriveFolder(refImg.driveFileId);
      } catch (err) {
        console.warn('Failed to delete reference file from drive:', err);
      }
    }
    const nextRefs = referenceImages.filter((r) => r.id !== refId);
    setReferenceImages(nextRefs);
    if (editingTask) {
      updateTask(editingTask.id, { referenceImages: nextRefs });
    }
    addToast('Referência Removida', 'Imagem de referência excluída.', 'info');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    const selectedProj = projects.find((p) => p.id === formData.projectId);
    const primaryMember = taskMembers[0];

    const currentLabels = selectedLabels.length > 0
      ? selectedLabels.map((tagName) => {
          const matched = customLabelsList.find((c) => c.name === tagName || c.color === tagName);
          return {
            id: matched?.id || `lbl-${tagName}`,
            name: tagName,
            color: matched?.color || 'green',
          };
        })
      : formData.category;

    let nextActivityLog = editingTask?.activityLog ? [...editingTask.activityLog] : [];
    const authorName = currentUser?.name || 'Usuário';
    const authorInitials = currentUser?.initials || 'US';
    const nowIso = new Date().toISOString();

    if (editingTask) {
      if (editingTask.title.trim() !== formData.title.trim()) {
        nextActivityLog.unshift({
          id: `act-title-${Date.now()}`,
          type: 'edited',
          user: authorName,
          userInitials: authorInitials,
          description: 'Título da demanda alterado',
          details: `De: "${editingTask.title}" → Para: "${formData.title.trim()}"`,
          timestamp: nowIso,
        });
      }

      if ((editingTask.description || '').trim() !== formData.description.trim()) {
        nextActivityLog.unshift({
          id: `act-desc-${Date.now()}`,
          type: 'edited',
          user: authorName,
          userInitials: authorInitials,
          description: 'Descrição / Briefing alterado',
          details: 'O texto de descrição da demanda foi modificado',
          timestamp: nowIso,
        });
      }

      if (editingTask.status !== formData.status) {
        const stLabel = spineStatuses.find((s) => s.id === formData.status)?.label || formData.status;
        nextActivityLog.unshift({
          id: `act-status-${Date.now()}`,
          type: 'status_changed',
          user: authorName,
          userInitials: authorInitials,
          description: `Status alterado para "${stLabel}"`,
          details: `Movido para a coluna ${stLabel}`,
          timestamp: nowIso,
        });
      }
    }

    const taskPayload = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      category: formData.category,
      labels: currentLabels,
      assigneeId: primaryMember ? primaryMember.id : 'unassigned',
      assigneeName: primaryMember ? primaryMember.name : 'Sem membro',
      assigneeInitials: primaryMember ? primaryMember.initials : 'SM',
      members: taskMembers,
      projectId: formData.projectId,
      projectName: selectedProj ? selectedProj.name : 'General',
      sprintId: formData.sprintId,
      dueDate: formData.dueDate,
      deliveredAt: formData.deliveredAt || '',
      status: formData.status,
      points: Number(formData.points) || 1,
      isFlagged: formData.isFlagged,
      referenceImages,
      driveFolderId: currentDriveFolderId,
      driveFolderUrl: currentDriveFolderUrl,
      activityLog: nextActivityLog,
    };

    if (editingTask) {
      await updateTask(editingTask.id, taskPayload);
      addToast('Alterações Salvas! ✅', `Tarefa "${taskPayload.title}" atualizada no Sistema, Supabase e Trello.`, 'success');
    } else {
      await addTask(taskPayload);
    }

    handleClose();
  };

  return {
    activeDrawerTab,
    setActiveDrawerTab,
    trelloActions,
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
