import { create } from 'zustand';
import * as api from '@/lib/api';
import type { Participant, SkillCategory } from '@/types';

interface ParticipantState {
  participants: Participant[];
  isLoading: boolean;
  loadMyProfile: () => Promise<Participant | null>;
  loadAvailableParticipants: (query?: string) => Promise<Participant[]>;
  loadAdminParticipants: () => Promise<Participant[]>;
  saveMyProfile: (updates: Partial<Participant>) => Promise<Participant | null>;
  setParticipants: (participants: Participant[]) => void;
  addParticipant: (p: Participant) => void;
  updateParticipant: (id: string, updates: Partial<Participant>) => void;
  removeParticipant: (id: string) => void;
  getById: (id: string) => Participant | undefined;
  filterBySkill: (category: SkillCategory) => Participant[];
  filterByExperience: (min: number, max: number) => Participant[];
}

export const useParticipantStore = create<ParticipantState>((set, get) => ({
  participants: [],
  isLoading: false,
  loadMyProfile: async () => {
    set({ isLoading: true });
    try {
      const me = await api.fetchStudentProfile();
      set((state) => {
        const rest = state.participants.filter((item) => item.id !== me.id);
        return { participants: [me, ...rest], isLoading: false };
      });
      return me;
    } catch {
      set({ isLoading: false });
      return null;
    }
  },
  loadAvailableParticipants: async (query = '') => {
    set({ isLoading: true });
    try {
      const rows = await api.fetchStudentParticipants(query);
      set((state) => {
        const me = state.participants[0];
        return { participants: me ? [me, ...rows.filter((item) => item.id !== me.id)] : rows, isLoading: false };
      });
      return rows;
    } catch {
      set({ isLoading: false });
      return [];
    }
  },
  loadAdminParticipants: async () => {
    set({ isLoading: true });
    try {
      const rows = await api.fetchAdminParticipants();
      set({ participants: rows, isLoading: false });
      return rows;
    } catch {
      set({ isLoading: false });
      return [];
    }
  },
  saveMyProfile: async (updates) => {
    try {
      const saved = await api.updateStudentProfile(updates);
      set((state) => ({
        participants: state.participants.map((participant) =>
          participant.id === saved.id ? { ...participant, ...saved } : participant
        )
      }));
      return saved;
    } catch {
      return null;
    }
  },
  setParticipants: (participants) => set({ participants }),
  addParticipant: (p) => set((state) => ({ participants: [p, ...state.participants] })),
  updateParticipant: (id, updates) =>
    set((state) => ({
      participants: state.participants.map((participant) =>
        participant.id === id ? { ...participant, ...updates } : participant
      )
    })),
  removeParticipant: (id) =>
    set((state) => ({ participants: state.participants.filter((participant) => participant.id !== id) })),
  getById: (id) => get().participants.find((participant) => participant.id === id),
  filterBySkill: (category) =>
    get().participants.filter((participant) => participant.skills.some((skill) => skill.category === category)),
  filterByExperience: (min, max) =>
    get().participants.filter((participant) => participant.experience >= min && participant.experience <= max)
}));
