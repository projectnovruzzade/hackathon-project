import { CalendarClock, Sparkles, UsersRound } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SkillRadarChart } from '@/components/charts';
import { Avatar, Badge, Button, Card, EmptyState, StatCard } from '@/components/ui';
import { resolveTeamRole } from '@/lib/student';
import { useAuthStore } from '@/store/useAuthStore';
import { useEventStore } from '@/store/useEventStore';
import { useParticipantStore } from '@/store/useParticipantStore';
import { useTeamStore } from '@/store/useTeamStore';

export const StudentDashboardPage = () => {
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.currentUser);
  const participants = useParticipantStore((state) => state.participants);
  const participant = useMemo(
    () => participants.find((item) => item.email === currentUser?.email) ?? participants[0],
    [currentUser?.email, participants]
  );
  const participantId = participant?.id ?? '';
  const team = useTeamStore((state) => state.getTeamByParticipant(participantId));
  const events = useEventStore((state) => state.events);
  const performanceReviews = useTeamStore((state) => state.performanceReviews);
  const [onboardingError, setOnboardingError] = useState('');
  const participantSkills = participant?.skills ?? [];

  const teamEvent = team ? events.find((event) => event.id === team.eventId) : undefined;
  const latestReview = performanceReviews.find((review) => review.teamId === team?.id);
  const uiScoreFromSkills = Math.min(
    25,
    Math.round(
      participantSkills.filter((skill) => skill.category === 'design' || skill.category === 'frontend').length * 3.2 + 8
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

  const openJoinFlow = (mode: 'ai' | 'manual') => {
    if (!participant?.cvUrl) {
      setOnboardingError('Please upload your CV before joining a team.');
      return;
    }
    setOnboardingError('');
    navigate(`/student/team?mode=${mode}`);
  };

  if (!participant) {
    return (
      <Card>
        <p className="text-sm text-slate-300">Loading profile...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <StatCard title="Team Members" value={participant.cvUrl ? team?.members.length ?? 0 : 0} icon={UsersRound} />
        <StatCard title="Now Hackathon" value={participant.cvUrl ? (teamEvent?.status === 'ongoing' ? 'Active' : 'Inactive') : 'Locked'} icon={CalendarClock} />
        <StatCard title="Events" value={participant.cvUrl ? events.length : 0} icon={Sparkles} />
      </section>

      {!team && (
        <Card className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-100">Before Joining a Team</h3>
          <p className="text-sm text-slate-300">
            Upload your CV first, then join a team either with AI recommendation or manually.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => navigate('/student/profile')}>Upload CV</Button>
            <Button variant="secondary" onClick={() => openJoinFlow('ai')}>
              Join Team with AI
            </Button>
            <Button variant="ghost" onClick={() => openJoinFlow('manual')}>
              Join Team Manually
            </Button>
          </div>
          {onboardingError && (
            <div className="rounded-xl border border-rose-400/35 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
              {onboardingError}
            </div>
          )}
        </Card>
      )}

      <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        {team ? (
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-100">Team Analytics Dashboard</h3>
              <Badge color="violet">{team.name}</Badge>
            </div>
            <SkillRadarChart data={radarData} />
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {team.members.map((member) => (
                <Avatar key={member.id} name={member.name} color={member.avatarColor} />
              ))}
            </div>
            <p className="mt-4 rounded-xl border border-emerald-400/35 bg-emerald-500/10 p-3 text-sm text-emerald-100">
              You have shown growth compared to your last hackathon.
            </p>
          </Card>
        ) : (
          <EmptyState
            icon={UsersRound}
            title="No Team Yet"
            description="After uploading your CV, join a team to unlock analytics."
            ctaLabel="Go to profile"
            onCta={() => navigate('/student/profile')}
          />
        )}

        <Card>
          <h3 className="mb-4 text-lg font-semibold text-slate-100">Teammates & Roles</h3>
          {team ? (
            <div className="space-y-2">
              {team.members.map((member) => (
                <div key={member.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-100">{member.name}</p>
                    <p className="text-xs text-slate-400">{member.email}</p>
                  </div>
                  <Badge color={member.id === team.captainId ? 'violet' : 'cyan'}>
                    {resolveTeamRole(member, team.captainId)}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">Teammate list will appear after you join a team.</p>
          )}
        </Card>
      </section>
    </div>
  );
};
