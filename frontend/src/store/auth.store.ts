import { create } from 'zustand';
import { authService } from '../services/auth.service';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  provider: string;
  isEmailVerified: boolean;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  initializeAuth: () => Promise<void>;
  login: (credentials: any) => Promise<User>;
  register: (data: any) => Promise<any>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) => {
    if (typeof window !== 'undefined') {
      if (user) {
        localStorage.setItem('is_logged_in', 'true');
      } else {
        localStorage.removeItem('is_logged_in');
      }
    }
    set({ user, isAuthenticated: !!user, isLoading: false });
  },

  initializeAuth: async () => {
    const hasSession = typeof window !== 'undefined' && localStorage.getItem('is_logged_in') === 'true';

    if (!hasSession) {
      set({ user: null, isAuthenticated: false, isLoading: false });
      return;
    }

    try {
      set({ isLoading: true });
      const res = await authService.getCurrentUser();
      if (res && res.success && res.user) {
        set({ user: res.user, isAuthenticated: true });
      } else {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('is_logged_in');
        }
        set({ user: null, isAuthenticated: false });
      }
    } catch {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('is_logged_in');
      }
      set({ user: null, isAuthenticated: false });
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (credentials) => {
    set({ isLoading: true });
    try {
      const res = await authService.login(credentials);
      if (typeof window !== 'undefined') {
        localStorage.setItem('is_logged_in', 'true');
      }
      set({ user: res.user, isAuthenticated: true, isLoading: false });
      return res.user;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (data) => {
    set({ isLoading: true });
    try {
      const res = await authService.register(data);
      set({ isLoading: false });
      return res;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout API call failed, clearing local state anyway:', error);
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('is_logged_in');
      }
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
