import React, { useEffect, useState } from 'react';
import { Search, Plus, Edit2, Trash2, Copy, Eye, EyeOff, Link as LinkIcon } from 'lucide-react';
import { useAccesses } from '../../hooks/useAccesses';
import { AccessCard } from './AccessCard';
import { AccessModal } from '../modals/AccessModal';
import { Access } from '../../types';
import { useApp } from '../../context/AppContext';



const AccessRow: React.FC<{ access: Access; onEdit: (a: Access) => void; onDelete: (id: string) => void }> = ({ access, onEdit, onDelete }) => {
  const { addToast } = useApp();
  const [showPassword, setShowPassword] = useState(false);

  const handleCopy = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    addToast(`${label} copiado!`, 'O texto foi copiado para a área de transferência.', 'success');
  };

  const handleVisitSite = () => {
    let url = access.siteUrl || '';
    if (!url) return;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const hasUrl = !!access.siteUrl;

  return (
    <tr className="hover:bg-slate-50 transition-colors group border-b border-slate-100 last:border-0">
      <td className="p-0">
        <div className="w-1 h-12 bg-blue-500 mx-auto rounded-full"></div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <span className="font-semibold text-[15px] text-slate-800">{access.title}</span>
            {hasUrl && (
              <button onClick={handleVisitSite} className="text-left text-[11px] text-[#3b82f6] hover:underline flex items-center gap-1 mt-0.5">
                <LinkIcon className="w-3 h-3" /> Acessar site
              </button>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        {access.category ? (
           <span className="inline-block px-2.5 py-1 text-[10px] font-bold tracking-wider text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-md uppercase">
             {access.category}
           </span>
        ) : (
           <span className="text-slate-400 text-xs">Geral</span>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-700 font-mono bg-slate-100 px-2 py-1 rounded truncate max-w-[150px]">{access.login}</span>
          <button onClick={() => handleCopy(access.login, 'Login')} className="text-slate-400 hover:text-[#E4007E] transition-colors" title="Copiar Login">
            <Copy className="w-4 h-4" />
          </button>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-700 font-mono bg-slate-100 px-2 py-1 rounded w-24 text-center">
            {showPassword ? access.password : '••••••••'}
          </span>
          <button onClick={() => setShowPassword(!showPassword)} className="text-slate-400 hover:text-slate-600 transition-colors" title={showPassword ? 'Ocultar Senha' : 'Mostrar Senha'}>
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
          <button onClick={() => handleCopy(access.password || '', 'Senha')} className="text-slate-400 hover:text-[#E4007E] transition-colors" title="Copiar Senha">
            <Copy className="w-4 h-4" />
          </button>
        </div>
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(access)} className="p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 rounded transition-colors" title="Editar">
            <Edit2 className="w-4 h-4" />
          </button>
          <button onClick={() => { if (window.confirm('Excluir este acesso?')) onDelete(access.id); }} className="p-1.5 text-slate-400 hover:bg-rose-100 hover:text-rose-600 rounded transition-colors" title="Excluir">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
};


export const AccessesView: React.FC = () => {
  const { accesses, isLoadingAccesses, fetchAccesses, deleteAccess } = useAccesses();
  const { globalSearchQuery } = useApp();
  
  const [localSearch, setLocalSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccess, setEditingAccess] = useState<Access | null>(null);

  useEffect(() => {
    fetchAccesses();
  }, [fetchAccesses]);

  const searchQuery = globalSearchQuery || localSearch;

  const filteredAccesses = accesses.filter((acc) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      acc.title.toLowerCase().includes(q) ||
      acc.login.toLowerCase().includes(q)
    );
  });

  const handleEdit = (access: Access) => {
    setEditingAccess(access);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingAccess(null);
    setIsModalOpen(true);
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-200">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Acessos</h1>
          <p className="text-sm text-slate-400">Gerencie credenciais e links importantes do sistema</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar acessos..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="bg-[#1A1A1A] border border-[#333] text-sm text-white rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:border-[#E4007E] focus:ring-1 focus:ring-[#E4007E] transition-all w-full sm:w-64"
            />
          </div>
          <button
            onClick={handleAddNew}
            className="flex items-center gap-2 bg-[#E4007E] hover:bg-[#E94E18] text-white px-4 py-2 rounded-lg font-medium transition-all shadow-lg shadow-[#E4007E]/20"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Novo Acesso</span>
          </button>
        </div>
      </div>

      {/* List View */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden text-slate-800 font-sans flex-1 mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" style={{ minWidth: '800px' }}>
            <thead>
              <tr className="border-b border-slate-200 text-slate-600 font-medium text-sm">
                <th className="w-1 px-0 py-3"></th>
                <th className="px-4 py-3 font-medium">Plataforma</th>
                <th className="px-4 py-3 font-medium">Categoria</th>
                <th className="px-4 py-3 font-medium">Login</th>
                <th className="px-4 py-3 font-medium">Senha</th>
                <th className="px-4 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingAccesses ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  </td>
                </tr>
              ) : filteredAccesses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400">
                    <p>Nenhum acesso encontrado.</p>
                  </td>
                </tr>
              ) : (
                filteredAccesses.map((acc) => (
                  <AccessRow key={acc.id} access={acc} onEdit={handleEdit} onDelete={deleteAccess} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <AccessModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          accessToEdit={editingAccess}
        />
      )}
    </div>
  );
};
