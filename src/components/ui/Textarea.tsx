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
          className={`w-full p-3 bg-[#1C1C1C] border ${
            error ? 'border-rose-500/80 focus:border-rose-500' : 'border-[#2E2E2E] focus:border-[#E4007E]'
          } rounded-xl text-xs sm:text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:ring-1 ${
            error ? 'focus:ring-rose-500/50' : 'focus:ring-[#E4007E]/50'
          } transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-inner ${className}`}
          {...props}
        />
        {error && <p className="text-[11px] font-bold text-rose-400">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
