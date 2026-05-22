import { useMemo, useState } from 'react';
import { Sparkles, Trophy } from 'lucide-react';
import { ScoreBarsChart } from '@/components/charts';
import { Badge, Card, EmptyState } from '@/components/ui';
import { useAuthStore } from '@/store/useAuthStore';
import { useEventStore } from '@/store/useEventStore';
import { useJudgeStore } from '@/store/useJudgeStore';
import { useParticipantStore } from '@/store/useParticipantStore';
import { useTeamStore } from '@/store/useTeamStore';

export const StudentHistoryHackathonsPage = () => {
  const currentUser = useAuthStore((state) => state.currentUser);
  const participants = useParticipantStore((state) => state.participants);
  const participant = useMemo(
    () => participants.find((item) => item.email === currentUser?.email) ?? participants[0],
    [currentUser?.email, participants]
  );
  const participantId = participant?.id ?? '';
  const events = useEventStore((state) => state.events);
  const completedEvents = useMemo(() => events.filter((event) => event.status === 'completed'), [events]);
  const [selectedEventId, setSelectedEventId] = useState(completedEvents[0]?.id ?? '');
  const selectedEvent = completedEvents.find((event) => event.id === selectedEventId) ?? completedEvents[0];

  const teams = useTeamStore((state) => state.teams);
  const reviews = useTeamStore((state) => state.performanceReviews);
  const myTeam = useTeamStore((state) => state.getTeamByParticipant(participantId));
  const judges = useJudgeStore((state) => state.judges);
  const getScoresForTeam = useJudgeStore((state) => state.getScoresForTeam);

  if (!selectedEvent) {
    return <EmptyState icon={Trophy} title="No completed hackathons yet" description="Historical result analytics will appear here after completion." />;
  }

  if (!participant) {
    return (
      <Card>
        <p className="text-sm text-slate-300">Loading profile...</p>
      </Card>
    );
  }

  const leaderboardRows = reviews
    .filter((review) => review.eventId === selectedEvent.id)
    .sort((a, b) => b.aggregatedScores.total - a.aggregatedScores.total);
  const myScores = myTeam?.id ? getScoresForTeam(myTeam.id, selectedEvent.id) : [];
  const myReview = myTeam
    ? reviews.find((review) => review.eventId === selectedEvent.id && review.teamId === myTeam.id)
    : undefined;

  const judgeBreakdownData = myScores.map((entry) => ({
    name: judges.find((judge) => judge.id === entry.judgeId)?.name ?? entry.judgeId,
    technical: entry.scores.technical ?? 0,
    presentation: entry.scores.presentation ?? 0,
    innovation: entry.scores.innovation ?? 0,
    teamwork: entry.scores.teamwork ?? 0
  }));

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-wrap gap-2">
          {completedEvents.map((event) => (
            <button
              key={event.id}
              type="button"
              onClick={() => setSelectedEventId(event.id)}
              className={`rounded-lg px-3 py-2 text-sm transition ${
                selectedEvent.id === event.id ? 'bg-cyan-500/30 text-cyan-100' : 'bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              {event.name}
            </button>
          ))}
        </div>
      </Card>

      <Card className="space-y-4">
        <h3 className="text-xl font-semibold text-slate-100">Result Insights</h3>

        <div>
          <p className="mb-2 text-sm font-semibold text-slate-200">Leaderboard</p>
          <div className="space-y-2">
            {leaderboardRows.map((review, index) => (
              <div key={review.teamId} className="flex items-center justify-between rounded-lg bg-white/5 p-2 text-sm">
                <div className="flex items-center gap-2 text-slate-200">
                  <span>{index + 1}.</span>
                  {teams.find((team) => team.id === review.teamId)?.name}
                </div>
                <span className="text-slate-300">{review.aggregatedScores.total.toFixed(1)}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-slate-200">Judge Score Breakdown</p>
          {judgeBreakdownData.length ? (
            <ScoreBarsChart data={judgeBreakdownData} />
          ) : (
            <p className="rounded-lg bg-white/5 p-3 text-sm text-slate-300">
              Your team does not have submitted judge scores for this event yet.
            </p>
          )}
        </div>

        {myReview && (
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              { label: 'Technical', value: (myReview.aggregatedScores.technical / 25) * 100 },
              { label: 'Presentation', value: (myReview.aggregatedScores.presentation / 25) * 100 },
              { label: 'Innovation', value: (myReview.aggregatedScores.innovation / 25) * 100 },
              { label: 'Team Work', value: (myReview.aggregatedScores.teamwork / 25) * 100 }
            ].map((item) => (
              <div key={item.label} className="rounded-lg border border-white/10 bg-white/5 p-3">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm text-slate-300">{item.label}</span>
                  <span className="text-sm font-semibold text-slate-100">{item.value.toFixed(1)}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-800">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-cyan-500 to-violet-500"
                    style={{ width: `${Math.min(100, Math.max(0, item.value))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="rounded-xl border border-cyan-400/30 bg-cyan-500/10 p-3">
          <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-cyan-100">
            <Sparkles className="h-4 w-4" />
            AI Recommendation
          </p>
          <p className="text-sm leading-relaxed text-cyan-50">
            {myReview?.aiFeedback ??
              'Your next gain is likely in clearer demo storytelling and tighter technical scope for the final sprint.'}
          </p>
          <div className="mt-3">
            <Badge color="emerald">You have shown growth compared to your last hackathon.</Badge>
          </div>
        </div>
      </Card>
    </div>
  );
};
