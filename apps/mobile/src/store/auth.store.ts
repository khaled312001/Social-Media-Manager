import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { authApi } from '../lib/api';

interface AuthState {
  user: { id: string; name: string; email: string; avatar?: string } | null;
  workspace: { id: string; name: string; slug: string } | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string, totpCode?: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  workspace: null,
  accessToken: null,
  isLoading: false,

  login: async (email, password, totpCode) => {
    set({ isLoading: true });
    try {
      const { data } = await authApi.login(email, password, totpCode) as any;
      await SecureStore.setItemAsync('auth-token', data.accessToken);
      await SecureStore.setItemAsync('refresh-token', data.refreshToken);
      if (data.workspace) {
        await SecureStore.setItemAsync('workspace-id', data.workspace.id);
      }
      set({ user: data.user, workspace: data.workspace, accessToken: data.accessToken });
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    try { await authApi.logout(); } catch {}
    await SecureStore.deleteItemAsync('auth-token');
    await SecureStore.deleteItemAsync('refresh-token');
    await SecureStore.deleteItemAsync('workspace-id');
    set({ user: null, workspace: null, accessToken: null });
  },
}));
