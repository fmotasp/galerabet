import React, { useState } from 'react';
import {
  Plus,
  Rocket,
  Flower2,
  BarChart3,
  ShieldCheck,
  Zap,
  Box,
  MoreHorizontal,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  Search,
  Filter,
} from 'lucide-react';
import { useApp, useProjects, useEmployees, useTasks } from '../../context/AppContext';
import { Project } from '../../types';
import { isTaskCompleted } from '../../lib/taskDateUtils';

export const ProjectsView: React.FC = () => {
  const { projects, deleteProject } = useProjects();
  const { employees } = useEmployees();
  const { tasks } = useTasks();
  const {
    setIsNewProjectModalOpen,
    setSelectedProjectForDetail,
    setEditingProject,
    setActiveTab,
  } = useApp();

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

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

  const getStatusBadge = (status: Project['status']) => {
    switch (status) {
      case 'active':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#E0E7FF] text-[#4F46E5]">
            Active
          </span>
        );
      case 'planning':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#F3E8FF] text-[#9333EA]">
            Planning
          </span>
        );
      case 'at_risk':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#FFE4E6] text-[#E11D48]">
            At Risk
          </span>
        );
      case 'completed':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#DCFCE7] text-[#16A34A]">
            Completed
          </span>
        );
      case 'on_hold':
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
            On Hold
          </span>
        );
    }
  };

  // Filter out mockup projects - display only real registered projects
  const filteredProjects = projects
    .filter((project) => !['proj-orion', 'proj-bloom', 'proj-nexus', 'proj-pulse', 'proj-shield', 'proj-aurora', 'proj-apex'].includes(project.id))
    .filter((project) => {
      const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
      const matchesSearch =
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Projetos</h1>
          <p className="text-sm text-slate-400 mt-1">Visão geral de iniciativas ativas e sprints.</p>
        </div>

        <button
          id="btn-new-project"
          onClick={() => setIsNewProjectModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#E4007E] to-[#E94E18] hover:opacity-95 text-white rounded-xl text-sm font-bold shadow-md shadow-[#E4007E]/25 transition-all active:scale-98"
        >
          <Plus className="w-4 h-4 text-white stroke-[2.5]" />
          <span>Novo Projeto</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto pb-1 sm:pb-0">
          {/* Mobile Dropdown */}
          <div className="relative w-full sm:hidden">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none w-full bg-[#222222] border border-slate-700/80 text-white text-xs font-bold py-2.5 pl-4 pr-8 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors"
            >
              {['all', 'active', 'planning', 'at_risk', 'completed'].map((status) => (
                <option key={status} value={status}>
                  {status === 'at_risk' ? 'At Risk' : status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Desktop Buttons */}
          <div className="hidden sm:flex items-center gap-2">
            {['all', 'active', 'planning', 'at_risk', 'completed'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold capitalize whitespace-nowrap transition-all border ${
                  statusFilter === status
                    ? 'bg-[#E4007E] text-white border-[#E4007E] shadow-sm'
                    : 'bg-[#222222] text-slate-400 border-[#303030] hover:text-white hover:border-slate-500'
                }`}
              >
                {status === 'at_risk' ? 'At Risk' : status}
              </button>
            ))}
          </div>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar projetos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#222222] border border-[#303030] rounded-2xl text-xs focus:outline-none focus:border-[#E4007E] text-white placeholder-slate-400 font-semibold shadow-inner transition-colors"
          />
        </div>
      </div>

      {/* Projects Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-[#181818] rounded-3xl border border-white/5 p-8 shadow-xl">
            <Box className="w-12 h-12 text-slate-600 mx-auto mb-3 opacity-20" />
            <h3 className="text-base font-bold text-white">Nenhum projeto encontrado</h3>
            <p className="text-xs text-slate-400 mt-1">
              Tente ajustar os filtros ou crie um novo projeto.
            </p>
            <button
              onClick={() => {
                setStatusFilter('all');
                setSearchQuery('');
              }}
              className="mt-4 text-xs font-bold text-[#E4007E] hover:underline"
            >
              Limpar filtros
            </button>
          </div>
        ) : (
          filteredProjects.map((project) => {
            // Associated team members
            const teamMembers = employees.filter((e) =>
              project.teamMemberIds.includes(e.id)
            );
            const projectTasks = tasks.filter((t) => t.projectId === project.id);
            const completedCount = projectTasks.filter((t) => isTaskCompleted(t)).length;

            return (
              <div
                key={project.id}
                id={`project-card-${project.id}`}
                onClick={() => setSelectedProjectForDetail(project)}
                className="group bg-[#181818] rounded-3xl p-6 border border-white/5 shadow-xl hover:shadow-2xl hover:border-[#E4007E]/40 hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col justify-between relative overflow-hidden"
              >
                <div>
                  {/* Top row: Icon + Title + Status */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shrink-0 ${
                          project.iconColor || 'bg-blue-600'
                        }`}
                      >
                        {getProjectIcon(project.iconType)}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-white text-lg group-hover:text-[#E4007E] transition-colors leading-tight">
                          {project.name}
                        </h3>
                        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">{project.category}</p>
                      </div>
                    </div>

                    <div>{getStatusBadge(project.status)}</div>
                  </div>

                  {/* Description snippet */}
                  <p className="text-xs text-slate-400 line-clamp-2 mb-6 leading-relaxed font-medium">
                    {project.description}
                  </p>
                </div>

                <div>
                  {/* Progress section */}
                  <div className="space-y-2 mb-6">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-400">Progresso</span>
                      <span className="text-white">{project.progress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#101010] rounded-full overflow-hidden border border-white/5">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          project.status === 'at_risk'
                            ? 'bg-rose-500'
                            : 'bg-[#E4007E]'
                        }`}
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Bottom Row: Team Avatars + Sprint Name */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    {/* Team Avatars */}
                    <div className="flex items-center -space-x-2">
                      {teamMembers.slice(0, 3).map((member) => (
                        <div key={member.id} className="relative" title={member.name}>
                          {member.avatarUrl ? (
                            <img
                              src={member.avatarUrl}
                              alt={member.name}
                              className="w-7 h-7 rounded-full object-cover ring-2 ring-[#181818]"
                            />
                          ) : (
                            <div
                              className="w-7 h-7 rounded-full bg-[#101010] text-white font-bold text-[9px] flex items-center justify-center ring-2 ring-[#181818] border border-white/10"
                            >
                              {member.initials}
                            </div>
                          )}
                        </div>
                      ))}
                      {teamMembers.length > 3 && (
                        <div className="w-7 h-7 rounded-full bg-[#101010] text-slate-400 font-bold text-[9px] flex items-center justify-center ring-2 ring-[#181818] border border-white/10">
                          +{teamMembers.length - 3}
                        </div>
                      )}
                    </div>

                    {/* Sprint tag */}
                    <div className="text-right">
                      <span className="text-[9px] font-bold text-slate-500 block tracking-wider uppercase">
                        Sprint
                      </span>
                      <span className="text-xs font-bold text-slate-300">
                        {project.currentSprint}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
