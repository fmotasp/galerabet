import React from 'react';
import { AlertTriangle } from 'lucide-react';

export interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

/** Estado de falha ao carregar dados, com "Tentar de novo". */
export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Não foi possível carregar',
  description = 'Verifique sua conexão e tente novamente.',
  onRetry,
  className = '',
}) => (
  <div role="alert" className={`flex flex-col items-center justify-center text-center py-16 ${className}`}>
    <div className="w-14 h-14 rounded-full bg-rose-500/10 flex items-center justify-center mb-4 border border-rose-500/20">
      <AlertTriangle className="w-7 h-7 text-rose-400" aria-hidden="true" />
    </div>
    <h3 className="text-base font-semibold text-white">{title}</h3>
    <p className="text-sm text-fg-muted mt-1.5 max-w-xs">{description}</p>
    {onRetry && (
      <button
        type="button"
        onClick={onRetry}
        className="mt-5 px-4 py-2 rounded-xl bg-raised hover:bg-line border border-line text-sm font-semibold text-white transition-colors cursor-pointer"
      >
        Tentar de novo
      </button>
    )}
  </div>
);
