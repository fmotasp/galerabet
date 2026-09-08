import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-r from-[#E4007E] to-[#E94E18] hover:opacity-95 text-white font-black shadow-md shadow-[#E4007E]/25 active:scale-98 border border-transparent',
  secondary:
    'bg-[#1C1C1C] hover:bg-[#2E2E2E] text-slate-200 hover:text-white border border-[#2E2E2E] hover:border-[#E4007E]/50 font-bold active:scale-98',
  danger:
    'bg-rose-600 hover:bg-rose-700 text-white font-black shadow-md shadow-rose-600/20 active:scale-98 border border-transparent',
  outline:
    'bg-transparent hover:bg-[#222222] text-slate-300 hover:text-white border border-[#2E2E2E] hover:border-slate-500 font-bold active:scale-98',
  ghost:
    'bg-transparent hover:bg-[#222222] text-slate-400 hover:text-white font-bold border border-transparent',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-xl gap-1.5',
  md: 'px-4 py-2.5 text-xs sm:text-sm rounded-xl gap-2',
  lg: 'px-5 py-3 text-sm rounded-xl font-black gap-2.5',
  icon: 'p-2 rounded-xl aspect-square flex items-center justify-center',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className = '',
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled = false,
      leftIcon,
      rightIcon,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const baseClasses =
      'inline-flex items-center justify-center font-sans transition-all cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E4007E]/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none';

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        className={`${baseClasses} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            {size !== 'icon' && children}
          </>
        ) : (
          <>
            {leftIcon && <span className="shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
