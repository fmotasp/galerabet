import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', error, leftIcon, rightIcon, disabled, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 text-slate-400 pointer-events-none flex items-center justify-center">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            disabled={disabled}
            className={`w-full bg-[#1C1C1C] border ${
              error ? 'border-rose-500/80 focus:border-rose-500' : 'border-[#2E2E2E] focus:border-[#E4007E]'
            } rounded-xl text-xs sm:text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:ring-1 ${
              error ? 'focus:ring-rose-500/50' : 'focus:ring-[#E4007E]/50'
            } transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              leftIcon ? 'pl-9.5' : 'pl-3'
            } ${rightIcon ? 'pr-9.5' : 'pr-3'} py-2.5 sm:py-3 shadow-inner ${className}`}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 text-slate-400 flex items-center justify-center">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="text-[11px] font-bold text-rose-400">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
