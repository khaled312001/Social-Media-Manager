'use client';

import { useEffect, useState } from 'react';
import {
  UserPlus, Trash2, X, Mail, AlertCircle, Clock,
  Shield, Crown, Eye, BarChart2, MessageSquare, Users,
  CheckCircle, Loader2,
} from 'lucide-react';
import { workspacesApi } from '@/lib/api';
import { cn, formatDate, formatRelativeTime } from '@/lib/utils';

const ROLES = [
  {
    key: 'OWNER',
    label: 'Owner',
    icon: Crown,
    color: 'text-yellow-600',
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    description: 'Full access to all workspace settings and billing',
  },
  {
    key: 'ADMIN',
    label: 'Admin',
    icon: Shield,
    color: 'text-red-600',
    bg: 'bg-red-50 dark:bg-red-900/20',
    description: 'Manage team, accounts, and all content',
  },
  {
    key: 'MANAGER',
    label: 'Manager',
    icon: Users,
    color: 'text-blue-600',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    description: 'Create, schedule, and publish content',
  },
  {
    key: 'MODERATOR',
    label: 'Moderator',
    icon: MessageSquare,
    color: 'text-green-600',
    bg: 'bg-green-50 dark:bg-green-900/20',
    description: 'Manage inbox and respond to messages',
  },
  {
    key: 'ANALYST',
    label: 'Analyst',
    icon: BarChart2,
    color: 'text-violet-600',
    bg: 'bg-violet-50 dark:bg-violet-900/20',
    description: 'View analytics and generate reports',
  },
  {
    key: 'MEMBER',
    label: 'Member',
    icon: Eye,
    color: 'text-gray-600',
    bg: 'bg-gray-50 dark:bg-gray-900/20',
    description: 'Read-only access to content and reports',
  },
];

function RoleBadge({ role }: { role: string }) {
  const r = ROLES.find((x) => x.key === role) ?? ROLES[ROLES.length - 1];
  const Icon = r.icon;
  return (
    <span className={cn('badge flex items-center gap-1 border-transparent', r.bg, r.color)}>
      <Icon className="w-3 h-3" />
      {r.label}
    </span>
  );
}

function getInitials(name: string) {
  return (name ?? '?').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

function InviteModal({
  onClose,
  onInvited,
  workspaceId,
}: {
  onClose: () => void;
  onInvited: (invite: any) => void;
  workspaceId: string;
}) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('MEMBER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleInvite() {
    if (!email.trim()) { setError('Email is required.'); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError('Enter a valid email address.'); return; }
    setError('');
    setLoading(true);
    try {
      await workspacesApi.invite(workspaceId, { email, role });
      onInvited({
        id: Date.now().toString(),
        email,
        role,
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
        createdAt: new Date().toISOString(),
      });
      onClose();
    } catch (err: any) {
      setError(err?.message ?? 'Failed to send invitation.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="card w-full max-w-md p-6 space-y-5 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">Invite Team Member</h2>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            {error}
          </div>
        )}

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Email Address</label>
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              className="input w-full pl-9"
              type="email"
              placeholder="colleague@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-2 block">Role</label>
          <div className="space-y-2">
            {ROLES.filter((r) => r.key !== 'OWNER').map((r) => {
              const Icon = r.icon;
              return (
                <label
                  key={r.key}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all',
                    role === r.key ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent'
                  )}
                >
                  <input
                    type="radio"
                    className="sr-only"
                    checked={role === r.key}
                    onChange={() => setRole(r.key)}
                  />
                  <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', r.bg)}>
                    <Icon className={cn('w-4 h-4', r.color)} />
                  </div>
                  <div>
                    <p className="text-xs font-medium">{r.label}</p>
                    <p className="text-[10px] text-muted-foreground">{r.description}</p>
                  </div>
                  {role === r.key && (
                    <CheckCircle className="w-4 h-4 text-primary ml-auto flex-shrink-0" />
                  )}
                </label>
              );
            })}
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="btn-primary flex items-center gap-2"
            onClick={handleInvite}
            disabled={loading}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            Send Invite
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TeamPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);

  const workspaceId = typeof window !== 'undefined' ? localStorage.getItem('workspace-id') ?? '' : '';

  useEffect(() => {
    workspacesApi
      .get(workspaceId)
      .then((res: any) => {
        const data = res?.data ?? res;
        setMembers(data?.members ?? []);
        setInvitations(data?.invitations ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [workspaceId]);

  async function handleRemoveMember(memberId: string) {
    if (!confirm('Remove this team member?')) return;
    try {
      await workspacesApi.removeMember(workspaceId, memberId);
      setMembers((prev) => prev.filter((m: any) => m.id !== memberId));
    } catch { /* ignore */ }
  }

  async function handleRevokeInvite(inviteId: string) {
    if (!confirm('Revoke this invitation?')) return;
    try {
      // Direct API call since workspacesApi doesn't have revokeInvite
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : '';
      await fetch(`/api/workspaces/${workspaceId}/invitations/${inviteId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setInvitations((prev) => prev.filter((i: any) => i.id !== inviteId));
    } catch { /* ignore */ }
  }

  function handleInvited(invite: any) {
    setInvitations((prev) => [invite, ...prev]);
  }

  const ROLE_PERMISSIONS: Record<string, string[]> = {
    OWNER: ['Full access', 'Billing', 'Team management', 'All content'],
    ADMIN: ['Team management', 'Connected accounts', 'All content', 'Analytics'],
    MANAGER: ['Create & publish posts', 'Campaigns', 'Scheduling', 'Analytics'],
    MODERATOR: ['Inbox', 'Reply to messages', 'Assign conversations'],
    ANALYST: ['View analytics', 'Export reports', 'View posts'],
    MEMBER: ['View content', 'View reports'],
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Team</h1>
          <p className="text-sm text-muted-foreground">Manage team members and their access levels</p>
        </div>
        <button
          className="btn-primary flex items-center gap-2"
          onClick={() => setShowInvite(true)}
        >
          <UserPlus className="w-4 h-4" />
          Invite Member
        </button>
      </div>

      {/* Members table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-sm">Team Members</h2>
          <span className="text-xs text-muted-foreground">{members.length} member(s)</span>
        </div>

        {loading ? (
          <div className="divide-y divide-border">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse">
                <div className="w-9 h-9 rounded-full bg-muted" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-muted rounded w-1/4" />
                  <div className="h-3 bg-muted rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : members.length === 0 ? (
          <div className="py-12 text-center">
            <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No team members yet</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {members.map((member: any) => (
              <div key={member.id} className="flex items-center gap-4 px-5 py-4 hover:bg-accent/30 transition-colors">
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary font-semibold text-sm">
                  {member.user?.avatarUrl ? (
                    <img
                      src={member.user.avatarUrl}
                      alt=""
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    getInitials(member.user?.name ?? member.user?.email ?? 'User')
                  )}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{member.user?.name ?? 'Unknown'}</p>
                    <RoleBadge role={member.role} />
                  </div>
                  <p className="text-xs text-muted-foreground">{member.user?.email ?? '—'}</p>
                </div>
                {/* Meta */}
                <div className="text-right text-xs text-muted-foreground hidden sm:block">
                  {member.joinedAt && <p>Joined {formatDate(member.joinedAt, 'MMM d, yyyy')}</p>}
                  {member.lastActiveAt && (
                    <p>Active {formatRelativeTime(member.lastActiveAt)}</p>
                  )}
                </div>
                {/* Remove */}
                {member.role !== 'OWNER' && (
                  <button
                    className="btn-ghost p-1.5 text-muted-foreground hover:text-destructive flex-shrink-0"
                    onClick={() => handleRemoveMember(member.id)}
                    title="Remove member"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending invitations */}
      {(loading || invitations.length > 0) && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold text-sm">Pending Invitations</h2>
            <span className="text-xs text-muted-foreground">{invitations.length} pending</span>
          </div>

          {loading ? (
            <div className="divide-y divide-border">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse">
                  <div className="w-9 h-9 rounded-full bg-muted" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-muted rounded w-1/3" />
                    <div className="h-3 bg-muted rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : invitations.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No pending invitations
            </div>
          ) : (
            <div className="divide-y divide-border">
              {invitations.map((invite: any) => (
                <div key={invite.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="w-9 h-9 rounded-full bg-muted/60 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{invite.email}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <RoleBadge role={invite.role} />
                      {invite.expiresAt && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Expires {formatDate(invite.expiresAt, 'MMM d')}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    className="btn-ghost p-1.5 text-muted-foreground hover:text-destructive flex-shrink-0"
                    onClick={() => handleRevokeInvite(invite.id)}
                    title="Revoke invitation"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Role permissions reference */}
      <div className="card p-5">
        <h2 className="font-semibold text-sm mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          Role Permissions
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {ROLES.map((role) => {
            const Icon = role.icon;
            const perms = ROLE_PERMISSIONS[role.key] ?? [];
            return (
              <div key={role.key} className={cn('rounded-xl border p-4 space-y-2', role.bg)}>
                <div className="flex items-center gap-2">
                  <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center bg-white/60 dark:bg-black/20')}>
                    <Icon className={cn('w-3.5 h-3.5', role.color)} />
                  </div>
                  <p className={cn('text-xs font-semibold', role.color)}>{role.label}</p>
                </div>
                <ul className="space-y-1">
                  {perms.map((perm) => (
                    <li key={perm} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                      <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                      {perm}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      {/* Invite modal */}
      {showInvite && (
        <InviteModal
          workspaceId={workspaceId}
          onClose={() => setShowInvite(false)}
          onInvited={handleInvited}
        />
      )}
    </div>
  );
}
