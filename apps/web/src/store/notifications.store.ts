'use client';

import { create } from 'zustand';
import { notificationsApi } from '@/lib/api';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  actionUrl?: string;
  createdAt: string;
}

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;

  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  addNotification: (notification: Notification) => void;
}

export const useNotificationsStore = create<NotificationsState>()((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const res = await notificationsApi.list() as any;
      const notifications = res.data ?? res;
      set({
        notifications,
        unreadCount: notifications.filter((n: Notification) => !n.isRead).length,
      });
    } catch {} finally {
      set({ isLoading: false });
    }
  },

  markAsRead: async (id) => {
    await notificationsApi.markAsRead(id);
    set((s) => ({
      notifications: s.notifications.map((n) => n.id === id ? { ...n, isRead: true } : n),
      unreadCount: Math.max(0, s.unreadCount - 1),
    }));
  },

  markAllAsRead: async () => {
    await notificationsApi.markAllAsRead();
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    }));
  },

  deleteNotification: async (id) => {
    await notificationsApi.delete(id);
    const wasUnread = get().notifications.find((n) => n.id === id)?.isRead === false;
    set((s) => ({
      notifications: s.notifications.filter((n) => n.id !== id),
      unreadCount: wasUnread ? Math.max(0, s.unreadCount - 1) : s.unreadCount,
    }));
  },

  addNotification: (notification) => {
    set((s) => ({
      notifications: [notification, ...s.notifications],
      unreadCount: notification.isRead ? s.unreadCount : s.unreadCount + 1,
    }));
  },
}));
