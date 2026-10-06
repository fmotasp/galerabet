import fs from 'fs';

let content = fs.readFileSync('src/components/modals/task/components/TaskModalHeader.tsx', 'utf8');
const startIdx = content.indexOf('{/* Navigation Tabs Header */}');
const endIdx = content.lastIndexOf('</div>\n    </div>\n  );\n};');

if (startIdx !== -1 && endIdx !== -1) {
  content = content.slice(0, startIdx) + '\n      </div>\n    </div>\n  );\n};\n';
  fs.writeFileSync('src/components/modals/task/components/TaskModalHeader.tsx', content);
}
