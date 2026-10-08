import fs from 'fs';

let content = fs.readFileSync('src/components/modals/task/components/TaskActivityTimelineTab.tsx', 'utf8');

content = content.replace(/bg-\[#141414\] border border-\[#1E1E1E\] rounded-xl px-3 py-2\.5 hover:border-\[#2E2E2E\] transition-colors/g, 'py-2');
content = content.replace(/border border-\[#2E2E2E\]/g, 'border-transparent');

fs.writeFileSync('src/components/modals/task/components/TaskActivityTimelineTab.tsx', content);
