import { Outlet, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { History, LayoutDashboard, User, Users, UsersRound, Trophy, Megaphone, Headset } from 'lucide-react';
import { Sidebar, type NavItem } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { useAuthStore } from '@/store/useAuthStore';
import { useAnnouncementStore } from '@/store/useAnnouncementStore';
import { useEventStore } from '@/store/useEventStore';
import { useJudgeStore } from '@/store/useJudgeStore';
import { useParticipantStore } from '@/store/useParticipantStore';
import { useTeamStore } from '@/store/useTeamStore';

const navItems: NavItem[] = [
  { to: '/student/dashboard', label: 'Dashboard', shortLabel: 'Home', icon: LayoutDashboard },
  { to: '/student/profile', label: 'Profile', shortLabel: 'Profile', icon: User },
  { to: '/student/team', label: 'Team', shortLabel: 'Team', icon: Users },
  { to: '/student/teams', label: 'Teams', shortLabel: 'Teams', icon: UsersRound },
  { to: '/student/history-hackathons', label: 'History Hackathons', shortLabel: 'History', icon: History },
  { to: '/student/hackathons', label: 'Hackathons', shortLabel: 'Events', icon: Trophy },
  { to: '/student/announcements', label: 'Announcements', shortLabel: 'News', icon: Megaphone },
  { to: '/student/support', label: 'Support', shortLabel: 'Support', icon: Headset }
];

export const StudentLayout = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.currentUser);
  const logout = useAuthStore((state) => state.logout);
  const loadMyProfile = useParticipantStore((state) => state.loadMyProfile);
  const loadAvailableParticipants = useParticipantStore((state) => state.loadAvailableParticipants);
  const loadEvents = useEventStore((state) => state.loadEvents);
  const loadAnnouncements = useAnnouncementStore((state) => state.loadAnnouncements);
  const loadMyTeam = useTeamStore((state) => state.loadMyTeam);
  const loadReviews = useTeamStore((state) => state.loadReviews);
  const setJudges = useJudgeStore((state) => state.setJudges);
  const setScoreEntries = useJudgeStore((state) => state.setScoreEntries);

  useEffect(() => {
    let mounted = true;
    const hydrate = async () => {
      if (!user) return;
      if (!mounted) return;
      await loadMyProfile();
      const [, , , reviews] = await Promise.all([loadEvents(), loadAnnouncements(), loadMyTeam(), loadReviews()]);
      const uniqueJudges = new Map<string, { id: string; name: string }>();
      const scoreEntries = reviews.flatMap((review) =>
        review.judgeScores.map((entry) => {
          const name = (entry as any).judgeName ?? entry.judgeId;
          uniqueJudges.set(entry.judgeId, { id: entry.judgeId, name });
          return entry;
        })
      );
      setJudges(
        Array.from(uniqueJudges.values()).map((judge) => ({
          id: judge.id,
          name: judge.name,
          email: `${judge.id}@judge.local`,
          avatarColor: 'bg-cyan-500',
          specialization: 'Judge',
          permissions: ['all'],
          maxPointsPerCriteria: 25,
          assignedEventIds: [],
          totalReviews: 0
        }))
      );
      setScoreEntries(scoreEntries);
      await loadAvailableParticipants();
    };
    hydrate();
    return () => {
      mounted = false;
    };
  }, [loadAnnouncements, loadAvailableParticipants, loadEvents, loadMyProfile, loadMyTeam, loadReviews, setJudges, setScoreEntries, user]);

  if (!user) return null;

  return (
    <div className="min-h-screen md:flex">
      <Sidebar
        title="Joint Holbies Dashboard"
        accent="student"
        items={navItems}
        user={user}
        onLogout={() => {
          logout();
          navigate('/login');
        }}
      />
      <main className="flex-1 p-4 pb-24 md:p-6 md:pb-6">
        <TopBar title="Joint Holbies" subtitle="Manage your team and lead them to success in hackathons." />
        <Outlet />
      </main>
    </div>
  );
};
