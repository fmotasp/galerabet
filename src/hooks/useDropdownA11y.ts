import { useEffect, useRef } from 'react';

const ITEM_SELECTOR = 'button:not([disabled]), [role="menuitem"], [role="option"]';

/**
 * Teclado para dropdowns feitos à mão:
 * - Esc fecha o menu e devolve o foco ao botão que o abriu (sem fechar o modal que o contém).
 * - ↓ no botão que abriu entra no menu; ↑/↓ percorrem os itens; Home/End vão ao primeiro/último.
 * O menu deve ter o atributo `data-menu` e ficar dentro do mesmo wrapper do botão.
 */
export const useDropdownA11y = (isOpen: boolean, onClose: () => void) => {
  const triggerRef = useRef<HTMLElement | null>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;
    triggerRef.current = document.activeElement as HTMLElement | null;

    const getItems = (menu: Element) => Array.from(menu.querySelectorAll<HTMLElement>(ITEM_SELECTOR));

    const onKeyDown = (e: KeyboardEvent) => {
      const active = document.activeElement as HTMLElement | null;
      const trigger = triggerRef.current;

      if (e.key === 'Escape') {
        e.stopPropagation();
        closeRef.current();
        trigger?.focus?.();
        return;
      }

      if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key) || !active) return;

      const menu = active.closest('[data-menu]') ?? (active === trigger ? trigger.parentElement?.querySelector('[data-menu]') : null);
      if (!menu) return;
      // Em campos de texto (busca dentro do menu) as setas continuam sendo do campo
      if (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.tagName === 'SELECT') return;

      const items = getItems(menu);
      if (items.length === 0) return;
      e.preventDefault();

      const index = items.indexOf(active);
      let next = 0;
      if (e.key === 'ArrowDown') next = index < 0 ? 0 : (index + 1) % items.length;
      else if (e.key === 'ArrowUp') next = index < 0 ? items.length - 1 : (index - 1 + items.length) % items.length;
      else if (e.key === 'End') next = items.length - 1;
      items[next].focus();
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);
};
