import { Bell, Search } from 'lucide-react';

interface TopBarProps {
  title: string;
  subtitle?: string;
}

export const TopBar = ({ title, subtitle }: TopBarProps) => (
  <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
    <div>
      <h2 className="text-2xl font-semibold text-slate-100">{title}</h2>
      {subtitle && <p className="text-sm text-slate-400">{subtitle}</p>}
    </div>

    <div className="flex items-center gap-3">
      <div className="hidden items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 sm:flex">
        <Search className="h-4 w-4 text-slate-400" />
        <input
          className="w-40 bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
          placeholder="Search"
        />
      </div>
      <button type="button" className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-200 hover:bg-white/10">
        <Bell className="h-4 w-4" />
      </button>
    </div>
  </header>
);
