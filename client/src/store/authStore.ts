import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, AuthTokens } from '../types';

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  setAuth: (user: User, tokens: AuthTokens) => void;
  updateUser: (user: Partial<User>) => void;
  logout: () => void;
  setTokens: (tokens: AuthTokens) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      tokens: null,
      isAuthenticated: false,
      setAuth: (user, tokens) => set({ user, tokens, isAuthenticated: true }),
      updateUser: (userData) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        })),
      logout: () => set({ user: null, tokens: null, isAuthenticated: false }),
      setTokens: (tokens) => set({ tokens }),
    }),
    {
      name: 'auth-storage',
    }
  )
);
