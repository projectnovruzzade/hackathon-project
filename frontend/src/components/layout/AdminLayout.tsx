import { Outlet, useNavigate } from 'react-router-dom';
import { BarChart3, Users, Handshake, Trophy, Scale, FileText, Megaphone, LineChart, FileSearch } from 'lucide-react';
import { Sidebar, type NavItem } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { useAuthStore } from '@/store/useAuthStore';

const navItems: NavItem[] = [
  { to: '/admin/dashboard', label: 'Dashboard', shortLabel: 'Dash', icon: BarChart3 },
  { to: '/admin/participants', label: 'Participants', shortLabel: 'Users', icon: Users },
  { to: '/admin/teams', label: 'Teams', shortLabel: 'Teams', icon: Handshake },
  { to: '/admin/events', label: 'Events', shortLabel: 'Events', icon: Trophy },
  { to: '/admin/judges', label: 'Judges', shortLabel: 'Judges', icon: Scale },
  { to: '/admin/cv-analysis', label: 'CV Analysis', shortLabel: 'CV', icon: FileSearch },
  { to: '/admin/announcements', label: 'Announcements', shortLabel: 'News', icon: Megaphone },
  { to: '/admin/reports', label: 'Reports', shortLabel: 'Reports', icon: LineChart },
  { to: '/admin/team-detail', label: 'Team Detail', shortLabel: 'Detail', icon: FileText }
];

export const AdminLayout = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.currentUser);
  const logout = useAuthStore((state) => state.logout);

  if (!user) return null;

  return (
    <div className="min-h-screen md:flex">
      <Sidebar
        title="Admin Panel"
        accent="admin"
        items={navItems}
        user={user}
        onLogout={() => {
          logout();
          navigate('/login');
        }}
      />
      <main className="flex-1 p-4 pb-24 md:p-6 md:pb-6">
        <TopBar title="Admin Panel" subtitle="Monitor participants, events, judges, and platform performance." />
        <Outlet />
      </main>
    </div>
  );
};
