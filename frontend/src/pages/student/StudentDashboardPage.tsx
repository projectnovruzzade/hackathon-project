import { Bell, CalendarClock, Sparkles, UsersRound } from 'lucide-react';
import { useMemo } from 'react';
import { ScoreBarsChart, SkillRadarChart } from '@/components/charts';
import { Avatar, Badge, Button, Card, EmptyState, SkillChip, StatCard } from '@/components/ui';
import { useAnnouncementStore } from '@/store/useAnnouncementStore';
import { useEventStore } from '@/store/useEventStore';
import { useParticipantStore } from '@/store/useParticipantStore';
import { useTeamStore } from '@/store/useTeamStore';

export const StudentDashboardPage = () => {
  const participant = useParticipantStore((state) => state.participants[0]);
  const team = useTeamStore((state) => state.getTeamByParticipant(participant.id));
  const events = useEventStore((state) => state.events);
  const announcements = useAnnouncementStore((state) => state.announcements);
  const performanceReviews = useTeamStore((state) => state.performanceReviews);
  const reviews = useMemo(
    () => performanceReviews.filter((review) => review.teamId === team?.id).slice(0, 2),
    [performanceReviews, team?.id]
  );

  const unreadCount = announcements.filter((item) => !item.readBy.includes(participant.id)).length;
  const upcomingEvents = events.filter((event) => event.status === 'upcoming').length;
  const latestReview = reviews[0];
  const uiScoreFromSkills = Math.min(
    25,
    Math.round(
      participant.skills.filter((skill) => skill.category === 'design' || skill.category === 'frontend').length * 3.2 + 8
    )
  );
  const radarData = useMemo(
    () => [
      { category: 'Technical', team: latestReview?.aggregatedScores.technical ?? 16, ideal: 22 },
      { category: 'Presentation', team: latestReview?.aggregatedScores.presentation ?? 15, ideal: 21 },
      { category: 'Team Work', team: latestReview?.aggregatedScores.teamwork ?? 17, ideal: 22 },
      { category: 'Idea Creativity', team: latestReview?.aggregatedScores.innovation ?? 14, ideal: 21 },
      { category: 'UI', team: uiScoreFromSkills, ideal: 20 }
    ],
    [latestReview, uiScoreFromSkills]
  );

  const skillLabelMap: Record<string, string> = {
    ml: 'Machine Learning',
    devops: 'DevOps',
    frontend: 'Front-End',
    backend: 'Back-End',
    security: 'Security',
    design: 'Design',
    mobile: 'Mobile',
    other: 'Other'
  };

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="My Skill Count" value={participant.skills.length} icon={Sparkles} />
        <StatCard title="Team Chemistry" value={team?.chemistryScore ?? 0} icon={UsersRound} />
        <StatCard title="Upcoming Events" value={upcomingEvents} icon={CalendarClock} />
        <StatCard title="Unread Announcements" value={unreadCount} icon={Bell} />
      </section>

      <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        {team ? (
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-100">My Team at a Glance</h3>
              <Badge color="violet">{team.name}</Badge>
            </div>
            <SkillRadarChart data={radarData} />
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {team.members.map((member) => (
                <Avatar key={member.id} name={member.name} color={member.avatarColor} />
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {team.missingSkills.map((skill) => (
                <SkillChip key={skill} label={`Missing: ${skillLabelMap[skill] ?? skill}`} category={skill} />
              ))}
            </div>
          </Card>
        ) : (
          <EmptyState
            icon={UsersRound}
            title="No Team Yet"
            description="Join or create a team to start receiving chemistry and performance analytics."
            ctaLabel="Join or create a team"
          />
        )}

        <Card>
          <h3 className="mb-4 text-lg font-semibold text-slate-100">Quick Actions</h3>
          <div className="space-y-2">
            <Button className="w-full justify-start" variant="ghost">Upload CV</Button>
            <Button className="w-full justify-start" variant="ghost">Browse Events</Button>
            <Button className="w-full justify-start" variant="ghost">View Team</Button>
          </div>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="mb-3 text-lg font-semibold text-slate-100">Recent Hackathon Results</h3>
          {reviews.length ? (
            <>
              <ScoreBarsChart
                data={reviews.map((review, idx) => ({
                  name: `Result ${idx + 1}`,
                  technical: review.aggregatedScores.technical,
                  presentation: review.aggregatedScores.presentation,
                  innovation: review.aggregatedScores.innovation,
                  teamwork: review.aggregatedScores.teamwork
                }))}
              />
              <p className="mt-3 text-sm text-slate-300">
                {reviews[0].aiFeedback?.slice(0, 140)}... <button className="text-violet-300">Read more</button>
              </p>
            </>
          ) : (
            <p className="text-sm text-slate-400">No completed results yet.</p>
          )}
        </Card>

        <Card>
          <h3 className="mb-3 text-lg font-semibold text-slate-100">Announcements Preview</h3>
          <div className="space-y-2">
            {announcements.slice(0, 3).map((announcement) => (
              <div
                key={announcement.id}
                className={`rounded-xl border p-3 ${
                  announcement.readBy.includes(participant.id)
                    ? 'border-white/10 bg-white/5'
                    : 'border-violet-400/30 bg-violet-500/10'
                }`}
              >
                <p className="text-sm font-semibold text-slate-100">{announcement.title}</p>
                <p className="mt-1 text-xs text-slate-400">{announcement.content.slice(0, 100)}...</p>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
};
