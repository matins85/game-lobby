import { useEffect } from "react";
import { create } from "zustand";
import { GameWebSocket } from "../lib/ws";

export interface GameSession {
  id: number;
  session_id: string;
  start_time: string;
  end_time: string | null;
  winning_number: number | null;
  is_active: boolean;
  player_count: number;
  time_remaining: number;
  players: string[];
  participations: Array<{
    username: string;
    selected_number: number | null;
    is_winner: boolean;
  }>;
}

interface GameSessionState {
  session: GameSession | null;
  loading: boolean;
  error: string | null;
  ws: GameWebSocket | null;
  connect: (token: string | null) => void;
  disconnect: () => void;
  submitNumber: (number: number) => void;
  endSessionAndCreateNew: (sessionId: string) => void;
  updateUserStats: (sessionId: string, winningNumber: number) => void;
}

export const useGameSessionStore = create<GameSessionState>((set, get) => ({
  session: null,
  loading: false,
  error: null,
  ws: null,
  connect: (token: string | null) => {
    set({ loading: true, error: null });
    let wsToken: string | null = token;
    if (!wsToken && typeof window !== "undefined") {
      wsToken = localStorage.getItem("authToken");
    }

    const ws = new GameWebSocket(wsToken);

    ws.setOnMessage((msg) => {
      if (msg.type === "session_update") {
        set({ session: msg.session, loading: false, error: null });
      } else if (msg.type === "session_info") {
        set({ session: msg.session, loading: false, error: null });
      } else if (msg.type === "game_session_manager_result") {
        if (msg.result && msg.result.session_id) {
          set((prev) => ({
            ...prev,
            session: {
              id: prev.session?.id ?? 0,
              session_id:
                msg.result.session_id ?? prev.session?.session_id ?? "",
              start_time: prev.session?.start_time ?? "",
              end_time: prev.session?.end_time ?? null,
              winning_number: prev.session?.winning_number ?? null,
              is_active:
                msg.result.is_active ?? prev.session?.is_active ?? false,
              player_count:
                msg.result.player_count ?? prev.session?.player_count ?? 0,
              time_remaining:
                msg.result.time_left ?? prev.session?.time_remaining ?? 0,
              players: prev.session?.players ?? [],
              participations: prev.session?.participations ?? [],
            },
          }));
        }
        set({ loading: false, error: null });
      } else if (
        msg.type === "end_session_and_create_new_result" &&
        msg.result
      ) {
        set((prev) => ({
          ...prev,
          session: {
            ...prev.session,
            session_id: msg.result.new_session_id ?? "",
            start_time: msg.result.new_session_start_time ?? "",
            is_active: true,
            time_remaining: 20,
            player_count: 0,
            winning_number: null,
            id: prev.session?.id ?? 0,
            end_time: null,
            players: [],
            participations: [],
          },
        }));
        set({ loading: false, error: null });
      } else if (msg.type === "update_user_stats_result") {
        set({ loading: false, error: null });
      } else if (msg.type === "error") {
        set({ error: msg.message, loading: false });
      }
    });
    ws.setOnError((err) => {
      console.error("WebSocket error:", err);
      set({ error: err.message, loading: false });
    });
    ws.setOnClose(() => set({ ws: null, session: null, loading: false }));
    set({ ws });
  },
  disconnect: () => {
    const ws = get().ws;
    if (ws) ws.close();
    set({ ws: null, session: null, loading: false });
  },
  submitNumber: (number: number) => {
    const ws = get().ws;
    if (ws) {
      ws.selectNumber(number);
    } else {
      console.error("WebSocket not connected!");
    }
  },
  endSessionAndCreateNew: (sessionId: string) => {
    const ws = get().ws;
    if (ws) ws.endSessionAndCreateNew(sessionId);
  },
  updateUserStats: (sessionId: string, winningNumber: number) => {
    const ws = get().ws;
    if (ws) ws.updateUserStats(sessionId, winningNumber);
  },
}));

export function useSessionOrchestrator() {
  const { session, endSessionAndCreateNew } = useGameSessionStore();
  useEffect(() => {
    if (session && session.time_remaining === 0 && session.is_active) {
      endSessionAndCreateNew(session.session_id);
    }
  }, [session, endSessionAndCreateNew]);
}
