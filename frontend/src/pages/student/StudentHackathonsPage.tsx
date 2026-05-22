import { useMemo, useState } from 'react';
import { Sparkles, Trophy } from 'lucide-react';
import { ScoreBarsChart } from '@/components/charts';
import { Badge, Button, Card } from '@/components/ui';
import { formatDate } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';
import { useEventStore } from '@/store/useEventStore';
import { useJudgeStore } from '@/store/useJudgeStore';
import { useParticipantStore } from '@/store/useParticipantStore';
import { useTeamStore } from '@/store/useTeamStore';

type ScopeFilter = 'internal' | 'external';
type RightPanelTab = 'overview' | 'results';

const isInternalEvent = (location: string) => {
  const internalKeywords = ['internal', 'ADA', 'BHOS', 'Khazar', 'UNEC', 'BSU'];
  return internalKeywords.some((keyword) => location.toLowerCase().includes(keyword.toLowerCase()));
};

export const StudentHackathonsPage = () => {
  const currentUser = useAuthStore((state) => state.currentUser);
  const events = useEventStore((state) => state.events);
  const reviews = useTeamStore((state) => state.performanceReviews);
  const teams = useTeamStore((state) => state.teams);
  const getScoresForTeam = useJudgeStore((state) => state.getScoresForTeam);
  const judges = useJudgeStore((state) => state.judges);
  const participants = useParticipantStore((state) => state.participants);
  const participant = useMemo(
    () => participants.find((item) => item.email === currentUser?.email) ?? participants[0],
    [currentUser?.email, participants]
  );
  const participantId = participant?.id ?? '';
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>('internal');
  const [selectedEventId, setSelectedEventId] = useState(events[0]?.id ?? '');
  const [rightPanelTab, setRightPanelTab] = useState<RightPanelTab>('overview');

  const filtered = useMemo(
    () =>
      events.filter((event) => {
        const isInternal = isInternalEvent(event.location);
        return scopeFilter === 'internal' ? isInternal : !isInternal;
      }),
    [events, scopeFilter]
  );

  const selected = events.find((event) => event.id === selectedEventId) ?? filtered[0];
  const participatingTeams = teams.filter((team) => team.eventId === selected?.id);
  const myTeam = teams.find((team) => team.members.some((member) => member.id === participantId));
  const myScoreEntries = selected && myTeam?.id ? getScoresForTeam(myTeam.id, selected.id) : [];
  const myAggregatedReview = reviews.find((review) => review.eventId === selected?.id && review.teamId === myTeam?.id);
  const eventReviews = reviews
    .filter((review) => review.eventId === selected?.id)
    .sort((a, b) => b.aggregatedScores.total - a.aggregatedScores.total);

  const judgeBreakdownData = myScoreEntries.map((entry) => ({
    name: judges.find((judge) => judge.id === entry.judgeId)?.name ?? entry.judgeId,
    technical: entry.scores.technical ?? 0,
    presentation: entry.scores.presentation ?? 0,
    innovation: entry.scores.innovation ?? 0,
    teamwork: entry.scores.teamwork ?? 0
  }));

  const fallbackJudgeBreakdownData = eventReviews.slice(0, 3).map((review, index) => ({
    name: teams.find((team) => team.id === review.teamId)?.name ?? `Team ${index + 1}`,
    technical: review.aggregatedScores.technical,
    presentation: review.aggregatedScores.presentation,
    innovation: review.aggregatedScores.innovation,
    teamwork: review.aggregatedScores.teamwork
  }));

  const scorePercentages = myAggregatedReview
    ? [
        { label: 'Technical', value: (myAggregatedReview.aggregatedScores.technical / 25) * 100 },
        { label: 'Presentation', value: (myAggregatedReview.aggregatedScores.presentation / 25) * 100 },
        { label: 'Innovation', value: (myAggregatedReview.aggregatedScores.innovation / 25) * 100 },
        { label: 'Team Work', value: (myAggregatedReview.aggregatedScores.teamwork / 25) * 100 }
      ]
    : [];

  if (!participant) {
    return (
      <Card>
        <p className="text-sm text-slate-300">Loading profile...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {(['internal', 'external'] as ScopeFilter[]).map((item) => (
          <Button
            key={item}
            variant={scopeFilter === item ? 'primary' : 'ghost'}
            onClick={() => setScopeFilter(item)}
            className="min-w-36"
          >
            {item === 'internal' ? 'Internal' : 'External'}
          </Button>
        ))}
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[2fr,1fr]">
        <div className="grid content-start items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((event) => (
            <Card key={event.id} className="self-start overflow-hidden p-0">
              <div className={`h-2 bg-gradient-to-r ${event.coverColor}`} />
              <div className="p-4">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <p className="font-semibold text-slate-100">{event.name}</p>
                  <Badge color={event.status === 'completed' ? 'emerald' : event.status === 'ongoing' ? 'cyan' : 'amber'}>
                    {event.status}
                  </Badge>
                </div>
                <p className="text-xs text-slate-400">
                  {formatDate(event.startDate)} - {formatDate(event.endDate)}
                </p>
                <p className="mt-1 text-xs text-slate-500">{event.location}</p>
                <p className="mt-2 text-sm text-slate-300">Prize: {event.prize}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-400">
                  <span className="rounded bg-white/5 px-2 py-1">{event.teamCount} teams</span>
                  <span className="rounded bg-white/5 px-2 py-1">{event.participantCount} participants</span>
                </div>
                <Button
                  className="mt-3 w-full"
                  variant={event.status === 'completed' ? 'secondary' : 'primary'}
                  onClick={() => {
                    setSelectedEventId(event.id);
                    setRightPanelTab(event.status === 'completed' ? 'results' : 'overview');
                  }}
                >
                  {event.status === 'upcoming' ? 'Register' : event.status === 'ongoing' ? 'View Live' : 'View Results'}
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {selected && (
          <Card className="space-y-4">
            <div className="flex gap-2 rounded-xl bg-white/5 p-1">
              <button
                type="button"
                className={`flex-1 rounded-lg px-3 py-2 text-sm ${
                  rightPanelTab === 'overview' ? 'bg-violet-500/30 text-violet-100' : 'text-slate-300'
                }`}
                onClick={() => setRightPanelTab('overview')}
              >
                Event Overview
              </button>
              <button
                type="button"
                className={`flex-1 rounded-lg px-3 py-2 text-sm ${
                  rightPanelTab === 'results' ? 'bg-cyan-500/30 text-cyan-100' : 'text-slate-300'
                }`}
                onClick={() => setRightPanelTab('results')}
              >
                Result Page
              </button>
            </div>

            {rightPanelTab === 'overview' ? (
              <>
                <h3 className="text-lg font-semibold text-slate-100">{selected.name}</h3>
                <p className="text-sm text-slate-300">{selected.description}</p>
                <div className="rounded-xl bg-white/5 p-3 text-xs text-slate-300">
                  Registration: {formatDate(selected.registrationDeadline)}
                  <br />
                  Start: {formatDate(selected.startDate)}
                  <br />
                  End: {formatDate(selected.endDate)}
                </div>

                <div>
                  <p className="mb-2 text-sm font-semibold text-slate-200">Participating teams</p>
                  <div className="space-y-2">
                    {participatingTeams.map((team) => (
                      <div key={team.id} className="rounded-lg bg-white/5 p-2 text-sm text-slate-300">
                        {team.name}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-100">Result Insights</h3>
                {selected.status !== 'completed' && (
                  <p className="rounded-xl border border-amber-300/35 bg-amber-500/10 p-3 text-sm text-amber-100">
                    This event is not completed yet. Final judge-based result analysis will appear after submission closes.
                  </p>
                )}

                {selected.status === 'completed' && (
                  <>
                    <div>
                      <p className="mb-2 text-sm font-semibold text-slate-200">Leaderboard</p>
                      <div className="space-y-2">
                        {eventReviews.map((review, index) => (
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
                      {judgeBreakdownData.length || fallbackJudgeBreakdownData.length ? (
                        <ScoreBarsChart data={judgeBreakdownData.length ? judgeBreakdownData : fallbackJudgeBreakdownData} />
                      ) : (
                        <p className="rounded-lg bg-white/5 p-3 text-sm text-slate-300">
                          Judge score analytics will appear once score data is available.
                        </p>
                      )}
                    </div>

                    <div>
                      <p className="mb-2 text-sm font-semibold text-slate-200">Normalized Score Percentages</p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {scorePercentages.map((item) => (
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
                    </div>

                    <div className="rounded-xl border border-cyan-400/30 bg-cyan-500/10 p-3">
                      <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-cyan-100">
                        <Sparkles className="h-4 w-4" />
                        AI Recommendation (Actionable)
                      </p>
                      <p className="text-sm leading-relaxed text-cyan-50">
                        {myAggregatedReview?.aiFeedback ??
                          'Focus on presentation structure and measurable innovation impact. Prepare a one-minute problem framing, then map each feature directly to outcomes. Strengthen teamwork by splitting ownership into technical, demo, and QA tracks before final submission.'}
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}
            {selected.status !== 'completed' && rightPanelTab === 'overview' && (
              <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-slate-400">
                <Trophy className="mb-1 h-4 w-4 text-amber-300" />
                Result analytics and judge insights are available after the event is completed.
              </div>
            )}
            {selected.status === 'completed' && rightPanelTab === 'overview' && (
              <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-slate-400">
                <Trophy className="mb-1 h-4 w-4 text-amber-300" />
                Switch to the Result Page tab for judge-based percentages and AI recommendations.
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
};
