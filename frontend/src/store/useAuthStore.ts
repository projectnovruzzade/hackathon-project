import { create } from 'zustand';
import type { AuthUser } from '@/types';
import * as api from '@/lib/api';

interface AuthState {
  currentUser: AuthUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: null,
  isAuthenticated: false,
  login: async (email, password) => {
    const user = await api.login(email, password);
    if (!user) {
      return false;
    }
    set({ currentUser: user, isAuthenticated: true });
    return true;
  },
  logout: () => set({ currentUser: null, isAuthenticated: false })
}));
