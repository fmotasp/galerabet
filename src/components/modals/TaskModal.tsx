import React, { useState, useEffect } from 'react';
import {
  X,
  Trash2,
  Calendar,
  Tag,
  Flag,
  MessageSquare,
  Send,
  Paperclip,
  ExternalLink,
  Image as ImageIcon,
  FileText,
  Plus,
  Bold,
  Italic,
  Heading1,
  List,
  ListOrdered,
  Check,
  Edit2,
  Search,
  ArrowLeft,
  Type,
  Strikethrough,
  Link as LinkIcon,
  Code,
  Folder,
  History,
  Clock,
  Activity,
  PlusCircle,
  ArrowRight,
  CheckCircle2,
  UserCheck,
  Download,
  Loader2,
  Archive,
  MoreHorizontal,
  MoreVertical,
  Share2,
  ChevronDown,
  Building2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  createDriveFolder,
  uploadFileToDrive,
  listDriveFolderFiles,
  listTaskBriefingFiles,
  listTaskDeliveredFiles,
  deleteDriveFolder,
  getTaskDeliveredFolderUrl,
  getTaskBriefingFolderUrl,
  GOOGLE_DRIVE_CONFIG,
} from '../../lib/googleDrive';
import { getTaskOverdueDays } from '../../lib/taskDateUtils';
import { createZipBlob, fetchFileAsBytes, triggerBlobDownload } from '../../lib/zipUtils';

// Convert Markdown to HTML for WYSIWYG Editor and Formatted View
const markdownToHtml = (md: string = ''): string => {
  if (!md) return '';
  let html = md;

  // Code blocks
  html = html.replace(/```([\s\S]*?)```/g, '<pre class="bg-slate-800 text-slate-100 p-3 rounded-xl text-xs font-mono my-2 overflow-x-auto">$1</pre>');
  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3 class="text-sm font-extrabold text-slate-900 dark:text-white mt-3 mb-1">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 class="text-base font-extrabold text-slate-900 dark:text-white mt-4 mb-1.5">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 class="text-lg font-black text-slate-900 dark:text-white mt-4 mb-2">$1</h1>');

  // Bold & Italic (handles bold even before colons e.g. **Arte:**, **Briefing:**)
  html = html.replace(/\*\*\*([^*]+?)\*\*\*/g, '<b><i>$1</i></b>');
  html = html.replace(/\*\*([^*]+?)\*\*/g, '<strong class="font-black text-slate-900 dark:text-white">$1</strong>');
  html = html.replace(/\*([^*]+?)\*/g, '<em class="italic">$1</em>');
  html = html.replace(/~~(.*?)~~/g, '<strike class="line-through text-slate-400">$1</strike>');

  // Images & Links
  html = html.replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" style="max-width:100%; border-radius: 12px; margin: 8px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1);" />');
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-indigo-600 hover:text-indigo-800 font-bold underline">$1</a>');

  // Bullet lists (- item or * item)
  html = html.replace(/^\s*[-*]\s+(.*$)/gim, '<div class="flex items-start gap-2 my-0.5"><span class="text-indigo-500 font-bold">•</span><span>$1</span></div>');

  // Line breaks to <br />
  html = html.replace(/\n/g, '<br />');

  return html;
};

// Convert HTML from WYSIWYG Editor to Markdown for Trello
const htmlToMarkdown = (html: string = ''): string => {
  if (!html) return '';
  let md = html;

  md = md.replace(/<br\s*[\/]?>/gi, '\n');
  md = md.replace(/<div>/gi, '\n').replace(/<\/div>/gi, '');
  md = md.replace(/<p>/gi, '').replace(/<\/p>/gi, '\n');

  md = md.replace(/<h1>(.*?)<\/h1>/gi, '# $1\n');
  md = md.replace(/<h2>(.*?)<\/h2>/gi, '## $1\n');
  md = md.replace(/<h3>(.*?)<\/h3>/gi, '### $1\n');

  md = md.replace(/<b><i>(.*?)<\/i><\/b>/gi, '***$1***');
  md = md.replace(/<b>(.*?)<\/b>/gi, '**$1**');
  md = md.replace(/<strong>(.*?)<\/strong>/gi, '**$1**');
  md = md.replace(/<i>(.*?)<\/i>/gi, '*$1*');
  md = md.replace(/<em>(.*?)<\/em>/gi, '*$1*');
  md = md.replace(/<strike>(.*?)<\/strike>/gi, '~~$1~~');
  md = md.replace(/<del>(.*?)<\/del>/gi, '~~$1~~');

  md = md.replace(/<a\s+[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)');
  md = md.replace(/<img\s+[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*\/?>/gi, '![$2]($1)');
  md = md.replace(/<img\s+[^>]*src="([^"]*)"[^>]*\/?>/gi, '![Imagem]($1)');

  md = md.replace(/<li>(.*?)<\/li>/gi, '- $1\n');
  md = md.replace(/<ul>/gi, '').replace(/<\/ul>/gi, '');
  md = md.replace(/<ol>/gi, '').replace(/<\/ol>/gi, '');

  md = md.replace(/<[^>]+>/g, '');

  return md.trim();
};

const RichTextEditor: React.FC<{
  value: string;
  onChange: (markdown: string) => void;
  placeholder?: string;
}> = ({ value, onChange, placeholder }) => {
  const editorRef = React.useRef<HTMLDivElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const isInternalChange = React.useRef(false);

  React.useEffect(() => {
    if (editorRef.current && !isInternalChange.current) {
      editorRef.current.innerHTML = markdownToHtml(value);
    }
    isInternalChange.current = false;
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      isInternalChange.current = true;
      const html = editorRef.current.innerHTML;
      const md = htmlToMarkdown(html);
      onChange(md);
    }
  };

  const exec = (command: string, arg?: string) => {
    document.execCommand(command, false, arg);
    handleInput();
  };

  const toggleCase = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const selectedText = selection.toString();
    if (!selectedText) return;

    const isUpper = selectedText === selectedText.toUpperCase();
    const newText = isUpper ? selectedText.toLowerCase() : selectedText.toUpperCase();

    document.execCommand('insertText', false, newText);
    handleInput();
  };

  const addLink = () => {
    const url = prompt('Digite a URL do link:');
    if (url) exec('createLink', url);
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          exec('insertImage', result);
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const addImage = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="rounded-2xl overflow-hidden border border-[#2E2E2E] focus-within:border-[#E4007E] transition-all bg-[#1C1C1C]">
      {/* Hidden File Input for Local Images */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleImageFileChange}
        className="hidden"
      />
      <div className="flex items-center flex-wrap gap-1 p-2 bg-[#181818] border-b border-[#2E2E2E] text-slate-200 select-none">
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            exec('formatBlock', '<h1>');
          }}
          className="p-1.5 hover:bg-[#282828] hover:text-[#E4007E] rounded-lg font-bold text-xs transition-colors flex items-center gap-0.5"
          title="Título H1"
        >
          <Heading1 className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            toggleCase();
          }}
          className="px-2 py-1 hover:bg-[#282828] hover:text-[#E4007E] rounded-lg font-bold text-xs transition-colors flex items-center gap-0.5 bg-[#222222]"
          title="Alternar MAIÚSCULO / Normal"
        >
          <Type className="w-3.5 h-3.5" />
          <span className="text-[10px] font-black">Tt</span>
        </button>

        <div className="h-4 w-px bg-[#2E2E2E] mx-0.5" />

        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            exec('bold');
          }}
          className="p-1.5 hover:bg-[#282828] hover:text-[#E4007E] rounded-lg font-bold text-xs transition-colors"
          title="Negrito"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            exec('italic');
          }}
          className="p-1.5 hover:bg-[#282828] hover:text-[#E4007E] rounded-lg font-bold text-xs transition-colors"
          title="Itálico"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            exec('strikeThrough');
          }}
          className="p-1.5 hover:bg-[#282828] hover:text-[#E4007E] rounded-lg font-bold text-xs transition-colors"
          title="Tachado"
        >
          <Strikethrough className="w-3.5 h-3.5" />
        </button>

        <div className="h-4 w-px bg-[#2E2E2E] mx-0.5" />

        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            exec('insertUnorderedList');
          }}
          className="p-1.5 hover:bg-[#282828] hover:text-[#E4007E] rounded-lg font-bold text-xs transition-colors"
          title="Lista com Marcadores"
        >
          <List className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            exec('insertOrderedList');
          }}
          className="p-1.5 hover:bg-[#282828] hover:text-[#E4007E] rounded-lg font-bold text-xs transition-colors"
          title="Lista Numerada"
        >
          <ListOrdered className="w-3.5 h-3.5" />
        </button>

        <div className="h-4 w-px bg-[#2E2E2E] mx-0.5" />

        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            addLink();
          }}
          className="p-1.5 hover:bg-[#282828] hover:text-[#E4007E] rounded-lg font-bold text-xs transition-colors"
          title="Inserir Link"
        >
          <LinkIcon className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            addImage();
          }}
          className="p-1.5 hover:bg-[#282828] rounded-lg font-bold text-xs transition-colors flex items-center gap-1 text-[#E4007E]"
          title="Anexar Imagem do Seu Computador"
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span className="text-[10px] font-bold">Imagem</span>
        </button>

        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            exec('formatBlock', '<pre>');
          }}
          className="p-1.5 hover:bg-[#282828] hover:text-[#E4007E] rounded-lg font-bold text-xs transition-colors"
          title="Bloco de Código"
        >
          <Code className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Editable Canvas */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="w-full min-h-[140px] max-h-[300px] overflow-y-auto p-3 text-xs text-white focus:outline-none leading-relaxed bg-[#1C1C1C]"
        data-placeholder={placeholder || 'Escreva a descrição da tarefa...'}
      />
    </div>
  );
};

const TrelloInlineImage: React.FC<{
  rawUrl: string;
  alt: string;
  apiKey?: string;
  serverToken?: string;
  attachments?: TrelloAttachment[];
}> = ({ rawUrl, alt, apiKey, serverToken, attachments }) => {
  const [blobUrl, setBlobUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    const loadTrelloImage = async () => {
      setLoading(true);
      setHasError(false);

      let cleanUrl = rawUrl.replace(/\\_/g, '_').trim();
      if (cleanUrl.endsWith(')')) cleanUrl = cleanUrl.slice(0, -1);

      // Extract card ID and attachment ID from URL if present
      // Example: https://trello.com/1/cards/6a80e5212a2f72a076c467a0/attachments/6a80eb904ba2b1f4aa77f8ec/...
      const cardAttMatch = cleanUrl.match(/\/cards\/([a-f0-9]{24})\/attachments\/([a-f0-9]{24})/i);

      if (cardAttMatch && apiKey && serverToken) {
        const cardId = cardAttMatch[1];
        const attId = cardAttMatch[2];

        try {
          // Query Trello REST API for attachment details (returns public Amazon S3 CDN URL)
          const attRes = await fetch(
            `https://api.trello.com/1/cards/${cardId}/attachments/${attId}?key=${apiKey}&token=${serverToken}`
          );
          if (attRes.ok) {
            const attData = await attRes.json();
            let cdnUrl = '';
            if (attData.previews && attData.previews.length > 0) {
              cdnUrl = attData.previews[attData.previews.length - 1].url;
            } else if (attData.url) {
              cdnUrl = attData.url;
            }

            if (cdnUrl && isMounted) {
              // Try fetching blob for CDN URL or use direct CDN URL
              try {
                const bRes = await fetch(cdnUrl);
                if (bRes.ok) {
                  const blob = await bRes.blob();
                  const objectUrl = URL.createObjectURL(blob);
                  if (isMounted) {
                    setBlobUrl(objectUrl);
                    setLoading(false);
                    return;
                  }
                }
              } catch (e) {
                // If blob fetch fails, use cdnUrl directly
                if (isMounted) {
                  setBlobUrl(cdnUrl);
                  setLoading(false);
                  return;
                }
              }
            }
          }
        } catch (e) {
          console.warn('Trello attachment API lookup error:', e);
        }
      }

      // 1. Try matching with loaded attachments list
      const attIdMatch = cleanUrl.match(/\/attachments\/([a-f0-9]{24})\//i);
      const attId = attIdMatch ? attIdMatch[1] : null;

      if (attachments && attachments.length > 0) {
        const found = attachments.find(
          (a) => (attId && a.id === attId) || cleanUrl.includes(a.id)
        );
        if (found && found.previews && found.previews.length > 0) {
          cleanUrl = found.previews[found.previews.length - 1].url;
        } else if (found && found.url) {
          cleanUrl = found.url;
        }
      }

      // Append auth credentials
      if (apiKey && serverToken) {
        if (!cleanUrl.includes('key=')) {
          const sep = cleanUrl.includes('?') ? '&' : '?';
          cleanUrl = `${cleanUrl}${sep}key=${apiKey}&token=${serverToken}`;
        }
      }

      // Replace trello.com with api.trello.com and route via proxy
      let proxiedUrl = cleanUrl.replace('https://trello.com/1/', 'https://api.trello.com/1/');
      if (proxiedUrl.startsWith('https://api.trello.com/')) {
        proxiedUrl = proxiedUrl.replace('https://api.trello.com/', '/trello-api/');
      }

      try {
        const response = await fetch(proxiedUrl);
        if (response.ok) {
          const blob = await response.blob();
          const objectUrl = URL.createObjectURL(blob);
          if (isMounted) {
            setBlobUrl(objectUrl);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn('Blob fetch failed, falling back to direct cleanUrl:', err);
      }

      if (isMounted) {
        setBlobUrl(proxiedUrl);
        setLoading(false);
      }
    };

    loadTrelloImage();

    return () => {
      isMounted = false;
    };
  }, [rawUrl, apiKey, serverToken, attachments]);

  return (
    <div className="my-3 rounded-2xl overflow-hidden border border-slate-200 bg-slate-900/5 shadow-xs p-2 space-y-2 group">
      {loading ? (
        <div className="w-full h-56 bg-slate-100 animate-pulse rounded-xl flex flex-col items-center justify-center gap-2 text-slate-400 text-xs font-semibold">
          <ImageIcon className="w-6 h-6 animate-bounce text-indigo-500" />
          <span>Carregando imagem do Trello...</span>
        </div>
      ) : hasError ? (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center justify-between">
          <span>Não foi possível carregar a imagem.</span>
          <a href={blobUrl} target="_blank" rel="noopener noreferrer" className="font-bold underline">
            Abrir Link
          </a>
        </div>
      ) : (
        <img
          src={blobUrl}
          alt={alt}
          className="w-full max-h-[480px] object-contain rounded-xl bg-white shadow-2xs group-hover:scale-[1.005] transition-transform duration-200"
          onError={() => setHasError(true)}
        />
      )}

      <div className="flex items-center justify-between px-2 pt-1 text-[11px] text-slate-500">
        <span className="font-semibold text-slate-700 truncate">{alt}</span>
        {blobUrl && (
          <a
            href={blobUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 font-bold hover:underline flex items-center gap-1 shrink-0"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Abrir em Alta Resolução</span>
          </a>
        )}
      </div>
    </div>
  );
};

export const TaskModal: React.FC = () => {
  const {
    isNewTaskModalOpen,
    setIsNewTaskModalOpen,
    editingTask,
    setEditingTask,
    addTask,
    updateTask,
    moveTaskStatus,
    deleteTask,
    projects,
    employees,
    currentSprint,
    fetchTrelloCardComments,
    addTrelloComment,
    deleteTrelloComment,
    fetchTrelloCardAttachments,
    addTrelloAttachment,
    deleteTrelloAttachment,
    createTrelloLabel,
    trelloSettings,
    trelloLabels,
    tasks,
    spineStatuses,
    addToast,
    currentUser,
  } = useApp();

  const isOpen = isNewTaskModalOpen || editingTask !== null;

  // Drawer Tabs State
  const [activeDrawerTab, setActiveDrawerTab] = useState<'details' | 'attachments' | 'history'>('details');
  const [trelloActions, setTrelloActions] = useState<any[]>([]);
  const [loadingActions, setLoadingActions] = useState(false);

  // Dynamic Categories from Trello Labels & Tasks
  const availableCategories = Array.from(
    new Set([
      ...tasks.flatMap((t) => (t.category ? t.category.split(', ') : [])),
      ...trelloLabels.map((l) => l.name || l.color),
    ])
  ).filter(Boolean);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Frontend' as TaskCategory,
    assigneeId: employees[0]?.id || '',
    projectId: projects[0]?.id || '',
    sprintId: currentSprint?.id || 'sprint-1',
    dueDate: 'May 12',
    deliveredAt: '',
    status: 'backlog' as TaskStatus,
    points: 5,
    isFlagged: false,
  });

  // Trello comments state
  const [comments, setComments] = useState<TrelloComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);

  // Trello attachments state
  const [attachments, setAttachments] = useState<TrelloAttachment[]>([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const [newAttachmentUrl, setNewAttachmentUrl] = useState('');
  const [newAttachmentName, setNewAttachmentName] = useState('');
  const [isPostingAttachment, setIsPostingAttachment] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [selectedAttachmentFiles, setSelectedAttachmentFiles] = useState<File[]>([]);
  const [currentDriveFolderId, setCurrentDriveFolderId] = useState<string>('');
  const [currentDriveFolderUrl, setCurrentDriveFolderUrl] = useState<string>('');
  const [deletingFileIds, setDeletingFileIds] = useState<string[]>([]);
  const [uploadProgressCount, setUploadProgressCount] = useState(0);
  const [uploadTotalCount, setUploadTotalCount] = useState(0);
  const [openingDriveFolder, setOpeningDriveFolder] = useState(false);
  const [openAttachmentMenuId, setOpenAttachmentMenuId] = useState<string | null>(null);

  // Reference Images State (Imagens de Referência do briefing)
  const [referenceImages, setReferenceImages] = useState<Array<{ id: string; name: string; url: string; date?: string; driveFileId?: string }>>([]);
  const [previewingReference, setPreviewingReference] = useState<{ name: string; url: string } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const referenceFileInputRef = React.useRef<HTMLInputElement>(null);

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

  // Safe date helper functions to prevent RangeError: Invalid time value
  const safeParseTimestamp = (val?: string | number | null, fallback = Date.now()): number => {
    if (!val) return fallback;
    if (typeof val === 'number') {
      return isNaN(val) ? fallback : val;
    }
    if (typeof val === 'string') {
      const trimmed = val.trim();
      // If pt-BR date format like "DD/MM/YYYY" or "DD/MM/YYYY HH:mm:ss"
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
  const timelineActions = React.useMemo(() => {
    if (!editingTask) return [];

    const list: Array<{
      id: string;
      type: 'created' | 'status' | 'file' | 'comment' | 'delivery' | 'member' | 'general' | 'edited';
      user: string;
      userInitials: string;
      avatarUrl?: string;
      title: string;
      details?: string;
      date: string;
      rawTimestamp: number;
    }> = [];

    // 1. Actions from Trello API if card comes from Trello
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

    // 2. Custom local/supabase activity log
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

    // 3. Synthesize Creation action if not in list
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

    // 4. Uploaded Attachments
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

    // 5. Reference images
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

    // 6. Delivered Date (Aprovação)
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

    // 8. Status movement
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
  }, [editingTask, trelloActions, attachments, referenceImages, comments, spineStatuses, currentUser]);

  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const attachmentFileInputRef = React.useRef<HTMLInputElement>(null);

  const insertFormatting = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setFormData((prev) => ({
        ...prev,
        description: (prev.description || '') + before + after,
      }));
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = formData.description || '';
    const selectedText = text.substring(start, end);

    const newText =
      text.substring(0, start) +
      before +
      (selectedText || '') +
      after +
      text.substring(end);

    setFormData((prev) => ({ ...prev, description: newText }));

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        end + before.length
      );
    }, 0);
  };

  // Trello Labels State & Popover
  const [isLabelsPopoverOpen, setIsLabelsPopoverOpen] = useState(false);
  const [labelSearchQuery, setLabelSearchQuery] = useState('');
  const [editingLabelItem, setEditingLabelItem] = useState<{ id?: string; name: string; color: string } | null>(null);

  // Trello Members Popover State
  const [isMembersPopoverOpen, setIsMembersPopoverOpen] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');

  // As 4 etiquetas principais dos clientes solicitados com tons mais escuros para alto contraste
  const DEFAULT_CLIENT_LABELS: Array<{ id: string; name: string; color: string; hex: string }> = [
    { id: 'lbl-galera', name: 'GALERABET', color: 'blue', hex: '#002B66' },
    { id: 'lbl-f12', name: 'F12BET', color: 'green', hex: '#0D3827' },
    { id: 'lbl-luva', name: 'LUVABET', color: 'purple', hex: '#2D1E5E' },
    { id: 'lbl-brasilbet', name: 'BRASILBET', color: 'green', hex: '#0A3D2E' },
  ];

  const [customLabelsList, setCustomLabelsList] = useState<Array<{ id: string; name: string; color: string; hex: string }>>(DEFAULT_CLIENT_LABELS);

  // Sync customLabelsList whenever trelloLabels load
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

      // Merge defaults with trello ones avoiding duplicate names
      const seen = new Set<string>();
      const merged: Array<{ id: string; name: string; color: string; hex: string }> = [];

      // Add matching ones first
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

  // Selected Labels (can select multiple or single)
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);

  // Members state
  const [taskMembers, setTaskMembers] = useState<TaskMember[]>([]);

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

  const prevIsOpenRef = React.useRef(false);
  const prevEditingTaskIdRef = React.useRef<string | null>(null);

  useEffect(() => {
    const justOpened = isOpen && !prevIsOpenRef.current;
    const taskChanged = editingTask?.id !== prevEditingTaskIdRef.current;

    if (justOpened || taskChanged) {
      if (editingTask) {
        setFormData({
          title: editingTask.title || '',
          description: editingTask.description || '',
          category: (editingTask.category as TaskCategory) || 'Geral',
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

        // Inicializa selectedLabels com os clientes atuais da tarefa
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

        // Sincronização em tempo real dos arquivos do Google Drive (Briefing + Entregas)
        const folderId = editingTask.driveFolderId;
        const taskTitle = editingTask.title;

        if (folderId || taskTitle) {
          // 1. Sincronizar imagens da subpasta "Briefing"
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

          // 2. Sincronizar arquivos das subpastas "Arquivos Entregues" e "PSD"
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
          category: '' as TaskCategory,
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

  if (!isOpen) return null;

  const handleClose = () => {
    setIsNewTaskModalOpen(false);
    setEditingTask(null);
    setActiveDrawerTab('details');
  };

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

        const newAtt: TrelloAttachment = {
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
          date: new Date().toISOString(),
        };

        nextAtts.push(newAtt);
      } catch (uploadErr) {
        console.error('Failed to upload file:', file.name, uploadErr);
        addToast('Erro no Upload ❌', `Falha ao enviar "${file.name}".`, 'error');
      } finally {
        setUploadProgressCount((prev) => prev + 1);
      }
    }

    setAttachments(nextAtts);
    await updateTask(editingTask.id, {
      attachments: nextAtts,
      driveFolderId: driveFolderId || currentDriveFolderId || editingTask.driveFolderId,
      driveFolderUrl: driveFolderUrl || currentDriveFolderUrl || editingTask.driveFolderUrl,
    });

    setSelectedAttachmentFiles([]);
    setIsPostingAttachment(false);
    setUploadTotalCount(0);
    setUploadProgressCount(0);
    addToast('Arquivos Salvos', 'Todos os arquivos selecionados foram anexados.', 'success');
  };

  const handleOpenDeliveredFolder = async () => {
    if (!editingTask) return;
    setOpeningDriveFolder(true);
    addToast('Google Drive 📁', 'Abrindo pasta de Arquivos Entregues...', 'info');
    const newTab = window.open('', '_blank');

    try {
      let folderId = currentDriveFolderId || editingTask.driveFolderId;
      let folderUrl = currentDriveFolderUrl || editingTask.driveFolderUrl;

      if (!folderId) {
        const taskName = editingTask.title || formData.title || 'Demanda';
        const folderRes = await createDriveFolder(taskName);
        if (folderRes) {
          folderId = folderRes.id;
          folderUrl = folderRes.webViewLink;
          setCurrentDriveFolderId(folderId);
          setCurrentDriveFolderUrl(folderUrl);
          await updateTask(editingTask.id, {
            driveFolderId: folderId,
            driveFolderUrl: folderUrl,
          });
        }
      }

      if (folderId) {
        const url = await getTaskDeliveredFolderUrl(folderId);
        if (newTab) {
          newTab.location.href = url;
        } else {
          window.open(url, '_blank');
        }
      } else {
        if (newTab) newTab.close();
        addToast('Erro no Drive', 'Não foi possível conectar ao Google Drive.', 'error');
      }
    } catch (err) {
      console.warn('Error navigating to delivered folder:', err);
      if (newTab) newTab.close();
      addToast('Erro ao abrir pasta', 'Verifique a conexão com o Google Drive.', 'error');
    } finally {
      setOpeningDriveFolder(false);
    }
  };

  const handleDownloadSingleFile = async (att: TrelloAttachment) => {
    addToast('Baixando 📥', `Iniciando download de "${att.name}"...`, 'info');
    const extractDriveId = (item: TrelloAttachment): string | null => {
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

  const handleAddAttachment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask || !newAttachmentUrl.trim()) return;

    setIsPostingAttachment(true);
    if (editingTask.id && editingTask.id.startsWith('trello-')) {
      const success = await addTrelloAttachment(
        editingTask.id,
        newAttachmentUrl.trim(),
        newAttachmentName.trim() || undefined
      );
      if (success) {
        const freshAtts = await fetchTrelloCardAttachments(editingTask.id);
        setAttachments(freshAtts);
        setNewAttachmentUrl('');
        setNewAttachmentName('');
      }
    } else {
      const newAtt: TrelloAttachment = {
        id: `att-${Date.now()}`,
        name: newAttachmentName.trim() || newAttachmentUrl.trim(),
        url: newAttachmentUrl.trim(),
        isUpload: false,
        date: new Date().toLocaleDateString('pt-BR'),
      };
      const nextAtts = [...attachments, newAtt];
      setAttachments(nextAtts);
      await updateTask(editingTask.id, { attachments: nextAtts });
      setNewAttachmentUrl('');
      setNewAttachmentName('');
      addToast('Link Salvo', 'Link anexado aos arquivos entregues.', 'success');
    }
    setIsPostingAttachment(false);
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

      if (editingTask.id && editingTask.id.startsWith('trello-')) {
        setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
        await deleteTrelloAttachment(editingTask.id, attachmentId);
      } else {
        const nextAtts = attachments.filter((a) => a.id !== attachmentId);
        setAttachments(nextAtts);
        await updateTask(editingTask.id, { attachments: nextAtts });
        addToast('Anexo Removido', 'Arquivo excluído dos entregues.', 'info');
      }
    } finally {
      setDeletingFileIds((prev) => prev.filter((id) => id !== attachmentId));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    const selectedAssignee = employees.find((e) => e.id === formData.assigneeId);
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

  const formatImageUrl = (rawUrl: string) => {
    if (!rawUrl) return '';
    let cleanUrl = rawUrl.replace(/\\_/g, '_').trim();
    if (cleanUrl.endsWith(')')) cleanUrl = cleanUrl.slice(0, -1);

    const key = trelloSettings.apiKey;
    const token = trelloSettings.serverToken;

    if (key && token && (cleanUrl.includes('trello.com/') || cleanUrl.includes('trello-attachments.s3.amazonaws.com'))) {
      if (!cleanUrl.includes('key=')) {
        const sep = cleanUrl.includes('?') ? '&' : '?';
        cleanUrl = `${cleanUrl}${sep}key=${key}&token=${token}`;
      }
    }
    return cleanUrl;
  };

  const renderFormattedDescription = (text: string = '') => {
    if (!text.trim()) {
      return <span className="text-slate-400 italic text-xs">Sem descrição informada.</span>;
    }

    const htmlContent = markdownToHtml(text);

    return (
      <div
        className="leading-relaxed text-xs text-slate-100 font-medium space-y-1.5 prose-sm max-w-none break-words break-all whitespace-pre-wrap [overflow-wrap:anywhere] [&_b]:font-black [&_strong]:font-black [&_strong]:text-white [&_b]:text-white [&_h1]:text-base [&_h1]:font-black [&_h1]:text-white [&_h2]:text-sm [&_h2]:font-extrabold [&_h2]:text-white [&_h3]:text-xs [&_h3]:font-bold [&_h3]:text-white [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_li]:my-0.5 [&_a]:text-indigo-400 [&_a]:underline"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end overflow-hidden animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-xs transition-opacity duration-300 cursor-pointer"
        onClick={handleClose}
      />

      <div className="relative w-full max-w-2xl lg:max-w-3xl xl:max-w-4xl h-full bg-[#101010] text-white shadow-2xl border-l border-[#2E2E2E] overflow-hidden flex flex-col z-10 animate-in slide-in-from-right duration-300 ease-out">
          {/* Drawer Header */}
          {(() => {
            // Find cover image or first delivered image or first reference image
            const firstImageAttachment = attachments.find((att) => {
              const driveMatch = att.url.match(/[?&]id=([^&]+)/);
              return att.mimeType?.startsWith('image/') ||
                att.name.match(/\.(png|jpg|jpeg|gif|webp|svg)$/i) ||
                att.url.match(/\.(png|jpg|jpeg|gif|webp)(\?.*)?$/i) ||
                (att.previews && att.previews.length > 0) ||
                Boolean(driveMatch);
            });

            let headerCoverImage = editingTask?.coverImageUrl || '';
            if (!headerCoverImage && firstImageAttachment) {
              const driveMatch = firstImageAttachment.url.match(/[?&]id=([^&]+)/);
              if (driveMatch && driveMatch[1]) {
                headerCoverImage = `https://drive.google.com/thumbnail?id=${driveMatch[1]}&sz=w1200`;
              } else {
                headerCoverImage = firstImageAttachment.previews?.[0]?.url || firstImageAttachment.url;
              }
            }
            if (!headerCoverImage && referenceImages && referenceImages.length > 0) {
              const firstRef = referenceImages[0];
              if (firstRef.driveFileId) {
                headerCoverImage = `https://drive.google.com/thumbnail?id=${firstRef.driveFileId}&sz=w1200`;
              } else {
                headerCoverImage = firstRef.url;
              }
            }

            return (
              <div className="relative shrink-0 px-6 pt-5 pb-0 border-b border-slate-800 bg-[#181818] overflow-hidden">
                {/* Cover Image Background Banner with Blue Gradient */}
                {headerCoverImage && (
                  <div className="absolute inset-0 pointer-events-none z-0">
                    <img
                      src={headerCoverImage}
                      alt="Capa da Demanda"
                      className="w-full h-full object-cover object-center opacity-85"
                    />
                    {/* Gradient from deep black on the left to transparent on the right */}
                    <div className="absolute inset-0 bg-gradient-to-r from-[#181818] via-[#181818]/85 to-[#181818]/20" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#181818]/70 via-transparent to-transparent" />
                  </div>
                )}

                <div className="relative z-10">
                  <div className="flex items-center justify-between gap-4 pb-3">
                    <div className="flex-1 min-w-0">
                      {editingTask ? (
                        <input
                          id="input-task-title"
                          type="text"
                          required
                          value={formData.title}
                          onChange={(e) => {
                            const newTitle = e.target.value;
                            setFormData((prev) => ({ ...prev, title: newTitle }));
                          }}
                          className="w-full !bg-transparent !border-0 !border-none !outline-none !ring-0 !shadow-none focus:!ring-0 focus:!outline-none focus:!bg-transparent hover:!bg-transparent p-0 text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow-xs cursor-pointer focus:cursor-text placeholder:text-white/60"
                          style={{ backgroundColor: 'transparent', background: 'transparent', border: 'none', outline: 'none', boxShadow: 'none' }}
                          placeholder="Título da Demanda"
                          title="Clique para editar o título"
                        />
                      ) : (
                        <h2 className="text-xl font-black text-white tracking-tight drop-shadow-xs">
                          Criar Nova Tarefa
                        </h2>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Lado direito na mesma linha do título: Data de Entrega não-editável */}
                      {(() => {
                        const statusLabel = spineStatuses.find((s) => s.id === formData.status)?.label || formData.status;
                        const isAprovOrDelivered =
                          formData.status === 'in_review' ||
                          formData.status === 'done' ||
                          formData.status.toLowerCase().includes('aprov') ||
                          statusLabel.toLowerCase().includes('aprov') ||
                          statusLabel.toLowerCase().includes('entreg') ||
                          statusLabel.toLowerCase().includes('revis') ||
                          Boolean(formData.deliveredAt);

                        if (!isAprovOrDelivered) return null;

                        const displayDate = formData.deliveredAt || new Date().toLocaleDateString('pt-BR');

                        return (
                          <div className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-black tracking-wide shadow-xs animate-in fade-in duration-200 select-none">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span>Data de Entrega: {displayDate}</span>
                          </div>
                        );
                      })()}

                      {/* Badge de Atraso em Destaque Piscando (animate-pulse) */}
                      {(() => {
                        const overdueDays = getTaskOverdueDays({
                          dueDate: formData.dueDate,
                          status: formData.status,
                          deliveredAt: formData.deliveredAt,
                        });
                        if (overdueDays > 0) {
                          return (
                            <div className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-rose-950/80 text-rose-300 border border-rose-500/80 rounded-xl text-xs font-black tracking-wide shadow-lg shadow-rose-950/60 animate-pulse select-none">
                              <span className="text-sm">⚠️</span>
                              <span>Atrasado ({overdueDays} {overdueDays === 1 ? 'dia' : 'dias'})</span>
                            </div>
                          );
                        }
                        return null;
                      })()}

                      {editingTask && (
                        <button
                          type="button"
                          onClick={handleShareTask}
                          className={`px-3 py-2 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 text-xs font-black shadow-xs active:scale-95 ${
                            copiedLink
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                              : 'text-slate-300 hover:text-white bg-[#222222]/80 hover:bg-[#2A2A2A] border-[#2E2E2E]'
                          }`}
                          title="Copiar link direto para compartilhar esta tarefa"
                        >
                          {copiedLink ? (
                            <>
                              <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
                              <span className="text-emerald-400">Link Copiado!</span>
                            </>
                          ) : (
                            <>
                              <Share2 className="w-4 h-4 text-[#E4007E] stroke-[2.5]" />
                              <span>Compartilhar</span>
                            </>
                          )}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={handleClose}
                        className="p-2 rounded-xl text-slate-400 hover:text-white bg-[#222222]/80 hover:bg-[#2A2A2A] border border-[#2E2E2E] transition-all cursor-pointer"
                        title="Fechar painel lateral"
                      >
                        <X className="w-5 h-5 stroke-[2.5]" />
                      </button>
                    </div>
                  </div>

                  {/* Navigation Tabs Header */}
                  {editingTask && (
                    <div className="flex items-center gap-6 pt-2 text-xs font-bold border-t border-[#262626] -mb-[1px]">
                      <button
                        type="button"
                        onClick={() => setActiveDrawerTab('details')}
                        className={`py-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${activeDrawerTab === 'details'
                            ? 'border-[#E4007E] text-transparent bg-clip-text bg-gradient-to-r from-[#E4007E] to-[#E94E18] font-black'
                            : 'border-transparent text-slate-300 hover:text-white'
                          }`}
                      >
                        <FileText className={`w-4 h-4 ${activeDrawerTab === 'details' ? 'text-[#E4007E]' : ''}`} />
                        <span>Detalhes & Descrição</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveDrawerTab('attachments')}
                        className={`py-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${activeDrawerTab === 'attachments'
                            ? 'border-[#E4007E] text-transparent bg-clip-text bg-gradient-to-r from-[#E4007E] to-[#E94E18] font-black'
                            : 'border-transparent text-slate-300 hover:text-white'
                          }`}
                      >
                        <Paperclip className={`w-4 h-4 ${activeDrawerTab === 'attachments' ? 'text-[#E4007E]' : ''}`} />
                        <span>{editingTask.id.startsWith('trello-') ? 'Anexos do Trello' : 'Arquivos Entregues'}</span>
                        <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] ${activeDrawerTab === 'attachments' ? 'bg-gradient-to-r from-[#E4007E] to-[#E94E18] text-white font-black' : 'bg-[#1C1C1C] border border-[#303030] text-white'}`}>
                          {attachments.length}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveDrawerTab('history')}
                        className={`py-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${activeDrawerTab === 'history'
                            ? 'border-[#E4007E] text-transparent bg-clip-text bg-gradient-to-r from-[#E4007E] to-[#E94E18] font-black'
                            : 'border-transparent text-slate-300 hover:text-white'
                          }`}
                      >
                        <History className={`w-4 h-4 ${activeDrawerTab === 'history' ? 'text-[#E4007E]' : ''}`} />
                        <span>Ações & Histórico</span>
                        <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] ${activeDrawerTab === 'history' ? 'bg-gradient-to-r from-[#E4007E] to-[#E94E18] text-white font-black' : 'bg-[#1C1C1C] border border-[#303030] text-white'}`}>
                          {timelineActions.length}
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Drawer Body Tab 1: Details */}
          {activeDrawerTab === 'details' && (
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#101010]">
              {/* Se for criação de nova tarefa, campo de título no corpo */}
              {!editingTask && (
                <div className="w-full">
                  <label className="block text-xs font-bold text-slate-200 mb-1.5">
                    Título da Tarefa <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="input-task-title"
                    type="text"
                    required
                    placeholder="Ex: Criar arte da Santa Ceia"
                    value={formData.title}
                    onChange={(e) => {
                      const newTitle = e.target.value;
                      setFormData((prev) => ({ ...prev, title: newTitle }));
                    }}
                    className="w-full p-3 bg-[#1C1C1C] border border-[#2E2E2E] rounded-xl text-sm font-semibold focus:outline-none focus:border-[#E4007E] transition-all text-white placeholder-slate-400"
                  />
                </div>
              )}

              {/* 1. Metadados Principais: Status, Prazo, Membros, Clientes */}
              <div className="space-y-4">
                {/* Row 1: Status e Prazo Previsto side by side */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                  {/* Status da tarefa */}
                  <div>
                    <label className="block text-xs font-bold text-slate-200 mb-1.5">
                      Status da Tarefa
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => {
                        const newStatus = e.target.value as TaskStatus;
                        const statusLabel = spineStatuses.find((s) => s.id === newStatus)?.label || newStatus;
                        const isAprov =
                          newStatus === 'in_review' ||
                          newStatus === 'done' ||
                          newStatus.toLowerCase().includes('aprov') ||
                          statusLabel.toLowerCase().includes('aprov') ||
                          statusLabel.toLowerCase().includes('entreg') ||
                          statusLabel.toLowerCase().includes('revis');

                        setFormData((prev) => ({
                          ...prev,
                          status: newStatus,
                          deliveredAt: isAprov && !prev.deliveredAt ? new Date().toLocaleDateString('pt-BR') : prev.deliveredAt,
                        }));
                      }}
                      className="w-full p-3 bg-[#1C1C1C] border border-[#2E2E2E] rounded-xl text-xs font-black text-white transition-all shadow-xs focus:outline-none focus:border-[#E4007E] cursor-pointer"
                    >
                      {spineStatuses.map((st) => (
                        <option key={st.id} value={st.id} className="bg-[#181818] text-white font-bold py-2">
                          {st.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Prazo Previsto */}
                  <div>
                    <label className="block text-xs font-bold text-slate-200 mb-1.5">
                      Prazo Previsto
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={
                          formData.dueDate && formData.dueDate !== 'Sem prazo' && formData.dueDate.includes('/')
                            ? formData.dueDate.split('/').reverse().join('-')
                            : formData.dueDate === 'Sem prazo'
                              ? ''
                              : formData.dueDate || ''
                        }
                        onChange={(e) => {
                          const val = e.target.value;
                          let newDueDate = 'Sem prazo';
                          if (val) {
                            const parts = val.split('-');
                            if (parts.length === 3) {
                              newDueDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
                            } else {
                              newDueDate = val;
                            }
                          }
                          setFormData((prev) => ({ ...prev, dueDate: newDueDate }));
                        }}
                        className="w-full p-3 bg-[#1C1C1C] border border-[#2E2E2E] rounded-xl text-xs font-bold text-white focus:outline-none focus:border-[#E4007E] cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Row 2: Membros e Clientes side by side */}
                <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 items-start relative ${isMembersPopoverOpen || isLabelsPopoverOpen ? 'z-50' : 'z-10'}`}>
                  {/* Membros */}
                  <div className={`relative ${isMembersPopoverOpen ? 'z-50' : 'z-20'}`}>
                    <label className="block text-xs font-bold text-slate-200 mb-2">
                      Membros
                    </label>
                    <div className="flex items-center gap-2 flex-wrap">
                      {taskMembers.map((m) => (
                        <div
                          key={m.id}
                          className="relative group cursor-pointer"
                          onClick={() => handleRemoveMember(m.id)}
                          title={`${m.name} (Clique para remover)`}
                        >
                          {m.avatarUrl ? (
                            <img
                              src={m.avatarUrl}
                              alt={m.name}
                              className="w-9 h-9 rounded-full object-cover ring-2 ring-[#E4007E]/60 group-hover:ring-rose-500 transition-all shadow-xs"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-[#2E2E2E] ring-2 ring-[#E4007E]/60 group-hover:ring-rose-500 text-white font-black text-xs flex items-center justify-center shadow-xs transition-all">
                              {m.initials}
                            </div>
                          )}
                          <div className="absolute -top-1 -right-1 bg-rose-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <X className="w-2.5 h-2.5" />
                          </div>
                        </div>
                      ))}

                      {/* Add Member Button with Popover */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => {
                            setIsMembersPopoverOpen(!isMembersPopoverOpen);
                            setIsLabelsPopoverOpen(false);
                          }}
                          className="w-9 h-9 rounded-full bg-[#1C1C1C] border border-[#2E2E2E] hover:border-[#E4007E] flex items-center justify-center text-slate-200 hover:text-white transition-all shadow-sm hover:scale-105 active:scale-95 cursor-pointer"
                          title="Adicionar Membro"
                        >
                          <Plus className="w-4 h-4 stroke-[2.5]" />
                        </button>

                        {/* Members Popover Dropdown */}
                        {isMembersPopoverOpen && (
                          <>
                            <div
                              className="fixed inset-0 z-40"
                              onClick={() => setIsMembersPopoverOpen(false)}
                            />
                            <div className="absolute left-0 top-11 w-72 bg-[#141414] border border-[#2E2E2E] rounded-2xl shadow-2xl p-3.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                              <div className="flex items-center justify-between pb-3 border-b border-[#2E2E2E] mb-3">
                                <div className="w-5" />
                                <h4 className="text-sm font-black text-center text-white">
                                  Membros
                                </h4>
                                <button
                                  type="button"
                                  onClick={() => setIsMembersPopoverOpen(false)}
                                  className="text-slate-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>

                              <div className="space-y-3">
                                <div className="relative">
                                  <input
                                    type="text"
                                    placeholder="Buscar membros..."
                                    value={memberSearchQuery}
                                    onChange={(e) => setMemberSearchQuery(e.target.value)}
                                    className="w-full p-2.5 bg-[#1C1C1C] border border-[#2E2E2E] focus:border-[#E4007E] rounded-xl text-xs text-white placeholder-slate-400 font-medium focus:outline-none transition-all"
                                  />
                                </div>

                                <div className="text-[11px] font-bold text-slate-400 pt-1">Membros do Time</div>

                                <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
                                  {employees
                                    .filter((emp) =>
                                      emp.name.toLowerCase().includes(memberSearchQuery.toLowerCase())
                                    )
                                    .map((emp) => {
                                      const isSelected = taskMembers.some((m) => m.id === emp.id);
                                      return (
                                        <div
                                          key={emp.id}
                                          onClick={() => {
                                            if (isSelected) handleRemoveMember(emp.id);
                                            else handleAddMember(emp.id);
                                          }}
                                          className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-colors ${
                                            isSelected
                                              ? 'bg-[#2E2E2E]/60 border border-[#E4007E]/40'
                                              : 'hover:bg-[#1C1C1C]'
                                          }`}
                                        >
                                          <div className="flex items-center gap-2.5 min-w-0">
                                            {emp.avatarUrl ? (
                                              <img
                                                src={emp.avatarUrl}
                                                alt={emp.name}
                                                className={`w-7 h-7 rounded-full object-cover ring-2 ${
                                                  isSelected ? 'ring-[#E4007E]' : 'ring-[#2E2E2E]'
                                                }`}
                                              />
                                            ) : (
                                              <div
                                                className={`w-7 h-7 rounded-full font-bold text-xs flex items-center justify-center ring-2 ${
                                                  isSelected
                                                    ? 'bg-[#2E2E2E] ring-[#E4007E] text-[#E4007E]'
                                                    : 'bg-[#1C1C1C] ring-[#2E2E2E] text-slate-300'
                                                }`}
                                              >
                                                {emp.initials}
                                              </div>
                                            )}
                                            <div className="truncate">
                                              <span className="font-bold text-xs block truncate text-slate-200">
                                                {emp.name}
                                              </span>
                                              <span className="text-[10px] text-slate-400 block truncate">
                                                {emp.role}
                                              </span>
                                            </div>
                                          </div>
                                          {isSelected && (
                                            <Check className="w-4 h-4 text-[#E4007E] shrink-0 stroke-[2.5]" />
                                          )}
                                        </div>
                                      );
                                    })}
                                </div>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Clientes */}
                  <div className={`relative ${isLabelsPopoverOpen ? 'z-50' : 'z-20'}`}>
                    <label className="block text-xs font-bold text-slate-200 mb-2">
                      Clientes
                    </label>
                    <div className="flex items-center gap-2 flex-wrap">
                      {selectedLabels.length > 0 ? (
                        selectedLabels.map((lbl) => {
                          const clientObj = projects.find(
                            (p) => p.name.toLowerCase().trim() === lbl.toLowerCase().trim()
                          );
                          return (
                            <div
                              key={lbl}
                              onClick={() => {
                                setIsLabelsPopoverOpen(!isLabelsPopoverOpen);
                                setIsMembersPopoverOpen(false);
                              }}
                              className="px-3 py-1.5 rounded-xl text-xs font-bold tracking-wide shadow-xs inline-flex items-center gap-2 cursor-pointer bg-[#1C1C1C] border border-[#2E2E2E] hover:border-[#E4007E]/60 text-slate-200 hover:text-white transition-all group/client"
                            >
                              <div className="w-5 h-5 rounded-md bg-[#141414] border border-[#2E2E2E] flex items-center justify-center overflow-hidden shrink-0 p-0.5">
                                {clientObj?.logoUrl ? (
                                  <img
                                    src={clientObj.logoUrl}
                                    alt={lbl}
                                    className="w-full h-full object-contain"
                                  />
                                ) : (
                                  <div className="w-full h-full rounded-xs bg-gradient-to-tr from-[#E4007E] to-[#E94E18] text-white flex items-center justify-center font-black text-[9px]">
                                    {lbl.slice(0, 2).toUpperCase()}
                                  </div>
                                )}
                              </div>
                              <span className="font-extrabold text-white truncate max-w-[130px]">{lbl}</span>
                              <ChevronDown className="w-3 h-3 text-slate-400 group-hover/client:text-white ml-0.5" />
                            </div>
                          );
                        })
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setIsLabelsPopoverOpen(!isLabelsPopoverOpen);
                            setIsMembersPopoverOpen(false);
                          }}
                          className="px-4 py-2 rounded-xl text-xs font-bold tracking-wide shadow-xs inline-flex items-center gap-2 cursor-pointer bg-[#1C1C1C] border border-[#2E2E2E] text-slate-300 hover:text-white hover:border-[#E4007E] transition-all"
                        >
                          <Building2 className="w-3.5 h-3.5 text-[#E4007E]" />
                          <span>Selecionar Cliente</span>
                          <ChevronDown className="w-3 h-3 opacity-60 ml-0.5" />
                        </button>
                      )}

                      {selectedLabels.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsLabelsPopoverOpen(!isLabelsPopoverOpen);
                            setIsMembersPopoverOpen(false);
                          }}
                          className="w-8 h-8 rounded-full bg-[#1C1C1C] border border-[#2E2E2E] hover:border-[#E4007E] flex items-center justify-center text-slate-200 hover:text-white transition-all shadow-sm hover:scale-105 active:scale-95 cursor-pointer"
                          title="Adicionar outro cliente"
                        >
                          <Plus className="w-4 h-4 stroke-[2.5]" />
                        </button>
                      )}

                      {/* Clientes Popover Dropdown */}
                      {isLabelsPopoverOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setIsLabelsPopoverOpen(false)}
                          />
                          <div className="absolute left-0 top-11 w-80 bg-[#141414] border border-[#2A2A2A] rounded-2xl shadow-2xl p-3.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                            <div className="flex items-center justify-between pb-3 border-b border-[#262626] mb-3">
                              <div className="w-5" />
                              <h4 className="text-sm font-black text-center text-white">
                                Clientes
                              </h4>
                              <button
                                type="button"
                                onClick={() => setIsLabelsPopoverOpen(false)}
                                className="text-slate-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="space-y-3">
                              <div className="relative">
                                <input
                                  type="text"
                                  placeholder="Buscar cliente..."
                                  value={labelSearchQuery}
                                  onChange={(e) => setLabelSearchQuery(e.target.value)}
                                  className="w-full p-2.5 bg-[#1C1C1C] border border-[#2E2E2E] focus:border-[#E4007E] rounded-xl text-xs text-white placeholder-slate-400 font-medium focus:outline-none transition-all"
                                />
                              </div>

                              <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
                                {projects
                                  .filter((c) => c.name.toLowerCase().includes(labelSearchQuery.toLowerCase()))
                                  .map((c) => {
                                    const isSelected = selectedLabels.some(
                                        (l) => l.toLowerCase() === c.name.toLowerCase()
                                      );
                                    return (
                                      <div
                                        key={c.id}
                                        onClick={() => handleToggleLabel(c.name)}
                                        className={`flex items-center gap-2.5 p-2 rounded-xl cursor-pointer transition-colors ${
                                          isSelected ? 'bg-[#262626] border border-[#E4007E]/50' : 'hover:bg-[#1C1C1C] border border-transparent'
                                        }`}
                                      >
                                        <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${isSelected ? 'bg-gradient-to-r from-[#E4007E] to-[#E94E18] border-transparent' : 'border-[#3E3E3E]'}`}>
                                          {isSelected && <Check className="w-3 h-3 text-white stroke-[3]" />}
                                        </div>

                                        {/* Logo do Cliente */}
                                        <div className="w-7 h-7 rounded-lg bg-[#101010] border border-[#2E2E2E] flex items-center justify-center overflow-hidden shrink-0 p-0.5">
                                          {c.logoUrl ? (
                                            <img
                                              src={c.logoUrl}
                                              alt={c.name}
                                              className="w-full h-full object-contain"
                                            />
                                          ) : (
                                            <div className="w-full h-full rounded-md bg-gradient-to-tr from-[#E4007E] to-[#E94E18] text-white flex items-center justify-center font-black text-[10px]">
                                              {c.name.slice(0, 2).toUpperCase()}
                                            </div>
                                          )}
                                        </div>

                                        <div className="truncate flex-1 min-w-0">
                                          <span className="font-bold text-xs block truncate text-white">{c.name}</span>
                                          {c.category && (
                                            <span className="text-[10px] text-slate-400 block truncate">{c.category}</span>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Descrição da Tarefa (Abaixo de Membros e Clientes) */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <span>Descrição</span>
                  </label>
                </div>

                {isEditingDescription ? (
                  <div className="space-y-2">
                    <RichTextEditor
                      value={formData.description}
                      onChange={(val) => {
                        setFormData((prev) => ({ ...prev, description: val }));
                      }}
                      placeholder="Escreva a descrição da tarefa..."
                    />
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => setIsEditingDescription(false)}
                        className="px-4 py-1.5 bg-gradient-to-r from-[#E4007E] to-[#E94E18] hover:opacity-95 text-white rounded-xl text-xs font-black transition-all shadow-sm cursor-pointer"
                      >
                        Concluir
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => setIsEditingDescription(true)}
                    className="p-4 bg-[#1C1C1C] text-slate-100 border border-[#2E2E2E] rounded-2xl cursor-pointer hover:border-[#E4007E] transition-colors group relative min-h-[120px] overflow-hidden break-words [overflow-wrap:anywhere]"
                    title="Clique para editar"
                  >
                    <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity bg-[#2E2E2E] text-white text-[10px] font-bold px-2 py-0.5 rounded-lg border border-[#2E2E2E] flex items-center gap-1">
                      <Edit2 className="w-2.5 h-2.5" />
                      <span>Editar</span>
                    </div>
                    {renderFormattedDescription(formData.description)}
                  </div>
                )}
              </div>

              {/* 3. Imagem de Referência (Briefing) (Abaixo da Descrição) */}
              <div className="p-4 bg-[#1C1C1C] border border-[#2E2E2E] rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-[#E4007E]" />
                    <span>Imagem de Referência (Briefing)</span>
                  </label>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {referenceImages.length} {referenceImages.length === 1 ? 'referência' : 'referências'}
                  </span>
                </div>

                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={referenceFileInputRef}
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    const reader = new FileReader();
                    reader.onload = async (event) => {
                      const dataUrl = event.target?.result as string;
                      if (!dataUrl) return;

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
                      }

                      // Usar URL permanente do Google Drive se o upload foi concluído com sucesso
                      const permanentUrl = driveFileId
                        ? `https://drive.google.com/thumbnail?id=${driveFileId}&sz=w1000`
                        : dataUrl;

                      const newRef = {
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
                    reader.readAsDataURL(file);
                    e.target.value = '';
                  }}
                  className="hidden"
                />

                {/* Upload Trigger Area */}
                <div
                  onClick={() => referenceFileInputRef.current?.click()}
                  className="border-2 border-dashed border-[#2E2E2E] hover:border-[#E4007E] bg-[#101010]/60 hover:bg-[#022B54] p-4 rounded-xl text-center cursor-pointer transition-all group"
                >
                  <div className="flex flex-col items-center justify-center gap-1.5 text-slate-400">
                    <ImageIcon className="w-6 h-6 text-[#E4007E] group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold text-[#E4007E]">
                      Clique para anexar uma imagem de referência
                    </span>
                    <span className="text-[11px] text-slate-400">
                      PNG, JPG, WEBP, GIF (use esta área para referências visuais e a aba Anexos para artes prontas)
                    </span>
                  </div>
                </div>

                {/* Reference Images List */}
                {referenceImages.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {referenceImages.map((refImg) => {
                      const displayImgSrc =
                        refImg.url ||
                        (refImg.driveFileId
                          ? `https://drive.google.com/thumbnail?id=${refImg.driveFileId}&sz=w1000`
                          : '');

                      return (
                        <div
                          key={refImg.id}
                          onClick={() => setPreviewingReference({ name: refImg.name, url: displayImgSrc })}
                          className="relative group bg-[#101010] border border-[#2E2E2E] rounded-xl p-2.5 flex items-center gap-3 shadow-2xs overflow-hidden hover:border-[#E4007E] hover:shadow-md transition-all cursor-pointer"
                        >
                          <div
                            className="w-14 h-14 shrink-0 rounded-lg overflow-hidden border border-[#2E2E2E] bg-[#1C1C1C] block group-hover:scale-105 transition-transform"
                          >
                            <img
                              src={displayImgSrc}
                              alt={refImg.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                if (refImg.driveFileId && !e.currentTarget.src.includes('drive.google.com/thumbnail')) {
                                  e.currentTarget.src = `https://drive.google.com/thumbnail?id=${refImg.driveFileId}&sz=w1000`;
                                }
                              }}
                            />
                          </div>
                          <div className="flex-1 min-w-0 pr-6">
                            <span
                              className="text-xs font-bold text-slate-200 truncate block group-hover:text-[#E4007E] transition-colors"
                              title={refImg.name}
                            >
                              {refImg.name}
                            </span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              {refImg.date || 'Referência'} • Clique para ampliar
                            </span>
                          </div>
                        <button
                          type="button"
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (deletingFileIds.includes(refImg.id)) return;
                            setDeletingFileIds((prev) => [...prev, refImg.id]);
                            try {
                              if (refImg.driveFileId) {
                                try {
                                  await deleteDriveFolder(refImg.driveFileId);
                                } catch (err) {
                                  console.warn('Failed to delete reference file from drive:', err);
                                }
                              }
                              const nextRefs = referenceImages.filter((r) => r.id !== refImg.id);
                              setReferenceImages(nextRefs);
                              if (editingTask) {
                                updateTask(editingTask.id, { referenceImages: nextRefs });
                              }
                              addToast('Referência Removida', 'Imagem de referência excluída.', 'info');
                            } finally {
                              setDeletingFileIds((prev) => prev.filter((id) => id !== refImg.id));
                            }
                          }}
                          className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors z-10 disabled:opacity-50"
                          disabled={deletingFileIds.includes(refImg.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Google Drive Direct Folder Link */}
                {(editingTask?.driveFolderUrl || editingTask?.driveFolderId) && (
                  <div className="pt-2">
                    <a
                      href={editingTask.driveFolderUrl || `https://drive.google.com/drive/folders/${editingTask.driveFolderId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full p-3 rounded-xl bg-[#181818] border border-[#2E2E2E] hover:border-[#E4007E]/60 text-slate-200 hover:text-white font-bold text-xs flex items-center justify-between transition-colors group"
                    >
                      <div className="flex items-center gap-2">
                        <Folder className="w-4 h-4 text-[#E4007E] group-hover:scale-110 transition-transform" />
                        <span>Abrir Pasta da Demanda no Google Drive</span>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
                    </a>
                  </div>
                )}
              </div>

              {/* 4. Comentários da Demanda (Abaixo de Imagens de Referência) */}
              {editingTask && (
                <div className="pt-5 border-t border-[#262626] space-y-4 relative z-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-[#E4007E]" />
                      <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                        Comentários ({comments.length})
                      </h3>
                    </div>
                  </div>

                  {/* New Comment Form */}
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <textarea
                        rows={2}
                        placeholder="Escreva um comentário..."
                        value={newCommentText}
                        onChange={(e) => setNewCommentText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            e.stopPropagation();
                            handleAddComment(e);
                          }
                        }}
                        className="flex-1 p-3 bg-[#1C1C1C] border border-[#2E2E2E] rounded-xl text-xs font-semibold text-white placeholder-slate-400 focus:outline-none focus:border-[#E4007E]"
                      />
                      <button
                        type="button"
                        disabled={isPostingComment || !newCommentText.trim()}
                        onClick={handleAddComment}
                        className="px-4 bg-gradient-to-r from-[#E4007E] to-[#E94E18] hover:opacity-95 disabled:opacity-50 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 self-end py-3 shadow-md shadow-[#E4007E]/25 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>{isPostingComment ? 'Enviando...' : 'Enviar'}</span>
                      </button>
                    </div>

                    {/* Comments Feed */}
                    {comments.length === 0 ? (
                      <div className="p-4 bg-[#1C1C1C]/50 border border-dashed border-[#2E2E2E] rounded-xl text-center text-xs text-slate-400 font-medium">
                        Nenhum comentário nesta demanda ainda.
                      </div>
                    ) : (
                      <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                        {(() => {
                          const sortedComments = [...comments].sort((a, b) => {
                            const timeA = a.date ? new Date(a.date).getTime() : 0;
                            const timeB = b.date ? new Date(b.date).getTime() : 0;
                            if (!isNaN(timeA) && !isNaN(timeB) && timeA > 0 && timeB > 0 && timeA !== timeB) {
                              return timeB - timeA;
                            }
                            return 0;
                          });

                          return sortedComments.map((comment) => {
                            const canDelete =
                              currentUser?.role === 'admin' ||
                              (currentUser?.name &&
                                (comment.authorName?.toLowerCase().trim() === currentUser.name.toLowerCase().trim() ||
                                 comment.authorName?.toLowerCase().includes(currentUser.name.toLowerCase().trim()) ||
                                 currentUser.name.toLowerCase().includes(comment.authorName?.toLowerCase().trim() || '')));

                            return (
                              <div
                                key={comment.id}
                                className="p-3 bg-[#1C1C1C] border border-[#2E2E2E] rounded-xl space-y-1 group relative hover:border-[#E4007E]/40 transition-colors"
                              >
                              <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2 font-bold text-[#E4007E]">
                                  <div className="w-5 h-5 rounded-full bg-[#2E2E2E] text-white flex items-center justify-center text-[10px]">
                                    {comment.authorInitials}
                                  </div>
                                  <span>{comment.authorName}</span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <span className="text-[11px] text-slate-400">
                                    {comment.date && comment.date.includes('T')
                                      ? comment.date.split('T')[0].split('-').reverse().join('/')
                                      : comment.date}
                                  </span>

                                  {canDelete && (
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        if (window.confirm('Deseja excluir seu comentário?')) {
                                          if (editingTask.id && editingTask.id.startsWith('trello-')) {
                                            await deleteTrelloComment(editingTask.id, comment.id);
                                          }
                                          const nextComments = comments.filter((c) => c.id !== comment.id);
                                          setComments(nextComments);
                                          await updateTask(editingTask.id, { comments: nextComments });
                                          addToast('Comentário Excluído', 'Seu comentário foi removido.', 'info');
                                        }
                                      }}
                                      className="p-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 transition-all cursor-pointer opacity-70 group-hover:opacity-100"
                                      title="Excluir este comentário"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>
                              <p className="text-xs text-slate-100 pl-7 leading-relaxed font-normal">
                                {comment.text}
                              </p>
                            </div>
                          );
                        });
                      })()}
                    </div>
                    )}
                  </div>
                </div>
              )}

              {/* Drawer Footer Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-[#2E2E2E] mt-4">
                {editingTask ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Tem certeza que deseja excluir a tarefa "${formData.title}"?`)) {
                        deleteTask(editingTask.id);
                        handleClose();
                      }
                    }}
                    className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-md shadow-rose-600/20 transition-all active:scale-98 cursor-pointer flex items-center gap-1.5"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Excluir Tarefa</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    id="btn-submit-task"
                    className="px-5 py-2.5 bg-gradient-to-r from-[#E4007E] to-[#E94E18] hover:opacity-95 text-white rounded-xl text-xs font-black shadow-md shadow-[#E4007E]/25 transition-all active:scale-98 cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>{editingTask ? 'Salvar Alterações' : 'Criar Tarefa'}</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Drawer Body Tab 2: Dedicated Trello Attachments / Local Delivered Files */}
          {activeDrawerTab === 'attachments' && editingTask && (
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 bg-[#101010]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
                    <Paperclip className="w-5 h-5 text-[#E4007E]" />
                    <span>{editingTask.id.startsWith('trello-') ? 'Anexos do Trello' : 'Arquivos Entregues'} ({attachments.length})</span>
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {editingTask.id.startsWith('trello-')
                      ? 'Arquivos, imagens e documentos anexados diretamente ao cartão do Trello.'
                      : 'Envie e gerencie os arquivos finais e entregas da demanda.'}
                  </p>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap shrink-0">
                  {loadingAttachments && (
                    <span className="text-xs text-[#E4007E] animate-pulse font-medium mr-2">
                      Buscando anexos...
                    </span>
                  )}

                  <button
                    type="button"
                    disabled={openingDriveFolder}
                    onClick={handleOpenDeliveredFolder}
                    className="px-4 py-2.5 bg-[#1C1C1C] hover:bg-[#2E2E2E] text-white border border-[#2E2E2E] hover:border-[#E4007E] font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
                    title="Abrir pasta de Arquivos Entregues desta demanda no Google Drive"
                  >
                    {openingDriveFolder ? (
                      <Loader2 className="w-4 h-4 text-[#E4007E] animate-spin" />
                    ) : (
                      <Folder className="w-4 h-4 text-[#E4007E]" />
                    )}
                    <span>Pasta no Drive</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>
              </div>

              {/* Add Attachment Form: Real File Upload Only */}
              <div className="p-4 bg-[#1C1C1C] border border-[#2E2E2E] rounded-2xl space-y-3">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Paperclip className="w-4 h-4 text-[#E4007E]" />
                  <span>{editingTask.id.startsWith('trello-') ? 'Anexar Arquivo do Computador ao Trello' : 'Anexar Arquivo Final da Demanda'}</span>
                </h4>

                {/* File Upload Box */}
                <div
                  onClick={() => attachmentFileInputRef.current?.click()}
                  className="border-2 border-dashed border-[#2E2E2E] hover:border-[#E4007E] bg-[#101010]/60 p-4 rounded-xl text-center cursor-pointer transition-colors group"
                >
                  <input
                    type="file"
                    ref={attachmentFileInputRef}
                    multiple
                    onChange={(e) => setSelectedAttachmentFiles(Array.from(e.target.files || []))}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center justify-center gap-1.5 text-white">
                    <Paperclip className="w-6 h-6 text-[#E4007E] group-hover:scale-110 transition-transform" />
                    {selectedAttachmentFiles.length > 0 ? (
                      <div className="text-xs font-bold text-[#E4007E] space-y-1">
                        <div>📁 {selectedAttachmentFiles.length} arquivo(s) selecionado(s):</div>
                        <ul className="text-[10px] text-white list-disc list-inside text-left max-w-xs mx-auto">
                          {selectedAttachmentFiles.slice(0, 5).map((f) => (
                            <li key={f.name} className="truncate">{f.name} ({(f.size / (1024 * 1024)).toFixed(2)} MB)</li>
                          ))}
                          {selectedAttachmentFiles.length > 5 && <li>e mais {selectedAttachmentFiles.length - 5} arquivos...</li>}
                        </ul>
                      </div>
                    ) : (
                      <>
                        <span className="text-xs font-bold text-[#E4007E]">Clique para selecionar arquivos (Imagens, PSD, Vídeos, PDF, Docs, etc.)</span>
                        <span className="text-[11px] text-slate-300">
                          {editingTask.id.startsWith('trello-')
                            ? 'Envio de arquivo direto para o Trello'
                            : 'Arquivos .PSD serão salvos automaticamente na subpasta "PSD" no Google Drive'}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {selectedAttachmentFiles.length > 0 && (
                  <div className="space-y-2">
                    <button
                      type="button"
                      disabled={isPostingAttachment}
                      onClick={handleUploadSelectedFileAttachment}
                      className="relative overflow-hidden w-full py-2.5 bg-gradient-to-r from-[#E4007E] to-[#E94E18] hover:opacity-95 text-white disabled:opacity-80 rounded-xl text-xs font-black transition-all shadow-md shadow-[#E4007E]/25 flex items-center justify-center gap-1.5 active:scale-98 cursor-pointer"
                    >
                      {isPostingAttachment && uploadTotalCount > 0 && (
                        <div
                          className="absolute left-0 top-0 bottom-0 bg-[#e5a400]/40 transition-all duration-300 pointer-events-none"
                          style={{ width: `${(uploadProgressCount / uploadTotalCount) * 100}%` }}
                        />
                      )}
                      <span className="relative z-10 flex items-center justify-center gap-1.5">
                        <Paperclip className="w-3.5 h-3.5 shrink-0 text-white" />
                        <span className="text-white">
                          {isPostingAttachment && uploadTotalCount > 0
                            ? `Enviando (${uploadProgressCount}/${uploadTotalCount}) ${Math.round((uploadProgressCount / uploadTotalCount) * 100)}%...`
                            : `Enviar ${selectedAttachmentFiles.length} Arquivo(s) Final(is)`}
                        </span>
                      </span>
                    </button>
                  </div>
                )}
              </div>

              {/* Attachments List / Grid */}
              {attachments.length === 0 && !loadingAttachments ? (
                <div className="p-8 bg-[#1C1C1C]/40 border border-dashed border-[#2E2E2E] rounded-2xl text-center space-y-2">
                  <Paperclip className="w-8 h-8 text-slate-500 mx-auto" />
                  <p className="text-xs font-bold text-white">
                    {editingTask.id.startsWith('trello-') ? 'Nenhum anexo encontrado' : 'Nenhum arquivo entregue'}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {editingTask.id.startsWith('trello-')
                      ? 'Os arquivos anexados a este cartão no Trello aparecerão listados aqui.'
                      : 'Os designers podem subir as imagens, artes finais e arquivos PSD aqui para outros usuários baixarem.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {attachments.map((att) => {
                    const extractDriveId = (item: TrelloAttachment): string | null => {
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

                    const isPsd =
                      Boolean(att.name?.toLowerCase().includes('.psd')) ||
                      Boolean(att.name?.toLowerCase().includes('.psb')) ||
                      Boolean(att.name?.toLowerCase().includes('psd')) ||
                      Boolean(att.name?.match(/\.(psd|psb)$/i)) ||
                      Boolean(att.url?.toLowerCase().includes('.psd')) ||
                      Boolean(att.url?.toLowerCase().includes('.psb')) ||
                      att.mimeType === 'image/vnd.adobe.photoshop' ||
                      att.mimeType === 'application/x-photoshop' ||
                      att.mimeType === 'application/photoshop' ||
                      att.mimeType === 'image/x-photoshop' ||
                      Boolean(att.mimeType?.toLowerCase().includes('photoshop')) ||
                      Boolean(att.mimeType?.toLowerCase().includes('psd'));

                    const isImage =
                      !isPsd &&
                      (att.mimeType?.startsWith('image/') ||
                        Boolean(att.name.match(/\.(png|jpg|jpeg|gif|webp|svg)$/i)) ||
                        Boolean(att.url?.match(/\.(png|jpg|jpeg|gif|webp)(\?.*)?$/i)) ||
                        (att.previews && att.previews.length > 0) ||
                        Boolean(att.thumbnailUrl) ||
                        Boolean(att.url?.startsWith('data:image')));

                    const previewUrl =
                      att.thumbnailUrl ||
                      (att.url?.startsWith('data:image') ? att.url : null) ||
                      (driveFileId ? `https://lh3.googleusercontent.com/d/${driveFileId}` : null) ||
                      (driveFileId ? `https://drive.google.com/thumbnail?id=${driveFileId}&sz=w1000` : null) ||
                      (att.previews && att.previews.length > 0 ? att.previews[att.previews.length - 1].url : null) ||
                      att.url;

                    const viewUrl = driveFileId
                      ? `https://drive.google.com/file/d/${driveFileId}/view`
                      : att.url;

                    return (
                      <div
                        key={att.id}
                        className="bg-[#1C1C1C] rounded-2xl p-2.5 flex flex-col justify-between gap-2.5 relative border border-[#2E2E2E] hover:border-[#E4007E]/40 transition-colors shadow-sm"
                      >
                        {/* Top Header inside card */}
                        <div className="flex items-center justify-between gap-1.5 min-w-0">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <div
                              className={`p-1 rounded-lg text-white shrink-0 flex items-center justify-center font-black ${
                                isPsd
                                  ? 'bg-[#181818] text-[#38BDF8] text-[11px] border border-[#2E2E2E] w-6 h-6 shadow-xs'
                                  : isImage
                                  ? 'bg-[#2E2E2E] text-[#E4007E]'
                                  : 'bg-[#E4007E] text-white'
                              }`}
                            >
                              {isPsd ? <span>Ps</span> : isImage ? <ImageIcon className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                            </div>
                            <span className="text-[10px] font-bold text-white truncate" title={att.name}>
                              {att.name}
                            </span>
                          </div>
                        </div>

                        {/* Image Thumbnail / PSD Card / File Representation */}
                        <div className="flex-1">
                          {isPsd ? (
                            <a
                              href={viewUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex flex-col items-center justify-center bg-gradient-to-b from-[#181818] to-[#101010] rounded-xl aspect-square w-full border border-[#2E2E2E] hover:border-[#E4007E]/60 p-3 text-center transition-all group/psd cursor-pointer shadow-inner"
                              title="Clique para abrir o arquivo PSD no Google Drive"
                            >
                              <div className="w-14 h-14 rounded-2xl bg-[#141414] border-2 border-[#38BDF8]/60 flex items-center justify-center shadow-xl mb-2 group-hover/psd:scale-110 transition-transform">
                                <span className="text-[#38BDF8] font-black text-2xl tracking-tighter select-none">Ps</span>
                              </div>
                              <span className="text-[10px] font-bold text-white truncate max-w-full block select-none px-1" title={att.name}>
                                {att.name}
                              </span>
                              <span className="text-[9px] text-slate-300 font-black mt-1 uppercase tracking-wider bg-[#141414] px-2 py-0.5 rounded-md border border-[#2E2E2E] shadow-xs">
                                {att.bytes ? `${(att.bytes / (1024 * 1024)).toFixed(1)} MB` : 'ARQUIVO PSD'}
                              </span>
                            </a>
                          ) : isImage ? (
                            <div
                              onClick={() => setPreviewingReference({ name: att.name, url: previewUrl })}
                              className="relative aspect-square w-full rounded-xl overflow-hidden bg-[#101010] border border-[#2E2E2E] cursor-pointer group hover:opacity-95 transition-opacity"
                              title="Clique para expandir e visualizar"
                            >
                              <img
                                src={previewUrl}
                                alt={att.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  if (driveFileId) {
                                    if (!target.src.includes('lh3.googleusercontent.com')) {
                                      target.src = `https://lh3.googleusercontent.com/d/${driveFileId}`;
                                    } else if (!target.src.includes('drive.google.com/thumbnail')) {
                                      target.src = `https://drive.google.com/thumbnail?id=${driveFileId}&sz=w1000`;
                                    } else if (!target.src.includes('export=view')) {
                                      target.src = `https://drive.google.com/uc?export=view&id=${driveFileId}`;
                                    }
                                  }
                                }}
                              />
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center bg-[#101010] rounded-xl aspect-square w-full border border-[#2E2E2E]">
                              <FileText className="w-8 h-8 text-slate-400" />
                              <span className="text-[9px] text-slate-400 mt-1 font-bold">
                                {att.bytes ? `${Math.round(att.bytes / 1024)} KB` : 'ARQUIVO'}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Bottom Row of Actions */}
                        <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-[#2E2E2E] relative">
                          {/* 1. Drive Button */}
                          <a
                            href={viewUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-gradient-to-r from-[#E4007E] to-[#E94E18] hover:opacity-95 text-white rounded-xl transition-all shadow-xs flex items-center justify-center cursor-pointer active:scale-95"
                            title="Abrir no Google Drive"
                          >
                            <ExternalLink className="w-4 h-4 stroke-[2.5] text-white" />
                          </a>

                          {/* 2. Red Delete Button */}
                          <button
                            type="button"
                            onClick={() => handleDeleteAttachment(att.id)}
                            disabled={deletingFileIds.includes(att.id)}
                            className="p-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-all shadow-xs flex items-center justify-center cursor-pointer disabled:opacity-50 active:scale-95"
                            title={deletingFileIds.includes(att.id) ? 'Excluindo...' : 'Excluir Arquivo'}
                          >
                            <Trash2 className="w-4 h-4 stroke-[2.5]" />
                          </button>

                          {/* 3. Three dots options menu */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenAttachmentMenuId(openAttachmentMenuId === att.id ? null : att.id);
                              }}
                              className={`p-2 rounded-xl transition-all border cursor-pointer active:scale-95 ${
                                openAttachmentMenuId === att.id
                                  ? 'bg-gradient-to-tr from-[#E4007E] to-[#E94E18] text-white border-[#E4007E] shadow-md shadow-[#E4007E]/30'
                                  : 'bg-[#141414] hover:bg-[#262626] text-slate-300 hover:text-white border-[#2E2E2E]'
                              }`}
                              title="Mais opções do arquivo"
                            >
                              <MoreHorizontal className="w-4 h-4 stroke-[2.5]" />
                            </button>

                            {/* Dropdown Menu Popup (RioSãoPaulo dark styled) */}
                            {openAttachmentMenuId === att.id && (
                              <>
                                <div
                                  className="fixed inset-0 z-40"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenAttachmentMenuId(null);
                                  }}
                                />
                                <div
                                  className="absolute bottom-10 right-0 z-50 min-w-[170px] bg-[#181818] border border-[#2A2A2A] shadow-2xl rounded-2xl p-1.5 space-y-0.5 animate-in fade-in zoom-in-95 duration-100 backdrop-blur-md"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenAttachmentMenuId(null);
                                      handleRenameAttachment(att.id, att.name);
                                    }}
                                    className="w-full text-left px-3 py-2 text-xs font-semibold text-white hover:bg-[#262626] rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer"
                                  >
                                    <Edit2 className="w-3.5 h-3.5 text-slate-300" />
                                    <span>Editar</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenAttachmentMenuId(null);
                                      setActiveDrawerTab('details');
                                      setNewCommentText((prev) => (prev ? `${prev}\n\nArquivo: ${att.name}` : `Sobre o arquivo "${att.name}": `));
                                      addToast('Comentário', `Mencionando "${att.name}" na aba de detalhes.`, 'info');
                                    }}
                                    className="w-full text-left px-3 py-2 text-xs font-semibold text-white hover:bg-[#262626] rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer"
                                  >
                                    <MessageSquare className="w-3.5 h-3.5 text-slate-300" />
                                    <span>Comentário</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenAttachmentMenuId(null);
                                      handleDownloadSingleFile(att);
                                    }}
                                    className="w-full text-left px-3 py-2 text-xs font-semibold text-white hover:bg-[#262626] rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer"
                                  >
                                    <Download className="w-3.5 h-3.5 text-slate-300" />
                                    <span>Baixar</span>
                                  </button>

                                  {isImage && (() => {
                                    const isCover = Boolean(
                                      editingTask?.coverImageUrl &&
                                      (editingTask.coverImageUrl === previewUrl ||
                                       editingTask.coverImageUrl === att.url ||
                                       (driveFileId && editingTask.coverImageUrl.includes(driveFileId)))
                                    );
                                    return (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setOpenAttachmentMenuId(null);
                                          handleToggleCoverImage(previewUrl);
                                        }}
                                        className="w-full text-left px-3 py-2 text-xs font-semibold text-white hover:bg-[#262626] rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer"
                                      >
                                        <ImageIcon className="w-3.5 h-3.5 text-slate-300" />
                                        <span>{isCover ? 'Remover capa' : 'Definir capa'}</span>
                                      </button>
                                    );
                                  })()}

                                  <div className="my-1 border-t border-[#262626]" />

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenAttachmentMenuId(null);
                                      handleDeleteAttachment(att.id);
                                    }}
                                    disabled={deletingFileIds.includes(att.id)}
                                    className="w-full text-left px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-950/40 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer disabled:opacity-50"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                                    <span>Remover</span>
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Drawer Body Tab 3: History (Histórico de Ações) */}
          {activeDrawerTab === 'history' && editingTask && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#101010] text-white">
              {/* Summary Cards Row - Ultra Compact */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="px-3 py-2 bg-[#181818] border border-[#2E2E2E] rounded-xl flex items-center gap-2.5 shadow-xs">
                  <div className="p-1.5 bg-[#E4007E]/20 text-[#E4007E] rounded-lg border border-[#E4007E]/30 shrink-0">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block leading-none mb-0.5">Total de Ações</span>
                    <span className="text-sm font-black text-white leading-tight">{timelineActions.length}</span>
                  </div>
                </div>

                <div className="px-3 py-2 bg-[#181818] border border-[#2E2E2E] rounded-xl flex items-center gap-2.5 shadow-xs">
                  <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30 shrink-0">
                    <PlusCircle className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block leading-none mb-0.5">Criada Em</span>
                    <span className="text-xs font-black text-white truncate block">
                      {editingTask.createdAt ? editingTask.createdAt : 'Recentemente'}
                    </span>
                  </div>
                </div>

                <div className="px-3 py-2 bg-[#181818] border border-[#2E2E2E] rounded-xl flex items-center gap-2.5 shadow-xs">
                  <div className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/30 shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block leading-none mb-0.5">Prazo / Entrega</span>
                    <span className="text-xs font-black text-white truncate block">
                      {editingTask.deliveredAt ? `Entregue: ${editingTask.deliveredAt}` : (editingTask.dueDate || 'Sem prazo')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Timeline Container - Ultra Compact */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between pb-1.5 border-b border-[#2E2E2E]">
                  <h3 className="text-[11px] font-black uppercase tracking-wider text-[#E4007E] flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-[#E4007E]" />
                    <span>Linha do Tempo de Ações</span>
                  </h3>
                  {loadingActions && (
                    <span className="text-[10px] font-bold text-slate-400 animate-pulse">
                      Sincronizando ações...
                    </span>
                  )}
                </div>

                {timelineActions.length === 0 ? (
                  <div className="py-8 text-center bg-[#181818] rounded-xl border border-[#2E2E2E]">
                    <History className="w-8 h-8 text-slate-600 mx-auto mb-1.5" />
                    <p className="text-xs font-bold text-slate-300">Nenhuma ação registrada nesta demanda ainda.</p>
                  </div>
                ) : (
                  <div className="relative pl-5 space-y-2.5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#2E2E2E]">
                    {timelineActions.map((act) => {
                      const getIconAndStyle = () => {
                        switch (act.type) {
                          case 'created':
                            return {
                              icon: <PlusCircle className="w-3 h-3 text-emerald-400" />,
                              badgeBg: 'bg-emerald-950 text-emerald-300 border-emerald-500/30',
                              label: 'Criação',
                            };
                          case 'status':
                            return {
                              icon: <ArrowRight className="w-3 h-3 text-sky-400" />,
                              badgeBg: 'bg-sky-950 text-sky-300 border-sky-500/30',
                              label: 'Status',
                            };
                          case 'edited':
                            return {
                              icon: <Edit2 className="w-3 h-3 text-amber-400" />,
                              badgeBg: 'bg-amber-950 text-amber-300 border-amber-500/30',
                              label: 'Edição',
                            };
                          case 'file':
                            return {
                              icon: <Paperclip className="w-3 h-3 text-[#E4007E]" />,
                              badgeBg: 'bg-amber-950 text-amber-300 border-amber-500/30',
                              label: 'Arquivo',
                            };
                          case 'comment':
                            return {
                              icon: <MessageSquare className="w-3 h-3 text-purple-400" />,
                              badgeBg: 'bg-purple-950 text-purple-300 border-purple-500/30',
                              label: 'Comentário',
                            };
                          case 'delivery':
                            return {
                              icon: <CheckCircle2 className="w-3 h-3 text-[#00A723]" />,
                              badgeBg: 'bg-emerald-950 text-emerald-300 border-emerald-500/30',
                              label: 'Entrega',
                            };
                          case 'member':
                            return {
                              icon: <UserCheck className="w-3 h-3 text-orange-400" />,
                              badgeBg: 'bg-orange-950 text-orange-300 border-orange-500/30',
                              label: 'Membro',
                            };
                          default:
                            return {
                              icon: <Activity className="w-3 h-3 text-slate-300" />,
                              badgeBg: 'bg-slate-800 text-slate-300 border-slate-700',
                              label: 'Atualização',
                            };
                        }
                      };

                      const style = getIconAndStyle();
                      let formattedDate = act.date;
                      try {
                        const d = new Date(act.date);
                        if (!isNaN(d.getTime())) {
                          formattedDate = `${d.toLocaleDateString('pt-BR')} às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
                        }
                      } catch {}

                      return (
                        <div key={act.id} className="relative group">
                          {/* Timeline node dot */}
                          <div className="absolute -left-5 top-2.5 w-3.5 h-3.5 rounded-full bg-[#101010] border-2 border-[#2E2E2E] flex items-center justify-center -translate-x-1/2 z-10 shadow-xs group-hover:border-[#E4007E] transition-colors">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#E4007E]" />
                          </div>

                          {/* Compact Action Card */}
                          <div className="p-2.5 sm:p-3 bg-[#181818] border border-[#2E2E2E] rounded-xl shadow-xs space-y-1 hover:border-[#E4007E]/40 transition-colors">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <div className="flex items-center gap-2">
                                {act.avatarUrl ? (
                                  <img
                                    src={act.avatarUrl}
                                    alt={act.user}
                                    className="w-5 h-5 rounded-full object-cover ring-1 ring-white/20"
                                  />
                                ) : (
                                  <div className="w-5 h-5 rounded-full bg-[#1C1C1C] border border-[#2E2E2E] text-white font-black text-[9px] flex items-center justify-center">
                                    {act.userInitials}
                                  </div>
                                )}
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-black text-white">{act.user}</span>
                                  <span className="text-[10px] font-medium text-slate-400">• {formattedDate}</span>
                                </div>
                              </div>

                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1 border ${style.badgeBg}`}>
                                {style.icon}
                                <span>{style.label}</span>
                              </span>
                            </div>

                            <p className="text-xs font-bold text-slate-100 leading-snug">{act.title}</p>
                            {act.details && (
                              <p className="text-[11px] text-slate-300 bg-[#101010] px-2.5 py-1.5 rounded-lg border border-[#2E2E2E]/60 font-medium whitespace-pre-wrap break-words mt-1">
                                {act.details}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

      {/* Lightbox / Visualizador de Referência em Alta Resolução */}
      {previewingReference && (
        <div
          onClick={() => setPreviewingReference(null)}
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200"
        >
          {/* Top Bar with Name & Actions */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-4xl flex items-center justify-between text-white pb-4 mb-2 border-b border-white/10"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-black truncate">{previewingReference.name}</h3>
                <p className="text-[11px] text-slate-400">Imagem de Referência • Visualização em Alta Resolução</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={previewingReference.url}
                target="_blank"
                rel="noreferrer"
                download={previewingReference.name}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center gap-2"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Abrir Original</span>
              </a>
              <button
                type="button"
                onClick={() => setPreviewingReference(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-rose-500/80 text-white transition-colors"
                title="Fechar Visualizador"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Centered Image Container */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl max-h-[80vh] flex items-center justify-center rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-black/40"
          >
            <img
              src={previewingReference.url}
              alt={previewingReference.name}
              className="max-w-full max-h-[80vh] object-contain rounded-xl select-none"
            />
          </div>
        </div>
      )}
    </div>
  );
};
