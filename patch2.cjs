const fs = require('fs');
let content = fs.readFileSync('src/context/ProjectsContext.tsx', 'utf8');

content = content.replace(
  "const mapRowToProject = (row: any): Project => {",
  "const mapRowToProject = (row: any): Project => {\n    console.log('[mapRowToProject] row:', row.id, row.color_palette, row.description);"
);

fs.writeFileSync('src/context/ProjectsContext.tsx', content);
