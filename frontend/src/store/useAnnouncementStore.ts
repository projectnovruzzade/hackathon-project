import { create } from 'zustand';
import * as api from '@/lib/api';
import type { Announcement } from '@/types';

interface AnnouncementState {
  announcements: Announcement[];
  unreadCount: number;
  isLoading: boolean;
  loadAnnouncements: () => Promise<void>;
  loadAdminAnnouncements: () => Promise<void>;
  addAnnouncement: (announcement: Announcement) => void;
  updateAnnouncement: (id: string, updates: Partial<Announcement>) => void;
  deleteAnnouncement: (id: string) => void;
  markAsRead: (announcementId: string, userId: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  getUnreadCount: (userId: string) => number;
}

export const useAnnouncementStore = create<AnnouncementState>((set, get) => ({
  announcements: [],
  unreadCount: 0,
  isLoading: false,
  loadAnnouncements: async () => {
    set({ isLoading: true });
    try {
      const payload = await api.fetchStudentAnnouncements();
      set({
        announcements: payload.announcements,
        unreadCount: payload.unreadCount,
        isLoading: false
      });
    } catch {
      set({ isLoading: false });
    }
  },
  loadAdminAnnouncements: async () => {
    set({ isLoading: true });
    try {
      const announcements = await api.fetchAdminAnnouncements();
      set({ announcements, unreadCount: 0, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },
  addAnnouncement: (announcement) => set((state) => ({ announcements: [announcement, ...state.announcements] })),
  updateAnnouncement: (id, updates) =>
    set((state) => ({
      announcements: state.announcements.map((item) => (item.id === id ? { ...item, ...updates } : item))
    })),
  deleteAnnouncement: (id) =>
    set((state) => ({ announcements: state.announcements.filter((item) => item.id !== id) })),
  markAsRead: async (announcementId, userId) => {
    await api.markAnnouncementRead(announcementId);
    set((state) => ({
      announcements: state.announcements.map((item) => {
        if (item.id !== announcementId || item.readBy.includes(userId)) {
          return item;
        }
        return { ...item, readBy: [...item.readBy, userId] };
      }),
      unreadCount: Math.max(0, state.unreadCount - 1)
    }));
  },
  markAllRead: async () => {
    await api.markAllAnnouncementsRead();
    set((state) => ({
      announcements: state.announcements.map((item) => ({ ...item, readBy: ['me'] })),
      unreadCount: 0
    }));
  },
  getUnreadCount: (_userId) => get().unreadCount
}));
