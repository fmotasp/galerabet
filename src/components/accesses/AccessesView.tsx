import React, { useEffect, useState } from 'react';
import { Search, Plus, Filter, Edit2, Trash2, Copy, Eye, EyeOff, Link as LinkIcon } from 'lucide-react';
import { useAccesses } from '../../hooks/useAccesses';
import { AccessCard } from './AccessCard';
import { AccessModal } from '../modals/AccessModal';
import { Access } from '../../types';
import { fetchDriveItemsFromLink, listDriveFolderContents, extractDriveFileOrFolderId, DriveFileItem } from '../../lib/googleDrive';
import { ChevronDown, ChevronUp, FileText, Image as ImageIcon, Folder, File } from 'lucide-react';
import { useApp } from '../../context/AppContext';



const AccessRow: React.FC<{ access: Access; onEdit: (a: Access) => void; onDelete: (id: string) => void }> = ({ access, onEdit, onDelete }) => {
  const { addToast } = useApp();
  const [showPassword, setShowPassword] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [driveFiles, setDriveFiles] = useState<DriveFileItem[]>([]);
  const [isLoadingDrive, setIsLoadingDrive] = useState(false);
  const [hasFetchedDrive, setHasFetchedDrive] = useState(false);

  const isDriveLink = access.siteUrl && access.siteUrl.includes('drive.google.com');

  const toggleExpand = async () => {
    if (!isExpanded && isDriveLink && !hasFetchedDrive) {
      setIsLoadingDrive(true);
      try {
        const extracted = extractDriveFileOrFolderId(access.siteUrl!);
        if (extracted && extracted.isFolder) {
          const contents = await listDriveFolderContents(extracted.id);
          setDriveFiles(contents);
        } else {
          const result = await fetchDriveItemsFromLink(access.siteUrl!);
          setDriveFiles(result.files || []);
        }
        setHasFetchedDrive(true);
      } catch (err) {
        addToast('Erro', 'Não foi possível carregar os arquivos do Drive.', 'error');
      } finally {
        setIsLoadingDrive(false);
      }
    }
    setIsExpanded(!isExpanded);
  };

  const renderDriveIcon = (mimeType: string) => {
    if (mimeType === 'application/vnd.google-apps.folder') return <Folder className="w-4 h-4 text-[#E4007E]" fill="currentColor" />; // using pink/red from brand
    if (mimeType.includes('image')) return <ImageIcon className="w-4 h-4 text-emerald-500" />;
    if (mimeType.includes('pdf')) return <FileText className="w-4 h-4 text-red-500" />;
    if (mimeType.includes('spreadsheet') || mimeType.includes('csv')) return <FileText className="w-4 h-4 text-emerald-600" />;
    return <File className="w-4 h-4 text-blue-500" />;
  };

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

  const cat = access.category ? access.category.toLowerCase() : '';
  let colorClass = "text-slate-600 bg-slate-50 border-slate-200";
  let indicatorBg = "bg-slate-400";
  
  if (cat.includes("plataforma")) {
    colorClass = "text-emerald-600 bg-emerald-50 border-emerald-200";
    indicatorBg = "bg-emerald-500";
  } else if (cat.includes("provedor")) {
    colorClass = "text-violet-600 bg-violet-50 border-violet-200";
    indicatorBg = "bg-violet-500";
  } else if (cat.includes("sistema")) {
    colorClass = "text-blue-600 bg-blue-50 border-blue-200";
    indicatorBg = "bg-blue-500";
  } else if (cat.includes("banco") || cat.includes("financeiro")) {
    colorClass = "text-amber-600 bg-amber-50 border-amber-200";
    indicatorBg = "bg-amber-500";
  } else {
    indicatorBg = "bg-slate-400";
  }

  return (
    <React.Fragment>
      <tr className="hover:bg-slate-50 transition-colors group border-b border-slate-100 last:border-0">
      <td className="p-0">
        <div className={`w-1 h-12 ${indicatorBg} mx-auto rounded-full`}></div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          {isDriveLink && (
            <button onClick={toggleExpand} className="p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors" title="Ver arquivos">
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
          <div className="flex flex-col">
            <span className="font-semibold text-[15px] text-slate-800">{access.title}</span>

          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        {access.category ? (
          <span className={`inline-block px-2.5 py-1 text-[10px] font-bold tracking-wider border rounded-md uppercase ${colorClass}`}>
            {access.category}
          </span>
        ) : (
          <span className="text-slate-400 text-xs">Geral</span>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-700 font-mono break-all">{access.login || '-'}</span>
          {access.login && (
            <button onClick={() => handleCopy(access.login, 'Login')} className="text-slate-400 hover:text-[#E4007E] transition-colors" title="Copiar Login">
              <Copy className="w-4 h-4" />
            </button>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-700 font-mono min-w-[80px]">
            {!access.password ? '-' : showPassword ? access.password : '••••••••'}
          </span>
          {access.password && (
            <>
              <button onClick={() => setShowPassword(!showPassword)} className="text-slate-400 hover:text-slate-600 transition-colors" title={showPassword ? 'Ocultar Senha' : 'Mostrar Senha'}>
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <button onClick={() => handleCopy(access.password || '', 'Senha')} className="text-slate-400 hover:text-[#E4007E] transition-colors" title="Copiar Senha">
                <Copy className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-2">
          {(!access.login && !access.password) && (
            <button onClick={handleVisitSite} className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 bg-blue-50 text-blue-600 border border-blue-100 rounded hover:bg-blue-100 transition-colors" title="Acessar via Drive">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 1443.061 1249.993">
                <path fill="#3777e3" d="M240.525 1249.993l240.492-416.664h962.044l-240.514 416.664z"/>
                <path fill="#ffcf63" d="M962.055 833.329h481.006L962.055 0H481.017z"/>
                <path fill="#11a861" d="M0 833.329l240.525 416.664 481.006-833.329L481.017 0z"/>
              </svg>
              Drive
            </button>
          )}
          {(hasUrl && (access.login || access.password)) && (
            <button onClick={handleVisitSite} className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 bg-[#3b82f6]/10 text-[#3b82f6] rounded hover:bg-[#3b82f6]/20 transition-colors" title="Acessar site">
              <LinkIcon className="w-3.5 h-3.5" /> Acessar
            </button>
          )}
          <button onClick={() => onEdit(access)} className="p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 rounded transition-colors" title="Editar">
            <Edit2 className="w-4 h-4" />
          </button>
          <button onClick={() => { if (window.confirm('Excluir este acesso?')) onDelete(access.id); }} className="p-1.5 text-slate-400 hover:bg-rose-100 hover:text-rose-600 rounded transition-colors" title="Excluir">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
    {isExpanded && (
      <tr className="bg-slate-100/50 border-b border-slate-200 last:border-0 shadow-inner">
        <td colSpan={6} className="px-8 py-4">
          {isLoadingDrive ? (
            <div className="flex items-center justify-center py-4">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-2 text-sm text-slate-500">Carregando arquivos do Drive...</span>
            </div>
          ) : driveFiles.length === 0 ? (
            <div className="text-sm text-slate-500 text-center py-4">Nenhum arquivo encontrado nesta pasta ou permissão negada.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-1.5 bg-[#141414] rounded-xl p-4 border border-[#222]">
              {driveFiles.map(file => (
                <div key={file.id} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-[#222] transition-colors group/file">
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="shrink-0 flex items-center justify-center">
                      {renderDriveIcon(file.mimeType)}
                    </div>
                    <span className="text-[13px] font-medium text-slate-200 truncate group-hover/file:text-white transition-colors" title={file.name}>
                      {file.name}
                    </span>
                  </div>
                  <a href={file.webViewLink} target="_blank" rel="noopener noreferrer" className="shrink-0 ml-3 flex items-center opacity-0 group-hover/file:opacity-100 transition-opacity" title="Acessar no Drive">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 hover:text-white">
                      <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path>
                      <path d="M12 12v9"></path>
                      <path d="m8 17 4 4 4-4"></path>
                    </svg>
                  </a>
                </div>
              ))}
            </div>
          )}
        </td>
      </tr>
    )}
    </React.Fragment>
  );
};


export const AccessesView: React.FC = () => {
  const { accesses, isLoadingAccesses, fetchAccesses, deleteAccess } = useAccesses();
  const { globalSearchQuery } = useApp();
  
  const [localSearch, setLocalSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccess, setEditingAccess] = useState<Access | null>(null);

  useEffect(() => {
    fetchAccesses();
  }, [fetchAccesses]);

  const searchQuery = globalSearchQuery || localSearch;

  const categories = Array.from(new Set(accesses.map(a => a.category).filter(Boolean))) as string[];
  
  const filteredAccesses = accesses.filter((acc) => {
    // 1. Filter by category
    if (selectedCategory !== 'all') {
      const cat = acc.category || 'Geral';
      if (selectedCategory === 'Geral' && acc.category) return false;
      if (selectedCategory !== 'Geral' && cat !== selectedCategory) return false;
    }

    // 2. Filter by search
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      acc.title.toLowerCase().includes(q) ||
      acc.login.toLowerCase().includes(q)
    );
  }).sort((a, b) => a.title.localeCompare(b.title));

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

        <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
          <div className="relative">
            <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-[#1A1A1A] border border-[#333] text-sm text-white rounded-lg pl-9 pr-8 py-2 focus:outline-none focus:border-[#E4007E] focus:ring-1 focus:ring-[#E4007E] transition-all appearance-none cursor-pointer"
            >
              <option value="all">Todas categorias</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
              <option value="Geral">Geral (Sem categoria)</option>
            </select>
          </div>
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
