/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, lazy } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { ToastContainer } from './components/common/ToastContainer';
import { LoginView } from './components/auth/LoginView';

// Lazy Loaded Views (Code Splitting)
const DashboardView = lazy(() =>
  import('./components/dashboard/DashboardView').then((m) => ({ default: m.DashboardView }))
);
const TasksView = lazy(() =>
  import('./components/tasks/TasksView').then((m) => ({ default: m.TasksView }))
);
const ProjectsView = lazy(() =>
  import('./components/projects/ProjectsView').then((m) => ({ default: m.ProjectsView }))
);
const EmployeesView = lazy(() =>
  import('./components/employees/EmployeesView').then((m) => ({ default: m.EmployeesView }))
);
const ReportsView = lazy(() =>
  import('./components/reports/ReportsView').then((m) => ({ default: m.ReportsView }))
);
const RegistrationsView = lazy(() =>
  import('./components/registrations/RegistrationsView').then((m) => ({ default: m.RegistrationsView }))
);
const MaterialsView = lazy(() =>
  import('./components/materials/MaterialsView').then((m) => ({ default: m.MaterialsView }))
);
const TrelloIntegrationView = lazy(() =>
  import('./components/settings/TrelloIntegrationView').then((m) => ({ default: m.TrelloIntegrationView }))
);

// Lazy Loaded Modals & Overlays
const TaskModal = lazy(() =>
  import('./components/modals/TaskModal').then((m) => ({ default: m.TaskModal }))
);
const ProjectModal = lazy(() =>
  import('./components/modals/ProjectModal').then((m) => ({ default: m.ProjectModal }))
);
const EmployeeModal = lazy(() =>
  import('./components/modals/EmployeeModal').then((m) => ({ default: m.EmployeeModal }))
);
const EmployeeDetailModal = lazy(() =>
  import('./components/modals/EmployeeDetailModal').then((m) => ({ default: m.EmployeeDetailModal }))
);
const ProjectDetailModal = lazy(() =>
  import('./components/modals/ProjectDetailModal').then((m) => ({ default: m.ProjectDetailModal }))
);
const CommandPaletteModal = lazy(() =>
  import('./components/common/CommandPaletteModal').then((m) => ({ default: m.CommandPaletteModal }))
);

// Fast Skeleton / Shimmer Fallback
const ViewLoadingFallback: React.FC = () => (
  <div className="w-full min-h-[400px] flex flex-col items-center justify-center p-8 space-y-4 animate-in fade-in duration-150">
    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#E4007E] to-[#E94E18] flex items-center justify-center animate-pulse shadow-lg shadow-[#E4007E]/20">
      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
    </div>
    <div className="w-48 h-1.5 bg-[#222222] rounded-full overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-r from-[#E4007E] to-[#E94E18] animate-pulse rounded-full" />
    </div>
    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
      Carregando...
    </span>
  </div>
);

const MainLayout: React.FC = () => {
  const { activeTab, currentUser, isManagerOrAdmin, isInitialLoading } = useApp();

  if (!currentUser) {
    return (
      <>
        <LoginView />
        <ToastContainer />
      </>
    );
  }

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-[#101010] flex flex-col items-center justify-center p-6 select-none">
        <div className="flex flex-col items-center gap-6 max-w-sm text-center animate-in fade-in zoom-in-95 duration-300">
          <img
            src="/login-logo.png"
            alt="RioSãoPaulo"
            className="w-48 h-auto object-contain drop-shadow-2xl animate-pulse"
          />
          <div className="w-52 h-1.5 bg-[#222222] rounded-full overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-[#E4007E] to-[#E94E18] animate-pulse rounded-full" />
          </div>
          <p className="text-xs font-bold text-slate-400 tracking-wide">
            Carregando painel e sincronizando demandas...
          </p>
        </div>
      </div>
    );
  }

  const canAccessSettings = isManagerOrAdmin(currentUser);

  return (
    <div className="min-h-screen bg-[#101010] text-[#F1F2F2] flex flex-col lg:flex-row antialiased">
      {/* Navigation Sidebar */}
      <Sidebar />

      {/* Main View Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <Header />

        <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
          <Suspense fallback={<ViewLoadingFallback />}>
            {activeTab === 'dashboard' && <DashboardView />}
            {activeTab === 'tasks' && <TasksView />}
            {activeTab === 'materials' && <MaterialsView />}
            {activeTab === 'registrations' && <RegistrationsView />}
            {activeTab === 'projects' && <ProjectsView />}
            {activeTab === 'employees' && <EmployeesView />}
            {activeTab === 'reports' && <ReportsView />}
            {activeTab === 'settings' && (canAccessSettings ? <TrelloIntegrationView /> : <DashboardView />)}
          </Suspense>
        </main>
      </div>

      {/* Global Modals, Drawers & Overlays with Suspense */}
      <Suspense fallback={null}>
        <TaskModal />
        <ProjectModal />
        <EmployeeModal />
        <EmployeeDetailModal />
        <ProjectDetailModal />
        <CommandPaletteModal />
      </Suspense>
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
