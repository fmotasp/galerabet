import { useState, useMemo, useCallback } from 'react';
import { Task, TaskStatus, Project, Employee, SpineStatusConfig } from '../../types';
import { CurrentUserType } from '../../context/AuthContext';
import { isTaskAssignedToMe } from '../../lib/taskUtils';
import { isTaskOverdue, isTaskCompleted, parseTaskDueDate } from '../../lib/taskDateUtils';
import { useDebounce } from '../../hooks/useDebounce';
export const getClientLogoFallback = (projectName?: string) => {
  const name = (projectName || '').toLowerCase();
  if (name.includes('f12')) return '/icones/icon_f12.png';
  if (name.includes('galera')) return '/icones/icon_galera.png';
  if (name.includes('luva')) return '/icones/icon_luva.png';
  return '';
};

export interface UseTasksFilterProps {
  tasks: Task[];
  projects: Project[];
  employees: Employee[];
  spineStatuses: SpineStatusConfig[];
  currentUser: CurrentUserType | null;
  activeFilter: 'all' | 'mine' | 'flagged';
}

export const isDoneStatus = (statusId: string, label: string = '') => {
  const s = (statusId || '').toLowerCase();
  const l = (label || '').toLowerCase();
  return (
    s === 'done' ||
    s.includes('concl') ||
    s.includes('finaliz') ||
    s.includes('postad') ||
    l.includes('concl') ||
    l.includes('done') ||
    l.includes('finaliz') ||
    l.includes('postad')
  );
};

export const getTaskNumericTimestamp = (t: Task): number => {
  if (t.lastMovedAt && typeof t.lastMovedAt === 'number') return t.lastMovedAt;
  if (t.id.startsWith('task-')) {
    const num = Number(t.id.replace('task-', ''));
    if (!isNaN(num) && num > 0) return num;
  }
  if (t.createdAt) {
    const d = new Date(t.createdAt).getTime();
    if (!isNaN(d) && d > 0) return d;
  }
  return 0;
};

export const useTasksFilter = ({
  tasks,
  projects,
  employees,
  spineStatuses,
  currentUser,
  activeFilter,
}: UseTasksFilterProps) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const debouncedSearchQuery = useDebounce(searchQuery, 250);
  const [selectedClient, setSelectedClient] = useState<string>('all');
  const [selectedMember, setSelectedMember] = useState<string>('all');
  const [isMemberDropdownOpen, setIsMemberDropdownOpen] = useState<boolean>(false);
  const [memberFilterSearch, setMemberFilterSearch] = useState<string>('');
  const [showDoneColumn, setShowDoneColumn] = useState<boolean>(true);
  const [sortBy, setSortBy] = useState<'default' | 'title' | 'dueDate' | 'points'>('default');
  const [visibleTasksCount, setVisibleTasksCount] = useState<number>(10);

  // Dynamic list of registered clients from projects
  const registeredClients = useMemo(() => {
    return Array.from(
      new Map(
        projects.flatMap((p) => {
          if (p.clientIds && p.clientIds.length > 0) {
            return p.clientIds.map((cId, idx) => {
              const clientName = p.clientNames?.[idx] || p.name;
              return [
                cId,
                {
                  id: cId,
                  name: clientName,
                  color: p.color || '#10B981',
                  icon: getClientLogoFallback(clientName, p.logoUrl),
                },
              ];
            });
          }
          return [
            [
              p.id,
              {
                id: p.id,
                name: p.name,
                color: p.color || '#10B981',
                icon: getClientLogoFallback(p.name, p.logoUrl),
              },
            ],
          ];
        })
      ).values()
    );
  }, [projects]);

  const columns = useMemo(() => {
    return spineStatuses
      .filter((s) => showDoneColumn || !isDoneStatus(s.id, s.label))
      .map((s) => ({
        id: s.id as TaskStatus,
        label: s.label,
        color: s.color,
        bg: s.bg,
        dotColor: s.dotColor,
      }));
  }, [spineStatuses, showDoneColumn]);

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

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
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

      // Member filter — verifica se o membro participa da tarefa (assignee ou members[])
      let matchesMember = true;
      if (selectedMember === 'mine') {
        matchesMember = isTaskAssignedToMe(t, currentUser);
      } else if (selectedMember !== 'all') {
        const emp = employees.find((e) => e.id === selectedMember);

        // Gestores e admins veem todas as tarefas — sem filtro de participação
        const empRole = (emp?.role || '').toLowerCase().trim();
        const empDept = (emp?.department || '').toLowerCase().trim();
        const isGestorOrAdmin =
          emp?.roleType === 'admin' ||
          emp?.roleType === 'manager' ||
          empRole.includes('gestor') ||
          empRole.includes('gerente') ||
          empRole.includes('manager') ||
          empRole.includes('admin') ||
          empRole.includes('administrador') ||
          empRole.includes('gestão') ||
          empRole.includes('gestao') ||
          empDept.includes('management') ||
          empDept.includes('gest') ||
          empDept.includes('geren');

        if (isGestorOrAdmin) {
          // Gestor/admin selecionado: mostra todas as tarefas
          matchesMember = true;
        } else {
          const empName = emp ? emp.name.toLowerCase().trim() : '';
          const empInitials = emp?.initials ? emp.initials.toUpperCase().trim() : '';

          // 1. Assignee direto pelo ID (mais confiável)
          const isAssignee = t.assigneeId === selectedMember;

          // 2. Membro no array members[] pelo ID exato
          const isMemberById = Array.isArray(t.members) && t.members.some((m) => m.id === selectedMember);

          // 3. Fallback: nome/iniciais do assignee (quando id pode ter sido salvo diferente)
          const isAssigneeByName =
            !isAssignee &&
            empName.length > 0 &&
            t.assigneeName != null &&
            t.assigneeName.toLowerCase().trim() === empName;

          const isAssigneeByInitials =
            !isAssignee &&
            empInitials.length > 0 &&
            t.assigneeInitials != null &&
            t.assigneeInitials.toUpperCase().trim() === empInitials;

          // 4. Fallback: nome/iniciais dentro do members[] (quando id pode estar ausente)
          const isMemberByNameOrInitials =
            !isMemberById &&
            Array.isArray(t.members) &&
            t.members.some(
              (m) =>
                (empName.length > 0 && m.name != null && m.name.toLowerCase().trim() === empName) ||
                (empInitials.length > 0 && m.initials != null && m.initials.toUpperCase().trim() === empInitials)
            );

          matchesMember =
            isAssignee || isMemberById || isAssigneeByName || isAssigneeByInitials || isMemberByNameOrInitials;
        }
      }

      // Search filter (com debounce para alta performance na digitação)
      let matchesSearch = true;
      if (debouncedSearchQuery.trim()) {
        const q = debouncedSearchQuery.toLowerCase();
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
        matchesActiveFilter = isTaskAssignedToMe(t, currentUser);
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
  }, [tasks, selectedClient, registeredClients, selectedMember, currentUser, employees, debouncedSearchQuery, activeFilter]);

  // Sort tasks
  const sortedTasks = useMemo(() => {
    return [...filteredTasks].sort((a, b) => {
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
  }, [filteredTasks, sortBy]);

  // Pagination / Visible tasks limit logic
  const paginatedTasks = useMemo(() => {
    return sortedTasks.slice(0, visibleTasksCount);
  }, [sortedTasks, visibleTasksCount]);

  const clearAllFilters = useCallback(() => {
    setSelectedClient('all');
    setSelectedMember('all');
    setSearchQuery('');
    setVisibleTasksCount(10);
  }, []);

  const exportTasksToCSV = useCallback(() => {
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

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `spine_tarefas_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [filteredTasks]);

  return {
    searchQuery,
    setSearchQuery,
    selectedClient,
    setSelectedClient,
    selectedMember,
    setSelectedMember,
    isMemberDropdownOpen,
    setIsMemberDropdownOpen,
    memberFilterSearch,
    setMemberFilterSearch,
    showDoneColumn,
    setShowDoneColumn,
    sortBy,
    setSortBy,
    visibleTasksCount,
    setVisibleTasksCount,
    registeredClients,
    columns,
    getSpineStatusConfig,
    filteredTasks,
    sortedTasks,
    paginatedTasks,
    clearAllFilters,
    exportTasksToCSV,
  };
};
