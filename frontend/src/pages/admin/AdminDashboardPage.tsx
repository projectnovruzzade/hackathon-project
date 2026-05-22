import { useMemo, useState } from 'react';
import { CalendarRange, MessageCircleWarning, Sparkles, Trophy, UserCheck, Users } from 'lucide-react';
import { SkillDistributionDonut } from '@/components/charts';
import { Button, Card, Modal, ProgressBar, StatCard } from '@/components/ui';
import { useAnnouncementStore } from '@/store/useAnnouncementStore';
import { useEventStore } from '@/store/useEventStore';
import { useJudgeStore } from '@/store/useJudgeStore';
import { useParticipantStore } from '@/store/useParticipantStore';
import { useTeamStore } from '@/store/useTeamStore';

export const AdminDashboardPage = () => {
  const participants = useParticipantStore((state) => state.participants);
  const teams = useTeamStore((state) => state.teams);
  const events = useEventStore((state) => state.events);
  const judges = useJudgeStore((state) => state.judges);
  const announcements = useAnnouncementStore((state) => state.announcements);
  const [modal, setModal] = useState<string | null>(null);

  const avgChemistry = teams.length
    ? Math.round(teams.reduce((sum, team) => sum + team.chemistryScore, 0) / teams.length)
    : 0;

  const skillDistribution = useMemo(() => {
    const map = new Map<string, number>();
    participants.forEach((participant) => {
      participant.skills.forEach((skill) => map.set(skill.category, (map.get(skill.category) ?? 0) + 1));
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [participants]);

  const topTeams = [...teams].sort((a, b) => b.chemistryScore - a.chemistryScore).slice(0, 5);
  const activityFeed = announcements.slice(0, 5).map((item) => ({
    id: item.id,
    actor: 'System',
    action: item.title,
    timestamp: item.createdAt
  }));

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <StatCard title="Total Participants" value={participants.length} icon={Users} accent="cyan" />
        <StatCard title="Active Teams" value={teams.filter((team) => team.status !== 'completed').length} icon={Trophy} accent="cyan" />
        <StatCard title="Events This Year" value={events.length} icon={CalendarRange} accent="cyan" />
        <StatCard title="Avg Chemistry" value={avgChemistry} icon={Sparkles} accent="cyan" />
        <StatCard title="Total Judges" value={judges.length} icon={UserCheck} accent="cyan" />
        <StatCard title="Open Tickets" value={3} icon={MessageCircleWarning} accent="cyan" />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <h3 className="mb-3 text-lg font-semibold text-slate-100">Skill Distribution</h3>
            <SkillDistributionDonut data={skillDistribution} />
          </Card>

          <Card>
            <h3 className="mb-3 text-lg font-semibold text-slate-100">Recent Activity</h3>
            <div className="space-y-2">
              {activityFeed.map((item) => (
                <div key={item.id} className="rounded-xl bg-white/5 p-3 text-sm">
                  <p className="text-slate-200">
                    <span className="font-semibold">{item.actor}</span> {item.action}
                  </p>
                  <p className="text-xs text-slate-500">{item.timestamp.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <h3 className="mb-3 text-lg font-semibold text-slate-100">Events Overview Timeline</h3>
            <div className="space-y-3">
              {events.map((event) => (
                <div key={event.id} className="rounded-xl bg-white/5 p-3">
                  <div className="mb-1 flex items-center justify-between text-sm text-slate-200">
                    <span>{event.name}</span>
                    <span className="text-xs capitalize text-slate-400">{event.status}</span>
                  </div>
                  <ProgressBar
                    value={
                      event.status === 'completed' ? 100 : event.status === 'ongoing' ? 62 : 15
                    }
                    color={event.status === 'completed' ? 'emerald' : event.status === 'ongoing' ? 'cyan' : 'amber'}
                  />
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="mb-3 text-lg font-semibold text-slate-100">Top Performing Teams</h3>
            <div className="space-y-2">
              {topTeams.map((team, idx) => (
                <div key={team.id} className="rounded-xl bg-white/5 p-3">
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-slate-200">#{idx + 1} {team.name}</span>
                    <span className="text-slate-300">{team.chemistryScore}</span>
                  </div>
                  <ProgressBar value={team.chemistryScore} color="cyan" />
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="mb-3 text-lg font-semibold text-slate-100">Quick Actions</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {['Create Event', 'Add Judge', 'Post Announcement', 'Generate Teams'].map((action) => (
                <Button key={action} variant="ghost" onClick={() => setModal(action)}>{action}</Button>
              ))}
            </div>
          </Card>
        </div>
      </section>

      <Modal open={modal !== null} onClose={() => setModal(null)} title={modal ?? ''}>
        <p className="text-sm text-slate-300">Mock action modal for: {modal}</p>
      </Modal>
    </div>
  );
};
