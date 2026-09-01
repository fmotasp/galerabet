import React, { useState, useMemo } from 'react';
import {
  Users,
  Calendar,
  Filter,
  Download,
  Printer,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Layers,
  Sparkles,
  Search,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  Award,
  Zap,
  Activity,
  BarChart2,
  FileSpreadsheet,
  PieChart,
  HelpCircle,
  ExternalLink,
  Flame,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Task, Employee } from '../../types';
import { getLabelColorHex } from '../tasks/TasksView';
import { isTaskOverdue, isTaskCompleted, parseTaskDueDate } from '../../lib/taskDateUtils';

type PeriodFilter = 'all' | '7d' | '30d' | 'month' | 'sprint';
type DepartmentFilter = 'all' | 'design' | 'videomaker';

// Classificação de complexidade da demanda baseada em tags, pontos e títulos
type ComplexityLevel = 'complex' | 'medium' | 'simple';

const getTaskComplexity = (task: Task): { level: ComplexityLevel; label: string; score: number; color: string } => {
  const text = `${task.title} ${task.category || ''} ${(task.trelloLabels || []).join(' ')}`.toLowerCase();
  
  if (task.points && task.points >= 5) {
    return { level: 'complex', label: 'Campanha / Complexa', score: 3, color: 'text-purple-400 bg-purple-950/60 border-purple-800/60' };
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
    return { level: 'complex', label: 'Campanha / Complexa', score: 3, color: 'text-purple-400 bg-purple-950/60 border-purple-800/60' };
  }

  if (task.points && task.points >= 3) {
    return { level: 'medium', label: 'Média Complexidade', score: 2, color: 'text-blue-400 bg-blue-950/60 border-blue-800/60' };
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
    return { level: 'medium', label: 'Média Complexidade', score: 2, color: 'text-blue-400 bg-blue-950/60 border-blue-800/60' };
  }

  return { level: 'simple', label: 'Post Simples / Rápida', score: 1, color: 'text-emerald-400 bg-emerald-950/60 border-emerald-800/60' };
};

// Estimativa de revisões baseada em histórico de comentários e títulos
const getTaskRevisionsCount = (task: Task): number => {
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

  if (count === 0 && (text.includes('ajuste') || text.includes('altera') || text.includes('revis') || text.includes('refazer'))) {
    count = 1;
  }

  return count;
};

export const ReportsView: React.FC = () => {
  const { tasks, projects, employees, setEditingTask, spineStatuses } = useApp();

  const [period, setPeriod] = useState<PeriodFilter>('all');
  const [selectedDept, setSelectedDept] = useState<DepartmentFilter>('all');
  const [selectedClient, setSelectedClient] = useState<string>('all');
  const [searchMember, setSearchMember] = useState<string>('');
  const [expandedEmployeeId, setExpandedEmployeeId] = useState<string | null>(null);

  // Lista dinâmica de clientes cadastrados + projetos e categorias
  const registeredClients = useMemo(() => {
    const clientsMap = new Map<string, { id: string; name: string }>();

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
            clientsMap.set(cId, {
              id: cId,
              name: p.clientNames?.[idx] || p.name,
            });
          });
        } else {
          clientsMap.set(p.id, {
            id: p.id,
            name: p.name,
          });
        }
      });

    tasks.forEach((t) => {
      if (t.projectId && !clientsMap.has(t.projectId) && t.projectName) {
        clientsMap.set(t.projectId, { id: t.projectId, name: t.projectName });
      }
    });

    return Array.from(clientsMap.values());
  }, [projects, tasks]);

  // Filtro de tarefas por período e cliente
  const filteredTasks = useMemo(() => {
    const now = new Date();
    return tasks.filter((task) => {
      // 1. Filtro de cliente
      if (selectedClient !== 'all') {
        const clientObj = registeredClients.find((c) => c.id === selectedClient);
        const clientName = (clientObj?.name || selectedClient).toLowerCase().trim();
        const taskProject = (task.projectName || '').toLowerCase().trim();
        const taskCategory = (task.category || '').toLowerCase().trim();
        const hasTrelloLabel = (task.trelloLabels || []).some((l) =>
          l.toLowerCase().includes(clientName)
        );
        const matchesClient =
          task.projectId === selectedClient ||
          task.category === selectedClient ||
          taskProject.includes(clientName) ||
          taskCategory.includes(clientName) ||
          hasTrelloLabel;
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
  }, [tasks, selectedClient, period, registeredClients]);

  // Lista de colaboradores relevantes (SOMENTE Designers e Video Makers)
  const reportEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const role = (emp.role || '').toLowerCase();
      const name = (emp.name || '').toLowerCase();
      const dept = (emp.department || '').toLowerCase();
      const tags = (emp.tags || []).map((t) => t.toLowerCase());

      // Filtro de busca por nome
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

      // Se não for Designer nem Video Maker, exclui da visualização de desempenho
      if (!isDesigner && !isVideoMaker) {
        return false;
      }

      // Filtro de sub-departamento selecionado
      if (selectedDept === 'design') {
        return isDesigner;
      }
      if (selectedDept === 'videomaker') {
        return isVideoMaker;
      }

      return true;
    });
  }, [employees, selectedDept, searchMember]);

  // Cálculo individual das métricas de produtividade por colaborador
  const productivityStats = useMemo(() => {
    return reportEmployees.map((emp) => {
      const empId = emp.id.toLowerCase().trim();
      const empName = emp.name.toLowerCase().trim();
      const empFirstName = empName.split(' ')[0];

      // Tarefas vinculadas a este colaborador
      const empTasks = filteredTasks.filter((task) => {
        // 1. Assignee direto
        if (task.assigneeId && (task.assigneeId === emp.id || task.assigneeId.toLowerCase().trim() === empId)) {
          return true;
        }
        if (task.assigneeName) {
          const aName = task.assigneeName.toLowerCase().trim();
          if (aName === empName || (empFirstName.length > 2 && aName.includes(empFirstName))) {
            return true;
          }
        }
        // 2. Membros da tarefa
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
        // 3. Coluna nominal no Trello
        if (task.trelloListName && empFirstName.length > 2) {
          if (task.trelloListName.toLowerCase().includes(empFirstName)) {
            return true;
          }
        }
        return false;
      });

      // 1. Demandas Recebidas
      const receivedCount = empTasks.length;

      // 2. Demandas Finalizadas (Concluídas / Entregues)
      const finishedTasks = empTasks.filter((t) => isTaskCompleted(t));
      const finishedCount = finishedTasks.length;

      // 3. Demandas em Andamento (Ativas na fila ou em produção)
      const inProgressTasks = empTasks.filter((t) => !isTaskCompleted(t) && t.status !== 'backlog');
      const inProgressCount = inProgressTasks.length;

      // 4. Demandas Atrasadas
      const overdueTasks = empTasks.filter((t) => isTaskOverdue(t));
      const overdueCount = overdueTasks.length;

      // 5. Média de Revisões
      const totalRevisions = empTasks.reduce((acc, t) => acc + getTaskRevisionsCount(t), 0);
      const avgRevisions = receivedCount > 0 ? (totalRevisions / receivedCount).toFixed(1) : '0.0';

      // 6. Cumprimento de Prazo (%) - Cálculo Real
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

      // 7. Ponderação de Complexidade e Volume de Esforço
      const complexityBreakdown = {
        complex: empTasks.filter((t) => getTaskComplexity(t).level === 'complex').length,
        medium: empTasks.filter((t) => getTaskComplexity(t).level === 'medium').length,
        simple: empTasks.filter((t) => getTaskComplexity(t).level === 'simple').length,
      };

      // Score de esforço ponderado (Complexa = 3x, Média = 2x, Simples = 1x)
      const totalEffortScore =
        complexityBreakdown.complex * 3 +
        complexityBreakdown.medium * 2 +
        complexityBreakdown.simple * 1;

      // 8. Capacidade Disponível
      // Carga máxima ideal estimada por período: 10 pontos de esforço simultâneos em andamento
      const activeEffortScore = inProgressTasks.reduce((acc, t) => acc + getTaskComplexity(t).score, 0);
      const capacityUsedPercentage = Math.min(Math.round((activeEffortScore / 10) * 100), 100);
      const capacityAvailablePercentage = Math.max(100 - capacityUsedPercentage, 0);

      let capacityStatus: { label: string; color: string; badge: string } = {
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
  }, [reportEmployees, filteredTasks]);

  // Totais Gerais para os KPIs do topo
  const globalSummary = useMemo(() => {
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
        ? (productivityStats.reduce((acc, s) => acc + parseFloat(s.avgRevisions), 0) / productivityStats.length).toFixed(1)
        : '0.0';

    const totalEffortScoreGlobal = productivityStats.reduce((acc, s) => acc + s.totalEffortScore, 0);
    
    const avgCapacityAvailable =
      productivityStats.length > 0
        ? Math.round(productivityStats.reduce((acc, s) => acc + s.capacityAvailablePercentage, 0) / productivityStats.length)
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
  }, [productivityStats]);

  const handleExportCSV = () => {
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
    link.setAttribute('download', `relatorio_produtividade_colaboradores_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 w-full max-w-7xl mx-auto px-4 sm:px-8 pb-16 animate-in fade-in duration-200">
      {/* 1. Header do Relatório */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-[#2A2A2A]">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#E4007E] to-[#E94E18] flex items-center justify-center text-white shadow-lg shadow-[#E4007E]/25">
              <BarChart2 className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                <span>Relatório de Produtividade por Colaborador</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 font-medium mt-0.5">
                Diagnóstico de capacidade individual, complexidade das entregas, revisões e cumprimento de prazos.
              </p>
            </div>
          </div>
        </div>

        {/* Ações de Exportação */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 bg-[#181818] hover:bg-[#262626] text-white border border-[#2A2A2A] hover:border-[#E4007E] rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer active:scale-95"
            title="Exportar dados para planilha Excel / CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#E4007E]" />
            <span>Exportar CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2.5 bg-gradient-to-r from-[#E4007E] to-[#E94E18] hover:opacity-95 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-[#E4007E]/25 flex items-center gap-2 cursor-pointer active:scale-95"
            title="Imprimir ou Salvar em PDF"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir / PDF</span>
          </button>
        </div>
      </div>

      {/* 2. Barra de Filtros Globais */}
      <div className="bg-[#181818] border border-[#2A2A2A] rounded-3xl p-4 sm:p-5 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2.5 flex-1">
            {/* Filtro de Período */}
            <div className="flex items-center bg-[#222222] p-1 rounded-xl border border-[#303030]">
              <button
                onClick={() => setPeriod('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  period === 'all' ? 'bg-gradient-to-r from-[#E4007E] to-[#E94E18] text-white shadow-xs' : 'text-slate-300 hover:text-white'
                }`}
              >
                Geral
              </button>
              <button
                onClick={() => setPeriod('7d')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  period === '7d' ? 'bg-gradient-to-r from-[#E4007E] to-[#E94E18] text-white shadow-xs' : 'text-slate-300 hover:text-white'
                }`}
              >
                7 Dias
              </button>
              <button
                onClick={() => setPeriod('30d')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  period === '30d' ? 'bg-gradient-to-r from-[#E4007E] to-[#E94E18] text-white shadow-xs' : 'text-slate-300 hover:text-white'
                }`}
              >
                30 Dias
              </button>
              <button
                onClick={() => setPeriod('month')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  period === 'month' ? 'bg-gradient-to-r from-[#E4007E] to-[#E94E18] text-white shadow-xs' : 'text-slate-300 hover:text-white'
                }`}
              >
                Este Mês
              </button>
            </div>

            {/* Filtro de Departamento */}
            <div className="flex items-center bg-[#222222] p-1 rounded-xl border border-[#303030]">
              <button
                onClick={() => setSelectedDept('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedDept === 'all' ? 'bg-gradient-to-r from-[#E4007E] to-[#E94E18] text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                Todos (Design & Vídeo)
              </button>
              <button
                onClick={() => setSelectedDept('design')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedDept === 'design' ? 'bg-gradient-to-r from-[#E4007E] to-[#E94E18] text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                Designers
              </button>
              <button
                onClick={() => setSelectedDept('videomaker')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedDept === 'videomaker' ? 'bg-gradient-to-r from-[#E4007E] to-[#E94E18] text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                Video Makers
              </button>
            </div>

            {/* Filtro de Clientes */}
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="px-3 py-2 bg-[#222222] border border-[#303030] rounded-xl text-xs font-bold text-white focus:outline-none focus:border-[#E4007E] cursor-pointer"
            >
              <option value="all">Todos os Clientes</option>
              {registeredClients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Busca rápida por Colaborador */}
          <div className="relative w-full md:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar colaborador..."
              value={searchMember}
              onChange={(e) => setSearchMember(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 bg-[#222222] border border-[#303030] rounded-xl text-xs text-white placeholder-slate-400 font-medium focus:outline-none focus:border-[#E4007E] transition-all"
            />
          </div>
        </div>

        {/* ⚠️ Alerta de Ponderação de Complexidade */}
        <div className="p-3.5 bg-gradient-to-r from-[#E4007E]/10 to-[#E94E18]/10 border border-[#E4007E]/30 rounded-2xl flex items-center gap-3 text-pink-200 text-xs">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#E4007E] to-[#E94E18] text-white flex items-center justify-center shrink-0 shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-[#E4007E]">Ponderação de Complexidade Ativa:</span> As métricas avaliam o esforço real de cada entrega. Campanhas estruturais e key visuals complexos possuem peso ponderado superior a posts simples de desdobramento.
          </div>
        </div>
      </div>

      {/* 3. Cards de Resumo Executivo Geral (KPIs Globais) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Recebidas */}
        <div className="bg-[#181818] border border-[#2A2A2A] p-5 rounded-3xl shadow-xl flex items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Demandas Recebidas
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white tracking-tight">{globalSummary.totalReceived}</span>
              <span className="text-xs text-slate-400 font-medium">demandas</span>
            </div>
            <span className="text-[11px] text-emerald-400 font-bold mt-1 inline-block">
              {globalSummary.totalFinished} finalizadas ({globalSummary.totalReceived > 0 ? Math.round((globalSummary.totalFinished / globalSummary.totalReceived) * 100) : 0}%)
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        {/* Cumprimento de Prazo */}
        <div className="bg-[#181818] border border-[#2A2A2A] p-5 rounded-3xl shadow-xl flex items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Cumprimento de Prazo
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white tracking-tight">{globalSummary.avgOnTime}%</span>
              <span className="text-xs text-slate-400 font-medium">pontualidade</span>
            </div>
            <span className="text-[11px] text-rose-400 font-bold mt-1 inline-block">
              {globalSummary.totalOverdue} com atraso no período
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Média de Revisões */}
        <div className="bg-[#181818] border border-[#2A2A2A] p-5 rounded-3xl shadow-xl flex items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Média de Revisões
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white tracking-tight">{globalSummary.avgRevisionsOverall}</span>
              <span className="text-xs text-slate-400 font-medium">ciclos/tarefa</span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium mt-1 inline-block">
              Índice de assertividade criativa
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#E94E18]/10 text-[#E94E18] border border-[#E94E18]/30 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Capacidade Disponível */}
        <div className="bg-[#181818] border border-[#2A2A2A] p-5 rounded-3xl shadow-xl flex items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Capacidade Disponível
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#E4007E] to-[#E94E18] tracking-tight">{globalSummary.avgCapacityAvailable}%</span>
              <span className="text-xs text-slate-400 font-medium">livre</span>
            </div>
            <span className="text-[11px] text-[#E4007E] font-bold mt-1 inline-block">
              {globalSummary.totalInProgress} demandas em andamento
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#E4007E] to-[#E94E18] text-white shadow-md shadow-[#E4007E]/20 flex items-center justify-center shrink-0">
            <Zap className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 4. Lista e Cards Detalhados por Colaborador */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-[#E4007E]" />
            <span>Desempenho e Capacidade por Colaborador ({productivityStats.length})</span>
          </h2>
          <span className="text-xs text-slate-400 font-medium">
            Clique no colaborador para ver as tarefas detalhadas
          </span>
        </div>

        {productivityStats.length === 0 ? (
          <div className="bg-[#181818] border border-[#2A2A2A] rounded-3xl p-12 text-center text-slate-400 space-y-2 shadow-xl">
            <Users className="w-12 h-12 mx-auto text-slate-600 mb-2" />
            <h3 className="text-base font-bold text-white">Nenhum colaborador encontrado</h3>
            <p className="text-xs text-slate-400">Verifique os filtros selecionados ou cadastre novos colaboradores na equipe.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {productivityStats.map((stat) => {
              const isExpanded = expandedEmployeeId === stat.employee.id;

              return (
                <div
                  key={stat.employee.id}
                  className="bg-[#181818] border border-[#2A2A2A] hover:border-[#383838] transition-all rounded-3xl overflow-hidden shadow-xl"
                >
                  {/* Card Header & KPIs Principais */}
                  <div
                    onClick={() => setExpandedEmployeeId(isExpanded ? null : stat.employee.id)}
                    className="p-5 sm:p-6 cursor-pointer flex flex-col xl:flex-row xl:items-center justify-between gap-6 hover:bg-[#222222]/50 transition-colors"
                  >
                    {/* Perfil do Colaborador */}
                    <div className="flex items-center gap-4 min-w-[240px]">
                      {stat.employee.avatarUrl ? (
                        <img
                          src={stat.employee.avatarUrl}
                          alt={stat.employee.name}
                          className="w-14 h-14 rounded-2xl object-cover ring-2 ring-[#E4007E]/40 shrink-0 shadow-md"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-[#222222] border border-[#303030] text-[#E4007E] font-black text-lg flex items-center justify-center shrink-0 shadow-md">
                          {stat.employee.initials || stat.employee.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h3 className="text-base font-black text-white tracking-tight flex items-center gap-2">
                          <span>{stat.employee.name}</span>
                        </h3>
                        <span className="text-xs text-slate-400 font-semibold block mt-0.5">
                          {stat.employee.role || 'Colaborador'}
                        </span>
                        {/* Badge de Status de Capacidade */}
                        <div className="mt-2 flex items-center gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${stat.capacityStatus.badge}`}
                          >
                            {stat.capacityStatus.label}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Grade de 7 Métricas Principais */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 xl:gap-4 flex-1">
                      {/* 1. Recebidas */}
                      <div className="bg-[#222222] border border-[#2E2E2E] p-3 rounded-2xl text-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Recebidas
                        </span>
                        <span className="text-lg font-black text-white mt-1 block">
                          {stat.receivedCount}
                        </span>
                      </div>

                      {/* 2. Finalizadas */}
                      <div className="bg-[#222222] border border-[#2E2E2E] p-3 rounded-2xl text-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Finalizadas
                        </span>
                        <span className="text-lg font-black text-emerald-400 mt-1 block">
                          {stat.finishedCount}
                        </span>
                      </div>

                      {/* 3. Em Andamento */}
                      <div className="bg-[#222222] border border-[#2E2E2E] p-3 rounded-2xl text-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Em Andamento
                        </span>
                        <span className="text-lg font-black text-pink-400 mt-1 block">
                          {stat.inProgressCount}
                        </span>
                      </div>

                      {/* 4. Atrasadas */}
                      <div className="bg-[#222222] border border-[#2E2E2E] p-3 rounded-2xl text-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Atrasadas
                        </span>
                        <span
                          className={`text-lg font-black mt-1 block ${
                            stat.overdueCount > 0 ? 'text-rose-400' : 'text-slate-400'
                          }`}
                        >
                          {stat.overdueCount}
                        </span>
                      </div>

                      {/* 5. Média Revisões */}
                      <div className="bg-[#222222] border border-[#2E2E2E] p-3 rounded-2xl text-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Média Revisões
                        </span>
                        <span className="text-lg font-black text-[#E94E18] mt-1 block">
                          {stat.avgRevisions}
                        </span>
                      </div>

                      {/* 6. Cumprimento de Prazo */}
                      <div className="bg-[#222222] border border-[#2E2E2E] p-3 rounded-2xl text-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Prazo (%)
                        </span>
                        <span
                          className={`text-lg font-black mt-1 block ${
                            stat.onTimePercentage >= 90
                              ? 'text-emerald-400'
                              : stat.onTimePercentage >= 75
                              ? 'text-amber-400'
                              : 'text-rose-400'
                          }`}
                        >
                          {stat.onTimePercentage}%
                        </span>
                      </div>

                      {/* 7. Capacidade Disponível */}
                      <div className="bg-[#222222] border border-[#2E2E2E] p-3 rounded-2xl text-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Disponível
                        </span>
                        <span className="text-lg font-black text-[#E4007E] mt-1 block">
                          {stat.capacityAvailablePercentage}%
                        </span>
                      </div>
                    </div>

                    {/* Botão de Expansão */}
                    <div className="flex items-center justify-end xl:justify-center">
                      <div
                        className={`w-9 h-9 rounded-xl bg-[#222222] border border-[#303030] flex items-center justify-center text-slate-300 transition-transform ${
                          isExpanded ? 'rotate-90 text-[#E4007E]' : ''
                        }`}
                      >
                        <ChevronRight className="w-5 h-5" />
                      </div>
                    </div>
                  </div>

                  {/* Detalhamento de Complexidade e Barra de Capacidade */}
                  <div className="px-5 sm:px-6 py-3.5 bg-[#141414] border-t border-[#262626] flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                    {/* Segmentação de Complexidade de Peças */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-bold text-slate-400">Distribuição de Esforço:</span>
                      <span className="px-2.5 py-1 rounded-lg bg-[#E4007E]/15 border border-[#E4007E]/30 text-pink-300 font-semibold flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#E4007E]" />
                        <span>Campanhas / Complexas ({stat.complexityBreakdown.complex})</span>
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-[#E94E18]/15 border border-[#E94E18]/30 text-orange-300 font-semibold flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#E94E18]" />
                        <span>Médias / Vídeos ({stat.complexityBreakdown.medium})</span>
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-950/50 border border-emerald-800/40 text-emerald-300 font-semibold flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span>Posts Rápidos ({stat.complexityBreakdown.simple})</span>
                      </span>
                    </div>

                    {/* Barra de Progresso de Capacidade */}
                    <div className="flex items-center gap-3 min-w-[260px]">
                      <span className="font-bold text-slate-400 shrink-0">Ocupação Atual:</span>
                      <div className="flex-1 h-2.5 bg-[#262626] rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            stat.capacityUsedPercentage >= 90
                              ? 'bg-rose-500'
                              : stat.capacityUsedPercentage >= 65
                              ? 'bg-[#E94E18]'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${stat.capacityUsedPercentage}%` }}
                        />
                      </div>
                      <span className="font-black text-white shrink-0">{stat.capacityUsedPercentage}%</span>
                    </div>
                  </div>

                  {/* Listagem Expansível de Demandas do Colaborador */}
                  {isExpanded && (
                    <div className="p-5 sm:p-6 bg-[#101010] border-t border-[#262626] animate-in fade-in duration-150 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                          <Layers className="w-4 h-4 text-[#E4007E]" />
                          <span>Histórico de Demandas ({stat.tasks.length})</span>
                        </h4>
                        <span className="text-[11px] text-slate-400 font-medium">
                          Clique na tarefa para abrir detalhes
                        </span>
                      </div>

                      {stat.tasks.length === 0 ? (
                        <div className="p-6 bg-[#181818] rounded-2xl border border-[#2A2A2A] text-center text-xs text-slate-400">
                          Nenhuma demanda encontrada no período selecionado.
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                          {stat.tasks.map((task) => {
                            const complexity = getTaskComplexity(task);
                            const revisions = getTaskRevisionsCount(task);
                            const isOverdue = isTaskOverdue(task);
                            const isDone = isTaskCompleted(task);
                            const statusObj = spineStatuses.find((s) => s.id === task.status);

                            return (
                              <div
                                key={task.id}
                                onClick={() => setEditingTask(task)}
                                className="p-3.5 bg-[#181818] hover:bg-[#222222] border border-[#2A2A2A] hover:border-[#383838] rounded-2xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer group"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-2.5 h-2.5 rounded-full bg-[#E4007E] shrink-0" />
                                  <div className="min-w-0">
                                    <h5 className="text-xs font-bold text-white group-hover:text-[#E4007E] transition-colors truncate">
                                      {task.title}
                                    </h5>
                                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                                      <span>{task.category || task.projectName || 'Geral'}</span>
                                      {task.dueDate && (
                                        <>
                                          <span>•</span>
                                          <span className={isOverdue ? 'text-rose-400 font-bold' : ''}>
                                            Prazo: {task.dueDate}
                                          </span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2.5 flex-wrap shrink-0">
                                  {/* Badge de Complexidade */}
                                  <span
                                    className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold border ${complexity.color}`}
                                  >
                                    {complexity.label}
                                  </span>

                                  {/* Revisões */}
                                  {revisions > 0 && (
                                    <span className="px-2 py-0.5 bg-amber-950/60 border border-amber-800/50 text-amber-300 rounded-lg text-[10px] font-extrabold">
                                      {revisions} rev{revisions > 1 ? 's' : ''}
                                    </span>
                                  )}

                                  {/* Status da Tarefa */}
                                  <span className="px-2.5 py-1 bg-[#222222] border border-[#303030] rounded-xl text-[10px] font-bold text-slate-300">
                                    {statusObj?.label || task.status}
                                  </span>

                                  <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition-colors" />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
