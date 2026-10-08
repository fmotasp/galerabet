import fs from 'fs';

let content = fs.readFileSync('src/components/accesses/AccessesView.tsx', 'utf8');
content = content.replace("LinkIcon } from 'lucide-react';", "LinkIcon, Key } from 'lucide-react';");
fs.writeFileSync('src/components/accesses/AccessesView.tsx', content);

