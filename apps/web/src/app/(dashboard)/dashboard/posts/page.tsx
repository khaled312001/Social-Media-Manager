'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus, Search, Filter, Trash2, Clock, Eye, Heart,
  FileText, ChevronLeft, ChevronRight, CheckSquare, Square,
  Calendar, AlertCircle, CheckCircle, FileEdit, Globe,
} from 'lucide-react';
import { postsApi } from '@/lib/api';
import { cn, formatNumber, formatRelativeTime, formatDate } from '@/lib/utils';

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
  { key: 'DRAFT', label: 'Draft' },
  { key: 'SCHEDULED', label: 'Scheduled' },
  { key: 'PUBLISHED', label: 'Published' },
  { key: 'FAILED', label: 'Failed' },
];

const PLATFORM_LIST = ['FACEBOOK', 'INSTAGRAM', 'TWITTER', 'TIKTOK', 'LINKEDIN', 'YOUTUBE'];

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    DRAFT: 'badge badge-secondary',
    SCHEDULED: 'badge border-transparent bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    PUBLISHED: 'badge-success',
    FAILED: 'badge-destructive',
  };
  const icons: Record<string, React.ElementType> = {
    DRAFT: FileEdit,
    SCHEDULED: Clock,
    PUBLISHED: CheckCircle,
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

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="px-4 py-3"><div className="h-4 bg-muted rounded w-4" /></td>
      <td className="px-4 py-3">
        <div className="h-4 bg-muted rounded w-3/4 mb-2" />
        <div className="h-3 bg-muted rounded w-1/2" />
      </td>
      <td className="px-4 py-3"><div className="h-4 bg-muted rounded w-20" /></td>
      <td className="px-4 py-3"><div className="h-4 bg-muted rounded w-16" /></td>
      <td className="px-4 py-3"><div className="h-4 bg-muted rounded w-24" /></td>
      <td className="px-4 py-3"><div className="h-4 bg-muted rounded w-20" /></td>
    </tr>
  );
}

export default function PostsPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [platformFilter, setPlatformFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  useEffect(() => {
    setLoading(true);
    const params: Record<string, unknown> = { page, limit };
    if (statusFilter !== 'all') params.status = statusFilter;
    if (platformFilter) params.platform = platformFilter;
    if (searchQuery) params.search = searchQuery;

    postsApi
      .list(params)
      .then((res: any) => {
        const data = res?.data ?? res;
        setPosts(data?.items ?? data ?? []);
        setTotal(data?.total ?? data?.length ?? 0);
      })
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, [statusFilter, platformFilter, page, searchQuery]);

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selectedIds.size === posts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(posts.map((p: any) => p.id)));
    }
  }

  async function handleBulkDelete() {
    if (!selectedIds.size) return;
    if (!confirm(`Delete ${selectedIds.size} post(s)?`)) return;
    try {
      await Promise.all([...selectedIds].map((id) => postsApi.delete(id)));
      setPosts((prev) => prev.filter((p: any) => !selectedIds.has(p.id)));
      setSelectedIds(new Set());
    } catch {
      // ignore
    }
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Posts</h1>
          <p className="text-sm text-muted-foreground">Manage and schedule your social media content</p>
        </div>
        <Link href="/dashboard/posts/compose" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Post
        </Link>
      </div>

      {/* Filters */}
      <div className="card p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              className="input pl-8 w-full"
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            />
          </div>
          {/* Platform filter */}
          <div className="relative">
            <Filter className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <select
              className="input pl-8 pr-8 appearance-none"
              value={platformFilter}
              onChange={(e) => { setPlatformFilter(e.target.value); setPage(1); }}
            >
              <option value="">All Platforms</option>
              {PLATFORM_LIST.map((p) => (
                <option key={p} value={p}>{p.charAt(0) + p.slice(1).toLowerCase()}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Status tabs */}
        <div className="flex gap-1 border-b border-border -mb-4 -mx-4 px-4">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setStatusFilter(tab.key); setPage(1); }}
              className={cn(
                'px-3 py-2 text-xs font-medium border-b-2 transition-colors -mb-px',
                statusFilter === tab.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-primary/10 rounded-lg border border-primary/20">
          <span className="text-sm font-medium text-primary">{selectedIds.size} selected</span>
          <button
            className="btn-destructive flex items-center gap-1.5 py-1.5 px-3 text-xs"
            onClick={handleBulkDelete}
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
          <button
            className="btn-secondary flex items-center gap-1.5 py-1.5 px-3 text-xs"
          >
            <Calendar className="w-3.5 h-3.5" />
            Reschedule
          </button>
          <button
            className="btn-ghost py-1.5 px-3 text-xs text-muted-foreground"
            onClick={() => setSelectedIds(new Set())}
          >
            Deselect all
          </button>
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-3 w-10">
                  <button onClick={toggleAll} className="text-muted-foreground hover:text-foreground">
                    {selectedIds.size === posts.length && posts.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-primary" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Content</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Platforms</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Engagement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
              ) : posts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                        <FileText className="w-7 h-7 text-muted-foreground" />
                      </div>
                      <p className="font-medium">No posts found</p>
                      <p className="text-sm text-muted-foreground">Create your first post to get started</p>
                      <Link href="/dashboard/posts/compose" className="btn-primary mt-1">
                        Create Post
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                posts.map((post: any) => (
                  <tr
                    key={post.id}
                    className={cn(
                      'hover:bg-accent/40 transition-colors cursor-pointer',
                      selectedIds.has(post.id) && 'bg-primary/5'
                    )}
                    onClick={() => router.push(`/dashboard/posts/${post.id}`)}
                  >
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => toggleSelect(post.id)} className="text-muted-foreground hover:text-foreground">
                        {selectedIds.has(post.id) ? (
                          <CheckSquare className="w-4 h-4 text-primary" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <p className="font-medium truncate">
                        {(post.content ?? '').slice(0, 80)}{post.content?.length > 80 ? '...' : ''}
                      </p>
                      {post.campaign && (
                        <span className="text-xs text-muted-foreground mt-0.5 block">{post.campaign.name}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(post.platforms ?? []).map((p: string) => (
                          <span
                            key={p}
                            className="text-[10px] px-1.5 py-0.5 rounded-full text-white font-medium"
                            style={{ background: PLATFORM_COLORS[p] ?? '#888' }}
                          >
                            {p.slice(0, 2)}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={post.status ?? 'DRAFT'} />
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {post.status === 'SCHEDULED' && post.scheduledAt ? (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(post.scheduledAt, 'MMM d, h:mm a')}
                        </span>
                      ) : post.publishedAt ? (
                        <span className="flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          {formatRelativeTime(post.publishedAt)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/60">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {formatNumber(post.analytics?.reach ?? 0)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3" />
                          {formatNumber(post.analytics?.likes ?? 0)}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
            </p>
            <div className="flex items-center gap-1">
              <button
                className="btn-ghost py-1.5 px-2"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs text-muted-foreground px-2">
                {page} / {totalPages}
              </span>
              <button
                className="btn-ghost py-1.5 px-2"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
