import React from 'react';
import { Search, Sparkles } from 'lucide-react';
import { Input } from '../ui';
import { PeriodFilter, DepartmentFilter } from './reportsUtils';

interface ReportsFilterToolbarProps {
  period: PeriodFilter;
  onPeriodChange: (p: PeriodFilter) => void;
  selectedDept: DepartmentFilter;
  onDeptChange: (d: DepartmentFilter) => void;
  selectedClient: string;
  onClientChange: (c: string) => void;
  registeredClients: { id: string; name: string }[];
  searchMember: string;
  onSearchChange: (s: string) => void;
}

export const ReportsFilterToolbar: React.FC<ReportsFilterToolbarProps> = React.memo(
  ({
    period,
    onPeriodChange,
    selectedDept,
    onDeptChange,
    selectedClient,
    onClientChange,
    registeredClients,
    searchMember,
    onSearchChange,
  }) => {
    return (
      <div className="bg-[#181818] border border-[#2A2A2A] rounded-3xl p-4 sm:p-5 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2.5 flex-1">
            {/* Filtro de Período */}
            <div className="flex items-center bg-[#222222] p-1 rounded-xl border border-[#303030]">
              <button
                onClick={() => onPeriodChange('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  period === 'all'
                    ? 'bg-gradient-to-r from-[#E4007E] to-[#E94E18] text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Geral
              </button>
              <button
                onClick={() => onPeriodChange('7d')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  period === '7d'
                    ? 'bg-gradient-to-r from-[#E4007E] to-[#E94E18] text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                7 Dias
              </button>
              <button
                onClick={() => onPeriodChange('30d')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  period === '30d'
                    ? 'bg-gradient-to-r from-[#E4007E] to-[#E94E18] text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                30 Dias
              </button>
              <button
                onClick={() => onPeriodChange('month')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  period === 'month'
                    ? 'bg-gradient-to-r from-[#E4007E] to-[#E94E18] text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Este Mês
              </button>
            </div>

            {/* Filtro de Departamento */}
            <div className="flex items-center bg-[#222222] p-1 rounded-xl border border-[#303030]">
              <button
                onClick={() => onDeptChange('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedDept === 'all'
                    ? 'bg-gradient-to-r from-[#E4007E] to-[#E94E18] text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Todos (Design & Vídeo)
              </button>
              <button
                onClick={() => onDeptChange('design')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedDept === 'design'
                    ? 'bg-gradient-to-r from-[#E4007E] to-[#E94E18] text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Designers
              </button>
              <button
                onClick={() => onDeptChange('videomaker')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedDept === 'videomaker'
                    ? 'bg-gradient-to-r from-[#E4007E] to-[#E94E18] text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Video Makers
              </button>
            </div>

            {/* Filtro de Clientes */}
            <select
              value={selectedClient}
              onChange={(e) => onClientChange(e.target.value)}
              className="px-3 py-2 bg-[#222222] border border-[#303030] rounded-xl text-xs font-bold text-white focus:outline-none focus:border-[#E4007E] cursor-pointer"
            >
              <option value="all">Todos os Clientes</option>
              {registeredClients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Busca rápida por Colaborador */}
          <div className="w-full md:w-64">
            <Input
              type="text"
              placeholder="Buscar colaborador..."
              value={searchMember}
              onChange={(e) => onSearchChange(e.target.value)}
              leftIcon={<Search className="w-3.5 h-3.5" />}
              className="!py-2 !bg-[#222222] !border-[#303030] text-xs font-medium placeholder-slate-400"
            />
          </div>
        </div>

        {/* ⚠️ Alerta de Ponderação de Complexidade */}
        <div className="p-3.5 bg-gradient-to-r from-[#E4007E]/10 to-[#E94E18]/10 border border-[#E4007E]/30 rounded-2xl flex items-center gap-3 text-pink-200 text-xs">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#E4007E] to-[#E94E18] text-white flex items-center justify-center shrink-0 shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-[#E4007E]">
              Ponderação de Complexidade Ativa:
            </span>{' '}
            As métricas avaliam o esforço real de cada entrega. Campanhas estruturais e key
            visuals complexos possuem peso ponderado superior a posts simples de desdobramento.
          </div>
        </div>
      </div>
    );
  }
);

ReportsFilterToolbar.displayName = 'ReportsFilterToolbar';
