import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ToastNotification } from '../../types';

interface ToastItemProps {
  toast: ToastNotification;
  onRemove: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onRemove }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, 3000);

    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  return (
    <div
      className="pointer-events-auto bg-popover text-white rounded-2xl p-4 shadow-xl border border-line-strong flex items-start gap-3 animate-in slide-in-from-bottom-5 duration-200 transition-all"
    >
      {toast.type === 'success' && (
        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
      )}
      {toast.type === 'error' && (
        <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
      )}
      {toast.type === 'warning' && (
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
      )}
      {toast.type === 'info' && (
        <Info className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
      )}

      <div className="flex-1 min-w-0">
        <h5 className="font-bold text-xs text-white leading-tight">{toast.title}</h5>
        {toast.message && <p className="text-xs text-slate-300 mt-0.5">{toast.message}</p>}
      </div>

      <button
        onClick={() => onRemove(toast.id)}
        className="text-slate-400 hover:text-white p-1 transition-colors"
        aria-label="Fechar notificação"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  // A região ao vivo fica sempre no DOM: leitores de tela só anunciam o que entra em uma região já existente
  return (
    <div role="status" aria-live="polite" className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onRemove={removeToast} />
      ))}
    </div>
  );
};
