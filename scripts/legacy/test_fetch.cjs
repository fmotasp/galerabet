const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env', 'utf-8').split('\n');
let url = '', key = '';
env.forEach(line => {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].replace(/\r/g, '');
  if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) key = line.split('=')[1].replace(/\r/g, '');
});
const supabase = createClient(url, key);
async function run() {
  const { data, error } = await supabase.from('tasks').select('id');
  console.log('Total fetched:', data ? data.length : 0);
  console.log('Error:', error);
}
run();
