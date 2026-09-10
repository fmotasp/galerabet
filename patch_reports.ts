import fs from 'fs';
const path = './src/components/reports/ReportsView.tsx';
let content = fs.readFileSync(path, 'utf8');

const target = `      const isExplicitlyNonCreative =
        !hasCreativeAssignee &&
        !hasCreativeMember &&
        ((t.assigneeId && nonCreativeEmployeeIds.has(t.assigneeId)) ||
         (t.assigneeName && nonCreativeEmployeeNames.has(t.assigneeName.toLowerCase().trim())));

      if (isExplicitlyNonCreative) {
        return false;
      }`;

if (content.includes(target)) {
  content = content.replace(target, `      // isExplicitlyNonCreative removido para contabilizar todas as demandas do fluxo (backlog, novos pedidos, etc), independente de quem assumiu a tarefa`);
  fs.writeFileSync(path, content, 'utf8');
  console.log("Patched successfully");
} else {
  console.log("Could not find target string");
}
