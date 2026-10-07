import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';
import { supabase } from '../lib/supabase';
import {
  AppNotification,
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../lib/notificationsService';

// ─────────────────────────────────────────────────────────────
// Context shape
// ─────────────────────────────────────────────────────────────

interface NotificationsContextType {
  notifications: AppNotification[];
  unreadCount: number;
  isLoading: boolean;
  markRead: (id: string) => void;
  markAllRead: () => void;
}

const NotificationsContext = createContext<NotificationsContextType>({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  markRead: () => {},
  markAllRead: () => {},
});

export const useNotifications = () => useContext(NotificationsContext);

// ─────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────

export const NotificationsProvider: React.FC<{
  recipientId: string | null; // employee_id do usuário logado
  children: React.ReactNode;
}> = ({ recipientId, children }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Carrega notificações iniciais
  const load = useCallback(async () => {
    if (!recipientId) return;
    setIsLoading(true);
    const data = await fetchNotifications(recipientId);
    setNotifications(data);
    setIsLoading(false);
  }, [recipientId]);

  useEffect(() => {
    load();
  }, [load]);

  // Inscrição Realtime — escuta INSERT na tabela notifications filtrado pelo recipiente
  useEffect(() => {
    if (!recipientId) return;

    // Remove canal anterior se existir
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`notifications:${recipientId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${recipientId}`,
        },
        (payload) => {
          const newNotif: AppNotification = {
            id: payload.new.id,
            recipient_id: payload.new.recipient_id,
            actor_name: payload.new.actor_name,
            actor_initials: payload.new.actor_initials || '',
            actor_avatar_url: payload.new.actor_avatar_url,
            type: payload.new.type,
            task_id: payload.new.task_id,
            task_title: payload.new.task_title,
            detail: payload.new.detail,
            is_read: false,
            created_at: payload.new.created_at,
          };
          setNotifications((prev) => [newNotif, ...prev.slice(0, 39)]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${recipientId}`,
        },
        (payload) => {
          setNotifications((prev) =>
            prev.map((n) =>
              n.id === payload.new.id ? { ...n, is_read: payload.new.is_read } : n
            )
          );
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [recipientId]);

  const markRead = useCallback(
    (id: string) => {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      markNotificationRead(id);
    },
    []
  );

  const markAllRead = useCallback(() => {
    if (!recipientId) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    markAllNotificationsRead(recipientId);
  }, [recipientId]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <NotificationsContext.Provider
      value={{ notifications, unreadCount, isLoading, markRead, markAllRead }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};
