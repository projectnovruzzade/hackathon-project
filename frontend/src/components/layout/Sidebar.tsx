import { NavLink } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { Avatar, Badge } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { AuthUser } from '@/types';

export interface NavItem {
  to: string;
  label: string;
  shortLabel?: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface SidebarProps {
  title: string;
  accent: 'student' | 'admin';
  items: NavItem[];
  user: AuthUser;
  onLogout: () => void;
}

export const Sidebar = ({ title, accent, items, user, onLogout }: SidebarProps) => {
  const activeClass = accent === 'student' ? 'bg-violet-500/25 text-violet-100' : 'bg-cyan-500/25 text-cyan-100';
  const roleLabel = user.role === 'student' ? 'Student' : 'Admin';

  return (
    <>
      <aside className="glass hidden h-screen w-60 flex-col p-4 md:flex">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-slate-100">Joint Holbies</h1>
          <p className="text-xs text-slate-400">{title}</p>
        </div>

        <nav className="flex-1 space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10 hover:text-slate-100',
                    isActive && activeClass
                  )
                }
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="mt-4 space-y-3 rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="flex items-center gap-3">
            <Avatar name={user.name} color={user.avatarColor} size="sm" />
            <div>
              <p className="text-sm font-medium text-slate-100">{user.name}</p>
              <Badge color={accent === 'student' ? 'violet' : 'cyan'}>{roleLabel}</Badge>
            </div>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm text-slate-100 transition hover:bg-white/20"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      <nav className="glass fixed bottom-3 left-1/2 z-40 flex w-[92%] -translate-x-1/2 justify-between rounded-2xl p-2 md:hidden">
        {items.slice(0, 5).map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex flex-1 flex-col items-center gap-1 rounded-xl px-2 py-1 text-[10px] text-slate-300',
                  isActive && activeClass
                )
              }
            >
              <Icon className="h-4 w-4" />
              <span>{item.shortLabel ?? item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </>
  );
};
