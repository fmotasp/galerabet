import React, { useState, useRef, useEffect } from 'react';
import { Search, Sparkles, Building2, ChevronDown, Check } from 'lucide-react';
import { Input } from '../ui';
import { PeriodFilter, DepartmentFilter, ReportClient } from './reportsUtils';

interface ReportsFilterToolbarProps {
  period: PeriodFilter;
  onPeriodChange: (p: PeriodFilter) => void;
  selectedDept: DepartmentFilter;
  onDeptChange: (d: DepartmentFilter) => void;
  selectedClient: string;
  onClientChange: (c: string) => void;
  registeredClients: ReportClient[];
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
    const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
    const clientDropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          clientDropdownRef.current &&
          !clientDropdownRef.current.contains(event.target as Node)
        ) {
          setIsClientDropdownOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const currentClient = registeredClients.find((c) => c.id === selectedClient);
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

            {/* Filtro de Clientes com Ícones */}
            <div className="relative" ref={clientDropdownRef}>
              <button
                type="button"
                onClick={() => setIsClientDropdownOpen(!isClientDropdownOpen)}
                className="flex items-center gap-2 px-3 py-2 bg-[#222222] hover:bg-[#282828] border border-[#303030] hover:border-[#E4007E]/50 rounded-xl text-xs font-bold text-white transition-all cursor-pointer shadow-xs select-none"
              >
                {currentClient ? (
                  <div className="flex items-center gap-2">
                    {currentClient.icon ? (
                      <img
                        src={currentClient.icon}
                        alt={currentClient.name}
                        className="w-4 h-4 rounded-md object-contain shrink-0"
                      />
                    ) : (
                      <span
                        className="w-3.5 h-3.5 rounded-md flex items-center justify-center text-[9px] font-black text-white shrink-0"
                        style={{ backgroundColor: currentClient.color || '#10B981' }}
                      >
                        {currentClient.name.substring(0, 1).toUpperCase()}
                      </span>
                    )}
                    <span className="truncate max-w-[130px]">{currentClient.name}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-slate-200">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>Todos os Clientes</span>
                  </div>
                )}
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                    isClientDropdownOpen ? 'rotate-180 text-white' : ''
                  }`}
                />
              </button>

              {isClientDropdownOpen && (
                <div className="absolute left-0 mt-1.5 w-56 bg-[#1C1C1C] border border-[#2E2E2E] rounded-2xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <button
                    type="button"
                    onClick={() => {
                      onClientChange('all');
                      setIsClientDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      selectedClient === 'all'
                        ? 'bg-gradient-to-r from-[#E4007E] to-[#E94E18] text-white shadow-xs'
                        : 'text-slate-300 hover:text-white hover:bg-[#282828]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 opacity-80" />
                      <span>Todos os Clientes</span>
                    </div>
                    {selectedClient === 'all' && <Check className="w-3.5 h-3.5" />}
                  </button>

                  <div className="my-1 border-t border-[#2A2A2A]" />

                  <div className="max-h-60 overflow-y-auto space-y-0.5 custom-scrollbar">
                    {registeredClients.map((c) => {
                      const isSelected = selectedClient === c.id;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            onClientChange(c.id);
                            setIsClientDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-gradient-to-r from-[#E4007E] to-[#E94E18] text-white shadow-xs'
                              : 'text-slate-300 hover:text-white hover:bg-[#282828]'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {c.icon ? (
                              <img
                                src={c.icon}
                                alt={c.name}
                                className="w-4 h-4 rounded-md object-contain shrink-0"
                              />
                            ) : (
                              <span
                                className="w-4 h-4 rounded-md flex items-center justify-center text-[9px] font-black text-white shrink-0"
                                style={{ backgroundColor: c.color || '#10B981' }}
                              >
                                {c.name.substring(0, 1).toUpperCase()}
                              </span>
                            )}
                            <span className="truncate">{c.name}</span>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
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
