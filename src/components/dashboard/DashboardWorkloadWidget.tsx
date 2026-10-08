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
      <div className="bg-surface rounded-2xl p-6 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white text-xl tracking-tight flex items-center gap-1.5">
              Carga de Trabalho da Equipe
              <span 
                className="ml-1 flex items-center justify-center w-4 h-4 rounded-full bg-white/10 text-slate-300 text-[11px] cursor-help font-normal tracking-normal"
                title="A capacidade ideal padrão é de 3 demandas ativas (em progresso ou aprovação) por pessoa. A sugestão de distribuição prioriza criativos com capacidade ociosa."
              >
                ?
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Capacidade ativa e sugestões de distribuição do Backlog
            </p>
          </div>
          {totalBacklogCount > 0 && (
            <span className="text-xs font-semibold bg-brand/10 border border-brand/30 text-brand px-2.5 py-1 rounded-full animate-pulse shrink-0">
              {totalBacklogCount} no Backlog
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
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
                    className="group cursor-pointer p-4 rounded-xl bg-canvas/60 hover:bg-surface border border-white/5 hover:border-line-hover transition-all shadow-xs flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between mb-2 gap-2">
                      {/* Member Info */}
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar
                          src={emp.avatarUrl}
                          name={emp.name}
                          alt={emp.name}
                          size="md"
                          className="!w-9 !h-9 ring-1 ring-brand/40 shrink-0 [&>div]:bg-canvas [&>div]:border [&>div]:border-brand/40 [&>div]:text-brand [&>div]:font-bold [&>div]:text-xs shadow-xs"
                        />
                        <div className="min-w-0">
                          <div className="font-bold text-white text-sm group-hover:text-brand transition-colors truncate">
                            {emp.name}
                          </div>
                          <div className="text-xs text-slate-400 font-medium">
                            {emp.role || 'Colaborador'}
                          </div>
                        </div>
                      </div>

                      {/* Demands Count Badge */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span
                          className="text-xs bg-canvas border border-white/5 text-slate-200 font-bold px-2 py-0.5 rounded-lg"
                          title="Total de demandas atribuídas"
                        >
                          <strong className="text-brand">{totalDemands}</strong> total
                        </span>
                        <span
                          className="text-xs bg-chip border border-line-hover text-pink-300 font-bold px-2 py-0.5 rounded-lg"
                          title="Demandas ativas em produção"
                        >
                          {activeDemands} ativas
                        </span>
                      </div>
                    </div>

                    {/* Suggestion Badge (How many tasks can receive) */}
                    <div className="flex items-center justify-between text-xs mb-1.5 font-bold">
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
                    <div className="w-full h-1.5 bg-canvas rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          percentUsed >= 100
                            ? 'bg-rose-500'
                            : percentUsed >= 75
                            ? 'bg-brand-alt'
                            : percentUsed >= 50
                            ? 'bg-brand'
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
            className="w-full py-2.5 text-center text-xs font-bold text-brand hover:text-pink-400 transition-colors flex items-center justify-center gap-1 cursor-pointer pt-3 border-t border-line mt-4"
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
