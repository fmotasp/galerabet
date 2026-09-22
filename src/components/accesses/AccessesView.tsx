import React, { useEffect, useState } from 'react';
import { Search, Plus } from 'lucide-react';
import { useAccesses } from '../../hooks/useAccesses';
import { AccessCard } from './AccessCard';
import { AccessModal } from '../modals/AccessModal';
import { Access } from '../../types';
import { useApp } from '../../context/AppContext';

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

      {/* Grid */}
      {isLoadingAccesses ? (
        <div className="flex items-center justify-center flex-1">
          <div className="w-8 h-8 border-4 border-[#E4007E] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredAccesses.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 text-slate-400">
          <p>Nenhum acesso encontrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 auto-rows-fr">
          {filteredAccesses.map((acc) => (
            <AccessCard 
              key={acc.id} 
              access={acc} 
              onEdit={handleEdit} 
              onDelete={deleteAccess} 
            />
          ))}
        </div>
      )}

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
