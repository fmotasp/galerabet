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

  const canAccessSettings = isManagerOrAdmin(currentUser);

  const navItems: Array<{ id: NavigationTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'dashboard', label: 'Painel', icon: LayoutGrid },
    { id: 'tasks', label: 'Tarefas', icon: ClipboardList },
    { id: 'materials', label: 'Material Auxiliar', icon: Palette },
    { id: 'registrations', label: 'Cadastros', icon: Layers },
    { id: 'reports', label: 'Relatórios', icon: BarChart3 },
  ];

  const handleNavClick = (tab: NavigationTab) => {
    setActiveTab(tab);
    setIsMobileSidebarOpen(false);
  };

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between py-6 px-3 bg-[#141414] border-r border-[#262626] w-20 items-center select-none">
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
          <button
            id="btn-close-mobile-sidebar"
            onClick={() => setIsMobileSidebarOpen(false)}
            className="lg:hidden absolute top-4 right-4 p-1.5 text-[#A0A0A0] hover:text-white rounded-lg hover:bg-[#262626] transition-colors duration-150"
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
              <button
                key={item.id}
                id={`nav-item-${item.id}`}
                onClick={() => handleNavClick(item.id)}
                className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all duration-200 group relative ${
                  isActive
                    ? 'bg-gradient-to-tr from-[#E4007E] to-[#E94E18] text-white scale-105 shadow-lg shadow-[#E4007E]/30'
                    : 'text-[#A0A0A0] hover:text-white hover:bg-[#262626]'
                }`}
                title={item.label}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-[#A0A0A0] group-hover:text-white'}`} />
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Navigation (Settings Icon - Only for Gestores and Admin) */}
      {canAccessSettings ? (
        <div className="pt-4 border-none w-full flex justify-center">
          <button
            id="nav-item-settings"
            onClick={() => handleNavClick('settings')}
            className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all duration-200 group relative ${
              activeTab === 'settings'
                ? 'bg-gradient-to-tr from-[#E4007E] to-[#E94E18] text-white scale-105 shadow-lg shadow-[#E4007E]/30'
                : 'text-[#A0A0A0] hover:text-white hover:bg-[#262626]'
            }`}
            title="Configurações"
          >
            <Settings className={`w-5 h-5 shrink-0 ${activeTab === 'settings' ? 'text-white' : 'text-[#A0A0A0] group-hover:text-white'}`} />
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

      {/* Mobile Drawer */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 max-w-xs w-full bg-[#141414] shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
