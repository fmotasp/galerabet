import React, { useState } from 'react';
import { Task } from '../../types';

export interface TaskMembersStackProps {
  task: Task;
}

export const TaskMembersStack: React.FC<TaskMembersStackProps> = ({ task }) => {
  const [expanded, setExpanded] = useState(false);

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

  const membersList = rawList.filter(
    (m) =>
      m &&
      m.id !== 'unassigned' &&
      m.name !== 'Sem membro' &&
      m.initials !== 'SM' &&
      m.name?.trim().length > 0
  );

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
        className="flex items-center -space-x-1.5 cursor-pointer group/stack"
        title="Clique para expandir membros"
      >
        {membersList.map((m, idx) =>
          m.avatarUrl ? (
            <img
              key={m.id || idx}
              src={m.avatarUrl}
              alt={m.name}
              className="w-7 h-7 rounded-full object-cover ring-2 ring-[#E4007E]/50 shadow-sm transition-transform group-hover/stack:scale-105"
              style={{ zIndex: membersList.length - idx }}
            />
          ) : (
            <div
              key={m.id || idx}
              className="w-7 h-7 rounded-full bg-[#222222] border border-[#303030] ring-2 ring-[#181818] text-[#E4007E] font-black text-[10px] flex items-center justify-center shadow-sm transition-transform group-hover/stack:scale-105"
              style={{ zIndex: membersList.length - idx }}
            >
              {m.initials}
            </div>
          )
        )}
      </div>

      {expanded && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute left-0 bottom-full mb-2 w-52 bg-[#181818] rounded-2xl shadow-2xl border border-[#303030] p-3 z-30 animate-in fade-in zoom-in-95 duration-150 text-white"
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
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {membersList.map((m, idx) => (
              <div key={m.id || idx} className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[#011C39] border border-[#02376F] text-white font-black text-[10px] flex items-center justify-center shrink-0">
                  {m.initials}
                </div>
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
