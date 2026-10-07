import { supabase } from './supabase';

// ─────────────────────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────────────────────

export type NotificationType =
  | 'task_status_changed'
  | 'task_comment_added'
  | 'task_member_added'
  | 'task_overdue'
  | 'task_created'
  | 'task_flagged';

export interface AppNotification {
  id: string;
  recipient_id: string;
  actor_name: string;
  actor_initials: string;
  actor_avatar_url?: string;
  type: NotificationType;
  task_id?: string;
  task_title?: string;
  detail?: string;
  is_read: boolean;
  created_at: string;
}

// ─────────────────────────────────────────────────────────────
// Helpers internos
// ─────────────────────────────────────────────────────────────

function mapRow(row: any): AppNotification {
  return {
    id: row.id,
    recipient_id: row.recipient_id,
    actor_name: row.actor_name,
    actor_initials: row.actor_initials || '',
    actor_avatar_url: row.actor_avatar_url,
    type: row.type as NotificationType,
    task_id: row.task_id,
    task_title: row.task_title,
    detail: row.detail,
    is_read: Boolean(row.is_read),
    created_at: row.created_at,
  };
}

// ─────────────────────────────────────────────────────────────
// API pública
// ─────────────────────────────────────────────────────────────

/**
 * Cria notificações para um ou mais destinatários.
 * Nunca notifica o próprio autor da ação.
 */
export async function createNotifications(params: {
  recipientIds: string[];
  actorId: string;        // employee_id do autor (para excluir da lista)
  actorName: string;
  actorInitials: string;
  actorAvatarUrl?: string;
  type: NotificationType;
  taskId?: string;
  taskTitle?: string;
  detail?: string;
}): Promise<void> {
  const targets = params.recipientIds.filter((id) => id !== params.actorId);
  if (targets.length === 0) return;

  const rows = targets.map((recipient_id) => ({
    recipient_id,
    actor_name: params.actorName,
    actor_initials: params.actorInitials,
    actor_avatar_url: params.actorAvatarUrl || null,
    type: params.type,
    task_id: params.taskId || null,
    task_title: params.taskTitle || null,
    detail: params.detail || null,
    is_read: false,
  }));

  const { error } = await supabase.from('notifications').insert(rows);
  if (error) {
    console.error('[Notifications] Erro ao criar notificações:', error.message);
  }
}

/**
 * Busca as últimas 40 notificações de um usuário.
 */
export async function fetchNotifications(
  recipientId: string
): Promise<AppNotification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('recipient_id', recipientId)
    .order('created_at', { ascending: false })
    .limit(40);

  if (error) {
    console.error('[Notifications] Erro ao buscar notificações:', error.message);
    return [];
  }
  return (data || []).map(mapRow);
}

/**
 * Marca uma notificação individual como lida.
 */
export async function markNotificationRead(id: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id);
  if (error) {
    console.error('[Notifications] Erro ao marcar como lida:', error.message);
  }
}

/**
 * Marca todas as notificações de um usuário como lidas.
 */
export async function markAllNotificationsRead(recipientId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('recipient_id', recipientId)
    .eq('is_read', false);
  if (error) {
    console.error('[Notifications] Erro ao marcar todas como lidas:', error.message);
  }
}

/**
 * Retorna a label legível para cada tipo de notificação.
 */
export function getNotificationLabel(n: AppNotification): string {
  switch (n.type) {
    case 'task_status_changed':
      return `moveu "${n.task_title}"${n.detail ? ` ${n.detail}` : ''}`;
    case 'task_comment_added':
      return `comentou em "${n.task_title}"${n.detail ? `: "${n.detail}"` : ''}`;
    case 'task_member_added':
      return `te adicionou à tarefa "${n.task_title}"`;
    case 'task_overdue':
      return `a tarefa "${n.task_title}" está atrasada`;
    case 'task_created':
      return `criou a tarefa "${n.task_title}"${n.detail ? ` no projeto ${n.detail}` : ''}`;
    case 'task_flagged':
      return `marcou "${n.task_title}" como urgente`;
    default:
      return n.detail || 'nova atividade';
  }
}
