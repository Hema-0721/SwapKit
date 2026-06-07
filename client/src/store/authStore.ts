import { create } from 'zustand';

interface UserProfile {
  id: string;
  displayName?: string;
  schoolId?: string;
  defaultGrade?: number;
  language: string;
  isNgo: boolean;
  isPro: boolean;
  ratingAvg?: number;
  ratingCount?: number;
  phoneHash?: string;
}

interface AuthState {
  accessToken: string | null;
  user: UserProfile | null;
  isAuthenticated: boolean;
  setAuth: (accessToken: string, user: UserProfile) => void;
  clearAuth: () => void;
  updateUser: (userUpdates: Partial<UserProfile>) => void;
  setAccessToken: (accessToken: string) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  isAuthenticated: false,
  setAuth: (accessToken, user) => set({ accessToken, user, isAuthenticated: true }),
  clearAuth: () => set({ accessToken: null, user: null, isAuthenticated: false }),
  updateUser: (userUpdates) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...userUpdates } : null,
    })),
  setAccessToken: (accessToken) => set({ accessToken, isAuthenticated: !!accessToken }),
}));
