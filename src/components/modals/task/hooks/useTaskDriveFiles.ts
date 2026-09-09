import { useState } from 'react';
import { Task, TaskAttachment } from '../../../../types';
import {
  createDriveFolder,
  uploadFileToDrive,
  deleteDriveFolder,
  getTaskDeliveredFolderUrl,
} from '../../../../lib/googleDrive';
import { fetchFileAsBytes, triggerBlobDownload } from '../../../../lib/zipUtils';

export const useTaskDriveFiles = ({
  editingTask,
  currentDriveFolderId,
  setCurrentDriveFolderId,
  currentDriveFolderUrl,
  setCurrentDriveFolderUrl,
  attachments,
  setAttachments,
  updateTask,
  setEditingTask,
  addToast,
}: {
  editingTask: Task | null;
  currentDriveFolderId: string;
  setCurrentDriveFolderId: (id: string) => void;
  currentDriveFolderUrl: string;
  setCurrentDriveFolderUrl: (url: string) => void;
  attachments: TaskAttachment[];
  setAttachments: React.Dispatch<React.SetStateAction<TaskAttachment[]>>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  setEditingTask: React.Dispatch<React.SetStateAction<Task | null>>;
  addToast: (title: string, message?: string, type?: any) => void;
}) => {
  const [selectedAttachmentFiles, setSelectedAttachmentFiles] = useState<File[]>([]);
  const [isPostingAttachment, setIsPostingAttachment] = useState(false);
  const [uploadTotalCount, setUploadTotalCount] = useState(0);
  const [uploadProgressCount, setUploadProgressCount] = useState(0);
  const [openingDriveFolder, setOpeningDriveFolder] = useState(false);
  const [deletingFileIds, setDeletingFileIds] = useState<string[]>([]);
  const [openAttachmentMenuId, setOpenAttachmentMenuId] = useState<string | null>(null);

  const handleUploadSelectedFileAttachment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editingTask || selectedAttachmentFiles.length === 0) return;

    setIsPostingAttachment(true);
    setUploadTotalCount(selectedAttachmentFiles.length);
    setUploadProgressCount(0);
    let nextAtts = [...attachments];
    let driveFolderId = currentDriveFolderId || editingTask.driveFolderId || '';
    let driveFolderUrl = currentDriveFolderUrl || editingTask.driveFolderUrl || '';

    try {
      const taskName = editingTask.title || 'Demanda Sem Nome';
      if (!driveFolderId) {
        addToast('Google Drive 📁', `Criando pasta "${taskName}" no Drive...`, 'info');
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
    } catch (err) {
      console.warn('Google drive folder creation error:', err);
    }

    const createdAttachments: TaskAttachment[] = [];

    for (const file of selectedAttachmentFiles) {
      try {
        const isPsd =
          file.name.toLowerCase().endsWith('.psd') ||
          file.name.toLowerCase().endsWith('.psb') ||
          file.type === 'image/vnd.adobe.photoshop' ||
          file.type.includes('photoshop');

        let driveFileId = '';
        if (driveFolderId) {
          addToast('Enviando para o Drive ☁️', `Fazendo upload de "${file.name}"...`, 'info');
          const uploadRes = await uploadFileToDrive(file, driveFolderId, isPsd ? 'psd' : 'final');
          if (uploadRes) {
            driveFileId = uploadRes.id;
            addToast('Upload Concluído 🚀', `"${file.name}" salvo na pasta ${isPsd ? 'PSD' : 'Arquivos Entregues'}.`, 'success');
          }
        }

        const isImg = !isPsd && (file.type.startsWith('image/') || Boolean(file.name.match(/\.(png|jpg|jpeg|gif|webp|svg)$/i)));
        let localDataUrl = '';
        if (isImg) {
          localDataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (ev) => resolve(ev.target?.result as string || '');
            reader.onerror = () => resolve('');
            reader.readAsDataURL(file);
          });
        }

        const newAtt: TaskAttachment = {
          id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          url: driveFileId
            ? `https://drive.google.com/file/d/${driveFileId}/view`
            : localDataUrl || '',
          driveFileId: driveFileId || undefined,
          thumbnailUrl: localDataUrl || (driveFileId ? `https://lh3.googleusercontent.com/d/${driveFileId}` : ''),
          bytes: file.size,
          mimeType: file.type,
          isUpload: true,
        };
        createdAttachments.push(newAtt);
      } catch (uploadErr) {
        console.error('Falha ao subir arquivo individual:', file.name, uploadErr);
        addToast('Erro no Upload ❌', `Falha ao enviar "${file.name}".`, 'error');
      } finally {
        setUploadProgressCount((prev) => prev + 1);
      }
    }

    if (createdAttachments.length > 0) {
      setAttachments((prev) => [...createdAttachments, ...prev]);

      if (editingTask) {
        const nextAttachments = [...createdAttachments, ...attachments];
        updateTask(editingTask.id, {
          attachments: nextAttachments,
          driveFolderId,
          driveFolderUrl,
          hasAttachments: true,
        });
        setEditingTask((prev) =>
          prev
            ? {
                ...prev,
                attachments: nextAttachments,
                driveFolderId,
                driveFolderUrl,
                hasAttachments: true,
              }
            : null
        );
      }

      addToast(
        'Upload Concluído! 🚀',
        `${createdAttachments.length} arquivo(s) salvos com sucesso.`,
        'success'
      );
    }

    setSelectedAttachmentFiles([]);
    setIsPostingAttachment(false);
    setUploadTotalCount(0);
    setUploadProgressCount(0);
  };

  const handleOpenDeliveredFolder = async () => {
    if (!editingTask) return;
    try {
      setOpeningDriveFolder(true);
      let targetUrl = currentDriveFolderUrl;

      if (!targetUrl && currentDriveFolderId) {
        targetUrl = `https://drive.google.com/drive/folders/${currentDriveFolderId}`;
      }

      if (!targetUrl) {
        targetUrl = await getTaskDeliveredFolderUrl(editingTask);
      }

      if (targetUrl) {
        window.open(targetUrl, '_blank', 'noopener,noreferrer');
        return;
      }

      const newTab = window.open('about:blank', '_blank');
      const folder = await createDriveFolder(editingTask.title, editingTask.code);
      setCurrentDriveFolderId(folder.id);
      setCurrentDriveFolderUrl(folder.url);

      updateTask(editingTask.id, {
        driveFolderId: folder.id,
        driveFolderUrl: folder.url,
      });

      if (newTab) {
        newTab.location.href = folder.url;
      } else {
        window.open(folder.url, '_blank', 'noopener,noreferrer');
      }
      addToast('Pasta Criada', 'Pasta criada no Google Drive com sucesso.', 'success');
    } catch (err) {
      console.error('Erro ao abrir pasta no Drive:', err);
      addToast('Erro ao abrir pasta', 'Verifique a conexão com o Google Drive.', 'error');
    } finally {
      setOpeningDriveFolder(false);
    }
  };

  const handleDownloadSingleFile = async (att: TaskAttachment) => {
    addToast('Baixando 📥', `Iniciando download de "${att.name}"...`, 'info');
    const extractDriveId = (item: TaskAttachment): string | null => {
      if (item.driveFileId) return item.driveFileId;
      if (!item.url) return null;
      const matchId = item.url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      if (matchId) return matchId[1];
      const matchFileD = item.url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      if (matchFileD) return matchFileD[1];
      const matchD = item.url.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (matchD) return matchD[1];
      return null;
    };
    const driveFileId = extractDriveId(att);
    const candidates: string[] = [];
    if (att.thumbnailUrl && att.thumbnailUrl.startsWith('data:')) candidates.push(att.thumbnailUrl);
    if (att.url && att.url.startsWith('data:')) candidates.push(att.url);
    if (driveFileId) {
      candidates.push(`https://lh3.googleusercontent.com/d/${driveFileId}`);
      candidates.push(`https://drive.google.com/uc?export=download&id=${driveFileId}`);
    }
    if (att.thumbnailUrl && !att.thumbnailUrl.startsWith('data:')) candidates.push(att.thumbnailUrl);
    if (att.url && !att.url.startsWith('data:')) candidates.push(att.url);

    let bytes: Uint8Array | null = null;
    for (const c of candidates) {
      bytes = await fetchFileAsBytes(c);
      if (bytes && bytes.length > 0) break;
    }

    let fileName = att.name || 'arquivo_entregue.png';
    if (!fileName.includes('.')) fileName += '.png';

    if (bytes && bytes.length > 0) {
      const blob = new Blob([bytes]);
      triggerBlobDownload(blob, fileName);
      addToast('Download Concluído 🎉', `"${fileName}" baixado com sucesso!`, 'success');
    } else {
      const fallback = driveFileId ? `https://drive.google.com/uc?export=download&id=${driveFileId}` : att.url;
      const a = document.createElement('a');
      a.href = fallback;
      a.download = fileName;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handleRenameAttachment = async (attId: string, currentName: string) => {
    const newName = window.prompt('Digite o novo nome do arquivo:', currentName);
    if (!newName || !newName.trim() || newName.trim() === currentName) return;
    const nextAtts = attachments.map((a) => (a.id === attId ? { ...a, name: newName.trim() } : a));
    setAttachments(nextAtts);
    if (editingTask) {
      await updateTask(editingTask.id, { attachments: nextAtts });
    }
    addToast('Nome Alterado ✅', `Arquivo renomeado para "${newName.trim()}".`, 'success');
  };

  const handleToggleCoverImage = async (imgUrl: string) => {
    if (!editingTask) return;
    const isCurrent = editingTask.coverImageUrl === imgUrl;
    const nextCover = isCurrent ? '' : imgUrl;
    setEditingTask((prev) => (prev ? { ...prev, coverImageUrl: nextCover } : null));
    await updateTask(editingTask.id, { coverImageUrl: nextCover });
    addToast(
      isCurrent ? 'Capa Removida' : 'Capa Definida 🖼️',
      isCurrent ? 'A imagem de capa do card da tarefa foi removida.' : 'Imagem definida como capa do card da tarefa no quadro!',
      'success'
    );
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!editingTask || deletingFileIds.includes(attachmentId)) return;
    setDeletingFileIds((prev) => [...prev, attachmentId]);

    try {
      const target = attachments.find((a) => a.id === attachmentId);
      if (target && target.url) {
        const match = target.url.match(/[?&]id=([^&]+)/);
        const driveFileId = match ? match[1] : null;
        if (driveFileId) {
          try {
            await deleteDriveFolder(driveFileId);
          } catch (err) {
            console.warn('Failed to delete file from drive:', err);
          }
        }
      }

      const nextAtts = attachments.filter((a) => a.id !== attachmentId);
      setAttachments(nextAtts);
      await updateTask(editingTask.id, { attachments: nextAtts });
      addToast('Anexo Removido', 'Arquivo excluído dos entregues.', 'info');
    } finally {
      setDeletingFileIds((prev) => prev.filter((id) => id !== attachmentId));
    }
  };

  return {
    selectedAttachmentFiles,
    setSelectedAttachmentFiles,
    isPostingAttachment,
    uploadTotalCount,
    uploadProgressCount,
    openingDriveFolder,
    deletingFileIds,
    setDeletingFileIds,
    openAttachmentMenuId,
    setOpenAttachmentMenuId,
    handleUploadSelectedFileAttachment,
    handleOpenDeliveredFolder,
    handleDownloadSingleFile,
    handleRenameAttachment,
    handleToggleCoverImage,
    handleDeleteAttachment,
  };
};
