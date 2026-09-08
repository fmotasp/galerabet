import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: ModalSize;
  className?: string;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
}

const sizeStyles: Record<ModalSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-xl',
  xl: 'max-w-2xl',
  '2xl': 'max-w-3xl',
  full: 'max-w-5xl',
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  icon,
  children,
  footer,
  size = 'lg',
  className = '',
  closeOnBackdropClick = true,
  closeOnEscape = true,
}) => {
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeOnEscape, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-xs transition-opacity"
        onClick={closeOnBackdropClick ? onClose : undefined}
      />

      {/* Modal Container */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative bg-[#141414] rounded-3xl shadow-2xl border border-[#2A2A2A] w-full p-6 sm:p-7 z-10 animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col ${sizeStyles[size]} ${className}`}
      >
        {/* Header */}
        {(title || icon) && (
          <div className="flex items-center justify-between pb-4 border-b border-[#262626] shrink-0">
            <div className="flex items-center gap-2.5">
              {icon && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#E4007E] to-[#E94E18] text-white flex items-center justify-center font-black shadow-md shadow-[#E4007E]/25 shrink-0">
                  {icon}
                </div>
              )}
              <div>
                {title && (
                  <h2 className="text-lg font-black text-white tracking-tight leading-snug">
                    {title}
                  </h2>
                )}
                {description && (
                  <p className="text-xs text-slate-400 mt-0.5">{description}</p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#222222] transition-colors cursor-pointer"
              aria-label="Fechar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="overflow-y-auto flex-1 py-4 pr-1">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-between pt-4 border-t border-[#262626] shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
