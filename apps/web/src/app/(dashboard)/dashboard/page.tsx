'use client';

import { useEffect, useState } from 'react';
import {
  TrendingUp, Users, Eye, MessageSquare, FileText, Clock,
  ArrowUpRight, ArrowDownRight, Zap, Calendar,
} from 'lucide-react';
import Link from 'next/link';
import { analyticsApi, postsApi } from '@/lib/api';
import { formatNumber, formatRelativeTime } from '@/lib/utils';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

interface KpiCard {
  label: string;
  value: string;
  change: number;
  icon: React.ElementType;
  color: string;
}

const PLATFORM_COLORS: Record<string, string> = {
  FACEBOOK: '#1877F2',
  INSTAGRAM: '#E1306C',
  TWITTER: '#1DA1F2',
  TIKTOK: '#010101',
  LINKEDIN: '#0A66C2',
  YOUTUBE: '#FF0000',
};

export default function DashboardPage() {
  const [overview, setOverview] = useState<any>(null);
  const [recentPosts, setRecentPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      analyticsApi.overview({ period: '30d' }).catch(() => null),
      postsApi.list({ limit: 5, status: 'PUBLISHED' }).catch(() => null),
    ]).then(([ov, posts]) => {
      setOverview((ov as any)?.data ?? ov);
      const postsData = (posts as any)?.data ?? posts;
      setRecentPosts(postsData?.items ?? postsData ?? []);
    }).finally(() => setLoading(false));
  }, []);

  const kpis: KpiCard[] = [
    {
      label: 'Total Reach',
      value: formatNumber(overview?.totalReach ?? 0),
      change: overview?.reachChange ?? 0,
      icon: Eye,
      color: 'text-blue-500',
    },
    {
      label: 'Engagement',
      value: formatNumber(overview?.totalEngagement ?? 0),
      change: overview?.engagementChange ?? 0,
      icon: TrendingUp,
      color: 'text-violet-500',
    },
    {
      label: 'Followers',
      value: formatNumber(overview?.totalFollowers ?? 0),
      change: overview?.followersChange ?? 0,
      icon: Users,
      color: 'text-green-500',
    },
    {
      label: 'Messages',
      value: formatNumber(overview?.totalMessages ?? 0),
      change: overview?.messagesChange ?? 0,
      icon: MessageSquare,
      color: 'text-orange-500',
    },
  ];

  const engagementData = overview?.engagementTimeline ?? Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - (29 - i) * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    engagement: Math.floor(Math.random() * 1000 + 200),
    reach: Math.floor(Math.random() * 5000 + 1000),
  }));

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
          <p className="text-sm text-muted-foreground">Last 30 days performance across all platforms</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/posts/compose" className="btn-primary flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Create Post
          </Link>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{kpi.label}</p>
              <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold">{loading ? '—' : kpi.value}</p>
              <div className="flex items-center gap-1 text-xs mt-1">
                {kpi.change >= 0 ? (
                  <ArrowUpRight className="w-3 h-3 text-green-500" />
                ) : (
                  <ArrowDownRight className="w-3 h-3 text-destructive" />
                )}
                <span className={kpi.change >= 0 ? 'text-green-600' : 'text-destructive'}>
                  {Math.abs(kpi.change)}%
                </span>
                <span className="text-muted-foreground">vs last period</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Engagement chart */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm">Engagement & Reach</h2>
            <Link href="/dashboard/analytics" className="text-xs text-primary hover:underline flex items-center gap-1">
              View full analytics <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={engagementData}>
              <defs>
                <linearGradient id="engagement" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="reach" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false}
                interval={Math.floor(engagementData.length / 6)} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false}
                tickFormatter={(v) => formatNumber(v)} />
              <Tooltip
                contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
              />
              <Area type="monotone" dataKey="engagement" stroke="#8b5cf6" fill="url(#engagement)" strokeWidth={2} />
              <Area type="monotone" dataKey="reach" stroke="#3b82f6" fill="url(#reach)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Quick actions */}
        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-sm">Quick Actions</h2>
          <div className="space-y-2">
            {[
              { href: '/dashboard/posts/compose', label: 'Compose new post', icon: FileText, color: 'bg-violet-50 text-violet-600 dark:bg-violet-900/20' },
              { href: '/dashboard/inbox', label: 'Check inbox', icon: MessageSquare, color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20' },
              { href: '/dashboard/calendar', label: 'Schedule content', icon: Calendar, color: 'bg-green-50 text-green-600 dark:bg-green-900/20' },
              { href: '/dashboard/ai', label: 'Generate with AI', icon: Zap, color: 'bg-orange-50 text-orange-600 dark:bg-orange-900/20' },
            ].map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${action.color}`}>
                  <action.icon className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">{action.label}</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground ml-auto" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Recent posts */}
      <div className="card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-semibold text-sm">Recent Posts</h2>
          <Link href="/dashboard/posts" className="text-xs text-primary hover:underline">
            View all
          </Link>
        </div>
        <div className="divide-y divide-border">
          {recentPosts.length === 0 ? (
            <div className="py-12 text-center">
              <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No posts yet</p>
              <Link href="/dashboard/posts/compose" className="btn-primary mt-4 inline-flex">
                Create your first post
              </Link>
            </div>
          ) : (
            recentPosts.map((post: any) => (
              <div key={post.id} className="flex items-start gap-3 px-5 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{post.content?.slice(0, 80)}...</p>
                  <div className="flex items-center gap-2 mt-1">
                    {(post.platforms ?? []).map((p: string) => (
                      <span
                        key={p}
                        className="text-[10px] px-1.5 py-0.5 rounded-full text-white"
                        style={{ background: PLATFORM_COLORS[p] ?? '#888' }}
                      >
                        {p}
                      </span>
                    ))}
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatRelativeTime(post.publishedAt ?? post.scheduledAt ?? post.createdAt)}
                    </span>
                  </div>
                </div>
                <div className="text-right text-xs text-muted-foreground flex-shrink-0">
                  <p>{formatNumber(post.analytics?.reach ?? 0)} reach</p>
                  <p>{post.analytics?.engagementRate?.toFixed(1) ?? '0'}% eng.</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
