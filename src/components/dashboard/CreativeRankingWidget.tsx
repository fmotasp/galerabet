import React, { useState, useMemo } from 'react';
import {
  Trophy,
  Crown,
  Sparkles,
  Flame,
  CheckCircle2,
  ChevronDown,
} from 'lucide-react';
import { Employee, Task } from '../../types';
import { isTaskCompleted, parseTaskDueDate } from '../../lib/taskDateUtils';

interface CreativeRankingWidgetProps {
  employees: Employee[];
  tasks: Task[];
  onSelectEmployee?: (emp: Employee) => void;
}

export const CreativeRankingWidget: React.FC<CreativeRankingWidgetProps> = ({
  employees,
  tasks,
  onSelectEmployee,
}) => {
  const [selectedRole, setSelectedRole] = useState<'all' | 'designer' | 'videomaker'>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<'all' | 'month' | '7d'>('all');
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Filtra as tarefas de acordo com o período selecionado
  const filteredTasks = useMemo(() => {
    if (selectedPeriod === 'all') return tasks;
    const now = new Date();

    return tasks.filter((t) => {
      const dateObj =
        parseTaskDueDate(t.dueDate) ||
        parseTaskDueDate(t.createdAt) ||
        (t.createdAt ? new Date(t.createdAt) : null);

      if (!dateObj || isNaN(dateObj.getTime())) return true;

      if (selectedPeriod === '7d') {
        const diffDays = (now.getTime() - dateObj.getTime()) / (1000 * 3600 * 24);
        return diffDays >= 0 && diffDays <= 7;
      }
      if (selectedPeriod === 'month') {
        return (
          dateObj.getMonth() === now.getMonth() &&
          dateObj.getFullYear() === now.getFullYear()
        );
      }
      return true;
    });
  }, [tasks, selectedPeriod]);

  // Filtra colaboradores exclusivos de criação (Designers e Video Makers)
  const rankingList = useMemo(() => {
    return employees
      .filter((emp) => {
        const role = (emp.role || '').toLowerCase();
        const dept = (emp.department || '').toLowerCase();
        const tags = (emp.tags || []).map((t) => t.toLowerCase());

        const isDesigner =
          role.includes('design') ||
          dept.includes('design') ||
          tags.some((t) => t.includes('design'));

        const isVideoMaker =
          role.includes('video') ||
          role.includes('maker') ||
          role.includes('motion') ||
          role.includes('audiovisual') ||
          role.includes('edição') ||
          dept.includes('audiovisual') ||
          dept.includes('video') ||
          tags.some((t) => t.includes('video') || t.includes('maker') || t.includes('motion'));

        if (!isDesigner && !isVideoMaker) return false;

        if (selectedRole === 'designer') return isDesigner;
        if (selectedRole === 'videomaker') return isVideoMaker;

        return true;
      })
      .map((emp) => {
        const empId = emp.id.toLowerCase().trim();
        const empFullName = emp.name.toLowerCase().trim();
        const empFirstName = empFullName.split(' ')[0].trim();
        const empEmailPrefix = (emp.email || '').split('@')[0].toLowerCase().trim();

        // Identifica demandas deste colaborador
        const empTasks = filteredTasks.filter((task) => {
          if (task.assigneeId && (task.assigneeId === emp.id || task.assigneeId.toLowerCase().trim() === empId)) {
            return true;
          }
          if (task.assigneeName) {
            const aName = task.assigneeName.toLowerCase().trim();
            if (aName === empFullName) {
              return true;
            }
          }
          if (task.members && task.members.length > 0) {
            const isMember = task.members.some((m) => {
              if (!m) return false;
              const mId = (m.id || '').toLowerCase().trim();
              const mName = (m.name || '').toLowerCase().trim();
              return mId === empId || mName === empFullName;
            });
            if (isMember) return true;
          }

          return false;
        });

        // Contabiliza tarefas concluídas E tarefas que estão em aprovação/entregues
        const isTaskDoneOrInReview = (t: Task): boolean => {
          const s = (t.status || '').toLowerCase().trim();
          return (
            isTaskCompleted(t) ||
            s === 'in_review' ||
            s === 'postar' ||
            s.includes('aprov') ||
            s.includes('revis') ||
            Boolean(t.deliveredAt)
          );
        };

        const total = empTasks.length;
        const completed = empTasks.filter(isTaskDoneOrInReview).length;

        const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

        return {
          employee: emp,
          total,
          completed,
          rate,
        };
      })
      .sort((a, b) => {
        if (b.completed !== a.completed) {
          return b.completed - a.completed;
        }
        if (b.rate !== a.rate) {
          return b.rate - a.rate;
        }
        return b.total - a.total;
      });
  }, [employees, filteredTasks, selectedRole]);

  // Top 3 Colaboradores para o Pódio
  const top1 = rankingList[0] || null;
  const top2 = rankingList[1] || null;
  const top3 = rankingList[2] || null;
  const others = rankingList.slice(3);
  const visibleOthers = isExpanded ? others : others.slice(0, 3);

  return (
    <div className="bg-[#141414] rounded-2xl p-6 shadow-lg space-y-6 relative overflow-hidden">
      {/* Glows de ambientação nas cores da RioSãoPaulo */}
      <div className="absolute -top-20 -left-20 w-60 h-60 bg-[#E4007E]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-[#E94E18]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header com Título e Filtros */}
      <div className="space-y-3 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#E4007E] to-[#E94E18] flex items-center justify-center text-white shadow-md shadow-[#E4007E]/20 shrink-0">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-xl tracking-tight flex items-center gap-1.5">
                <span>Ranking Criativo</span>
                <Sparkles className="w-4 h-4 text-[#FFB903]" />
                <span 
                  className="ml-1 flex items-center justify-center w-4 h-4 rounded-full bg-white/10 text-slate-300 text-[10px] cursor-help"
                  title="O ranking contabiliza as tarefas em que o criativo é o responsável. A taxa (%) representa a proporção de tarefas concluídas/entregues sobre o total de demandas atribuídas no período."
                >
                  ?
                </span>
              </h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Top produtividade de Design & Vídeo
              </p>
            </div>
          </div>
        </div>

        {/* Filtros rápidos compactos */}
        <div className="flex items-center justify-between gap-1.5 flex-wrap pt-1">
          {/* Cargo */}
          <div className="flex items-center bg-[#121212] p-0.5 rounded-lg border border-[#262626]">
            <button
              type="button"
              onClick={() => setSelectedRole('all')}
              className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                selectedRole === 'all'
                  ? 'bg-gradient-to-r from-[#E4007E] to-[#E94E18] text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => setSelectedRole('designer')}
              className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                selectedRole === 'designer'
                  ? 'bg-gradient-to-r from-[#E4007E] to-[#E94E18] text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Designers
            </button>
            <button
              type="button"
              onClick={() => setSelectedRole('videomaker')}
              className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                selectedRole === 'videomaker'
                  ? 'bg-gradient-to-r from-[#E4007E] to-[#E94E18] text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Vídeos
            </button>
          </div>

          {/* Período */}
          <div className="flex items-center bg-[#121212] p-0.5 rounded-lg border border-[#262626]">
            <button
              type="button"
              onClick={() => setSelectedPeriod('all')}
              className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                selectedPeriod === 'all' ? 'bg-[#2E2E2E] text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Geral
            </button>
            <button
              type="button"
              onClick={() => setSelectedPeriod('month')}
              className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                selectedPeriod === 'month' ? 'bg-[#2E2E2E] text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Mês
            </button>
            <button
              type="button"
              onClick={() => setSelectedPeriod('7d')}
              className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                selectedPeriod === '7d' ? 'bg-[#2E2E2E] text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              7d
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🏆 PODIUM COMPACTO DOS TOP 3                                              */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-3 gap-2.5 items-end pt-5 pb-1 relative z-10">
        {/* TOP 2 (PRATA 🥈) */}
        <div className="flex flex-col items-center text-center">
          {top2 ? (
            <div
              onClick={() => onSelectEmployee && onSelectEmployee(top2.employee)}
              className="w-full bg-[#141414] border border-slate-700/60 hover:border-slate-400/80 rounded-2xl p-2.5 shadow-md transition-all hover:-translate-y-1 cursor-pointer flex flex-col items-center"
            >
              <div className="relative mb-2 flex items-center justify-center">
                <div className="w-13 h-13 rounded-full p-0.5 ring-2 ring-slate-300/60 bg-gradient-to-b from-slate-200 to-slate-500 shadow flex items-center justify-center">
                  {top2.employee.avatarUrl ? (
                    <img
                      src={top2.employee.avatarUrl}
                      alt={top2.employee.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-[#141414] text-slate-200 font-semibold text-xs flex items-center justify-center">
                      {top2.employee.initials || top2.employee.name.slice(0, 2)}
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-2 px-1.5 py-0.2 rounded-full bg-slate-300 text-slate-900 font-bold text-[10px] shadow uppercase">
                  TOP 2
                </div>
              </div>

              <h4 className="font-extrabold text-white text-xs mt-1.5 truncate max-w-[90px]">
                {top2.employee.name.split(' ')[0]}
              </h4>
              <span className="text-xs text-slate-400 truncate max-w-[85px] block">
                {top2.employee.role?.split(' ')[0] || 'Criativo'}
              </span>

              <div className="mt-2 pt-1.5 border-t border-white/5 w-full">
                <div className="text-xs font-semibold text-white">
                  {top2.completed} <span className="font-medium text-slate-400 text-[10px]">feitas</span>
                </div>
                <div className="text-xs text-emerald-400 font-bold">
                  {top2.rate}%
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full h-32 bg-[#141414] rounded-2xl flex items-center justify-center text-xs text-slate-500">
              -
            </div>
          )}
        </div>

        {/* TOP 1 (OURO 👑 - MAIOR/CENTRO) */}
        <div className="flex flex-col items-center text-center">
          {top1 ? (
            <div
              onClick={() => onSelectEmployee && onSelectEmployee(top1.employee)}
              className="w-full bg-gradient-to-b from-[#221A0F] to-[#141414] border-2 border-[#FFB903]/80 hover:border-[#FFB903] rounded-2xl p-3 shadow-xl shadow-[#FFB903]/10 transition-all hover:-translate-y-1.5 cursor-pointer relative flex flex-col items-center scale-105"
            >
              {/* Coroa Dourada Flutuante */}
              <div className="absolute -top-4 text-[#FFB903] animate-bounce">
                <Crown className="w-6 h-6 fill-[#FFB903] drop-shadow-[0_2px_8px_rgba(255,185,3,0.6)]" />
              </div>

              <div className="relative mb-2 mt-1 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full p-1 ring-2 ring-[#FFB903] bg-gradient-to-tr from-[#FFB903] via-[#FFE082] to-[#E94E18] shadow-lg shadow-[#FFB903]/30 flex items-center justify-center">
                  {top1.employee.avatarUrl ? (
                    <img
                      src={top1.employee.avatarUrl}
                      alt={top1.employee.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-[#141414] text-[#FFB903] font-semibold text-sm flex items-center justify-center">
                      {top1.employee.initials || top1.employee.name.slice(0, 2)}
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-2.5 px-2 py-0.5 rounded-full bg-[#FFB903] text-slate-950 font-bold text-[10px] shadow uppercase flex items-center gap-0.5">
                  <Flame className="w-3 h-3 fill-slate-950" />
                  <span>TOP 1</span>
                </div>
              </div>

              <h4 className="font-bold text-white text-sm mt-2 truncate max-w-[100px]">
                {top1.employee.name.split(' ')[0]}
              </h4>
              <span className="text-xs text-[#FFE082] font-semibold truncate max-w-[95px] block">
                {top1.employee.role?.split(' ')[0] || 'Líder'}
              </span>

              <div className="mt-2 pt-1.5 border-t border-[#FFB903]/20 w-full">
                <div className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FFB903] to-[#E94E18]">
                  {top1.completed} <span className="font-bold text-slate-300 text-[10px]">feitas</span>
                </div>
                <div className="text-xs text-emerald-400 font-extrabold mt-0.5">
                  {top1.rate}%
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full h-36 bg-[#141414] rounded-2xl flex items-center justify-center text-xs text-slate-500">
              -
            </div>
          )}
        </div>

        {/* TOP 3 (BRONZE 🥉) */}
        <div className="flex flex-col items-center text-center">
          {top3 ? (
            <div
              onClick={() => onSelectEmployee && onSelectEmployee(top3.employee)}
              className="w-full bg-[#141414] border border-[#CD7F32]/50 hover:border-[#CD7F32]/80 rounded-2xl p-2.5 shadow-md transition-all hover:-translate-y-1 cursor-pointer flex flex-col items-center"
            >
              <div className="relative mb-2 flex items-center justify-center">
                <div className="w-13 h-13 rounded-full p-0.5 ring-2 ring-[#CD7F32]/70 bg-gradient-to-b from-[#CD7F32] to-[#8C4A1E] shadow flex items-center justify-center">
                  {top3.employee.avatarUrl ? (
                    <img
                      src={top3.employee.avatarUrl}
                      alt={top3.employee.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-[#141414] text-[#CD7F32] font-semibold text-xs flex items-center justify-center">
                      {top3.employee.initials || top3.employee.name.slice(0, 2)}
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-2 px-1.5 py-0.2 rounded-full bg-[#CD7F32] text-white font-bold text-[10px] shadow uppercase">
                  TOP 3
                </div>
              </div>

              <h4 className="font-extrabold text-white text-xs mt-1.5 truncate max-w-[90px]">
                {top3.employee.name.split(' ')[0]}
              </h4>
              <span className="text-xs text-slate-400 truncate max-w-[85px] block">
                {top3.employee.role?.split(' ')[0] || 'Criativo'}
              </span>

              <div className="mt-2 pt-1.5 border-t border-white/5 w-full">
                <div className="text-xs font-semibold text-white">
                  {top3.completed} <span className="font-medium text-slate-400 text-[10px]">feitas</span>
                </div>
                <div className="text-xs text-emerald-400 font-bold">
                  {top3.rate}%
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full h-32 bg-[#141414] rounded-2xl flex items-center justify-center text-xs text-slate-500">
              -
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 📋 LISTA DO 4º LUGAR EM DIANTE                                            */}
      {/* ========================================================================= */}
      {others.length > 0 && (
        <div className="pt-3 border-t border-[#262626] relative z-10 space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Classificação ({rankingList.length})
            </span>
          </div>

          <div className="space-y-1">
            {visibleOthers.map((item, idx) => {
              const rankPos = idx + 4;

              return (
                <div
                  key={item.employee.id}
                  onClick={() => onSelectEmployee && onSelectEmployee(item.employee)}
                  className="flex items-center justify-between py-2.5 px-3 -mx-3 rounded-xl hover:bg-white/[0.03] transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <span className="w-6 text-slate-400 font-bold text-xs flex items-center justify-center shrink-0">
                      #{rankPos}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-[#262626] overflow-hidden shrink-0 flex items-center justify-center font-bold text-[10px] text-[#E4007E]">
                      {item.employee.avatarUrl ? (
                        <img
                          src={item.employee.avatarUrl}
                          alt={item.employee.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        item.employee.initials || item.employee.name.slice(0, 2)
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-white text-sm truncate max-w-[120px] group-hover:text-[#E4007E] transition-colors">
                        {item.employee.name}
                      </div>
                      <div className="text-xs text-slate-400 truncate max-w-[110px]">
                        {item.employee.role || 'Criativo'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 pr-1">
                    <span className="text-slate-300 font-medium text-xs">
                      {item.completed} entregas
                    </span>
                    <span className="text-xs font-bold text-emerald-400 w-8 text-right">
                      {item.rate}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Botão Ver Mais / Ver Menos no Ranking */}
          {others.length > 3 && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full py-1.5 text-center text-xs font-bold text-[#E4007E] hover:text-pink-400 transition-colors flex items-center justify-center gap-1 cursor-pointer pt-1"
            >
              <span>{isExpanded ? 'Mostrar menos' : `Ver mais (+${others.length - 3})`}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
