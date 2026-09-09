import { Task, Employee, Project } from '../../types';
import {
  isTaskOverdue,
  isTaskCompleted,
  isTaskInProgress,
  parseTaskDueDate,
} from '../../lib/taskDateUtils';

export type PeriodFilter = 'all' | '7d' | '30d' | 'month' | 'sprint';
export type DepartmentFilter = 'all' | 'design' | 'videomaker';
export type ComplexityLevel = 'complex' | 'medium' | 'simple';

export interface TaskComplexity {
  level: ComplexityLevel;
  label: string;
  score: number;
  color: string;
}

export interface EmployeeProductivityStat {
  employee: Employee;
  tasks: Task[];
  receivedCount: number;
  finishedCount: number;
  inProgressCount: number;
  overdueCount: number;
  avgRevisions: string;
  onTimePercentage: number;
  complexityBreakdown: {
    complex: number;
    medium: number;
    simple: number;
  };
  totalEffortScore: number;
  activeEffortScore: number;
  capacityUsedPercentage: number;
  capacityAvailablePercentage: number;
  capacityStatus: {
    label: string;
    color: string;
    badge: string;
  };
}

export interface GlobalSummaryMetrics {
  totalReceived: number;
  totalFinished: number;
  totalInProgress: number;
  totalOverdue: number;
  avgOnTime: number;
  avgRevisionsOverall: string;
  totalEffortScoreGlobal: number;
  avgCapacityAvailable: number;
}

/**
 * Classificação de complexidade da demanda baseada em tags, pontos e títulos.
 */
export const getTaskComplexity = (task: Task): TaskComplexity => {
  const text = `${task.title} ${task.category || ''}`.toLowerCase();

  if (task.points && task.points >= 5) {
    return {
      level: 'complex',
      label: 'Campanha / Complexa',
      score: 3,
      color: 'text-purple-400 bg-purple-950/60 border-purple-800/60',
    };
  }
  if (
    text.includes('campanha') ||
    text.includes('identidade') ||
    text.includes('branding') ||
    text.includes('completo') ||
    text.includes('key visual') ||
    text.includes('kv') ||
    text.includes('landing') ||
    text.includes('3d') ||
    text.includes('institucional')
  ) {
    return {
      level: 'complex',
      label: 'Campanha / Complexa',
      score: 3,
      color: 'text-purple-400 bg-purple-950/60 border-purple-800/60',
    };
  }

  if (task.points && task.points >= 3) {
    return {
      level: 'medium',
      label: 'Média Complexidade',
      score: 2,
      color: 'text-blue-400 bg-blue-950/60 border-blue-800/60',
    };
  }
  if (
    text.includes('motion') ||
    text.includes('video') ||
    text.includes('vídeo') ||
    text.includes('reels') ||
    text.includes('carrossel') ||
    text.includes('banner') ||
    text.includes('story') ||
    text.includes('stories') ||
    text.includes('criativo')
  ) {
    return {
      level: 'medium',
      label: 'Média Complexidade',
      score: 2,
      color: 'text-blue-400 bg-blue-950/60 border-blue-800/60',
    };
  }

  return {
    level: 'simple',
    label: 'Post Simples / Rápida',
    score: 1,
    color: 'text-emerald-400 bg-emerald-950/60 border-emerald-800/60',
  };
};

/**
 * Estimativa de revisões baseada em histórico de comentários e títulos.
 */
export const getTaskRevisionsCount = (task: Task): number => {
  const text = `${task.title} ${(task.comments || []).map((c) => c.text).join(' ')}`.toLowerCase();
  let count = 0;

  const matches = text.match(/rev(?:is[ãa]o)?\s*(\d+)|ajuste\s*(\d+)|v(\d+)/gi);
  if (matches) {
    matches.forEach((m) => {
      const numMatch = m.match(/\d+/);
      if (numMatch) {
        const num = parseInt(numMatch[0], 10);
        if (num > count && num < 15) count = num;
      }
    });
  }

  if (
    count === 0 &&
    (text.includes('ajuste') ||
      text.includes('altera') ||
      text.includes('revis') ||
      text.includes('refazer'))
  ) {
    count = 1;
  }

  return count;
};

export interface ReportClient {
  id: string;
  name: string;
  icon?: string;
  color?: string;
}

export const getClientLogoFallback = (name: string, logoUrl?: string): string | undefined => {
  if (logoUrl) return logoUrl;
  const n = (name || '').toLowerCase();
  if (n.includes('f12')) return '/icones/icon_f12.png';
  if (n.includes('galera')) return '/icones/icon_galera.png';
  if (n.includes('luva')) return '/icones/icon_luva.png';
  return undefined;
};

/**
 * Monta lista de clientes a partir de projetos e tarefas.
 */
export const getRegisteredClients = (
  projects: Project[],
  tasks: Task[]
): ReportClient[] => {
  const clientsMap = new Map<string, ReportClient>();

  projects
    .filter(
      (p) =>
        !p.id.startsWith('system-') &&
        !p.id.startsWith('google-') &&
        p.category?.toLowerCase() !== 'system' &&
        p.status !== 'system'
    )
    .forEach((p) => {
      if (p.clientIds && p.clientIds.length > 0) {
        p.clientIds.forEach((cId, idx) => {
          const clientName = p.clientNames?.[idx] || p.name;
          clientsMap.set(cId, {
            id: cId,
            name: clientName,
            icon: getClientLogoFallback(clientName, p.logoUrl),
            color: p.color || p.iconColor || '#10B981',
          });
        });
      } else {
        clientsMap.set(p.id, {
          id: p.id,
          name: p.name,
          icon: getClientLogoFallback(p.name, p.logoUrl),
          color: p.color || p.iconColor || '#10B981',
        });
      }
    });

  tasks.forEach((t) => {
    if (t.projectId && !clientsMap.has(t.projectId) && t.projectName) {
      clientsMap.set(t.projectId, {
        id: t.projectId,
        name: t.projectName,
        icon: getClientLogoFallback(t.projectName),
        color: '#10B981',
      });
    }
  });

  return Array.from(clientsMap.values());
};

/**
 * Filtra tarefas por período e cliente selecionado.
 */
export const filterReportTasks = (
  tasks: Task[],
  selectedClient: string,
  period: PeriodFilter,
  registeredClients: ReportClient[]
): Task[] => {
  const now = new Date();

  return tasks.filter((task) => {
    // 1. Filtro de cliente
    if (selectedClient !== 'all') {
      const clientObj = registeredClients.find((c) => c.id === selectedClient);
      const clientName = (clientObj?.name || selectedClient).toLowerCase().trim();
      const taskProject = (task.projectName || '').toLowerCase().trim();
      const taskCategory = (task.category || '').toLowerCase().trim();
      const matchesClient =
        task.projectId === selectedClient ||
        task.category === selectedClient ||
        (clientName ? taskProject.includes(clientName) || taskCategory.includes(clientName) : false);
      if (!matchesClient) {
        return false;
      }
    }

    // 2. Filtro de período
    if (period === 'all') return true;

    const dateObj =
      parseTaskDueDate(task.dueDate) ||
      parseTaskDueDate(task.createdAt) ||
      (task.createdAt ? new Date(task.createdAt) : null);

    if (!dateObj || isNaN(dateObj.getTime())) return true;

    if (period === '7d') {
      const diffDays = (now.getTime() - dateObj.getTime()) / (1000 * 3600 * 24);
      return diffDays >= 0 && diffDays <= 7;
    }
    if (period === '30d') {
      const diffDays = (now.getTime() - dateObj.getTime()) / (1000 * 3600 * 24);
      return diffDays >= 0 && diffDays <= 30;
    }
    if (period === 'month') {
      return (
        dateObj.getMonth() === now.getMonth() &&
        dateObj.getFullYear() === now.getFullYear()
      );
    }

    return true;
  });
};

/**
 * Filtra colaboradores participantes do relatório (Designers e Video Makers).
 */
export const filterReportEmployees = (
  employees: Employee[],
  selectedDept: DepartmentFilter,
  searchMember: string
): Employee[] => {
  return employees.filter((emp) => {
    const role = (emp.role || '').toLowerCase();
    const name = (emp.name || '').toLowerCase();
    const dept = (emp.department || '').toLowerCase();
    const tags = (emp.tags || []).map((t) => t.toLowerCase());

    if (searchMember && !name.includes(searchMember.toLowerCase())) {
      return false;
    }

    const isDesigner =
      role.includes('design') ||
      dept.includes('design') ||
      tags.some((t) => t.includes('design'));

    const isVideoMaker =
      role.includes('video') ||
      role.includes('maker') ||
      role.includes('motion') ||
      role.includes('audiovisual') ||
      role.includes('edição') ||
      dept.includes('audiovisual') ||
      dept.includes('video') ||
      tags.some((t) => t.includes('video') || t.includes('maker') || t.includes('motion'));

    if (!isDesigner && !isVideoMaker) {
      return false;
    }

    if (selectedDept === 'design') {
      return isDesigner;
    }
    if (selectedDept === 'videomaker') {
      return isVideoMaker;
    }

    return true;
  });
};

/**
 * Calcula as métricas de produtividade individuais por colaborador.
 */
export const computeProductivityStats = (
  reportEmployees: Employee[],
  filteredTasks: Task[]
): EmployeeProductivityStat[] => {
  return reportEmployees.map((emp) => {
    const empId = emp.id.toLowerCase().trim();
    const empName = emp.name.toLowerCase().trim();
    const empFirstName = empName.split(' ')[0];

    const empTasks = filteredTasks.filter((task) => {
      if (
        task.assigneeId &&
        (task.assigneeId === emp.id || task.assigneeId.toLowerCase().trim() === empId)
      ) {
        return true;
      }
      if (task.assigneeName) {
        const aName = task.assigneeName.toLowerCase().trim();
        if (aName === empName || (empFirstName.length > 2 && aName.includes(empFirstName))) {
          return true;
        }
      }
      if (task.members && task.members.length > 0) {
        const isMember = task.members.some((m) => {
          if (!m) return false;
          const mId = (m.id || '').toLowerCase().trim();
          const mName = (m.name || '').toLowerCase().trim();
          return (
            mId === empId ||
            mName === empName ||
            (empFirstName.length > 2 && mName.includes(empFirstName))
          );
        });
        if (isMember) return true;
      }
      return false;
    });

    const receivedTasks = empTasks.filter((t) => {
      const s = (t.status || '').toLowerCase();
      if (s === 'backlog' && !t.assigneeId && !t.assigneeName) return false;
      return true;
    });
    const receivedCount = receivedTasks.length;
    const finishedCount = empTasks.filter((t) => isTaskCompleted(t)).length;
    const inProgressTasks = empTasks.filter((t) => isTaskInProgress(t));
    const inProgressCount = inProgressTasks.length;
    const overdueTasks = empTasks.filter((t) => isTaskOverdue(t));
    const overdueCount = overdueTasks.length;

    const totalRevisions = empTasks.reduce((acc, t) => acc + getTaskRevisionsCount(t), 0);
    const avgRevisions = receivedCount > 0 ? (totalRevisions / receivedCount).toFixed(1) : '0.0';

    const tasksWithDueDate = empTasks.filter((t) => Boolean(parseTaskDueDate(t.dueDate)));
    let onTimePercentage = 100;
    if (tasksWithDueDate.length > 0) {
      const onTimeCount = Math.max(0, tasksWithDueDate.length - overdueCount);
      onTimePercentage = Math.round((onTimeCount / tasksWithDueDate.length) * 100);
    } else if (overdueCount > 0) {
      onTimePercentage = 0;
    } else if (receivedCount === 0) {
      onTimePercentage = 100;
    }

    const complexityBreakdown = {
      complex: empTasks.filter((t) => getTaskComplexity(t).level === 'complex').length,
      medium: empTasks.filter((t) => getTaskComplexity(t).level === 'medium').length,
      simple: empTasks.filter((t) => getTaskComplexity(t).level === 'simple').length,
    };

    const totalEffortScore =
      complexityBreakdown.complex * 3 +
      complexityBreakdown.medium * 2 +
      complexityBreakdown.simple * 1;

    const activeEffortScore = inProgressTasks.reduce(
      (acc, t) => acc + getTaskComplexity(t).score,
      0
    );
    const capacityUsedPercentage = Math.min(Math.round((activeEffortScore / 10) * 100), 100);
    const capacityAvailablePercentage = Math.max(100 - capacityUsedPercentage, 0);

    let capacityStatus = {
      label: 'Alta Disponibilidade',
      color: 'text-emerald-400',
      badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    };

    if (capacityUsedPercentage >= 90) {
      capacityStatus = {
        label: 'Sobrecarga Crítica',
        color: 'text-rose-400',
        badge: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      };
    } else if (capacityUsedPercentage >= 65) {
      capacityStatus = {
        label: 'Carga Alta (Atenção)',
        color: 'text-amber-400',
        badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      };
    } else if (capacityUsedPercentage >= 35) {
      capacityStatus = {
        label: 'Equilibrada (Ideal)',
        color: 'text-blue-400',
        badge: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
      };
    }

    return {
      employee: emp,
      tasks: empTasks,
      receivedCount,
      finishedCount,
      inProgressCount,
      overdueCount,
      avgRevisions,
      onTimePercentage,
      complexityBreakdown,
      totalEffortScore,
      activeEffortScore,
      capacityUsedPercentage,
      capacityAvailablePercentage,
      capacityStatus,
    };
  });
};

/**
 * Sumariza os totais consolidados para os cards superiores.
 */
export const computeGlobalSummary = (
  productivityStats: EmployeeProductivityStat[]
): GlobalSummaryMetrics => {
  const totalReceived = productivityStats.reduce((acc, s) => acc + s.receivedCount, 0);
  const totalFinished = productivityStats.reduce((acc, s) => acc + s.finishedCount, 0);
  const totalInProgress = productivityStats.reduce((acc, s) => acc + s.inProgressCount, 0);
  const totalOverdue = productivityStats.reduce((acc, s) => acc + s.overdueCount, 0);

  const totalWithDueDate = productivityStats.reduce((acc, s) => {
    return acc + s.tasks.filter((t) => Boolean(parseTaskDueDate(t.dueDate))).length;
  }, 0);

  const avgOnTime =
    totalWithDueDate > 0
      ? Math.max(0, Math.round(((totalWithDueDate - totalOverdue) / totalWithDueDate) * 100))
      : totalOverdue > 0
      ? 0
      : 100;

  const avgRevisionsOverall =
    productivityStats.length > 0
      ? (
          productivityStats.reduce((acc, s) => acc + parseFloat(s.avgRevisions), 0) /
          productivityStats.length
        ).toFixed(1)
      : '0.0';

  const totalEffortScoreGlobal = productivityStats.reduce((acc, s) => acc + s.totalEffortScore, 0);

  const avgCapacityAvailable =
    productivityStats.length > 0
      ? Math.round(
          productivityStats.reduce((acc, s) => acc + s.capacityAvailablePercentage, 0) /
            productivityStats.length
        )
      : 100;

  return {
    totalReceived,
    totalFinished,
    totalInProgress,
    totalOverdue,
    avgOnTime,
    avgRevisionsOverall,
    totalEffortScoreGlobal,
    avgCapacityAvailable,
  };
};

/**
 * Exporta a lista de estatísticas para arquivo CSV formatado com UTF-8 BOM.
 */
export const exportReportsToCSV = (productivityStats: EmployeeProductivityStat[]): void => {
  const headers = [
    'Colaborador',
    'Cargo',
    'Demandas Recebidas',
    'Demandas Finalizadas',
    'Em Andamento',
    'Atrasadas',
    'Media de Revisoes',
    'Cumprimento de Prazo (%)',
    'Capacidade Disponivel (%)',
    'Status Capacidade',
    'Pontos de Esforco Ponderado',
    'Campanhas Complexas',
    'Medias',
    'Posts Simples',
  ];

  const rows = productivityStats.map((s) => [
    `"${s.employee.name}"`,
    `"${s.employee.role}"`,
    s.receivedCount,
    s.finishedCount,
    s.inProgressCount,
    s.overdueCount,
    s.avgRevisions,
    `${s.onTimePercentage}%`,
    `${s.capacityAvailablePercentage}%`,
    `"${s.capacityStatus.label}"`,
    s.totalEffortScore,
    s.complexityBreakdown.complex,
    s.complexityBreakdown.medium,
    s.complexityBreakdown.simple,
  ]);

  const csvContent =
    'data:text/csv;charset=utf-8,\uFEFF' +
    [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute(
    'download',
    `relatorio_produtividade_colaboradores_${new Date().toISOString().split('T')[0]}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
