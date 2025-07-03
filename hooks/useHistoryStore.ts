import { create } from 'zustand';
import { apiFetch } from '../lib/api';

export interface GameSession {
  id: number;
  session_id: string;
  start_time: string;
  end_time: string | null;
  winning_number: number | null;
  is_active: boolean;
  player_count: number;
  created_at: string;
  updated_at: string;
  time_remaining: number;
}

export interface GameParticipation {
  username: string;
  selected_number: number | null;
  is_winner: boolean;
  joined_at: string;
  session: GameSession;
}

interface HistoryState {
  history: GameParticipation[];
  loading: boolean;
  error: string | null;
  fetchHistory: () => Promise<void>;
}

export const useHistoryStore = create<HistoryState>((set) => ({
  history: [],
  loading: false,
  error: null,
  fetchHistory: async () => {
    set({ loading: true, error: null });
    try {
      const data = await apiFetch<any>('users/game-history/');
      set({ history: Array.isArray(data.results) ? data.results : [], loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to load game history', loading: false });
    }
  },
})); 