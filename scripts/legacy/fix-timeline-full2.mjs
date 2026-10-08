import fs from 'fs';

let content = fs.readFileSync('src/components/modals/task/components/TaskActivityTimelineTab.tsx', 'utf8');

const regex = /<div className="relative pl-6 space-y-4 before:absolute before:left-\[7px\] before:top-2 before:bottom-2 before:w-px before:bg-\[#2E2E2E\]">([\s\S]*?)<\/div>\s*\)\s*}/;

// Wait, the regex replaced it, but left the old card code because it didn't match the end of the map?
// No, I need to check the file!
