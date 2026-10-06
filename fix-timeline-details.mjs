import fs from 'fs';

let content = fs.readFileSync('src/components/modals/task/components/TaskActivityTimelineTab.tsx', 'utf8');

const regex = /<p className="text-xs font-medium text-slate-400 leading-relaxed">[\s\S]*?<\/p>/;

const replacement = `<p className="text-xs font-medium text-slate-400 leading-relaxed">
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
                    )}`;

content = content.replace(regex, replacement);
fs.writeFileSync('src/components/modals/task/components/TaskActivityTimelineTab.tsx', content);
