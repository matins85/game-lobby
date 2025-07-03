import { create, StateCreator } from 'zustand';

interface UserInfo {
  username: string;
}

interface UserState {
  user: UserInfo | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  setUser: (user: UserInfo, token: string) => void;
  logout: () => void;
  setError: (error: string | null) => void;
  loadFromStorage: () => void;
}

export const useUserStore = create<UserState>(((set: (partial: Partial<UserState>) => void) => ({
  user: null,
  token: null,
  loading: false,
  error: null,
  setUser: (user: UserInfo, token: string) => {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('authToken', token);
    set({ user, token, error: null });
  },
  logout: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    set({ user: null, token: null, error: null });
    window.location.href = '/auth';
  },
  setError: (error: string | null) => set({ error }),
  loadFromStorage: () => {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('authToken');
    if (userStr && token) {
      try {
        const user = JSON.parse(userStr);
        set({ user, token });
      } catch {
        set({ user: null, token: null });
      }
    }
  },
})) as StateCreator<UserState>); 