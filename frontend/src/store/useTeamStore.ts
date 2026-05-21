import { create } from 'zustand';
import * as api from '@/lib/api';
import { scoreEntries, teams as seedTeams } from '@/lib/mockData';
import type { PerformanceReview, Team, TeamGenerationConfig, Participant } from '@/types';
import { useJudgeStore } from '@/store/useJudgeStore';

const seedReviews: PerformanceReview[] = seedTeams
  .filter((team) => team.status === 'completed' && team.eventId)
  .map((team, index) => {
    const judgeScores = scoreEntries.filter((entry) => entry.teamId === team.id && entry.eventId === team.eventId);
    const aggregated = useJudgeStore.getState().getAggregatedScore(team.id, team.eventId!);

    return {
      teamId: team.id,
      eventId: team.eventId!,
      judgeScores,
      aggregatedScores: aggregated,
      rank: index + 1,
      aiFeedback: 'Great coordination and clear pitching cadence. Improve technical depth in the next milestone.',
      reviewedAt: new Date()
    };
  });

interface TeamState {
  teams: Team[];
  isLoading: boolean;
  performanceReviews: PerformanceReview[];
  generateTeams: (participants: Participant[], config: TeamGenerationConfig) => Promise<Team[]>;
  addTeam: (team: Team) => void;
  updateTeam: (id: string, updates: Partial<Team>) => void;
  dissolveTeam: (id: string) => void;
  getTeamByParticipant: (participantId: string) => Team | undefined;
  addReview: (review: PerformanceReview) => void;
}

export const useTeamStore = create<TeamState>((set, get) => ({
  teams: seedTeams,
  isLoading: false,
  performanceReviews: seedReviews,
  generateTeams: async (participants, config) => {
    set({ isLoading: true });
    try {
      const generated = await api.buildTeams(participants, config);
      set((state) => ({ teams: [...generated, ...state.teams], isLoading: false }));
      return generated;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
  addTeam: (team) => set((state) => ({ teams: [team, ...state.teams] })),
  updateTeam: (id, updates) =>
    set((state) => ({ teams: state.teams.map((team) => (team.id === id ? { ...team, ...updates } : team)) })),
  dissolveTeam: (id) => set((state) => ({ teams: state.teams.filter((team) => team.id !== id) })),
  getTeamByParticipant: (participantId) =>
    get().teams.find((team) => team.members.some((member) => member.id === participantId)),
  addReview: (review) => set((state) => ({ performanceReviews: [review, ...state.performanceReviews] }))
}));
