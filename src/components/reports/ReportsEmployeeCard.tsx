import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Task } from '../../types';
import { EmployeeProductivityStat } from './reportsUtils';
import { ReportsEmployeeTaskList } from './ReportsEmployeeTaskList';

interface ReportsEmployeeCardProps {
  stat: EmployeeProductivityStat;
  isExpanded: boolean;
  spineStatuses: { id: string; label: string }[];
  onToggleExpand: (id: string) => void;
  onTaskClick: (task: Task) => void;
}

export const ReportsEmployeeCard: React.FC<ReportsEmployeeCardProps> = React.memo(
  ({ stat, isExpanded, spineStatuses, onToggleExpand, onTaskClick }) => {
    return (
      <div className="bg-[#181818] border border-[#2A2A2A] hover:border-[#383838] transition-all rounded-3xl overflow-hidden shadow-xl">
        {/* Card Header & KPIs Principais */}
        <div
          onClick={() => onToggleExpand(stat.employee.id)}
          className="p-5 sm:p-6 cursor-pointer flex flex-col xl:flex-row xl:items-center justify-between gap-6 hover:bg-[#222222]/50 transition-colors"
        >
          {/* Perfil do Colaborador */}
          <div className="flex items-center gap-4 min-w-[240px]">
            {stat.employee.avatarUrl ? (
              <img
                src={stat.employee.avatarUrl}
                alt={stat.employee.name}
                className="w-14 h-14 rounded-2xl object-cover ring-2 ring-[#E4007E]/40 shrink-0 shadow-md"
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-[#222222] border border-[#303030] text-[#E4007E] font-black text-lg flex items-center justify-center shrink-0 shadow-md">
                {stat.employee.initials || stat.employee.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <h3 className="text-base font-black text-white tracking-tight flex items-center gap-2">
                <span>{stat.employee.name}</span>
              </h3>
              <span className="text-xs text-slate-400 font-semibold block mt-0.5">
                {stat.employee.role || 'Colaborador'}
              </span>
              {/* Badge de Status de Capacidade */}
              <div className="mt-2 flex items-center gap-2">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${stat.capacityStatus.badge}`}
                >
                  {stat.capacityStatus.label}
                </span>
              </div>
            </div>
          </div>

          {/* Grade de 7 Métricas Principais */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 xl:gap-4 flex-1">
            {/* 1. Recebidas */}
            <div className="bg-[#222222] border border-[#2E2E2E] p-3 rounded-2xl text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Recebidas
              </span>
              <span className="text-lg font-black text-white mt-1 block">
                {stat.receivedCount}
              </span>
            </div>

            {/* 2. Finalizadas */}
            <div className="bg-[#222222] border border-[#2E2E2E] p-3 rounded-2xl text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Finalizadas
              </span>
              <span className="text-lg font-black text-emerald-400 mt-1 block">
                {stat.finishedCount}
              </span>
            </div>

            {/* 3. Em Andamento */}
            <div className="bg-[#222222] border border-[#2E2E2E] p-3 rounded-2xl text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Em Andamento
              </span>
              <span className="text-lg font-black text-pink-400 mt-1 block">
                {stat.inProgressCount}
              </span>
            </div>

            {/* 4. Atrasadas */}
            <div className="bg-[#222222] border border-[#2E2E2E] p-3 rounded-2xl text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Atrasadas
              </span>
              <span
                className={`text-lg font-black mt-1 block ${
                  stat.overdueCount > 0 ? 'text-rose-400' : 'text-slate-400'
                }`}
              >
                {stat.overdueCount}
              </span>
            </div>

            {/* 5. Média Revisões */}
            <div className="bg-[#222222] border border-[#2E2E2E] p-3 rounded-2xl text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Média Revisões
              </span>
              <span className="text-lg font-black text-[#E94E18] mt-1 block">
                {stat.avgRevisions}
              </span>
            </div>

            {/* 6. Cumprimento de Prazo */}
            <div className="bg-[#222222] border border-[#2E2E2E] p-3 rounded-2xl text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Prazo (%)
              </span>
              <span
                className={`text-lg font-black mt-1 block ${
                  stat.onTimePercentage >= 90
                    ? 'text-emerald-400'
                    : stat.onTimePercentage >= 75
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }`}
              >
                {stat.onTimePercentage}%
              </span>
            </div>

            {/* 7. Capacidade Disponível */}
            <div className="bg-[#222222] border border-[#2E2E2E] p-3 rounded-2xl text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Disponível
              </span>
              <span className="text-lg font-black text-[#E4007E] mt-1 block">
                {stat.capacityAvailablePercentage}%
              </span>
            </div>
          </div>

          {/* Botão de Expansão */}
          <div className="flex items-center justify-end xl:justify-center">
            <div
              className={`w-9 h-9 rounded-xl bg-[#222222] border border-[#303030] flex items-center justify-center text-slate-300 transition-transform ${
                isExpanded ? 'rotate-90 text-[#E4007E]' : ''
              }`}
            >
              <ChevronRight className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Barra de Capacidade e Ocupação */}
        <div className="px-5 sm:px-6 py-3.5 bg-[#141414] border-t border-[#262626] flex items-center justify-between gap-4 text-xs">
          <span className="text-slate-400 font-medium">Status de Capacidade Operacional</span>

          {/* Barra de Progresso de Capacidade */}
          <div className="flex items-center gap-3 min-w-[260px] max-w-xs w-full">
            <span className="font-bold text-slate-400 shrink-0">Ocupação Atual:</span>
            <div className="flex-1 h-2.5 bg-[#262626] rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  stat.capacityUsedPercentage >= 90
                    ? 'bg-rose-500'
                    : stat.capacityUsedPercentage >= 65
                    ? 'bg-[#E94E18]'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${stat.capacityUsedPercentage}%` }}
              />
            </div>
            <span className="font-black text-white shrink-0">
              {stat.capacityUsedPercentage}%
            </span>
          </div>
        </div>

        {/* Listagem Expansível de Demandas do Colaborador */}
        {isExpanded && (
          <ReportsEmployeeTaskList
            tasks={stat.tasks}
            spineStatuses={spineStatuses}
            onTaskClick={onTaskClick}
          />
        )}
      </div>
    );
  }
);

ReportsEmployeeCard.displayName = 'ReportsEmployeeCard';
