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
} from 'lucide-react';
import { useTasks, useProjects, useEmployees, useApp } from '../../context/AppContext';
import { isTaskOverdue, isTaskCompleted, getTaskOverdueDays, parseTaskDueDate } from '../../lib/taskDateUtils';
import { getClientLogoFallback } from '../tasks/useTasksFilter';

// Helper para identificar exclusivamente profissionais de Design e Audiovisual/Vídeo
export const isDesignerOrVideomaker = (emp: { role?: string; department?: string; tags?: string[] }): boolean => {
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

export const ReportsView: React.FC = () => {
  const { tasks } = useTasks();
  const { projects } = useProjects();
  const { employees } = useEmployees();
  const { spineStatuses } = useApp();

  // Filtrar colaboradores válidos: apenas Designers e Videomakers
  const creativeEmployees = useMemo(() => {
    return employees.filter(isDesignerOrVideomaker);
  }, [employees]);

  const creativeEmployeeIds = useMemo(() => new Set(creativeEmployees.map((e) => e.id)), [creativeEmployees]);
  const creativeEmployeeNames = useMemo(() => new Set(creativeEmployees.map((e) => e.name.toLowerCase().trim())), [creativeEmployees]);

  const nonCreativeEmployeeIds = useMemo(() => new Set(employees.filter((e) => !isDesignerOrVideomaker(e)).map((e) => e.id)), [employees]);
  const nonCreativeEmployeeNames = useMemo(() => new Set(employees.filter((e) => !isDesignerOrVideomaker(e)).map((e) => e.name.toLowerCase().trim())), [employees]);

  // Filtros Globais
  const [periodFilter, setPeriodFilter] = useState<'all' | '7days' | '30days'>('all');
  const [selectedClientId, setSelectedClientId] = useState<string>('all');
  const [selectedMemberId, setSelectedMemberId] = useState<string>('all');

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

  // 1. Filtragem das tarefas: apenas escopo de Designers e Videomakers
  const filteredTasks = useMemo(() => {
    const now = new Date();
    const cutoffDate = new Date();
    if (periodFilter === '7days') {
      cutoffDate.setDate(now.getDate() - 7);
    } else if (periodFilter === '30days') {
      cutoffDate.setDate(now.getDate() - 30);
    }

    return tasks.filter((t) => {
      // Regra fundamental: se a tarefa estiver atribuída a alguém que NÃO é designer/videomaker e não tiver membros criativos, exclui
      const hasCreativeAssignee =
        (t.assigneeId && creativeEmployeeIds.has(t.assigneeId)) ||
        (t.assigneeName && creativeEmployeeNames.has(t.assigneeName.toLowerCase().trim()));

      const hasCreativeMember = Array.isArray(t.members) && t.members.some((m) => creativeEmployeeIds.has(m.id) || creativeEmployeeNames.has(m.name.toLowerCase().trim()));

      const isExplicitlyNonCreative =
        !hasCreativeAssignee &&
        !hasCreativeMember &&
        ((t.assigneeId && nonCreativeEmployeeIds.has(t.assigneeId)) ||
         (t.assigneeName && nonCreativeEmployeeNames.has(t.assigneeName.toLowerCase().trim())));

      if (isExplicitlyNonCreative) {
        return false;
      }

      // Filtro de Período
      if (periodFilter !== 'all') {
        const dateCandidates = [
          parseDateSafe(t.createdAt),
          parseDateSafe(t.deliveredAt),
          parseDateSafe(t.dueDate),
          t.lastMovedAt ? new Date(t.lastMovedAt) : null,
        ].filter(Boolean) as Date[];

        const isWithinPeriod = dateCandidates.some((d) => d >= cutoffDate);
        if (!isWithinPeriod) return false;
      }

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
    });
  }, [tasks, periodFilter, selectedClientId, selectedMemberId, projects, creativeEmployees, creativeEmployeeIds, creativeEmployeeNames, nonCreativeEmployeeIds, nonCreativeEmployeeNames]);

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

  // 2. Cálculos de SLA e Cumprimento de Prazos
  const metrics = useMemo(() => {
    const total = filteredTasks.length;
    const completed = filteredTasks.filter(isTaskDoneOrInReview);
    const active = filteredTasks.filter((t) => !isTaskDoneOrInReview(t));
    const overdueActive = active.filter((t) => isTaskOverdue(t));

    // SLA de tarefas concluídas
    let onTimeCount = 0;
    let lateCount = 0;
    let totalLeadTimeDays = 0;
    let leadTimeCount = 0;

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
        onTimeCount++;
      }

      const created = parseDateSafe(t.createdAt);
      if (created && delivery && delivery >= created) {
        const days = (delivery.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
        totalLeadTimeDays += days;
        leadTimeCount++;
      }
    });

    const evaluatedCompleted = onTimeCount + lateCount;
    const slaRate = evaluatedCompleted > 0 ? Math.round((onTimeCount / evaluatedCompleted) * 100) : 100;
    const avgLeadTime = leadTimeCount > 0 ? (totalLeadTimeDays / leadTimeCount).toFixed(1) : '0';
    const totalPoints = completed.reduce((sum, t) => sum + (t.points || 1), 0);

    return {
      total,
      completedCount: completed.length,
      activeCount: active.length,
      overdueActiveCount: overdueActive.length,
      onTimeCount,
      lateCount,
      slaRate,
      avgLeadTime,
      totalPoints,
      overdueTasks: overdueActive.sort((a, b) => getTaskOverdueDays(b) - getTaskOverdueDays(a)),
    };
  }, [filteredTasks]);

  // 3. Produtividade por Membro: apenas Designers e Videomakers
  const memberProductivity = useMemo(() => {
    return creativeEmployees.map((emp) => {
      const empName = emp.name.toLowerCase().trim();
      const empTasks = filteredTasks.filter(
        (t) =>
          t.assigneeId === emp.id ||
          (Array.isArray(t.members) && t.members.some((m) => m.id === emp.id)) ||
          (t.assigneeName && t.assigneeName.toLowerCase().trim() === empName) ||
          (t.activityLog && t.activityLog.some((a) => (a.user || '').toLowerCase().trim() === empName))
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
      };
    }).filter((c) => c.total > 0 || selectedClientId === c.id)
      .sort((a, b) => b.total - a.total);
  }, [projects, filteredTasks, selectedClientId]);

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

  // 6. Exportação para CSV
  const handleExportCSV = useCallback(() => {
    const rows: string[] = [];
    rows.push('RELATORIO GERENCIAL - DASHBOARD EXECUTIVO');
    rows.push(`Gerado em: ${new Date().toLocaleString('pt-BR')}`);
    rows.push(`Filtro de Periodo: ${periodFilter}`);
    rows.push(`Total de Demandas Avaliadas: ${metrics.total}`);
    rows.push(`SLA / Pontualidade: ${metrics.slaRate}%`);
    rows.push(`Concluidas: ${metrics.completedCount}`);
    rows.push(`Atrasadas Ativas: ${metrics.overdueActiveCount}`);
    rows.push(`Tempo Medio de Producao: ${metrics.avgLeadTime} dias`);
    rows.push('');

    // Produtividade por Membro
    rows.push('--- PRODUTIVIDADE POR MEMBRO ---');
    rows.push('Membro;Departamento;Total;Concluidas;Em Producao;Ajustes;Taxa Ajustes;Atrasadas;Pontos');
    memberProductivity.forEach((m) => {
      rows.push(`"${m.name}";"${m.department}";${m.total};${m.completed};${m.inProgress};${m.adjustments};${m.adjustmentRate}%;${m.overdue};${m.points}`);
    });
    rows.push('');

    // Volume por Cliente
    rows.push('--- DEMANDAS POR CLIENTE ---');
    rows.push('Cliente;Total Demandas;Concluidas;Pendentes;Atrasadas;Taxa Conclusao');
    clientDistribution.forEach((c) => {
      rows.push(`"${c.name}";${c.total};${c.completed};${c.pending};${c.overdue};${c.completionRate}%`);
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#2E2E2E]">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#E4007E]/10 border border-[#E4007E]/30 text-[#E4007E]">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                Relatórios para Gestores
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/30 uppercase font-black tracking-wider">
                  Dados Reais
                </span>
              </h1>
              <p className="text-xs text-slate-400 font-medium">
                Visão consolidada de SLA, produtividade da equipe e gargalos de produção em tempo real.
              </p>
            </div>
          </div>
        </div>

        {/* Barra de Filtros e Botão Exportar */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Filtro de Período */}
          <select
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value as any)}
            className="bg-[#181818] text-xs font-bold text-slate-200 border border-[#2E2E2E] rounded-xl px-3 py-2 focus:outline-none focus:border-[#E4007E] cursor-pointer"
          >
            <option value="all">Todo o Período</option>
            <option value="30days">Últimos 30 Dias</option>
            <option value="7days">Últimos 7 Dias</option>
          </select>

          {/* Filtro de Cliente */}
          <select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            className="bg-[#181818] text-xs font-bold text-slate-200 border border-[#2E2E2E] rounded-xl px-3 py-2 focus:outline-none focus:border-[#E4007E] cursor-pointer max-w-[150px] truncate"
          >
            <option value="all">Todos os Clientes</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          {/* Filtro de Membro */}
          <select
            value={selectedMemberId}
            onChange={(e) => setSelectedMemberId(e.target.value)}
            className="bg-[#181818] text-xs font-bold text-slate-200 border border-[#2E2E2E] rounded-xl px-3 py-2 focus:outline-none focus:border-[#E4007E] cursor-pointer max-w-[170px] truncate"
          >
            <option value="all">Designers & Videomakers</option>
            {creativeEmployees.map((emp) => (
              <option key={emp.id} value={emp.id}>{emp.name}</option>
            ))}
          </select>

          {/* Botão Exportar CSV */}
          <button
            onClick={handleExportCSV}
            type="button"
            className="px-3.5 py-2 bg-gradient-to-r from-[#E4007E] to-[#E94E18] text-white rounded-xl text-xs font-black flex items-center gap-2 hover:opacity-90 transition-opacity shadow-lg shadow-[#E4007E]/20 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* 1. Indicadores Executivos Principais (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* SLA / Taxa de Pontualidade */}
        <div className="p-4 bg-[#181818] border border-[#2E2E2E] rounded-2xl shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Índice de SLA (Prazos)</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{metrics.slaRate}%</span>
            <span className="text-[10px] text-emerald-400 font-semibold">no prazo previsto</span>
          </div>
          <p className="text-[11px] text-slate-400">
            {metrics.onTimeCount} entregas pontuais vs {metrics.lateCount} após o prazo
          </p>
        </div>

        {/* Demandas Concluídas */}
        <div className="p-4 bg-[#181818] border border-[#2E2E2E] rounded-2xl shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Demandas Concluídas</span>
            <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{metrics.completedCount}</span>
            <span className="text-[10px] text-slate-400 font-semibold">de {metrics.total} tarefas</span>
          </div>
          <p className="text-[11px] text-slate-400">
            {metrics.totalPoints} pontos de esforço acumulados
          </p>
        </div>

        {/* Demandas Atrasadas Ativas */}
        <div className="p-4 bg-[#181818] border border-[#2E2E2E] rounded-2xl shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Atrasadas em Aberto</span>
            <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-black ${metrics.overdueActiveCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {metrics.overdueActiveCount}
            </span>
            <span className="text-[10px] text-slate-400 font-semibold">demandas críticas</span>
          </div>
          <p className="text-[11px] text-slate-400">
            {metrics.activeCount} demandas totais em andamento
          </p>
        </div>

        {/* Lead Time / Tempo Médio de Ciclo */}
        <div className="p-4 bg-[#181818] border border-[#2E2E2E] rounded-2xl shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tempo Médio de Ciclo</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{metrics.avgLeadTime}</span>
            <span className="text-xs text-slate-300 font-bold">dias</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Média da criação até a entrega final
          </p>
        </div>
      </div>

      {/* 2. Gargalos do Funil de Produção (Pipeline Kanban em Tempo Real) */}
      <div className="p-5 bg-[#181818] border border-[#2E2E2E] rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#E4007E]" />
            <h2 className="text-sm font-black text-white uppercase tracking-wider">Funil de Produção & Represamento</h2>
          </div>
          <span className="text-xs text-slate-400 font-medium">Onde as demandas estão concentradas</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {statusFunnel.map((st) => (
            <div key={st.id} className="p-3 bg-[#101010] border border-[#2E2E2E] rounded-xl space-y-2">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[11px] font-bold text-slate-300 truncate" title={st.label}>{st.label}</span>
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: st.dotColor }} />
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-lg font-black text-white">{st.count}</span>
                <span className="text-[10px] text-slate-500 font-bold">{st.percentage}%</span>
              </div>
              <div className="w-full bg-[#202020] h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${Math.max(st.percentage, 4)}%`, backgroundColor: st.dotColor }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Grid Principal: Produtividade por Membro & Volume por Cliente */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Tabela de Produtividade por Membro (7 colunas no grid) */}
        <div className="lg:col-span-7 p-5 bg-[#181818] border border-[#2E2E2E] rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-sky-400" />
              <h2 className="text-sm font-black text-white uppercase tracking-wider">Produtividade (Design & Audiovisual)</h2>
            </div>
            <span className="text-xs text-slate-400 font-medium">{memberProductivity.length} profissionais</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#2E2E2E] text-slate-400 font-black uppercase text-[10px] tracking-wider">
                  <th className="pb-2.5">Colaborador</th>
                  <th className="pb-2.5 text-center">Atribuídas</th>
                  <th className="pb-2.5 text-center">Concluídas</th>
                  <th className="pb-2.5 text-center">Em Produção</th>
                  <th className="pb-2.5 text-center">Ajustes</th>
                  <th className="pb-2.5 text-center">Pontos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#242424]">
                {memberProductivity.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-500 font-medium">
                      Nenhuma tarefa vinculada a membros no filtro selecionado.
                    </td>
                  </tr>
                ) : (
                  memberProductivity.map((m) => (
                    <tr key={m.id} className="hover:bg-[#1F1F1F]/60 transition-colors">
                      <td className="py-2.5 pr-2">
                        <div className="flex items-center gap-2">
                          {m.avatarUrl ? (
                            <img src={m.avatarUrl} alt={m.name} className="w-6 h-6 rounded-full object-cover ring-1 ring-white/10" />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-[#2A2A2A] text-white font-black text-[10px] flex items-center justify-center">
                              {m.initials}
                            </div>
                          )}
                          <div className="min-w-0">
                            <span className="font-bold text-white block truncate leading-snug">{m.name}</span>
                            <span className="text-[10px] text-slate-400 block leading-none">{m.department}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 text-center font-bold text-slate-300">{m.total}</td>
                      <td className="py-2.5 text-center font-black text-emerald-400">{m.completed}</td>
                      <td className="py-2.5 text-center font-bold text-sky-400">{m.inProgress}</td>
                      <td className="py-2.5 text-center">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${m.adjustments > 0 ? 'bg-rose-950 text-rose-300' : 'text-slate-500'}`}>
                          {m.adjustments} ({m.adjustmentRate}%)
                        </span>
                      </td>
                      <td className="py-2.5 text-center font-black text-amber-400">{m.points}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Volume e Entregas por Cliente (5 colunas no grid) */}
        <div className="lg:col-span-5 p-5 bg-[#181818] border border-[#2E2E2E] rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-black text-white uppercase tracking-wider">Demandas por Cliente</h2>
            </div>
            <span className="text-xs text-slate-400 font-medium">{clientDistribution.length} marcas</span>
          </div>

          <div className="space-y-3">
            {clientDistribution.length === 0 ? (
              <div className="py-8 text-center text-slate-500 font-medium text-xs">
                Nenhum cliente com demandas no período selecionado.
              </div>
            ) : (
              clientDistribution.map((client) => (
                <div key={client.id} className="p-3 bg-[#101010] border border-[#2E2E2E] rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {client.logoUrl ? (
                        <img src={client.logoUrl} alt={client.name} className="w-5 h-5 rounded object-contain" />
                      ) : (
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: client.color }} />
                      )}
                      <span className="text-xs font-black text-white">{client.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-bold text-slate-400">{client.completed} / {client.total}</span>
                      <span className="font-black text-emerald-400 text-[11px]">({client.completionRate}%)</span>
                    </div>
                  </div>

                  {/* Barra de progresso de conclusão */}
                  <div className="w-full bg-[#222222] h-2 rounded-full overflow-hidden flex">
                    <div
                      className="bg-emerald-500 h-full transition-all"
                      style={{ width: `${client.completionRate}%` }}
                      title={`${client.completed} concluídas`}
                    />
                    {client.overdue > 0 && (
                      <div
                        className="bg-rose-500 h-full transition-all"
                        style={{ width: `${Math.round((client.overdue / client.total) * 100)}%` }}
                        title={`${client.overdue} atrasadas`}
                      />
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                    <span>Pendentes: <strong className="text-slate-200">{client.pending}</strong></span>
                    {client.overdue > 0 && (
                      <span className="text-rose-400 font-bold">Atrasadas: {client.overdue}</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 4. Tabela de Demandas Atrasadas / Alertas de Prazo Crítico */}
      {metrics.overdueTasks.length > 0 && (
        <div className="p-5 bg-rose-950/20 border border-rose-500/30 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <h2 className="text-sm font-black text-rose-300 uppercase tracking-wider">
                Atenção da Gestão: Demandas Atrasadas ({metrics.overdueTasks.length})
              </h2>
            </div>
            <span className="text-xs text-rose-400 font-bold">Exigem ação imediata</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-rose-500/20 text-rose-300 font-black uppercase text-[10px] tracking-wider">
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
                      <td className="py-2.5 text-right font-black text-rose-400">
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
