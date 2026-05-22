import type { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  ctaLabel?: string;
  onCta?: () => void;
}

export const EmptyState = ({ icon: Icon, title, description, ctaLabel, onCta }: EmptyStateProps) => (
  <Card className="flex flex-col items-center justify-center py-10 text-center">
    <div className="mb-4 rounded-2xl bg-white/10 p-4">
      <Icon className="h-8 w-8 text-slate-300" />
    </div>
    <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
    <p className="mt-2 max-w-md text-sm text-slate-400">{description}</p>
    {ctaLabel && onCta && <Button className="mt-5" onClick={onCta}>{ctaLabel}</Button>}
  </Card>
);
