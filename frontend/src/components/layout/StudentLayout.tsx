import { Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, User, Users, Trophy, Megaphone, Headset } from 'lucide-react';
import { Sidebar, type NavItem } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { useAuthStore } from '@/store/useAuthStore';

const navItems: NavItem[] = [
  { to: '/student/dashboard', label: 'Dashboard', shortLabel: 'Home', icon: LayoutDashboard },
  { to: '/student/profile', label: 'Profile', shortLabel: 'Profile', icon: User },
  { to: '/student/team', label: 'Team', shortLabel: 'Team', icon: Users },
  { to: '/student/hackathons', label: 'Hackathons', shortLabel: 'Events', icon: Trophy },
  { to: '/student/announcements', label: 'Announcements', shortLabel: 'News', icon: Megaphone },
  { to: '/student/support', label: 'Support', shortLabel: 'Support', icon: Headset }
];

export const StudentLayout = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.currentUser);
  const logout = useAuthStore((state) => state.logout);

  if (!user) return null;

  return (
    <div className="min-h-screen md:flex">
      <Sidebar
        title="Team Leader Dashboard"
        accent="student"
        items={navItems}
        user={user}
        onLogout={() => {
          logout();
          navigate('/login');
        }}
      />
      <main className="flex-1 p-4 pb-24 md:p-6 md:pb-6">
        <TopBar title="Team Dashboard" subtitle="Manage your team and lead them to success in hackathons." />
        <Outlet />
      </main>
    </div>
  );
};
