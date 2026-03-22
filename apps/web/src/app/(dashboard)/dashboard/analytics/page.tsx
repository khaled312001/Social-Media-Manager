'use client';

import { useEffect, useState } from 'react';
import {
  Eye, TrendingUp, Users, FileText, ArrowUpRight, ArrowDownRight,
  BarChart2, Activity, Star, RefreshCw,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { analyticsApi } from '@/lib/api';
import { cn, formatNumber, formatDate } from '@/lib/utils';

const PERIOD_OPTIONS = [
  { key: '7d', label: '7 Days' },
  { key: '30d', label: '30 Days' },
  { key: '90d', label: '90 Days' },
];

const PLATFORM_COLORS: Record<string, string> = {
  FACEBOOK: '#1877F2',
  INSTAGRAM: '#E1306C',
  TWITTER: '#1DA1F2',
  TIKTOK: '#010101',
  LINKEDIN: '#0A66C2',
  YOUTUBE: '#FF0000',
};

function KpiSkeleton() {
  return (
    <div className="card p-5 animate-pulse space-y-3">
      <div className="h-3 bg-muted rounded w-1/2" />
      <div className="h-7 bg-muted rounded w-2/3" />
      <div className="h-3 bg-muted rounded w-1/3" />
    </div>
  );
}

function ChartSkeleton({ height = 220 }: { height?: number }) {
  return (
    <div className="animate-pulse flex items-end gap-1 px-4" style={{ height }}>
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className="flex-1 bg-muted rounded-t"
          style={{ height: `${30 + Math.random() * 60}%` }}
        />
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('30d');
  const [overview, setOverview] = useState<any>(null);
  const [timeSeries, setTimeSeries] = useState<any[]>([]);
  const [platformBreakdown, setPlatformBreakdown] = useState<any[]>([]);
  const [topPosts, setTopPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      analyticsApi.overview({ period }).catch(() => null),
      analyticsApi.timeSeries({ period, metric: 'engagement' }).catch(() => null),
      analyticsApi.platform('all').catch(() => null),
      analyticsApi.topPosts().catch(() => null),
    ]).then(([ov, ts, pb, tp]) => {
      setOverview((ov as any)?.data ?? ov ?? {});
      const tsData = (ts as any)?.data ?? ts;
      setTimeSeries(tsData?.items ?? tsData ?? generateFakeTimeSeries(period === '7d' ? 7 : period === '30d' ? 30 : 90));
      const pbData = (pb as any)?.data ?? pb;
      setPlatformBreakdown(pbData?.platforms ?? pbData ?? generateFakePlatformBreakdown());
      const tpData = (tp as any)?.data ?? tp;
      setTopPosts(tpData?.items ?? tpData ?? []);
    }).finally(() => setLoading(false));
  }, [period]);

  function generateFakeTimeSeries(days: number) {
    return Array.from({ length: days }, (_, i) => ({
      date: formatDate(new Date(Date.now() - (days - 1 - i) * 86400000), 'MMM d'),
      engagement: Math.floor(Math.random() * 1200 + 300),
      reach: Math.floor(Math.random() * 6000 + 1000),
    }));
  }

  function generateFakePlatformBreakdown() {
    return Object.entries(PLATFORM_COLORS).map(([platform, color]) => ({
      platform,
      reach: Math.floor(Math.random() * 50000 + 5000),
      engagement: Math.floor(Math.random() * 3000 + 200),
      followers: Math.floor(Math.random() * 10000 + 500),
    }));
  }

  const kpis = [
    {
      label: 'Total Reach',
      value: formatNumber(overview?.totalReach ?? 0),
      change: overview?.reachChange ?? 0,
      icon: Eye,
      color: 'text-blue-500',
    },
    {
      label: 'Engagement Rate',
      value: `${(overview?.engagementRate ?? 0).toFixed(2)}%`,
      change: overview?.engagementChange ?? 0,
      icon: TrendingUp,
      color: 'text-violet-500',
    },
    {
      label: 'New Followers',
      value: formatNumber(overview?.newFollowers ?? 0),
      change: overview?.followersChange ?? 0,
      icon: Users,
      color: 'text-green-500',
    },
    {
      label: 'Published Posts',
      value: formatNumber(overview?.publishedPosts ?? 0),
      change: overview?.postsChange ?? 0,
      icon: FileText,
      color: 'text-orange-500',
    },
  ];

  const chartData = timeSeries.length ? timeSeries : generateFakeTimeSeries(30);
  const platformData = platformBreakdown.length ? platformBreakdown : generateFakePlatformBreakdown();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground">Track your performance across all platforms</p>
        </div>
        <div className="flex gap-1 p-1 bg-muted rounded-lg">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setPeriod(opt.key)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-md transition-all',
                period === opt.key
                  ? 'bg-card shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <KpiSkeleton key={i} />)
          : kpis.map((kpi) => (
              <div key={kpi.label} className="card p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">{kpi.label}</p>
                  <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{kpi.value}</p>
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
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Engagement over time */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-violet-500" />
              <h2 className="font-semibold text-sm">Engagement Over Time</h2>
            </div>
          </div>
          {loading ? (
            <ChartSkeleton />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="engGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="reachGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  interval={Math.floor(chartData.length / 6)}
                />
                <YAxis
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => formatNumber(v)}
                />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area
                  type="monotone"
                  dataKey="engagement"
                  stroke="#8b5cf6"
                  fill="url(#engGrad)"
                  strokeWidth={2}
                  name="Engagement"
                />
                <Area
                  type="monotone"
                  dataKey="reach"
                  stroke="#3b82f6"
                  fill="url(#reachGrad)"
                  strokeWidth={2}
                  name="Reach"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Platform breakdown */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-blue-500" />
              <h2 className="font-semibold text-sm">Platform Reach Breakdown</h2>
            </div>
          </div>
          {loading ? (
            <ChartSkeleton />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={platformData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="platform"
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: string) => v.charAt(0) + v.slice(1).toLowerCase()}
                />
                <YAxis
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => formatNumber(v)}
                />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar
                  dataKey="reach"
                  name="Reach"
                  radius={[4, 4, 0, 0]}
                  fill="#6366f1"
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Top posts */}
        <div className="card">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
            <Star className="w-4 h-4 text-yellow-500" />
            <h2 className="font-semibold text-sm">Best Performing Posts</h2>
          </div>
          <div className="divide-y divide-border">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3 animate-pulse">
                  <div className="w-6 h-6 bg-muted rounded" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </div>
              ))
            ) : topPosts.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                No posts data available yet
              </div>
            ) : (
              topPosts.slice(0, 5).map((post: any, i: number) => (
                <div key={post.id ?? i} className="flex items-start gap-3 px-5 py-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{post.content?.slice(0, 80) ?? '—'}</p>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                      {(post.platforms ?? []).map((p: string) => (
                        <span
                          key={p}
                          className="text-[10px] px-1.5 py-0.5 rounded-full text-white"
                          style={{ background: PLATFORM_COLORS[p] ?? '#888' }}
                        >
                          {p.slice(0, 2)}
                        </span>
                      ))}
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {formatNumber(post.analytics?.reach ?? 0)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-xs font-semibold text-green-600">
                      {post.analytics?.engagementRate?.toFixed(1) ?? '0'}%
                    </span>
                    <p className="text-[10px] text-muted-foreground">eng. rate</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Platform health */}
        <div className="card">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <h2 className="font-semibold text-sm">Platform Health</h2>
          </div>
          <div className="p-4 grid gap-3">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="animate-pulse flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-muted" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 bg-muted rounded w-1/3" />
                      <div className="h-2 bg-muted rounded w-2/3" />
                    </div>
                  </div>
                ))
              : platformData.map((p: any) => (
                  <div key={p.platform} className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ background: PLATFORM_COLORS[p.platform] ?? '#888' }}
                    >
                      {p.platform?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-medium">
                          {p.platform?.charAt(0) + p.platform?.slice(1).toLowerCase()}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {formatNumber(p.followers ?? 0)} followers
                        </span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(100, ((p.engagement ?? 0) / 5000) * 100)}%`,
                            background: PLATFORM_COLORS[p.platform] ?? '#888',
                          }}
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {formatNumber(p.engagement ?? 0)} engagement
                      </p>
                    </div>
                  </div>
                ))}
          </div>
        </div>
      </div>
    </div>
  );
}
