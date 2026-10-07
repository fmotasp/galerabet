import fs from 'fs';

// 1. In DashboardView.tsx:
// Put CreativeRankingWidget and SprintOverview in an equalized or stacked position,
// or better yet:
// Left: Active Tasks (7 cols) + Team Workload (7 cols)
// Right: Creative Ranking (5 cols) + Sprint Overview (5 cols)
// Wait! Look at the image!
// On the left: Active Tasks is only showing 5 tasks by default, so it's ~380px tall.
// On the right: Ranking Criativo (pódio + lista) + Sprint Overview is ~850px tall!
// Because Team Workload was moved below the grid in a full-width row, the left column ends at 380px,
// leaving 470px of empty black space between "Tarefas Ativas" and "Carga de Trabalho da Equipe"!

// SOLUTION:
// Inside the left column (lg:col-span-7), place Team Workload right underneath Active Tasks!
// When Team Workload is in the left column, Left column height (~380px tasks + ~450px workload = 830px)
// perfectly matches Right column height (~550px ranking + ~280px sprint = 830px)!
// That's why the original layout had both in the left column, but we can make it even better:
// In DashboardActiveTasks, instead of showing only 5 tasks, showing 8 or 10 tasks fills the space cleanly,
// OR putting Team Workload back into the column, OR both!

const dashboardViewPath = 'src/components/dashboard/DashboardView.tsx';
let viewContent = fs.readFileSync(dashboardViewPath, 'utf8');

const oldGrid = `<div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
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

const newGrid = `<div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Coluna Esquerda (7 cols): Fluxo Operacional & Carga de Trabalho */}
        <div className="lg:col-span-7 space-y-6">
          <DashboardActiveTasks
            tasks={filteredTasks}
            isLoading={isLoadingTasks}
            onTaskClick={handleTaskClick}
            onAddTaskClick={handleNewTaskClick}
          />

          {/* Carga de Trabalho da Equipe - preenche perfeitamente a altura com o lado direito */}
          {isManagerOrAdmin(currentUser) && (
            <DashboardWorkloadWidget
              workloadMembers={workloadMembers}
              totalBacklogCount={totalBacklogCount}
              onSelectEmployee={handleSelectEmployee}
            />
          )}
        </div>

        {/* Coluna Direita (5 cols): Ranking Criativo & Sprint Overview */}
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

viewContent = viewContent.replace(oldGrid, newGrid);
fs.writeFileSync(dashboardViewPath, viewContent);

// 2. Also in DashboardActiveTasks.tsx, let's show 7 tasks by default instead of 5,
// so it has a more balanced natural height and doesn't look cut off
const activeTasksPath = 'src/components/dashboard/DashboardActiveTasks.tsx';
let tasksContent = fs.readFileSync(activeTasksPath, 'utf8');

tasksContent = tasksContent.replace(
  '(isExpanded ? limitedTasks : limitedTasks.slice(0, 5)).map',
  '(isExpanded ? limitedTasks : limitedTasks.slice(0, 7)).map'
);

tasksContent = tasksContent.replace(
  'limitedTasks.length > 5 &&',
  'limitedTasks.length > 7 &&'
);

tasksContent = tasksContent.replace(
  'limitedTasks.length - 5',
  'limitedTasks.length - 7'
);

fs.writeFileSync(activeTasksPath, tasksContent);

// 3. In DashboardWorkloadWidget.tsx, since it is now in the 7-col space,
// adjust the grid inside it to 1 or 2 columns so cards are compact and beautiful!
const workloadPath = 'src/components/dashboard/DashboardWorkloadWidget.tsx';
let workloadContent = fs.readFileSync(workloadPath, 'utf8');

workloadContent = workloadContent.replace(
  'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3',
  'grid grid-cols-1 sm:grid-cols-2 gap-3'
);

fs.writeFileSync(workloadPath, workloadContent);

console.log("Dashboard balance restored successfully!");
