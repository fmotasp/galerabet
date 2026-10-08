import {
  LayoutGrid,
  ClipboardList,
  Folder,
  Users,
  BarChart3,
  Settings,
  X,
  Layers,
  Palette,
  Image,
  ShieldAlert,
  Lightbulb,
  Key,
  Menu,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { NavigationTab } from '../../types';

export const Sidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    isMobileSidebarOpen,
    setIsMobileSidebarOpen,
    currentUser,
    isManagerOrAdmin,
  } = useApp();

  const canManage = isManagerOrAdmin(currentUser);

  const navItems: Array<{ id: NavigationTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'dashboard', label: 'Painel', icon: LayoutGrid },
    { id: 'tasks', label: 'Tarefas', icon: ClipboardList },
    { id: 'files' as NavigationTab, label: 'Arquivos', icon: Folder },
    { id: 'accesses' as NavigationTab, label: 'Acessos', icon: Key },
    { id: 'materials', label: 'Material Auxiliar', icon: Palette },

    ...(canManage
      ? [
          { id: 'registrations' as NavigationTab, label: 'Cadastros', icon: Layers },
          { id: 'reports' as NavigationTab, label: 'Relatórios', icon: BarChart3 },
          { id: 'suggestions' as NavigationTab, label: 'Sugestões', icon: Lightbulb },
        ]
      : []),
  ];

  const handleNavClick = (tab: NavigationTab) => {
    setActiveTab(tab);
    setIsMobileSidebarOpen(false);
  };

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between py-6 px-3 bg-surface border-r border-line w-20 items-center select-none">
      {/* Top Brand Logo */}
      <div className="flex flex-col items-center w-full">
        <div className="flex items-center justify-center mb-8 w-full">
          <div
            id="brand-logo"
            onClick={() => handleNavClick('dashboard')}
            className="cursor-pointer group flex items-center justify-center"
            title="Painel Principal"
          >
            <div className="w-10 h-10 rounded-2xl bg-transparent flex items-center justify-center overflow-hidden group-hover:scale-110 transition-transform duration-200">
              <img
                src="/sidebar-icon.png"
                alt="Logo"
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          {/* Close for mobile */}
          <button aria-label="Fechar menu"
            id="btn-close-mobile-sidebar"
            onClick={() => setIsMobileSidebarOpen(false)}
            className="lg:hidden absolute top-4 right-4 p-1.5 text-fg-muted hover:text-white rounded-lg hover:bg-line transition-colors duration-150"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Primary Navigation Menu (Icons Only) */}
        <nav className="space-y-3 w-full flex flex-col items-center">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button aria-label={item.label}
                key={item.id}
                id={`nav-item-${item.id}`}
                onClick={() => handleNavClick(item.id)}
                className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all duration-200 group relative ${
                  isActive
                    ? 'bg-gradient-to-r from-brand/15 to-transparent'
                    : 'text-fg-muted hover:text-white hover:bg-line'
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-brand rounded-r-full shadow-[0_0_8px_#E4007E]" />
                )}
                <Icon className={`w-5 h-5 shrink-0 transition-colors ${isActive ? 'text-brand' : 'text-fg-muted group-hover:text-white'}`} />
                
                {/* Custom Tooltip */}
                <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-raised border border-line text-white text-xs font-semibold rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 shadow-xl whitespace-nowrap z-50 translate-x-[-4px] group-hover:translate-x-0 pointer-events-none">
                  {item.label}
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Navigation (Settings Icon - Only for Gestores and Admin) */}
      {canManage ? (
        <div className="pt-4 border-none w-full flex flex-col items-center gap-3">
          <button
            id="nav-item-settings"
            onClick={() => handleNavClick('settings')}
            className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all duration-200 group relative ${
              activeTab === 'settings'
                ? 'bg-gradient-to-r from-brand/15 to-transparent'
                : 'text-fg-muted hover:text-white hover:bg-line'
            }`}
          >
            {activeTab === 'settings' && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-brand rounded-r-full shadow-[0_0_8px_#E4007E]" />
            )}
            <Settings className={`w-5 h-5 shrink-0 transition-colors ${activeTab === 'settings' ? 'text-brand' : 'text-fg-muted group-hover:text-white'}`} />
            
            <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-raised border border-line text-white text-xs font-semibold rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 shadow-xl whitespace-nowrap z-50 translate-x-[-4px] group-hover:translate-x-0 pointer-events-none">
              Configurações
            </div>
          </button>
          
          <button
            id="nav-item-logs"
            onClick={() => handleNavClick('logs')}
            className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all duration-200 group relative ${
              activeTab === 'logs'
                ? 'bg-gradient-to-r from-brand/15 to-transparent'
                : 'text-fg-muted hover:text-white hover:bg-line'
            }`}
          >
            {activeTab === 'logs' && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-brand rounded-r-full shadow-[0_0_8px_#E4007E]" />
            )}
            <ShieldAlert className={`w-5 h-5 shrink-0 transition-colors ${activeTab === 'logs' ? 'text-brand' : 'text-fg-muted group-hover:text-white'}`} />
            
            <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-raised border border-line text-white text-xs font-semibold rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 shadow-xl whitespace-nowrap z-50 translate-x-[-4px] group-hover:translate-x-0 pointer-events-none">
              Logs do Sistema
            </div>
          </button>
        </div>
      ) : (
        <div className="pt-4" />
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside className="hidden lg:block shrink-0 h-screen sticky top-0">
        {sidebarContent}
      </aside>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-line z-40 px-2 py-2 flex items-center justify-around pb-safe">
        {navItems.filter(i => ['dashboard', 'tasks', 'reports'].includes(i.id)).map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button aria-label={item.label}
              key={item.id}
              id={`nav-item-mobile-${item.id}`}
              onClick={() => handleNavClick(item.id)}
              className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all duration-200 ${
                isActive
                  ? 'bg-brand text-white shadow-md'
                  : 'text-fg-muted hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-[11px] font-medium tracking-tight">
                {item.label}
              </span>
            </button>
          );
        })}
        
        <button
          onClick={() => setIsMobileSidebarOpen(true)}
          className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all duration-200 text-fg-muted hover:text-white`}
        >
          <Menu className="w-5 h-5 mb-1" />
          <span className="text-[11px] font-medium tracking-tight">
            Menu
          </span>
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-[60] lg:hidden animate-fade-in" 
          onClick={() => setIsMobileSidebarOpen(false)} 
        />
      )}
      
      {/* Mobile Sidebar Drawer */}
      <div 
        className={`fixed top-0 left-0 bottom-0 w-64 bg-surface border-r border-line z-[70] transform transition-transform duration-300 ease-in-out lg:hidden flex flex-col ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="p-6 flex items-center justify-between border-b border-line">
          <img src="/sidebar-icon.png" alt="Logo" className="w-8 h-8 object-contain" />
          <button aria-label="Fechar menu" onClick={() => setIsMobileSidebarOpen(false)} className="p-2 text-fg-muted hover:text-white rounded-full bg-raised">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button aria-label={item.label}
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive 
                    ? 'bg-brand/10 text-brand font-semibold' 
                    : 'text-fg-muted hover:bg-raised hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
          
          {canManage && (
            <button
              onClick={() => handleNavClick('settings')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all mt-4 ${
                activeTab === 'settings' 
                  ? 'bg-brand/10 text-brand font-semibold' 
                  : 'text-fg-muted hover:bg-raised hover:text-white'
              }`}
            >
              <Settings className="w-5 h-5" />
              <span>Ajustes</span>
            </button>
          )}
        </div>
      </div>
    </>
  );
};
