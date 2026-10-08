import fs from 'fs';

let content = fs.readFileSync('src/components/modals/EmployeeDetailModal.tsx', 'utf8');

content = content.replace(
  'variant="secondary"\n              size="icon"\n              onClick={() => {\n                setSelectedEmployeeForDetail(null);\n                setEditingEmployee(emp);\n              }}\n              className="bg-[#222222] hover:bg-[#2A2A2A] border-[#303030]"',
  'variant="ghost"\n              size="icon"\n              onClick={() => {\n                setSelectedEmployeeForDetail(null);\n                setEditingEmployee(emp);\n              }}'
);

content = content.replace(
  'variant="secondary"\n              size="icon"\n              onClick={() => setSelectedEmployeeForDetail(null)}\n              className="bg-[#222222] hover:bg-[#2A2A2A] border-[#303030]"',
  'variant="ghost"\n              size="icon"\n              onClick={() => setSelectedEmployeeForDetail(null)}'
);

fs.writeFileSync('src/components/modals/EmployeeDetailModal.tsx', content);
