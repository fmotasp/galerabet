import React from 'react';

export const ReportsView: React.FC = () => {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Dashboard de Criação e Audiovisual</h1>
          <p className="text-slate-400">Em construção...</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-500">
        Aguardando as próximas instruções para a montagem dos relatórios...
      </div>
    </div>
  );
};
