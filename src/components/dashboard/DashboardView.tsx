import React, { useMemo, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { useTasks } from '../../context/TasksContext';
import { useEmployees } from '../../context/EmployeesContext';
import { useProjects } from '../../context/ProjectsContext';
import { useAuth } from '../../context/AuthContext';
import { Task, Employee } from '../../types';
import { CreativeRankingWidget } from './CreativeRankingWidget';
import { DashboardHeader } from './DashboardHeader';
import { DashboardStatCards } from './DashboardStatCards';
import { DashboardActiveTasks } from './DashboardActiveTasks';
import { DashboardWorkloadWidget } from './DashboardWorkloadWidget';
import { DashboardSprintOverview } from './DashboardSprintOverview';
import {
  filterDashboardTasks,
  computeDashboardMetrics,
  computeWorkloadMembers,
} from './dashboardUtils';

export const DashboardView: React.FC = () => {
  // Contextos especializados
  const { tasks, isLoadingTasks } = useTasks();
  const { employees } = useEmployees();
  const { projects } = useProjects();
  const { currentUser, isManagerOrAdmin } = useAuth();
  const {
    activeFilter,
    setActiveFilter,
    setIsNewTaskModalOpen,
    setEditingTask,
    setSelectedEmployeeForDetail,
  } = useApp();

  // Filtragem de tarefas de acordo com o filtro ativo ('all' | 'flagged' | 'mine')
  const filteredTasks = useMemo(() => {
    return filterDashboardTasks(tasks, activeFilter, currentUser);
  }, [tasks, activeFilter, currentUser]);

  // Métricas dinâmicas do Dashboard
  const dashboardMetrics = useMemo(() => {
    return computeDashboardMetrics(filteredTasks, projects);
  }, [filteredTasks, projects]);

  // Carga de trabalho e capacidade da equipe
  const { workloadMembers, totalBacklogCount } = useMemo(() => {
    return computeWorkloadMembers(employees, filteredTasks);
  }, [employees, filteredTasks]);

  // Handlers estabilizados para evitar renders desnecessários nos filhos memoizados
  const handleFilterChange = useCallback(
    (filter: string) => {
      setActiveFilter(filter);
    },
    [setActiveFilter]
  );

  const handleNewTaskClick = useCallback(() => {
    setIsNewTaskModalOpen(true);
  }, [setIsNewTaskModalOpen]);

  const handleTaskClick = useCallback(
    (task: Task) => {
      setEditingTask(task);
    },
    [setEditingTask]
  );

  const handleSelectEmployee = useCallback(
    (emp: Employee) => {
      setSelectedEmployeeForDetail(emp);
    },
    [setSelectedEmployeeForDetail]
  );



  return (
    <div className="space-y-6 w-full px-4 sm:px-8 pb-12">
      {/* Top Header */}
      <DashboardHeader
        activeFilter={activeFilter}
        onFilterChange={handleFilterChange}
        onNewTaskClick={handleNewTaskClick}
      />

      {/* 3 Stat KPI Cards - High Contrast Dark Theme */}
      <DashboardStatCards metrics={dashboardMetrics} />

      {/* Main Grid: Left Column (Active Tasks + Team Workload) & Right Column (Creative Ranking + Sprint Overview) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7 cols): Active Tasks & Team Workload */}
        <div className="lg:col-span-7 space-y-6">
          {/* Active Tasks Widget */}
          <DashboardActiveTasks
            tasks={filteredTasks}
            onTaskClick={handleTaskClick}
            onAddTaskClick={handleNewTaskClick}
          />

          {/* Team Workload Widget (Visível apenas para Gestor/Admin) */}
          {isManagerOrAdmin(currentUser) && (
            <DashboardWorkloadWidget
              workloadMembers={workloadMembers}
              totalBacklogCount={totalBacklogCount}
              onSelectEmployee={handleSelectEmployee}
            />
          )}
        </div>

        {/* Right Column (5 cols): Creative Ranking & Sprint Overview */}
        <div className="lg:col-span-5 space-y-6">
          {/* 🏆 Ranking de Produtividade Criativa */}
          <CreativeRankingWidget
            employees={employees}
            tasks={tasks}
            onSelectEmployee={handleSelectEmployee}
          />

          {/* Sprint Overview Widget */}
          <DashboardSprintOverview metrics={dashboardMetrics} />
        </div>
      </div>
    </div>
  );
};
