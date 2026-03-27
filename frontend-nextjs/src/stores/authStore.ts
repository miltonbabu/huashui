import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, AuthState, LoginRequest, RegisterRequest } from '@/types';
import { authApi } from '@/lib/api-client';

interface AuthStore extends AuthState {
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  checkAuth: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,

      login: async (data: LoginRequest) => {
        set({ isLoading: true });
        try {
          const response = await authApi.login(data.email, data.password);
          if (response.success && response.token) {
            localStorage.setItem('token', response.token);
            set({
              token: response.token,
              user: response.user as User,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            throw new Error('Login failed');
          }
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (data: RegisterRequest) => {
        set({ isLoading: true });
        try {
          const response = await authApi.register(data.name, data.email, data.password);
          if (response.success && response.token) {
            localStorage.setItem('token', response.token);
            set({
              token: response.token,
              user: response.user as User,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            throw new Error('Registration failed');
          }
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      setUser: (user: User | null) => {
        set({ user, isAuthenticated: !!user });
      },

      setToken: (token: string | null) => {
        set({ token, isAuthenticated: !!token });
      },

      checkAuth: async () => {
        const token = get().token || localStorage.getItem('token');
        if (!token) {
          set({ isAuthenticated: false, user: null, isLoading: false });
          return;
        }

        set({ isLoading: true });
        try {
          const response = await authApi.getCurrentUser();
          if (response.success && response.user) {
            set({
              user: response.user as User,
              token,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            set({ isAuthenticated: false, user: null, token: null, isLoading: false });
          }
        } catch (error: any) {
          // Check if it's a network error (server might be waking up)
          if (error.message?.includes('fetch') || error.message?.includes('network') || !navigator.onLine) {
            // Keep the user logged in, but mark as loading
            // The app will retry on next request
            console.log('Network error during auth check, keeping session');
            set({
              isAuthenticated: true,
              token,
              isLoading: false,
            });
          } else {
            set({ isAuthenticated: false, user: null, token: null, isLoading: false });
          }
        }
      },

      refreshToken: async () => {
        try {
          const response = await authApi.refreshToken();
          if (response.success && response.token) {
            localStorage.setItem('token', response.token);
            set({
              token: response.token,
              user: response.user as User,
              isAuthenticated: true,
            });
            return true;
          }
          return false;
        } catch (error) {
          console.error('Token refresh failed:', error);
          return false;
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token }),
    }
  )
);
