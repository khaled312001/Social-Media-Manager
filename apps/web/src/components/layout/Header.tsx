'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Search, Sun, Moon, Plus } from 'lucide-react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { useNotificationsStore } from '@/store/notifications.store';
import { useAuth } from '@/hooks/useAuth';
import { formatRelativeTime } from '@/lib/utils';

export function Header() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const { workspace } = useAuth();
  const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead } =
    useNotificationsStore();
  const router = useRouter();

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { fetchNotifications(); }, []);

  return (
    <header className="h-14 border-b border-border bg-background/95 backdrop-blur-sm flex items-center justify-between px-4 gap-4 sticky top-0 z-40">
      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search posts, contacts, campaigns..."
            className="input pl-9 w-full h-8 text-sm bg-muted/50 border-0 focus:bg-background"
          />
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1">
        {/* Compose CTA */}
        <button
          onClick={() => router.push('/dashboard/posts/compose')}
          className="btn-primary h-8 px-3 text-sm flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          New Post
        </button>

        {/* Theme toggle */}
        {mounted && (
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-8 h-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        )}

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen((v) => !v)}
            className="relative w-8 h-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-destructive" />
            )}
          </button>

          {notifOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
              <div className="absolute right-0 top-full mt-1 w-80 bg-popover border border-border rounded-lg shadow-xl z-50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <h3 className="text-sm font-semibold">Notifications</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-primary hover:underline"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-border">
                  {notifications.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No notifications yet
                    </p>
                  ) : (
                    notifications.slice(0, 10).map((n) => (
                      <button
                        key={n.id}
                        onClick={() => markAsRead(n.id)}
                        className={cn(
                          'flex gap-3 w-full px-4 py-3 text-left hover:bg-accent transition-colors',
                          !n.isRead && 'bg-primary/5',
                        )}
                      >
                        {!n.isRead && (
                          <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                        )}
                        <div className={cn('flex-1 min-w-0', n.isRead && 'pl-4')}>
                          <p className="text-xs font-medium truncate">{n.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{n.message}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {formatRelativeTime(n.createdAt)}
                          </p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
