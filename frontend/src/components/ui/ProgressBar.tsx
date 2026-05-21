import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number;
  color?: 'violet' | 'cyan' | 'emerald' | 'amber';
}

const colors = {
  violet: 'from-violet-500 to-indigo-500',
  cyan: 'from-cyan-500 to-teal-500',
  emerald: 'from-emerald-500 to-lime-500',
  amber: 'from-amber-500 to-orange-500'
};

export const ProgressBar = ({ value, color = 'violet' }: ProgressBarProps) => (
  <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
    <div
      className={cn('h-full rounded-full bg-gradient-to-r transition-all duration-500', colors[color])}
      style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
    />
  </div>
);
