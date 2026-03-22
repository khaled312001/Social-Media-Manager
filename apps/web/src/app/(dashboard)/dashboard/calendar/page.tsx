'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon,
} from 'lucide-react';
import { postsApi } from '@/lib/api';
import { cn } from '@/lib/utils';

const PLATFORM_COLORS: Record<string, string> = {
  FACEBOOK: '#1877F2',
  INSTAGRAM: '#E1306C',
  TWITTER: '#1DA1F2',
  TIKTOK: '#010101',
  LINKEDIN: '#0A66C2',
  YOUTUBE: '#FF0000',
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function CalendarPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const start = new Date(year, month, 1).toISOString();
    const end = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
    postsApi.list({ startDate: start, endDate: end, limit: 200 } as any)
      .then((res: any) => {
        const data = res?.data ?? res;
        setPosts(data?.items ?? data ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [year, month]);

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  };

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const postsByDay = useMemo(() => {
    const map: Record<number, any[]> = {};
    posts.forEach((post) => {
      const date = post.scheduledAt ? new Date(post.scheduledAt) : post.publishedAt ? new Date(post.publishedAt) : null;
      if (!date) return;
      if (date.getFullYear() === year && date.getMonth() === month) {
        const d = date.getDate();
        if (!map[d]) map[d] = [];
        map[d].push(post);
      }
    });
    return map;
  }, [posts, year, month]);

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  const isToday = (day: number) =>
    day === now.getDate() && month === now.getMonth() && year === now.getFullYear();

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Content Calendar</h1>
          <p className="text-sm text-muted-foreground">Visualize and schedule your content</p>
        </div>
        <Link href="/dashboard/posts/compose" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Schedule Post
        </Link>
      </div>

      <div className="card flex-1 overflow-hidden">
        {/* Calendar header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <button onClick={prevMonth} className="btn-ghost p-1.5 h-auto">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h2 className="font-semibold">
            {MONTHS[month]} {year}
          </h2>
          <button onClick={nextMonth} className="btn-ghost p-1.5 h-auto">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-border">
          {DAYS.map((d) => (
            <div key={d} className="py-2 text-center text-xs font-medium text-muted-foreground">
              {d}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-7 divide-x divide-border">
          {cells.map((day, idx) => {
            const dayPosts = day ? (postsByDay[day] ?? []) : [];
            return (
              <div
                key={idx}
                className={cn(
                  'min-h-24 p-1.5 border-b border-border relative',
                  !day && 'bg-muted/20',
                  day && 'hover:bg-muted/30 transition-colors',
                )}
              >
                {day && (
                  <>
                    <span
                      className={cn(
                        'w-6 h-6 flex items-center justify-center rounded-full text-xs font-medium',
                        isToday(day)
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground',
                      )}
                    >
                      {day}
                    </span>

                    <div className="mt-1 space-y-0.5">
                      {dayPosts.slice(0, 3).map((post: any) => {
                        const platform = post.platforms?.[0] ?? 'FACEBOOK';
                        return (
                          <Link
                            key={post.id}
                            href={`/dashboard/posts/${post.id}`}
                            className="block rounded px-1 py-0.5 text-[10px] text-white truncate"
                            style={{ background: PLATFORM_COLORS[platform] ?? '#888' }}
                          >
                            {post.content?.slice(0, 20)}...
                          </Link>
                        );
                      })}
                      {dayPosts.length > 3 && (
                        <p className="text-[10px] text-muted-foreground px-1">
                          +{dayPosts.length - 3} more
                        </p>
                      )}
                    </div>

                    {/* Quick add */}
                    <Link
                      href={`/dashboard/posts/compose?date=${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`}
                      className="absolute bottom-1 right-1 w-4 h-4 rounded bg-muted/70 hover:bg-muted flex items-center justify-center opacity-0 group-hover:opacity-100"
                    >
                      <Plus className="w-2.5 h-2.5 text-muted-foreground" />
                    </Link>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {Object.entries(PLATFORM_COLORS).map(([platform, color]) => (
          <div key={platform} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className="w-3 h-3 rounded" style={{ background: color }} />
            {platform}
          </div>
        ))}
      </div>
    </div>
  );
}
