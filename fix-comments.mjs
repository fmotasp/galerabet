import fs from 'fs';

let content = fs.readFileSync('src/components/modals/task/components/TaskCommentsSection.tsx', 'utf8');

// Tabular nums for dates
content = content.replace(/className="text-\[11px\] text-slate-500"/g, 'className="text-[11px] text-slate-500 tabular-nums"');
content = content.replace(/className="text-slate-600 text-\[10px\]"/g, 'className="text-slate-600 text-[10px] tabular-nums"');

// Staggering
content = content.replace(/comments\.map\(\(comment\) => \(/g, 'comments.map((comment, index) => (');
content = content.replace(/<div key=\{comment\.id\} className="flex items-start gap-3">/g, '<div key={comment.id} className="flex items-start gap-3 animate-in slide-in-from-bottom-2 fade-in duration-300 fill-mode-both" style={{ animationDelay: `${index * 50}ms` }}>');

fs.writeFileSync('src/components/modals/task/components/TaskCommentsSection.tsx', content);

