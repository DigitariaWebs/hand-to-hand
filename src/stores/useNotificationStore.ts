import { create } from 'zustand';
import { AppNotification, mockNotifications } from '@/services/mock/notifications';

type NotificationStore = {
  notifications: AppNotification[];
  unreadCount: number;

  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
};

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: mockNotifications,
  unreadCount: mockNotifications.filter((n) => !n.isRead).length,

  markAsRead: (id) =>
    set((state) => {
      const updated = state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n,
      );
      return {
        notifications: updated,
        unreadCount: updated.filter((n) => !n.isRead).length,
      };
    }),

  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    })),
}));
