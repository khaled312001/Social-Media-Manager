'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Save, Upload, Globe, Clock, Trash2, AlertTriangle, X,
  Loader2, CheckCircle, RefreshCw, Building2, Sliders,
} from 'lucide-react';
import { workspacesApi } from '@/lib/api';
import { cn } from '@/lib/utils';

const TIMEZONES = [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Denver',
  'America/Los_Angeles', 'America/Sao_Paulo', 'Europe/London',
  'Europe/Paris', 'Europe/Berlin', 'Europe/Moscow',
  'Asia/Dubai', 'Asia/Kolkata', 'Asia/Singapore',
  'Asia/Tokyo', 'Asia/Shanghai', 'Australia/Sydney',
  'Pacific/Auckland',
];

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'ja', label: 'Japanese' },
  { code: 'zh', label: 'Chinese (Simplified)' },
  { code: 'ar', label: 'Arabic' },
];

const DEFAULT_TIMES = [
  '08:00', '09:00', '10:00', '12:00', '14:00',
  '15:00', '17:00', '18:00', '19:00', '20:00',
];

function SuccessToast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-green-600 text-white rounded-xl shadow-lg">
      <CheckCircle className="w-4 h-4" />
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
}

export default function GeneralSettingsPage() {
  const [workspace, setWorkspace] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [showDeleteDanger, setShowDeleteDanger] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [timezone, setTimezone] = useState('UTC');
  const [language, setLanguage] = useState('en');
  const [defaultPostTime, setDefaultPostTime] = useState('09:00');
  const [bestTimeEnabled, setBestTimeEnabled] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const workspaceId = typeof window !== 'undefined' ? localStorage.getItem('workspace-id') ?? '' : '';

  useEffect(() => {
    workspacesApi
      .get(workspaceId)
      .then((res: any) => {
        const data = res?.data ?? res;
        setWorkspace(data);
        setName(data?.name ?? '');
        setSlug(data?.slug ?? '');
        setLogoUrl(data?.logoUrl ?? '');
        setTimezone(data?.timezone ?? 'UTC');
        setLanguage(data?.language ?? 'en');
        setDefaultPostTime(data?.settings?.defaultPostTime ?? '09:00');
        setBestTimeEnabled(data?.settings?.bestTimeEnabled ?? false);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [workspaceId]);

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await workspacesApi.update(workspaceId, {
        name,
        slug,
        logoUrl,
        timezone,
        language,
        settings: { defaultPostTime, bestTimeEnabled },
      });
      setToast('Settings saved successfully');
    } catch {
      setToast('Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setLogoUrl(url);
    }
  }

  function generateSlug(n: string) {
    return n.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  const canDelete = deleteConfirmName === (workspace?.name ?? '');

  if (loading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="card p-6 animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4" />
            <div className="space-y-2">
              <div className="h-9 bg-muted rounded" />
              <div className="h-9 bg-muted rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">General Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your workspace configuration and preferences</p>
      </div>

      {/* Workspace info */}
      <div className="card p-6 space-y-5">
        <div className="flex items-center gap-2 mb-1">
          <Building2 className="w-4 h-4 text-primary" />
          <h2 className="font-semibold text-sm">Workspace Identity</h2>
        </div>

        {/* Logo upload */}
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-xl border-2 border-dashed border-border flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="w-full h-full object-cover rounded-xl" />
            ) : (
              <div className="flex flex-col items-center text-muted-foreground">
                <Upload className="w-5 h-5" />
                <span className="text-[10px] mt-0.5">Logo</span>
              </div>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
          <div>
            <button
              className="btn-secondary flex items-center gap-2 text-xs py-1.5 px-3"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-3.5 h-3.5" />
              Upload Logo
            </button>
            {logoUrl && (
              <button
                className="btn-ghost text-xs py-1 px-2 text-muted-foreground mt-1"
                onClick={() => setLogoUrl('')}
              >
                Remove
              </button>
            )}
            <p className="text-[10px] text-muted-foreground mt-1">PNG, JPG up to 2MB. Recommended 256×256px</p>
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Workspace Name</label>
          <input
            className="input w-full"
            placeholder="Acme Corporation"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!workspace?.slug) setSlug(generateSlug(e.target.value));
            }}
          />
        </div>

        {/* Slug */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Workspace Slug</label>
          <div className="flex items-center">
            <span className="flex items-center px-3 h-9 bg-muted border border-border border-r-0 rounded-l-md text-xs text-muted-foreground">
              barmagly.com/
            </span>
            <input
              className="input rounded-l-none flex-1"
              placeholder="acme-corp"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
            />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">Only lowercase letters, numbers, and hyphens</p>
        </div>
      </div>

      {/* Localization */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Globe className="w-4 h-4 text-blue-500" />
          <h2 className="font-semibold text-sm">Localization</h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {/* Timezone */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Timezone
            </label>
            <select
              className="input w-full"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>{tz.replace('_', ' ')}</option>
              ))}
            </select>
          </div>

          {/* Language */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Language</label>
            <select
              className="input w-full"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>{lang.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Publishing preferences */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Sliders className="w-4 h-4 text-green-500" />
          <h2 className="font-semibold text-sm">Publishing Preferences</h2>
        </div>

        {/* Default posting time */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Default Publishing Time</label>
          <select
            className="input w-full"
            value={defaultPostTime}
            onChange={(e) => setDefaultPostTime(e.target.value)}
          >
            {DEFAULT_TIMES.map((t) => (
              <option key={t} value={t}>
                {(() => {
                  const [h, m] = t.split(':');
                  const hour = parseInt(h);
                  return `${hour === 0 ? 12 : hour > 12 ? hour - 12 : hour}:${m} ${hour < 12 ? 'AM' : 'PM'}`;
                })()}
              </option>
            ))}
          </select>
          <p className="text-[10px] text-muted-foreground mt-1">
            Default time used when scheduling posts (in your workspace timezone: {timezone})
          </p>
        </div>

        {/* Best time toggle */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-muted/40">
          <div>
            <p className="text-sm font-medium">Auto-optimize posting time</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              AI will suggest the best posting time based on your audience activity
            </p>
          </div>
          <button
            onClick={() => setBestTimeEnabled(!bestTimeEnabled)}
            className={cn('transition-colors', bestTimeEnabled ? 'text-green-500' : 'text-muted-foreground')}
          >
            {bestTimeEnabled ? (
              <div className="w-10 h-6 rounded-full bg-green-500 flex items-center justify-end px-1">
                <div className="w-4 h-4 rounded-full bg-white" />
              </div>
            ) : (
              <div className="w-10 h-6 rounded-full bg-muted-foreground/30 flex items-center px-1">
                <div className="w-4 h-4 rounded-full bg-white" />
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <button
          className="btn-primary flex items-center gap-2"
          onClick={handleSave}
          disabled={saving || !name.trim()}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Danger zone */}
      <div className="card p-6 border-destructive/30 space-y-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-destructive" />
          <h2 className="font-semibold text-sm text-destructive">Danger Zone</h2>
        </div>

        <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-destructive/5 border border-destructive/20">
          <div>
            <p className="text-sm font-medium">Delete Workspace</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Permanently delete your workspace and all associated data. This action is irreversible.
            </p>
          </div>
          <button
            className="btn-destructive flex-shrink-0 py-1.5 px-3 text-xs"
            onClick={() => setShowDeleteDanger(true)}
          >
            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
            Delete
          </button>
        </div>

        {showDeleteDanger && (
          <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/5 space-y-3">
            <p className="text-sm font-medium text-destructive">
              Are you absolutely sure? This will permanently delete the workspace "{workspace?.name}".
            </p>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">
                Type <strong>{workspace?.name}</strong> to confirm
              </label>
              <input
                className="input w-full border-destructive/50 focus-visible:ring-destructive"
                placeholder={workspace?.name}
                value={deleteConfirmName}
                onChange={(e) => setDeleteConfirmName(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <button
                className="btn-ghost text-xs"
                onClick={() => { setShowDeleteDanger(false); setDeleteConfirmName(''); }}
              >
                Cancel
              </button>
              <button
                className="btn-destructive text-xs flex items-center gap-1.5"
                disabled={!canDelete}
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Workspace Permanently
              </button>
            </div>
          </div>
        )}
      </div>

      {toast && <SuccessToast message={toast} onClose={() => setToast('')} />}
    </div>
  );
}
