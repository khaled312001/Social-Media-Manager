'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { authApi, usersApi, workspacesApi } from '@/lib/api';

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

interface Workspace {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
}

interface AuthState {
  user: User | null;
  workspace: Workspace | null;
  workspaces: Workspace[];
  accessToken: string | null;
  isLoading: boolean;

  login: (email: string, password: string, totpCode?: string) => Promise<void>;
  register: (data: { name: string; email: string; password: string; workspaceName: string }) => Promise<void>;
  logout: () => Promise<void>;
  setWorkspace: (workspace: Workspace) => void;
  fetchWorkspaces: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      workspace: null,
      workspaces: [],
      accessToken: null,
      isLoading: false,

      login: async (email, password, totpCode) => {
        set({ isLoading: true });
        try {
          const res = await authApi.login({ email, password, totpCode }) as any;
          const data = res.data ?? res;
          localStorage.setItem('auth-token', data.accessToken);
          localStorage.setItem('refresh-token', data.refreshToken);
          if (data.workspace) {
            localStorage.setItem('workspace-id', data.workspace.id);
          }
          set({
            user: data.user,
            workspace: data.workspace,
            accessToken: data.accessToken,
          });
          await get().fetchWorkspaces();
        } finally {
          set({ isLoading: false });
        }
      },

      register: async (data) => {
        set({ isLoading: true });
        try {
          const res = await authApi.register(data) as any;
          const result = res.data ?? res;
          localStorage.setItem('auth-token', result.accessToken);
          localStorage.setItem('refresh-token', result.refreshToken);
          localStorage.setItem('workspace-id', result.workspace.id);
          set({
            user: result.user,
            workspace: result.workspace,
            accessToken: result.accessToken,
          });
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        try { await authApi.logout(); } catch {}
        localStorage.removeItem('auth-token');
        localStorage.removeItem('refresh-token');
        localStorage.removeItem('workspace-id');
        set({ user: null, workspace: null, workspaces: [], accessToken: null });
      },

      setWorkspace: (workspace) => {
        localStorage.setItem('workspace-id', workspace.id);
        set({ workspace });
      },

      fetchWorkspaces: async () => {
        try {
          const res = await workspacesApi.list() as any;
          const data = res.data ?? res;
          const workspaces = data.map((m: any) => m.workspace);
          set({ workspaces });
          if (!get().workspace && workspaces[0]) {
            get().setWorkspace(workspaces[0]);
          }
        } catch {}
      },

      refreshUser: async () => {
        try {
          const res = await usersApi.getMe() as any;
          set({ user: res.data ?? res });
        } catch {}
      },
    }),
    {
      name: 'barmagly-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ user: state.user, workspace: state.workspace, accessToken: state.accessToken }),
    },
  ),
);
