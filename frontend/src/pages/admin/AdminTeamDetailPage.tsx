import { useEffect, useMemo, useState } from 'react';
import { Badge, Button, Card, ProgressBar, Tooltip } from '@/components/ui';
import { PerformanceLineChart } from '@/components/charts';
import { SCORE_CRITERIA, type ScoreCriterion } from '@/types';
import { getAIFeedback } from '@/lib/api';
import { useEventStore } from '@/store/useEventStore';
import { useJudgeStore } from '@/store/useJudgeStore';
import { useTeamStore } from '@/store/useTeamStore';

const criterionLabel: Record<ScoreCriterion, string> = {
  technical: 'Technical',
  presentation: 'Presentation',
  innovation: 'Innovation',
  teamwork: 'Teamwork'
};

export const AdminTeamDetailPage = () => {
  const teams = useTeamStore((state) => state.teams);
  const reviews = useTeamStore((state) => state.performanceReviews);
  const judges = useJudgeStore((state) => state.judges);
  const scoreEntries = useJudgeStore((state) => state.scoreEntries);
  const getAggregatedScore = useJudgeStore((state) => state.getAggregatedScore);
  const events = useEventStore((state) => state.events);

  const [teamId, setTeamId] = useState(teams[0]?.id ?? '');
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    if (!teamId && teams.length) {
      setTeamId(teams[0].id);
    }
  }, [teamId, teams]);

  const team = teams.find((item) => item.id === teamId) ?? teams[0];
  const eventId = team?.eventId;
  const event = events.find((item) => item.id === eventId);

  const teamScores = useMemo(
    () => (team && eventId ? scoreEntries.filter((entry) => entry.teamId === team.id && entry.eventId === eventId) : []),
    [team, eventId, scoreEntries]
  );

  const aggregate = team && eventId ? getAggregatedScore(team.id, eventId) : { technical: 0, presentation: 0, innovation: 0, teamwork: 0, total: 0 };

  const trendData = reviews
    .filter((review) => review.teamId === team?.id)
    .map((review, idx) => ({ name: `Review ${idx + 1}`, score: review.aggregatedScores.total }));

  const judgeCanScore = (judgeId: string, criterion: ScoreCriterion) => {
    const judge = judges.find((item) => item.id === judgeId);
    if (!judge) return false;
    return judge.permissions.includes('all') || judge.permissions.includes(criterion);
  };

  const generateFeedback = async () => {
    if (!team || !eventId) return;
    setFeedbackLoading(true);
    const review = reviews.find((item) => item.teamId === team.id && item.eventId === eventId);
    if (review) {
      const text = await getAIFeedback(review);
      setFeedback(text);
    }
    setFeedbackLoading(false);
  };

  if (!team) {
    return <Card>No team found.</Card>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={teamId}
            onChange={(eventSelect) => setTeamId(eventSelect.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
          >
            {teams.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
          <Badge color="cyan">{event?.name ?? 'No event'}</Badge>
          <Badge color="slate">{team.status}</Badge>
          <Button variant="danger" className="ml-auto">Dissolve Team</Button>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <h3 className="mb-3 text-lg font-semibold text-slate-100">Members Management</h3>
          <div className="space-y-2">
            {team.members.map((member) => (
              <div key={member.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3">
                <div>
                  <p className="text-sm text-slate-100">{member.name}</p>
                  <p className="text-xs text-slate-500">{member.id === team.captainId ? 'Captain' : 'Member'}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost">Transfer Captain</Button>
                  <Button variant="danger">Remove</Button>
                </div>
              </div>
            ))}
          </div>
          <Button className="mt-3" variant="secondary">Add Member</Button>
        </Card>

        <Card>
          <h3 className="mb-3 text-lg font-semibold text-slate-100">Judge Scores</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-xs uppercase text-slate-500">
                  <th className="py-2 text-left">Judge</th>
                  {SCORE_CRITERIA.map((criterion) => (
                    <th key={criterion} className="py-2 text-left">{criterionLabel[criterion]}</th>
                  ))}
                  <th className="py-2 text-left">Total</th>
                  <th className="py-2 text-left">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {judges.map((judge) => {
                  const entry = teamScores.find((score) => score.judgeId === judge.id);
                  const rawTotal = SCORE_CRITERIA.reduce((sum, criterion) => sum + (entry?.scores[criterion] ?? 0), 0);
                  return (
                    <tr key={judge.id} className="border-t border-white/10">
                      <td className="py-2 text-slate-200">{judge.name}</td>
                      {SCORE_CRITERIA.map((criterion) => {
                        const allowed = judgeCanScore(judge.id, criterion);
                        if (!allowed) {
                          return (
                            <td key={criterion} className="py-2">
                              <Tooltip label="This judge is not assigned to score this criterion">
                                <span className="inline-block rounded bg-slate-800 px-2 py-1 text-slate-500">-</span>
                              </Tooltip>
                            </td>
                          );
                        }
                        const value = entry?.scores[criterion] ?? null;
                        return (
                          <td key={criterion} className="py-2">
                            {value === null ? (
                              <Badge color="amber">Pending</Badge>
                            ) : (
                              <div className="space-y-1">
                                <span className="text-slate-200">{value}</span>
                                <ProgressBar value={(value / (judge.criteriaMaxPoints?.[criterion] ?? judge.maxPointsPerCriteria)) * 100} color="cyan" />
                              </div>
                            )}
                          </td>
                        );
                      })}
                      <td className="py-2 text-slate-300">{entry ? rawTotal : 'Pending'}</td>
                      <td className="py-2 text-slate-500">{entry ? entry.submittedAt.toLocaleDateString() : '-'}</td>
                    </tr>
                  );
                })}

                <tr className="border-t border-cyan-400/30 bg-cyan-500/10">
                  <td className="py-2 font-semibold text-cyan-100">Aggregate (normalized)</td>
                  <td className="py-2 text-cyan-100">{aggregate.technical.toFixed(2)}</td>
                  <td className="py-2 text-cyan-100">{aggregate.presentation.toFixed(2)}</td>
                  <td className="py-2 text-cyan-100">{aggregate.innovation.toFixed(2)}</td>
                  <td className="py-2 text-cyan-100">{aggregate.teamwork.toFixed(2)}</td>
                  <td className="py-2 font-semibold text-cyan-100">{aggregate.total.toFixed(2)} / 100</td>
                  <td className="py-2 text-cyan-100">-</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <h3 className="mb-3 text-lg font-semibold text-slate-100">Aggregate Scores</h3>
          <div className="space-y-2 text-sm text-slate-300">
            <p>Technical: {aggregate.technical.toFixed(2)}</p>
            <p>Presentation: {aggregate.presentation.toFixed(2)}</p>
            <p>Innovation: {aggregate.innovation.toFixed(2)}</p>
            <p>Teamwork: {aggregate.teamwork.toFixed(2)}</p>
            <p className="text-base font-semibold text-slate-100">Total: {aggregate.total.toFixed(2)} / 100</p>
          </div>
          <div className="mt-4">
            <PerformanceLineChart data={trendData.length ? trendData : [{ name: 'Initial', score: aggregate.total }]} />
          </div>
        </Card>

        <Card>
          <h3 className="mb-3 text-lg font-semibold text-slate-100">AI Feedback</h3>
          <Button onClick={generateFeedback} disabled={feedbackLoading}>
            {feedbackLoading ? 'Generating...' : 'Generate AI Feedback'}
          </Button>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
            {feedback || 'Click the button to stream mock AI suggestions for strengths and improvements.'}
          </p>
        </Card>
      </div>
    </div>
  );
};
