'use client';

import { useEffect, useState } from 'react';
import {
  CheckCircle, XCircle, RefreshCw, Link2, Unlink, AlertCircle,
  Users, Clock, ExternalLink,
} from 'lucide-react';
import { socialAccountsApi } from '@/lib/api';
import { cn, formatNumber, formatRelativeTime } from '@/lib/utils';

const PLATFORM_COLORS: Record<string, string> = {
  FACEBOOK: '#1877F2',
  INSTAGRAM: '#E1306C',
  TWITTER: '#1DA1F2',
  TIKTOK: '#010101',
  LINKEDIN: '#0A66C2',
  YOUTUBE: '#FF0000',
};

const PLATFORM_ICONS: Record<string, string> = {
  FACEBOOK: 'f',
  INSTAGRAM: '◈',
  TWITTER: '𝕏',
  TIKTOK: '♪',
  LINKEDIN: 'in',
  YOUTUBE: '▶',
};

const ALL_PLATFORMS = [
  { key: 'FACEBOOK', name: 'Facebook' },
  { key: 'INSTAGRAM', name: 'Instagram' },
  { key: 'TWITTER', name: 'Twitter / X' },
  { key: 'TIKTOK', name: 'TikTok' },
  { key: 'LINKEDIN', name: 'LinkedIn' },
  { key: 'YOUTUBE', name: 'YouTube' },
];

function ConfirmDialog({
  open,
  title,
  description,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="card w-full max-w-sm p-6 space-y-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <h3 className="font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button className="btn-secondary" onClick={onCancel}>Cancel</button>
          <button className="btn-destructive" onClick={onConfirm}>Disconnect</button>
        </div>
      </div>
    </div>
  );
}

export default function AccountsSettingsPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);

  const loadAccounts = () => {
    setLoading(true);
    socialAccountsApi
      .list()
      .then((res: any) => {
        const data = res?.data ?? res;
        setAccounts(data?.items ?? data ?? []);
      })
      .catch(() => setAccounts([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAccounts();

    // Listen for OAuth popup callback
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      if (e.data?.type !== 'OAUTH_CALLBACK') return;
      setConnectingPlatform(null);
      if (e.data.success) {
        loadAccounts(); // refresh list after successful connection
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleConnect(platform: string) {
    setConnectingPlatform(platform);
    try {
      const res: any = await socialAccountsApi.getOAuthUrl(platform);
      const url = res?.data?.url ?? res?.url;
      if (!url) { setConnectingPlatform(null); return; }

      // Open OAuth in a small popup so user never leaves the page
      const popup = window.open(
        url,
        `oauth_${platform}`,
        'width=560,height=680,scrollbars=yes,resizable=yes,toolbar=no,menubar=no',
      );

      // Poll to detect if popup was closed without completing OAuth
      const timer = setInterval(() => {
        if (popup?.closed) {
          clearInterval(timer);
          setConnectingPlatform(null);
        }
      }, 800);
    } catch {
      setConnectingPlatform(null);
    }
  }

  async function handleDisconnect(id: string) {
    try {
      await socialAccountsApi.disconnect(id);
      setAccounts((prev) => prev.filter((a: any) => a.id !== id));
    } catch { /* ignore */ } finally {
      setConfirmId(null);
    }
  }

  // Map connected accounts by platform
  const connectedByPlatform: Record<string, any> = {};
  accounts.forEach((a: any) => {
    const key = (a.platform ?? '').toUpperCase();
    if (!connectedByPlatform[key]) connectedByPlatform[key] = [];
    (connectedByPlatform[key] as any[]).push(a);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Connected Accounts</h1>
        <p className="text-sm text-muted-foreground">Manage your social media platform connections</p>
      </div>

      {/* Platform cards grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {ALL_PLATFORMS.map((platform) => {
          const connected = connectedByPlatform[platform.key] ?? [];
          const isConnected = connected.length > 0;
          const account = connected[0];

          return (
            <div key={platform.key} className="card p-5 space-y-4">
              {/* Platform header */}
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                  style={{ background: PLATFORM_COLORS[platform.key] ?? '#888' }}
                >
                  {PLATFORM_ICONS[platform.key]}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{platform.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {isConnected ? (
                      <>
                        <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                        <span className="text-xs text-green-600 font-medium">Connected</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Not connected</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Account info if connected */}
              {isConnected && account && (
                <div className="bg-muted/40 rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ background: PLATFORM_COLORS[platform.key] ?? '#888' }}
                    >
                      {(account.username ?? account.name ?? 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-medium">
                        @{account.username ?? account.name ?? 'unknown'}
                      </p>
                      {account.accountName && (
                        <p className="text-[10px] text-muted-foreground">{account.accountName}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {formatNumber(account.followersCount ?? 0)} followers
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {account.lastSyncAt ? formatRelativeTime(account.lastSyncAt) : 'Never synced'}
                    </span>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              {loading ? (
                <div className="h-9 bg-muted rounded-lg animate-pulse" />
              ) : isConnected ? (
                <div className="flex gap-2">
                  <button
                    className="btn-secondary flex items-center gap-1.5 py-1.5 px-3 text-xs flex-1 justify-center"
                    onClick={() => handleConnect(platform.key)}
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Refresh
                  </button>
                  <button
                    className="btn-destructive flex items-center gap-1.5 py-1.5 px-3 text-xs"
                    onClick={() => setConfirmId(account?.id)}
                  >
                    <Unlink className="w-3.5 h-3.5" />
                    Disconnect
                  </button>
                </div>
              ) : (
                <button
                  className="btn-primary flex items-center gap-2 w-full justify-center"
                  onClick={() => handleConnect(platform.key)}
                  disabled={connectingPlatform === platform.key}
                >
                  {connectingPlatform === platform.key ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Link2 className="w-4 h-4" />
                  )}
                  {connectingPlatform === platform.key ? 'Connecting...' : `Connect ${platform.name}`}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* All connected accounts list */}
      {accounts.length > 0 && (
        <div className="card">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="font-semibold text-sm">All Connected Accounts</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{accounts.length} account(s) connected</p>
          </div>
          <div className="divide-y divide-border">
            {accounts.map((account: any) => (
              <div key={account.id} className="flex items-center gap-4 px-5 py-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ background: PLATFORM_COLORS[account.platform?.toUpperCase()] ?? '#888' }}
                >
                  {(account.username ?? account.name ?? 'U').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">@{account.username ?? account.name ?? 'unknown'}</p>
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded-full text-white font-medium"
                      style={{ background: PLATFORM_COLORS[account.platform?.toUpperCase()] ?? '#888' }}
                    >
                      {account.platform}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatNumber(account.followersCount ?? 0)} followers
                    {account.lastSyncAt && ` · Synced ${formatRelativeTime(account.lastSyncAt)}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="badge-success flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Active
                  </span>
                  <button
                    className="btn-ghost p-1.5 text-muted-foreground hover:text-destructive"
                    onClick={() => setConfirmId(account.id)}
                    title="Disconnect"
                  >
                    <Unlink className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirm disconnect dialog */}
      <ConfirmDialog
        open={confirmId !== null}
        title="Disconnect Account"
        description="Are you sure you want to disconnect this account? This will stop all scheduled posts for this platform."
        onConfirm={() => confirmId && handleDisconnect(confirmId)}
        onCancel={() => setConfirmId(null)}
      />
    </div>
  );
}
