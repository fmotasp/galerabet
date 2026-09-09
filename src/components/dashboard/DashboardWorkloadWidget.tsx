import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Employee } from '../../types';
import { Avatar } from '../ui';
import { WorkloadMemberItem } from './dashboardUtils';

interface DashboardWorkloadWidgetProps {
  workloadMembers: WorkloadMemberItem[];
  totalBacklogCount: number;
  onSelectEmployee: (emp: Employee) => void;
}

export const DashboardWorkloadWidget: React.FC<DashboardWorkloadWidgetProps> = React.memo(
  ({ workloadMembers, totalBacklogCount, onSelectEmployee }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
      <div className="bg-[#181818] rounded-2xl p-6 border border-[#2A2A2A] shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white text-base">Carga de Trabalho da Equipe</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Capacidade ativa e sugestões de distribuição do Backlog
            </p>
          </div>
          {totalBacklogCount > 0 && (
            <span className="text-[10px] font-black bg-[#E4007E]/10 border border-[#E4007E]/30 text-[#E4007E] px-2.5 py-1 rounded-full animate-pulse shrink-0">
              {totalBacklogCount} no Backlog
            </span>
          )}
        </div>

        <div className="space-y-3.5">
          {workloadMembers.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-400">
              Nenhum designer ou video maker ativo encontrado.
            </div>
          ) : (
            (isExpanded ? workloadMembers : workloadMembers.slice(0, 5)).map(
              ({ emp, totalDemands, activeDemands, availableCapacity, maxIdealCapacity }) => {
                const percentUsed = Math.min(
                  100,
                  Math.round((activeDemands / maxIdealCapacity) * 100)
                );

                return (
                  <div
                    key={emp.id}
                    id={`workload-member-${emp.id}`}
                    onClick={() => onSelectEmployee(emp)}
                    className="group cursor-pointer p-3 -mx-2 rounded-2xl hover:bg-[#262626] border border-transparent hover:border-[#383838] transition-all bg-[#141414]"
                  >
                    <div className="flex items-center justify-between mb-2 gap-2">
                      {/* Member Info */}
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar
                          src={emp.avatarUrl}
                          name={emp.name}
                          alt={emp.name}
                          size="md"
                          className="!w-9 !h-9 ring-1 ring-[#E4007E]/40 shrink-0 [&>div]:bg-[#222222] [&>div]:border [&>div]:border-[#E4007E]/40 [&>div]:text-[#E4007E] [&>div]:font-bold [&>div]:text-xs shadow-xs"
                        />
                        <div className="min-w-0">
                          <div className="font-bold text-white text-xs sm:text-sm group-hover:text-[#E4007E] transition-colors truncate">
                            {emp.name}
                          </div>
                          <div className="text-[11px] text-slate-400 font-medium">
                            {emp.role || 'Colaborador'}
                          </div>
                        </div>
                      </div>

                      {/* Demands Count Badge */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span
                          className="text-[11px] bg-[#222222] border border-[#303030] text-slate-200 font-bold px-2 py-0.5 rounded-lg"
                          title="Total de demandas atribuídas"
                        >
                          <strong className="text-[#E4007E]">{totalDemands}</strong> total
                        </span>
                        <span
                          className="text-[11px] bg-[#2A2A2A] border border-[#383838] text-pink-300 font-bold px-2 py-0.5 rounded-lg"
                          title="Demandas ativas em produção"
                        >
                          {activeDemands} ativas
                        </span>
                      </div>
                    </div>

                    {/* Suggestion Badge (How many tasks can receive) */}
                    <div className="flex items-center justify-between text-[10px] mb-1.5 font-bold">
                      <span className="text-slate-400">Sugestão de Alocação:</span>
                      {availableCapacity > 0 ? (
                        <span className="text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <span>
                            ✨ Pode receber até <strong>+{availableCapacity}</strong>{' '}
                            {availableCapacity === 1 ? 'demanda' : 'demandas'}
                          </span>
                        </span>
                      ) : activeDemands === maxIdealCapacity ? (
                        <span className="text-amber-400 bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded-md">
                          ⚠️ Carga ideal atingida (0 vagas)
                        </span>
                      ) : (
                        <span className="text-rose-400 bg-rose-950/60 border border-rose-800/60 px-2 py-0.5 rounded-md">
                          🚨 Sobrecarga (+{activeDemands - maxIdealCapacity} acima do limite)
                        </span>
                      )}
                    </div>

                    {/* Capacity Progress Bar */}
                    <div className="w-full h-1.5 bg-[#222222] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          percentUsed >= 100
                            ? 'bg-rose-500'
                            : percentUsed >= 75
                            ? 'bg-[#E94E18]'
                            : percentUsed >= 50
                            ? 'bg-[#E4007E]'
                            : 'bg-emerald-500'
                        }`}
                        style={{
                          width: `${
                            activeDemands === 0
                              ? 0
                              : Math.min(100, Math.max(5, percentUsed))
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                );
              }
            )
          )}
        </div>

        {/* Expand / Collapse Button for Team Workload */}
        {workloadMembers.length > 5 && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full py-2.5 text-center text-xs font-bold text-[#E4007E] hover:text-pink-400 transition-colors flex items-center justify-center gap-1 cursor-pointer pt-3 border-t border-[#262626] mt-4"
          >
            <span>
              {isExpanded
                ? 'Mostrar menos colaboradores'
                : `Ver mais colaboradores (+${workloadMembers.length - 5})`}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform ${
                isExpanded ? 'rotate-180' : ''
              }`}
            />
          </button>
        )}
      </div>
    );
  }
);

DashboardWorkloadWidget.displayName = 'DashboardWorkloadWidget';
