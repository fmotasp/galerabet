import { supabase } from './supabase';

export const logSystemAction = async (
  action: 'CREATE' | 'UPDATE' | 'DELETE',
  task_id: string,
  task_title: string,
  user_name: string,
  details?: Record<string, any>
) => {
  try {
    await supabase.from('system_logs').insert([{
      action,
      task_id,
      task_title,
      user_name,
      details
    }]);
  } catch (error) {
    console.error('Failed to insert system log:', error);
  }
};
