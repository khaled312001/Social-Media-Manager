'use client';

import { useAuthStore } from '@/store/auth.store';
import { useWorkspaceStore } from '@/store/workspace.store';
import { useCallback } from 'react';

export function useWorkspace() {
  const { workspace, workspaces, setWorkspace } = useAuthStore();
  const { members, invitations, isLoading, fetchMembers, inviteMember, updateMemberRole, removeMember } =
    useWorkspaceStore();

  const switchWorkspace = useCallback(
    (ws: { id: string; name: string; slug: string; logoUrl?: string }) => {
      setWorkspace(ws);
    },
    [setWorkspace],
  );

  return {
    workspace,
    workspaces,
    members,
    invitations,
    isLoading,
    switchWorkspace,
    fetchMembers: () => workspace && fetchMembers(workspace.id),
    inviteMember: (email: string, role: string) =>
      workspace && inviteMember(workspace.id, email, role),
    updateMemberRole: (memberId: string, role: string) =>
      workspace && updateMemberRole(workspace.id, memberId, role),
    removeMember: (memberId: string) =>
      workspace && removeMember(workspace.id, memberId),
  };
}
