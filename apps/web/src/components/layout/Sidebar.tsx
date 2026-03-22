'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard, Inbox, FileText, Calendar, BarChart3, Megaphone,
  Mail, Users, Bot, Zap, Settings, CreditCard, Key, Palette, Bell,
  ChevronLeft, ChevronRight, LogOut, Building2, ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useNotificationsStore } from '@/store/notifications.store';

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/inbox', label: 'Inbox', icon: Inbox, badge: 'unread' },
  { href: '/dashboard/posts', label: 'Posts', icon: FileText },
  { href: '/dashboard/calendar', label: 'Calendar', icon: Calendar },
  { href: '/dashboard/campaigns', label: 'Campaigns', icon: Megaphone },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/dashboard/email', label: 'Email Marketing', icon: Mail },
  { href: '/dashboard/crm', label: 'CRM', icon: Users },
  { href: '/dashboard/ai', label: 'AI Agents', icon: Bot },
  { href: '/dashboard/automation', label: 'Automation', icon: Zap },
  { href: '/dashboard/team', label: 'Team', icon: Users },
];

const settingsItems = [
  { href: '/dashboard/settings', label: 'Settings', icon: Settings, exact: true },
  { href: '/dashboard/settings/accounts', label: 'Social Accounts', icon: Building2 },
  { href: '/dashboard/settings/billing', label: 'Billing', icon: CreditCard },
  { href: '/dashboard/settings/api-keys', label: 'API Keys', icon: Key },
  { href: '/dashboard/settings/white-label', label: 'White Label', icon: Palette },
  { href: '/dashboard/settings/notifications', label: 'Notifications', icon: Bell },
];

interface NavItemProps {
  href: string;
  label: string;
  icon: React.ElementType;
  exact?: boolean;
  badge?: string | number;
  collapsed?: boolean;
}

function NavItem({ href, label, icon: Icon, exact, badge, collapsed }: NavItemProps) {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname.startsWith(href);
  const unreadCount = useNotificationsStore((s) => s.unreadCount);
  const badgeValue = badge === 'unread' ? unreadCount : badge;

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all',
        'hover:bg-accent hover:text-accent-foreground',
        isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground',
        collapsed && 'justify-center px-2',
      )}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      {!collapsed && (
        <>
          <span className="flex-1">{label}</span>
          {!!badgeValue && (
            <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-medium">
              {Number(badgeValue) > 99 ? '99+' : badgeValue}
            </span>
          )}
        </>
      )}
    </Link>
  );
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { user, workspace, workspaces, logout, setWorkspace } = useAuth();
  const [workspaceSwitcherOpen, setWorkspaceSwitcherOpen] = useState(false);

  return (
    <aside
      className={cn(
        'flex flex-col h-screen bg-card border-r border-border transition-all duration-300 relative',
        collapsed ? 'w-16' : 'w-60',
      )}
    >
      {/* Logo / Workspace switcher */}
      <div className="p-3 border-b border-border">
        {collapsed ? (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold mx-auto">
            B
          </div>
        ) : (
          <div className="relative">
            <button
              onClick={() => setWorkspaceSwitcherOpen((v) => !v)}
              className="flex items-center gap-2 w-full rounded-lg p-2 hover:bg-accent transition-colors"
            >
              <div className="w-7 h-7 rounded-md bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {workspace?.name?.[0]?.toUpperCase() ?? 'B'}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-xs font-semibold truncate">{workspace?.name ?? 'Barmagly'}</p>
                <p className="text-[10px] text-muted-foreground truncate">Free plan</p>
              </div>
              <ChevronDown className={cn('w-3 h-3 text-muted-foreground transition-transform', workspaceSwitcherOpen && 'rotate-180')} />
            </button>

            {workspaceSwitcherOpen && workspaces.length > 1 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg z-50 overflow-hidden">
                {workspaces.map((ws) => (
                  <button
                    key={ws.id}
                    onClick={() => { setWorkspace(ws); setWorkspaceSwitcherOpen(false); }}
                    className={cn(
                      'flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-accent transition-colors',
                      ws.id === workspace?.id && 'bg-accent',
                    )}
                  >
                    <div className="w-5 h-5 rounded bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold">
                      {ws.name[0].toUpperCase()}
                    </div>
                    <span className="truncate">{ws.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {navItems.map((item) => (
          <NavItem key={item.href} {...item} collapsed={collapsed} />
        ))}

        <div className="pt-2">
          {!collapsed && (
            <button
              onClick={() => setSettingsOpen((v) => !v)}
              className="flex items-center gap-2 w-full px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              <span>SETTINGS</span>
              <ChevronRight className={cn('w-3 h-3 ml-auto transition-transform', settingsOpen && 'rotate-90')} />
            </button>
          )}
          {(collapsed || settingsOpen) && settingsItems.map((item) => (
            <NavItem key={item.href} {...item} collapsed={collapsed} />
          ))}
        </div>
      </nav>

      {/* User footer */}
      <div className="p-2 border-t border-border">
        {collapsed ? (
          <button
            onClick={logout}
            className="flex items-center justify-center w-full p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        ) : (
          <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent transition-colors">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-pink-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {user?.name?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate">{user?.name}</p>
              <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
            </div>
            <button
              onClick={logout}
              className="text-muted-foreground hover:text-destructive transition-colors"
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-background border border-border flex items-center justify-center shadow-sm hover:bg-accent transition-colors z-10"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </aside>
  );
}
