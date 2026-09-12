import React, { useState } from 'react';
import { Task } from '../../types';
import { useEmployees } from '../../context/EmployeesContext';
import { Avatar } from '../ui/Avatar';

export interface TaskMembersStackProps {
  task: Task;
}

export const TaskMembersStack: React.FC<TaskMembersStackProps> = ({ task }) => {
  const [expanded, setExpanded] = useState(false);
  const { employees } = useEmployees();

  const rawList =
    task.members && task.members.length > 0
      ? task.members
      : task.assigneeId && task.assigneeId !== 'unassigned' && task.assigneeName !== 'Sem membro'
      ? [
          {
            id: task.assigneeId,
            name: task.assigneeName,
            initials: task.assigneeInitials,
          },
        ]
      : [];

  const membersList = rawList
    .filter(
      (m) =>
        m &&
        m.id !== 'unassigned' &&
        m.name !== 'Sem membro' &&
        m.initials !== 'SM' &&
        m.name?.trim().length > 0
    )
    .map((m) => {
      // Procura o colaborador cadastrado no sistema para obter a foto de avatar mais atualizada
      const matchedEmp = employees.find(
        (emp) =>
          (m.id && emp.id && emp.id === m.id) ||
          (m.name && emp.name && emp.name.toLowerCase().trim() === m.name.toLowerCase().trim())
      );

      const resolvedAvatar = matchedEmp?.avatarUrl || m.avatarUrl || '';

      return {
        ...m,
        avatarUrl: resolvedAvatar,
        name: m.name || matchedEmp?.name || 'Membro',
        initials: m.initials || matchedEmp?.initials || 'MB',
      };
    });

  if (membersList.length === 0) {
    return null;
  }

  return (
    <div className="relative inline-block">
      <div
        onClick={(e) => {
          e.stopPropagation();
          setExpanded(!expanded);
        }}
        className="flex items-center -space-x-2 cursor-pointer group/stack"
        title="Clique para expandir membros"
      >
        {membersList.map((m, idx) => (
          <div
            key={m.id || idx}
            style={{ zIndex: membersList.length - idx }}
            className="transition-transform group-hover/stack:scale-105"
            title={m.name}
          >
            <Avatar
              src={m.avatarUrl}
              name={m.name}
              alt={m.name}
              size="sm"
              ring
              className="!w-7 !h-7 ring-2 ring-[#101010] shadow-sm text-[10px] font-black"
            />
          </div>
        ))}
      </div>

      {expanded && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute left-0 bottom-full mb-2 w-56 bg-[#181818] rounded-2xl shadow-2xl border border-[#303030] p-3 z-30 animate-in fade-in zoom-in-95 duration-150 text-white"
        >
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 pb-2 mb-2 border-b border-slate-800">
            <span>Membros ({membersList.length})</span>
            <button
              onClick={() => setExpanded(false)}
              className="text-slate-400 hover:text-white p-0.5"
            >
              ✕
            </button>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {membersList.map((m, idx) => (
              <div key={m.id || idx} className="flex items-center gap-2.5">
                <Avatar
                  src={m.avatarUrl}
                  name={m.name}
                  alt={m.name}
                  size="xs"
                  className="!w-6 !h-6 shadow-xs shrink-0"
                />
                <span className="text-xs font-bold text-white truncate">
                  {m.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
