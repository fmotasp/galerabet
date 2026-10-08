import fs from 'fs';
import path from 'path';

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(file => {
    let filepath = path.join(dir, file);
    if (fs.statSync(filepath).isDirectory()) {
      walk(filepath, callback);
    } else if (filepath.endsWith('.tsx') || filepath.endsWith('.ts')) {
      callback(filepath);
    }
  });
}

walk('src/components', (filepath) => {
  let content = fs.readFileSync(filepath, 'utf8');
  let original = content;

  // 1. Inputs and solid panels that used 222
  content = content.replace(/bg-\[#222222\]/g, 'bg-[#101010]');
  content = content.replace(/bg-\[#222\]/g, 'bg-[#101010]');
  
  // 2. Borders for those inputs
  content = content.replace(/border-\[#303030\]/g, 'border-white/5');
  
  // 3. Elevated Cards
  content = content.replace(/bg-\[#181818\]/g, 'bg-[#141414]');
  
  // 4. Soften card borders
  content = content.replace(/border-\[#2E2E2E\]/g, 'border-[#262626]');
  content = content.replace(/border-\[#2A2A2A\]/g, 'border-white/5');
  
  if (content !== original) {
    fs.writeFileSync(filepath, content);
  }
});
