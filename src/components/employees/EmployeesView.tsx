import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List as ListIcon,
  Settings,
  Clock,
  MessageSquare,
  Trash2,
  Edit2,
  Users,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Employee } from '../../types';

export const EmployeesView: React.FC = () => {
  const {
    employees,
    tasks,
    setIsNewEmployeeModalOpen,
    setSelectedEmployeeForDetail,
    setEditingEmployee,
    deleteEmployee,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'all' | 'organization'>('all');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'all' | 'name'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedSidebarEmployeeId, setSelectedSidebarEmployeeId] = useState<string | null>(null);

  // Extract unique departments and roles for filters
  const departments = useMemo(() => {
    const depts = new Set<string>();
    employees.forEach((e) => {
      if (e.department) depts.add(e.department);
    });
    return Array.from(depts);
  }, [employees]);

  const roles = useMemo(() => {
    const rSet = new Set<string>();
    employees.forEach((e) => {
      if (e.role) rSet.add(e.role);
    });
    return Array.from(rSet);
  }, [employees]);

  // Filtered & Sorted employees
  const filteredEmployees = useMemo(() => {
    let list = employees.filter((emp) => {
      const matchesDept = selectedDept === 'all' || emp.department?.toLowerCase() === selectedDept.toLowerCase();
      const matchesRole = selectedRole === 'all' || emp.role?.toLowerCase() === selectedRole.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (emp.tags && emp.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));

      return matchesDept && matchesRole && matchesSearch;
    });

    if (sortBy === 'name') {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    }
    return list;
  }, [employees, selectedDept, selectedRole, searchQuery, sortBy]);

  // Selected employee for sidebar (or default to first / team stats)
  const sidebarEmployee = useMemo(() => {
    if (selectedSidebarEmployeeId) {
      const found = employees.find((e) => e.id === selectedSidebarEmployeeId);
      if (found) return found;
    }
    return employees.length > 0 ? employees[0] : null;
  }, [employees, selectedSidebarEmployeeId]);

  // Calculate task stats for sidebar
  const stats = useMemo(() => {
    const relevantTasks = sidebarEmployee
      ? tasks.filter(
          (t) =>
            t.assigneeId === sidebarEmployee.id ||
            (t.assigneeName && t.assigneeName.toLowerCase() === sidebarEmployee.name.toLowerCase())
        )
      : tasks;

    const total = relevantTasks.length;
    const completed = relevantTasks.filter((t) => t.status === 'done').length;
    const inProgress = relevantTasks.filter((t) => t.status === 'in_progress' || t.status === 'in_review').length;
    const waiting = relevantTasks.filter((t) => t.status === 'backlog' || t.status === 'blocked').length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 74;

    return { total, completed, inProgress, waiting, rate };
  }, [tasks, sidebarEmployee]);

  // Progress percentage calculation per employee
  const getEmployeeEfficiency = (emp: Employee, index: number) => {
    const empTasks = tasks.filter(
      (t) =>
        t.assigneeId === emp.id ||
        (t.assigneeName && t.assigneeName.toLowerCase() === emp.name.toLowerCase())
    );
    if (empTasks.length > 0) {
      const done = empTasks.filter((t) => t.status === 'done').length;
      return Math.round((done / empTasks.length) * 100);
    }
    const presets = [100, 82, 66, 100, 33, 48, 75, 90];
    return presets[index % presets.length];
  };

  const getAvatarBorderColor = (index: number) => {
    const borders = [
      'ring-[#E4007E] text-[#E4007E]',
      'ring-blue-500 text-blue-500',
      'ring-emerald-500 text-emerald-500',
      'ring-purple-500 text-purple-500',
      'ring-rose-500 text-rose-500',
      'ring-sky-400 text-sky-400',
    ];
    return borders[index % borders.length];
  };

  const getStatusDot = (status?: Employee['status']) => {
    switch (status) {
      case 'online':
        return 'bg-emerald-500 ring-white dark:ring-[#181818]';
      case 'busy':
        return 'bg-amber-500 ring-white dark:ring-[#181818]';
      case 'away':
        return 'bg-purple-500 ring-white dark:ring-[#181818]';
      default:
        return 'bg-blue-500 ring-white dark:ring-[#181818]';
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-16 animate-in fade-in duration-200">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* ================= LEFT MAIN AREA (~75% WIDTH) ================= */}
        <div className="xl:col-span-8 2xl:col-span-9 space-y-6">
          {/* Top Header: Title, Tabs & Search */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight">Funcionários</h1>
              {/* Tabs: All / Organization */}
              <div className="flex items-center gap-6 mt-3 border-b border-slate-800 pb-2">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`relative text-sm font-bold pb-2 transition-all cursor-pointer ${
                    activeTab === 'all' ? 'text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>Todos ({employees.length})</span>
                  {activeTab === 'all' && (
                    <span className="absolute bottom-[-9px] left-0 right-0 h-0.5 bg-[#E4007E] rounded-full" />
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('organization')}
                  className={`relative text-sm font-bold pb-2 transition-all cursor-pointer ${
                    activeTab === 'organization' ? 'text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>Organização / Departamentos</span>
                  {activeTab === 'organization' && (
                    <span className="absolute bottom-[-9px] left-0 right-0 h-0.5 bg-[#E4007E] rounded-full" />
                  )}
                </button>
              </div>
            </div>

            {/* Right: Search Input + New Employee Button */}
            <div className="flex items-center gap-3">
              <div className="relative w-full md:w-64">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por nome..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#181818] border border-slate-800 focus:border-[#E4007E] rounded-2xl text-xs font-semibold text-white placeholder-slate-400 focus:outline-none transition-all shadow-inner"
                />
              </div>

              <button
                id="btn-add-employee"
                onClick={() => setIsNewEmployeeModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#E4007E] to-[#E94E18] hover:opacity-95 text-white rounded-2xl text-xs font-black shadow-md shadow-[#E4007E]/25 transition-all shrink-0 cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Novo Membro</span>
              </button>
            </div>
          </div>

          {/* Filter & Control Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#181818] p-3 rounded-2xl border border-slate-800">
            {/* Left Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Department Dropdown */}
              <div className="relative">
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="appearance-none bg-[#222222] hover:bg-[#022852] border border-slate-700/80 text-white text-xs font-bold py-2 pl-3.5 pr-8 rounded-xl focus:outline-none focus:border-[#E4007E] cursor-pointer transition-colors"
                >
                  <option value="all">Todas as Equipes</option>
                  {departments.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Position / Role Dropdown */}
              <div className="relative">
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="appearance-none bg-[#222222] hover:bg-[#022852] border border-slate-700/80 text-white text-xs font-bold py-2 pl-3.5 pr-8 rounded-xl focus:outline-none focus:border-[#E4007E] cursor-pointer transition-colors"
                >
                  <option value="all">Todos os Cargos</option>
                  {roles.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Reset filter button */}
              {(selectedDept !== 'all' || selectedRole !== 'all' || searchQuery) && (
                <button
                  onClick={() => {
                    setSelectedDept('all');
                    setSelectedRole('all');
                    setSearchQuery('');
                  }}
                  className="text-[11px] text-[#E4007E] hover:underline font-bold px-2 py-1 cursor-pointer"
                >
                  Limpar
                </button>
              )}
            </div>

            {/* Right Controls: Sort & View Toggle */}
            <div className="flex items-center gap-3">
              {/* Sort Dropdown */}
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <span className="hidden sm:inline">Ordenar:</span>
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="appearance-none bg-[#222222] hover:bg-[#022852] border border-slate-700/80 text-white text-xs font-bold py-2 pl-3 pr-7 rounded-xl focus:outline-none focus:border-[#E4007E] cursor-pointer transition-colors"
                  >
                    <option value="all">Padrão</option>
                    <option value="name">Nome (A-Z)</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* View Toggle Buttons */}
              <div className="flex items-center bg-[#222222] p-1 rounded-xl border border-slate-700/80">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-gradient-to-r from-[#E4007E] to-[#E94E18] text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Visualização em Grade"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                    viewMode === 'list'
                      ? 'bg-gradient-to-r from-[#E4007E] to-[#E94E18] text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Visualização em Lista"
                >
                  <ListIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* ================= EMPLOYEE CARDS GRID ================= */}
          {filteredEmployees.length === 0 ? (
            <div className="py-20 text-center bg-[#181818] rounded-3xl border border-slate-800 p-8">
              <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white">Nenhum funcionário encontrado</h3>
              <p className="text-xs text-slate-400 mt-1">
                Tente ajustar os filtros ou clique em "Novo Membro" para cadastrar.
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredEmployees.map((emp, index) => {
                const efficiency = getEmployeeEfficiency(emp, index);
                const borderRing = getAvatarBorderColor(index);
                const isSelected = sidebarEmployee?.id === emp.id;

                // Segments count (4 segments for the progress bar)
                const totalSegments = 4;
                const filledSegments = Math.round((efficiency / 100) * totalSegments);

                return (
                  <div
                    key={emp.id}
                    onClick={() => {
                      setSelectedSidebarEmployeeId(emp.id);
                      setEditingEmployee(emp);
                    }}
                    className={`group bg-[#181818] hover:bg-[#001c3d] rounded-3xl border transition-all duration-300 shadow-lg hover:shadow-2xl hover:-translate-y-1 cursor-pointer flex flex-col justify-between overflow-hidden relative ${
                      isSelected
                        ? 'border-[#E4007E] ring-2 ring-[#E4007E]/20'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {/* Top Right Context Options */}
                    <div className="absolute top-4 right-4 z-10">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingEmployee(emp);
                          }}
                          className="p-1.5 text-slate-400 hover:text-[#E4007E] rounded-lg hover:bg-slate-800/80 transition-colors cursor-pointer"
                          title="Editar Membro"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`Deseja realmente excluir ${emp.name}?`)) {
                              deleteEmployee(emp.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Excluir Membro"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Card Body: Centered Avatar, Name, Email, Productivity */}
                    <div className="p-6 pt-7 flex flex-col items-center text-center">
                      {/* Avatar with Ring & Status Indicator Dot */}
                      <div className="relative mb-3.5">
                        <div className={`p-1 rounded-full ring-2 ${borderRing} transition-transform group-hover:scale-105 duration-300`}>
                          {emp.avatarUrl ? (
                            <img
                              src={emp.avatarUrl}
                              alt={emp.name}
                              className="w-16 h-16 rounded-full object-cover shadow-md"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-full bg-[#01264E] text-white font-black text-lg flex items-center justify-center shadow-md uppercase">
                              {emp.initials || emp.name.slice(0, 2)}
                            </div>
                          )}
                        </div>
                        {/* Status Dot */}
                        <span
                          className={`absolute top-0 right-0 w-3.5 h-3.5 rounded-full ring-2 ${getStatusDot(
                            emp.status
                          )}`}
                          title={`Status: ${emp.status || 'Ativo'}`}
                        />
                      </div>

                      {/* Name */}
                      <h3 className="font-extrabold text-white text-base tracking-tight group-hover:text-[#E4007E] transition-colors leading-tight truncate max-w-[200px]">
                        {emp.name}
                      </h3>

                      {/* Email */}
                      <p className="text-xs text-slate-400 mt-1 truncate max-w-[220px]">
                        {emp.email || `${emp.name.toLowerCase().replace(/\s+/g, '.')}@gmail.com`}
                      </p>

                      {/* Progress Bar / Time Log (Segmented Bar with Clock) */}
                      <div className="mt-5 w-full flex items-center justify-center gap-2.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <div className="flex items-center gap-1.5 flex-1 max-w-[130px]">
                          {Array.from({ length: totalSegments }).map((_, sIdx) => {
                            const isFilled = sIdx < filledSegments;
                            return (
                              <div
                                key={sIdx}
                                className={`h-1.5 rounded-full flex-1 transition-all ${
                                  isFilled ? 'bg-[#E4007E]' : 'bg-slate-800'
                                }`}
                              />
                            );
                          })}
                        </div>
                        <span className="text-xs font-bold text-white shrink-0 min-w-[34px] text-right">
                          {efficiency}%
                        </span>
                      </div>
                    </div>

                    {/* Card Footer: Role in Uppercase */}
                    <div className="bg-[#001124] px-4 py-3 border-t border-slate-800/80 text-center">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-300 group-hover:text-white transition-colors truncate block">
                        {emp.role || emp.department || 'COLABORADOR'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Table / List View */
            <div className="bg-[#181818] rounded-3xl border border-slate-800 overflow-hidden shadow-lg">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-[#E4007E] font-black uppercase text-[11px] tracking-wider bg-[#001124]">
                    <th className="px-6 py-4">Membro</th>
                    <th className="px-6 py-4">Cargo</th>
                    <th className="px-6 py-4">Departamento</th>
                    <th className="px-6 py-4">Desempenho</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium text-white">
                  {filteredEmployees.map((emp, index) => {
                    const efficiency = getEmployeeEfficiency(emp, index);
                    return (
                      <tr
                        key={emp.id}
                        onClick={() => {
                          setSelectedSidebarEmployeeId(emp.id);
                          setEditingEmployee(emp);
                        }}
                        className="hover:bg-slate-800/30 transition-colors cursor-pointer"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center font-bold text-white">
                              {emp.avatarUrl ? (
                                <img src={emp.avatarUrl} alt={emp.name} className="w-full h-full object-cover" />
                              ) : (
                                emp.initials || emp.name.slice(0, 2)
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-white">{emp.name}</div>
                              <div className="text-[11px] text-slate-400">{emp.email || `${emp.name.toLowerCase().replace(/\s+/g, '.')}@gmail.com`}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-300 font-bold uppercase text-[11px]">{emp.role || '—'}</td>
                        <td className="px-6 py-4 text-slate-300">{emp.department || 'Geral'}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-2 bg-slate-800 rounded-full overflow-hidden">
                              <div className="h-full bg-[#E4007E] rounded-full" style={{ width: `${efficiency}%` }} />
                            </div>
                            <span className="font-bold text-xs">{efficiency}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setEditingEmployee(emp)}
                              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`Deseja excluir ${emp.name}?`)) deleteEmployee(emp.id);
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ================= RIGHT SIDEBAR PANEL (~25% WIDTH) ================= */}
        <div className="xl:col-span-4 2xl:col-span-3 space-y-6">
          {/* Main Sidebar Box */}
          <div className="bg-[#181818] rounded-3xl p-6 border border-slate-800 shadow-xl space-y-6">
            {/* Header: Selected Team / Member */}
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-extrabold tracking-wider uppercase text-slate-400 block">
                  SELECIONADO
                </span>
                <h2 className="text-xl font-black text-white tracking-tight mt-0.5 truncate max-w-[200px]">
                  {sidebarEmployee ? sidebarEmployee.name : 'Equipe Geral'}
                </h2>
                <p className="text-xs text-slate-400 font-medium">
                  {sidebarEmployee ? sidebarEmployee.role || sidebarEmployee.department : 'Visão Geral'}
                </p>
              </div>

              <button
                onClick={() => {
                  if (sidebarEmployee) setEditingEmployee(sidebarEmployee);
                }}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
                title="Configurações / Detalhes"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>

            {/* Circular Gauge / Radial Progress */}
            <div className="flex items-center justify-between py-2">
              <button
                onClick={() => {
                  if (employees.length > 0) {
                    const currIdx = employees.findIndex((e) => e.id === sidebarEmployee?.id);
                    const prevIdx = (currIdx - 1 + employees.length) % employees.length;
                    setSelectedSidebarEmployeeId(employees[prevIdx].id);
                  }
                }}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/80 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {/* Radial Progress Ring */}
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {/* Background Track Circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    className="text-slate-800"
                    strokeWidth="8"
                    stroke="currentColor"
                    fill="transparent"
                  />
                  {/* Progress Arc */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    className="text-[#E4007E] transition-all duration-700 ease-out"
                    strokeWidth="8"
                    strokeDasharray={251.2}
                    strokeDashoffset={251.2 - (251.2 * stats.rate) / 100}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                  />
                </svg>

                {/* Inner Text */}
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                    TIME LOG
                  </span>
                  <span className="text-2xl font-black text-white tracking-tight">
                    {stats.rate}%
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  if (employees.length > 0) {
                    const currIdx = employees.findIndex((e) => e.id === sidebarEmployee?.id);
                    const nextIdx = (currIdx + 1) % employees.length;
                    setSelectedSidebarEmployeeId(employees[nextIdx].id);
                  }
                }}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/80 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Projects / Demandas Metric 2x2 Grid */}
            <div className="space-y-3 pt-2">
              <h3 className="text-sm font-extrabold text-white">Demandas & Projetos</h3>

              <div className="grid grid-cols-2 gap-3">
                {/* Total */}
                <div className="bg-[#001124] p-4 rounded-2xl border border-slate-800 relative overflow-hidden">
                  <div className="absolute left-0 top-3 bottom-3 w-1 bg-blue-500 rounded-r" />
                  <span className="text-[10px] font-black tracking-wider uppercase text-slate-400 block pl-1">
                    TOTAL
                  </span>
                  <span className="text-xl font-black text-white block mt-1 pl-1">
                    {stats.total}
                  </span>
                </div>

                {/* Concluídas */}
                <div className="bg-[#001124] p-4 rounded-2xl border border-slate-800 relative overflow-hidden">
                  <div className="absolute left-0 top-3 bottom-3 w-1 bg-emerald-500 rounded-r" />
                  <span className="text-[10px] font-black tracking-wider uppercase text-slate-400 block pl-1">
                    CONCLUÍDAS
                  </span>
                  <span className="text-xl font-black text-white block mt-1 pl-1">
                    {stats.completed}
                  </span>
                </div>

                {/* Em Andamento */}
                <div className="bg-[#001124] p-4 rounded-2xl border border-slate-800 relative overflow-hidden">
                  <div className="absolute left-0 top-3 bottom-3 w-1 bg-cyan-400 rounded-r" />
                  <span className="text-[10px] font-black tracking-wider uppercase text-slate-400 block pl-1">
                    EM ANDAMENTO
                  </span>
                  <span className="text-xl font-black text-white block mt-1 pl-1">
                    {stats.inProgress}
                  </span>
                </div>

                {/* Aguardando / Pendentes */}
                <div className="bg-[#001124] p-4 rounded-2xl border border-slate-800 relative overflow-hidden">
                  <div className="absolute left-0 top-3 bottom-3 w-1 bg-amber-500 rounded-r" />
                  <span className="text-[10px] font-black tracking-wider uppercase text-slate-400 block pl-1">
                    AGUARDANDO
                  </span>
                  <span className="text-xl font-black text-white block mt-1 pl-1">
                    {stats.waiting}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Widget: Declaration Center / Internal Messages */}
            <div className="pt-2">
              <div className="bg-[#001124] p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between hover:border-[#FFB903]/40 transition-colors cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="relative w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
                    <MessageSquare className="w-4 h-4" />
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#001124]" />
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">
                      CENTRAL DE AVISOS
                    </span>
                    <span className="text-xs font-bold text-white group-hover:text-[#FFB903] transition-colors">
                      Mensagens internas
                    </span>
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
