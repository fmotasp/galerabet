import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Search,
  Bell,
  ChevronDown,
  User,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ExternalLink,
  Plus,
  Radio,
  Sun,
  Moon,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const Header: React.FC = () => {
  const {
    setIsMobileSidebarOpen,
    setIsSearchModalOpen,
    setIsNewTaskModalOpen,
    activities,
    setActiveTab,
    trelloSettings,
    currentUser,
    logout,
    isManagerOrAdmin,
  } = useApp();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('spine_dark_mode') === 'true';
  });

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const toggleDarkMode = () => {
    const nextMode = !isDarkMode;
    setIsDarkMode(nextMode);
    localStorage.setItem('spine_dark_mode', String(nextMode));
    if (nextMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-14 px-4 sm:px-8 border-b border-[#262626] bg-[#141414]/90 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between">
      {/* Left section: Hamburger / Toggle */}
      <div className="flex items-center gap-3">
        <button
          id="btn-toggle-menu"
          onClick={() => setIsMobileSidebarOpen(true)}
          className="lg:hidden p-2 rounded-lg text-[#A0A0A0] hover:text-white hover:bg-[#262626] transition-colors duration-150"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Right section: Search, Notifications, Dark Mode, User profile */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Dark Mode Toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-xl text-[#A0A0A0] hover:text-white hover:bg-[#262626] transition-colors duration-150"
          title={isDarkMode ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
        >
          {isDarkMode ? <Sun className="w-5 h-5 text-[#E94E18]" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Quick Search Button */}
        <button
          id="btn-open-search"
          onClick={() => setIsSearchModalOpen(true)}
          className="p-2 rounded-xl text-[#A0A0A0] hover:text-white hover:bg-[#262626] transition-colors duration-150 flex items-center gap-2"
          title="Buscar tarefas, cartões Trello..."
        >
          <Search className="w-5 h-5" />
          <span className="hidden md:inline-block text-xs text-[#808080] bg-[#1C1C1C] px-1.5 py-0.5 rounded border border-[#303030]">
            ⌘K
          </span>
        </button>

        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            id="btn-notifications"
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="p-2 rounded-xl text-[#A0A0A0] hover:text-white hover:bg-[#262626] transition-colors duration-150 relative"
            aria-label="Notificações"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-gradient-to-r from-[#E4007E] to-[#E94E18] rounded-full ring-2 ring-[#101010] animate-pulse" />
          </button>

          {isNotifOpen && (
            <div
              id="notifications-popover"
              className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#1C1C1C] rounded-2xl shadow-xl border border-[#303030] p-4 z-50 animate-in fade-in zoom-in-95 duration-150"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#303030] mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm" style={{ fontFamily: 'var(--font-condensed)' }}>NOTIFICAÇÕES</span>
                  <span className="text-xs bg-gradient-to-r from-[#E4007E]/20 to-[#E94E18]/20 text-[#E4007E] border border-[#E4007E]/30 font-semibold px-2 py-0.5 rounded-full">
                    {activities.length} novas
                  </span>
                </div>
                <button
                  onClick={() => setIsNotifOpen(false)}
                  className="text-xs text-[#808080] hover:text-white transition-colors duration-150"
                >
                  Fechar
                </button>
              </div>

              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {activities.slice(0, 5).map((act) => (
                  <div
                    key={act.id}
                    className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-[#262626] transition-colors duration-150 text-xs"
                  >
                    <div
                      className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                        act.dotColor === 'orange'
                          ? 'bg-[#E94E18]'
                          : act.dotColor === 'green'
                          ? 'bg-[#10B981]'
                          : 'bg-gradient-to-r from-[#E4007E] to-[#E94E18]'
                      }`}
                    />
                    <div className="flex-1">
                      <p className="text-white">
                        <span className="font-semibold">{act.userName}</span> {act.message}
                      </p>
                      <span className="text-[11px] text-[#808080] mt-0.5 block">
                        {act.timeAgo}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-[#303030] mt-3 flex items-center justify-between">
                <button
                  onClick={() => {
                    setIsNotifOpen(false);
                    setActiveTab('tasks');
                  }}
                  className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#E4007E] to-[#E94E18] hover:opacity-80 transition-opacity duration-150"
                >
                  Ver todas as tarefas →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Avatar with Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            id="btn-user-profile"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-full hover:bg-[#262626] transition-colors duration-150"
          >
            <div className="relative">
              {currentUser?.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-[#E4007E]/50 shadow-xs"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#E4007E] to-[#E94E18] text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
                  {currentUser?.initials || 'AD'}
                </div>
              )}
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#10B981] rounded-full ring-2 ring-[#101010]" />
            </div>
            <span className="text-xs font-bold text-slate-200 hidden sm:inline truncate max-w-[120px]">
              {currentUser?.name || 'Administrador'}
            </span>
            <ChevronDown className="w-4 h-4 text-[#808080]" />
          </button>

          {isProfileOpen && (
            <div
              id="user-profile-menu"
              className="absolute right-0 mt-2 w-64 bg-[#1C1C1C] rounded-2xl shadow-2xl border border-[#303030] p-3 z-50 animate-in fade-in zoom-in-95 duration-150 text-white"
            >
              <div className="flex items-center gap-3 p-2 border-b border-[#303030] pb-3 mb-2">
                {currentUser?.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.name}
                    className="w-10 h-10 rounded-full object-cover shrink-0 ring-2 ring-[#E4007E]/50"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#E4007E] to-[#E94E18] text-white font-extrabold text-sm flex items-center justify-center shrink-0">
                    {currentUser?.initials || 'AD'}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h4 className="font-extrabold text-sm text-white truncate">
                    {currentUser?.name || 'Administrador'}
                  </h4>
                  <p className="text-xs text-[#A0A0A0] font-medium truncate">
                    {currentUser?.email || 'admin@empresa.com'}
                  </p>
                  <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 bg-gradient-to-r from-[#E4007E]/15 to-[#E94E18]/15 text-[#E4007E] border border-[#E4007E]/30">
                    {currentUser?.roleType === 'admin'
                      ? '👑 Administrador Geral'
                      : currentUser?.role?.toLowerCase().includes('gestor')
                      ? '💼 Gestor'
                      : currentUser?.role?.toLowerCase().includes('video')
                      ? '🎬 Video Maker'
                      : currentUser?.role?.toLowerCase().includes('design')
                      ? '🎨 Designer'
                      : `👤 ${currentUser?.role || 'Colaborador'}`}
                  </span>
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    setActiveTab('tasks');
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#262626] text-slate-300 hover:text-white font-semibold flex items-center gap-2 transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#E4007E]" />
                  Quadro de Demandas
                </button>
                {isManagerOrAdmin(currentUser) && (
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      setActiveTab('registrations');
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#262626] text-slate-300 hover:text-white font-semibold flex items-center gap-2 transition-colors"
                  >
                    <User className="w-4 h-4 text-[#E94E18]" />
                    Gerenciar Cadastros
                  </button>
                )}

                <div className="pt-2 border-t border-[#303030] mt-1">
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      logout();
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-rose-950/40 text-rose-400 hover:text-rose-300 font-bold flex items-center gap-2 transition-colors"
                  >
                    <Sparkles className="w-4 h-4" />
                    Sair da Conta (Logout)
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
