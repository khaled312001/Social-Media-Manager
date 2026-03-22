'use client';

import { create } from 'zustand';
import { workspacesApi } from '@/lib/api';

interface WorkspaceMember {
  id: string;
  userId: string;
  role: string;
  user: { id: string; name: string; email: string; avatar?: string };
}

interface WorkspaceInvitation {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
  createdAt: string;
}

interface WorkspaceState {
  members: WorkspaceMember[];
  invitations: WorkspaceInvitation[];
  isLoading: boolean;

  fetchMembers: (workspaceId: string) => Promise<void>;
  inviteMember: (workspaceId: string, email: string, role: string) => Promise<void>;
  updateMemberRole: (workspaceId: string, memberId: string, role: string) => Promise<void>;
  removeMember: (workspaceId: string, memberId: string) => Promise<void>;
  fetchInvitations: (workspaceId: string) => Promise<void>;
  revokeInvitation: (workspaceId: string, invitationId: string) => Promise<void>;
}

export const useWorkspaceStore = create<WorkspaceState>()((set) => ({
  members: [],
  invitations: [],
  isLoading: false,

  fetchMembers: async (workspaceId) => {
    set({ isLoading: true });
    try {
      const res = await workspacesApi.getMembers(workspaceId) as any;
      set({ members: res.data ?? res });
    } catch {} finally {
      set({ isLoading: false });
    }
  },

  inviteMember: async (workspaceId, email, role) => {
    const res = await workspacesApi.inviteMember(workspaceId, { email, role }) as any;
    const invitation = res.data ?? res;
    set((s) => ({ invitations: [...s.invitations, invitation] }));
  },

  updateMemberRole: async (workspaceId, memberId, role) => {
    await workspacesApi.updateMemberRole(workspaceId, memberId, { role });
    set((s) => ({
      members: s.members.map((m) => m.id === memberId ? { ...m, role } : m),
    }));
  },

  removeMember: async (workspaceId, memberId) => {
    await workspacesApi.removeMember(workspaceId, memberId);
    set((s) => ({ members: s.members.filter((m) => m.id !== memberId) }));
  },

  fetchInvitations: async (workspaceId) => {
    try {
      const res = await workspacesApi.getInvitations(workspaceId) as any;
      set({ invitations: res.data ?? res });
    } catch {}
  },

  revokeInvitation: async (workspaceId, invitationId) => {
    await workspacesApi.revokeInvitation(workspaceId, invitationId);
    set((s) => ({ invitations: s.invitations.filter((i) => i.id !== invitationId) }));
  },
}));
