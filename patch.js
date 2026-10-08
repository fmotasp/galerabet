const fs = require('fs');
let content = fs.readFileSync('src/components/dashboard/dashboardUtils.ts', 'utf8');

// Fix isAssigned to use includes for first names
const assigneeRegex = /const isAssigned =[\s\S]*?return Boolean\(isAssigned\);/g;
content = content.replace(assigneeRegex, `const isAssigned =
          (t.assigneeId && (t.assigneeId === emp.id || t.assigneeId.toLowerCase().trim() === empId)) ||
          (t.assigneeName && (t.assigneeName.toLowerCase().trim() === empFullName || empFullName.includes(t.assigneeName.toLowerCase().trim()))) ||
          (t.members && t.members.some((m) => m && (m.id === emp.id || (m.name && (m.name.toLowerCase().trim() === empFullName || empFullName.includes(m.name.toLowerCase().trim()))))));
        return Boolean(isAssigned);`);

// Fix active logic to just return true after exclusions
const activeRegex = /const isStatusActive =[\s\S]*?return isStatusActive;/g;
content = content.replace(activeRegex, `return true; // Se não foi excluído (ex: não é done, aprov, postar), consideramos como ativo`);

fs.writeFileSync('src/components/dashboard/dashboardUtils.ts', content);
