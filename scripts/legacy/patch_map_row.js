import fs from 'fs';
const file = 'src/context/TasksContext.tsx';
let content = fs.readFileSync(file, 'utf8');

const parseArray = (field) => `typeof ${field} === 'string' ? JSON.parse(${field}) : (${field} || [])`;

content = content.replace(/labels: row\.labels \|\| \[\],/g, `labels: ${parseArray('row.labels')},`);
content = content.replace(/attachments: row\.attachments \|\| \[\],/g, `attachments: ${parseArray('row.attachments')},`);
content = content.replace(/referenceImages: row\.reference_images \|\| \[\],/g, `referenceImages: ${parseArray('row.reference_images')},`);
content = content.replace(/comments: row\.comments \|\| \[\],/g, `comments: ${parseArray('row.comments')},`);
content = content.replace(/activityLog: \(row\.activity_log \|\| row\.activityLog \|\| \[\]\)/g, `activityLog: (typeof (row.activity_log || row.activityLog) === 'string' ? JSON.parse(row.activity_log || row.activityLog) : (row.activity_log || row.activityLog || []))`);

fs.writeFileSync(file, content);
