import fs from 'fs';

const filePath = 'src/components/dashboard/DashboardView.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// We want to rearrange the main layout:
// Row 1: DashboardHeader
// Row 2: DashboardStatCards
// Row 3: Operational Core Grid (Left 7 or 8: Active Tasks; Right 5 or 4: Creative Ranking + Sprint Overview)
// Row 4: Full-width 12 cols for Team Workload Widget (when Manager/Admin)

const oldGrid = `{/* Main Grid: Left Column (Active Tasks + Team Workload) & Right Column (Creative Ranking + Sprint Overview) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7 cols): Active Tasks & Team Workload */}
        <div className="lg:col-span-7 space-y-6">
          {/* Active Tasks Widget */}
          <DashboardActiveTasks
            tasks={filteredTasks}
            isLoading={isLoadingTasks}
            onTaskClick={handleTaskClick}
            onAddTaskClick={handleNewTaskClick}
          />

          {/* Team Workload Widget (Visível apenas para Gestor/Admin) */}
          {isManagerOrAdmin(currentUser) && (
            <DashboardWorkloadWidget
              workloadMembers={workloadMembers}
              totalBacklogCount={totalBacklogCount}
              onSelectEmployee={handleSelectEmployee}
            />
          )}
        </div>

        {/* Right Column (5 cols): Creative Ranking & Sprint Overview */}
        <div className="lg:col-span-5 space-y-6">
          {/* 🏆 Ranking de Produtividade Criativa */}
          <CreativeRankingWidget
            employees={employees}
            tasks={tasks}
            onSelectEmployee={handleSelectEmployee}
          />

          {/* Sprint Overview Widget */}
          <DashboardSprintOverview metrics={dashboardMetrics} />
        </div>
      </div>`;

const newGrid = `{/* Main Grid: Núcleo Operacional (Demandas Ativas vs Produtividade Criativa & Sprint) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Coluna Principal: Demandas Ativas (8 colunas para máxima clareza e leitura) */}
        <div className="lg:col-span-8 space-y-6">
          <DashboardActiveTasks
            tasks={filteredTasks}
            isLoading={isLoadingTasks}
            onTaskClick={handleTaskClick}
            onAddTaskClick={handleNewTaskClick}
          />
        </div>

        {/* Coluna Lateral: Métricas de Equipe e Sprint (4 colunas compactas) */}
        <div className="lg:col-span-4 space-y-6">
          {/* 🏆 Ranking de Produtividade Criativa */}
          <CreativeRankingWidget
            employees={employees}
            tasks={tasks}
            onSelectEmployee={handleSelectEmployee}
          />

          {/* Sprint Overview Widget */}
          <DashboardSprintOverview metrics={dashboardMetrics} />
        </div>
      </div>

      {/* Faixa Executiva Full-Width: Gestão de Capacidade & Carga de Trabalho (Visível apenas para Gestor/Admin) */}
      {isManagerOrAdmin(currentUser) && (
        <div className="w-full">
          <DashboardWorkloadWidget
            workloadMembers={workloadMembers}
            totalBacklogCount={totalBacklogCount}
            onSelectEmployee={handleSelectEmployee}
          />
        </div>
      )}`;

if (!content.includes('lg:col-span-7 space-y-6')) {
  console.error("Pattern not found");
  process.exit(1);
}

content = content.replace(oldGrid, newGrid);
fs.writeFileSync(filePath, content);
console.log("Dashboard layout updated successfully!");
