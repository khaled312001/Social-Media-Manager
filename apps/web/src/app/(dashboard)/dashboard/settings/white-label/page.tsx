'use client';

import { useState } from 'react';
import { Palette, Globe, Upload, Save, Loader2, Eye } from 'lucide-react';
import { toast } from 'sonner';

export default function WhiteLabelPage() {
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [form, setForm] = useState({
    brandName: 'Barmagly',
    brandColor: '#8b5cf6',
    logoUrl: '',
    faviconUrl: '',
    customDomain: '',
    supportEmail: '',
    hideBarmaglyBranding: false,
    customLoginText: 'Sign in to your account',
  });

  const set = (key: string, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const save = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    toast.success('White label settings saved');
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">White Label</h1>
        <p className="text-sm text-muted-foreground">Customize branding for your clients</p>
      </div>

      {/* Enable toggle */}
      <div className="card p-5 flex items-center justify-between">
        <div>
          <p className="font-semibold text-sm">Enable White Label</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Replace Barmagly branding with your own throughout the platform
          </p>
        </div>
        <button
          role="switch"
          aria-checked={enabled}
          onClick={() => setEnabled((v) => !v)}
          className={`w-11 h-6 rounded-full transition-colors relative ${enabled ? 'bg-primary' : 'bg-muted-foreground/30'}`}
        >
          <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform shadow ${enabled ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
      </div>

      <fieldset disabled={!enabled} className="space-y-5">
        {/* Brand identity */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Palette className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-semibold text-sm">Brand Identity</h2>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium">Brand Name</label>
            <input
              type="text"
              className="input w-full"
              value={form.brandName}
              onChange={(e) => set('brandName', e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium">Primary Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={form.brandColor}
                onChange={(e) => set('brandColor', e.target.value)}
                className="w-10 h-10 rounded-lg border border-border cursor-pointer"
              />
              <input
                type="text"
                className="input w-32"
                value={form.brandColor}
                onChange={(e) => set('brandColor', e.target.value)}
              />
              <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: form.brandColor }} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium">Logo URL</label>
              <input
                type="url"
                className="input w-full"
                placeholder="https://..."
                value={form.logoUrl}
                onChange={(e) => set('logoUrl', e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Favicon URL</label>
              <input
                type="url"
                className="input w-full"
                placeholder="https://..."
                value={form.faviconUrl}
                onChange={(e) => set('faviconUrl', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Custom domain */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Globe className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-semibold text-sm">Custom Domain</h2>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium">Domain</label>
            <input
              type="text"
              className="input w-full"
              placeholder="app.yourdomain.com"
              value={form.customDomain}
              onChange={(e) => set('customDomain', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Add a CNAME record: <code className="bg-muted px-1 rounded">app.yourdomain.com → cname.barmagly.com</code>
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium">Support Email</label>
            <input
              type="email"
              className="input w-full"
              placeholder="support@yourdomain.com"
              value={form.supportEmail}
              onChange={(e) => set('supportEmail', e.target.value)}
            />
          </div>
        </div>

        {/* Options */}
        <div className="card p-5 space-y-3">
          <h2 className="font-semibold text-sm">Options</h2>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.hideBarmaglyBranding}
              onChange={(e) => set('hideBarmaglyBranding', e.target.checked)}
              className="w-4 h-4 rounded border-border accent-primary"
            />
            <div>
              <p className="text-sm font-medium">Hide "Powered by Barmagly"</p>
              <p className="text-xs text-muted-foreground">Remove Barmagly attribution from all pages</p>
            </div>
          </label>
          <div className="space-y-1">
            <label className="text-xs font-medium">Custom Login Message</label>
            <input
              type="text"
              className="input w-full"
              value={form.customLoginText}
              onChange={(e) => set('customLoginText', e.target.value)}
            />
          </div>
        </div>
      </fieldset>

      <div className="flex gap-3">
        <button onClick={save} disabled={saving || !enabled} className="btn-primary flex items-center gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save changes
        </button>
        <button className="btn-secondary flex items-center gap-2" disabled={!enabled}>
          <Eye className="w-4 h-4" />
          Preview
        </button>
      </div>
    </div>
  );
}
