import fs from 'fs';

let content = fs.readFileSync('src/components/modals/task/components/TaskActivityTimelineTab.tsx', 'utf8');

const regex = /<div className="relative pl-5 space-y-2\.5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0\.5 before:bg-white\/5">[\s\S]*?<\/div>\s*\)\s*}/;

const replacement = `<div className="relative pl-6 space-y-4 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-px before:bg-[#2E2E2E]">
            {timelineActions.map((act) => {
              let formattedDate = act.date;
              try {
                const d = new Date(act.date);
                if (!isNaN(d.getTime())) {
                  formattedDate = \`\${d.toLocaleDateString('pt-BR')} \${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}\`;
                }
              } catch (err) {}

              // We extract details directly to render them inside a pill if they exist
              let actionText = act.title.toLowerCase();
              if (actionText.startsWith(act.user.toLowerCase())) {
                actionText = actionText.substring(act.user.length).trim();
              }
              
              return (
                <div key={act.id} className="relative group">
                  {/* Timeline node dot */}
                  <div className="absolute -left-6 top-1.5 w-3 h-3 rounded-full bg-[#E94E18] -translate-x-1/2 z-10 ring-[5px] ring-[#101010]" />

                  {/* Clean Text Layout */}
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-slate-400 leading-relaxed">
                      <strong className="text-white font-bold">{act.user}</strong>{' '}
                      {act.title}{' '}
                      {act.details && (
                        <span className="inline-block bg-[#1C1C1C] border border-[#2E2E2E] px-2 py-0.5 rounded-lg text-white font-bold ml-1">
                          {act.details}
                        </span>
                      )}
                    </p>
                    <span className="text-[10px] font-medium text-slate-500 block">
                      {formattedDate}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}`;

content = content.replace(regex, replacement);

fs.writeFileSync('src/components/modals/task/components/TaskActivityTimelineTab.tsx', content);
