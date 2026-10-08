import { useEffect } from 'react';

interface ShortcutHandlers {
  onNewTask: () => void;
  onNavigate: (tab: 'tasks' | 'dashboard' | 'reports' | 'projects') => void;
}

const isTyping = (el: EventTarget | null) => {
  const node = el as HTMLElement | null;
  if (!node) return false;
  return node.tagName === 'INPUT' || node.tagName === 'TEXTAREA' || node.tagName === 'SELECT' || node.isContentEditable;
};

/**
 * Atalhos de teclado estilo Linear (só valem fora de campos de texto e sem Ctrl/Cmd/Alt):
 *  C         nova tarefa
 *  G e depois T / D / R / P   ir para Tarefas / Dashboard / Relatórios / Projetos
 * Cmd/Ctrl + K (paleta de comandos) continua tratado pela própria paleta.
 */
export const useGlobalShortcuts = ({ onNewTask, onNavigate }: ShortcutHandlers) => {
  useEffect(() => {
    let awaitingGoTo = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target)) return;
      // Há um diálogo/modal aberto: não dispara atalhos por baixo dele
      if (document.querySelector('[aria-modal="true"]')) return;

      const key = e.key.toLowerCase();
      if (awaitingGoTo) {
        awaitingGoTo = false;
        clearTimeout(timer);
        const map: Record<string, 'tasks' | 'dashboard' | 'reports' | 'projects'> = { t: 'tasks', d: 'dashboard', r: 'reports', p: 'projects' };
        if (map[key]) {
          e.preventDefault();
          onNavigate(map[key]);
        }
        return;
      }
      if (key === 'c') {
        e.preventDefault();
        onNewTask();
      } else if (key === 'g') {
        awaitingGoTo = true;
        timer = setTimeout(() => (awaitingGoTo = false), 1200);
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      clearTimeout(timer);
    };
  }, [onNewTask, onNavigate]);
};
