import { cn } from '@/lib/utils';

interface StepIndicatorProps {
  steps: string[];
  activeStep: number;
}

export const StepIndicator = ({ steps, activeStep }: StepIndicatorProps) => (
  <div className="flex items-center gap-3">
    {steps.map((step, index) => (
      <div key={step} className="flex items-center gap-3">
        <div
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold',
            index <= activeStep ? 'bg-violet-500 text-white' : 'bg-white/10 text-slate-400'
          )}
        >
          {index + 1}
        </div>
        <span className={cn('text-xs', index <= activeStep ? 'text-slate-100' : 'text-slate-500')}>{step}</span>
      </div>
    ))}
  </div>
);
