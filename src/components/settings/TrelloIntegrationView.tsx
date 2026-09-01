import React, { useState, useEffect, useRef } from 'react';
import {
  Radio,
  ExternalLink,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Plus,
  Trash2,
  ShieldCheck,
  Zap,
  Sliders,
  Bell,
  Building,
  Layers,
  Edit2,
  Tag,
  Palette,
  Check,
  MoveUp,
  MoveDown,
  RotateCcw,
  Sparkles,
  Image as ImageIcon,
  Upload,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { TaskStatus, SpineStatusConfig } from '../../types';
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
  { label: 'Azul Marinho Trello', color: 'text-[#0052CC]', bg: 'bg-blue-100', dotColor: '#0052CC', gradient: 'from-blue-600 to-indigo-700' },
];

export const TrelloIntegrationView: React.FC = () => {
  const {
    trelloSettings,
    updateTrelloSettings,
    testTrelloConnection,
    syncTrelloNow,
    isSyncing,
    addToast,
    clearAllTasks,
    clearTrelloTasks,
    resetSystemKeepCredentials,
    spineStatuses,
    addSpineStatus,
    updateSpineStatus,
    deleteSpineStatus,
    reorderSpineStatuses,
    resetSpineStatusesToDefault,
    loginArtUrl,
    updateLoginArtUrl,
  } = useApp();

  const [activeSettingsTab, setActiveSettingsTab] = useState<'trello' | 'statuses' | 'login_art' | 'general' | 'notifications'>('trello');
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
  const [showApiKey, setShowApiKey] = useState(false);
  const [showToken, setShowToken] = useState(false);

  const [userProfile, setUserProfile] = useState<{
    fullName: string;
    username: string;
    avatarUrl?: string;
    email?: string;
  } | null>(null);

  const fetchUserProfile = async (key: string, token: string) => {
    if (!key || !token) return;
    try {
      const res = await fetch(`https://api.trello.com/1/members/me?key=${key}&token=${token}`);
      if (res.ok) {
        const data = await res.json();
        setUserProfile({
          fullName: data.fullName || data.username || 'Usuário Trello',
          username: data.username || 'trello_user',
          avatarUrl: data.avatarUrl ? `${data.avatarUrl}/170.png` : undefined,
          email: data.email || '',
        });
      } else {
        setUserProfile(null);
      }
    } catch (e) {
      console.warn('Failed to fetch user profile:', e);
      setUserProfile(null);
    }
  };

  // Dynamic Trello Boards & Lists state
  const [availableBoards, setAvailableBoards] = useState<{ id: string; name: string }[]>([]);
  const [availableLists, setAvailableLists] = useState<string[]>([]);
  const [isLoadingBoards, setIsLoadingBoards] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    apiKey: trelloSettings.apiKey || '',
    serverToken: trelloSettings.serverToken || '',
    autoSync: trelloSettings.autoSync,
    syncMemberAssignments: trelloSettings.syncMemberAssignments,
    importLabelsAndTags: trelloSettings.importLabelsAndTags,
    targetBoard: trelloSettings.targetBoard || '',
    boardMappings: [...trelloSettings.boardMappings],
  });

  // Fetch real Trello boards, user profile and lists on component mount or credential change
  useEffect(() => {
    if (formData.apiKey && formData.serverToken) {
      fetchUserProfile(formData.apiKey, formData.serverToken);
      loadBoardsAndListsFromApi(formData.apiKey, formData.serverToken, formData.targetBoard);
    }
  }, []);

  const guessStatusFromListName = (listName: string): TaskStatus => {
    const name = listName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

    // 1. Solicitacoes / Pedidos dos clientes (ex: SOLICITACOES LUVABET, SOLICITACOES F12, etc.) -> BACKLOG
    if (
      name.includes('solicitac') ||
      name.includes('solicita') ||
      name.includes('pedido') ||
      name.includes('backlog') ||
      name.includes('to do') ||
      name.includes('fazer') ||
      name.includes('briefing')
    ) {
      return 'backlog';
    }

    // 2. Colunas de Aprovacao, Postagem ou Conclusao -> DONE / CONCLUIDO
    if (
      name.includes('aprov') ||
      name.includes('postar') ||
      name.includes('postad') ||
      name.includes('done') ||
      name.includes('conclu') ||
      name.includes('finaliz') ||
      name.includes('pronto') ||
      name.includes('publica')
    ) {
      return 'done';
    }

    // 3. Colunas de Correcao / Revisao / QA -> IN_REVIEW
    if (
      name.includes('correc') ||
      name.includes('correcao') ||
      name.includes('ajuste') ||
      name.includes('revis') ||
      name.includes('review') ||
      name.includes('qa') ||
      name.includes('test')
    ) {
      return 'in_review';
    }

    // 4. Colunas nominais dos designers / video makers (ex: FELIPE, DAIANE, MARQUES, GERDESON, RAFAEL, MATHEUS, DAVI...) -> IN_PROGRESS
    const memberKeywords = ['felipe', 'dai', 'daiane', 'marques', 'bismarques', 'gerdeson', 'gerdson', 'gerson', 'rafael', 'matheus', 'davi', 'marcos'];
    if (memberKeywords.some((kw) => name.includes(kw))) {
      return 'in_progress';
    }

    if (
      name.includes('progress') ||
      name.includes('doing') ||
      name.includes('fazendo') ||
      name.includes('andamento') ||
      name.includes('execu')
    ) {
      return 'in_progress';
    }

    if (name.includes('overdue') || name.includes('atras')) {
      return 'overdue';
    }
    if (name.includes('block') || name.includes('bloq')) {
      return 'blocked';
    }

    return 'backlog';
  };

  const autoGenerateMappingsFromLists = (lists: string[], forceOverwrite: boolean = false) => {
    if (!lists || lists.length === 0) return;
    
    // Se forceOverwrite for false e já existirem mapeamentos salvos, preserva os mapeamentos do usuário e apenas adiciona novas listas se faltarem
    if (!forceOverwrite && trelloSettings.boardMappings && trelloSettings.boardMappings.length > 0) {
      const existing = [...trelloSettings.boardMappings];
      const existingListNames = new Set(existing.map((r) => r.trelloList.toLowerCase()));
      
      const missingLists = lists.filter((l) => !existingListNames.has(l.toLowerCase()));
      if (missingLists.length > 0) {
        const appended = missingLists.map((listName, idx) => ({
          id: `rule-auto-${idx}-${Date.now()}`,
          trelloList: listName,
          spineStatus: guessStatusFromListName(listName),
        }));
        const combined = [...existing, ...appended];
        setFormData((prev) => ({
          ...prev,
          boardMappings: combined,
        }));
        updateTrelloSettings({ boardMappings: combined });
      } else {
        setFormData((prev) => ({
          ...prev,
          boardMappings: existing,
        }));
      }
      return;
    }

    const newRules = lists.map((listName, idx) => ({
      id: `rule-auto-${idx}-${Date.now()}`,
      trelloList: listName,
      spineStatus: guessStatusFromListName(listName),
    }));
    setFormData((prev) => ({
      ...prev,
      boardMappings: newRules,
    }));
    updateTrelloSettings({ boardMappings: newRules });
  };

  const loadBoardsAndListsFromApi = async (apiKey: string, token: string, targetBoardNameOrId?: string) => {
    if (!apiKey || !token) return;
    setIsLoadingBoards(true);
    try {
      // 1. Fetch user's real boards from Trello API
      const res = await fetch(
        `https://api.trello.com/1/members/me/boards?key=${apiKey}&token=${token}&fields=id,name`
      );
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const realBoards: { id: string; name: string }[] = data.map((b: { id: string; name: string }) => ({
            id: b.id,
            name: b.name,
          }));
          setAvailableBoards(realBoards);

          // Find target board
          const selectedNameOrId = targetBoardNameOrId || formData.targetBoard;
          let activeBoardObj = realBoards.find(
            (b) => b.id === selectedNameOrId || b.name.toLowerCase() === selectedNameOrId.toLowerCase()
          );
          if (!activeBoardObj) {
            activeBoardObj = realBoards[0];
          }

          setFormData((prev) => ({ ...prev, targetBoard: activeBoardObj.name }));

          // 2. Fetch real lists for this board from Trello API
          const listsRes = await fetch(
            `https://api.trello.com/1/boards/${activeBoardObj.id}/lists?key=${apiKey}&token=${token}&fields=id,name`
          );
          if (listsRes.ok) {
            const listsData = await listsRes.json();
            if (Array.isArray(listsData) && listsData.length > 0) {
              const realListNames = listsData.map((l: { name: string }) => l.name);
              setAvailableLists(realListNames);
              // Não sobrescreve os mapeamentos que o usuário já escolheu e salvou
              autoGenerateMappingsFromLists(realListNames, false);
              return;
            }
          }
        }
      }
    } catch (err) {
      console.error('Trello API fetch failed:', err);
    } finally {
      setIsLoadingBoards(false);
    }
  };

  const handleTestConnection = async () => {
    const success = await testTrelloConnection();
    if (formData.apiKey && formData.serverToken) {
      await loadBoardsAndListsFromApi(formData.apiKey, formData.serverToken, formData.targetBoard);
    }
  };

  const handleSave = () => {
    updateTrelloSettings(formData);
  };

  const handleSyncClick = async () => {
    // Salva automaticamente as opções do formulário antes de sincronizar
    updateTrelloSettings(formData);
    await syncTrelloNow();
  };

  const handleBoardChange = (newBoard: string) => {
    const nextFormData = {
      ...formData,
      targetBoard: newBoard,
    };
    setFormData(nextFormData);
    updateTrelloSettings({ targetBoard: newBoard });
    if (formData.apiKey && formData.serverToken) {
      loadBoardsAndListsFromApi(formData.apiKey, formData.serverToken, newBoard);
    }
  };

  const handleAddRule = () => {
    const defaultList = availableLists[0] || 'To Do';
    const newRule = {
      id: `rule-${Date.now()}`,
      trelloList: defaultList,
      spineStatus: 'in_review' as TaskStatus,
    };
    const nextRules = [...formData.boardMappings, newRule];
    setFormData((prev) => ({
      ...prev,
      boardMappings: nextRules,
    }));
    updateTrelloSettings({ boardMappings: nextRules });
  };

  const handleRemoveRule = (id: string) => {
    const nextRules = formData.boardMappings.filter((r) => r.id !== id);
    setFormData((prev) => ({
      ...prev,
      boardMappings: nextRules,
    }));
    updateTrelloSettings({ boardMappings: nextRules });
  };

  const handleUpdateRule = (id: string, field: 'trelloList' | 'spineStatus', value: string) => {
    const nextRules = formData.boardMappings.map((r) =>
      r.id === id ? { ...r, [field]: value } : r
    );
    setFormData((prev) => ({
      ...prev,
      boardMappings: nextRules,
    }));
    // Salva imediatamente no localStorage/AppContext para nunca se perder
    updateTrelloSettings({ boardMappings: nextRules });
  };

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
            Gerencie os status das demandas, personalize a tela de login e configure preferências do sistema.
          </p>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveSettingsTab('statuses')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer ${activeSettingsTab === 'statuses'
            ? 'bg-indigo-950/80 text-indigo-300 border border-indigo-500/50 shadow-xs'
            : 'text-slate-400 hover:text-white hover:bg-[#181818]'
            }`}
        >
          <Layers className="w-4 h-4 text-indigo-400" />
          <span>Status do Spine ({spineStatuses.length})</span>
        </button>
        <button
          onClick={() => setActiveSettingsTab('login_art')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer ${activeSettingsTab === 'login_art'
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
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer ${activeSettingsTab === 'general'
            ? 'bg-[#222222] text-sky-300 border border-sky-500/50 shadow-xs'
            : 'text-slate-400 hover:text-white hover:bg-[#181818]'
            }`}
        >
          <Building className="w-4 h-4 text-sky-400" />
          <span>Workspace / Empresa</span>
        </button>
        <button
          onClick={() => setActiveSettingsTab('notifications')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer ${activeSettingsTab === 'notifications'
            ? 'bg-[#222222] text-sky-300 border border-sky-500/50 shadow-xs'
            : 'text-slate-400 hover:text-white hover:bg-[#181818]'
            }`}
        >
          <Bell className="w-4 h-4 text-sky-400" />
          <span>Alertas & Notificações</span>
        </button>
      </div>

      {activeSettingsTab === 'statuses' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Header Card */}
          <div className="bg-[#181818] rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-6 text-white">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
              <div>
                <h3 className="font-extrabold text-white text-lg flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-400" />
                  <span>Gerenciador de Status do Spine</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1 font-medium">
                  Crie, edite, reorganize e personalize seus próprios status e colunas do Kanban.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Deseja restaurar a lista de status para a configuração padrão do Spine?')) {
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
                  Ex: "Aguardando Cliente", "Design em Aprovação", etc.
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
                    className={`px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1.5 ${COLOR_PALETTES[selectedPaletteIdx].bg
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
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl border transition-all ${isEditing
                        ? 'bg-indigo-950/60 border-indigo-500 ring-2 ring-indigo-500/20'
                        : 'bg-[#222222] hover:bg-[#012247] border-slate-800'
                      }`}
                  >
                    {isEditing ? (
                      /* Inline Editing View */
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
                      /* Display View */
                      <>
                        <div className="flex items-center gap-3">
                          {/* Order index */}
                          <span className="w-6 h-6 rounded-lg bg-[#181818] border border-slate-700 text-slate-400 text-[11px] font-extrabold flex items-center justify-center shadow-xs">
                            {index + 1}
                          </span>

                          {/* Status Badge */}
                          <span
                            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-2 border border-white/5 shadow-xs ${st.bg || 'bg-slate-800'
                              } ${st.color || 'text-white'}`}
                          >
                            <span
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: st.dotColor || '#64748B' }}
                            />
                            {st.label}
                          </span>

                          <span className="text-[11px] font-mono text-slate-400">
                            id: {st.id}
                          </span>

                          {st.isDefault && (
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700">
                              Padrão
                            </span>
                          )}
                        </div>

                        {/* Actions: Reorder & Edit & Delete */}
                        <div className="flex items-center gap-1">
                          {/* Move Up */}
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

                          {/* Move Down */}
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

                          {/* Edit */}
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

                          {/* Delete */}
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

      {activeSettingsTab === 'login_art' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Card Principal: Upload e Gerenciamento */}
          <div className="bg-[#181818] rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-6 text-white">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
              <div>
                <h3 className="font-extrabold text-white text-lg flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-[#FFB903]" />
                  <span>Arte da Tela de Login (Coluna Direita)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1 font-medium">
                  Personalize a imagem que aparece no lado direito da tela de autenticação do sistema Spine.
                </p>
              </div>

              {/* Botões de Ação */}
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

            {/* Dicas & Dimensões Recomendadas */}
            <div className="p-4 bg-gradient-to-r from-[#E4007E]/10 to-[#E94E18]/10 border border-[#E4007E]/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-pink-200">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#E4007E] to-[#E94E18] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white">Dimensões Recomendadas para Designers</h4>
                  <p className="text-[11px] text-pink-200/80 font-medium">
                    Proporção vertical <strong className="font-black text-white">8:9</strong> ou resolução <strong className="font-black text-white">1920 × 2160 px</strong> (Full HD: <strong className="font-black text-white">960 × 1080 px</strong>). Formatos: PNG, JPG, WebP ou SVG.
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 bg-gradient-to-r from-[#E4007E] to-[#E94E18] text-white text-[11px] font-black rounded-lg shrink-0 shadow-xs">
                1920 × 2160 px
              </span>
            </div>

            {/* Grid: Upload / URL + Live Simulator Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Coluna Esquerda: Upload e Inputs (7 cols) */}
              <div className="lg:col-span-6 space-y-5">
                {/* Drag & Drop Upload Zone */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-200 mb-2">
                    1. Enviar Arquivo de Imagem
                  </label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      // Check file size (up to 20MB)
                      if (file.size > 20 * 1024 * 1024) {
                        addToast('Arquivo muito grande', 'Por favor selecione uma imagem de até 20MB.', 'error');
                        return;
                      }

                      setIsUploadingArt(true);
                      try {
                        const optimizedDataUrl = await compressImageFile(file, 1920, 2160, 0.92);
                        setTempLoginArtUrl(optimizedDataUrl);
                        updateLoginArtUrl(optimizedDataUrl);
                        addToast('Arte Salva com Sucesso! 🖼️', 'A imagem foi salva permanentemente no sistema e não sumirá ao recarregar a página.', 'success');
                      } catch (err) {
                        console.error('Error optimizing image:', err);
                        addToast('Erro no Upload ⚠️', 'Falha ao processar a imagem. Tente novamente.', 'error');
                      } finally {
                        setIsUploadingArt(false);
                      }
                    }}
                  />

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-700 hover:border-[#FFB903] bg-[#222222] hover:bg-[#012247] rounded-2xl p-6 text-center cursor-pointer transition-all group shadow-inner"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-[#181818] shadow-xs border border-slate-700 flex items-center justify-center mx-auto mb-3 text-slate-400 group-hover:text-[#FFB903] group-hover:scale-110 transition-all">
                      <Upload className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-bold text-white">
                      Clique para selecionar a imagem do computador
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1 font-medium">
                      Suporta PNG, JPG, JPEG, WEBP ou SVG (Até 15MB)
                    </p>
                  </div>
                </div>

                {/* Ou Colar URL Direta */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-200 mb-2">
                    2. Ou Cole o Link / URL Direto da Imagem
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="https://exemplo.com/minha-arte-login.png"
                      value={tempLoginArtUrl.startsWith('data:') ? '' : tempLoginArtUrl}
                      onChange={(e) => setTempLoginArtUrl(e.target.value)}
                      className="flex-1 p-3 text-xs bg-[#181818] border border-slate-700 rounded-xl font-medium focus:outline-none focus:border-[#FFB903] text-white placeholder-slate-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (tempLoginArtUrl) {
                          updateLoginArtUrl(tempLoginArtUrl);
                          addToast('URL Aplicada!', 'A nova imagem foi salva com sucesso.', 'success');
                        }
                      }}
                      className="px-4 py-2.5 bg-[#222222] hover:bg-[#012247] border border-slate-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0"
                    >
                      Aplicar URL
                    </button>
                  </div>
                  {tempLoginArtUrl.startsWith('data:') && (
                    <span className="text-[11px] text-emerald-400 font-semibold mt-1.5 block">
                      ✓ Imagem carregada do computador (armazenada localmente com sucesso)
                    </span>
                  )}
                </div>

                {/* Status da Imagem Atual */}
                <div className="p-4 bg-[#222222] rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${tempLoginArtUrl ? 'bg-emerald-400 shadow-xs' : 'bg-slate-500'}`} />
                    <div>
                      <span className="text-xs font-bold text-white block">
                        {tempLoginArtUrl ? 'Arte Personalizada Ativa' : 'Arte Padrão do Sistema (Ondas e Geometria)'}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {tempLoginArtUrl ? 'Exibindo imagem enviada' : 'Nenhuma imagem enviada ainda'}
                      </span>
                    </div>
                  </div>

                  {tempLoginArtUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setTempLoginArtUrl('');
                        updateLoginArtUrl('');
                        addToast('Removido', 'A arte personalizada foi removida.', 'info');
                      }}
                      className="text-xs text-rose-400 font-bold hover:underline cursor-pointer"
                    >
                      Remover
                    </button>
                  )}
                </div>
              </div>

              {/* Coluna Direita: Live Simulator Preview (6 cols) */}
              <div className="lg:col-span-6 space-y-2">
                <label className="block text-xs font-extrabold text-slate-200">
                  Pré-visualização da Tela de Login (Live Preview)
                </label>

                {/* Mockup Frame da Tela de Login */}
                <div className="w-full aspect-[16/9] rounded-2xl overflow-hidden border border-slate-700 shadow-2xl bg-[#000A17] flex relative select-none">
                  {/* Left Mockup: Form Preview */}
                  <div className="w-1/2 p-4 sm:p-5 flex flex-col justify-between z-10 bg-[#000A17]">
                    <div className="flex items-center gap-2">
                      <img src="/logo.png" alt="Logo" className="h-4 sm:h-5 object-contain" />
                    </div>

                    <div className="space-y-2 my-auto max-w-[140px] w-full">
                      <div className="h-4 bg-slate-800/80 rounded border-b border-slate-700 w-full" />
                      <div className="h-4 bg-slate-800/80 rounded border-b border-slate-700 w-full" />
                      <div className="h-5 bg-[#FFB903] rounded-md w-full mt-2" />
                    </div>

                    <span className="text-[8px] text-slate-500 font-medium">© 2026 RioSãoPaulo</span>
                  </div>

                  {/* Right Mockup: Art Panel Preview */}
                  <div className="w-1/2 relative overflow-hidden bg-gradient-to-br from-[#001D40] via-[#00142D] to-[#000A17] flex items-center justify-center">
                    {tempLoginArtUrl ? (
                      <img
                        src={tempLoginArtUrl}
                        alt="Preview Arte"
                        className="w-full h-full object-cover object-center animate-in fade-in duration-300"
                      />
                    ) : (
                      <div className="relative w-full h-full flex items-center justify-center">
                        <div className="w-14 h-14 rounded-full border-2 border-[#245D99]/40 flex items-center justify-center">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#000A17] to-[#0A325C]/70 shadow-lg" />
                        </div>
                        <span className="absolute text-[#245D99]/50 text-xl top-4 right-6">+</span>
                        <span className="absolute text-[#245D99]/50 text-base bottom-4 left-6">+</span>
                      </div>
                    )}

                    {/* Organic Wave Border SVG in Mockup */}
                    <svg
                      className="absolute -left-0.5 top-0 h-full w-8 z-20 text-[#000A17] pointer-events-none"
                      viewBox="0 0 100 100"
                      preserveAspectRatio="none"
                    >
                      <path
                        d="M0,0 L40,0 Q10,35 60,65 Q95,90 40,100 L0,100 Z"
                        fill="currentColor"
                      />
                    </svg>

                    {/* Badge */}
                    <div className="absolute bottom-2 right-2 bg-[#000A17]/80 backdrop-blur-xs px-2 py-0.5 rounded-md border border-slate-800 text-[8px] font-bold text-white flex items-center gap-1">
                      <Sparkles className="w-2 h-2 text-[#FFB903]" />
                      <span>RioSãoPaulo</span>
                    </div>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 text-center pt-1 font-medium">
                  A imagem é redimensionada e ajustada proporcionalmente na tela de login real.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSettingsTab === 'general' && (
        <div className="bg-[#181818] rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-6 text-white animate-in fade-in duration-200">
          <div className="pb-3 border-b border-slate-800">
            <h3 className="font-extrabold text-white text-lg flex items-center gap-2">
              <Building className="w-5 h-5 text-sky-400" />
              <span>Configurações do Workspace</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">Configure o nome da organização, moeda e cadência de sprints.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Nome da Organização</label>
              <input
                type="text"
                defaultValue="Spine Global Engineering"
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
