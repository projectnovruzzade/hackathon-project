import type { PropsWithChildren } from 'react';

interface TooltipProps extends PropsWithChildren {
  label: string;
}

export const Tooltip = ({ label, children }: TooltipProps) => (
  <span className="group relative inline-flex">
    {children}
    <span className="pointer-events-none absolute -top-9 left-1/2 z-10 hidden -translate-x-1/2 rounded-md border border-white/10 bg-slate-900 px-2 py-1 text-[10px] text-slate-100 shadow-lg group-hover:block">
      {label}
    </span>
  </span>
);
