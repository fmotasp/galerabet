import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Lock, History, Trash2, Edit3, PlusCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const LogsView: React.FC = () => {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { currentUser } = useApp();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'g4l3r4') {
      setIsAuthenticated(true);
      fetchLogs();
    } else {
      alert('Senha incorreta!');
    }
  };

  const fetchLogs = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('system_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
      
    if (data) {
      setLogs(data);
    }
    setIsLoading(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="bg-[#181818] border border-[#2E2E2E] p-8 rounded-2xl w-full max-w-sm flex flex-col items-center shadow-xl">
          <div className="w-16 h-16 bg-[#262626] rounded-full flex items-center justify-center mb-6">
            <Lock className="w-8 h-8 text-[#E4007E]" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Acesso Restrito</h2>
          <p className="text-slate-400 text-sm text-center mb-6">
            Insira a senha master para acessar o log do sistema.
          </p>
          <form onSubmit={handleLogin} className="w-full flex flex-col gap-4">
            <input
              type="password"
              placeholder="Senha Master"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#101010] border border-[#2E2E2E] text-white px-4 py-3 rounded-xl focus:outline-none focus:border-[#E4007E]"
            />
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-[#E4007E] to-[#E94E18] text-white font-bold py-3 rounded-xl hover:opacity-90 transition-opacity"
            >
              Acessar Logs
            </button>
          </form>
        </div>
      </div>
    );
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'CREATE': return <PlusCircle className="w-4 h-4 text-emerald-400" />;
      case 'UPDATE': return <Edit3 className="w-4 h-4 text-amber-400" />;
      case 'DELETE': return <Trash2 className="w-4 h-4 text-rose-500" />;
      default: return <History className="w-4 h-4 text-slate-400" />;
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'CREATE': return 'Criou tarefa';
      case 'UPDATE': return 'Alterou tarefa';
      case 'DELETE': return 'Excluiu tarefa';
      default: return action;
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 w-full animate-in fade-in duration-200 p-4 sm:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-wide">Logs do Sistema</h1>
          <p className="text-slate-400 mt-1">Registro de todas as ações importantes realizadas no sistema.</p>
        </div>
        <button
          onClick={fetchLogs}
          className="px-4 py-2 bg-[#262626] hover:bg-[#333333] text-white rounded-xl text-sm font-bold transition-colors"
        >
          Atualizar Logs
        </button>
      </div>

      <div className="flex-1 bg-[#181818] border border-[#2E2E2E] rounded-2xl overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="flex items-center justify-center flex-1">
            <div className="w-8 h-8 border-4 border-[#E4007E] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="flex items-center justify-center flex-1 text-slate-500">
            Nenhum log encontrado. O monitoramento foi iniciado agora.
          </div>
        ) : (
          <div className="overflow-y-auto flex-1 no-scrollbar p-4">
            <div className="space-y-3">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-4 p-4 bg-[#101010] border border-[#262626] rounded-xl hover:border-[#333333] transition-colors">
                  <div className="w-10 h-10 rounded-full bg-[#222222] flex items-center justify-center shrink-0 border border-[#333333]">
                    {getActionIcon(log.action)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-4 mb-1">
                      <p className="text-sm text-slate-300">
                        <strong className="text-white">{log.user_name}</strong> {getActionLabel(log.action)}
                      </p>
                      <span className="text-xs text-slate-500 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <p className="text-white font-medium truncate">
                      {log.task_title || 'Tarefa sem título (ou ID: ' + log.task_id + ')'}
                    </p>
                    {log.details && Object.keys(log.details).length > 0 && (
                      <div className="mt-2 text-xs text-slate-400 bg-[#181818] p-2 rounded-lg border border-[#262626]">
                        {Object.entries(log.details).map(([key, val]) => (
                          <div key={key}>
                            <span className="font-bold">{key}:</span> {typeof val === 'string' ? val : JSON.stringify(val)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
