import { cn } from '@/lib/utils';
import type { SkillCategory } from '@/types';

interface SkillChipProps {
  label: string;
  category: SkillCategory;
}

const palette: Record<SkillCategory, string> = {
  frontend: 'bg-violet-500/20 text-violet-100 border-violet-300/40',
  backend: 'bg-cyan-500/20 text-cyan-100 border-cyan-300/40',
  ml: 'bg-emerald-500/20 text-emerald-100 border-emerald-300/40',
  security: 'bg-rose-500/20 text-rose-100 border-rose-300/40',
  devops: 'bg-amber-500/20 text-amber-100 border-amber-300/40',
  design: 'bg-fuchsia-500/20 text-fuchsia-100 border-fuchsia-300/40',
  mobile: 'bg-indigo-500/20 text-indigo-100 border-indigo-300/40',
  other: 'bg-slate-500/20 text-slate-100 border-slate-300/40'
};

export const SkillChip = ({ label, category }: SkillChipProps) => (
  <span className={cn('inline-flex items-center rounded-full border px-2 py-1 text-xs', palette[category])}>{label}</span>
);
