import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface TabsProps {
  value: string;
  onChange: (value: string) => void;
  tabs: Array<{ id: string; label: string; content: ReactNode }>;
}

export const Tabs = ({ value, onChange, tabs }: TabsProps) => (
  <div className="space-y-4">
    <div className="flex gap-2 rounded-xl bg-white/5 p-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cn(
            'flex-1 rounded-lg px-3 py-2 text-sm transition',
            value === tab.id ? 'bg-violet-500/30 text-violet-100' : 'text-slate-400 hover:bg-white/10 hover:text-slate-200'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
    <div>{tabs.find((tab) => tab.id === value)?.content}</div>
  </div>
);
