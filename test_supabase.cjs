const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://vrokxasiciqcbbfoqrjp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyb2t4YXNpY2lxY2JiZm9xcmpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczMzU2NDUsImV4cCI6MjEwMjkxMTY0NX0.Y7DZuU-iyNqHKRZacLC0ktIDDqiq_wKfm5M8k99Pnlc';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
  const email = 'test_rls_' + Date.now() + '@empresa.com';
  console.log('Testing SignUp...');
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password: 'password123'
  });
  
  if (signUpError) {
    console.log('SignUp Error:', signUpError);
    return;
  }
  
  console.log('User signed up:', signUpData.user.id);
  
  console.log('Querying employees...');
  const { data: emps, error: selectError } = await supabase.from('employees').select('*');
  
  if (selectError) {
    console.log('Select Error:', selectError);
  } else {
    console.log('Select Data length:', emps ? emps.length : 0);
  }
}
run();
