import React, { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  Tag,
  Mail,
  MapPin,
  Briefcase,
  Edit2,
  Trash2,
  ExternalLink,
  Building2,
  Rocket,
  Flower2,
  BarChart3,
  ShieldCheck,
  Zap,
  Box,
  Layers,
  X,
  Clock,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Employee, Project } from '../../types';

export const RegistrationsView: React.FC = () => {
  const {
    employees,
    projects,
    tasks,
    setIsNewEmployeeModalOpen,
    setEditingEmployee,
    deleteEmployee,
    setSelectedEmployeeForDetail,
    setIsNewProjectModalOpen,
    setEditingProject,
    deleteProject,
    setSelectedProjectForDetail,
    updateEmployee,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'employees' | 'clients'>('employees');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDept, setSelectedDept] = useState<string>('All');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>('All');

  // Modal rápido para gerenciar etiquetas de um funcionário específico
  const [tagModalEmployee, setTagModalEmployee] = useState<Employee | null>(null);
  const [newTagInput, setNewTagInput] = useState<string>('');

  // Coleta todas as tags únicas de funcionários no sistema
  const allUniqueTags = Array.from(
    new Set(employees.flatMap((e) => e.tags || []).map((t) => t.trim().toUpperCase()))
  ).filter(Boolean);

  // Filtro de Funcionários
  const filteredEmployees = employees.filter((emp) => {
    const matchesDept =
      selectedDept === 'All' ||
      emp.department === selectedDept ||
      (selectedDept === 'Engineering' && emp.department === 'Infrastructure');

    const matchesTag =
      selectedTagFilter === 'All' ||
      (emp.tags && emp.tags.some((t) => t.toUpperCase() === selectedTagFilter.toUpperCase()));

    const q = searchQuery.toLowerCase();
    const matchesSearch =
      emp.name.toLowerCase().includes(q) ||
      emp.role.toLowerCase().includes(q) ||
      emp.email.toLowerCase().includes(q) ||
      (emp.tags && emp.tags.some((t) => t.toLowerCase().includes(q)));

    return matchesDept && matchesTag && matchesSearch;
  });

  // Filtro de Clientes / Projetos (exclui configurações de sistema)
  const filteredProjects = projects.filter((proj) => {
    if (
      proj.id === 'google-drive-token' ||
      proj.id.startsWith('system-') ||
      proj.id.startsWith('google-') ||
      proj.category?.toLowerCase() === 'system' ||
      proj.status === 'system'
    ) {
      return false;
    }
    const q = searchQuery.toLowerCase();
    return (
      proj.name.toLowerCase().includes(q) ||
      proj.category.toLowerCase().includes(q) ||
      (proj.description && proj.description.toLowerCase().includes(q))
    );
  });

  // Manipulação de tags no modal rápido de tags
  const handleAddTagToEmployee = (emp: Employee) => {
    if (!newTagInput.trim()) return;
    const cleanTag = newTagInput.trim().toUpperCase();
    if (!emp.tags.includes(cleanTag)) {
      const updatedTags = [...emp.tags, cleanTag];
      updateEmployee(emp.id, { tags: updatedTags });
      setTagModalEmployee({ ...emp, tags: updatedTags });
    }
    setNewTagInput('');
  };

  const handleRemoveTagFromEmployee = (emp: Employee, tagToRemove: string) => {
    const updatedTags = emp.tags.filter((t) => t !== tagToRemove);
    updateEmployee(emp.id, { tags: updatedTags });
    setTagModalEmployee({ ...emp, tags: updatedTags });
  };

  const getProjectIcon = (iconType: Project['iconType']) => {
    switch (iconType) {
      case 'rocket':
        return <Rocket className="w-5 h-5 text-white" />;
      case 'flower':
        return <Flower2 className="w-5 h-5 text-white" />;
      case 'chart':
        return <BarChart3 className="w-5 h-5 text-white" />;
      case 'shield':
        return <ShieldCheck className="w-5 h-5 text-white" />;
      case 'zap':
        return <Zap className="w-5 h-5 text-white" />;
      default:
        return <Box className="w-5 h-5 text-white" />;
    }
  };

  const getAvatarBorderColor = (index: number) => {
    const borders = [
      'ring-[#FFB903] text-[#FFB903]',
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

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#181818] p-6 rounded-3xl border border-[#2A2A2A] shadow-xl">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#E4007E] to-[#E94E18] flex items-center justify-center text-white font-black shadow-lg shadow-[#E4007E]/25">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Central de Cadastros
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Gerencie todos os Funcionários, Equipes, Clientes e Etiquetas do sistema.
              </p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-3">
          {activeSubTab === 'employees' ? (
            <button
              id="btn-cadastrar-funcionario"
              onClick={() => setIsNewEmployeeModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#E4007E] to-[#E94E18] hover:opacity-95 text-white rounded-xl text-sm font-black shadow-lg shadow-[#E4007E]/25 transition-all active:scale-98 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Novo Funcionário</span>
            </button>
          ) : (
            <button
              id="btn-cadastrar-cliente"
              onClick={() => setIsNewProjectModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#E4007E] to-[#E94E18] hover:opacity-95 text-white rounded-xl text-sm font-black shadow-lg shadow-[#E4007E]/25 transition-all active:scale-98 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Novo Cliente</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs Navigation (Funcionários vs Clientes) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#2A2A2A] pb-4">
        <div className="flex items-center gap-2 bg-[#141414] p-1.5 rounded-2xl border border-[#2A2A2A]">
          <button
            onClick={() => {
              setActiveSubTab('employees');
              setSearchQuery('');
            }}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeSubTab === 'employees'
                ? 'bg-gradient-to-r from-[#E4007E] to-[#E94E18] text-white shadow-md shadow-[#E4007E]/25'
                : 'text-[#A0A0A0] hover:text-white hover:bg-[#262626]'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Funcionários ({employees.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveSubTab('clients');
              setSearchQuery('');
            }}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeSubTab === 'clients'
                ? 'bg-gradient-to-r from-[#E4007E] to-[#E94E18] text-white shadow-md shadow-[#E4007E]/25'
                : 'text-[#A0A0A0] hover:text-white hover:bg-[#262626]'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Clientes ({filteredProjects.length})</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={activeSubTab === 'employees' ? 'Buscar funcionário, cargo ou tag...' : 'Buscar cliente...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#181818] border border-[#2A2A2A] focus:border-[#E4007E] rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 font-medium focus:outline-none transition-all shadow-inner"
          />
        </div>
      </div>

      {/* SUB-TAB 1: FUNCIONÁRIOS */}
      {activeSubTab === 'employees' && (
        <div className="space-y-6">
          {/* Department and Tag Filters */}
          <div className="flex flex-wrap items-center gap-2 bg-[#181818] p-3 rounded-2xl border border-[#2A2A2A]">
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5 px-2">
              <Tag className="w-3.5 h-3.5 text-[#E4007E]" />
              Filtrar por Tag:
            </span>

            <button
              onClick={() => setSelectedTagFilter('All')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedTagFilter === 'All'
                  ? 'bg-gradient-to-r from-[#E4007E] to-[#E94E18] text-white'
                  : 'bg-[#222222] text-slate-400 hover:text-white border border-[#2E2E2E]'
              }`}
            >
              Todas as tags
            </button>

            {allUniqueTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTagFilter(tag === selectedTagFilter ? 'All' : tag)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all uppercase tracking-wider cursor-pointer ${
                  selectedTagFilter === tag
                    ? 'bg-gradient-to-r from-[#E4007E] to-[#E94E18] text-white shadow-sm'
                    : 'bg-[#222222] text-slate-300 hover:text-white border border-[#2E2E2E]'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Employees List */}
          {filteredEmployees.length === 0 ? (
            <div className="p-12 text-center bg-[#181818] rounded-3xl border border-[#2A2A2A]">
              <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white">Nenhum funcionário cadastrado</h3>
              <p className="text-xs text-slate-400 mt-1">
                Clique no botão "Novo Funcionário" acima para cadastrar seu primeiro membro da equipe.
              </p>
              <button
                onClick={() => setIsNewEmployeeModalOpen(true)}
                className="mt-4 px-4 py-2 bg-gradient-to-r from-[#E4007E] to-[#E94E18] hover:opacity-95 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 cursor-pointer shadow-md shadow-[#E4007E]/25"
              >
                <Plus className="w-4 h-4" />
                Cadastrar Agora
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredEmployees.map((emp, index) => {
                const efficiency = getEmployeeEfficiency(emp, index);
                const borderRing = getAvatarBorderColor(index);
                const totalSegments = 4;
                const filledSegments = Math.round((efficiency / 100) * totalSegments);

                return (
                  <div
                    key={emp.id}
                    onClick={() => setEditingEmployee(emp)}
                    className="group bg-[#181818] hover:bg-[#202020] rounded-3xl border border-[#2A2A2A] hover:border-[#E4007E]/50 transition-all duration-300 shadow-lg hover:shadow-2xl hover:-translate-y-1 cursor-pointer flex flex-col justify-between overflow-hidden relative"
                  >
                    {/* Top Right Actions */}
                    <div className="absolute top-4 right-4 z-10">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingEmployee(emp);
                          }}
                          className="p-1.5 text-slate-400 hover:text-[#E4007E] rounded-lg hover:bg-[#262626] transition-colors cursor-pointer"
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
                      {/* Avatar with Ring & Status Dot */}
                      <div className="relative mb-3.5">
                        <div className={`p-1 rounded-full ring-2 ${borderRing} transition-transform group-hover:scale-105 duration-300`}>
                          {emp.avatarUrl ? (
                            <img
                              src={emp.avatarUrl}
                              alt={emp.name}
                              className="w-16 h-16 rounded-full object-cover shadow-md"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-full bg-[#222222] text-[#E4007E] border border-[#303030] font-black text-lg flex items-center justify-center shadow-md uppercase">
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

                      {/* Progress Bar / Time Log */}
                      <div className="mt-5 w-full flex items-center justify-center gap-2.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <div className="flex items-center gap-1.5 flex-1 max-w-[130px]">
                          {Array.from({ length: totalSegments }).map((_, sIdx) => {
                            const isFilled = sIdx < filledSegments;
                            return (
                              <div
                                key={sIdx}
                                className={`h-1.5 rounded-full flex-1 transition-all ${
                                  isFilled ? 'bg-[#E4007E]' : 'bg-[#262626]'
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
                    <div className="bg-[#141414] px-4 py-3 border-t border-[#262626] text-center">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-300 group-hover:text-white transition-colors truncate block">
                        {emp.role || emp.department || 'COLABORADOR'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: CLIENTES & PROJETOS */}
      {activeSubTab === 'clients' && (
        <div className="space-y-6">
          {filteredProjects.length === 0 ? (
            <div className="p-12 text-center bg-[#181818] rounded-3xl border border-[#2A2A2A]">
              <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white">Nenhum cliente cadastrado</h3>
              <p className="text-xs text-slate-400 mt-1">
                Clique no botão "Novo Cliente" acima para cadastrar seu primeiro cliente.
              </p>
              <button
                onClick={() => setIsNewProjectModalOpen(true)}
                className="mt-4 px-4 py-2 bg-[#E4007E] hover:bg-[#c2006b] text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Cadastrar Agora
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredProjects.map((proj) => {
                const projTasks = tasks.filter((t) => t.projectId === proj.id);
                const completedTasks = projTasks.filter((t) => t.status === 'done').length;
                const progressPct =
                  projTasks.length > 0 ? Math.round((completedTasks / projTasks.length) * 100) : 0;

                return (
                  <div
                    key={proj.id}
                    className="bg-[#181818] rounded-3xl p-5 border border-[#2A2A2A] hover:border-[#E4007E]/50 shadow-lg transition-all group flex flex-col justify-between"
                  >
                    <div>
                      {/* Card Header: Icon/Logo, Name, Category & Actions */}
                      <div className="flex items-start justify-between gap-3">
                        <div
                          className="flex items-center gap-3 cursor-pointer"
                          onClick={() => setSelectedProjectForDetail(proj)}
                        >
                          {proj.logoUrl ? (
                            <img
                              src={proj.logoUrl}
                              alt={proj.name}
                              className="w-12 h-12 object-contain shrink-0 drop-shadow-md"
                            />
                          ) : (
                            <div
                              className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-md ${
                                proj.iconColor || 'bg-blue-600'
                              }`}
                            >
                              {getProjectIcon(proj.iconType)}
                            </div>
                          )}

                          <div>
                            <h3 className="font-extrabold text-white text-base group-hover:text-[#FFBA00] transition-colors leading-tight">
                              {proj.name}
                            </h3>
                            <p className="text-xs text-white/90 font-medium mt-0.5">{proj.category}</p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setEditingProject(proj)}
                            className="p-1.5 text-white hover:text-[#FFBA00] rounded-lg hover:bg-slate-800 transition-colors"
                            title="Editar cliente"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Deseja realmente excluir o cliente ${proj.name}?`)) {
                                deleteProject(proj.id);
                              }
                            }}
                            className="p-1.5 text-white hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors"
                            title="Excluir cliente"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Description */}
                      {proj.description && (
                        <p className="text-xs text-white/90 mt-3 line-clamp-2 leading-relaxed">
                          {proj.description}
                        </p>
                      )}

                      {/* Team Members in Project */}
                      <div className="mt-4 pt-3 border-t border-slate-800/80">
                        <div className="flex items-center justify-between text-xs text-white mb-2">
                          <span>Membros Atribuídos:</span>
                          <span className="font-bold text-white">
                            {proj.teamMemberIds ? proj.teamMemberIds.length : 0}
                          </span>
                        </div>

                        <div className="flex items-center -space-x-2 overflow-hidden">
                          {(proj.teamMemberIds || []).slice(0, 5).map((mId) => {
                            const emp = employees.find((e) => e.id === mId);
                            if (!emp) return null;
                            return emp.avatarUrl ? (
                              <img
                                key={emp.id}
                                src={emp.avatarUrl}
                                alt={emp.name}
                                className="w-7 h-7 rounded-full ring-2 ring-[#011C39] object-cover"
                                title={emp.name}
                              />
                            ) : (
                              <div
                                key={emp.id}
                                className="w-7 h-7 rounded-full bg-slate-700 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-[#011C39]"
                                title={emp.name}
                              >
                                {emp.initials}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar & Footer */}
                    <div className="mt-5 pt-3 border-t border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-white">Progresso</span>
                        <span className="font-bold text-white">{progressPct}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#FFBA00] rounded-full transition-all duration-300"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="text-white">{projTasks.length} demandas</span>
                        <button
                          onClick={() => setSelectedProjectForDetail(proj)}
                          className="text-xs font-bold text-white hover:text-[#FFBA00] flex items-center gap-1 cursor-pointer"
                        >
                          <span>Detalhes</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODAL RÁPIDO PARA GERENCIAR ETIQUETAS DO FUNCIONÁRIO */}
      {tagModalEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
            onClick={() => setTagModalEmployee(null)}
          />
          <div className="relative bg-[#011C39] rounded-3xl shadow-2xl border border-slate-700 max-w-md w-full p-6 z-10 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-[#FFBA00]" />
                <h3 className="text-base font-black text-white">
                  Etiquetas de {tagModalEmployee.name}
                </h3>
              </div>
              <button
                onClick={() => setTagModalEmployee(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tags Atuais */}
            <div className="mt-4">
              <label className="block text-xs font-bold text-slate-400 mb-2">
                Etiquetas Atuais:
              </label>
              <div className="flex flex-wrap gap-2 min-h-10 p-3 bg-[#011427] rounded-xl border border-slate-800">
                {tagModalEmployee.tags && tagModalEmployee.tags.length > 0 ? (
                  tagModalEmployee.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-indigo-950 text-indigo-300 border border-indigo-800"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTagFromEmployee(tagModalEmployee, tag)}
                        className="hover:text-rose-400"
                        title="Remover tag"
                      >
                        <X className="w-3 h-3 stroke-[3]" />
                      </button>
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-500 italic">Nenhuma etiqueta atribuída</span>
                )}
              </div>
            </div>

            {/* Adicionar Nova Tag */}
            <div className="mt-4">
              <label className="block text-xs font-bold text-slate-400 mb-1">
                Adicionar Nova Etiqueta:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Ex: REACT, DESIGNER, MOTION..."
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTagToEmployee(tagModalEmployee);
                    }
                  }}
                  className="flex-1 p-2.5 bg-[#222222] border border-[#2A2A2A] focus:border-[#E4007E] rounded-xl text-xs text-white uppercase placeholder-slate-500 font-bold focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleAddTagToEmployee(tagModalEmployee)}
                  className="px-4 py-2.5 bg-[#E4007E] hover:bg-[#c2006b] text-white rounded-xl text-xs font-black"
                >
                  Adicionar
                </button>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#2A2A2A] flex justify-end">
              <button
                type="button"
                onClick={() => setTagModalEmployee(null)}
                className="px-4 py-2 bg-[#222222] hover:bg-[#2A2A2A] text-white rounded-xl text-xs font-bold"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
