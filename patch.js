const fs = require('fs');
let content = fs.readFileSync('src/components/reports/ReportsDataViz.tsx', 'utf8');

const replacement = `              <Bar dataKey="Entregues" stackId="a" fill="#10B981" radius={[0, 0, 4, 4]} />
              <Bar dataKey="Pendentes" stackId="a" fill="#3B82F6" radius={[4, 4, 0, 0]} />`;

content = content.replace(/<Bar dataKey="Entregues" stackId="a" fill="#10B981" radius=\{\[0, 0, 4, 4\]\}>[\s\S]*?<\/Bar>\s*<Bar dataKey="Pendentes" stackId="a" fill="#3B82F6" radius=\{\[4, 4, 0, 0\]\}>[\s\S]*?<\/Bar>/g, replacement);

fs.writeFileSync('src/components/reports/ReportsDataViz.tsx', content);
