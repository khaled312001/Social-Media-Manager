'use client';

import { useEffect, useState } from 'react';
import {
  Plus, Edit2, Eye, Pause, Play, Trash2, X, Calendar,
  Target, BarChart2, DollarSign, FileText, Users,
  CheckCircle, Clock, AlertCircle, Loader2, TrendingUp,
  ChevronRight,
} from 'lucide-react';
import { campaignsApi } from '@/lib/api';
import { cn, formatNumber, formatDate } from '@/lib/utils';

const PLATFORM_COLORS: Record<string, string> = {
  FACEBOOK: '#1877F2',
  INSTAGRAM: '#E1306C',
  TWITTER: '#1DA1F2',
  TIKTOK: '#010101',
  LINKEDIN: '#0A66C2',
  YOUTUBE: '#FF0000',
};

const STATUS_TABS = [
  { key: 'all', label: 'All' },
  { key: 'ACTIVE', label: 'Active' },
  { key: 'DRAFT', label: 'Draft' },
  { key: 'COMPLETED', label: 'Completed' },
  { key: 'PAUSED', label: 'Paused' },
];

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    ACTIVE: 'badge-success',
    DRAFT: 'badge badge-secondary',
    COMPLETED: 'badge border-transparent bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    PAUSED: 'badge border-transparent bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    FAILED: 'badge-destructive',
  };
  const icons: Record<string, React.ElementType> = {
    ACTIVE: CheckCircle,
    DRAFT: FileText,
    COMPLETED: CheckCircle,
    PAUSED: Clock,
    FAILED: AlertCircle,
  };
  const Icon = icons[status] ?? FileText;
  return (
    <span className={cn(map[status] ?? 'badge badge-secondary', 'flex items-center gap-1')}>
      <Icon className="w-3 h-3" />
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

function CampaignDetailDrawer({
  campaign,
  onClose,
  onDelete,
}: {
  campaign: any;
  onClose: () => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-full max-w-lg bg-card border-l border-border overflow-y-auto">
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
          <h2 className="font-semibold">{campaign.name}</h2>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 space-y-5">
          {/* Status + platforms */}
          <div className="flex items-center gap-3 flex-wrap">
            <StatusBadge status={campaign.status ?? 'DRAFT'} />
            {(campaign.platforms ?? []).map((p: string) => (
              <span
                key={p}
                className="text-xs px-2 py-0.5 rounded-full text-white font-medium"
                style={{ background: PLATFORM_COLORS[p] ?? '#888' }}
              >
                {p.charAt(0) + p.slice(1).toLowerCase()}
              </span>
            ))}
          </div>

          {/* Description */}
          {campaign.description && (
            <p className="text-sm text-muted-foreground">{campaign.description}</p>
          )}

          {/* Dates + budget */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Start Date', value: campaign.startDate ? formatDate(campaign.startDate) : '—', icon: Calendar },
              { label: 'End Date', value: campaign.endDate ? formatDate(campaign.endDate) : '—', icon: Calendar },
              { label: 'Budget', value: campaign.budget ? `$${campaign.budget.toLocaleString()}` : '—', icon: DollarSign },
              { label: 'Posts', value: campaign.postsCount ?? 0, icon: FileText },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="card p-3 space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </div>
                <p className="font-semibold text-sm">{String(value)}</p>
              </div>
            ))}
          </div>

          {/* Analytics */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Performance
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Reach', value: formatNumber(campaign.analytics?.reach ?? 0) },
                { label: 'Engagement', value: formatNumber(campaign.analytics?.engagement ?? 0) },
                { label: 'Clicks', value: formatNumber(campaign.analytics?.clicks ?? 0) },
              ].map(({ label, value }) => (
                <div key={label} className="text-center p-3 bg-muted/40 rounded-lg">
                  <p className="text-lg font-bold">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button className="btn-secondary flex items-center gap-2 flex-1 justify-center">
              <Edit2 className="w-4 h-4" />
              Edit Campaign
            </button>
            <button
              className="btn-destructive flex items-center gap-2 py-2 px-4"
              onClick={() => { onDelete(campaign.id); onClose(); }}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CampaignCard({
  campaign,
  onView,
  onEdit,
  onTogglePause,
  onDelete,
}: {
  campaign: any;
  onView: () => void;
  onEdit: () => void;
  onTogglePause: () => void;
  onDelete: () => void;
}) {
  const progress = campaign.startDate && campaign.endDate
    ? Math.min(100, Math.max(0,
        ((Date.now() - new Date(campaign.startDate).getTime()) /
          (new Date(campaign.endDate).getTime() - new Date(campaign.startDate).getTime())) * 100
      ))
    : 0;

  return (
    <div className="card p-5 space-y-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm truncate">{campaign.name}</h3>
          {campaign.description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{campaign.description}</p>
          )}
        </div>
        <StatusBadge status={campaign.status ?? 'DRAFT'} />
      </div>

      {/* Platforms */}
      <div className="flex flex-wrap gap-1.5">
        {(campaign.platforms ?? []).map((p: string) => (
          <span
            key={p}
            className="text-[10px] px-1.5 py-0.5 rounded-full text-white font-medium"
            style={{ background: PLATFORM_COLORS[p] ?? '#888' }}
          >
            {p.charAt(0) + p.slice(1).toLowerCase()}
          </span>
        ))}
      </div>

      {/* Dates */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5" />
          {campaign.startDate ? formatDate(campaign.startDate, 'MMM d') : '—'}
        </span>
        <span className="text-muted-foreground/40">→</span>
        <span className="flex items-center gap-1">
          {campaign.endDate ? formatDate(campaign.endDate, 'MMM d, yyyy') : 'Ongoing'}
        </span>
      </div>

      {/* Progress bar (for active campaigns) */}
      {campaign.status === 'ACTIVE' && (
        <div>
          <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="bg-muted/40 rounded-lg p-2">
          <p className="font-semibold">{campaign.postsCount ?? 0}</p>
          <p className="text-muted-foreground text-[10px]">Posts</p>
        </div>
        <div className="bg-muted/40 rounded-lg p-2">
          <p className="font-semibold">{formatNumber(campaign.analytics?.reach ?? 0)}</p>
          <p className="text-muted-foreground text-[10px]">Reach</p>
        </div>
        <div className="bg-muted/40 rounded-lg p-2">
          <p className="font-semibold">
            {campaign.budget ? `$${(campaign.budget / 1000).toFixed(1)}K` : '—'}
          </p>
          <p className="text-muted-foreground text-[10px]">Budget</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-1.5 pt-1 border-t border-border">
        <button
          className="btn-ghost flex items-center gap-1 py-1.5 px-2.5 text-xs flex-1 justify-center"
          onClick={onView}
        >
          <Eye className="w-3.5 h-3.5" />
          View
        </button>
        <button
          className="btn-ghost flex items-center gap-1 py-1.5 px-2.5 text-xs flex-1 justify-center"
          onClick={onEdit}
        >
          <Edit2 className="w-3.5 h-3.5" />
          Edit
        </button>
        <button
          className="btn-ghost flex items-center gap-1 py-1.5 px-2.5 text-xs flex-1 justify-center"
          onClick={onTogglePause}
        >
          {campaign.status === 'ACTIVE' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          {campaign.status === 'ACTIVE' ? 'Pause' : 'Resume'}
        </button>
        <button
          className="btn-ghost flex items-center gap-1 py-1.5 px-2.5 text-xs text-destructive hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedCampaign, setSelectedCampaign] = useState<any | null>(null);

  useEffect(() => {
    setLoading(true);
    campaignsApi
      .list()
      .then((res: any) => {
        const data = res?.data ?? res;
        setCampaigns(data?.items ?? data ?? []);
      })
      .catch(() => setCampaigns([]))
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(id: string) {
    if (!confirm('Delete this campaign?')) return;
    try {
      await campaignsApi.delete(id);
      setCampaigns((prev) => prev.filter((c: any) => c.id !== id));
    } catch { /* ignore */ }
  }

  async function handleTogglePause(campaign: any) {
    const newStatus = campaign.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    try {
      await campaignsApi.update(campaign.id, { status: newStatus });
      setCampaigns((prev) =>
        prev.map((c: any) => c.id === campaign.id ? { ...c, status: newStatus } : c)
      );
    } catch { /* ignore */ }
  }

  const filtered = campaigns.filter(
    (c: any) => statusFilter === 'all' || c.status === statusFilter
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Campaigns</h1>
          <p className="text-sm text-muted-foreground">Organize and manage your marketing campaigns</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Campaign
        </button>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 border-b border-border">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={cn(
              'px-3 py-2 text-xs font-medium border-b-2 transition-colors -mb-px',
              statusFilter === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
            <span className="ml-1.5 text-muted-foreground">
              ({statusFilter === tab.key
                ? filtered.length
                : tab.key === 'all'
                ? campaigns.length
                : campaigns.filter((c: any) => c.status === tab.key).length})
            </span>
          </button>
        ))}
      </div>

      {/* Campaign grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card p-5 animate-pulse space-y-3">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-full" />
              <div className="flex gap-1.5">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="h-5 w-16 bg-muted rounded-full" />
                ))}
              </div>
              <div className="h-1.5 bg-muted rounded-full" />
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="h-12 bg-muted rounded-lg" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Target className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg mb-2">No campaigns found</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {statusFilter !== 'all'
              ? `No ${statusFilter.toLowerCase()} campaigns`
              : 'Create your first campaign to organize your content'}
          </p>
          <button className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Campaign
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((campaign: any) => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              onView={() => setSelectedCampaign(campaign)}
              onEdit={() => setSelectedCampaign(campaign)}
              onTogglePause={() => handleTogglePause(campaign)}
              onDelete={() => handleDelete(campaign.id)}
            />
          ))}
        </div>
      )}

      {/* Detail drawer */}
      {selectedCampaign && (
        <CampaignDetailDrawer
          campaign={selectedCampaign}
          onClose={() => setSelectedCampaign(null)}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
