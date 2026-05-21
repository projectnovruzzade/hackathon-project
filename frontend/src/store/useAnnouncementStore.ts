import { create } from 'zustand';
import { announcements as seedAnnouncements } from '@/lib/mockData';
import type { Announcement } from '@/types';

interface AnnouncementState {
  announcements: Announcement[];
  addAnnouncement: (announcement: Announcement) => void;
  updateAnnouncement: (id: string, updates: Partial<Announcement>) => void;
  deleteAnnouncement: (id: string) => void;
  markAsRead: (announcementId: string, userId: string) => void;
  getUnreadCount: (userId: string) => number;
}

export const useAnnouncementStore = create<AnnouncementState>((set, get) => ({
  announcements: seedAnnouncements,
  addAnnouncement: (announcement) => set((state) => ({ announcements: [announcement, ...state.announcements] })),
  updateAnnouncement: (id, updates) =>
    set((state) => ({
      announcements: state.announcements.map((item) => (item.id === id ? { ...item, ...updates } : item))
    })),
  deleteAnnouncement: (id) =>
    set((state) => ({ announcements: state.announcements.filter((item) => item.id !== id) })),
  markAsRead: (announcementId, userId) =>
    set((state) => ({
      announcements: state.announcements.map((item) => {
        if (item.id !== announcementId || item.readBy.includes(userId)) {
          return item;
        }
        return { ...item, readBy: [...item.readBy, userId] };
      })
    })),
  getUnreadCount: (userId) => get().announcements.filter((item) => !item.readBy.includes(userId)).length
}));
