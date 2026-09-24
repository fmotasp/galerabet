import React, { useState, useCallback } from 'react';
import { X } from 'lucide-react';
import { useApp, useTasks, useProjects, useEmployees, useAuth } from '../../context/AppContext';
import { Task, TaskStatus, Project } from '../../types';
import { TasksHeader } from './TasksHeader';
import { TasksFilterToolbar } from './TasksFilterToolbar';
import { TasksKanbanView } from './TasksKanbanView';
import { TasksTableView } from './TasksTableView';
import { useTasksFilter, getTaskNumericTimestamp } from './useTasksFilter';

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

  // Standard colors mapping (Darker editions for high contrast)
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
    className: 'bg-[#161616] hover:bg-[#1C1C1C] border border-transparent shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] drop-shadow-md',
  };
};

export const TasksView: React.FC = () => {
  const {
    tasks,
    moveTaskStatus,
    deleteTask,
    moveAllBacklogToDoneLocally,
    isLoadingTasks,
    updateTask,
    addTask,
  } = useTasks();
  const { projects } = useProjects();
  const { employees } = useEmployees();
  const { currentUser } = useAuth();
  const {
    setIsNewTaskModalOpen,
    setEditingTask,
    spineStatuses,
    activeFilter,
    setActiveFilter,
  } = useApp();

  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  const {
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
  } = useTasksFilter({
    tasks,
    projects,
    employees,
    spineStatuses,
    currentUser,
    activeFilter,
    setActiveFilter,
  });

  const handleNewTask = useCallback(() => {
    setIsNewTaskModalOpen(true);
  }, [setIsNewTaskModalOpen]);

  const handleMemberDropdownToggle = useCallback(() => {
    setIsMemberDropdownOpen((prev) => !prev);
  }, [setIsMemberDropdownOpen]);

  const handleMemberDropdownClose = useCallback(() => {
    setIsMemberDropdownOpen(false);
  }, [setIsMemberDropdownOpen]);

  const handleShowDoneColumnToggle = useCallback(() => {
    setShowDoneColumn((prev) => !prev);
  }, [setShowDoneColumn]);



  return (
    <div className={`w-full px-4 sm:px-8 animate-in fade-in duration-200 ${viewMode === 'kanban' ? 'flex-1 min-h-0 flex flex-col overflow-hidden space-y-4' : 'space-y-6 pb-12'}`}>
      {/* Header */}
      <TasksHeader
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onNewTask={handleNewTask}
      />

      {/* Filter Toolbar - Filtro de Cliente e Membros */}
      <TasksFilterToolbar
        onNewTask={handleNewTask}
        registeredClients={registeredClients}
        selectedClient={selectedClient}
        onClientChange={setSelectedClient}
        employees={employees}
        selectedMember={selectedMember}
        onMemberChange={setSelectedMember}
        isMemberDropdownOpen={isMemberDropdownOpen}
        onMemberDropdownToggle={handleMemberDropdownToggle}
        onMemberDropdownClose={handleMemberDropdownClose}
        memberFilterSearch={memberFilterSearch}
        onMemberFilterSearchChange={setMemberFilterSearch}
        currentUser={currentUser}
        showDoneColumn={showDoneColumn}
        onShowDoneColumnToggle={handleShowDoneColumnToggle}
        totalFilteredTasks={filteredTasks.length}
      />

      

      {/* Board (Kanban) View */}
      {viewMode === 'kanban' ? (
        <div className="flex-1 min-h-0 w-full overflow-hidden">
          <TasksKanbanView
            columns={columns}
            filteredTasks={filteredTasks}
            projects={projects}
            spineStatuses={spineStatuses}
            getTaskNumericTimestamp={getTaskNumericTimestamp}
            getLabelColorHex={getLabelColorHex}
            getTaskCardBgStyle={getTaskCardBgStyle}
            moveTaskStatus={moveTaskStatus}
            moveAllBacklogToDoneLocally={moveAllBacklogToDoneLocally}
            setIsNewTaskModalOpen={setIsNewTaskModalOpen}
            setEditingTask={setEditingTask}
            updateTask={updateTask}
            addTask={addTask}
          />
        </div>
      ) : (
        <TasksTableView
          searchQuery={searchQuery}
          onSearchQueryChange={(query) => {
            setSearchQuery(query);
            setVisibleTasksCount(10);
          }}
          sortedTasks={sortedTasks}
          paginatedTasks={paginatedTasks}
          visibleTasksCount={visibleTasksCount}
          onLoadMore={() => setVisibleTasksCount((prev) => prev + 10)}
          exportTasksToCSV={exportTasksToCSV}
          sortBy={sortBy}
          onSortByChange={(sort) => {
            setSortBy(sort);
            setVisibleTasksCount(10);
          }}
          setIsNewTaskModalOpen={setIsNewTaskModalOpen}
          selectedClient={selectedClient}
          onClientClear={() => setSelectedClient('all')}
          selectedMember={selectedMember}
          onMemberClear={() => setSelectedMember('all')}
          onClearAllFilters={() => {
            setSelectedClient('all');
            setSelectedMember('all');
            setSearchQuery('');
            setVisibleTasksCount(10);
          }}
          registeredClients={registeredClients}
          employees={employees}
          spineStatuses={spineStatuses}
          getSpineStatusConfig={getSpineStatusConfig}
          moveTaskStatus={moveTaskStatus}
          setEditingTask={setEditingTask}
          deleteTask={deleteTask}
        />
      )}
    </div>
  );
};
