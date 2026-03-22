'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Mail, Plus, Send, Eye, MousePointer, Users, BarChart2, Zap } from 'lucide-react';
import { emailApi } from '@/lib/api';
import { formatDate, formatNumber, cn } from '@/lib/utils';

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'badge-secondary',
  SCHEDULED: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 badge',
  SENT: 'badge-success',
  FAILED: 'badge-destructive',
};

export default function EmailPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [lists, setLists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'campaigns' | 'lists' | 'automations'>('campaigns');

  useEffect(() => {
    Promise.all([
      (emailApi as any).listCampaigns({ page: 1, limit: 20 }).catch(() => null),
      (emailApi as any).listEmailLists().catch(() => null),
    ]).then(([c, l]) => {
      const cData = c?.data ?? c;
      const lData = l?.data ?? l;
      setCampaigns(cData?.items ?? cData ?? []);
      setLists(lData ?? []);
    }).finally(() => setLoading(false));
  }, []);

  const totalSubscribers = lists.reduce((sum: number, l: any) => sum + (l._count?.subscribers ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Email Marketing</h1>
          <p className="text-sm text-muted-foreground">Campaigns, lists, and automation flows</p>
        </div>
        <Link href="/dashboard/email/compose" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Campaign
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Subscribers', value: formatNumber(totalSubscribers), icon: Users, color: 'text-blue-500' },
          { label: 'Campaigns Sent', value: String(campaigns.filter((c) => c.status === 'SENT').length), icon: Send, color: 'text-green-500' },
          { label: 'Avg Open Rate', value: `${(campaigns.reduce((s: number, c: any) => s + (c.openRate ?? 0), 0) / Math.max(1, campaigns.length)).toFixed(1)}%`, icon: Eye, color: 'text-violet-500' },
          { label: 'Avg Click Rate', value: `${(campaigns.reduce((s: number, c: any) => s + (c.clickRate ?? 0), 0) / Math.max(1, campaigns.length)).toFixed(1)}%`, icon: MousePointer, color: 'text-orange-500' },
        ].map((stat) => (
          <div key={stat.label} className="card p-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
            <p className="text-2xl font-bold">{loading ? '—' : stat.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {(['campaigns', 'lists', 'automations'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-2 text-sm font-medium capitalize border-b-2 -mb-px transition-colors',
              activeTab === tab
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array(4).fill(0).map((_, i) => <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />)}
        </div>
      ) : activeTab === 'campaigns' ? (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/30">
              <tr className="text-left text-xs text-muted-foreground">
                <th className="px-4 py-3 font-medium">Subject</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Sent To</th>
                <th className="px-4 py-3 font-medium">Open Rate</th>
                <th className="px-4 py-3 font-medium">Click Rate</th>
                <th className="px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {campaigns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <Mail className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-30" />
                    <p className="text-sm text-muted-foreground">No campaigns yet</p>
                    <Link href="/dashboard/email/compose" className="btn-primary mt-3 inline-flex text-sm">
                      Create first campaign
                    </Link>
                  </td>
                </tr>
              ) : (
                campaigns.map((c: any) => (
                  <tr key={c.id} className="hover:bg-muted/50 cursor-pointer">
                    <td className="px-4 py-3 font-medium">{c.subject}</td>
                    <td className="px-4 py-3">
                      <span className={cn('badge text-xs', STATUS_COLORS[c.status] ?? 'badge-secondary')}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatNumber(c.sentCount ?? 0)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-violet-500 rounded-full" style={{ width: `${c.openRate ?? 0}%` }} />
                        </div>
                        <span className="text-xs">{c.openRate?.toFixed(1) ?? '0'}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${c.clickRate ?? 0}%` }} />
                        </div>
                        <span className="text-xs">{c.clickRate?.toFixed(1) ?? '0'}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {c.sentAt ? formatDate(c.sentAt) : c.scheduledAt ? `Scheduled ${formatDate(c.scheduledAt)}` : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : activeTab === 'lists' ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <button className="card border-dashed p-6 flex flex-col items-center justify-center gap-2 hover:bg-muted/30 transition-colors text-muted-foreground">
            <Plus className="w-6 h-6" />
            <span className="text-sm">Create new list</span>
          </button>
          {lists.map((list: any) => (
            <div key={list.id} className="card p-5 space-y-3 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">{list.name}</h3>
                <BarChart2 className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex items-end gap-1">
                <span className="text-2xl font-bold">{formatNumber(list._count?.subscribers ?? 0)}</span>
                <span className="text-xs text-muted-foreground pb-1">subscribers</span>
              </div>
              <p className="text-xs text-muted-foreground">Created {formatDate(list.createdAt)}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="card p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400 flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium text-sm">Welcome Sequence</p>
                <p className="text-xs text-muted-foreground">Trigger: New subscriber → 5 emails over 7 days</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="badge-success text-xs">Active</span>
              <button className="btn-secondary text-xs px-3 py-1">Edit</button>
            </div>
          </div>
          <button className="card border-dashed w-full p-6 flex items-center justify-center gap-2 hover:bg-muted/30 transition-colors text-muted-foreground text-sm">
            <Plus className="w-4 h-4" /> Create automation
          </button>
        </div>
      )}
    </div>
  );
}
