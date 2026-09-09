import React, { useState, useEffect, useRef } from 'react';
import {
  Layers,
  Edit2,
  Plus,
  Trash2,
  RotateCcw,
  Check,
  MoveUp,
  MoveDown,
  Sparkles,
  Image as ImageIcon,
  Building,
  Bell,
  Sliders,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SpineStatusConfig } from '../../types';
import { compressImageFile } from '../../lib/imageUtils';

export const COLOR_PALETTES = [
  { label: 'Cinza / Neutro', color: 'text-slate-600', bg: 'bg-slate-100', dotColor: '#64748B', gradient: 'from-slate-500 to-slate-700' },
  { label: 'Índigo / Roxo Real', color: 'text-[#5D55F9]', bg: 'bg-[#ECEBFF]', dotColor: '#5D55F9', gradient: 'from-sky-400 via-blue-500 to-sky-600' },
  { label: 'Azul Celeste / Cyan', color: 'text-[#0284C7]', bg: 'bg-[#E0F2FE]', dotColor: '#0284C7', gradient: 'from-purple-500 to-indigo-600' },
  { label: 'Rosa / Urgente', color: 'text-[#E11D48]', bg: 'bg-[#FFE4E6]', dotColor: '#E11D48', gradient: 'from-rose-500 to-red-600' },
  { label: 'Âmbar / Laranja', color: 'text-amber-600', bg: 'bg-amber-100', dotColor: '#D97706', gradient: 'from-orange-500 to-amber-500' },
  { label: 'Verde Esmeralda', color: 'text-emerald-600', bg: 'bg-emerald-100', dotColor: '#10B981', gradient: 'from-emerald-500 to-green-600' },
  { label: 'Violeta Neon', color: 'text-purple-600', bg: 'bg-purple-100', dotColor: '#9333EA', gradient: 'from-purple-600 to-fuchsia-600' },
  { label: 'Teal Moderno', color: 'text-teal-600', bg: 'bg-teal-100', dotColor: '#0D9488', gradient: 'from-teal-500 to-emerald-600' },
  { label: 'Vermelho Intenso', color: 'text-red-700', bg: 'bg-red-100', dotColor: '#DC2626', gradient: 'from-red-600 to-rose-700' },
];

export const SettingsView: React.FC = () => {
  const {
    addToast,
    spineStatuses,
    addSpineStatus,
    updateSpineStatus,
    deleteSpineStatus,
    reorderSpineStatuses,
    resetSpineStatusesToDefault,
    loginArtUrl,
    updateLoginArtUrl,
  } = useApp();

  const [activeSettingsTab, setActiveSettingsTab] = useState<'statuses' | 'login_art' | 'general' | 'notifications'>('statuses');
  const [tempLoginArtUrl, setTempLoginArtUrl] = useState<string>(loginArtUrl || '');
  const [isUploadingArt, setIsUploadingArt] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTempLoginArtUrl(loginArtUrl || '');
  }, [loginArtUrl]);

  const [newStatusName, setNewStatusName] = useState('');
  const [selectedPaletteIdx, setSelectedPaletteIdx] = useState(0);
  const [editingStatusId, setEditingStatusId] = useState<string | null>(null);
  const [editingStatusLabel, setEditingStatusLabel] = useState('');
  const [editingPaletteIdx, setEditingPaletteIdx] = useState(0);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-[#181818] border border-slate-800 text-[#FFB903] flex items-center justify-center font-black text-sm shadow-md">
              <Sliders className="w-5 h-5" />
            </span>
            <span>Configurações do Sistema</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1.5 font-medium">
            Gerencie os status das demandas, personalize a tela de login e configure preferências da organização.
          </p>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveSettingsTab('statuses')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
            activeSettingsTab === 'statuses'
              ? 'bg-indigo-950/80 text-indigo-300 border border-indigo-500/50 shadow-xs'
              : 'text-slate-400 hover:text-white hover:bg-[#181818]'
          }`}
        >
          <Layers className="w-4 h-4 text-indigo-400" />
          <span>Status do Sistema ({spineStatuses.length})</span>
        </button>

        <button
          onClick={() => setActiveSettingsTab('login_art')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
            activeSettingsTab === 'login_art'
              ? 'bg-amber-950/80 text-[#FFB903] border border-amber-500/50 shadow-xs'
              : 'text-slate-400 hover:text-white hover:bg-[#181818]'
          }`}
        >
          <ImageIcon className="w-4 h-4 text-[#FFB903]" />
          <span>Arte da Tela de Login</span>
          <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-amber-500/20 text-[#FFB903] border border-amber-500/30 font-black">
            NOVO
          </span>
        </button>

        <button
          onClick={() => setActiveSettingsTab('general')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
            activeSettingsTab === 'general'
              ? 'bg-[#222222] text-sky-300 border border-sky-500/50 shadow-xs'
              : 'text-slate-400 hover:text-white hover:bg-[#181818]'
          }`}
        >
          <Building className="w-4 h-4 text-sky-400" />
          <span>Workspace / Empresa</span>
        </button>

        <button
          onClick={() => setActiveSettingsTab('notifications')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
            activeSettingsTab === 'notifications'
              ? 'bg-[#222222] text-sky-300 border border-sky-500/50 shadow-xs'
              : 'text-slate-400 hover:text-white hover:bg-[#181818]'
          }`}
        >
          <Bell className="w-4 h-4 text-sky-400" />
          <span>Alertas & Notificações</span>
        </button>
      </div>

      {/* Tab: Statuses */}
      {activeSettingsTab === 'statuses' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-[#181818] rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-6 text-white">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
              <div>
                <h3 className="font-extrabold text-white text-lg flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-400" />
                  <span>Gerenciador de Status do Kanban</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1 font-medium">
                  Crie, edite, reorganize e personalize os status e colunas do fluxo de demandas.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Deseja restaurar a lista de status para a configuração padrão?')) {
                    resetSpineStatusesToDefault();
                  }
                }}
                className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-[#222222] hover:bg-[#012247] border border-slate-700/80 font-bold px-3.5 py-2 rounded-xl transition-all self-start sm:self-auto shrink-0 cursor-pointer shadow-xs"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                <span>Restaurar Padrão</span>
              </button>
            </div>

            {/* Quick Add Form */}
            <div className="bg-[#222222] border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-xs font-extrabold text-white flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-indigo-400" />
                  <span>Criar Novo Status Personalizado</span>
                </span>
                <span className="text-[11px] font-medium text-slate-400">
                  Ex: "Aguardando Briefing", "Aprovação do Cliente", etc.
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                <div className="md:col-span-6">
                  <label className="block text-[11px] font-bold text-slate-300 mb-1.5">Nome do Status</label>
                  <input
                    type="text"
                    placeholder="Ex: Em Aprovação do Cliente"
                    value={newStatusName}
                    onChange={(e) => setNewStatusName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newStatusName.trim()) {
                        const pal = COLOR_PALETTES[selectedPaletteIdx];
                        addSpineStatus({
                          label: newStatusName.trim(),
                          color: pal.color,
                          bg: pal.bg,
                          dotColor: pal.dotColor,
                          gradient: pal.gradient,
                        });
                        setNewStatusName('');
                      }
                    }}
                    className="w-full px-3.5 py-2.5 bg-[#181818] border border-slate-700 rounded-xl text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:border-[#FFB903] transition-colors"
                  />
                </div>

                <div className="md:col-span-4">
                  <label className="block text-[11px] font-bold text-slate-300 mb-1.5">Estilo / Cor Visual</label>
                  <div className="relative">
                    <select
                      value={selectedPaletteIdx}
                      onChange={(e) => setSelectedPaletteIdx(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-[#181818] border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-[#FFB903] transition-colors cursor-pointer"
                    >
                      {COLOR_PALETTES.map((pal, idx) => (
                        <option key={idx} value={idx} className="bg-[#181818] text-white">
                          🎨 {pal.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <button
                    type="button"
                    disabled={!newStatusName.trim()}
                    onClick={() => {
                      if (!newStatusName.trim()) return;
                      const pal = COLOR_PALETTES[selectedPaletteIdx];
                      addSpineStatus({
                        label: newStatusName.trim(),
                        color: pal.color,
                        bg: pal.bg,
                        dotColor: pal.dotColor,
                        gradient: pal.gradient,
                      });
                      setNewStatusName('');
                    }}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl text-xs font-extrabold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Adicionar</span>
                  </button>
                </div>
              </div>

              {/* Preview badge */}
              {newStatusName.trim() && (
                <div className="pt-2 flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-400">Prévia:</span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1.5 ${
                      COLOR_PALETTES[selectedPaletteIdx].bg
                    } ${COLOR_PALETTES[selectedPaletteIdx].color}`}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: COLOR_PALETTES[selectedPaletteIdx].dotColor }}
                    />
                    {newStatusName.trim()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* List of active statuses */}
          <div className="bg-[#181818] rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-5 text-white">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-slate-800/60">
              <h4 className="text-xs font-black text-slate-300 uppercase tracking-wider">
                Status Ativos no Sistema ({spineStatuses.length})
              </h4>
              <span className="text-[11px] text-slate-400 font-medium">
                Arraste ou use as setas para definir a ordem das colunas no Kanban
              </span>
            </div>

            <div className="space-y-2.5">
              {spineStatuses.map((st, index) => {
                const isEditing = editingStatusId === st.id;

                return (
                  <div
                    key={st.id}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl border transition-all ${
                      isEditing
                        ? 'bg-indigo-950/60 border-indigo-500 ring-2 ring-indigo-500/20'
                        : 'bg-[#222222] hover:bg-[#012247] border-slate-800'
                    }`}
                  >
                    {isEditing ? (
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                        <div className="sm:col-span-5">
                          <label className="block text-[10px] font-bold text-slate-400 mb-0.5">Nome</label>
                          <input
                            type="text"
                            value={editingStatusLabel}
                            onChange={(e) => setEditingStatusLabel(e.target.value)}
                            className="w-full px-3 py-1.5 bg-[#181818] border border-slate-700 rounded-lg text-xs font-bold text-white focus:outline-none focus:border-[#FFB903]"
                          />
                        </div>

                        <div className="sm:col-span-4">
                          <label className="block text-[10px] font-bold text-slate-400 mb-0.5">Paleta de Cores</label>
                          <select
                            value={editingPaletteIdx}
                            onChange={(e) => setEditingPaletteIdx(Number(e.target.value))}
                            className="w-full px-2.5 py-1.5 bg-[#181818] border border-slate-700 rounded-lg text-xs font-bold text-white focus:outline-none focus:border-[#FFB903]"
                          >
                            {COLOR_PALETTES.map((pal, pIdx) => (
                              <option key={pIdx} value={pIdx} className="bg-[#181818] text-white">
                                {pal.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="sm:col-span-3 flex items-center gap-1.5 pt-4 sm:pt-0">
                          <button
                            type="button"
                            onClick={() => {
                              if (!editingStatusLabel.trim()) return;
                              const pal = COLOR_PALETTES[editingPaletteIdx];
                              updateSpineStatus(st.id, {
                                label: editingStatusLabel.trim(),
                                color: pal.color,
                                bg: pal.bg,
                                dotColor: pal.dotColor,
                                gradient: pal.gradient,
                              });
                              setEditingStatusId(null);
                            }}
                            className="flex-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Salvar</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingStatusId(null)}
                            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-lg bg-[#181818] border border-slate-700 text-slate-400 text-[11px] font-extrabold flex items-center justify-center shadow-xs">
                            {index + 1}
                          </span>

                          <span
                            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-2 border border-white/5 shadow-xs ${
                              st.bg || 'bg-slate-800'
                            } ${st.color || 'text-white'}`}
                          >
                            <span
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: st.dotColor || '#64748B' }}
                            />
                            {st.label}
                          </span>

                          {st.isDefault && (
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700">
                              Padrão
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => {
                              if (index === 0) return;
                              const copy = [...spineStatuses];
                              const temp = copy[index - 1];
                              copy[index - 1] = copy[index];
                              copy[index] = temp;
                              reorderSpineStatuses(copy);
                            }}
                            className="p-1.5 text-slate-400 hover:text-white disabled:opacity-25 rounded-lg hover:bg-[#181818] transition-colors cursor-pointer"
                            title="Mover para cima (ordem das colunas)"
                          >
                            <MoveUp className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            disabled={index === spineStatuses.length - 1}
                            onClick={() => {
                              if (index === spineStatuses.length - 1) return;
                              const copy = [...spineStatuses];
                              const temp = copy[index + 1];
                              copy[index + 1] = copy[index];
                              copy[index] = temp;
                              reorderSpineStatuses(copy);
                            }}
                            className="p-1.5 text-slate-400 hover:text-white disabled:opacity-25 rounded-lg hover:bg-[#181818] transition-colors cursor-pointer"
                            title="Mover para baixo (ordem das colunas)"
                          >
                            <MoveDown className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setEditingStatusId(st.id);
                              setEditingStatusLabel(st.label);
                              const matchIdx = COLOR_PALETTES.findIndex(
                                (p) => p.color === st.color || p.bg === st.bg
                              );
                              setEditingPaletteIdx(matchIdx >= 0 ? matchIdx : 0);
                            }}
                            className="p-1.5 text-slate-400 hover:text-indigo-400 rounded-lg hover:bg-[#181818] transition-colors cursor-pointer"
                            title="Editar nome e cor deste status"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (spineStatuses.length <= 1) {
                                alert('Você precisa manter pelo menos 1 status ativo no sistema.');
                                return;
                              }
                              if (
                                window.confirm(
                                  `Tem certeza de que deseja excluir o status "${st.label}"? As tarefas existentes com este status serão migradas para o Backlog.`
                                )
                              ) {
                                deleteSpineStatus(st.id, 'backlog');
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-950/40 transition-colors cursor-pointer"
                            title="Excluir este status"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Login Art */}
      {activeSettingsTab === 'login_art' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-[#181818] rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-6 text-white">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
              <div>
                <h3 className="font-extrabold text-white text-lg flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-[#FFB903]" />
                  <span>Arte da Tela de Login</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1 font-medium">
                  Personalize a imagem que aparece no lado direito da tela de autenticação.
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                {tempLoginArtUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setTempLoginArtUrl('');
                      updateLoginArtUrl('');
                      addToast('Arte Restaurada', 'A imagem padrão do sistema foi restaurada.', 'info');
                    }}
                    className="px-4 py-2 bg-[#222222] hover:bg-rose-950/40 text-slate-300 hover:text-rose-400 border border-slate-700/80 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restaurar Padrão</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    updateLoginArtUrl(tempLoginArtUrl);
                    addToast('Arte Salva!', 'A nova imagem da tela de login foi salva com sucesso.', 'success');
                  }}
                  className="px-5 py-2 bg-gradient-to-r from-[#E4007E] to-[#E94E18] hover:opacity-95 text-white rounded-xl text-xs font-extrabold shadow-sm transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Salvar Imagem</span>
                </button>
              </div>
            </div>

            <div className="p-4 bg-gradient-to-r from-[#E4007E]/10 to-[#E94E18]/10 border border-[#E4007E]/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-pink-200">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#E4007E] to-[#E94E18] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white">Dimensões Recomendadas</h4>
                  <p className="text-[11px] text-pink-200/80 font-medium">
                    Proporção vertical 8:9 ou resolução 1920 × 2160 px. Formatos: PNG, JPG, WebP ou SVG.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-6 space-y-5">
                <div>
                  <label className="block text-xs font-extrabold text-slate-200 mb-2">
                    Enviar Arquivo de Imagem
                  </label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      if (file.size > 20 * 1024 * 1024) {
                        addToast('Arquivo muito grande', 'Por favor selecione uma imagem de até 20MB.', 'error');
                        return;
                      }

                      setIsUploadingArt(true);
                      try {
                        const optimizedDataUrl = await compressImageFile(file, 1920, 2160, 0.92);
                        setTempLoginArtUrl(optimizedDataUrl);
                        updateLoginArtUrl(optimizedDataUrl);
                        addToast('Arte Salva!', 'Imagem atualizada na tela de login.', 'success');
                      } catch (err) {
                        console.error('Error optimizing image:', err);
                        addToast('Erro no Upload ⚠️', 'Falha ao processar a imagem.', 'error');
                      } finally {
                        setIsUploadingArt(false);
                      }
                    }}
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-700 hover:border-[#E4007E] bg-[#222222]/60 hover:bg-[#222222] p-8 rounded-2xl text-center cursor-pointer transition-all group"
                  >
                    <ImageIcon className="w-10 h-10 mx-auto text-slate-400 group-hover:text-[#E4007E] transition-colors mb-2" />
                    <span className="text-xs font-bold text-white block">
                      {isUploadingArt ? 'Processando imagem...' : 'Clique para selecionar arquivo do computador'}
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-1">PNG, JPG, WebP ou SVG até 20MB</span>
                  </div>
                </div>
              </div>

              {/* Preview Container */}
              <div className="lg:col-span-6 flex flex-col items-center">
                <span className="text-xs font-bold text-slate-400 mb-2">Pré-visualização</span>
                <div className="w-full max-w-sm h-64 rounded-2xl overflow-hidden border border-slate-700 bg-black flex items-center justify-center relative">
                  {tempLoginArtUrl ? (
                    <img src={tempLoginArtUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs text-slate-500 font-medium">Nenhuma imagem selecionada</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: General */}
      {activeSettingsTab === 'general' && (
        <div className="bg-[#181818] rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-6 text-white animate-in fade-in duration-200">
          <div className="pb-3 border-b border-slate-800">
            <h3 className="font-extrabold text-white text-lg flex items-center gap-2">
              <Building className="w-5 h-5 text-sky-400" />
              <span>Configurações do Workspace</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">Configure o nome da organização e cadência de sprints.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Nome da Organização</label>
              <input
                type="text"
                defaultValue="Organização Geral"
                className="w-full p-3 text-xs bg-[#222222] border border-slate-700 rounded-xl font-bold text-white focus:outline-none focus:border-[#FFB903]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Cadência de Sprints</label>
              <select className="w-full p-3 text-xs bg-[#222222] border border-slate-700 rounded-xl font-bold text-white focus:outline-none focus:border-[#FFB903] cursor-pointer">
                <option className="bg-[#181818] text-white">2 Semanas (Padrão)</option>
                <option className="bg-[#181818] text-white">1 Semana (Ágil Rápido)</option>
                <option className="bg-[#181818] text-white">1 Mês (Milestone)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Notifications */}
      {activeSettingsTab === 'notifications' && (
        <div className="bg-[#181818] rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-6 text-white animate-in fade-in duration-200">
          <div className="pb-3 border-b border-slate-800">
            <h3 className="font-extrabold text-white text-lg flex items-center gap-2">
              <Bell className="w-5 h-5 text-sky-400" />
              <span>Regras de Webhooks & Notificações</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">Envie alertas automáticos de status para Slack & Discord.</p>
          </div>
          <div className="p-5 bg-[#222222] rounded-2xl border border-slate-800 space-y-2.5">
            <span className="text-xs font-bold text-slate-300 block">URL de Disparo do Slack (Webhook URL)</span>
            <input
              type="text"
              placeholder="https://hooks.slack.com/services/..."
              className="w-full p-3 text-xs bg-[#181818] border border-slate-700 rounded-xl font-mono text-white placeholder-slate-500 focus:outline-none focus:border-[#FFB903]"
            />
          </div>
        </div>
      )}
    </div>
  );
};
