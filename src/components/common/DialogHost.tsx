import React, { useEffect, useState, useCallback } from 'react';
import { AlertTriangle, HelpCircle } from 'lucide-react';
import { DialogRequest, registerDialogHost } from '../../lib/dialogs';
import { useFocusTrap } from '../../hooks/useFocusTrap';

/** Renderiza os diálogos de confirmação/aviso/entrada do sistema, um por vez (fila). */
export const DialogHost: React.FC = () => {
  const [queue, setQueue] = useState<DialogRequest[]>([]);
  const current = queue[0] ?? null;
  const [value, setValue] = useState('');
  const trapRef = useFocusTrap<HTMLDivElement>(!!current);

  useEffect(() => {
    registerDialogHost((request) => setQueue((q) => [...q, request]));
    return () => registerDialogHost(null);
  }, []);

  useEffect(() => {
    if (current?.kind === 'prompt') setValue(current.defaultValue ?? '');
  }, [current]);

  const finish = useCallback(
    (result: unknown) => {
      if (!current) return;
      current.resolve(result);
      setQueue((q) => q.slice(1));
    },
    [current]
  );

  const cancel = useCallback(() => {
    if (!current) return;
    finish(current.kind === 'confirm' ? false : current.kind === 'prompt' ? null : undefined);
  }, [current, finish]);

  const confirm = useCallback(() => {
    if (!current) return;
    finish(current.kind === 'confirm' ? true : current.kind === 'prompt' ? value : undefined);
  }, [current, finish, value]);

  useEffect(() => {
    if (!current) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        cancel();
      }
    };
    // capture: o diálogo tem prioridade sobre modais/gavetas que também escutam Esc
    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [current, cancel]);

  if (!current) return null;

  const danger = current.tone === 'danger';
  const title = current.title ?? (current.kind === 'confirm' ? (danger ? 'Confirmar exclusão' : 'Confirmar ação') : 'Atenção');

  return (
    <div role="alertdialog" aria-modal="true" aria-labelledby="dialog-title" aria-describedby="dialog-message" className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150" onClick={cancel} />
      <div ref={trapRef} className="relative w-full max-w-sm bg-surface border border-line rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-150">
        <div className="flex items-start gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${danger ? 'bg-rose-500/10 text-rose-400' : 'bg-brand/10 text-brand'}`}>
            {danger ? <AlertTriangle className="w-5 h-5" aria-hidden="true" /> : <HelpCircle className="w-5 h-5" aria-hidden="true" />}
          </div>
          <div className="min-w-0 flex-1">
            <h2 id="dialog-title" className="text-base font-semibold text-white leading-snug">{title}</h2>
            <p id="dialog-message" className="text-sm text-fg-muted mt-1 break-words">{current.message}</p>
            {current.kind === 'prompt' && (
              <input
                autoFocus
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') confirm();
                }}
                className="mt-3 w-full px-3 py-2 bg-field border border-line rounded-xl text-sm text-white"
              />
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          {current.kind !== 'alert' && (
            <button
              type="button"
              autoFocus={danger}
              onClick={cancel}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-300 hover:text-white bg-raised hover:bg-line border border-line transition-colors cursor-pointer"
            >
              {current.cancelLabel ?? 'Cancelar'}
            </button>
          )}
          <button
            type="button"
            autoFocus={!danger && current.kind !== 'prompt'}
            onClick={confirm}
            className={`px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all cursor-pointer ${
              danger ? 'bg-rose-600 hover:bg-rose-500' : 'bg-gradient-to-r from-brand to-brand-alt hover:opacity-95'
            }`}
          >
            {current.confirmLabel ?? (current.kind === 'confirm' && danger ? 'Excluir' : 'Confirmar')}
          </button>
        </div>
      </div>
    </div>
  );
};
