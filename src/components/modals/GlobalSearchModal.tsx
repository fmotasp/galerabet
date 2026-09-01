import React, { useState, useEffect } from 'react';
import { Search, X, CheckSquare, Folder, Users, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const GlobalSearchModal: React.FC = () => {
  const {
    isSearchModalOpen,
    setIsSearchModalOpen,
    tasks,
    projects,
    employees,
    setEditingTask,
    setSelectedProjectForDetail,
    setSelectedEmployeeForDetail,
    setActiveTab,
  } = useApp();

  const [query, setQuery] = useState('');

  // Keyboard shortcut listener (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchModalOpen(true);
      }
      if (e.key === 'Escape') {
        setIsSearchModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIsSearchModalOpen]);

  if (!isSearchModalOpen) return null;

  const filteredTasks = tasks.filter(
    (t) =>
      t.title.toLowerCase().includes(query.toLowerCase()) ||
      t.category.toLowerCase().includes(query.toLowerCase())
  );

  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.category.toLowerCase().includes(query.toLowerCase())
  );

  const filteredEmployees = employees.filter(
    (e) =>
      e.name.toLowerCase().includes(query.toLowerCase()) ||
      e.role.toLowerCase().includes(query.toLowerCase()) ||
      e.department.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4">
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={() => setIsSearchModalOpen(false)}
      />
      <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-200/80 max-w-2xl w-full p-6 z-10 animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <Search className="w-5 h-5 text-indigo-600 shrink-0" />
          <input
            autoFocus
            type="text"
            placeholder="Type to search tasks, initiatives, or personnel..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full text-base font-medium placeholder:text-slate-400 focus:outline-none"
          />
          <button
            onClick={() => setIsSearchModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 text-xs"
          >
            ESC
          </button>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto mt-4 space-y-4 pr-1">
          {/* Tasks results */}
          {filteredTasks.length > 0 && (
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Tasks ({filteredTasks.length})
              </div>
              <div className="space-y-1">
                {filteredTasks.slice(0, 4).map((t) => (
                  <div
                    key={t.id}
                    onClick={() => {
                      setIsSearchModalOpen(false);
                      setEditingTask(t);
                    }}
                    className="p-2.5 rounded-xl hover:bg-indigo-50/40 flex items-center justify-between text-xs cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <CheckSquare className="w-4 h-4 text-indigo-500" />
                      <span className="font-semibold text-slate-800 group-hover:text-indigo-600">
                        {t.title}
                      </span>
                    </div>
                    <span className="text-slate-400 font-medium">{t.projectName}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Projects results */}
          {filteredProjects.length > 0 && (
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Projects ({filteredProjects.length})
              </div>
              <div className="space-y-1">
                {filteredProjects.slice(0, 3).map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      setIsSearchModalOpen(false);
                      setSelectedProjectForDetail(p);
                    }}
                    className="p-2.5 rounded-xl hover:bg-indigo-50/40 flex items-center justify-between text-xs cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <Folder className="w-4 h-4 text-indigo-500" />
                      <span className="font-semibold text-slate-800 group-hover:text-indigo-600">
                        {p.name}
                      </span>
                    </div>
                    <span className="text-slate-400 font-medium">{p.currentSprint}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Employees results */}
          {filteredEmployees.length > 0 && (
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Team Members ({filteredEmployees.length})
              </div>
              <div className="space-y-1">
                {filteredEmployees.slice(0, 3).map((e) => (
                  <div
                    key={e.id}
                    onClick={() => {
                      setIsSearchModalOpen(false);
                      setSelectedEmployeeForDetail(e);
                    }}
                    className="p-2.5 rounded-xl hover:bg-indigo-50/40 flex items-center justify-between text-xs cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <Users className="w-4 h-4 text-indigo-500" />
                      <span className="font-semibold text-slate-800 group-hover:text-indigo-600">
                        {e.name}
                      </span>
                      <span className="text-slate-400">· {e.role}</span>
                    </div>
                    <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                      {e.department}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {filteredTasks.length === 0 &&
            filteredProjects.length === 0 &&
            filteredEmployees.length === 0 && (
              <div className="py-12 text-center text-xs text-slate-400">
                No matching results found for "{query}".
              </div>
            )}
        </div>
      </div>
    </div>
  );
};
