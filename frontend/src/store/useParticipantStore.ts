import { create } from 'zustand';
import { participants as seedParticipants } from '@/lib/mockData';
import type { Participant, SkillCategory } from '@/types';

interface ParticipantState {
  participants: Participant[];
  isLoading: boolean;
  addParticipant: (p: Participant) => void;
  updateParticipant: (id: string, updates: Partial<Participant>) => void;
  removeParticipant: (id: string) => void;
  getById: (id: string) => Participant | undefined;
  filterBySkill: (category: SkillCategory) => Participant[];
  filterByExperience: (min: number, max: number) => Participant[];
}

export const useParticipantStore = create<ParticipantState>((set, get) => ({
  participants: seedParticipants,
  isLoading: false,
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
