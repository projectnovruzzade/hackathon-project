import { create } from 'zustand';
import * as api from '@/lib/api';
import type { Participant, PerformanceReview, Team, TeamGenerationConfig } from '@/types';

interface TeamState {
  teams: Team[];
  isLoading: boolean;
  performanceReviews: PerformanceReview[];
  invitationsByTeam: Record<string, string[]>;
  loadMyTeam: () => Promise<Team | null>;
  loadAdminTeams: () => Promise<Team[]>;
  setMyTeam: (team: Team | null) => void;
  loadReviews: () => Promise<PerformanceReview[]>;
  generateTeams: (participants: Participant[], config: TeamGenerationConfig) => Promise<Team[]>;
  addTeam: (team: Team) => void;
  updateTeam: (id: string, updates: Partial<Team>) => void;
  updateMyTeamInfo: (updates: { projectName?: string; repositoryUrl?: string; description?: string }) => Promise<void>;
  leaveMyTeam: () => Promise<void>;
  dissolveTeam: (id: string) => void;
  getTeamByParticipant: (participantId: string) => Team | undefined;
  ensureFakeTeamForParticipant: (participant: Participant) => Team | null;
  sendInvitation: (teamId: string, participantId: string) => Promise<void>;
  hasInvitation: (teamId: string, participantId: string) => boolean;
  addReview: (review: PerformanceReview) => void;
}

const teamInvitationsFromMembers = (team: Team): string[] =>
  team.members.filter((member: any) => member.role === 'invited').map((member) => member.id);

export const useTeamStore = create<TeamState>((set, get) => ({
  teams: [],
  isLoading: false,
  performanceReviews: [],
  invitationsByTeam: {},
  loadMyTeam: async () => {
    set({ isLoading: true });
    try {
      const team = await api.fetchStudentTeam();
      if (!team) {
        set({ teams: [], isLoading: false, invitationsByTeam: {} });
        return null;
      }
      set({
        teams: [team],
        isLoading: false,
        invitationsByTeam: {
          [team.id]: teamInvitationsFromMembers(team)
        }
      });
      return team;
    } catch {
      set({ isLoading: false });
      return null;
    }
  },
  loadAdminTeams: async () => {
    set({ isLoading: true });
    try {
      const teams = await api.fetchAdminTeams();
      const invitationsByTeam = teams.reduce<Record<string, string[]>>((acc, team) => {
        acc[team.id] = teamInvitationsFromMembers(team);
        return acc;
      }, {});
      set({ teams, isLoading: false, invitationsByTeam });
      return teams;
    } catch {
      set({ isLoading: false });
      return [];
    }
  },
  setMyTeam: (team) =>
    set({
      teams: team ? [team] : [],
      invitationsByTeam: team ? { [team.id]: teamInvitationsFromMembers(team) } : {}
    }),
  loadReviews: async () => {
    try {
      const reviews = await api.fetchStudentReviews();
      set({ performanceReviews: reviews });
      return reviews;
    } catch {
      return [];
    }
  },
  generateTeams: async (participants, config) => api.buildTeams(participants, config),
  addTeam: (team) =>
    set((state) => ({
      teams: [team, ...state.teams],
      invitationsByTeam: {
        ...state.invitationsByTeam,
        [team.id]: teamInvitationsFromMembers(team)
      }
    })),
  updateTeam: (id, updates) =>
    set((state) => ({
      teams: state.teams.map((team) => (team.id === id ? { ...team, ...updates } : team))
    })),
  updateMyTeamInfo: async (updates) => {
    const updated = await api.updateStudentTeam(updates);
    if (!updated) return;
    set((state) => ({
      teams: state.teams.map((team) => (team.id === updated.id ? updated : team))
    }));
  },
  leaveMyTeam: async () => {
    const maybeTeam = await api.leaveStudentTeam();
    set({
      teams: maybeTeam ? [maybeTeam] : [],
      invitationsByTeam: maybeTeam ? { [maybeTeam.id]: teamInvitationsFromMembers(maybeTeam) } : {}
    });
  },
  dissolveTeam: (id) => set((state) => ({ teams: state.teams.filter((team) => team.id !== id) })),
  getTeamByParticipant: (participantId) =>
    get().teams.find((team) => team.members.some((member) => member.id === participantId)),
  ensureFakeTeamForParticipant: (participant) => {
    const existingTeam = get().teams.find((team) => team.members.some((member) => member.id === participant.id));
    return existingTeam ?? null;
  },
  sendInvitation: async (teamId, participantId) => {
    const team = await api.sendStudentTeamInvitation(participantId);
    if (!team) return;
    set((state) => ({
      teams: state.teams.map((row) => (row.id === team.id ? team : row)),
      invitationsByTeam: {
        ...state.invitationsByTeam,
        [teamId]: Array.from(new Set([...(state.invitationsByTeam[teamId] ?? []), participantId]))
      }
    }));
  },
  hasInvitation: (teamId, participantId) => (get().invitationsByTeam[teamId] ?? []).includes(participantId),
  addReview: (review) => set((state) => ({ performanceReviews: [review, ...state.performanceReviews] }))
}));
