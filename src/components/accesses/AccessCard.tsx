import React, { useState } from 'react';
import { Copy, Edit2, Key, Link as LinkIcon, Trash2, Eye, EyeOff } from 'lucide-react';
import { Access } from '../../types';
import { useApp } from '../../context/AppContext';

interface AccessCardProps {
  access: Access;
  onEdit: (access: Access) => void;
  onDelete: (id: string) => void;
}

export const AccessCard: React.FC<AccessCardProps> = ({ access, onEdit, onDelete }) => {
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
    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl overflow-hidden hover:border-[#3A3A3A] transition-colors group flex flex-col h-full">
      {/* Cover Image */}
      <div className="w-full h-32 bg-[#222] relative border-b border-[#2A2A2A] flex shrink-0">
        {access.coverImageUrl ? (
          <img
            src={access.coverImageUrl}
            alt={access.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x200/222222/666666?text=Sem+Capa';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#555]">
            <Key className="w-8 h-8" />
          </div>
        )}
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(access)}
            className="p-1.5 bg-black/60 hover:bg-black/80 backdrop-blur-sm text-white rounded-lg transition-colors"
            title="Editar Acesso"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              if (window.confirm('Tem certeza que deseja excluir este acesso?')) {
                onDelete(access.id);
              }
            }}
            className="p-1.5 bg-black/60 hover:bg-red-500/80 backdrop-blur-sm text-white rounded-lg transition-colors"
            title="Excluir Acesso"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-4 flex-1">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-lg text-white truncate pr-2" title={access.title}>
              {access.title}
            </h3>
            {access.category && (
              <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold tracking-wider text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-md uppercase">
                {access.category}
              </span>
            )}
          </div>
          {hasUrl && (
            <button
              onClick={handleVisitSite}
              className="text-[#E4007E] hover:text-[#FF1493] p-1 bg-[#E4007E]/10 rounded-md transition-colors shrink-0"
              title="Acessar site"
            >
              <LinkIcon className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="space-y-3 flex-1 flex flex-col justify-end">
          {/* Login Field */}
          <div>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1 block">Login</span>
            <div className="flex items-center gap-2 bg-[#141414] rounded-lg p-2 border border-[#2A2A2A]">
              <span className="text-sm text-white truncate flex-1 font-mono">{access.login}</span>
              <button
                onClick={() => handleCopy(access.login, 'Login')}
                className="text-slate-400 hover:text-white p-1 rounded transition-colors shrink-0"
                title="Copiar Login"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Password Field */}
          <div>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1 block">Senha</span>
            <div className="flex items-center gap-2 bg-[#141414] rounded-lg p-2 border border-[#2A2A2A]">
              <span className="text-sm text-white truncate flex-1 font-mono">
                {showPassword ? access.password : '••••••••'}
              </span>
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="text-slate-400 hover:text-white p-1 rounded transition-colors shrink-0"
                title={showPassword ? 'Ocultar Senha' : 'Mostrar Senha'}
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => handleCopy(access.password || '', 'Senha')}
                className="text-slate-400 hover:text-white p-1 rounded transition-colors shrink-0"
                title="Copiar Senha"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
