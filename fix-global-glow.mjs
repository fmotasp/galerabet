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
  
  // Only replace if it doesn't already have focus:ring
  if (content.includes('focus:border-[#E4007E]') && !content.includes('focus:ring-2 focus:ring-[#E4007E]/30')) {
    // There are some places that have focus:ring-1 focus:ring-[#E4007E]. Let's replace those too.
    content = content.replace(/focus:border-\[#E4007E\] focus:ring-1 focus:ring-\[#E4007E\]/g, 'focus:border-[#E4007E]/50 focus:ring-2 focus:ring-[#E4007E]/30');
    
    // Replace the standard ones
    content = content.replace(/focus:border-\[#E4007E\](?!\/50)/g, 'focus:border-[#E4007E]/50 focus:ring-2 focus:ring-[#E4007E]/30');
    
    fs.writeFileSync(filepath, content);
  }
});
