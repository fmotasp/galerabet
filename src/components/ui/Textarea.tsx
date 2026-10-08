import React from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', error, disabled, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        <textarea
          ref={ref}
          disabled={disabled}
          className={`w-full p-3 bg-raised border ${
            error ? 'border-rose-500/80 focus:border-rose-500' : 'border-line focus:border-brand/50 focus:ring-2 focus:ring-brand/30'
          } rounded-xl text-xs sm:text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:ring-1 ${
            error ? 'focus:ring-rose-500/50' : 'focus:ring-brand/50'
          } transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-inner ${className}`}
          {...props}
        />
        {error && <p className="text-xs font-bold text-rose-400">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
