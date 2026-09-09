import React, { useState, useMemo, useCallback } from 'react';
import { Users } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useTasks } from '../../context/TasksContext';
import { useProjects } from '../../context/ProjectsContext';
import { useEmployees } from '../../context/EmployeesContext';
import { Task } from '../../types';
import {
  PeriodFilter,
  DepartmentFilter,
  getRegisteredClients,
  filterReportTasks,
  filterReportEmployees,
  computeProductivityStats,
  computeGlobalSummary,
  exportReportsToCSV,
} from './reportsUtils';
import { ReportsHeader } from './ReportsHeader';
import { ReportsFilterToolbar } from './ReportsFilterToolbar';
import { ReportsGlobalKPIs } from './ReportsGlobalKPIs';
import { ReportsEmployeeCard } from './ReportsEmployeeCard';

export const ReportsView: React.FC = () => {
  // Contextos especializados
  const { tasks, setEditingTask } = useTasks();
  const { projects } = useProjects();
  const { employees } = useEmployees();
  const { spineStatuses } = useApp();

  const [period, setPeriod] = useState<PeriodFilter>('all');
  const [selectedDept, setSelectedDept] = useState<DepartmentFilter>('all');
  const [selectedClient, setSelectedClient] = useState<string>('all');
  const [searchMember, setSearchMember] = useState<string>('');
  const [expandedEmployeeId, setExpandedEmployeeId] = useState<string | null>(null);

  // Lista dinâmica de clientes cadastrados + projetos e categorias
  const registeredClients = useMemo(() => {
    return getRegisteredClients(projects, tasks);
  }, [projects, tasks]);

  // Filtro de tarefas por período e cliente
  const filteredTasks = useMemo(() => {
    return filterReportTasks(tasks, selectedClient, period, registeredClients);
  }, [tasks, selectedClient, period, registeredClients]);

  // Lista de colaboradores relevantes (Designers e Video Makers)
  const reportEmployees = useMemo(() => {
    return filterReportEmployees(employees, selectedDept, searchMember);
  }, [employees, selectedDept, searchMember]);

  // Cálculo individual das métricas de produtividade por colaborador
  const productivityStats = useMemo(() => {
    return computeProductivityStats(reportEmployees, filteredTasks);
  }, [reportEmployees, filteredTasks]);

  // Totais Gerais para os KPIs do topo
  const globalSummary = useMemo(() => {
    return computeGlobalSummary(productivityStats);
  }, [productivityStats]);

  // Callbacks memoizados para ações
  const handleExportCSV = useCallback(() => {
    exportReportsToCSV(productivityStats);
  }, [productivityStats]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleToggleExpand = useCallback((id: string) => {
    setExpandedEmployeeId((prev) => (prev === id ? null : id));
  }, []);

  const handleTaskClick = useCallback(
    (task: Task) => {
      setEditingTask(task);
    },
    [setEditingTask]
  );

  return (
    <div className="space-y-8 w-full max-w-7xl mx-auto px-4 sm:px-8 pb-16 animate-in fade-in duration-200">
      {/* 1. Header do Relatório */}
      <ReportsHeader onExportCSV={handleExportCSV} onPrint={handlePrint} />

      {/* 2. Barra de Filtros Globais */}
      <ReportsFilterToolbar
        period={period}
        onPeriodChange={setPeriod}
        selectedDept={selectedDept}
        onDeptChange={setSelectedDept}
        selectedClient={selectedClient}
        onClientChange={setSelectedClient}
        registeredClients={registeredClients}
        searchMember={searchMember}
        onSearchChange={setSearchMember}
      />

      {/* 3. Cards de Resumo Executivo Geral (KPIs Globais) */}
      <ReportsGlobalKPIs summary={globalSummary} />

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
            <p className="text-xs text-slate-400">
              Verifique os filtros selecionados ou cadastre novos colaboradores na equipe.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {productivityStats.map((stat) => (
              <ReportsEmployeeCard
                key={stat.employee.id}
                stat={stat}
                isExpanded={expandedEmployeeId === stat.employee.id}
                spineStatuses={spineStatuses}
                onToggleExpand={handleToggleExpand}
                onTaskClick={handleTaskClick}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
