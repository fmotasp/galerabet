import React, { useState, useMemo, useCallback } from 'react';
import {
  BarChart3,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Download,
  Users,
  Briefcase,
  Percent,
  ChevronDown,
  Calendar,
  Filter,
} from 'lucide-react';
import { useTasks, useProjects, useEmployees, useApp } from '../../context/AppContext';
import type { Task } from '../../types';
import { useCountUp } from '../../hooks/useCountUp';
import { isTaskOverdue, isTaskCompleted, getTaskOverdueDays, parseTaskDueDate } from '../../lib/taskDateUtils';
import { getClientLogoFallback } from '../tasks/useTasksFilter';
import { ReportsDataViz } from './ReportsDataViz';
import { useDropdownA11y } from '../../hooks/useDropdownA11y';

// Helper para identificar exclusivamente profissionais de Design e Audiovisual/Vídeo
export const isDesignerOrVideomaker = (emp: { id?: string; name?: string; role?: string; department?: string; tags?: string[] }): boolean => {
  const name = (emp.name || '').toLowerCase();
  const id = (emp.id || '').toLowerCase();
  if (
    name.includes('felipe mota') ||
    name.includes('giovanni dias') ||
    id === 'emp-felipe' ||
    id === 'emp-1788927461378'
  ) {
    return true;
  }

  const role = (emp.role || '').toLowerCase();
  const dept = (emp.department || '').toLowerCase();
  const tags = (emp.tags || []).map((t) => t.toLowerCase());

  // Excluir expressamente Marketing, Social Media, Conteúdo se não tiver menção a Design/Vídeo
  const isMarketingOrOther =
    (role.includes('marketing') || dept.includes('marketing') ||
     role.includes('social media') || dept.includes('social media') ||
     role.includes('conteúdo') || role.includes('conteudo') || dept.includes('conteúdo') || dept.includes('conteudo') ||
     role.includes('redator') || role.includes('copywriter')) &&
    !role.includes('design') && !role.includes('video') && !role.includes('vídeo') && !role.includes('audiovisual');

  if (isMarketingOrOther) return false;

  const matchesDesign =
    role.includes('design') ||
    dept.includes('design') ||
    tags.some((t) => t.includes('design'));

  const matchesVideo =
    role.includes('video') ||
    role.includes('vídeo') ||
    role.includes('audiovisual') ||
    role.includes('audio visual') ||
    role.includes('videomaker') ||
    role.includes('video maker') ||
    role.includes('motion') ||
    role.includes('editor') ||
    role.includes('filmmaker') ||
    dept.includes('video') ||
    dept.includes('vídeo') ||
    dept.includes('audiovisual') ||
    tags.some((t) => t.includes('video') || t.includes('audio') || t.includes('motion'));

  return matchesDesign || matchesVideo;
};

// Helper para parsing seguro de datas
const parseDateSafe = (val?: string | number | null): Date | null => {
  if (!val) return null;
  if (typeof val === 'number') {
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }
  const str = String(val).trim();
  if (str.includes('/')) {
    const parts = str.split(' ')[0].split('/');
    if (parts.length === 3) {
      const d = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
      if (!isNaN(d.getTime())) return d;
    }
  }
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
};


// Helper: tarefa entregue (concluída ou enviada para aprovação)
const isTaskDoneOrInReview = (t: Task): boolean => {
  const s = (t.status || '').toLowerCase().trim();
  return (
    isTaskCompleted(t) ||
    s === 'in_review' ||
    s === 'postar' ||
    s.includes('aprov') ||
    s.includes('revis') ||
    Boolean(t.deliveredAt)
  );
};


// Cálculos de SLA, prazos e ciclo para um conjunto de tarefas
const computeMetrics = (filteredTasks: Task[]) => {
  const total = filteredTasks.length;
  const completed = filteredTasks.filter(isTaskDoneOrInReview);
  const active = filteredTasks.filter((t) => !isTaskDoneOrInReview(t));
  const overdueActive = active.filter((t) => isTaskOverdue(t));

  // SLA de tarefas concluídas
  let onTimeCount = 0;
  let lateCount = 0;
  let noDueDateCount = 0;
  const leadTimes: number[] = [];

  completed.forEach((t) => {
    const due = parseTaskDueDate(t.dueDate);
    const delivery = parseDateSafe(t.deliveredAt) || (t.lastMovedAt ? new Date(t.lastMovedAt) : null);

    if (due && delivery) {
      // Tolerância até o final do dia do prazo
      const dueEnd = new Date(due);
      dueEnd.setHours(23, 59, 59, 999);
      if (delivery.getTime() <= dueEnd.getTime()) {
        onTimeCount++;
      } else {
        lateCount++;
      }
    } else if (!due && delivery) {
      // Sem prazo definido não dá para avaliar pontualidade: fica fora do índice de SLA
      noDueDateCount++;
    }

    const created = parseDateSafe(t.createdAt);
    if (created && delivery && delivery >= created) {
      const days = (delivery.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
      leadTimes.push(days);
    }
  });

  const evaluatedCompleted = onTimeCount + lateCount;
  // Sem entregas avaliáveis não existe SLA: null evita mostrar um falso 100%
  const slaRate = evaluatedCompleted > 0 ? Math.round((onTimeCount / evaluatedCompleted) * 100) : null;

  // Média sozinha é distorcida por poucas demandas muito longas: mostramos também mediana e P85
  const sortedLeadTimes = [...leadTimes].sort((a, b) => a - b);
  const percentile = (p: number): string | null => {
    if (sortedLeadTimes.length === 0) return null;
    const idx = Math.min(sortedLeadTimes.length - 1, Math.ceil(p * sortedLeadTimes.length) - 1);
    return sortedLeadTimes[Math.max(0, idx)].toFixed(1);
  };
  const avgLeadTime = leadTimes.length > 0 ? (leadTimes.reduce((a, b) => a + b, 0) / leadTimes.length).toFixed(1) : null;
  const medianLeadTime = percentile(0.5);
  const p85LeadTime = percentile(0.85);
  const totalPoints = completed.reduce((sum, t) => sum + (t.points || 1), 0);

  return {
    total,
    completedCount: completed.length,
    activeCount: active.length,
    overdueActiveCount: overdueActive.length,
    onTimeCount,
    lateCount,
    noDueDateCount,
    slaRate,
    avgLeadTime,
    medianLeadTime,
    p85LeadTime,
    totalPoints,
    overdueTasks: overdueActive.sort((a, b) => getTaskOverdueDays(b) - getTaskOverdueDays(a)),
  };
};

type DrillKey = 'delivered' | 'late' | 'overdue' | 'active';

const DRILL_TITLES: Record<DrillKey, string> = {
  delivered: 'Demandas entregues',
  late: 'Entregas fora do prazo',
  overdue: 'Atrasadas em aberto',
  active: 'Demandas em andamento',
};

// Variação percentual vs período anterior. `lowerIsBetter` inverte a cor (ex.: atrasos, ciclo)
const Delta: React.FC<{ current: number | null; previous: number | null; lowerIsBetter?: boolean; unit?: 'pct' | 'pp' }> = ({
  current,
  previous,
  lowerIsBetter = false,
  unit = 'pct',
}) => {
  if (current === null || previous === null) return null;
  const diff = current - previous;
  if (Math.abs(diff) < 0.05) {
    return <span className="text-xs text-slate-500">= igual ao período anterior</span>;
  }
  let label: string;
  if (unit === 'pp') {
    label = `${Math.abs(Math.round(diff))} p.p.`;
  } else if (previous === 0) {
    label = 'novo';
  } else {
    label = `${Math.abs(Math.round((diff / previous) * 100))}%`;
  }
  const good = lowerIsBetter ? diff < 0 : diff > 0;
  return (
    <span className={`text-xs font-semibold tabular-nums ${good ? 'text-emerald-400' : 'text-rose-400'}`}>
      {diff > 0 ? '↑' : '↓'} {label} <span className="text-slate-500 font-normal">vs. período anterior</span>
    </span>
  );
};

export const ReportsView: React.FC = () => {
  const { tasks } = useTasks();
  const { projects } = useProjects();
  const { employees } = useEmployees();
  const { spineStatuses, setEditingTask, setActiveTab } = useApp();

  // Filtrar colaboradores válidos: apenas Designers e Videomakers
  const creativeEmployees = useMemo(() => {
    return employees.filter(isDesignerOrVideomaker);
  }, [employees]);

  const creativeEmployeeIds = useMemo(() => new Set(creativeEmployees.map((e) => e.id)), [creativeEmployees]);
  const creativeEmployeeNames = useMemo(() => new Set(creativeEmployees.map((e) => e.name.toLowerCase().trim())), [creativeEmployees]);

  // Filtros Globais
  const [periodFilter, setPeriodFilter] = useState<'all' | '7days' | '30days'>('all');
  const [selectedClientId, setSelectedClientId] = useState<string>('all');
  const [selectedMemberId, setSelectedMemberId] = useState<string>('all');
  const [isClientMenuOpen, setIsClientMenuOpen] = useState(false);
  useDropdownA11y(isClientMenuOpen, () => setIsClientMenuOpen(false));
  const [isMemberMenuOpen, setIsMemberMenuOpen] = useState(false);
  useDropdownA11y(isMemberMenuOpen, () => setIsMemberMenuOpen(false));
  const [drill, setDrill] = useState<DrillKey | null>(null);

  // 1. Filtragem das tarefas: escopo (cliente + membro) e período
  const periodDays = periodFilter === '7days' ? 7 : periodFilter === '30days' ? 30 : null;

  const matchesScope = useCallback(
    (t: Task): boolean => {
      // Filtro de Cliente
      if (selectedClientId !== 'all') {
        const pObj = projects.find((p) => p.id === selectedClientId);
        const targetName = (pObj?.name || selectedClientId).toLowerCase().trim();
        const cardLabels = (t.labels || []).map((l) => (l.name || '').toLowerCase().trim());
        const catNames = (t.category || '').toLowerCase().split(',').map((c) => c.trim());
        const matches =
          t.projectId === selectedClientId ||
          (t.projectName && t.projectName.toLowerCase().includes(targetName)) ||
          cardLabels.some((l) => l.includes(targetName) || targetName.includes(l)) ||
          catNames.some((c) => c.includes(targetName) || targetName.includes(c));

        if (!matches) return false;
      }

      // Filtro de Membro (apenas designers / videomakers disponíveis)
      if (selectedMemberId !== 'all') {
        const emp = creativeEmployees.find((e) => e.id === selectedMemberId);
        const empName = emp ? emp.name.toLowerCase().trim() : '';
        const isAssigned =
          t.assigneeId === selectedMemberId ||
          (Array.isArray(t.members) && t.members.some((m) => m.id === selectedMemberId)) ||
          (empName && t.assigneeName && t.assigneeName.toLowerCase().trim() === empName);

        if (!isAssigned) return false;
      }

      return true;
    },
    [selectedClientId, selectedMemberId, projects, creativeEmployees]
  );

  const getTaskDates = (t: Task): Date[] =>
    [
      parseDateSafe(t.createdAt),
      parseDateSafe(t.deliveredAt),
      parseDateSafe(t.dueDate),
      t.lastMovedAt ? new Date(t.lastMovedAt) : null,
    ].filter(Boolean) as Date[];

  const filteredTasks = useMemo(() => {
    const cutoffDate = new Date();
    if (periodDays) cutoffDate.setDate(cutoffDate.getDate() - periodDays);

    return tasks.filter((t) => {
      if (periodDays && !getTaskDates(t).some((d) => d >= cutoffDate)) return false;
      return matchesScope(t);
    });
  }, [tasks, periodDays, matchesScope]);

  // Período anterior (mesma duração, imediatamente antes): só tarefas sem nenhuma data no período atual,
  // para os dois conjuntos nunca se sobreporem
  const previousTasks = useMemo(() => {
    if (!periodDays) return [] as Task[];
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - periodDays);
    const prevCutoff = new Date(cutoffDate);
    prevCutoff.setDate(prevCutoff.getDate() - periodDays);

    return tasks.filter((t) => {
      const dates = getTaskDates(t);
      if (dates.some((d) => d >= cutoffDate)) return false;
      if (!dates.some((d) => d >= prevCutoff)) return false;
      return matchesScope(t);
    });
  }, [tasks, periodDays, matchesScope]);

  // 2. Cálculos de SLA e Cumprimento de Prazos (período atual e anterior)
  const metrics = useMemo(() => computeMetrics(filteredTasks), [filteredTasks]);
  const completedShown = useCountUp(metrics.completedCount);
  const overdueShown = useCountUp(metrics.overdueActiveCount);
  const previousMetrics = useMemo(
    () => (periodDays && previousTasks.length > 0 ? computeMetrics(previousTasks) : null),
    [periodDays, previousTasks]
  );

  const drillTasks = useMemo(() => {
    if (!drill) return [] as Task[];
    const list = filteredTasks.filter(isTaskDoneOrInReview);
    switch (drill) {
      case 'delivered':
        return list;
      case 'late':
        return list.filter((t) => {
          const due = parseTaskDueDate(t.dueDate);
          const delivery = parseDateSafe(t.deliveredAt) || (t.lastMovedAt ? new Date(t.lastMovedAt) : null);
          if (!due || !delivery) return false;
          const dueEnd = new Date(due);
          dueEnd.setHours(23, 59, 59, 999);
          return delivery.getTime() > dueEnd.getTime();
        });
      case 'overdue':
        return metrics.overdueTasks;
      case 'active':
        return filteredTasks.filter((t) => !isTaskDoneOrInReview(t));
    }
  }, [drill, filteredTasks, metrics]);

  const openTaskFromReport = useCallback(
    (task: Task) => {
      setActiveTab('tasks');
      setEditingTask(task);
    },
    [setActiveTab, setEditingTask]
  );

  // 3. Produtividade por Membro: apenas Designers e Videomakers
  const memberProductivity = useMemo(() => {
    return creativeEmployees.map((emp) => {
      const empName = emp.name.toLowerCase().trim();
      const empTasks = filteredTasks.filter(
        (t) =>
          t.assigneeId === emp.id ||
          (Array.isArray(t.members) && t.members.some((m) => m.id === emp.id || (m.name && m.name.toLowerCase().trim() === empName))) ||
          (t.assigneeName && t.assigneeName.toLowerCase().trim() === empName)
      );

      const completed = empTasks.filter(isTaskDoneOrInReview);
      const inProgress = empTasks.filter((t) => t.status === 'in_progress');
      const inAdjustments = empTasks.filter(
        (t) =>
          t.status === 'ajustes' ||
          (t.activityLog && t.activityLog.some((a) => a.type === 'status_changed' && (a.details?.includes('Ajustes') || a.description?.includes('Ajustes'))))
      );
      const points = completed.reduce((sum, t) => sum + (t.points || 1), 0);
      const overdue = empTasks.filter((t) => !isTaskDoneOrInReview(t) && isTaskOverdue(t)).length;

      return {
        id: emp.id,
        name: emp.name,
        initials: emp.initials,
        avatarUrl: emp.avatarUrl,
        department: emp.department || emp.role || 'Criação',
        total: empTasks.length,
        completed: completed.length,
        inProgress: inProgress.length,
        adjustments: inAdjustments.length,
        adjustmentRate: empTasks.length > 0 ? Math.round((inAdjustments.length / empTasks.length) * 100) : 0,
        overdue,
        points,
      };
    }).sort((a, b) => b.completed - a.completed || b.total - a.total);
  }, [creativeEmployees, filteredTasks]);

  // 4. Volume e Distribuição por Cliente
  const clientDistribution = useMemo(() => {
    return projects.map((p) => {
      const pName = p.name.toLowerCase().trim();
      const clientTasks = filteredTasks.filter((t) => {
        const labels = (t.labels || []).map((l) => (l.name || '').toLowerCase().trim());
        const cats = (t.category || '').toLowerCase().split(',').map((c) => c.trim());
        return (
          t.projectId === p.id ||
          (t.projectName && t.projectName.toLowerCase().includes(pName)) ||
          labels.some((l) => l.includes(pName) || pName.includes(l)) ||
          cats.some((c) => c.includes(pName) || pName.includes(c))
        );
      });

      const completed = clientTasks.filter(isTaskDoneOrInReview).length;
      const overdue = clientTasks.filter((t) => !isTaskDoneOrInReview(t) && isTaskOverdue(t)).length;
      const pending = clientTasks.length - completed;

      // Contagem detalhada por todas as colunas / status do pipeline
      const statusCounts: Record<string, number> = {};
      spineStatuses.forEach((st) => {
        statusCounts[st.id] = clientTasks.filter((t) => (t.status || 'backlog') === st.id).length;
      });

      return {
        id: p.id,
        name: p.name,
        color: p.color || '#E4007E',
        logoUrl: getClientLogoFallback(p.name, p.logoUrl),
        total: clientTasks.length,
        completed,
        pending,
        overdue,
        completionRate: clientTasks.length > 0 ? Math.round((completed / clientTasks.length) * 100) : 0,
        statusCounts,
      };
    }).filter((c) => c.total > 0 || selectedClientId === c.id)
      .sort((a, b) => b.total - a.total);
  }, [projects, filteredTasks, selectedClientId, spineStatuses]);

  // 5. Funil de Gargalos por Status
  const statusFunnel = useMemo(() => {
    const total = filteredTasks.length || 1;
    return spineStatuses.map((st) => {
      const count = filteredTasks.filter((t) => t.status === st.id).length;
      const percentage = Math.round((count / total) * 100);
      return {
        id: st.id,
        label: st.label,
        color: st.color,
        bg: st.bg,
        dotColor: st.dotColor || '#E4007E',
        count,
        percentage,
      };
    });
  }, [spineStatuses, filteredTasks]);

  // 5.5 Tempo Médio por Coluna
  const timeInColumns = useMemo(() => {
    const statusDurations: Record<string, { totalMs: number, count: number }> = {};
    
    // Inicializa todos os status do spine para aparecerem no relatório mesmo se 0
    spineStatuses.forEach(st => {
      statusDurations[st.label.toUpperCase()] = { totalMs: 0, count: 0 };
    });

    const getLabel = (log: any) => {
      const text = (log.details || log.description || '');
      const m = text.match(/coluna (.*)|status \"(.*?)\"|para \"(.*?)\"/i);
      if (m) return (m[1] || m[2] || m[3]).toUpperCase();
      return null;
    };

    filteredTasks.forEach((task) => {
      if (!task.activityLog || task.activityLog.length === 0) return;

      const logs = [...task.activityLog].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      
      let currentStatus = (spineStatuses[0]?.label || 'NOVOS PEDIDOS').toUpperCase();
      let lastTimestamp = new Date(task.createdAt || logs[0].timestamp).getTime();

      logs.forEach((log) => {
        if (log.type === 'status_changed' || log.type === 'delivered') {
          const ts = new Date(log.timestamp).getTime();
          const duration = ts - lastTimestamp;
          
          if (duration > 0) {
            if (!statusDurations[currentStatus]) statusDurations[currentStatus] = { totalMs: 0, count: 0 };
            statusDurations[currentStatus].totalMs += duration;
            statusDurations[currentStatus].count += 1;
          }

          const nextStatus = getLabel(log);
          if (nextStatus) {
            currentStatus = nextStatus;
          }
          lastTimestamp = ts;
        }
      });

      if (!isTaskCompleted(task)) {
        const duration = Date.now() - lastTimestamp;
        if (duration > 0) {
          if (!statusDurations[currentStatus]) statusDurations[currentStatus] = { totalMs: 0, count: 0 };
          statusDurations[currentStatus].totalMs += duration;
          statusDurations[currentStatus].count += 1;
        }
      }
    });

    const computedColumns = spineStatuses
      .filter(st => !st.label.toLowerCase().includes('conclu') && st.id !== 'done')
      .map(st => {
      const label = st.label.toUpperCase();
      const data = statusDurations[label];
      const avgMs = data && data.count > 0 ? data.totalMs / data.count : 0;
      const avgHours = avgMs / (1000 * 60 * 60);
      const avgDays = avgHours / 24;
      
      let displayStr = '0h';
      if (avgDays >= 1) {
        displayStr = `${avgDays.toFixed(1)} dias`;
      } else if (avgHours > 0) {
        displayStr = `${avgHours.toFixed(1)} horas`;
      }

      return {
        id: st.id,
        label: st.label,
        bg: st.bg,
        dotColor: st.dotColor || '#E4007E',
        avgHours,
        displayStr,
      };
    });

    const maxHours = Math.max(...computedColumns.map(c => c.avgHours));
    return computedColumns.map(c => ({
      ...c,
      isMax: maxHours > 0 && c.avgHours === maxHours,
    }));
  }, [filteredTasks, spineStatuses]);

  // 6. Exportação para CSV
  const handleExportCSV = useCallback(() => {
    const rows: string[] = [];
    rows.push('RELATORIO GERENCIAL - DASHBOARD EXECUTIVO');
    rows.push(`Gerado em: ${new Date().toLocaleString('pt-BR')}`);
    rows.push(`Filtro de Periodo: ${periodFilter}`);
    rows.push(`Total de Demandas Avaliadas: ${metrics.total}`);
    rows.push(`SLA / Pontualidade: ${metrics.slaRate === null ? 'sem dados' : `${metrics.slaRate}%`}`);
    rows.push(`Concluidas: ${metrics.completedCount}`);
    rows.push(`Atrasadas Ativas: ${metrics.overdueActiveCount}`);
    rows.push(`Tempo Medio de Producao: ${metrics.avgLeadTime === null ? 'sem dados' : `${metrics.avgLeadTime} dias`}`);
    rows.push(`Tempo de Producao (mediana): ${metrics.medianLeadTime === null ? 'sem dados' : `${metrics.medianLeadTime} dias`}`);
    rows.push(`Tempo de Producao (P85): ${metrics.p85LeadTime === null ? 'sem dados' : `${metrics.p85LeadTime} dias`}`);
    rows.push('');

    // Produtividade por Membro
    rows.push('--- PRODUTIVIDADE POR MEMBRO ---');
    rows.push('Membro;Departamento;Total;Concluidas;Em Producao;Ajustes;Taxa Ajustes;Atrasadas;Pontos');
    memberProductivity.forEach((m) => {
      rows.push(`"${m.name}";"${m.department}";${m.total};${m.completed};${m.inProgress};${m.adjustments};${m.adjustmentRate}%;${m.overdue};${m.points}`);
    });
    rows.push('');

    // Volume por Cliente com contagem por coluna
    rows.push('--- DEMANDAS POR CLIENTE (CONTAGEM POR COLUNAS) ---');
    const statusHeaders = spineStatuses.map((s) => s.label).join(';');
    rows.push(`Cliente;Total Demandas;Concluidas;Pendentes;Atrasadas;Taxa Conclusao;${statusHeaders}`);
    clientDistribution.forEach((c) => {
      const statusCols = spineStatuses.map((s) => c.statusCounts[s.id] || 0).join(';');
      rows.push(`"${c.name}";${c.total};${c.completed};${c.pending};${c.overdue};${c.completionRate}%;${statusCols}`);
    });
    rows.push('');

    // Tarefas Atrasadas
    if (metrics.overdueTasks.length > 0) {
      rows.push('--- DEMANDAS ATRASADAS ATIVAS ---');
      rows.push('ID;Titulo;Cliente;Responsavel;Prazo;Dias Atraso');
      metrics.overdueTasks.forEach((t) => {
        rows.push(`"${t.id}";"${t.title.replace(/"/g, '""')}";"${t.projectName || ''}";"${t.assigneeName || ''}";"${t.dueDate || ''}";${getTaskOverdueDays(t)} dias`);
      });
    }

    const blob = new Blob(['\uFEFF' + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `relatorio-gestao-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [periodFilter, metrics, memberProductivity, clientDistribution]);

  return (
    <div className="space-y-6 w-full px-4 sm:px-8 pb-16 animate-in fade-in duration-300">
      {/* Header com Filtros Executivos e Ação de Exportar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-line">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand/10 border border-brand/30 text-brand">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-white tracking-tight flex items-center gap-2">
                Relatórios para Gestores
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/30 font-medium">
                  Dados Reais
                </span>
              </h1>
              <p className="text-xs text-slate-400 font-medium">
                Visão consolidada de SLA, produtividade da equipe e gargalos de produção em tempo real.
              </p>
            </div>
          </div>
        </div>

        {/* Barra de Filtros e Botão Exportar (Redesign Impeccable) */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Filtro de Período em Pílulas (Frameless - sem caixa externa) */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setPeriodFilter('all')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                periodFilter === 'all'
                  ? 'bg-brand text-white shadow-xs'
                  : 'bg-surface text-slate-400 border border-line hover:text-white hover:bg-field hover:border-[#333]'
              }`}
            >
              Tudo
            </button>
            <button
              type="button"
              onClick={() => setPeriodFilter('30days')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                periodFilter === '30days'
                  ? 'bg-brand text-white shadow-xs'
                  : 'bg-surface text-slate-400 border border-line hover:text-white hover:bg-field hover:border-[#333]'
              }`}
            >
              30 dias
            </button>
            <button
              type="button"
              onClick={() => setPeriodFilter('7days')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                periodFilter === '7days'
                  ? 'bg-brand text-white shadow-xs'
                  : 'bg-surface text-slate-400 border border-line hover:text-white hover:bg-field hover:border-[#333]'
              }`}
            >
              7 dias
            </button>
          </div>

          {/* Filtro de Cliente com Logo */}
          <div className="relative">
            {isClientMenuOpen && (
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsClientMenuOpen(false)}
              />
            )}
            <button aria-haspopup="true" aria-expanded={isClientMenuOpen}
              type="button"
              onClick={() => {
                setIsClientMenuOpen(!isClientMenuOpen);
                setIsMemberMenuOpen(false);
              }}
              className="flex items-center gap-2 px-3 py-2 bg-surface hover:bg-raised border border-line hover:border-line-hover text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-98"
            >
              {(() => {
                if (selectedClientId === 'all') {
                  return (
                    <>
                      <div className="w-4 h-4 rounded bg-white/10 flex items-center justify-center text-[11px]">🏢</div>
                      <span>Todos os Clientes</span>
                    </>
                  );
                }
                const activeClient = projects.find((p) => p.id === selectedClientId);
                const logo = getClientLogoFallback(activeClient?.name, activeClient?.logoUrl);
                return (
                  <>
                    {logo ? (
                      <img src={logo} alt="" className="w-4 h-4 rounded object-contain shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded bg-brand text-white text-[11px] flex items-center justify-center font-bold">
                        {activeClient?.name.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <span className="truncate max-w-[120px]">{activeClient?.name}</span>
                  </>
                );
              })()}
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 ml-1" />
            </button>

            {isClientMenuOpen && (
              <div data-menu className="absolute left-0 top-11 z-50 min-w-[200px] max-h-64 overflow-y-auto bg-popover border border-line-strong rounded-2xl p-1.5 shadow-2xl space-y-0.5 custom-scrollbar">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedClientId('all');
                    setIsClientMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-left transition-colors cursor-pointer ${
                    selectedClientId === 'all'
                      ? 'bg-brand/15 text-brand'
                      : 'text-slate-300 hover:bg-[#222] hover:text-white'
                  }`}
                >
                  <div className="w-5 h-5 rounded bg-white/5 flex items-center justify-center text-xs">🏢</div>
                  <span>Todos os Clientes</span>
                </button>

                {projects.map((p) => {
                  const logo = getClientLogoFallback(p.name, p.logoUrl);
                  const isSelected = selectedClientId === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setSelectedClientId(p.id);
                        setIsClientMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-left transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-brand/15 text-brand'
                          : 'text-slate-300 hover:bg-[#222] hover:text-white'
                      }`}
                    >
                      {logo ? (
                        <img src={logo} alt="" className="w-5 h-5 rounded object-contain shrink-0" />
                      ) : (
                        <div className="w-5 h-5 rounded bg-brand text-white text-[11px] flex items-center justify-center font-bold shrink-0">
                          {p.name.slice(0, 1).toUpperCase()}
                        </div>
                      )}
                      <span className="truncate">{p.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Filtro de Colaborador com Avatar */}
          <div className="relative">
            {isMemberMenuOpen && (
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsMemberMenuOpen(false)}
              />
            )}
            <button aria-haspopup="true" aria-expanded={isMemberMenuOpen}
              type="button"
              onClick={() => {
                setIsMemberMenuOpen(!isMemberMenuOpen);
                setIsClientMenuOpen(false);
              }}
              className="flex items-center gap-2 px-3 py-2 bg-surface hover:bg-raised border border-line hover:border-line-hover text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-98"
            >
              {(() => {
                if (selectedMemberId === 'all') {
                  return (
                    <>
                      <div className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-[11px]">👥</div>
                      <span>Todos os Criativos</span>
                    </>
                  );
                }
                const activeEmp = creativeEmployees.find((e) => e.id === selectedMemberId);
                return (
                  <>
                    {activeEmp?.avatarUrl ? (
                      <img src={activeEmp.avatarUrl} alt="" className="w-4 h-4 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full bg-purple-600 text-white text-[11px] flex items-center justify-center font-bold">
                        {activeEmp?.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <span className="truncate max-w-[120px]">{activeEmp?.name}</span>
                  </>
                );
              })()}
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 ml-1" />
            </button>

            {isMemberMenuOpen && (
              <div data-menu className="absolute left-0 top-11 z-50 min-w-[210px] max-h-64 overflow-y-auto bg-popover border border-line-strong rounded-2xl p-1.5 shadow-2xl space-y-0.5 custom-scrollbar">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMemberId('all');
                    setIsMemberMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-left transition-colors cursor-pointer ${
                    selectedMemberId === 'all'
                      ? 'bg-brand/15 text-brand'
                      : 'text-slate-300 hover:bg-[#222] hover:text-white'
                  }`}
                >
                  <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center text-xs">👥</div>
                  <span>Todos os Criativos</span>
                </button>

                {creativeEmployees.map((emp) => {
                  const isSelected = selectedMemberId === emp.id;
                  return (
                    <button
                      key={emp.id}
                      type="button"
                      onClick={() => {
                        setSelectedMemberId(emp.id);
                        setIsMemberMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-left transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-brand/15 text-brand'
                          : 'text-slate-300 hover:bg-[#222] hover:text-white'
                      }`}
                    >
                      {emp.avatarUrl ? (
                        <img src={emp.avatarUrl} alt="" className="w-5 h-5 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-white text-[11px] flex items-center justify-center font-bold shrink-0">
                          {emp.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 truncate">
                        <span className="block truncate">{emp.name}</span>
                        <span className="text-[11px] text-slate-500 block truncate">{emp.role}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Botão Exportar CSV */}
          <button
            onClick={handleExportCSV}
            type="button"
            className="px-3.5 py-2 bg-gradient-to-r from-brand to-brand-alt text-white rounded-xl text-xs font-bold flex items-center gap-2 hover:opacity-95 active:scale-95 transition-all shadow-md shadow-brand/20 cursor-pointer ml-auto sm:ml-0"
          >
            <Download className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* 1. Indicadores Executivos Principais (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* SLA / Taxa de Pontualidade */}
        <button
          type="button"
          onClick={() => setDrill((d) => (d === 'late' ? null : 'late'))}
          aria-pressed={drill === 'late'}
          className={`p-4 bg-surface border rounded-2xl shadow-xs space-y-2 text-left cursor-pointer transition-colors hover:border-line-hover focus-visible:outline-2 focus-visible:outline-brand ${drill === 'late' ? 'border-brand/60' : 'border-line'}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Índice de SLA (Prazos)</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-white">{metrics.slaRate === null ? '—' : `${metrics.slaRate}%`}</span>
            <span className="text-[11px] text-emerald-400 font-semibold">{metrics.slaRate === null ? 'sem entregas avaliáveis' : 'no prazo previsto'}</span>
          </div>
          <span className="block text-xs text-slate-400">
            {metrics.onTimeCount} entregas pontuais vs {metrics.lateCount} após o prazo
            {metrics.noDueDateCount > 0 ? ` · ${metrics.noDueDateCount} sem prazo (fora do índice)` : ''}
          </span>
          <Delta current={metrics.slaRate} previous={previousMetrics?.slaRate ?? null} unit="pp" />
        </button>

        {/* Demandas Concluídas */}
        <button
          type="button"
          onClick={() => setDrill((d) => (d === 'delivered' ? null : 'delivered'))}
          aria-pressed={drill === 'delivered'}
          className={`p-4 bg-surface border rounded-2xl shadow-xs space-y-2 text-left cursor-pointer transition-colors hover:border-line-hover focus-visible:outline-2 focus-visible:outline-brand ${drill === 'delivered' ? 'border-brand/60' : 'border-line'}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Demandas Concluídas</span>
            <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-white tabular-nums">{completedShown}</span>
            <span className="text-[11px] text-slate-400 font-semibold">de {metrics.total} tarefas</span>
          </div>
          <span className="block text-xs text-slate-400">
            {metrics.totalPoints} pontos de esforço acumulados
          </span>
          <Delta current={metrics.completedCount} previous={previousMetrics ? previousMetrics.completedCount : null} />
        </button>

        {/* Demandas Atrasadas Ativas */}
        <button
          type="button"
          onClick={() => setDrill((d) => (d === 'overdue' ? null : 'overdue'))}
          aria-pressed={drill === 'overdue'}
          className={`p-4 bg-surface border rounded-2xl shadow-xs space-y-2 text-left cursor-pointer transition-colors hover:border-line-hover focus-visible:outline-2 focus-visible:outline-brand ${drill === 'overdue' ? 'border-brand/60' : 'border-line'}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Atrasadas em Aberto</span>
            <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-semibold tabular-nums ${metrics.overdueActiveCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {overdueShown}
            </span>
            <span className="text-[11px] text-slate-400 font-semibold">demandas críticas</span>
          </div>
          <span className="block text-xs text-slate-400">
            {metrics.activeCount} demandas totais em andamento
          </span>
          <Delta current={metrics.overdueActiveCount} previous={previousMetrics ? previousMetrics.overdueActiveCount : null} lowerIsBetter />
        </button>

        {/* Lead Time / Tempo Médio de Ciclo */}
        <button
          type="button"
          onClick={() => setDrill((d) => (d === 'delivered' ? null : 'delivered'))}
          aria-pressed={drill === 'delivered'}
          className={`p-4 bg-surface border rounded-2xl shadow-xs space-y-2 text-left cursor-pointer transition-colors hover:border-line-hover focus-visible:outline-2 focus-visible:outline-brand ${drill === 'delivered' ? 'border-brand/60' : 'border-line'}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Tempo Médio de Ciclo</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-white">{metrics.avgLeadTime ?? '—'}</span>
            {metrics.avgLeadTime !== null && <span className="text-xs text-slate-300 font-bold">dias</span>}
          </div>
          <span className="block text-xs text-slate-400">
            {metrics.medianLeadTime !== null
              ? `Mediana ${metrics.medianLeadTime}d · P85 ${metrics.p85LeadTime}d (criação até a entrega)`
              : 'Sem entregas para calcular o ciclo'}
          </span>
          <Delta
            current={metrics.medianLeadTime !== null ? Number(metrics.medianLeadTime) : null}
            previous={previousMetrics?.medianLeadTime != null ? Number(previousMetrics.medianLeadTime) : null}
            lowerIsBetter
          />
        </button>
      </div>

      {drill && (
        <div className="p-5 bg-surface border border-line rounded-2xl space-y-3" role="region" aria-label={DRILL_TITLES[drill]}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-medium text-white tracking-tight">
              {DRILL_TITLES[drill]} <span className="text-slate-500 font-normal">({drillTasks.length})</span>
            </h2>
            <button
              type="button"
              onClick={() => setDrill(null)}
              className="text-xs font-semibold text-slate-400 hover:text-white cursor-pointer focus-visible:outline-2 focus-visible:outline-brand rounded"
            >
              Fechar
            </button>
          </div>
          {drillTasks.length === 0 ? (
            <p className="text-sm text-slate-500 py-4">Nenhuma demanda neste recorte.</p>
          ) : (
            <div className="overflow-x-auto max-h-96 overflow-y-auto custom-scrollbar">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-line text-slate-400 font-medium">
                    <th className="pb-2">Demanda</th>
                    <th className="pb-2">Cliente</th>
                    <th className="pb-2">Responsável</th>
                    <th className="pb-2">Prazo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1F1F1F]">
                  {drillTasks.map((task) => (
                    <tr key={task.id}>
                      <td className="py-2 max-w-[280px]">
                        <button
                          type="button"
                          onClick={() => openTaskFromReport(task)}
                          className="font-semibold text-white hover:text-brand truncate max-w-full text-left cursor-pointer focus-visible:outline-2 focus-visible:outline-brand rounded"
                        >
                          {task.title}
                        </button>
                      </td>
                      <td className="py-2 text-slate-300">{task.projectName || 'Geral'}</td>
                      <td className="py-2 text-slate-300">{task.assigneeName || 'Sem membro'}</td>
                      <td className="py-2 text-slate-300 font-mono">{task.dueDate || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 2. Gargalos do Funil de Produção & Tempo Médio por Etapa (Lado a Lado) */}
      {/* 2. Gráficos Visuais (Recharts) */}
      <ReportsDataViz tasks={filteredTasks} clientDistribution={clientDistribution} />

      {/* 3. Gargalos do Funil de Produção & Tempo Médio por Etapa (Redesign Impeccable sem caixas aninhadas) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* Funil de Produção - Estilo Trapézio Invertido 3D / Flat Impeccable */}
        <div className="p-6 bg-surface border border-line rounded-2xl flex flex-col justify-between">
          <div className="space-y-1 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-brand" />
                <h2 className="text-base font-semibold text-white tracking-tight">Funil de Produção</h2>
              </div>
              <span className="text-xs font-semibold text-slate-400 tabular-nums">
                {metrics.total} demandas no fluxo
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Taxa de progressão e volume acumulado por estágio da esteira.
            </p>
          </div>

          {/* Gráfico de Trapézio Invertido (Visual Sales/Pipeline Funnel) */}
          <div className="flex flex-col items-center justify-center my-auto py-2">
            <div className="w-full max-w-[460px] flex flex-col gap-1.5">
              {statusFunnel.map((st, index) => {
                const totalStages = statusFunnel.length;
                // Calculate trapezoid slope (narrowing down)
                // Top width starts near 100%, bottom tapers to ~46%
                const topPct = 100 - (index * (54 / Math.max(totalStages, 1)));
                const bottomPct = 100 - ((index + 1) * (54 / Math.max(totalStages, 1)));
                
                // Cor das etapas quando o status não tem cor própria
                const palette = [
                  // Rampa sequencial rosa -> laranja da marca (etapas iniciais -> finais)
                  '#E4007E',
                  '#E5106C',
                  '#E62059',
                  '#E73046',
                  '#E84032',
                  '#E94E18',
                  '#F06A2E',
                  '#F68648',
                ];
                const stageColor = st.dotColor && st.dotColor !== '#E4007E' ? st.dotColor : palette[index % palette.length];

                return (
                  <div
                    key={st.id}
                    className="relative group transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                    title={`${st.label}: ${st.count} demandas (${st.percentage}% do fluxo)`}
                  >
                    {/* SVG Trapezoid Segment */}
                    <div className="relative w-full h-12 flex items-center justify-center">
                      <svg
                        className="w-full h-full overflow-visible transition-all duration-300 drop-shadow-sm group-hover:drop-shadow-[0_4px_16px_rgba(228,0,126,0.3)]"
                        viewBox="0 0 400 48"
                      >
                        <defs>
                          <linearGradient id={`grad-${st.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor={stageColor} stopOpacity="0.95" />
                            <stop offset="100%" stopColor={stageColor} stopOpacity="0.80" />
                          </linearGradient>
                        </defs>
                        <polygon
                          points={`${(400 * (100 - topPct)) / 200},0 ${400 - (400 * (100 - topPct)) / 200},0 ${400 - (400 * (100 - bottomPct)) / 200},48 ${(400 * (100 - bottomPct)) / 200},48`}
                          fill={`url(#grad-${st.id})`}
                          stroke="rgba(255,255,255,0.22)"
                          strokeWidth="1"
                          className="transition-all duration-300 group-hover:brightness-110"
                        />
                        {/* Texto nativo dentro do próprio SVG (exatamente como na referência) */}
                        <text
                          x="200"
                          y="27"
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill="#ffffff"
                          fontSize="13"
                          fontWeight="700"
                          letterSpacing="0.3"
                          style={{ filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,0.6))', pointerEvents: 'none' }}
                        >
                          {`${st.label} (${st.count})`}
                        </text>
                      </svg>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Metrics Footer */}
          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-brand" />
              Topo ao Fundo: Fluxo Contínuo
            </span>
            <span className="tabular-nums font-semibold text-slate-300">
              Taxa de Conversão Final: {statusFunnel.length > 0 ? `${statusFunnel[statusFunnel.length - 1].percentage}%` : '0%'}
            </span>
          </div>
        </div>

        {/* Tempo Médio de Ciclo (Cycle Time & Gargalos) */}
        <div className="p-6 bg-surface border border-line rounded-2xl flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <h2 className="text-base font-semibold text-white tracking-tight">Tempo Médio por Etapa (Cycle Time)</h2>
              </div>
              <span className="text-xs font-semibold text-slate-400">
                Média de retenção
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Identifique gargalos de tempo onde as demandas ficam retidas mais tempo antes da entrega.
            </p>
          </div>

          {/* Lista Limpa de Tempos por Etapa */}
          <div className="my-3 divide-y divide-white/5">
            {timeInColumns.map((tc) => (
              <div
                key={tc.id}
                className={`py-2.5 flex items-center justify-between gap-3 px-2 rounded-lg transition-colors ${
                  tc.isMax ? 'bg-rose-500/5' : 'hover:bg-white/[0.02]'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                    style={{ backgroundColor: tc.dotColor || '#E4007E' }}
                  />
                  <span className="text-xs font-medium text-slate-200 truncate">
                    {tc.label}
                  </span>
                  {tc.isMax && (
                    <span className="px-1.5 py-0.2 rounded-full text-[11px] font-bold uppercase tracking-wide bg-rose-500/20 text-rose-400 border border-rose-500/30">
                      Maior Gargalo
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={`text-xs font-bold tabular-nums ${
                      tc.isMax ? 'text-rose-400 font-bold' : 'text-white'
                    }`}
                  >
                    {tc.displayStr}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
            <span>Média total do ciclo de vida:</span>
            <span className="text-white font-bold tabular-nums">{metrics.avgLeadTime ?? '—'}{metrics.avgLeadTime !== null ? ' dias' : ''}</span>
          </div>
        </div>

      </div>

      {/* 3. Grid Principal: Produtividade por Membro & Volume por Cliente */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Tabela de Produtividade por Membro (7 colunas no grid) */}
        <div className="xl:col-span-12 p-6 bg-surface border border-line rounded-2xl space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#242424]">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-sky-400" />
              <h2 className="text-sm font-semibold text-white tracking-tight">Produtividade da Equipe</h2>
            </div>
            <span className="text-xs text-slate-400 font-medium">{memberProductivity.length} profissionais</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#242424] text-slate-400 font-medium text-xs uppercase tracking-wider">
                  <th className="pb-3 font-medium">Colaborador</th>
                  <th className="pb-3 text-center font-medium">Atribuídas</th>
                  <th className="pb-3 text-center font-medium">Entregas</th>
                  <th className="pb-3 text-center font-medium">Taxa Conclusão</th>
                  <th className="pb-3 text-center font-medium">Ajustes</th>
                  <th className="pb-3 text-right font-medium">Pontos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F1F1F]">
                {memberProductivity.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500 font-medium">
                      Nenhuma tarefa vinculada a membros no filtro selecionado.
                    </td>
                  </tr>
                ) : (
                  memberProductivity.map((m) => {
                    const completionRate = m.total > 0 ? Math.round((m.completed / m.total) * 100) : 0;
                    const isHighAdjustments = m.adjustments > 0 && m.adjustmentRate >= 25;

                    return (
                      <tr key={m.id} className="hover:bg-field/70 transition-colors group">
                        <td className="py-3 pr-3">
                          <div className="flex items-center gap-2.5">
                            {m.avatarUrl ? (
                              <img src={m.avatarUrl} alt={m.name} className="w-7 h-7 rounded-full object-cover ring-1 ring-white/10 shrink-0" />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-[#242424] text-white font-semibold text-xs flex items-center justify-center shrink-0 border border-white/5">
                                {m.initials}
                              </div>
                            )}
                            <div className="min-w-0">
                              <span className="font-medium text-white block truncate text-xs group-hover:text-white transition-colors">{m.name}</span>
                              <span className="text-[11px] text-slate-400 block truncate">{m.department}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 text-center tabular-nums text-slate-300 font-medium">{m.total}</td>
                        <td className="py-3 text-center">
                          <div className="flex flex-col items-center">
                            <span className="tabular-nums font-semibold text-emerald-400">{m.completed}</span>
                            {m.inProgress > 0 && (
                              <span className="text-[11px] text-sky-400/80 font-normal">({m.inProgress} em curso)</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <div className="w-28 mx-auto space-y-1">
                            <div className="flex items-center justify-between text-[11px] tabular-nums">
                              <span className="text-slate-400">{completionRate}%</span>
                              <span className="text-slate-400">{m.completed}/{m.total}</span>
                            </div>
                            <div className="w-full bg-raised h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-300"
                                style={{ width: `${completionRate}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3 text-center">
                          <span
                            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold tabular-nums ${
                              isHighAdjustments
                                ? 'bg-rose-500/15 text-rose-300 border border-rose-500/20'
                                : m.adjustments > 0
                                ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                                : 'text-slate-500'
                            }`}
                          >
                            {m.adjustments} {m.total > 0 && `(${m.adjustmentRate}%)`}
                          </span>
                        </td>
                        <td className="py-3 text-right tabular-nums font-semibold text-amber-400 pr-1">{m.points}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 4. Tabela de Demandas Atrasadas / Alertas de Prazo Crítico */}
      {metrics.overdueTasks.length > 0 && (
        <div className="p-5 bg-rose-950/20 border border-rose-500/30 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <h2 className="text-base font-medium text-rose-300 tracking-tight">
                Atenção da Gestão: Demandas Atrasadas ({metrics.overdueTasks.length})
              </h2>
            </div>
            <span className="text-xs text-rose-400 font-bold">Exigem ação imediata</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-rose-500/20 text-rose-300 font-medium text-xs">
                  <th className="pb-2">Demanda</th>
                  <th className="pb-2">Cliente</th>
                  <th className="pb-2">Responsável</th>
                  <th className="pb-2">Prazo Previsto</th>
                  <th className="pb-2 text-right">Atraso</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rose-500/10">
                {metrics.overdueTasks.map((task) => {
                  const overdueDays = getTaskOverdueDays(task);
                  return (
                    <tr key={task.id} className="hover:bg-rose-500/5 transition-colors">
                      <td className="py-2.5 font-bold text-white max-w-[250px] truncate">{task.title}</td>
                      <td className="py-2.5 text-slate-300 font-semibold">{task.projectName || 'Geral'}</td>
                      <td className="py-2.5 text-slate-300">{task.assigneeName || 'Sem membro'}</td>
                      <td className="py-2.5 text-rose-300 font-mono">{task.dueDate}</td>
                      <td className="py-2.5 text-right font-semibold text-rose-400">
                        +{overdueDays} {overdueDays === 1 ? 'dia' : 'dias'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
