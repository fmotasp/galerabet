/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardView } from './components/dashboard/DashboardView';
import { TasksView } from './components/tasks/TasksView';
import { ProjectsView } from './components/projects/ProjectsView';
import { EmployeesView } from './components/employees/EmployeesView';
import { ReportsView } from './components/reports/ReportsView';
import { RegistrationsView } from './components/registrations/RegistrationsView';
import { MaterialsView } from './components/materials/MaterialsView';
import { TrelloIntegrationView } from './components/settings/TrelloIntegrationView';
import { TaskModal } from './components/modals/TaskModal';
import { ProjectModal } from './components/modals/ProjectModal';
import { EmployeeModal } from './components/modals/EmployeeModal';
import { EmployeeDetailModal } from './components/modals/EmployeeDetailModal';
import { ProjectDetailModal } from './components/modals/ProjectDetailModal';
import { CommandPaletteModal } from './components/common/CommandPaletteModal';
import { ToastContainer } from './components/common/ToastContainer';
import { LoginView } from './components/auth/LoginView';

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
          {activeTab === 'dashboard' && <DashboardView />}
          {activeTab === 'tasks' && <TasksView />}
          {activeTab === 'materials' && <MaterialsView />}
          {activeTab === 'registrations' && <RegistrationsView />}
          {activeTab === 'projects' && <ProjectsView />}
          {activeTab === 'employees' && <EmployeesView />}
          {activeTab === 'reports' && <ReportsView />}
          {activeTab === 'settings' && (canAccessSettings ? <TrelloIntegrationView /> : <DashboardView />)}
        </main>
      </div>

      {/* Global Modals, Drawers & Overlays */}
      <TaskModal />
      <ProjectModal />
      <EmployeeModal />
      <EmployeeDetailModal />
      <ProjectDetailModal />
      <CommandPaletteModal />
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
