import React, { useState } from 'react';
import {
  Palette,
  BookOpen,
  FolderArchive,
  Check,
  ExternalLink,
  Search,
  Plus,
  Edit2,
  Type,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const MaterialsView: React.FC = () => {
  const {
    projects,
    setIsNewProjectModalOpen,
    setEditingProject,
    addToast,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  const handleCopyColor = async (hex: string, clientName: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(hex);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = hex;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      setCopiedHex(hex);
      addToast('Cor Copiada!', `${hex} copiado para a área de transferência (${clientName}).`, 'success');
      setTimeout(() => setCopiedHex(null), 2000);
    } catch (e) {
      addToast('Erro ao copiar', 'Não foi possível copiar o código HEX.', 'error');
    }
  };

  const isSystemConfig = (p: any) =>
    p.id === 'system-settings' ||
    p.id === 'google-drive-token' ||
    p.id.startsWith('system-') ||
    p.id.startsWith('google-') ||
    p.category?.toLowerCase() === 'system' ||
    p.status === 'system';

  const validClients = projects.filter((p) => !isSystemConfig(p));

  const filteredClients = validClients.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.category && p.category.toLowerCase().includes(q)) ||
      (p.description && p.description.toLowerCase().includes(q)) ||
      (p.colorPalette &&
        p.colorPalette.some(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.hex.toLowerCase().includes(q) ||
            (c.pantone && c.pantone.toLowerCase().includes(q))
        ))
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#141414] border border-[#262626] rounded-3xl p-5 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#E4007E] to-[#E94E18] text-white flex items-center justify-center font-black shadow-lg shadow-[#E4007E]/25 shrink-0">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-tight">
              Material Auxiliar
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              Manuais de marca, packs de logos, paletas de cores e tipografias dos clientes
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar cliente, cor ou categoria..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#1C1C1C] border border-[#2E2E2E] focus:border-[#E4007E] rounded-xl text-xs font-semibold text-white placeholder-slate-500 focus:outline-none transition-all shadow-inner"
            />
          </div>
        </div>
      </div>

      {/* Grid of Client Brand Materials */}
      {filteredClients.length === 0 ? (
        <div className="p-12 text-center bg-[#141414] border border-dashed border-[#2E2E2E] rounded-3xl space-y-3">
          <Palette className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="text-sm font-bold text-white">Nenhum cliente ou material encontrado</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchQuery
              ? 'Nenhum resultado corresponde à sua pesquisa. Tente outro termo.'
              : 'Cadastre seus clientes na aba de Cadastros para que seus materiais e identidades visuais apareçam aqui.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredClients.map((client) => {
            const hasColors = client.colorPalette && client.colorPalette.length > 0;
            const hasManual = Boolean(client.brandManualUrl);
            const hasLogos = Boolean(client.logosPackUrl || client.logoUrl);
            const hasTypography = Boolean(client.typographyUrl);

            return (
              <div
                key={client.id}
                className="bg-[#141414] border border-[#262626] hover:border-[#383838] rounded-3xl p-6 flex flex-col justify-between space-y-5 transition-all shadow-xl hover:shadow-2xl group relative overflow-hidden"
              >
                {/* Accent Top Subtle Gradient */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#E4007E] via-[#E94E18] to-transparent opacity-40 group-hover:opacity-100 transition-opacity" />

                <div className="space-y-4">
                  {/* Card Header: Logo, Name, Category & Edit Action */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-13 h-13 rounded-2xl bg-[#1C1C1C] border border-[#2E2E2E] flex items-center justify-center overflow-hidden shrink-0 shadow-md p-1.5">
                        {client.logoUrl ? (
                          <img
                            src={client.logoUrl}
                            alt={client.name}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="w-full h-full rounded-xl bg-gradient-to-tr from-[#E4007E] to-[#E94E18] text-white flex items-center justify-center font-black text-sm">
                            {client.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <h3 className="text-base font-extrabold text-white truncate group-hover:text-white transition-colors" title={client.name}>
                          {client.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="px-2 py-0.5 rounded-lg bg-[#1C1C1C] border border-[#2E2E2E] text-[10px] font-bold text-slate-300">
                            {client.category || 'Geral'}
                          </span>
                          {client.totalTasks !== undefined && client.totalTasks > 0 && (
                            <span className="text-[10px] text-slate-400 font-medium">
                              {client.totalTasks} demandas
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setEditingProject(client);
                        setIsNewProjectModalOpen(true);
                      }}
                      className="p-2 rounded-xl text-slate-400 hover:text-white bg-[#1C1C1C] hover:bg-[#262626] border border-[#2E2E2E] transition-all cursor-pointer shrink-0 shadow-xs"
                      title="Editar materiais deste cliente"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Descrição se houver */}
                  {client.description && (
                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                      {client.description}
                    </p>
                  )}

                  {/* Seção de Paleta de Cores */}
                  <div className="space-y-2 pt-2 border-t border-[#222222]">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <Palette className="w-3.5 h-3.5 text-[#E4007E]" />
                        <span>Paleta de Cores</span>
                      </span>
                      <span className="text-[10px] text-slate-400">Clique na cor p/ copiar</span>
                    </div>

                    {hasColors ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {client.colorPalette!.map((c, i) => {
                          const isCopied = copiedHex === c.hex;
                          return (
                            <button
                              key={i}
                              type="button"
                              onClick={() => handleCopyColor(c.hex, client.name)}
                              className="p-2 rounded-xl bg-[#1C1C1C] border border-[#2A2A2A] hover:border-[#E4007E] transition-all text-left group/color cursor-pointer active:scale-95 relative overflow-hidden"
                              title={`Copiar ${c.hex}`}
                            >
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-5 h-5 rounded-lg border border-white/20 shadow-xs shrink-0"
                                  style={{ backgroundColor: c.hex }}
                                />
                                <div className="min-w-0 flex-1">
                                  <span className="text-[10px] font-mono font-black text-white block truncate uppercase">
                                    {c.hex}
                                  </span>
                                  <span className="text-[9px] text-slate-300 block truncate font-medium">
                                    {c.name || `Cor ${i + 1}`}
                                  </span>
                                </div>
                              </div>
                              {isCopied && (
                                <div className="absolute inset-0 bg-emerald-600/90 flex items-center justify-center gap-1 text-[10px] font-black text-white animate-in fade-in">
                                  <Check className="w-3 h-3 stroke-[3]" />
                                  <span>Copiado!</span>
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div
                        onClick={() => {
                          setEditingProject(client);
                          setIsNewProjectModalOpen(true);
                        }}
                        className="p-3 bg-[#1C1C1C]/60 border border-dashed border-[#2E2E2E] hover:border-[#E4007E] rounded-xl text-center cursor-pointer transition-colors"
                      >
                        <span className="text-xs font-semibold text-slate-300 hover:text-white">
                          + Adicionar cores da marca
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer Actions: Manual da Marca, Pack de Logos & Tipografia */}
                <div className="space-y-2 pt-4 border-t border-[#222222]">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {/* Botão 1: Manual da Marca */}
                    {hasManual ? (
                      <a
                        href={client.brandManualUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2.5 bg-[#1C1C1C] hover:bg-[#262626] text-white border border-[#2E2E2E] hover:border-amber-500/60 rounded-xl text-xs font-bold transition-all flex items-center justify-between group/link"
                        title="Abrir Manual da Marca"
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <BookOpen className="w-4 h-4 text-amber-400 shrink-0 group-hover/link:scale-110 transition-transform" />
                          <span className="truncate text-white">Manual</span>
                        </div>
                        <ExternalLink className="w-3 h-3 text-slate-400 group-hover/link:text-white shrink-0 ml-1" />
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingProject(client);
                          setIsNewProjectModalOpen(true);
                        }}
                        className="px-3 py-2.5 bg-[#1C1C1C]/40 hover:bg-[#1C1C1C] text-slate-400 hover:text-white border border-dashed border-[#2E2E2E] rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Manual</span>
                      </button>
                    )}

                    {/* Botão 2: Pack de Logos */}
                    {hasLogos ? (
                      <a
                        href={client.logosPackUrl || client.logoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2.5 bg-[#1C1C1C] hover:bg-[#262626] text-white border border-[#2E2E2E] hover:border-blue-500/60 rounded-xl text-xs font-bold transition-all flex items-center justify-between group/link"
                        title="Abrir Pack de Logos"
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <FolderArchive className="w-4 h-4 text-blue-400 shrink-0 group-hover/link:scale-110 transition-transform" />
                          <span className="truncate text-white">Logos</span>
                        </div>
                        <ExternalLink className="w-3 h-3 text-slate-400 group-hover/link:text-white shrink-0 ml-1" />
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingProject(client);
                          setIsNewProjectModalOpen(true);
                        }}
                        className="px-3 py-2.5 bg-[#1C1C1C]/40 hover:bg-[#1C1C1C] text-slate-400 hover:text-white border border-dashed border-[#2E2E2E] rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Logos</span>
                      </button>
                    )}

                    {/* Botão 3: Tipografia */}
                    {hasTypography ? (
                      client.typographyUrl!.startsWith('http') || client.typographyUrl!.startsWith('www') ? (
                        <a
                          href={client.typographyUrl!.startsWith('www') ? `https://${client.typographyUrl}` : client.typographyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-2.5 bg-[#1C1C1C] hover:bg-[#262626] text-white border border-[#2E2E2E] hover:border-emerald-500/60 rounded-xl text-xs font-bold transition-all flex items-center justify-between group/link"
                          title="Abrir Tipografia Oficial"
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Type className="w-4 h-4 text-emerald-400 shrink-0 group-hover/link:scale-110 transition-transform" />
                            <span className="truncate text-white">Tipografia</span>
                          </div>
                          <ExternalLink className="w-3 h-3 text-slate-400 group-hover/link:text-white shrink-0 ml-1" />
                        </a>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            if (navigator.clipboard && window.isSecureContext) {
                              navigator.clipboard.writeText(client.typographyUrl!);
                            }
                            addToast('Tipografia Copiada!', `Fonte "${client.typographyUrl}" copiada.`, 'info');
                          }}
                          className="px-3 py-2.5 bg-[#1C1C1C] hover:bg-[#262626] text-white border border-[#2E2E2E] hover:border-emerald-500/60 rounded-xl text-xs font-bold transition-all flex items-center justify-between group/link cursor-pointer"
                          title={`Fonte: ${client.typographyUrl}`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Type className="w-4 h-4 text-emerald-400 shrink-0 group-hover/link:scale-110 transition-transform" />
                            <span className="truncate text-white" title={client.typographyUrl}>
                              {client.typographyUrl}
                            </span>
                          </div>
                        </button>
                      )
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingProject(client);
                          setIsNewProjectModalOpen(true);
                        }}
                        className="px-3 py-2.5 bg-[#1C1C1C]/40 hover:bg-[#1C1C1C] text-slate-400 hover:text-white border border-dashed border-[#2E2E2E] rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Tipografia</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
