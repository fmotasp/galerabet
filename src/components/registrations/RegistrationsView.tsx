import React, { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  Tag,
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
import { Button, Input, Badge, Avatar } from '../ui';

export const RegistrationsView: React.FC = () => {
  const {
    employees,
    projects,
    tasks,
    setIsNewEmployeeModalOpen,
    setEditingEmployee,
    deleteEmployee,
    setIsNewProjectModalOpen,
    setEditingProject,
    deleteProject,
    setSelectedProjectForDetail,
    updateEmployee,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'employees' | 'clients'>('employees');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDept] = useState<string>('All');
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
      'ring-[#FFB903]',
      'ring-blue-500',
      'ring-emerald-500',
      'ring-purple-500',
      'ring-rose-500',
      'ring-sky-400',
    ];
    return borders[index % borders.length];
  };

  const getStatusDot = (status?: Employee['status']): 'online' | 'busy' | 'offline' => {
    switch (status) {
      case 'online':
        return 'online';
      case 'busy':
        return 'busy';
      default:
        return 'offline';
    }
  };

  // Helper: Get real tasks assigned to an employee
  const getEmployeeTasks = (emp: Employee) => {
    const empFirstName = emp.name.toLowerCase().split(' ')[0].trim();
    const empFullName = emp.name.toLowerCase().trim();
    const empEmailName = (emp.email || '').split('@')[0].toLowerCase().trim();

    return tasks.filter((t) => {
      // 1. Assignee direto
      if (t.assigneeId === emp.id) return true;
      if (t.assigneeName) {
        const aName = t.assigneeName.toLowerCase().trim();
        if (aName === empFullName || aName.includes(empFirstName) || empFullName.includes(aName)) return true;
      }
      // 2. Lista de membros
      if (t.members && t.members.length > 0) {
        if (
          t.members.some(
            (m) =>
              m.id === emp.id ||
              m.name.toLowerCase().includes(empFirstName) ||
              empFullName.includes(m.name.toLowerCase())
          )
        ) {
          return true;
        }
      }
      return false;
    });
  };

  const getEmployeeEfficiency = (emp: Employee) => {
    const empTasks = getEmployeeTasks(emp);
    if (empTasks.length === 0) return 0;
    const completed = empTasks.filter((t) => {
      const s = (t.status || '').toLowerCase();
      return s === 'done' || s.includes('concl') || s.includes('finaliz') || s.includes('postad');
    }).length;
    return Math.round((completed / empTasks.length) * 100);
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
            <Button
              id="btn-cadastrar-funcionario"
              variant="primary"
              size="md"
              onClick={() => setIsNewEmployeeModalOpen(true)}
              leftIcon={<Plus className="w-4 h-4 stroke-[3]" />}
              className="px-5 py-2.5 shadow-lg shadow-[#E4007E]/25 text-sm font-black"
            >
              Novo Funcionário
            </Button>
          ) : (
            <Button
              id="btn-cadastrar-cliente"
              variant="primary"
              size="md"
              onClick={() => setIsNewProjectModalOpen(true)}
              leftIcon={<Plus className="w-4 h-4 stroke-[3]" />}
              className="px-5 py-2.5 shadow-lg shadow-[#E4007E]/25 text-sm font-black"
            >
              Novo Cliente
            </Button>
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
        <div className="w-full sm:w-80">
          <Input
            type="text"
            placeholder={activeSubTab === 'employees' ? 'Buscar funcionário, cargo ou tag...' : 'Buscar cliente...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
            className="!bg-[#181818] !border-[#2A2A2A] focus:!border-[#E4007E] py-2 text-xs sm:text-sm font-medium"
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
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsNewEmployeeModalOpen(true)}
                leftIcon={<Plus className="w-4 h-4" />}
                className="mt-4 px-4 py-2 font-bold shadow-md shadow-[#E4007E]/25 text-xs"
              >
                Cadastrar Agora
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredEmployees.map((emp, index) => {
                const efficiency = getEmployeeEfficiency(emp);
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
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingEmployee(emp);
                          }}
                          className="p-1.5 text-slate-400 hover:text-[#E4007E] rounded-lg hover:bg-[#262626]"
                          title="Editar Membro"
                          aria-label="Editar Membro"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`Deseja realmente excluir ${emp.name}?`)) {
                              deleteEmployee(emp.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10"
                          title="Excluir Membro"
                          aria-label="Excluir Membro"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Card Body: Centered Avatar, Name, Email, Productivity */}
                    <div className="p-6 pt-7 flex flex-col items-center text-center">
                      {/* Avatar with Ring & Status Dot */}
                      <div className="relative mb-3.5">
                        <div className={`p-1 rounded-full ring-2 ${borderRing} transition-transform group-hover:scale-105 duration-300`}>
                          <Avatar
                            src={emp.avatarUrl}
                            name={emp.name}
                            alt={emp.name}
                            size="xl"
                            status={getStatusDot(emp.status)}
                            className="!w-16 !h-16 shadow-md [&>div]:bg-[#222222] [&>div]:text-[#E4007E] [&>div]:border [&>div]:border-[#303030] [&>div]:text-lg [&>div]:font-black"
                          />
                        </div>
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
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsNewProjectModalOpen(true)}
                leftIcon={<Plus className="w-4 h-4" />}
                className="mt-4 px-4 py-2 font-bold text-xs"
              >
                Cadastrar Agora
              </Button>
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
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingProject(proj)}
                            className="p-1.5 text-white hover:text-[#FFBA00] rounded-lg hover:bg-slate-800"
                            title="Editar cliente"
                            aria-label="Editar cliente"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (window.confirm(`Deseja realmente excluir o cliente ${proj.name}?`)) {
                                deleteProject(proj.id);
                              }
                            }}
                            className="p-1.5 text-white hover:text-rose-400 rounded-lg hover:bg-rose-500/10"
                            title="Excluir cliente"
                            aria-label="Excluir cliente"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
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
                            return (
                              <Avatar
                                key={emp.id}
                                src={emp.avatarUrl}
                                name={emp.name}
                                alt={emp.name}
                                size="sm"
                                className="!w-7 !h-7 ring-2 ring-[#011C39]"
                                title={emp.name}
                              />
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
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTagModalEmployee(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Tags Atuais */}
            <div className="mt-4">
              <label className="block text-xs font-bold text-slate-400 mb-2">
                Etiquetas Atuais:
              </label>
              <div className="flex flex-wrap gap-2 min-h-10 p-3 bg-[#011427] rounded-xl border border-slate-800">
                {tagModalEmployee.tags && tagModalEmployee.tags.length > 0 ? (
                  tagModalEmployee.tags.map((tag) => (
                    <Badge
                      key={tag}
                      size="sm"
                      className="bg-indigo-950 text-indigo-300 border-indigo-800 font-bold uppercase tracking-wider inline-flex items-center gap-1.5 px-3 py-1 rounded-lg"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTagFromEmployee(tagModalEmployee, tag)}
                        className="hover:text-rose-400 cursor-pointer"
                        title="Remover tag"
                        aria-label={`Remover tag ${tag}`}
                      >
                        <X className="w-3 h-3 stroke-[3]" />
                      </button>
                    </Badge>
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
                <Input
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
                  className="flex-1 py-2 text-xs text-white uppercase placeholder-slate-500 font-bold !bg-[#222222] !border-[#2A2A2A] focus:!border-[#E4007E]"
                />
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleAddTagToEmployee(tagModalEmployee)}
                  className="px-4 py-2.5 text-xs font-black shrink-0"
                >
                  Adicionar
                </Button>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#2A2A2A] flex justify-end">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setTagModalEmployee(null)}
                className="px-4 py-2 text-white text-xs font-bold bg-[#222222] hover:bg-[#2A2A2A]"
              >
                Concluir
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
