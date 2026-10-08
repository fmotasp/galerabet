import fs from 'fs';

let content = fs.readFileSync('src/components/modals/task/components/TaskActivityTimelineTab.tsx', 'utf8');

const startIdx = content.indexOf('{timelineActions.length === 0 ? (');
const endIdx = content.lastIndexOf('</div>\n    </div>\n  );\n};');

if (startIdx !== -1 && endIdx !== -1) {
  const replacement = `{timelineActions.length === 0 ? (
          <div className="py-8 text-center bg-[#181818] rounded-xl border border-[#2E2E2E]">
            <History className="w-8 h-8 text-slate-600 mx-auto mb-1.5" />
            <p className="text-xs font-bold text-slate-300">Nenhuma ação registrada nesta demanda ainda.</p>
          </div>
        ) : (
          <div className="relative pl-6 space-y-4 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-px before:bg-[#2E2E2E]">
            {timelineActions.map((act) => {
              let formattedDate = act.date;
              try {
                const d = new Date(act.date);
                if (!isNaN(d.getTime())) {
                  formattedDate = \`\${d.toLocaleDateString('pt-BR')} \${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}\`;
                }
              } catch (err) {}

              return (
                <div key={act.id} className="relative group">
                  {/* Timeline node dot */}
                  <div className="absolute left-[-17px] top-[7px] w-2.5 h-2.5 rounded-full bg-[#E94E18] -translate-x-1/2 z-10 ring-[4px] ring-[#101010]" />

                  {/* Clean Text Layout */}
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-slate-400 leading-relaxed">
                      <strong className="text-white font-bold">{act.user}</strong>{' '}
                      {act.title}{' '}
                      {act.details && act.type !== 'comment' && (
                        <span className="inline-block bg-[#1C1C1C] border border-[#2E2E2E] px-2 py-0.5 rounded-lg text-slate-200 font-semibold ml-1 shadow-sm">
                          {act.details}
                        </span>
                      )}
                    </p>
                    {act.details && act.type === 'comment' && (
                      <p className="text-[11px] text-slate-300 bg-[#1A1A1A] p-2 rounded-lg mt-1 border border-[#262626]">
                        {act.details}
                      </p>
                    )}
                    <span className="text-[10px] font-medium text-slate-500 block">
                      {formattedDate}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      `;
  
  content = content.slice(0, startIdx) + replacement + content.slice(endIdx);
  fs.writeFileSync('src/components/modals/task/components/TaskActivityTimelineTab.tsx', content);
}
