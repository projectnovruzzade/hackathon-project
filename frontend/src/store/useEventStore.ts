import { create } from 'zustand';
import { events as seedEvents } from '@/lib/mockData';
import type { HackathonEvent } from '@/types';

interface EventState {
  events: HackathonEvent[];
  selectedEventId: string | null;
  selectEvent: (id: string) => void;
  addEvent: (event: HackathonEvent) => void;
  updateEvent: (id: string, updates: Partial<HackathonEvent>) => void;
  getById: (id: string) => HackathonEvent | undefined;
}

export const useEventStore = create<EventState>((set, get) => ({
  events: seedEvents,
  selectedEventId: null,
  selectEvent: (id) => set({ selectedEventId: id }),
  addEvent: (event) => set((state) => ({ events: [event, ...state.events] })),
  updateEvent: (id, updates) =>
    set((state) => ({
      events: state.events.map((event) => (event.id === id ? { ...event, ...updates } : event))
    })),
  getById: (id) => get().events.find((event) => event.id === id)
}));
