import React from 'react';

export type BadgeVariant =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'outline';

export type BadgeSize = 'sm' | 'md';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-[#222222] text-slate-300 border-[#303030]',
  primary: 'bg-[#E4007E]/20 text-[#E4007E] border-[#E4007E]/40',
  secondary: 'bg-[#E94E18]/20 text-[#E94E18] border-[#E94E18]/40',
  success: 'bg-emerald-950/80 text-emerald-300 border-emerald-800',
  warning: 'bg-amber-950/80 text-amber-300 border-amber-800',
  danger: 'bg-rose-950/80 text-rose-300 border-rose-800',
  outline: 'bg-transparent text-slate-300 border-[#2E2E2E]',
};

const dotColors: Record<BadgeVariant, string> = {
  default: 'bg-slate-400',
  primary: 'bg-[#E4007E]',
  secondary: 'bg-[#E94E18]',
  success: 'bg-emerald-400',
  warning: 'bg-amber-400',
  danger: 'bg-rose-400',
  outline: 'bg-slate-400',
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-2.5 py-1 text-xs',
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  className = '',
  variant = 'default',
  size = 'md',
  dot = false,
  ...props
}) => {
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-black uppercase tracking-wider rounded-full border shadow-xs select-none ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors[variant]}`} />}
      {children}
    </span>
  );
};
