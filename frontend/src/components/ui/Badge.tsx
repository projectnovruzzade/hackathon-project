import { cn } from '@/lib/utils';
import type { PropsWithChildren } from 'react';

interface BadgeProps extends PropsWithChildren {
  color?: 'violet' | 'cyan' | 'emerald' | 'amber' | 'rose' | 'slate';
  className?: string;
}

const colors: Record<NonNullable<BadgeProps['color']>, string> = {
  violet: 'bg-violet-500/15 text-violet-200 border-violet-400/30',
  cyan: 'bg-cyan-500/15 text-cyan-200 border-cyan-400/30',
  emerald: 'bg-emerald-500/15 text-emerald-200 border-emerald-400/30',
  amber: 'bg-amber-500/15 text-amber-200 border-amber-400/30',
  rose: 'bg-rose-500/15 text-rose-200 border-rose-400/30',
  slate: 'bg-slate-500/20 text-slate-200 border-slate-400/25'
};

export const Badge = ({ color = 'slate', children, className }: BadgeProps) => (
  <span className={cn('inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium', colors[color], className)}>
    {children}
  </span>
);
