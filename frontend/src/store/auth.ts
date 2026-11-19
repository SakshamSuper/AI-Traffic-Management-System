import { create } from 'zustand';
import Cookies from 'js-cookie';
import { User } from '@/types';
import { authApi } from '@/lib/api';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
  setUser: (user: User) => void;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: Cookies.get('access_token') || null,
  isAuthenticated: !!Cookies.get('access_token'),
  isLoading: true,

  login: async (username, password) => {
    try {
      set({ isLoading: true });
      const data = await authApi.login({ username, password });
      Cookies.set('access_token', data.access_token, { expires: 7 }); // 7 days
      
      const user = await authApi.getMe();
      set({ 
        user, 
        accessToken: data.access_token, 
        isAuthenticated: true,
        isLoading: false
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch (e) {
      console.error("Logout API failed", e);
    } finally {
      Cookies.remove('access_token');
      set({ user: null, accessToken: null, isAuthenticated: false });
    }
  },

  refreshToken: async () => {
    try {
      const data = await authApi.refreshToken();
      Cookies.set('access_token', data.access_token, { expires: 7 });
      set({ accessToken: data.access_token, isAuthenticated: true });
      return true;
    } catch (error) {
      Cookies.remove('access_token');
      set({ user: null, accessToken: null, isAuthenticated: false });
      return false;
    }
  },

  setUser: (user: User) => {
    set({ user });
  },

  initialize: async () => {
    const token = Cookies.get('access_token');
    if (!token) {
      set({ isLoading: false, isAuthenticated: false });
      return;
    }
    
    try {
      const user = await authApi.getMe();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      console.error("Failed to fetch user during initialization", error);
      Cookies.remove('access_token');
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  }
}));
