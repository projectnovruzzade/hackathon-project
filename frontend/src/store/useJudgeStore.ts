import { create } from 'zustand';
import { judges as seedJudges, scoreEntries as seedScoreEntries } from '@/lib/mockData';
import { SCORE_CRITERIA, type AggregatedScore, type Judge, type ScoreCriterion, type ScoreEntry } from '@/types';

interface JudgeState {
  judges: Judge[];
  scoreEntries: ScoreEntry[];
  addJudge: (judge: Judge) => void;
  updateJudge: (id: string, updates: Partial<Judge>) => void;
  removeJudge: (id: string) => void;
  submitScore: (entry: ScoreEntry) => void;
  getScoresForTeam: (teamId: string, eventId: string) => ScoreEntry[];
  getAggregatedScore: (teamId: string, eventId: string) => AggregatedScore;
}

const judgeCanScore = (judge: Judge, criterion: ScoreCriterion) =>
  judge.permissions.includes('all') || judge.permissions.includes(criterion);

const criterionMaxPoints = (judge: Judge, criterion: ScoreCriterion) =>
  judge.criteriaMaxPoints?.[criterion] ?? judge.maxPointsPerCriteria;

const emptyAggregate: AggregatedScore = {
  technical: 0,
  presentation: 0,
  innovation: 0,
  teamwork: 0,
  total: 0
};

export const useJudgeStore = create<JudgeState>((set, get) => ({
  judges: seedJudges,
  scoreEntries: seedScoreEntries,
  addJudge: (judge) => set((state) => ({ judges: [judge, ...state.judges] })),
  updateJudge: (id, updates) =>
    set((state) => ({ judges: state.judges.map((judge) => (judge.id === id ? { ...judge, ...updates } : judge)) })),
  removeJudge: (id) => set((state) => ({ judges: state.judges.filter((judge) => judge.id !== id) })),
  submitScore: (entry) =>
    set((state) => ({
      scoreEntries: [entry, ...state.scoreEntries],
      judges: state.judges.map((judge) =>
        judge.id === entry.judgeId ? { ...judge, totalReviews: judge.totalReviews + 1 } : judge
      )
    })),
  getScoresForTeam: (teamId, eventId) =>
    get().scoreEntries.filter((entry) => entry.teamId === teamId && entry.eventId === eventId),
  getAggregatedScore: (teamId, eventId) => {
    const { judges, scoreEntries } = get();
    const teamScores = scoreEntries.filter((entry) => entry.teamId === teamId && entry.eventId === eventId);

    if (!teamScores.length) {
      return emptyAggregate;
    }

    const criterionAverages = SCORE_CRITERIA.reduce((acc, criterion) => {
      const normalizedValues: number[] = [];

      teamScores.forEach((entry) => {
        const judge = judges.find((item) => item.id === entry.judgeId);
        if (!judge || !judgeCanScore(judge, criterion)) {
          return;
        }

        const rawScore = entry.scores[criterion];
        if (rawScore === null) {
          return;
        }

        const maxPoints = criterionMaxPoints(judge, criterion);
        const normalized = (rawScore / maxPoints) * 25;
        normalizedValues.push(normalized);
      });

      const average = normalizedValues.length
        ? normalizedValues.reduce((sum, value) => sum + value, 0) / normalizedValues.length
        : 0;

      acc[criterion] = Number(average.toFixed(2));
      return acc;
    }, {} as Record<ScoreCriterion, number>);

    const total = Number(
      (
        criterionAverages.technical +
        criterionAverages.presentation +
        criterionAverages.innovation +
        criterionAverages.teamwork
      ).toFixed(2)
    );

    return {
      technical: criterionAverages.technical,
      presentation: criterionAverages.presentation,
      innovation: criterionAverages.innovation,
      teamwork: criterionAverages.teamwork,
      total
    };
  }
}));
