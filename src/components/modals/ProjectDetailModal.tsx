import React from 'react';
import { X, Edit2, Plus, CheckCircle2, Rocket, Flower2, BarChart3, ShieldCheck, Zap, Box } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Project } from '../../types';

export const ProjectDetailModal: React.FC = () => {
  const {
    selectedProjectForDetail,
    setSelectedProjectForDetail,
    setEditingProject,
    tasks,
    employees,
    moveTaskStatus,
    setEditingTask,
    setIsNewTaskModalOpen,
  } = useApp();

  if (!selectedProjectForDetail) return null;

  const project = selectedProjectForDetail;
  const projectTasks = tasks.filter((t) => t.projectId === project.id);
  const teamMembers = employees.filter((e) => project.teamMemberIds.includes(e.id));
  const completedCount = projectTasks.filter((t) => t.status === 'done').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={() => setSelectedProjectForDetail(null)}
      />
      <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-200/80 max-w-xl w-full p-6 sm:p-8 z-10 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between pb-5 border-b border-slate-100">
          <div className="flex items-center gap-4">
            {project.logoUrl ? (
              <img
                src={project.logoUrl}
                alt={project.name}
                className="w-14 h-14 object-contain shrink-0 drop-shadow-md"
              />
            ) : (
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm text-white ${
                  project.iconColor || 'bg-blue-600'
                }`}
              >
                {project.iconType === 'rocket' && <Rocket className="w-6 h-6" />}
                {project.iconType === 'flower' && <Flower2 className="w-6 h-6" />}
                {project.iconType === 'chart' && <BarChart3 className="w-6 h-6" />}
                {project.iconType === 'zap' && <Zap className="w-6 h-6" />}
                {project.iconType === 'shield' && <ShieldCheck className="w-6 h-6" />}
              </div>
            )}

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  {project.name}
                </h2>
                <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-full capitalize">
                  {project.status.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">{project.category}</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                setSelectedProjectForDetail(null);
                setEditingProject(project);
              }}
              className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100"
              title="Edit Project"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSelectedProjectForDetail(null)}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-600 my-4 leading-relaxed">{project.description}</p>

        {/* Progress Bar */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 mb-5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
            <span>Overall Progress</span>
            <span>{project.progress}%</span>
          </div>
          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#5D55F9] rounded-full transition-all"
              style={{ width: `${project.progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
            <span>Sprint: {project.currentSprint}</span>
            <span>
              {completedCount} of {projectTasks.length} tasks completed
            </span>
          </div>
        </div>

        {/* Team Members */}
        <div className="mb-5">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Assigned Team
          </h4>
          <div className="flex flex-wrap gap-2">
            {teamMembers.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 text-xs font-semibold text-slate-800"
              >
                <div className="w-5 h-5 rounded-full bg-slate-800 text-white font-bold text-[9px] flex items-center justify-center">
                  {m.initials}
                </div>
                <span>{m.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Project Tasks */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Project Deliverables ({projectTasks.length})
            </h4>
            <button
              onClick={() => {
                setSelectedProjectForDetail(null);
                setIsNewTaskModalOpen(true);
              }}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Task</span>
            </button>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {projectTasks.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                No tasks created for this project yet.
              </div>
            ) : (
              projectTasks.map((t) => (
                <div
                  key={t.id}
                  onClick={() => {
                    setSelectedProjectForDetail(null);
                    setEditingTask(t);
                  }}
                  className="p-3 bg-white border border-slate-200/80 hover:border-indigo-300 rounded-xl flex items-center justify-between text-xs cursor-pointer group hover:bg-indigo-50/20"
                >
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        moveTaskStatus(t.id, t.status === 'done' ? 'in_progress' : 'done');
                      }}
                      className="text-slate-400 hover:text-emerald-600"
                    >
                      <CheckCircle2
                        className={`w-4 h-4 ${
                          t.status === 'done' ? 'text-emerald-500 fill-emerald-100' : ''
                        }`}
                      />
                    </button>
                    <span
                      className={`font-semibold ${
                        t.status === 'done'
                          ? 'line-through text-slate-400'
                          : 'text-slate-800 group-hover:text-indigo-600'
                      }`}
                    >
                      {t.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">{t.assigneeInitials}</span>
                    <span className="text-[11px] font-bold bg-slate-100 px-2 py-0.5 rounded capitalize">
                      {t.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
