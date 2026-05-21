import { cn } from '@/lib/utils';
import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
}

const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-gradient-to-r from-violet-600 to-indigo-500 text-white hover:brightness-110',
  secondary: 'bg-cyan-500/20 text-cyan-100 border border-cyan-400/40 hover:bg-cyan-500/30',
  ghost: 'bg-white/5 text-slate-100 hover:bg-white/10 border border-white/10',
  danger: 'bg-rose-500/20 text-rose-100 border border-rose-400/40 hover:bg-rose-500/30'
};

export const Button = ({ variant = 'primary', className, type = 'button', ...props }: ButtonProps) => (
  <button
    type={type}
    className={cn(
      'inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-violet-400/60 disabled:cursor-not-allowed disabled:opacity-50',
      variants[variant],
      className
    )}
    {...props}
  />
);
