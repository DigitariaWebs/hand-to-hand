import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  FlatList,
  TouchableOpacity,
  ScrollView,
  ListRenderItem,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { useNotificationStore } from '@/stores/useNotificationStore';
import type { AppNotification, NotificationType } from '@/services/mock/notifications';

// ── Config ─────────────────────────────────────────────────────────────────

type FilterTab = 'all' | NotificationType;

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'Tout' },
  { key: 'message', label: 'Messages' },
  { key: 'order', label: 'Commandes' },
  { key: 'auction', label: 'Enchères' },
  { key: 'delivery', label: 'Livraisons' },
  { key: 'boost', label: 'Boost' },
];

type NotifIconConfig = {
  icon: keyof typeof Feather.glyphMap;
  bg: string;
  color: string;
};

const NOTIF_ICONS: Record<NotificationType, NotifIconConfig> = {
  message: { icon: 'message-circle', bg: '#EFF6FF', color: '#3B82F6' },
  order: { icon: 'package', bg: '#ECFDF5', color: '#10B981' },
  auction: { icon: 'clock', bg: '#F5F3FF', color: '#8B5CF6' },
  delivery: { icon: 'truck', bg: '#F0FDFA', color: '#14B8A6' },
  boost: { icon: 'zap', bg: '#FFFBEB', color: '#F59E0B' },
};

// ── Relative time helper ───────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'À l\'instant';
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}j`;
}

// ── Notification card ──────────────────────────────────────────────────────

function NotifCard({
  item,
  theme,
  onPress,
}: {
  item: AppNotification;
  theme: typeof Colors.light;
  onPress: () => void;
}) {
  const cfg = NOTIF_ICONS[item.type];

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: item.isRead ? theme.surface : `${theme.primary}06`,
          borderColor: theme.border,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {/* Unread dot */}
      {!item.isRead && (
        <View style={[styles.unreadDot, { backgroundColor: theme.primary }]} />
      )}

      {/* Icon */}
      <View style={[styles.iconCircle, { backgroundColor: cfg.bg }]}>
        <Feather name={cfg.icon} size={18} color={cfg.color} />
      </View>

      {/* Content */}
      <View style={styles.cardContent}>
        <View style={styles.cardTop}>
          <Text
            style={[
              styles.cardTitle,
              {
                color: theme.text,
                fontFamily: item.isRead ? 'Poppins_500Medium' : 'Poppins_600SemiBold',
              },
            ]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <Text style={[styles.cardTime, { color: theme.textSecondary }]}>
            {relativeTime(item.timestamp)}
          </Text>
        </View>
        <Text
          style={[styles.cardBody, { color: theme.textSecondary }]}
          numberOfLines={2}
        >
          {item.body}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────

function EmptyState({ theme }: { theme: typeof Colors.light }) {
  return (
    <View style={styles.emptyState}>
      <Feather name="bell-off" size={48} color={theme.border} />
      <Text style={[styles.emptyTitle, { color: theme.text }]}>
        Aucune notification
      </Text>
      <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
        Vous êtes à jour ! Revenez plus tard.
      </Text>
    </View>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────

export default function NotificationsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotificationStore();
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');

  const filtered =
    activeFilter === 'all'
      ? notifications
      : notifications.filter((n) => n.type === activeFilter);

  const unreadInFilter =
    activeFilter === 'all'
      ? unreadCount
      : filtered.filter((n) => !n.isRead).length;

  const handlePress = useCallback(
    (item: AppNotification) => {
      markAsRead(item.id);
      if (item.actionRoute) {
        router.push(item.actionRoute as any);
      }
    },
    [markAsRead, router],
  );

  const renderItem: ListRenderItem<AppNotification> = ({ item }) => (
    <NotifCard item={item} theme={theme} onPress={() => handlePress(item)} />
  );

  return (
    <View
      style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: theme.surface, borderBottomColor: theme.border },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={theme.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Notifications</Text>
          {unreadCount > 0 && (
            <Text style={[styles.headerSub, { color: theme.textSecondary }]}>
              {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
            </Text>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity
            style={[styles.markAllBtn, { borderColor: theme.primary }]}
            onPress={markAllAsRead}
          >
            <Feather name="check-circle" size={13} color={theme.primary} />
            <Text style={[styles.markAllText, { color: theme.primary }]}>
              Tout lire
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter tabs */}
      <View
        style={[
          styles.filterBar,
          { backgroundColor: theme.surface, borderBottomColor: theme.border },
        ]}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {FILTER_TABS.map((tab) => {
            const isActive = activeFilter === tab.key;
            const tabUnread =
              tab.key === 'all'
                ? unreadCount
                : notifications.filter((n) => n.type === tab.key && !n.isRead).length;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.filterTab,
                  isActive && { backgroundColor: `${theme.primary}12` },
                ]}
                onPress={() => setActiveFilter(tab.key)}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    {
                      color: isActive ? theme.primary : theme.textSecondary,
                      fontFamily: isActive ? 'Poppins_600SemiBold' : 'Poppins_400Regular',
                    },
                  ]}
                >
                  {tab.label}
                </Text>
                {tabUnread > 0 && (
                  <View style={[styles.filterBadge, { backgroundColor: theme.primary }]}>
                    <Text style={styles.filterBadgeText}>
                      {tabUnread > 9 ? '9+' : tabUnread}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.listContent,
          filtered.length === 0 && { flex: 1 },
        ]}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => (
          <View style={[styles.separator, { backgroundColor: theme.border }]} />
        )}
        ListEmptyComponent={<EmptyState theme={theme} />}
        ListHeaderComponent={
          filtered.length > 0 ? (
            <Text style={[styles.listHeader, { color: theme.textSecondary }]}>
              {filtered.length} notification{filtered.length > 1 ? 's' : ''}
              {unreadInFilter > 0 ? ` · ${unreadInFilter} non lue${unreadInFilter > 1 ? 's' : ''}` : ''}
            </Text>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { ...Typography.h3 },
  headerSub: { ...Typography.caption },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  markAllText: { ...Typography.captionMedium },

  // Filter bar
  filterBar: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  filterScroll: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  filterTabText: { fontSize: 13, lineHeight: 18 },
  filterBadge: {
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  filterBadgeText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 9,
    color: '#FFF',
    lineHeight: 13,
  },

  // List
  listContent: {
    paddingBottom: 40,
  },
  listHeader: {
    ...Typography.caption,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  separator: { height: StyleSheet.hairlineWidth },

  // Notification card
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md + 2,
    position: 'relative',
  },
  unreadDot: {
    position: 'absolute',
    left: 6,
    top: '50%',
    marginTop: -2,
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardContent: { flex: 1, gap: 4 },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
  },
  cardTitle: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  cardTime: {
    fontSize: 11,
    lineHeight: 16,
    fontFamily: 'Poppins_400Regular',
    flexShrink: 0,
    marginTop: 1,
  },
  cardBody: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    lineHeight: 17,
  },

  // Empty
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    paddingTop: 80,
  },
  emptyTitle: { ...Typography.h3 },
  emptySub: { ...Typography.body, textAlign: 'center', maxWidth: 240 },
});
