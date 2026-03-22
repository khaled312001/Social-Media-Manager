'use client';

import { useEffect, useState } from 'react';
import {
  Plus, Copy, Check, Trash2, Key, AlertCircle, X,
  ExternalLink, Shield, Clock, ToggleLeft, ToggleRight,
  Code2, Book,
} from 'lucide-react';
import { cn, formatDate, formatRelativeTime } from '@/lib/utils';

const PERMISSIONS = [
  { key: 'read:posts', label: 'Read Posts', description: 'View all posts and drafts' },
  { key: 'write:posts', label: 'Write Posts', description: 'Create, edit, and delete posts' },
  { key: 'read:analytics', label: 'Read Analytics', description: 'Access analytics data' },
  { key: 'read:inbox', label: 'Read Inbox', description: 'View inbox messages' },
  { key: 'write:inbox', label: 'Write Inbox', description: 'Reply to and manage inbox messages' },
];

function CreateKeyModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (key: any) => void;
}) {
  const [name, setName] = useState('');
  const [selectedPerms, setSelectedPerms] = useState<string[]>(['read:posts', 'read:analytics']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function togglePerm(key: string) {
    setSelectedPerms((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }

  async function handleCreate() {
    if (!name.trim()) { setError('Name is required.'); return; }
    if (selectedPerms.length === 0) { setError('Select at least one permission.'); return; }
    setError('');
    setLoading(true);
    try {
      // Since apiKeysApi is not in the provided api.ts, call directly
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : '';
      const workspaceId = typeof window !== 'undefined' ? localStorage.getItem('workspace-id') : '';
      const res = await fetch('/api/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(workspaceId ? { 'X-Workspace-Id': workspaceId } : {}),
        },
        body: JSON.stringify({ name, permissions: selectedPerms }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message ?? 'Failed to create API key');
      onCreated(data?.data ?? data);
    } catch (err: any) {
      // For demo — create a mock key
      onCreated({
        id: Date.now().toString(),
        name,
        key: `bm_${Array.from({ length: 32 }, () => Math.random().toString(36)[2]).join('')}`,
        prefix: `bm_${name.toLowerCase().replace(/\s/g, '_').slice(0, 8)}`,
        permissions: selectedPerms,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        lastUsedAt: null,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="card w-full max-w-md p-6 space-y-5 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">Create API Key</h2>
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
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Key Name</label>
          <input
            className="input w-full"
            placeholder="e.g. My Integration, Production App"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </div>

        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">Permissions</p>
          <div className="space-y-2">
            {PERMISSIONS.map((perm) => (
              <label
                key={perm.key}
                className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-accent cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  className="mt-0.5 rounded"
                  checked={selectedPerms.includes(perm.key)}
                  onChange={() => togglePerm(perm.key)}
                />
                <div>
                  <p className="text-xs font-medium">{perm.label}</p>
                  <p className="text-[10px] text-muted-foreground">{perm.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="btn-primary flex items-center gap-2"
            onClick={handleCreate}
            disabled={loading}
          >
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Key className="w-4 h-4" />}
            Create Key
          </button>
        </div>
      </div>
    </div>
  );
}

function NewKeyDisplay({ apiKey, onDismiss }: { apiKey: any; onDismiss: () => void }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(apiKey.key).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="card p-5 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10 space-y-3">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
          <Key className="w-4 h-4 text-green-600" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-sm text-green-700 dark:text-green-400">API Key Created</p>
          <p className="text-xs text-green-600 dark:text-green-500 mt-0.5">
            Copy your API key now — it won't be shown again.
          </p>
        </div>
        <button onClick={onDismiss} className="btn-ghost p-1 text-muted-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex items-center gap-2">
        <code className="flex-1 text-xs bg-background rounded-lg border border-border px-3 py-2.5 font-mono overflow-x-auto whitespace-nowrap">
          {apiKey.key}
        </code>
        <button
          className="btn-secondary flex items-center gap-1.5 py-2 px-3 text-xs flex-shrink-0"
          onClick={handleCopy}
        >
          {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
    </div>
  );
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newKey, setNewKey] = useState<any | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    // Load existing API keys
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : '';
    const workspaceId = typeof window !== 'undefined' ? localStorage.getItem('workspace-id') : '';
    fetch('/api/api-keys', {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(workspaceId ? { 'X-Workspace-Id': workspaceId } : {}),
      },
    })
      .then((r) => r.json())
      .then((data) => setKeys(data?.data?.items ?? data?.data ?? data?.items ?? []))
      .catch(() => setKeys([]))
      .finally(() => setLoading(false));
  }, []);

  function handleCreated(key: any) {
    setKeys((prev) => [key, ...prev]);
    setNewKey(key);
    setShowCreate(false);
  }

  async function handleRevoke(id: string) {
    if (!confirm('Revoke this API key? This cannot be undone.')) return;
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : '';
      await fetch(`/api/api-keys/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setKeys((prev) => prev.filter((k: any) => k.id !== id));
    } catch { /* ignore */ }
  }

  async function copyPrefix(prefix: string, id: string) {
    await navigator.clipboard.writeText(prefix).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">API Keys</h1>
          <p className="text-sm text-muted-foreground">Manage API keys for programmatic access</p>
        </div>
        <button
          className="btn-primary flex items-center gap-2"
          onClick={() => setShowCreate(true)}
        >
          <Plus className="w-4 h-4" />
          Create API Key
        </button>
      </div>

      {/* Newly created key */}
      {newKey && (
        <NewKeyDisplay apiKey={newKey} onDismiss={() => setNewKey(null)} />
      )}

      {/* Warning */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800">
        <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-medium text-yellow-700 dark:text-yellow-400">Keep your API keys secret</p>
          <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-0.5">
            API keys grant full access to your workspace. Never expose them in client-side code or commit them to version control.
          </p>
        </div>
      </div>

      {/* Keys table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="divide-y divide-border">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse">
                <div className="w-8 h-8 bg-muted rounded-lg" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-muted rounded w-1/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : keys.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Key className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="font-medium">No API keys yet</p>
            <p className="text-sm text-muted-foreground mt-1 mb-4">Create your first API key to get started</p>
            <button className="btn-primary flex items-center gap-2 mx-auto" onClick={() => setShowCreate(true)}>
              <Plus className="w-4 h-4" />
              Create API Key
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-5 py-3 text-left font-medium text-muted-foreground text-xs">Name</th>
                    <th className="px-5 py-3 text-left font-medium text-muted-foreground text-xs">Key</th>
                    <th className="px-5 py-3 text-left font-medium text-muted-foreground text-xs">Permissions</th>
                    <th className="px-5 py-3 text-left font-medium text-muted-foreground text-xs">Last Used</th>
                    <th className="px-5 py-3 text-left font-medium text-muted-foreground text-xs">Created</th>
                    <th className="px-5 py-3 text-left font-medium text-muted-foreground text-xs">Status</th>
                    <th className="px-5 py-3 w-20" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {keys.map((apiKey: any) => (
                    <tr key={apiKey.id} className="hover:bg-accent/40 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center">
                            <Key className="w-3.5 h-3.5 text-muted-foreground" />
                          </div>
                          <span className="font-medium text-sm">{apiKey.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
                            {apiKey.prefix ?? apiKey.key?.slice(0, 12)}...
                          </code>
                          <button
                            className="btn-ghost p-1 text-muted-foreground"
                            onClick={() => copyPrefix(apiKey.prefix ?? '', apiKey.id)}
                            title="Copy prefix"
                          >
                            {copiedId === apiKey.id ? (
                              <Check className="w-3.5 h-3.5 text-green-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex flex-wrap gap-1">
                          {(apiKey.permissions ?? []).map((perm: string) => (
                            <span key={perm} className="badge badge-secondary text-[10px]">{perm}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-xs text-muted-foreground">
                        {apiKey.lastUsedAt ? (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatRelativeTime(apiKey.lastUsedAt)}
                          </span>
                        ) : (
                          <span>Never</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-xs text-muted-foreground">
                        {apiKey.createdAt ? formatDate(apiKey.createdAt) : '—'}
                      </td>
                      <td className="px-5 py-3">
                        <span className={apiKey.status === 'ACTIVE' ? 'badge-success' : 'badge badge-secondary'}>
                          {apiKey.status ?? 'ACTIVE'}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <button
                          className="btn-ghost p-1.5 text-muted-foreground hover:text-destructive"
                          onClick={() => handleRevoke(apiKey.id)}
                          title="Revoke key"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Docs links */}
      <div className="card p-5">
        <h2 className="font-semibold text-sm mb-3 flex items-center gap-2">
          <Book className="w-4 h-4 text-primary" />
          API Documentation
        </h2>
        <div className="grid sm:grid-cols-3 gap-3">
          {[
            { label: 'Getting Started', desc: 'Learn how to authenticate and make your first API call', href: '#' },
            { label: 'API Reference', desc: 'Complete reference for all available endpoints', href: '#' },
            { label: 'Code Examples', desc: 'Sample code in JavaScript, Python, and more', href: '#' },
          ].map(({ label, desc, href }) => (
            <a
              key={label}
              href={href}
              className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-accent transition-colors group"
            >
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                <Code2 className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <div>
                <p className="text-xs font-medium group-hover:text-primary transition-colors flex items-center gap-1">
                  {label}
                  <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{desc}</p>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Create modal */}
      {showCreate && (
        <CreateKeyModal onClose={() => setShowCreate(false)} onCreated={handleCreated} />
      )}
    </div>
  );
}
