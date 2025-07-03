import { create } from 'zustand';
import { apiFetch } from '../lib/api';

export interface UserStats {
  username: string;
  wins: number;
  games_played: number;
  win_rate: number;
  current_streak: number;
  best_streak: number;
  last_played: string | null;
}

interface UserStatsState {
  stats: UserStats | null;
  loading: boolean;
  error: string | null;
  fetchStats: (userId: number) => Promise<void>;
}

export const useUserStatsStore = create<UserStatsState>((set) => ({
  stats: null,
  loading: false,
  error: null,
  fetchStats: async (userId: number) => {
    set({ loading: true, error: null });
    try {
      const data = await apiFetch<UserStats>(`users/${userId}/stats/`);
      set({ stats: data, loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to load user stats', loading: false });
    }
  },
})); 