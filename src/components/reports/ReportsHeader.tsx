import React from 'react';
import { BarChart2, FileSpreadsheet, Printer } from 'lucide-react';
import { Button } from '../ui';

interface ReportsHeaderProps {
  onExportCSV: () => void;
  onPrint: () => void;
}

export const ReportsHeader: React.FC<ReportsHeaderProps> = React.memo(
  ({ onExportCSV, onPrint }) => {
    return (
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-[#2A2A2A]">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#E4007E] to-[#E94E18] flex items-center justify-center text-white shadow-lg shadow-[#E4007E]/25">
              <BarChart2 className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                <span>Relatório de Produtividade por Colaborador</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 font-medium mt-0.5">
                Diagnóstico de capacidade individual, complexidade das entregas, revisões e
                cumprimento de prazos.
              </p>
            </div>
          </div>
        </div>

        {/* Ações de Exportação */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="secondary"
            onClick={onExportCSV}
            leftIcon={<FileSpreadsheet className="w-4 h-4 text-[#E4007E]" />}
            className="text-xs font-bold"
            title="Exportar dados para planilha Excel / CSV"
            aria-label="Exportar dados para planilha Excel / CSV"
          >
            <span>Exportar CSV</span>
          </Button>
          <Button
            onClick={onPrint}
            leftIcon={<Printer className="w-4 h-4" />}
            className="text-xs font-black"
            title="Imprimir ou Salvar em PDF"
            aria-label="Imprimir ou Salvar em PDF"
          >
            <span>Imprimir / PDF</span>
          </Button>
        </div>
      </div>
    );
  }
);

ReportsHeader.displayName = 'ReportsHeader';
