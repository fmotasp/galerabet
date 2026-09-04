import React, { useState } from 'react';
import {
  Plus,
  Search,
  Filter,
  Kanban,
  List,
  CheckCircle2,
  AlertCircle,
  Clock,
  Flag,
  ArrowRight,
  ChevronRight,
  MoreHorizontal,
  Flame,
  MessageSquare,
  Paperclip,
  CheckSquare,
  Download,
  CheckCheck,
  Users,
  Star,
  ChevronDown,
  Check,
  Trash2,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Task, TaskStatus } from '../../types';
import { getTaskOverdueDays, isTaskOverdue, isTaskCompleted, parseTaskDueDate } from '../../lib/taskDateUtils';

const CARD_THEMES = [
  {
    bg: 'bg-[#EBF3FF]',
    border: 'border-[#C7D9FE]',
    text: 'text-[#1E3A8A]',
    subtext: 'text-[#2563EB]',
    tagBg: 'bg-white/80 text-[#1D4ED8]',
    dotActive: 'bg-[#2563EB]',
    dotInactive: 'bg-[#93C5FD]/40',
  },
  {
    bg: 'bg-[#F3E8FF]',
    border: 'border-[#DDD6FE]',
    text: 'text-[#4C1D95]',
    subtext: 'text-[#7C3AED]',
    tagBg: 'bg-white/80 text-[#6D28D9]',
    dotActive: 'bg-[#7C3AED]',
    dotInactive: 'bg-[#C4B5FD]/40',
  },
  {
    bg: 'bg-[#FFEDD5]',
    border: 'border-[#FED7AA]',
    text: 'text-[#7C2D12]',
    subtext: 'text-[#EA580C]',
    tagBg: 'bg-white/80 text-[#C2410C]',
    dotActive: 'bg-[#D97706]',
    dotInactive: 'bg-[#FDE68A]/60',
  },
  {
    bg: 'bg-[#ECFDF5]',
    border: 'border-[#A7F3D0]',
    text: 'text-[#064E3B]',
    subtext: 'text-[#059669]',
    tagBg: 'bg-white/80 text-[#047857]',
    dotActive: 'bg-[#10B981]',
    dotInactive: 'bg-[#A7F3D0]/60',
  },
  {
    bg: 'bg-[#FCE7F3]',
    border: 'border-[#FBCFE8]',
    text: 'text-[#831843]',
    subtext: 'text-[#E11D48]',
    tagBg: 'bg-white/80 text-[#BE185D]',
    dotActive: 'bg-[#E11D48]',
    dotInactive: 'bg-[#FBCFE8]/60',
  },
];

export const getLabelColorHex = (labelName: string, labelColor?: string): { bg: string; text: string; border: string } => {
  const normName = (labelName || '').toLowerCase().trim();
  const normColor = (labelColor || '').toLowerCase().trim();

  // Known specific client rules - Cores escuras e contrastantes para destacar logo e texto
  if (normName.includes('galera') || normName.includes('galerabet')) {
    return { bg: '#002B66', text: '#FFFFFF', border: '#001E47' }; // Azul Marinho Escuro Intenso
  }
  if (normName.includes('f12') || normName.includes('f12bet')) {
    return { bg: '#0D3827', text: '#FFFFFF', border: '#072418' }; // Verde Floresta Escuro
  }
  if (normName.includes('luva') || normName.includes('luva de pedreiro')) {
    return { bg: '#2D1E5E', text: '#FFFFFF', border: '#1E1342' }; // Roxo Escuro Imperial
  }
  if (normName.includes('brasilbet') || normName.includes('brasil bet')) {
    return { bg: '#0A3D2E', text: '#FFFFFF', border: '#05291E' }; // Verde Escuro Jade
  }

  // Trello standard colors mapping (Darker editions for high contrast)
  if (normColor.includes('green') || normName.includes('verde') || normName.includes('finaliz') || normName.includes('concl') || normName.includes('pronto')) {
    return { bg: '#0D3827', text: '#FFFFFF', border: '#072418' };
  }
  if (normColor.includes('yellow') || normName.includes('amarel') || normName.includes('pendent')) {
    return { bg: '#4A3700', text: '#FFFFFF', border: '#332600' };
  }
  if (normColor.includes('orange') || normName.includes('laranja') || normName.includes('alerta')) {
    return { bg: '#5C2700', text: '#FFFFFF', border: '#3E1A00' };
  }
  if (normColor.includes('red') || normName.includes('vermelh') || normName.includes('urgente') || normName.includes('atras')) {
    return { bg: '#5E1410', text: '#FFFFFF', border: '#420D0A' };
  }
  if (normColor.includes('purple') || normName.includes('roxo') || normName.includes('design') || normName.includes('video')) {
    return { bg: '#2D1E5E', text: '#FFFFFF', border: '#1E1342' };
  }
  if (normColor.includes('blue') || normName.includes('azul') || normName.includes('briefing') || normName.includes('dev')) {
    return { bg: '#002B66', text: '#FFFFFF', border: '#001E47' };
  }
  if (normColor.includes('sky') || normName.includes('cyan')) {
    return { bg: '#00374C', text: '#FFFFFF', border: '#002331' };
  }
  if (normColor.includes('lime') || normName.includes('limao')) {
    return { bg: '#26360F', text: '#FFFFFF', border: '#182409' };
  }
  if (normColor.includes('pink') || normColor.includes('rose') || normName.includes('rosa')) {
    return { bg: '#4A1937', text: '#FFFFFF', border: '#331025' };
  }
  if (normColor.includes('black') || normName.includes('preto') || normName.includes('dark')) {
    return { bg: '#131B29', text: '#FFFFFF', border: '#0C111A' };
  }

  // Fallback dynamic hash color for any other custom label/client
  const colors = [
    { bg: '#002B66', text: '#FFFFFF', border: '#001E47' },
    { bg: '#0D3827', text: '#FFFFFF', border: '#072418' },
    { bg: '#2D1E5E', text: '#FFFFFF', border: '#1E1342' },
    { bg: '#5C2700', text: '#FFFFFF', border: '#3E1A00' },
    { bg: '#00374C', text: '#FFFFFF', border: '#002331' },
    { bg: '#4A1937', text: '#FFFFFF', border: '#331025' },
  ];
  let hash = 0;
  for (let i = 0; i < normName.length; i++) {
    hash = normName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export const getTaskCardBgStyle = (task: Task, projects: Project[]): { className: string; style?: React.CSSProperties } => {
  return {
    className: 'bg-[#181818] hover:bg-[#202020] border border-[#2A2A2A] hover:border-[#383838] shadow-xl',
  };
};

const getProgressPercentage = (status: TaskStatus) => {
  switch (status) {
    case 'done':
      return 100;
    case 'in_review':
      return 80;
    case 'in_progress':
      return 50;
    case 'overdue':
    case 'blocked':
      return 30;
    case 'backlog':
    default:
      return 15;
  }
};

const extractImageUrl = (desc?: string): string | null => {
  if (!desc) return null;
  const match = desc.match(/https?:\/\/[^\s"']+\.(?:png|jpg|jpeg|gif|webp|svg)/i);
  return match ? match[0] : null;
};

const TaskMembersStack: React.FC<{ task: Task }> = ({ task }) => {
  const [expanded, setExpanded] = useState(false);

  const rawList =
    task.members && task.members.length > 0
      ? task.members
      : task.assigneeId && task.assigneeId !== 'unassigned' && task.assigneeName !== 'Sem membro'
      ? [
          {
            id: task.assigneeId,
            name: task.assigneeName,
            initials: task.assigneeInitials,
          },
        ]
      : [];

  const membersList = rawList.filter(
    (m) =>
      m &&
      m.id !== 'unassigned' &&
      m.name !== 'Sem membro' &&
      m.initials !== 'SM' &&
      m.name?.trim().length > 0
  );

  if (membersList.length === 0) {
    return null;
  }

  return (
    <div className="relative inline-block">
      <div
        onClick={(e) => {
          e.stopPropagation();
          setExpanded(!expanded);
        }}
        className="flex items-center -space-x-1.5 cursor-pointer group/stack"
        title="Clique para expandir membros"
      >
        {membersList.map((m, idx) =>
          m.avatarUrl ? (
            <img
              key={m.id || idx}
              src={m.avatarUrl}
              alt={m.name}
              className="w-7 h-7 rounded-full object-cover ring-2 ring-[#E4007E]/50 shadow-sm transition-transform group-hover/stack:scale-105"
              style={{ zIndex: membersList.length - idx }}
            />
          ) : (
            <div
              key={m.id || idx}
              className="w-7 h-7 rounded-full bg-[#222222] border border-[#303030] ring-2 ring-[#181818] text-[#E4007E] font-black text-[10px] flex items-center justify-center shadow-sm transition-transform group-hover/stack:scale-105"
              style={{ zIndex: membersList.length - idx }}
            >
              {m.initials}
            </div>
          )
        )}
      </div>

      {expanded && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute left-0 bottom-full mb-2 w-52 bg-[#181818] rounded-2xl shadow-2xl border border-[#303030] p-3 z-30 animate-in fade-in zoom-in-95 duration-150 text-white"
        >
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 pb-2 mb-2 border-b border-slate-800">
            <span>Membros ({membersList.length})</span>
            <button
              onClick={() => setExpanded(false)}
              className="text-slate-400 hover:text-white p-0.5"
            >
              ✕
            </button>
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {membersList.map((m, idx) => (
              <div key={m.id || idx} className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[#011C39] border border-[#02376F] text-white font-black text-[10px] flex items-center justify-center shrink-0">
                  {m.initials}
                </div>
                <span className="text-xs font-bold text-white truncate">
                  {m.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const TasksView: React.FC = () => {
  const {
    tasks,
    projects,
    employees,
    moveTaskStatus,
    toggleFlagTask,
    setIsNewTaskModalOpen,
    setEditingTask,
    deleteTask,
    moveAllBacklogToDoneLocally,
    trelloLabels,
    spineStatuses,
    currentUser,
    activeFilter,
    setActiveFilter,
  } = useApp();

  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedClient, setSelectedClient] = useState<string>('all');
  const [selectedMember, setSelectedMember] = useState<string>('all');
  const [isMemberDropdownOpen, setIsMemberDropdownOpen] = useState<boolean>(false);
  const [memberFilterSearch, setMemberFilterSearch] = useState<string>('');
  const [showDoneColumn, setShowDoneColumn] = useState<boolean>(false);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'default' | 'title' | 'dueDate' | 'points'>('default');
  const [visibleTasksCount, setVisibleTasksCount] = useState<number>(10);

  // Dynamic list of registered clients from projects
  const registeredClients = Array.from(
    new Map(
      projects.flatMap((p) => {
        if (p.clientIds && p.clientIds.length > 0) {
          return p.clientIds.map((cId, idx) => [
            cId,
            {
              id: cId,
              name: p.clientNames?.[idx] || p.name,
              color: p.color || '#10B981',
              icon: p.logoUrl || undefined,
            },
          ]);
        }
        return [
          [
            p.id,
            {
              id: p.id,
              name: p.name,
              color: p.color || '#10B981',
              icon: p.logoUrl || undefined,
            },
          ],
        ];
      })
    ).values()
  );

  const isTaskAssignedToMe = (task: Task) => {
    if (!currentUser) return false;
    if (task.isMine) return true;

    const myId = (currentUser.id || '').toString().toLowerCase().trim();
    const myEmployeeId = (currentUser.employeeId || '').toString().toLowerCase().trim();
    const myName = (currentUser.name || '').toLowerCase().trim();
    const myFirstName = myName.split(' ')[0].trim();
    const myUsername = (currentUser.username || '').toLowerCase().trim();
    const myEmailPrefix = (currentUser.email || '').split('@')[0].toLowerCase().trim();
    const myInitials = (currentUser.initials || '').toUpperCase().trim();
    const myTrelloId = (currentUser.trelloMemberId || '').toLowerCase().trim();

    // 1. Direct assignee check
    if (task.assigneeId) {
      const aId = task.assigneeId.toString().toLowerCase().trim();
      if (myId && aId === myId) return true;
      if (myEmployeeId && aId === myEmployeeId) return true;
      if (myTrelloId && aId === myTrelloId) return true;
    }

    if (task.assigneeName) {
      const aName = task.assigneeName.toLowerCase().trim();
      if (myName && (aName.includes(myName) || myName.includes(aName))) return true;
      if (myFirstName && myFirstName.length > 2 && (aName.includes(myFirstName) || myFirstName.includes(aName))) return true;
      if (myUsername && (aName.includes(myUsername) || myUsername.includes(aName))) return true;
      if (myEmailPrefix && (aName.includes(myEmailPrefix) || myEmailPrefix.includes(aName))) return true;
    }

    if (myInitials && task.assigneeInitials && task.assigneeInitials.toUpperCase().trim() === myInitials) {
      return true;
    }

    // 2. Members list check (onde o usuário está como membro da tarefa)
    if (task.members && task.members.length > 0) {
      const isMemberMatch = task.members.some((m) => {
        const mId = (m.id || '').toString().toLowerCase().trim();
        if (myId && mId === myId) return true;
        if (myEmployeeId && mId === myEmployeeId) return true;
        if (myTrelloId && mId === myTrelloId) return true;

        const mName = (m.name || '').toLowerCase().trim();
        if (myName && (mName.includes(myName) || myName.includes(mName))) return true;
        if (myFirstName && myFirstName.length > 2 && (mName.includes(myFirstName) || myFirstName.includes(mName))) return true;
        if (myUsername && (mName.includes(myUsername) || myUsername.includes(mName))) return true;

        const mInitials = (m.initials || '').toUpperCase().trim();
        if (myInitials && mInitials === myInitials) return true;

        return false;
      });
      if (isMemberMatch) return true;
    }

    // 3. Trello idMembers if present
    if ((task as any).idMembers && Array.isArray((task as any).idMembers)) {
      if (myTrelloId && (task as any).idMembers.includes(myTrelloId)) return true;
      if (myId && (task as any).idMembers.includes(myId)) return true;
    }

    // 4. Trello List Name (coluna nominal no Trello)
    if (task.trelloListName) {
      const lName = task.trelloListName.toLowerCase();
      if (
        (myFirstName && myFirstName.length > 2 && lName.includes(myFirstName)) ||
        (myEmailPrefix && myEmailPrefix.length > 2 && lName.includes(myEmailPrefix)) ||
        (myFirstName === 'bismarques' && lName.includes('marques')) ||
        (myFirstName === 'gerdson' && lName.includes('gerdeson')) ||
        (myFirstName === 'felipe' && (lName.includes('fmota') || lName.includes('mota'))) ||
        (myFirstName === 'daiane' && lName.includes('dai'))
      ) {
        return true;
      }
    }

    return false;
  };

  const isDoneStatus = (statusId: string, label: string = '') => {
    const s = (statusId || '').toLowerCase();
    const l = (label || '').toLowerCase();
    return s === 'done' || s.includes('concl') || s.includes('finaliz') || s.includes('postad') || l.includes('concl') || l.includes('done') || l.includes('finaliz') || l.includes('postad');
  };

  const getTaskNumericTimestamp = (t: Task): number => {
    if (t.lastMovedAt && typeof t.lastMovedAt === 'number') return t.lastMovedAt;
    if (t.id.startsWith('task-')) {
      const num = Number(t.id.replace('task-', ''));
      if (!isNaN(num) && num > 0) return num;
    }
    if (t.id.startsWith('trello-')) {
      const rawId = t.id.replace('trello-', '');
      if (rawId.length >= 8) {
        try {
          const ts = parseInt(rawId.substring(0, 8), 16) * 1000;
          if (!isNaN(ts) && ts > 0) return ts;
        } catch {}
      }
    }
    if (t.createdAt) {
      const d = new Date(t.createdAt).getTime();
      if (!isNaN(d) && d > 0) return d;
    }
    return 0;
  };

  const columns = spineStatuses
    .filter((s) => showDoneColumn || !isDoneStatus(s.id, s.label))
    .map((s) => ({
      id: s.id as TaskStatus,
      label: s.label,
      color: s.color,
      bg: s.bg,
      dotColor: s.dotColor,
    }));

  const getSpineStatusConfig = (statusId: string) => {
    const found = spineStatuses.find((s) => s.id === statusId);
    if (found) {
      return {
        label: found.label,
        color: found.color,
        bg: found.bg,
      };
    }
    return {
      label: statusId,
      color: '#64748B',
      bg: '#F8FAFC',
    };
  };

  const isStatusMatch = (taskStatus: string, targetId: string) => {
    const ts = (taskStatus || '').toLowerCase().trim();
    const tid = targetId.toLowerCase().trim();
    if (ts === tid) return true;

    // Check if taskStatus matches the label of the targetId from spineStatuses
    const statusConfig = spineStatuses.find((s) => s.id === targetId);
    if (statusConfig) {
      const label = statusConfig.label.toLowerCase().trim();
      if (ts === label) return true;
    }

    // Some general mappings
    if (targetId === 'backlog' && (ts.includes('backlog') || ts.includes('a fazer') || ts.includes('pedido') || ts.includes('novo') || ts === 'todo')) return true;
    if (targetId === 'in_progress' && (ts.includes('progress') || ts.includes('processo') || ts.includes('produz') || ts.includes('desenv'))) return true;
    if (targetId === 'in_review' && (ts.includes('review') || ts.includes('revis') || ts.includes('aprov'))) return true;
    if (targetId === 'done' && (ts.includes('done') || ts.includes('concl') || ts.includes('final') || ts.includes('postad'))) return true;

    return false;
  };

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    // Client filter - filtra estritamente pelo ID ou Nome do cliente cadastrado
    let matchesClient = true;
    if (selectedClient !== 'all') {
      const selectedClientObj = registeredClients.find((c) => c.id === selectedClient);
      const targetName = (selectedClientObj?.name || selectedClient).toLowerCase().trim();

      const cardLabels = t.labels || [];
      const labelNames = cardLabels.map((l) => (l.name || '').toLowerCase().trim());
      const catNames = (t.category || '')
        .toLowerCase()
        .split(',')
        .map((c) => c.trim());
      const allTagNames = [...labelNames, ...catNames];

      matchesClient =
        t.projectId === selectedClient ||
        (t.projectName && t.projectName.toLowerCase().includes(targetName)) ||
        allTagNames.some((tag) => tag.includes(targetName) || targetName.includes(tag));
    }

    // Member filter
    let matchesMember = true;
    if (selectedMember === 'mine') {
      matchesMember = isTaskAssignedToMe(t);
    } else if (selectedMember !== 'all') {
      const emp = employees.find((e) => e.id === selectedMember);
      const empName = emp ? emp.name.toLowerCase().trim() : '';
      const empInitials = emp ? (emp.initials || '').toUpperCase().trim() : '';
      const empTrelloId = emp && (emp as any).trelloMemberId ? (emp as any).trelloMemberId.toLowerCase().trim() : '';

      matchesMember =
        t.assigneeId === selectedMember ||
        (empTrelloId && t.assigneeId === empTrelloId) ||
        (empName && t.assigneeName && (t.assigneeName.toLowerCase().includes(empName) || empName.includes(t.assigneeName.toLowerCase()))) ||
        (empInitials && t.assigneeInitials && t.assigneeInitials.toUpperCase().trim() === empInitials) ||
        (t.members &&
          t.members.some(
            (m) =>
              m.id === selectedMember ||
              (empTrelloId && m.id === empTrelloId) ||
              (empName && m.name && (m.name.toLowerCase().includes(empName) || empName.includes(m.name.toLowerCase()))) ||
              (empInitials && m.initials && m.initials.toUpperCase().trim() === empInitials)
          )) ||
        (empTrelloId && (t as any).idMembers && Array.isArray((t as any).idMembers) && (t as any).idMembers.includes(empTrelloId));
    }

    // Search filter
    let matchesSearch = true;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      matchesSearch =
        t.title.toLowerCase().includes(q) ||
        (t.description || '').toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q) ||
        (t.projectName || '').toLowerCase().includes(q) ||
        (t.assigneeName || '').toLowerCase().includes(q) ||
        (t.category || '').toLowerCase().includes(q);
    }

    // Quick Active Filter (Cmd+K / Palette Filter: All, Mine, Flagged/Alerts)
    let matchesActiveFilter = true;
    if (activeFilter === 'mine') {
      matchesActiveFilter = isTaskAssignedToMe(t);
    } else if (activeFilter === 'flagged') {
      const overdue = isTaskOverdue(t);
      const isUrgent = Boolean(t.isFlagged);
      let isSoonDue = false;
      const parsedDate = parseTaskDueDate(t.dueDate);
      if (parsedDate) {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const dueMidnight = new Date(parsedDate);
        dueMidnight.setHours(0, 0, 0, 0);
        const diffDays = (dueMidnight.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        if (diffDays >= 0 && diffDays <= 2 && !isTaskCompleted(t)) {
          isSoonDue = true;
        }
      }
      matchesActiveFilter = isUrgent || overdue || isSoonDue;
    }

    return matchesClient && matchesMember && matchesSearch && matchesActiveFilter;
  });

  // Sort tasks
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === 'title') {
      return a.title.localeCompare(b.title);
    }
    if (sortBy === 'dueDate') {
      return (a.dueDate || '').localeCompare(b.dueDate || '');
    }
    if (sortBy === 'points') {
      return (b.points || 0) - (a.points || 0);
    }
    return getTaskNumericTimestamp(b) - getTaskNumericTimestamp(a);
  });

  // Pagination / Visible tasks limit logic
  const paginatedTasks = sortedTasks.slice(0, visibleTasksCount);

  const kanbanRef = React.useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!kanbanRef.current) return;
    // Only initiate canvas drag if clicking background (not buttons/inputs/cards click)
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('select')) return;
    setIsDragging(true);
    setStartX(e.pageX - kanbanRef.current.offsetLeft);
    setScrollLeft(kanbanRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !kanbanRef.current) return;
    e.preventDefault();
    const x = e.pageX - kanbanRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    kanbanRef.current.scrollLeft = scrollLeft - walk;
  };

  const exportTasksToCSV = () => {
    const headers = ['ID', 'Titulo', 'Projeto', 'Responsavel', 'Data Entrega', 'Categoria', 'Status'];
    const rows = filteredTasks.map((t) => [
      `"${t.id}"`,
      `"${t.title.replace(/"/g, '""')}"`,
      `"${t.projectName || ''}"`,
      `"${t.assigneeName || ''}"`,
      `"${t.dueDate || ''}"`,
      `"${t.category || ''}"`,
      `"${t.status}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `spine_tarefas_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 w-full px-4 sm:px-8 pb-12 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Tarefas</h1>
          <p className="text-sm text-slate-400 mt-1">Acompanhe suas demandas, tarefas e entregas em tempo real.</p>
        </div>

        <div className="flex items-center gap-3">
          {/* View mode toggle */}
          <div className="flex items-center bg-[#181818] p-1 rounded-2xl border border-[#2A2A2A]">
            <button
              onClick={() => setViewMode('kanban')}
              aria-label="Visualização em Quadro Kanban"
              className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'kanban'
                  ? 'bg-gradient-to-r from-[#E4007E] to-[#E94E18] text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Visualização em Quadro Kanban"
            >
              <Kanban className="w-4 h-4" />
              <span className="hidden sm:inline">Quadro</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              aria-label="Visualização em Lista / Tabela"
              className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-gradient-to-r from-[#E4007E] to-[#E94E18] text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Visualização em Lista"
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">Lista</span>
            </button>
          </div>

          <button
            id="btn-tasks-new-task"
            onClick={() => setIsNewTaskModalOpen(true)}
            aria-label="Adicionar Nova Tarefa"
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#E4007E] to-[#E94E18] hover:opacity-95 text-white rounded-2xl text-xs font-black shadow-md shadow-[#E4007E]/25 transition-all active:scale-98 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Nova Tarefa</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar - Filtro de Cliente e Membros */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#181818] p-3 rounded-2xl border border-[#2A2A2A]">
        <div className="flex flex-wrap items-center gap-3">
          {/* Client Filter (Icon Buttons) */}
          <div className="flex items-center bg-[#222222] p-1 rounded-xl gap-1 border border-[#303030]">
            <button
              onClick={() => setSelectedClient('all')}
              aria-label="Filtrar por todos os clientes"
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedClient === 'all'
                  ? 'bg-gradient-to-r from-[#E4007E] to-[#E94E18] text-white shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Todos os Clientes
            </button>

            {registeredClients.map((client) => {
              const isSelected = selectedClient === client.id;
              return (
                <button
                  key={client.id}
                  onClick={() => setSelectedClient(isSelected ? 'all' : client.id)}
                  aria-label={`Filtrar por cliente ${client.name}`}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#E4007E] to-[#E94E18] text-white shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-[#303030]'
                  }`}
                  title={`Filtrar por ${client.name}`}
                >
                  {client.icon ? (
                    <img
                      src={client.icon}
                      alt={client.name}
                      className="w-4 h-4 rounded-md object-contain"
                    />
                  ) : (
                    <span
                      className="w-3.5 h-3.5 rounded-md flex items-center justify-center text-[9px] font-black text-white"
                      style={{ backgroundColor: client.color }}
                    >
                      {client.name.substring(0, 1).toUpperCase()}
                    </span>
                  )}
                  <span>{client.name}</span>
                </button>
              );
            })}
          </div>

          {/* Custom Modern Member Filter Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsMemberDropdownOpen(!isMemberDropdownOpen)}
              className="flex items-center gap-2.5 bg-[#222222] hover:bg-[#2A2A2A] border border-[#303030] text-white rounded-xl px-3.5 py-2 text-xs font-bold transition-all active:scale-98 cursor-pointer"
            >
              {selectedMember === 'all' && (
                <div className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-[#E4007E]" />
                  <span>Todos os Membros</span>
                </div>
              )}
              {selectedMember === 'mine' && (
                <div className="flex items-center gap-2 text-[#E4007E]">
                  <Star className="w-3.5 h-3.5 fill-[#E4007E] text-[#E4007E]" />
                  <span>Minhas Atividades</span>
                </div>
              )}
              {selectedMember !== 'all' && selectedMember !== 'mine' && (() => {
                const emp = employees.find((e) => e.id === selectedMember);
                if (!emp) return <span>Todos os Membros</span>;
                return (
                  <div className="flex items-center gap-2">
                    {emp.avatarUrl ? (
                      <img src={emp.avatarUrl} alt={emp.name} className="w-4 h-4 rounded-full object-cover" />
                    ) : (
                      <div className="w-4 h-4 rounded-full bg-[#262626] border border-[#303030] text-[9px] font-black flex items-center justify-center text-[#E4007E]">
                        {emp.initials}
                      </div>
                    )}
                    <span className="truncate max-w-[140px]">{emp.name}</span>
                  </div>
                );
              })()}
              <ChevronDown className={`w-3.5 h-3.5 text-[#A0A0A0] transition-transform duration-200 ${isMemberDropdownOpen ? 'rotate-180 text-[#E4007E]' : ''}`} />
            </button>

            {isMemberDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsMemberDropdownOpen(false)}
                />
                <div className="absolute left-0 top-full mt-2 w-72 bg-[#1C1C1C] rounded-2xl border border-[#303030] shadow-2xl p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                  {/* Search Member */}
                  <div className="relative mb-2 px-1">
                    <input
                      type="text"
                      placeholder="Buscar membro..."
                      value={memberFilterSearch}
                      onChange={(e) => setMemberFilterSearch(e.target.value)}
                      className="w-full p-2 bg-[#141414] border border-[#2A2A2A] rounded-xl text-xs text-white placeholder-slate-500 font-medium focus:outline-none focus:border-[#E4007E] transition-all"
                    />
                  </div>

                  <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
                    {/* All option */}
                    <div
                      onClick={() => {
                        setSelectedMember('all');
                        setIsMemberDropdownOpen(false);
                      }}
                      className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all ${
                        selectedMember === 'all'
                          ? 'bg-[#E4007E]/15 text-[#E4007E] font-bold border border-[#E4007E]/30'
                          : 'text-[#A0A0A0] hover:bg-[#262626] hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-full bg-[#262626] flex items-center justify-center text-[#E4007E]">
                          <Users className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-semibold">Todos os Membros</span>
                      </div>
                      {selectedMember === 'all' && <Check className="w-3.5 h-3.5 text-[#E4007E] stroke-[3]" />}
                    </div>

                    {/* Mine option */}
                    <div
                      onClick={() => {
                        setSelectedMember('mine');
                        setIsMemberDropdownOpen(false);
                      }}
                      className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all ${
                        selectedMember === 'mine'
                          ? 'bg-[#E4007E]/15 text-[#E4007E] font-bold border border-[#E4007E]/30'
                          : 'text-[#A0A0A0] hover:bg-[#262626] hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-full bg-[#E4007E]/20 flex items-center justify-center text-[#E4007E]">
                          <Star className="w-3.5 h-3.5 fill-[#E4007E]" />
                        </div>
                        <div className="truncate">
                          <span className="text-xs font-semibold block">Minhas Atividades</span>
                          <span className="text-[10px] text-[#E4007E]/80 block">
                            {currentUser?.name || currentUser?.username || 'Minhas Tarefas'}
                          </span>
                        </div>
                      </div>
                      {selectedMember === 'mine' && <Check className="w-3.5 h-3.5 text-[#E4007E] stroke-[3]" />}
                    </div>

                    <div className="h-px bg-white/5 my-1.5" />

                    {/* Employees list */}
                    {employees
                      .filter((emp) =>
                        emp.name.toLowerCase().includes(memberFilterSearch.toLowerCase()) ||
                        (emp.role && emp.role.toLowerCase().includes(memberFilterSearch.toLowerCase()))
                      )
                      .map((emp) => {
                        const isSelected = selectedMember === emp.id;
                        return (
                          <div
                            key={emp.id}
                            onClick={() => {
                              setSelectedMember(emp.id);
                              setIsMemberDropdownOpen(false);
                            }}
                            className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-[#E4007E]/15 text-[#E4007E] font-bold border border-[#E4007E]/30'
                                : 'text-[#A0A0A0] hover:bg-[#262626] hover:text-white'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              {emp.avatarUrl ? (
                                <img
                                  src={emp.avatarUrl}
                                  alt={emp.name}
                                  className="w-6 h-6 rounded-full object-cover shrink-0"
                                />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-[#262626] text-[#E4007E] font-black text-[10px] flex items-center justify-center shrink-0">
                                  {emp.initials}
                                </div>
                              )}
                              <div className="min-w-0">
                                <span className="text-xs font-semibold block truncate">
                                  {emp.name}
                                </span>
                                <span className="text-[10px] text-[#A0A0A0] block truncate">
                                  {emp.role || 'Membro'}
                                </span>
                              </div>
                            </div>
                            {isSelected && <Check className="w-3.5 h-3.5 text-[#E4007E] stroke-[3] shrink-0" />}
                          </div>
                        );
                      })}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Toggle Switch para Exibir/Ocultar Coluna de Concluídas */}
          <div className="flex items-center gap-2 bg-[#222222] px-3 py-1.5 rounded-xl border border-[#303030]">
            <label
              htmlFor="toggle-done-column"
              className="text-xs font-bold text-slate-200 select-none cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Exibir Concluídas</span>
            </label>
            <button
              id="toggle-done-column"
              type="button"
              role="switch"
              aria-checked={showDoneColumn}
              onClick={() => setShowDoneColumn(!showDoneColumn)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                showDoneColumn ? 'bg-emerald-500' : 'bg-[#333333]'
              }`}
            >
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                  showDoneColumn ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="text-xs text-slate-400 font-medium hidden sm:block">
            Exibindo <span className="font-bold text-white">{filteredTasks.length}</span> tarefas
          </div>
        </div>
      </div>

      {/* Quick Active Filter Pill (Cmd+K: Minhas Tarefas / Alertas) */}
      {activeFilter !== 'all' && (
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-[#181818] border border-[#2E2E2E] rounded-2xl w-full sm:w-auto animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center gap-2">
            {activeFilter === 'mine' ? (
              <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-[#E4007E] to-[#E94E18] animate-pulse" />
            ) : (
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            )}
            <span className="text-xs text-slate-300 font-medium">
              Filtro ativo:{' '}
              <span className="text-white font-extrabold">
                {activeFilter === 'mine' ? 'Minhas Atividades / Tarefas' : 'Tarefas com Alerta / Prazo'}
              </span>
            </span>
          </div>

          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className="px-2.5 py-1 bg-[#262626] hover:bg-[#333333] text-slate-200 hover:text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Remover filtro"
          >
            <X className="w-3.5 h-3.5" />
            <span>Limpar Filtro</span>
          </button>
        </div>
      )}

      {/* Board (Kanban) View */}
      {viewMode === 'kanban' ? (
        <div
          ref={kanbanRef}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          className="flex gap-5 overflow-x-auto pb-8 pt-2 items-start no-scrollbar select-none cursor-grab active:cursor-grabbing w-full"
        >
{columns.map((col) => {
            const columnTasks = filteredTasks
              .filter((t) => t.status === col.id)
              .sort((a, b) => getTaskNumericTimestamp(b) - getTaskNumericTimestamp(a));

            return (
              <div
                key={col.id}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  if (dragOverColumnId !== col.id) {
                    setDragOverColumnId(col.id);
                  }
                }}
                onDragLeave={(e) => {
                  // Só reseta se estiver saindo do container principal da coluna
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                    setDragOverColumnId(null);
                  }
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOverColumnId(null);
                  const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
                  if (taskId) {
                    moveTaskStatus(taskId, col.id);
                  }
                  setDraggedTaskId(null);
                }}
                className={`w-80 shrink-0 min-w-[320px] rounded-2xl p-4 max-h-[calc(100vh-210px)] min-h-[520px] flex flex-col justify-between transition-all duration-200 border border-[#262626] ${
                  dragOverColumnId === col.id
                    ? 'bg-[#222222] ring-2 ring-[#E4007E] scale-[1.01]'
                    : 'bg-[#181818]'
                }`}
              >
                <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
                  {/* Column Header */}
                  <div className="flex items-center justify-between mb-4 px-1 pt-1 shrink-0">
                    <div className="flex items-center gap-2.5">
                      <span className={`text-sm font-extrabold ${col.color}`}>{col.label}</span>
                      <span className="text-xs font-extrabold bg-[#262626] text-white px-2.5 py-0.5 rounded-full border border-[#333333]">
                        {columnTasks.length}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {col.id === 'backlog' && columnTasks.length > 0 && (
                        <button
                          onClick={moveAllBacklogToDoneLocally}
                          className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/60 px-2 py-1 rounded-xl transition-all"
                          title="Mover todas as tarefas do Backlog para Concluídas apenas no sistema (Trello permanece igual)"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          <span>Concluir Tudo</span>
                        </button>
                      )}
                      <button
                        onClick={() => setIsNewTaskModalOpen(true)}
                        className="text-[#A0A0A0] hover:text-white p-1.5 rounded-xl hover:bg-[#262626] transition-colors"
                        title="Adicionar tarefa nesta coluna"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Cards in this column */}
                  <div className="space-y-3 flex-1 overflow-y-auto no-scrollbar pr-0.5 min-h-[100px] pb-1">
                    {columnTasks.map((task) => {
                      const cleanDesc = task.description
                        ? task.description
                            .replace(/<[^>]*>?/gm, '')
                            .replace(/!\[.*?\]\(.*?\)/g, '')
                            .replace(/\[(.*?)\]\(.*?\)/g, '$1')
                            .replace(/\*\*\*(.*?)\*\*\*/g, '$1')
                            .replace(/\*\*(.*?)\*\*/g, '$1')
                            .replace(/\*(.*?)\*/g, '$1')
                            .replace(/~~(.*?)~~/g, '$1')
                            .replace(/#+\s?/g, '')
                            .replace(/`{1,3}.*?`{1,3}/g, '')
                            .trim()
                        : '';

                      // Determine Priority Header Style (matches reference design & custom statuses)
                      const getPriorityInfo = () => {
                        if (task.isFlagged || task.status === 'overdue') {
                          return {
                            label: 'URGENTE',
                            bg: 'bg-rose-600 text-white font-black',
                          };
                        }
                        const customSt = spineStatuses.find((s) => s.id === task.status);
                        if (customSt) {
                          const rawLabel = customSt.label.toLowerCase();
                          let bg = customSt.gradient ? `bg-gradient-to-r ${customSt.gradient} text-white font-black` : 'bg-[#02376F] text-white font-black';
                          if (rawLabel.includes('novo') || rawLabel.includes('pedid')) bg = 'bg-[#0088FF] text-white font-black';
                          else if (rawLabel.includes('andamento') || rawLabel.includes('produ')) bg = 'bg-amber-500 text-[#000A17] font-black';
                          else if (rawLabel.includes('aprov') || rawLabel.includes('revis')) bg = 'bg-purple-600 text-white font-black';
                          else if (rawLabel.includes('concl') || rawLabel.includes('done') || rawLabel.includes('final')) bg = 'bg-emerald-600 text-white font-black';
                          else if (rawLabel.includes('backlog')) bg = 'bg-slate-700 text-white font-black';

                          return {
                            label: customSt.label.toUpperCase(),
                            bg,
                          };
                        }
                        if (task.status === 'blocked') {
                          return {
                            label: 'PRIORIDADE MODERADA',
                            bg: 'bg-orange-600 text-white font-black',
                          };
                        }
                        if (task.status === 'in_progress') {
                          return {
                            label: 'EM ANDAMENTO',
                            bg: 'bg-amber-500 text-[#000A17] font-black',
                          };
                        }
                        if (task.status === 'in_review') {
                          return {
                            label: 'EM REVISÃO',
                            bg: 'bg-purple-600 text-white font-black',
                          };
                        }
                        if (task.status === 'done') {
                          return {
                            label: 'CONCLUÍDO',
                            bg: 'bg-emerald-600 text-white font-black',
                          };
                        }
                        return {
                          label: 'BACKLOG',
                          bg: 'bg-slate-700 text-white font-black',
                        };
                      };

                      const pInfo = getPriorityInfo();
                      const isBeingDragged = draggedTaskId === task.id;
                      const cardTheme = getTaskCardBgStyle(task, projects);

                      return (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={(e) => {
                            e.stopPropagation();
                            setDraggedTaskId(task.id);
                            e.dataTransfer.setData('text/plain', task.id);
                            e.dataTransfer.effectAllowed = 'move';
                          }}
                          onDragEnd={() => {
                            setDraggedTaskId(null);
                            setDragOverColumnId(null);
                          }}
                          onClick={() => setEditingTask(task)}
                          style={cardTheme.style}
                          className={`${cardTheme.className} rounded-xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5 cursor-grab active:cursor-grabbing group relative ${
                            isBeingDragged ? 'opacity-40 scale-95 ring-2 ring-indigo-400' : ''
                          }`}
                        >
                          {/* Top Priority Header Bar */}
                          <div className={`w-full py-1.5 px-3 text-[11px] font-black tracking-widest uppercase text-center relative ${pInfo.bg}`}>
                            <span className="relative z-10">{pInfo.label}</span>
                          </div>

                          {/* Cover Image */}
                          {(() => {
                            let coverSrc = task.coverImageUrl;

                            // If explicit cover image is chosen, use it and ensure high quality
                            if (coverSrc) {
                              const driveMatch =
                                coverSrc.match(/[?&]id=([a-zA-Z0-9_-]+)/) ||
                                coverSrc.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
                                coverSrc.match(/\/d\/([a-zA-Z0-9_-]+)/);
                              if (driveMatch && driveMatch[1] && !coverSrc.startsWith('data:')) {
                                coverSrc = `https://lh3.googleusercontent.com/d/${driveMatch[1]}`;
                              }
                            }

                            if (!coverSrc && task.attachments && task.attachments.length > 0) {
                              const imgAtts = task.attachments.filter((a) =>
                                a.mimeType?.startsWith('image/') ||
                                Boolean(a.name?.match(/\.(png|jpg|jpeg|gif|webp|svg)$/i)) ||
                                Boolean(a.url?.match(/\.(png|jpg|jpeg|gif|webp)(\?.*)?$/i)) ||
                                (a.previews && a.previews.length > 0) ||
                                Boolean(a.thumbnailUrl) ||
                                Boolean(a.driveFileId) ||
                                a.url?.includes('google.com')
                              );
                              if (imgAtts.length > 0) {
                                const first = imgAtts[0];
                                const driveMatch = first.driveFileId || first.url?.match(/[?&]id=([a-zA-Z0-9_-]+)/)?.[1] || first.url?.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)?.[1] || first.url?.match(/\/d\/([a-zA-Z0-9_-]+)/)?.[1];
                                if (first.thumbnailUrl) {
                                  coverSrc = first.thumbnailUrl;
                                } else if (driveMatch) {
                                  coverSrc = `https://lh3.googleusercontent.com/d/${driveMatch}`;
                                } else {
                                  coverSrc =
                                    first.previews && first.previews.length > 0
                                      ? first.previews[first.previews.length - 1].url
                                      : first.url;
                                }
                              }
                            }

                            // Fallback to first reference image if any
                            if (!coverSrc && task.referenceImages && task.referenceImages.length > 0) {
                              const firstRef = task.referenceImages[0];
                              if (firstRef.url?.startsWith('data:')) {
                                coverSrc = firstRef.url;
                              } else if (firstRef.driveFileId) {
                                coverSrc = `https://lh3.googleusercontent.com/d/${firstRef.driveFileId}`;
                              } else {
                                coverSrc = firstRef.url;
                              }
                            }

                            if (!coverSrc && task.description) {
                              const descImgMatches = task.description.match(/(?:!\[.*?\]\((https?:\/\/[^\s"']+)\)|(https?:\/\/[^\s"']+\.(?:png|jpg|jpeg|gif|webp)(?:\?[^\s"']*)?))/i);
                              if (descImgMatches) {
                                coverSrc = descImgMatches[1] || descImgMatches[2];
                              }
                            }

                            if (!coverSrc) return null;

                            return (
                              <div className="w-full h-36 bg-[#000A17] overflow-hidden relative">
                                <img
                                  src={coverSrc}
                                  alt={task.title}
                                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    const match = target.src.match(/\/d\/([a-zA-Z0-9_-]+)/) || target.src.match(/id=([a-zA-Z0-9_-]+)/);
                                    if (match && match[1] && !target.src.includes('thumbnail?id=')) {
                                      target.src = `https://drive.google.com/thumbnail?id=${match[1]}&sz=w800`;
                                    } else {
                                      target.style.display = 'none';
                                    }
                                  }}
                                />
                              </div>
                            );
                          })()}

                          {/* Main Card Content Body */}
                          <div className="p-3.5 space-y-3 bg-[#181818]">
                            {/* Client / Labels Badges Row */}
                            {(() => {
                              const labelItems: Array<{ name: string; color?: string }> = [];

                              if (task.labels && task.labels.length > 0) {
                                task.labels.forEach((l) => {
                                  if (l.name && l.name.toUpperCase().trim() !== 'GERAL') {
                                    labelItems.push({ name: l.name, color: l.color });
                                  }
                                });
                              } else if (task.category && task.category.toUpperCase().trim() !== 'GERAL') {
                                task.category.split(',').forEach((c) => {
                                  const trimmed = c.trim();
                                  if (trimmed && trimmed.toUpperCase() !== 'GERAL') {
                                    labelItems.push({ name: trimmed });
                                  }
                                });
                              }

                              if (labelItems.length === 0) return null;

                              return (
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {labelItems.map((lbl, lIdx) => {
                                    const style = getLabelColorHex(lbl.name, lbl.color);
                                    const foundClient = projects.find(
                                      (p) => p.name.toLowerCase().trim() === lbl.name.toLowerCase().trim()
                                    );

                                    return (
                                      <span
                                        key={lIdx}
                                        className="h-6 px-2.5 rounded-full text-[10px] font-black tracking-wider uppercase inline-flex items-center gap-1.5 shadow-xs border border-white/10"
                                        style={{
                                          backgroundColor: style.bg,
                                          color: style.text,
                                        }}
                                      >
                                        {foundClient?.logoUrl ? (
                                          <img
                                            src={foundClient.logoUrl}
                                            alt={lbl.name}
                                            className="w-3.5 h-3.5 rounded-full object-cover shrink-0"
                                          />
                                        ) : (
                                          <div className="w-3.5 h-3.5 rounded-full bg-white/20 text-white flex items-center justify-center text-[8px] font-black shrink-0">
                                            {lbl.name.slice(0, 1).toUpperCase()}
                                          </div>
                                        )}
                                        <span>{lbl.name}</span>
                                      </span>
                                    );
                                  })}
                                </div>
                              );
                            })()}

                            {/* Title */}
                            <h4 className="font-black text-sm text-white leading-snug tracking-tight">
                              {task.title}
                            </h4>

                            {/* Middle Row: Members Stack */}
                            <div className="flex items-center justify-between pt-1">
                              <TaskMembersStack task={task} />
                            </div>

                            {/* Bottom Footer: Counts & Date */}
                            {(() => {
                              let cCount = (task.comments ? task.comments.length : 0) || task.commentsCount || 0;
                              let aCount = (task.attachments ? task.attachments.length : 0) || task.attachmentsCount || 0;
                              let chCount = task.checklistsCount || 0;

                              if (task.description) {
                                const descMatches = task.description.match(/(?:!\[.*?\]\(.*?\)|https?:\/\/[^\s"']+\.(?:png|jpg|jpeg|gif|webp|svg|pdf|docx?|xlsx?|zip))/gi);
                                if (descMatches && descMatches.length > aCount) {
                                  aCount = descMatches.length;
                                }
                              }

                              return (
                                <div className="flex items-center justify-between pt-2.5 border-t border-[#262626] text-xs font-bold">
                                  <div className="flex items-center gap-3.5 text-slate-300">
                                    <span className="flex items-center gap-1.5 hover:text-[#E4007E] transition-colors" title="Comentários">
                                      <MessageSquare className="w-3.5 h-3.5 text-[#E4007E]" />
                                      <span className="text-white font-black text-[11px]">{cCount}</span>
                                    </span>

                                    <span className="flex items-center gap-1.5 hover:text-[#E4007E] transition-colors" title="Arquivos / Anexos">
                                      <Paperclip className="w-3.5 h-3.5 text-[#E4007E]" />
                                      <span className="text-white font-black text-[11px]">{aCount}</span>
                                    </span>

                                    <span className="flex items-center gap-1.5 hover:text-[#E4007E] transition-colors" title="Checklists">
                                      <CheckSquare className="w-3.5 h-3.5 text-[#00A723]" />
                                      <span className="text-white font-black text-[11px]">{chCount}</span>
                                    </span>
                                  </div>

                                  {(() => {
                                    const overdueDays = getTaskOverdueDays(task);
                                    if (overdueDays > 0) {
                                      return (
                                        <div className="text-rose-400 font-extrabold text-[11px] bg-rose-950/70 px-2 py-0.5 rounded border border-rose-800/70 shadow-xs whitespace-nowrap" title={`Prazo previsto: ${task.dueDate}`}>
                                          Atrasada ({overdueDays}d)
                                        </div>
                                      );
                                    }
                                    return (
                                      <div className="text-slate-200 font-extrabold text-[11px]">
                                        {task.dueDate && task.dueDate !== 'Sem prazo' ? task.dueDate : 'Sem prazo'}
                                      </div>
                                    );
                                  })()}
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <button
                  onClick={() => setIsNewTaskModalOpen(true)}
                  className="w-full mt-4 py-2.5 bg-[#222222] hover:bg-[#282828] text-[#A0A0A0] hover:text-white border border-[#2E2E2E] rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Adicionar Cartão</span>
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        /* List / Table View - Identical to Mockup */
        <div className="space-y-6 w-full">


          {/* Action Bar (Search, Counter, Export, Sort, Add) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#181818] border border-[#2A2A2A] p-4 rounded-3xl shadow-xl">
            {/* Search Input & Total Tasks count */}
            <div className="flex items-center gap-4 flex-1">
              <div className="relative w-full max-w-xs">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar demandas..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setVisibleTasksCount(10);
                  }}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#222222] border border-[#303030] rounded-2xl text-xs focus:outline-none focus:border-[#E4007E] text-white placeholder-slate-400 font-semibold shadow-inner transition-colors"
                />
              </div>
              <span className="text-xs text-slate-400 font-bold shrink-0">
                {sortedTasks.length} {sortedTasks.length === 1 ? 'demanda' : 'demandas'}
              </span>
            </div>

            {/* Right Side Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={exportTasksToCSV}
                aria-label="Exportar tarefas para CSV"
                className="px-4 py-2.5 bg-[#222222] hover:bg-[#282828] border border-[#303030] text-white rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <Download className="w-4 h-4" />
                <span>Exportar</span>
              </button>

              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value as any);
                    setVisibleTasksCount(10);
                  }}
                  className="appearance-none pl-4 pr-10 py-2.5 bg-[#222222] hover:bg-[#282828] border border-[#303030] rounded-2xl text-xs font-bold text-white focus:outline-none focus:border-[#E4007E] cursor-pointer transition-colors"
                >
                  <option value="default">Ordenar: padrão</option>
                  <option value="title">Ordenar: nome</option>
                  <option value="dueDate">Ordenar: prazo</option>
                  <option value="points">Ordenar: pontos</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              <button
                onClick={() => setIsNewTaskModalOpen(true)}
                aria-label="Adicionar Nova Demanda"
                className="px-5 py-2.5 bg-[#E4007E] hover:bg-[#c2006b] text-white rounded-2xl text-xs font-black shadow-md shadow-pink-600/10 transition-all active:scale-98 flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Nova Demanda</span>
              </button>
            </div>
          </div>

          {/* Filter Chips & Pagination controls */}
          <div className="flex flex-row items-center justify-between gap-4 px-1">
            <div className="flex flex-wrap items-center gap-2">
              {(selectedClient !== 'all' || selectedMember !== 'all' || searchQuery !== '') && (
                <div className="flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  {selectedClient !== 'all' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#181818] border border-[#2A2A2A] text-white rounded-xl text-[10px] font-bold">
                      Cliente: {registeredClients.find((c) => c.id === selectedClient)?.name || selectedClient}
                      <button
                        onClick={() => setSelectedClient('all')}
                        aria-label="Remover filtro de cliente"
                        className="text-slate-400 hover:text-white font-extrabold ml-1 cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {selectedMember !== 'all' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#181818] border border-[#2A2A2A] text-white rounded-xl text-[10px] font-bold">
                      Membro: {selectedMember === 'mine' ? 'Meus' : employees.find((e) => e.id === selectedMember)?.name || selectedMember}
                      <button
                        onClick={() => setSelectedMember('all')}
                        aria-label="Remover filtro de membro"
                        className="text-slate-400 hover:text-white font-extrabold ml-1 cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  <button
                    onClick={() => {
                      setSelectedClient('all');
                      setSelectedMember('all');
                      setSearchQuery('');
                      setVisibleTasksCount(10);
                    }}
                    className="text-[10px] font-bold text-[#E4007E] hover:underline cursor-pointer"
                  >
                    Limpar todos
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Table View Container */}
          <div className="bg-[#181818] rounded-3xl border border-[#2A2A2A] shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#2A2A2A] text-[#E4007E] font-black text-[11px] uppercase tracking-wider bg-[#141414]">
                    <th className="w-12 px-6 py-4">
                      <input
                        type="checkbox"
                        aria-label="Selecionar todas as tarefas"
                        className="rounded border-[#303030] text-[#E4007E] focus:ring-[#E4007E]/20 bg-[#222222] cursor-pointer"
                      />
                    </th>
                    <th className="px-6 py-4">Demanda & Projeto</th>
                    <th className="px-6 py-4">Responsável</th>
                    <th className="px-4 py-4">Categoria</th>
                    <th className="px-4 py-4">Prazo</th>
                    <th className="px-4 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#262626] font-medium text-white">
                  {paginatedTasks.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center">
                        <CheckSquare className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                        <h3 className="text-base font-bold text-white">Nenhuma demanda encontrada</h3>
                        <p className="text-xs text-slate-400 mt-1">Não há tarefas correspondentes aos filtros selecionados.</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedTasks.map((task) => {
                      const statusConfig = getSpineStatusConfig(task.status);
                      
                      // Decode dynamic label color or fallback
                      const pillColor = `${statusConfig.bg || 'bg-slate-800'} ${statusConfig.color || 'text-slate-200'} border border-current/20`;

                      return (
                        <tr
                          key={task.id}
                          onClick={() => setEditingTask(task)}
                          className="hover:bg-[#222222]/50 transition-all cursor-pointer group"
                        >
                          {/* Checkbox */}
                          <td className="px-6 py-4.5" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              aria-label={`Selecionar tarefa ${task.title}`}
                              className="rounded border-[#303030] text-[#E4007E] focus:ring-[#E4007E]/20 bg-[#222222] cursor-pointer"
                            />
                          </td>

                          {/* Title & Project Subtitle */}
                          <td className="px-6 py-4.5">
                            <div className="flex flex-col min-w-[200px]">
                              <span className="font-extrabold text-white text-sm group-hover:text-[#E4007E] transition-colors">
                                {task.title}
                              </span>
                              <span className="text-[11px] text-slate-400 font-bold mt-0.5">
                                {task.projectName}
                              </span>
                            </div>
                          </td>

                          {/* Assignee / Customer Details */}
                          <td className="px-6 py-4.5">
                            <div className="flex items-center gap-3">
                              <TaskMembersStack task={task} />
                              <div className="flex flex-col">
                                <span className="text-white font-bold text-xs">
                                  {task.assigneeName || 'Sem responsável'}
                                </span>
                                <span className="text-[10px] text-slate-400 block mt-0.5">
                                  {task.assigneeInitials ? `${task.assigneeInitials}@empresa.com` : 'sem_email'}
                                </span>
                              </div>
                            </div>
                          </td>

                        {/* Category */}
                        <td className="px-4 py-4.5">
                          <span className="bg-[#222222] text-white px-2.5 py-1 rounded-xl font-bold text-[10px] uppercase tracking-wide border border-[#2E2E2E]">
                            {task.category || 'Geral'}
                          </span>
                        </td>



                        {/* Due Date & Delivery Date */}
                        <td className="px-4 py-4.5 font-bold text-xs">
                          <div className="flex flex-col gap-1">
                            {(() => {
                              const overdueDays = getTaskOverdueDays(task);
                              if (overdueDays > 0) {
                                return (
                                  <span className="text-rose-400 font-bold text-[11px] bg-rose-950/70 px-2 py-0.5 rounded border border-rose-800/70 w-fit whitespace-nowrap" title={`Prazo previsto: ${task.dueDate}`}>
                                    Atrasada ({overdueDays}d)
                                  </span>
                                );
                              }
                              return (
                                <span className="text-slate-300">
                                  {task.dueDate && task.dueDate !== 'Sem prazo' ? task.dueDate : 'Sem prazo'}
                                </span>
                              );
                            })()}
                            {task.deliveredAt && (
                              <span className="text-[#00A723] font-bold text-[10px] flex items-center gap-1 bg-[#00A723]/15 px-2 py-0.5 rounded border border-[#00A723]/30 w-fit" title="Entregue em">
                                <CheckCircle2 className="w-2.5 h-2.5 text-[#00A723]" />
                                <span>Entregue: {task.deliveredAt}</span>
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Status Select dropdown styled like a badge */}
                        <td className="px-4 py-4.5" onClick={(e) => e.stopPropagation()}>
                          <div className="relative inline-block w-full min-w-[120px]">
                            <select
                              value={task.status}
                              onChange={(e) => moveTaskStatus(task.id, e.target.value as TaskStatus)}
                              className={`w-full py-1.5 pl-3 pr-8 rounded-full text-xs font-black border uppercase tracking-wider text-center appearance-none cursor-pointer transition-colors focus:outline-none ${pillColor}`}
                            >
                              {spineStatuses.map((status) => (
                                <option key={status.id} value={status.id} className="text-slate-800 bg-white">
                                  {status.label}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="w-3 h-3 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4.5 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setEditingTask(task)}
                              className="p-2 hover:bg-[#222222] rounded-xl text-slate-400 hover:text-white transition-colors"
                              title="Visualizar Detalhes"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm('Tem certeza que deseja excluir esta demanda?')) {
                                  deleteTask(task.id);
                                }
                              }}
                              className="p-2 hover:bg-rose-950/20 rounded-xl text-slate-400 hover:text-rose-400 transition-colors"
                              title="Excluir Demanda"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              </table>
            </div>
          </div>

          {sortedTasks.length > visibleTasksCount && (
            <div className="flex justify-center pt-2">
              <button
                onClick={() => setVisibleTasksCount((prev) => prev + 10)}
                className="px-6 py-2.5 bg-[#222222] hover:bg-[#E4007E] text-slate-200 hover:text-white rounded-2xl text-xs font-black transition-all shadow-xs flex items-center gap-1.5"
              >
                <span>Mostrar mais</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
