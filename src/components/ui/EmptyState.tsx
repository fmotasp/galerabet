import React from 'react';
import type { LucideIcon } from 'lucide-react';

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  /** Ação principal (ex.: "Limpar filtros", "Criar a primeira tarefa") */
  action?: { label: string; onClick: () => void };
  /** Desenha a moldura tracejada (use quando o estado ocupa a área toda, fora de tabelas) */
  boxed?: boolean;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon, title, description, action, boxed = false, className = '' }) => (
  <div
    role="status"
    className={`flex flex-col items-center justify-center text-center py-20 ${
      boxed ? 'bg-gradient-to-b from-popover to-transparent rounded-3xl border border-line border-dashed' : ''
    } ${className}`}
  >
    <div className="w-16 h-16 rounded-full bg-field flex items-center justify-center mb-4 border border-line">
      <Icon className="w-8 h-8 text-fg-subtle" aria-hidden="true" />
    </div>
    <h3 className="text-lg font-semibold text-slate-200">{title}</h3>
    {description && <p className="text-sm text-fg-muted mt-2 max-w-xs">{description}</p>}
    {action && (
      <button
        type="button"
        onClick={action.onClick}
        className="mt-6 px-4 py-2 rounded-xl bg-brand/10 text-brand font-semibold text-sm hover:bg-brand/20 transition-colors cursor-pointer"
      >
        {action.label}
      </button>
    )}
  </div>
);
