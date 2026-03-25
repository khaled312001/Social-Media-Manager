'use client';

import { useState, useEffect } from 'react';
import { Users, Plus, Search, Mail, Phone, Tag, TrendingUp, Loader2 } from 'lucide-react';
import { crmApi } from '@/lib/api';
import { formatDate, cn } from '@/lib/utils';

const STAGES = ['LEAD', 'PROSPECT', 'QUALIFIED', 'OPPORTUNITY', 'CUSTOMER', 'CHURNED'] as const;
type Stage = typeof STAGES[number];

const STAGE_COLORS: Record<Stage, string> = {
  LEAD: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  PROSPECT: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  QUALIFIED: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  OPPORTUNITY: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  CUSTOMER: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  CHURNED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export default function CrmPage() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<Stage | 'ALL'>('ALL');
  const [view, setView] = useState<'table' | 'pipeline'>('table');

  useEffect(() => {
    crmApi.list({ page: 1, limit: 50 })
      .then((res: any) => {
        const data = res?.data ?? res;
        setContacts(data?.items ?? data ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = contacts.filter((c) => {
    const matchesSearch =
      !search ||
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase());
    const matchesStage = stageFilter === 'ALL' || c.stage === stageFilter;
    return matchesSearch && matchesStage;
  });

  // Pipeline view grouping
  const byStage = STAGES.reduce<Record<string, any[]>>((acc, s) => {
    acc[s] = filtered.filter((c) => c.stage === s);
    return acc;
  }, {} as any);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">CRM</h1>
          <p className="text-sm text-muted-foreground">Manage leads, prospects, and customers</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Contact
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
        {STAGES.map((stage) => {
          const count = contacts.filter((c) => c.stage === stage).length;
          return (
            <button
              key={stage}
              onClick={() => setStageFilter(stage === stageFilter ? 'ALL' : stage)}
              className={cn('card p-3 text-left hover:shadow-md transition-all', stageFilter === stage && 'ring-2 ring-primary')}
            >
              <p className="text-xl font-bold">{count}</p>
              <span className={cn('badge text-[10px] mt-1', STAGE_COLORS[stage])}>
                {stage}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filters + view toggle */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search contacts..."
            className="input pl-9 w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex rounded-lg border border-border overflow-hidden">
          {(['table', 'pipeline'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn('px-3 py-1.5 text-sm capitalize', view === v ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-accent')}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : view === 'table' ? (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-border">
              <tr className="text-left text-xs text-muted-foreground">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Stage</th>
                <th className="px-4 py-3 font-medium">Lead Score</th>
                <th className="px-4 py-3 font-medium">Tags</th>
                <th className="px-4 py-3 font-medium">Added</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-muted-foreground">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    No contacts found
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/50 cursor-pointer transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {c.name?.[0]?.toUpperCase() ?? '?'}
                        </div>
                        <span className="font-medium">{c.name ?? '—'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{c.email ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={cn('badge text-xs', STAGE_COLORS[c.stage as Stage] ?? '')}>{c.stage}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden w-16">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${Math.min(100, c.leadScore ?? 0)}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">{c.leadScore ?? 0}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {(c.tags ?? []).slice(0, 2).map((tag: string) => (
                          <span key={tag} className="badge-secondary text-xs">{tag}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {c.createdAt ? formatDate(c.createdAt) : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* Pipeline Kanban */
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map((stage) => (
            <div key={stage} className="flex-shrink-0 w-60">
              <div className="flex items-center justify-between mb-2">
                <span className={cn('badge text-xs', STAGE_COLORS[stage])}>{stage}</span>
                <span className="text-xs text-muted-foreground">{byStage[stage].length}</span>
              </div>
              <div className="space-y-2">
                {byStage[stage].map((c) => (
                  <div key={c.id} className="card p-3 cursor-pointer hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white text-[10px] font-bold">
                        {c.name?.[0]?.toUpperCase() ?? '?'}
                      </div>
                      <p className="text-xs font-medium truncate">{c.name}</p>
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate">{c.email}</p>
                    <div className="flex items-center gap-1 mt-2">
                      <TrendingUp className="w-3 h-3 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">Score: {c.leadScore ?? 0}</span>
                    </div>
                  </div>
                ))}
                {byStage[stage].length === 0 && (
                  <div className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                    No contacts
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
