import React, { useState, useEffect, useMemo } from 'react';
import {
  Image as ImageIcon,
  Search,
  ExternalLink,
  Download,
  FolderOpen,
  RefreshCw,
  Plus,
  Eye,
  X,
  FileImage,
  Film,
  Link2,
  Trash2,
  Tag,
  Building2,
  Copy,
  Check,
} from 'lucide-react';
import { useApp, useProjects } from '../../context/AppContext';
import { Project } from '../../types';
import {
  fetchDriveItemsFromLink,
  extractDriveFileOrFolderId,
  DriveFileItem,
  getValidAccessToken,
} from '../../lib/googleDrive';
import { Button, Input, Modal } from '../ui';

interface KvDriveEntry {
  id: string;
  clientId: string;
  clientName: string;
  clientLogo?: string;
  title: string;
  url: string;
  isFolder: boolean;
  createdAt?: string;
  files: DriveFileItem[];
}

export const KvsView: React.FC = () => {
  const { projects, updateProject } = useProjects();
  const { currentUser, isManagerOrAdmin, addToast } = useApp();
  const canManage = isManagerOrAdmin(currentUser);

  // Filtrar apenas clientes válidos
  const clients = useMemo(() => {
    return projects.filter(
      (p) =>
        p.id !== 'system-settings' &&
        p.id !== 'google-drive-token' &&
        !p.id.startsWith('system-') &&
        !p.id.startsWith('google-') &&
        p.category?.toLowerCase() !== 'system' &&
        (p.status as any) !== 'system'
    );
  }, [projects]);

  // Estados de seleção e filtros
  const [selectedClientId, setSelectedClientId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [kvEntries, setKvEntries] = useState<KvDriveEntry[]>([]);

  // Lightbox modal para imagem expandida
  const [activeLightboxItem, setActiveLightboxItem] = useState<{
    name: string;
    url: string;
    clientName: string;
    driveUrl?: string;
  } | null>(null);

  // Modal para adicionar um novo link de KV
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newKvClientId, setNewKvClientId] = useState('');
  const [newKvTitle, setNewKvTitle] = useState('');
  const [newKvDriveUrl, setNewKvDriveUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Carrega todos os links e consulta as prévias no Google Drive
  const loadKvsData = async (interactive: boolean = false) => {
    setLoadingEntries(true);
    try {
      const token = (await getValidAccessToken(undefined, interactive)) || undefined;
      const entriesList: KvDriveEntry[] = [];

      for (const client of clients) {
        // 1. Links múltiplos da lista kvDriveItems
        const items = client.kvDriveItems || [];

        // 2. Se também houver um link único legado (kvDriveUrl), inclui se não estiver na lista
        const allClientUrls = [...items];
        if (client.kvDriveUrl && !items.some((it) => it.url === client.kvDriveUrl)) {
          allClientUrls.unshift({
            id: `legacy-${client.id}`,
            title: `Pasta Principal - ${client.name}`,
            url: client.kvDriveUrl,
          });
        }

        // Buscar arquivos de cada link cadastrado
        for (const item of allClientUrls) {
          if (!item.url) continue;
          try {
            const { files, isFolder } = await fetchDriveItemsFromLink(item.url, token);
            entriesList.push({
              id: item.id,
              clientId: client.id,
              clientName: client.name,
              clientLogo: client.logoUrl,
              title: item.title || (isFolder ? 'Pasta de KVs' : 'Key Visual'),
              url: item.url,
              isFolder,
              createdAt: item.createdAt,
              files,
            });
          } catch (e) {
            console.warn(`Erro ao carregar link de KV para ${client.name}:`, e);
          }
        }
      }

      setKvEntries(entriesList);
      try {
        localStorage.setItem('spine_kvs_cache_entries', JSON.stringify(entriesList));
      } catch {}
    } catch (err) {
      console.error('Erro ao listar KVs:', err);
    } finally {
      setLoadingEntries(false);
    }
  };

  // Carrega cache imediato na inicialização
  useEffect(() => {
    try {
      const cached = localStorage.getItem('spine_kvs_cache_entries');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setKvEntries(parsed);
        }
      }
    } catch {}
  }, []);

  // Monitora alterações nos links de KVs dos clientes
  const clientsKvSignature = useMemo(() => {
    return clients.map((c) => `${c.id}:${c.kvDriveUrl || ''}:${(c.kvDriveItems || []).length}`).join('|');
  }, [clients]);

  useEffect(() => {
    if (clients.length > 0) {
      loadKvsData();
    }
  }, [clientsKvSignature]);

  // Abertura do modal para adicionar link de KV
  const handleOpenAddModal = (clientId?: string) => {
    const defaultClient = clientId || (selectedClientId !== 'all' ? selectedClientId : clients[0]?.id || '');
    setNewKvClientId(defaultClient);
    setNewKvTitle('');
    setNewKvDriveUrl('');
    setIsAddModalOpen(true);
  };

  // Salvar novo link de KV
  const handleSaveKvLink = async () => {
    if (!newKvDriveUrl.trim()) {
      addToast('Link Obrigatório', 'Cole o link do arquivo ou pasta do Google Drive.', 'warning');
      return;
    }

    const client = clients.find((c) => c.id === newKvClientId);
    if (!client) {
      addToast('Cliente Obrigatório', 'Selecione o cliente ao qual pertence o KV.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = (await getValidAccessToken(undefined, false)) || undefined;
      const cleanUrl = newKvDriveUrl.trim();

      // Testa e puxa arquivos do Drive imediatamente
      const { files, isFolder } = await fetchDriveItemsFromLink(cleanUrl, token);

      const newItem = {
        id: `kv-${Date.now()}`,
        title: newKvTitle.trim() || (isFolder ? `Pasta de KVs` : files[0]?.name || 'Key Visual'),
        url: cleanUrl,
        createdAt: new Date().toISOString(),
      };

      const existingItems = client.kvDriveItems || [];
      const updatedItems = [newItem, ...existingItems];

      await updateProject(client.id, {
        kvDriveItems: updatedItems,
      });

      // Atualiza estado local imediatamente
      const newEntry: KvDriveEntry = {
        id: newItem.id,
        clientId: client.id,
        clientName: client.name,
        clientLogo: client.logoUrl,
        title: newItem.title,
        url: cleanUrl,
        isFolder,
        createdAt: newItem.createdAt,
        files,
      };

      setKvEntries((prev) => [newEntry, ...prev]);

      addToast(
        'Key Visual Adicionado!',
        `O link do Drive foi registrado com sucesso para ${client.name}.`,
        'success'
      );
      setIsAddModalOpen(false);
    } catch (e) {
      console.error(e);
      addToast('Erro ao Adicionar', 'Não foi possível registrar o link do Google Drive.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Remover um link de KV
  const handleDeleteKvEntry = async (entry: KvDriveEntry) => {
    if (!confirm(`Deseja remover o Key Visual "${entry.title}" de ${entry.clientName}?`)) {
      return;
    }

    try {
      const client = clients.find((c) => c.id === entry.clientId);
      if (!client) return;

      let updatedItems = (client.kvDriveItems || []).filter((it) => it.id !== entry.id);
      let updates: Partial<Project> = { kvDriveItems: updatedItems };

      // Se for o link legado no campo kvDriveUrl
      if (client.kvDriveUrl === entry.url) {
        updates.kvDriveUrl = '';
      }

      await updateProject(client.id, updates);
      setKvEntries((prev) => prev.filter((it) => it.id !== entry.id));
      addToast('KV Removido', 'O link do Google Drive foi removido.', 'info');
    } catch (err) {
      console.error(err);
      addToast('Erro ao remover', 'Não foi possível remover o item.', 'error');
    }
  };

  // Helper de URL de imagem de alta resolução do Drive
  const getHighResImageUrl = (file: DriveFileItem) => {
    if (file.thumbnailLink) {
      return file.thumbnailLink.replace(/=s\d+.*$/, '=s2000');
    }
    return `https://lh3.googleusercontent.com/d/${file.id}`;
  };

  // Formatação de bytes
  const formatFileSize = (bytesStr?: string) => {
    if (!bytesStr) return '';
    const bytes = parseInt(bytesStr, 10);
    if (isNaN(bytes)) return '';
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${bytes} B`;
  };

  const handleCopyLink = async (url: string, id: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
      addToast('Link copiado!', 'Link do Google Drive copiado para a área de transferência.', 'success');
    } catch {}
  };

  // Filtragem dos entries
  const filteredEntries = useMemo(() => {
    return kvEntries.filter((entry) => {
      const matchesClient = selectedClientId === 'all' || entry.clientId === selectedClientId;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchesClient;

      const matchesSearch =
        entry.title.toLowerCase().includes(q) ||
        entry.clientName.toLowerCase().includes(q) ||
        entry.files.some((f) => f.name.toLowerCase().includes(q));

      return matchesClient && matchesSearch;
    });
  }, [kvEntries, selectedClientId, searchQuery]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Principal */}
      <div className="bg-[#141414] border border-[#262626] rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-gradient-to-br from-[#E4007E]/10 to-[#E94E18]/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#E4007E] to-[#E94E18] flex items-center justify-center text-white shadow-lg shadow-[#E4007E]/20 shrink-0">
              <ImageIcon className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                Key Visuals (KV)
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#242424] text-slate-300 font-semibold border border-[#333333]">
                  {filteredEntries.length} {filteredEntries.length === 1 ? 'KV cadastrado' : 'KVs cadastrados'}
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Adicione qualquer link de arquivo ou pasta do Google Drive para visualizar a prévia e baixar
              </p>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={loadKvsData}
              disabled={loadingEntries}
              className="px-3.5 py-2 rounded-xl bg-[#1C1C1C] border border-[#2B2B2B] hover:border-[#3D3D3D] text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-sm active:scale-95 disabled:opacity-50"
              title="Recarregar e sincronizar prévias do Google Drive"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingEntries ? 'animate-spin text-[#E4007E]' : ''}`} />
              <span>Sincronizar</span>
            </button>

            <Button
              onClick={() => handleOpenAddModal()}
              variant="primary"
              size="sm"
              className="flex items-center gap-1.5 bg-gradient-to-r from-[#E4007E] to-[#E94E18] text-white hover:opacity-95 shadow-lg shadow-[#E4007E]/20 text-xs px-4 py-2 rounded-xl font-bold"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar Link de KV</span>
            </Button>
          </div>
        </div>

        {/* Barra de Filtros e Busca */}
        <div className="mt-6 pt-5 border-t border-[#242424] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Pílulas de Clientes */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full scrollbar-none">
            <button
              onClick={() => setSelectedClientId('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
                selectedClientId === 'all'
                  ? 'bg-white text-black shadow-md'
                  : 'bg-[#1C1C1C] text-slate-400 hover:text-white border border-[#2A2A2A]'
              }`}
            >
              Todos os Clientes
            </button>
            {clients.map((client) => {
              const count = kvEntries.filter((e) => e.clientId === client.id).length;
              return (
                <button
                  key={client.id}
                  onClick={() => setSelectedClientId(client.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap shrink-0 flex items-center gap-2 ${
                    selectedClientId === client.id
                      ? 'bg-gradient-to-r from-[#E4007E] to-[#E94E18] text-white shadow-md shadow-[#E4007E]/25'
                      : 'bg-[#1C1C1C] text-slate-400 hover:text-white border border-[#2A2A2A]'
                  }`}
                >
                  {client.logoUrl ? (
                    <img src={client.logoUrl} alt="" className="w-3.5 h-3.5 object-contain rounded-sm" />
                  ) : null}
                  <span>{client.name}</span>
                  {count > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        selectedClientId === client.id ? 'bg-black/30 text-white' : 'bg-[#2A2A2A] text-slate-300'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Campo de Busca */}
          <div className="relative min-w-[240px] max-w-sm shrink-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por peça, campanha ou cliente..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#181818] border border-[#2B2B2B] focus:border-[#E4007E] rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* Lista de Key Visuals */}
      {loadingEntries ? (
        <div className="p-16 text-center bg-[#141414] border border-dashed border-[#262626] rounded-3xl space-y-4">
          <RefreshCw className="w-8 h-8 text-[#E4007E] animate-spin mx-auto" />
          <p className="text-sm font-semibold text-white">Carregando Key Visuals e prévias do Drive...</p>
          <p className="text-xs text-slate-500">Conectando aos links e renderizando miniaturas.</p>
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="p-16 text-center bg-[#141414] border border-dashed border-[#2E2E2E] rounded-3xl space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#1C1C1C] border border-[#2B2B2B] flex items-center justify-center mx-auto text-slate-500">
            <ImageIcon className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">Nenhum Key Visual encontrado</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              {searchQuery
                ? 'Nenhum resultado corresponde à sua pesquisa.'
                : 'Adicione links de arquivos ou pastas do Google Drive para que as prévias apareçam aqui.'}
            </p>
          </div>

          <Button
            onClick={() => handleOpenAddModal(selectedClientId !== 'all' ? selectedClientId : undefined)}
            variant="primary"
            size="sm"
            className="mt-2 bg-gradient-to-r from-[#E4007E] to-[#E94E18] text-white text-xs px-4 py-2 rounded-xl font-bold inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Link do Google Drive</span>
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {filteredEntries.map((entry) => {
            const hasMultipleFiles = entry.files && entry.files.length > 1;

            return (
              <div
                key={entry.id}
                className="bg-[#141414] border border-[#262626] rounded-3xl p-5 sm:p-6 shadow-xl space-y-5"
              >
                {/* Cabeçalho do Entry */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#242424] pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#1C1C1C] border border-[#2E2E2E] flex items-center justify-center overflow-hidden shrink-0 p-1.5 shadow">
                      {entry.clientLogo ? (
                        <img src={entry.clientLogo} alt="" className="w-full h-full object-contain" />
                      ) : (
                        <Building2 className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-bold text-[#E4007E] uppercase tracking-wider">
                          {entry.clientName}
                        </span>
                        {entry.isFolder && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
                            Pasta do Drive ({entry.files.length} {entry.files.length === 1 ? 'item' : 'itens'})
                          </span>
                        )}
                      </div>
                      <h2 className="text-base font-bold text-white tracking-tight">{entry.title}</h2>
                    </div>
                  </div>

                  {/* Ações do Link */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => handleCopyLink(entry.url, entry.id)}
                      className="px-2.5 py-1.5 rounded-xl bg-[#1C1C1C] hover:bg-[#252525] border border-[#2B2B2B] text-slate-400 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      title="Copiar link original"
                    >
                      {copiedId === entry.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copiado</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar Link</span>
                        </>
                      )}
                    </button>

                    <a
                      href={entry.url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-[#1F1F1F] hover:bg-[#282828] border border-[#333333] text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Abrir no Drive</span>
                    </a>

                    {canManage && (
                      <button
                        onClick={() => handleDeleteKvEntry(entry)}
                        className="p-1.5 rounded-xl bg-[#1C1C1C] hover:bg-rose-500/10 border border-[#2B2B2B] hover:border-rose-500/30 text-slate-400 hover:text-rose-400 transition-colors"
                        title="Excluir este link de KV"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Arquivos / Prévias Visuais */}
                {entry.files.length === 0 ? (
                  <div className="p-8 text-center bg-[#181818] border border-dashed border-[#2A2A2A] rounded-2xl space-y-3">
                    <p className="text-xs text-slate-400 max-w-lg mx-auto">
                      Esta pasta está protegida no Google Drive ou requer autenticação da conta para listar os arquivos internos.
                    </p>
                    <div className="flex items-center justify-center gap-3 flex-wrap">
                      <button
                        onClick={async () => {
                          const token = await getValidAccessToken(undefined, true);
                          if (token) {
                            loadKvsData(false);
                          }
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#E4007E] to-[#E94E18] text-white text-xs font-bold shadow hover:opacity-95 transition-opacity"
                      >
                        Conectar Google Drive
                      </button>

                      <a
                        href={entry.url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3.5 py-1.5 rounded-xl bg-[#242424] hover:bg-[#303030] text-slate-300 hover:text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                      >
                        <span>Abrir Pasta no Drive</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                    {entry.files.map((file) => {
                      const isImage =
                        file.mimeType.startsWith('image/') ||
                        file.name.match(/\.(jpg|jpeg|png|webp|gif|svg|bmp)$/i);
                      const isPsd =
                        file.name.toLowerCase().endsWith('.psd') ||
                        file.name.toLowerCase().endsWith('.psb') ||
                        file.mimeType.includes('photoshop');
                      const isVideo =
                        file.mimeType.startsWith('video/') ||
                        file.name.match(/\.(mp4|mov|avi|webm)$/i);

                      const highRes = getHighResImageUrl(file);
                      const downloadUrl =
                        file.webContentLink ||
                        `https://drive.google.com/uc?export=download&id=${file.id}`;

                      return (
                        <div
                          key={file.id}
                          className="group/card bg-[#181818] border border-[#2B2B2B] hover:border-[#3D3D3D] rounded-2xl overflow-hidden flex flex-col justify-between transition-all duration-200 shadow hover:shadow-xl hover:-translate-y-0.5"
                        >
                          {/* Área da Prévia */}
                          <div
                            onClick={() => {
                              if (isImage || file.thumbnailLink) {
                                setActiveLightboxItem({
                                  name: file.name,
                                  url: highRes,
                                  clientName: entry.clientName,
                                  driveUrl: file.webViewLink || entry.url,
                                });
                              }
                            }}
                            className={`relative aspect-[16/10] bg-[#121212] overflow-hidden flex items-center justify-center ${
                              isImage || file.thumbnailLink ? 'cursor-zoom-in' : 'cursor-default'
                            }`}
                          >
                            {file.thumbnailLink ? (
                              <img
                                src={highRes}
                                alt={file.name}
                                loading="lazy"
                                className="w-full h-full object-cover transition-transform duration-300 group-hover/card:scale-105"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            ) : isPsd ? (
                              <div className="flex flex-col items-center justify-center gap-1.5 text-blue-400">
                                <FileImage className="w-10 h-10" />
                                <span className="text-[10px] font-bold tracking-wider uppercase bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                                  PSD Photoshop
                                </span>
                              </div>
                            ) : isVideo ? (
                              <div className="flex flex-col items-center justify-center gap-1.5 text-amber-400">
                                <Film className="w-10 h-10" />
                                <span className="text-[10px] font-bold tracking-wider uppercase bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                                  Vídeo
                                </span>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center gap-1.5 text-slate-500">
                                <FileImage className="w-10 h-10" />
                                <span className="text-[11px] font-medium">Arquivo</span>
                              </div>
                            )}

                            {/* Overlay de Zoom ao passar mouse */}
                            {(isImage || file.thumbnailLink) && (
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/card:opacity-100 transition-opacity flex items-center justify-center">
                                <div className="w-9 h-9 rounded-full bg-black/70 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white shadow">
                                  <Eye className="w-4 h-4" />
                                </div>
                              </div>
                            )}

                            {/* Badge PSD se aplicável */}
                            {isPsd && (
                              <div className="absolute top-2.5 right-2.5">
                                <span className="px-1.5 py-0.5 rounded bg-blue-600 text-white text-[10px] font-extrabold uppercase shadow">
                                  PSD
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Informações e Botão de Download */}
                          <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2.5 bg-[#181818]">
                            <div>
                              <h3
                                className="text-xs font-bold text-white truncate hover:text-[#E4007E] transition-colors"
                                title={file.name}
                              >
                                {file.name}
                              </h3>
                              <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                                {file.size && <span>{formatFileSize(file.size)}</span>}
                                {file.createdTime && (
                                  <>
                                    <span>•</span>
                                    <span>{new Date(file.createdTime).toLocaleDateString('pt-BR')}</span>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Botões do Card */}
                            <div className="pt-2 border-t border-[#262626] flex items-center justify-between gap-2">
                              {file.webViewLink ? (
                                <a
                                  href={file.webViewLink}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-2.5 py-1.5 rounded-lg bg-[#202020] hover:bg-[#282828] border border-[#2E2E2E] text-slate-300 hover:text-white text-[11px] font-semibold flex items-center gap-1.5 transition-colors"
                                  title="Abrir no Google Drive"
                                >
                                  <ExternalLink className="w-3 h-3 text-slate-400" />
                                  <span>Drive</span>
                                </a>
                              ) : (
                                <div />
                              )}

                              <a
                                href={downloadUrl}
                                target="_blank"
                                rel="noreferrer"
                                download
                                className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#E4007E] to-[#E94E18] text-white text-[11px] font-bold flex items-center gap-1.5 shadow hover:opacity-95 transition-opacity"
                                title="Baixar Arquivo"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>Baixar</span>
                              </a>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox Modal (Prévia em Alta Resolução) */}
      {activeLightboxItem && (
        <div
          onClick={() => setActiveLightboxItem(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-5xl w-full max-h-[90vh] flex flex-col bg-[#141414] border border-[#2B2B2B] rounded-3xl overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#242424] bg-[#181818]">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#E4007E]">
                  {activeLightboxItem.clientName}
                </span>
                <h3 className="text-sm font-bold text-white truncate max-w-xl">
                  {activeLightboxItem.name}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {activeLightboxItem.driveUrl && (
                  <a
                    href={activeLightboxItem.driveUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-[#242424] hover:bg-[#303030] text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Ver no Drive</span>
                  </a>
                )}
                <button
                  onClick={() => setActiveLightboxItem(null)}
                  className="p-1.5 rounded-xl bg-[#242424] hover:bg-[#303030] text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Imagem Ampliada */}
            <div className="flex-1 bg-black/50 p-4 flex items-center justify-center overflow-auto">
              <img
                src={activeLightboxItem.url}
                alt={activeLightboxItem.name}
                className="max-h-[75vh] w-auto object-contain rounded-lg shadow-2xl"
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal para Adicionar Link de KV */}
      {isAddModalOpen && (
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Adicionar Key Visual (Link do Google Drive)"
        >
          <div className="space-y-4 text-left">
            {/* Seleção do Cliente */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Cliente correspondente
              </label>
              <select
                value={newKvClientId}
                onChange={(e) => setNewKvClientId(e.target.value)}
                className="w-full bg-[#181818] border border-[#2B2B2B] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#E4007E] transition-all"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Título / Campanha */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-blue-400" />
                <span>Título da Peça ou Campanha (Opcional)</span>
              </label>
              <Input
                type="text"
                placeholder="Ex: Campanha de Carnaval, KV Principal 2026..."
                value={newKvTitle}
                onChange={(e) => setNewKvTitle(e.target.value)}
              />
            </div>

            {/* Link do Google Drive */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-[#E4007E]" />
                <span>Link do Google Drive (Arquivo ou Pasta)</span>
              </label>
              <Input
                type="url"
                placeholder="https://drive.google.com/file/d/... ou /folders/..."
                value={newKvDriveUrl}
                onChange={(e) => setNewKvDriveUrl(e.target.value)}
              />
              <p className="text-[11px] text-slate-400 mt-1.5">
                Cole o link de compartilhamento de <strong>um arquivo individual</strong> (imagem, PSD, etc.) ou de uma <strong>pasta inteira</strong> do Google Drive.
              </p>
            </div>

            {/* Rodapé */}
            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#262626] mt-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsAddModalOpen(false)}
                disabled={isSubmitting}
                className="text-slate-400 hover:text-white"
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveKvLink}
                disabled={isSubmitting}
                className="bg-gradient-to-r from-[#E4007E] to-[#E94E18] text-white font-bold px-4 py-2 rounded-xl"
              >
                {isSubmitting ? 'Verificando e Adicionando...' : 'Adicionar Key Visual'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
