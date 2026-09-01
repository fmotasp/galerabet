import React from 'react';
import { X, Mail, MapPin, CheckCircle2, AlertTriangle, Clock, Edit2, Plus } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const EmployeeDetailModal: React.FC = () => {
  const {
    selectedEmployeeForDetail,
    setSelectedEmployeeForDetail,
    setEditingEmployee,
    tasks,
    moveTaskStatus,
    setEditingTask,
    setIsNewTaskModalOpen,
  } = useApp();

  if (!selectedEmployeeForDetail) return null;

  const emp = selectedEmployeeForDetail;
  const isOverloaded = emp.currentWorkload > 100;
  
  // Filter assigned tasks to active demands (column of employee or active status, excluding done/approvals)
  const assignedTasks = tasks.filter((t) => {
    const s = (t.status || '').toLowerCase();
    const listName = (t.trelloListName || '').toLowerCase();
    const empFirstName = emp.name.toLowerCase().split(' ')[0];
    const empFullName = emp.name.toLowerCase();

    // Se a tarefa está em aprovação, concluída ou postada, não conta como ativa
    if (
      s === 'done' ||
      listName.includes('aprov') ||
      listName.includes('postar') ||
      listName.includes('postad') ||
      listName.includes('concl') ||
      listName.includes('finaliz')
    ) {
      return false;
    }

    // Se a tarefa está explicitamente na coluna do Trello com o nome deste usuário
    if (listName && (listName.includes(empFirstName) || (empFirstName === 'bismarques' && listName.includes('marques')) || (empFirstName === 'gerdson' && listName.includes('gerdeson')) || (empFirstName === 'dai' && listName.includes('daiane')))) {
      return true;
    }

    const isAssigned =
      t.assigneeId === emp.id ||
      (t.assigneeName && t.assigneeName.toLowerCase().includes(empFullName)) ||
      (t.members && t.members.some((m) => m.id === emp.id || m.name.toLowerCase().includes(empFullName)));

    if (!isAssigned) return false;

    const isStatusMatch =
      s === 'backlog' ||
      s === 'in_progress' ||
      s.includes('backlog') ||
      s.includes('novo') ||
      s.includes('pedido') ||
      s.includes('doing') ||
      s.includes('andamento') ||
      s.includes('progress');

    return isStatusMatch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={() => setSelectedEmployeeForDetail(null)}
      />
      <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-200/80 max-w-xl w-full p-6 sm:p-8 z-10 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between pb-5 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="relative">
              {emp.avatarUrl ? (
                <img
                  src={emp.avatarUrl}
                  alt={emp.name}
                  className="w-16 h-16 rounded-2xl object-cover ring-2 ring-indigo-50 shadow-sm"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-slate-800 text-white font-extrabold text-xl flex items-center justify-center shadow-sm">
                  {emp.initials}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">{emp.name}</h2>
                <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full uppercase">
                  {emp.department}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">{emp.role}</p>

              <div className="flex items-center gap-3 text-xs text-slate-400 mt-2">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" />
                  {emp.email}
                </span>
                {emp.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {emp.location}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                setSelectedEmployeeForDetail(null);
                setEditingEmployee(emp);
              }}
              className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100"
              title="Edit Profile"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSelectedEmployeeForDetail(null)}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Workload Indicator Box */}
        <div className="my-5 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-bold text-slate-700">Sprint Capacity & Workload</span>
            <div className="flex items-center gap-1 font-bold">
              {isOverloaded && <AlertTriangle className="w-4 h-4 text-rose-500" />}
              <span className={isOverloaded ? 'text-rose-600' : 'text-slate-900'}>
                {emp.currentWorkload}%
              </span>
            </div>
          </div>
          <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                isOverloaded ? 'bg-rose-500' : 'bg-[#5D55F9]'
              }`}
              style={{ width: `${Math.min(100, emp.currentWorkload)}%` }}
            />
          </div>
        </div>

        {/* Skills */}
        <div className="mb-6">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Skills & Specializations
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {emp.tags.map((tag, idx) => (
              <span
                key={idx}
                className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Assigned Tasks */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Assigned Tasks ({assignedTasks.length})
            </h4>
            <button
              onClick={() => {
                setSelectedEmployeeForDetail(null);
                setIsNewTaskModalOpen(true);
              }}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Assign Task</span>
            </button>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {assignedTasks.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                No active tasks currently assigned.
              </div>
            ) : (
              assignedTasks.map((t) => (
                <div
                  key={t.id}
                  onClick={() => {
                    setSelectedEmployeeForDetail(null);
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

                  <span className="text-slate-400 font-medium">{t.dueDate}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
