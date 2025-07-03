import { create } from 'zustand';
import { apiFetch } from '../lib/api';

export interface LeaderboardEntry {
  rank: number;
  username: string;
  wins: number;
  games_played: number;
  win_rate: number;
  best_streak: number;
}

interface LeaderboardState {
  leaderboard: LeaderboardEntry[];
  loading: boolean;
  error: string | null;
  fetchLeaderboard: () => Promise<void>;
}

export const useLeaderboardStore = create<LeaderboardState>((set) => ({
  leaderboard: [],
  loading: false,
  error: null,
  fetchLeaderboard: async () => {
    set({ loading: true, error: null });
    try {
      const data = await apiFetch<any>('leaderboard/top10/');
      set({ leaderboard: Array.isArray(data.results) ? data.results : [], loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to load leaderboard', loading: false });
    }
  },
})); 