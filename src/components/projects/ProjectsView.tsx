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
import { useApp } from '../../context/AppContext';
import { Project } from '../../types';

export const ProjectsView: React.FC = () => {
  const {
    projects,
    employees,
    tasks,
    setIsNewProjectModalOpen,
    setSelectedProjectForDetail,
    setEditingProject,
    deleteProject,
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

  // Filter out mockup projects - display only real imported Trello projects
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
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Projects</h1>
          <p className="text-sm text-slate-500 mt-1">Overview of active initiatives and sprints.</p>
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
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {['all', 'active', 'planning', 'at_risk', 'completed'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold capitalize whitespace-nowrap transition-all ${
                statusFilter === status
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
              }`}
            >
              {status === 'at_risk' ? 'At Risk' : status}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200/80 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Projects Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-slate-200/70 p-8">
            <p className="text-slate-500 font-medium">No projects found matching your query.</p>
            <button
              onClick={() => {
                setStatusFilter('all');
                setSearchQuery('');
              }}
              className="mt-3 text-xs text-indigo-600 font-bold hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          filteredProjects.map((project) => {
            // Associated team members
            const teamMembers = employees.filter((e) =>
              project.teamMemberIds.includes(e.id)
            );
            const projectTasks = tasks.filter((t) => t.projectId === project.id);
            const completedCount = projectTasks.filter((t) => t.status === 'done').length;

            return (
              <div
                key={project.id}
                id={`project-card-${project.id}`}
                onClick={() => setSelectedProjectForDetail(project)}
                className="group bg-white rounded-2xl p-6 border border-slate-200/70 shadow-xs hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  {/* Top row: Icon + Title + Status */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-xs shrink-0 ${
                          project.iconColor || 'bg-blue-600'
                        }`}
                      >
                        {getProjectIcon(project.iconType)}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-lg group-hover:text-indigo-600 transition-colors leading-tight">
                          {project.name}
                        </h3>
                        <p className="text-xs text-slate-500 font-medium">{project.category}</p>
                      </div>
                    </div>

                    <div>{getStatusBadge(project.status)}</div>
                  </div>

                  {/* Description snippet */}
                  <p className="text-xs text-slate-600 line-clamp-2 mb-6 leading-relaxed">
                    {project.description}
                  </p>
                </div>

                <div>
                  {/* Progress section */}
                  <div className="space-y-1.5 mb-6">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-500">Progress</span>
                      <span className="text-slate-900">{project.progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          project.status === 'at_risk'
                            ? 'bg-rose-500'
                            : 'bg-[#5D55F9]'
                        }`}
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Bottom Row: Team Avatars + Sprint Name */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    {/* Team Avatars */}
                    <div className="flex items-center -space-x-2">
                      {teamMembers.slice(0, 3).map((member) => (
                        <div key={member.id} className="relative" title={member.name}>
                          {member.avatarUrl ? (
                            <img
                              src={member.avatarUrl}
                              alt={member.name}
                              className="w-7 h-7 rounded-full object-cover ring-2 ring-white"
                            />
                          ) : (
                            <div
                              className="w-7 h-7 rounded-full bg-slate-800 text-white font-bold text-[10px] flex items-center justify-center ring-2 ring-white"
                            >
                              {member.initials}
                            </div>
                          )}
                        </div>
                      ))}
                      {teamMembers.length > 3 && (
                        <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px] flex items-center justify-center ring-2 ring-white">
                          +{teamMembers.length - 3}
                        </div>
                      )}
                    </div>

                    {/* Sprint tag */}
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 block tracking-wider uppercase">
                        Sprint
                      </span>
                      <span className="text-xs font-bold text-slate-800">
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
