import { create } from 'zustand';
import * as api from '@/lib/api';
import type { HackathonEvent } from '@/types';

interface EventState {
  events: HackathonEvent[];
  selectedEventId: string | null;
  isLoading: boolean;
  loadEvents: () => Promise<HackathonEvent[]>;
  loadAdminEvents: () => Promise<HackathonEvent[]>;
  selectEvent: (id: string) => void;
  setEvents: (events: HackathonEvent[]) => void;
  addEvent: (event: HackathonEvent) => void;
  updateEvent: (id: string, updates: Partial<HackathonEvent>) => void;
  getById: (id: string) => HackathonEvent | undefined;
}

export const useEventStore = create<EventState>((set, get) => ({
  events: [],
  selectedEventId: null,
  isLoading: false,
  loadEvents: async () => {
    set({ isLoading: true });
    try {
      const events = await api.fetchStudentEvents();
      set({
        events,
        selectedEventId: events[0]?.id ?? null,
        isLoading: false
      });
      return events;
    } catch {
      set({ isLoading: false });
      return [];
    }
  },
  loadAdminEvents: async () => {
    set({ isLoading: true });
    try {
      const events = await api.fetchAdminEvents();
      set({
        events,
        selectedEventId: events[0]?.id ?? null,
        isLoading: false
      });
      return events;
    } catch {
      set({ isLoading: false });
      return [];
    }
  },
  selectEvent: (id) => set({ selectedEventId: id }),
  setEvents: (events) => set({ events, selectedEventId: events[0]?.id ?? null }),
  addEvent: (event) => set((state) => ({ events: [event, ...state.events] })),
  updateEvent: (id, updates) =>
    set((state) => ({
      events: state.events.map((event) => (event.id === id ? { ...event, ...updates } : event))
    })),
  getById: (id) => get().events.find((event) => event.id === id)
}));
