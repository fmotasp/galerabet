import fs from 'fs';

let content = fs.readFileSync('src/components/modals/task/components/TaskActivityTimelineTab.tsx', 'utf8');

// 1. Add tabular-nums to the big numbers in the summary cards
content = content.replace(/text-xl font-bold text-white/g, 'text-xl font-bold text-white tabular-nums');

// 2. Add staggered animation to the timeline items
content = content.replace(/\{timelineActions\.map\(\(act\) => \{/g, '{timelineActions.map((act, index) => {');
content = content.replace(/<div key=\{act\.id\} className="relative group">/g, '<div key={act.id} className="relative group animate-in slide-in-from-bottom-2 fade-in duration-300 fill-mode-both" style={{ animationDelay: `${index * 50}ms` }}>');

// 3. Add tabular nums to the relative and absolute date texts
content = content.replace(/className="text-\[11px\] text-slate-400"/g, 'className="text-[11px] text-slate-400 tabular-nums"');
content = content.replace(/className="text-\[11px\] text-slate-500"/g, 'className="text-[11px] text-slate-500 tabular-nums"');

// 4. Improve empty state
const emptyStateOld = `<div className="py-10 text-center bg-[#181818] rounded-xl border-transparent">
            <History className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-300">Nenhuma ação registrada ainda.</p>
            <p className="text-[11px] text-slate-500 mt-1">As ações aparecerão aqui conforme a demanda evolui.</p>
          </div>`;
          
const emptyStateNew = `<div className="py-12 flex flex-col items-center justify-center text-center bg-gradient-to-b from-[#181818] to-transparent rounded-xl border border-white/5 border-dashed">
            <div className="w-12 h-12 rounded-full bg-[#1C1C1C] flex items-center justify-center mb-3">
              <History className="w-6 h-6 text-slate-500" />
            </div>
            <p className="text-sm font-bold text-slate-300">Histórico Limpo</p>
            <p className="text-xs text-slate-500 mt-1 max-w-[200px]">A jornada desta tarefa ainda não começou. Todas as ações aparecerão aqui.</p>
          </div>`;

content = content.replace(emptyStateOld, emptyStateNew);

fs.writeFileSync('src/components/modals/task/components/TaskActivityTimelineTab.tsx', content);

