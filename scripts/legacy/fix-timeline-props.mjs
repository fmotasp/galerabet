import fs from 'fs';

let content = fs.readFileSync('src/components/modals/task/TaskModal.tsx', 'utf8');

const regex = /<TaskActivityTimelineTab\s*timelineActions=\{timelineActions\}\s*loadingActions=\{loadingActions\}\s*\/>/;
const replacement = `<TaskActivityTimelineTab
                      editingTask={editingTask!}
                      timelineActions={timelineActions}
                      loadingActions={loadingActions}
                    />`;

content = content.replace(regex, replacement);

fs.writeFileSync('src/components/modals/task/TaskModal.tsx', content);
