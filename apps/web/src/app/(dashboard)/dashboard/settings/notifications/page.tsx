'use client';

import { useState } from 'react';
import { Bell, Mail, Smartphone, Slack, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface NotifChannel {
  id: string;
  label: string;
  icon: React.ElementType;
}

const CHANNELS: NotifChannel[] = [
  { id: 'in_app', label: 'In-App', icon: Bell },
  { id: 'email', label: 'Email', icon: Mail },
  { id: 'push', label: 'Mobile Push', icon: Smartphone },
  { id: 'slack', label: 'Slack', icon: Slack },
];

const EVENTS = [
  { id: 'new_message', label: 'New inbox message', description: 'Someone sent a DM or comment' },
  { id: 'mention', label: 'New mention', description: 'Your brand was mentioned on social media' },
  { id: 'post_published', label: 'Post published', description: 'A scheduled post went live' },
  { id: 'post_failed', label: 'Post failed', description: 'A post failed to publish' },
  { id: 'team_invite', label: 'Team invite accepted', description: 'Someone joined your workspace' },
  { id: 'billing_renewal', label: 'Billing renewal', description: 'Upcoming subscription renewal' },
  { id: 'ai_completed', label: 'AI task completed', description: 'AI agent finished a task' },
  { id: 'report_ready', label: 'Report ready', description: 'Analytics report is ready to view' },
];

type Prefs = Record<string, Record<string, boolean>>;

function buildDefaults(): Prefs {
  const prefs: Prefs = {};
  EVENTS.forEach((e) => {
    prefs[e.id] = {};
    CHANNELS.forEach((c) => { prefs[e.id][c.id] = c.id === 'in_app' || c.id === 'email'; });
  });
  return prefs;
}

export default function NotificationsSettingsPage() {
  const [prefs, setPrefs] = useState<Prefs>(buildDefaults);
  const [saving, setSaving] = useState(false);

  const toggle = (eventId: string, channelId: string) => {
    setPrefs((prev) => ({
      ...prev,
      [eventId]: { ...prev[eventId], [channelId]: !prev[eventId][channelId] },
    }));
  };

  const save = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    setSaving(false);
    toast.success('Notification preferences saved');
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Notification Preferences</h1>
        <p className="text-sm text-muted-foreground">Choose how and when you want to be notified</p>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/30">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Event</th>
              {CHANNELS.map((ch) => (
                <th key={ch.id} className="px-4 py-3 font-medium text-muted-foreground">
                  <div className="flex flex-col items-center gap-1">
                    <ch.icon className="w-4 h-4" />
                    <span className="text-xs">{ch.label}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {EVENTS.map((event) => (
              <tr key={event.id} className="hover:bg-muted/30">
                <td className="px-4 py-3">
                  <p className="font-medium">{event.label}</p>
                  <p className="text-xs text-muted-foreground">{event.description}</p>
                </td>
                {CHANNELS.map((ch) => (
                  <td key={ch.id} className="px-4 py-3 text-center">
                    <button
                      role="switch"
                      aria-checked={prefs[event.id]?.[ch.id]}
                      onClick={() => toggle(event.id, ch.id)}
                      className={`w-9 h-5 rounded-full transition-colors relative ${
                        prefs[event.id]?.[ch.id] ? 'bg-primary' : 'bg-muted-foreground/30'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow ${
                          prefs[event.id]?.[ch.id] ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button onClick={save} disabled={saving} className="btn-primary flex items-center gap-2">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Save preferences
      </button>
    </div>
  );
}
