import { supabase } from './supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

type TableChangeCallback = (payload: any) => void;

interface ListenerEntry {
  table: string;
  filter?: string;
  callback: TableChangeCallback;
}

class RealtimeHubService {
  private channel: RealtimeChannel | null = null;
  private listeners: ListenerEntry[] = [];
  private rebuildTimer: any = null;

  public subscribe(table: string, callback: TableChangeCallback, filter?: string) {
    const entry: ListenerEntry = { table, filter, callback };
    this.listeners.push(entry);

    this.scheduleRebuild();

    return () => {
      this.listeners = this.listeners.filter((l) => l !== entry);
      if (this.listeners.length === 0) {
        this.tearDown();
      } else {
        this.scheduleRebuild();
      }
    };
  }

  private scheduleRebuild() {
    if (this.rebuildTimer) clearTimeout(this.rebuildTimer);
    this.rebuildTimer = setTimeout(() => {
      this.rebuildChannel();
    }, 50);
  }

  private rebuildChannel() {
    if (this.channel) {
      supabase.removeChannel(this.channel);
      this.channel = null;
    }

    if (this.listeners.length === 0) return;

    // Conecta em um único canal WebSocket para todas as tabelas
    let ch = supabase.channel('realtime:app-unified');

    for (const listener of this.listeners) {
      const config: any = {
        event: '*',
        schema: 'public',
        table: listener.table,
      };
      if (listener.filter) {
        config.filter = listener.filter;
      }
      ch = ch.on('postgres_changes', config, (payload) => {
        try {
          listener.callback(payload);
        } catch (err) {
          console.error('[RealtimeHub] Erro no listener callback:', err);
        }
      });
    }

    ch.subscribe();
    this.channel = ch;
  }

  private tearDown() {
    if (this.rebuildTimer) clearTimeout(this.rebuildTimer);
    if (this.channel) {
      supabase.removeChannel(this.channel);
      this.channel = null;
    }
  }
}

export const realtimeHub = new RealtimeHubService();
