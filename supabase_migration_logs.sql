CREATE TABLE system_logs (
  id uuid default gen_random_uuid() primary key,
  action text not null,
  task_id text,
  task_title text,
  user_name text,
  details jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable insert for all" ON system_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable select for all" ON system_logs FOR SELECT USING (true);
