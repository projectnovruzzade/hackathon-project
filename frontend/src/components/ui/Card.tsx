import { cn } from '@/lib/utils';
import type { PropsWithChildren } from 'react';

interface CardProps extends PropsWithChildren {
  className?: string;
  gradientBorder?: boolean;
}

export const Card = ({ className, gradientBorder, children }: CardProps) => {
  if (gradientBorder) {
    return (
      <div className={cn('rounded-2xl bg-gradient-to-br from-violet-500/70 via-cyan-500/60 to-emerald-500/60 p-[1px]', className)}>
        <div className="glass rounded-2xl p-4">{children}</div>
      </div>
    );
  }

  return <div className={cn('glass rounded-2xl p-4 shadow-glow', className)}>{children}</div>;
};
