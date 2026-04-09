import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Alert,
  Platform,
  useColorScheme,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeInDown,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Colors, ThemeColors } from '@/constants/Colors';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import {
  useMessagesStore,
  Conversation,
  ConversationTab,
} from '@/stores/useMessagesStore';
import dayjs from 'dayjs';

// ── Timestamp helper ──────────────────────────────────────────────────────

function formatConvTime(iso: string): string {
  const d = dayjs(iso);
  const now = dayjs();
  if (d.isSame(now, 'day')) return d.format('HH:mm');
  if (d.isSame(now.subtract(1, 'day'), 'day')) return 'Hier';
  if (d.isAfter(now.subtract(7, 'day'))) {
    return d.format('ddd');
  }
  return d.format('DD/MM');
}

// ── Conversation Row ──────────────────────────────────────────────────────

const REVEAL_W = 80;

function ConversationRow({
  item,
  onPress,
  onDelete,
}: {
  item: Conversation;
  onPress: () => void;
  onDelete: () => void;
}) {
  const colorScheme = useColorScheme();
  const t = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const ss = createStyles(t);
  const translateX = useSharedValue(0);
  const startX = useSharedValue(0);

  const pan = Gesture.Pan()
    .activeOffsetX([-8, 8])
    .onBegin(() => {
      startX.value = translateX.value;
    })
    .onUpdate((e) => {
      const next = startX.value + e.translationX;
      translateX.value = Math.max(-REVEAL_W, Math.min(0, next));
    })
    .onEnd((e) => {
      if (translateX.value < -REVEAL_W / 2 || e.velocityX < -400) {
        translateX.value = withSpring(-REVEAL_W, { damping: 20, stiffness: 200 });
      } else {
        translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
      }
    });

  const rowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const msgs = useMessagesStore((s) => s.messages[item.id] ?? []);
  const lastMsg = msgs[msgs.length - 1];
  const lastTime = lastMsg?.createdAt ?? item.product.id;

  return (
    <View style={ss.rowWrap}>
      {/* Delete action */}
      <View style={ss.deleteAction}>
        <TouchableOpacity
          style={ss.deleteBtn}
          onPress={() => {
            translateX.value = withSpring(0);
            onDelete();
          }}
        >
          <Feather name="trash-2" size={20} color="#FFF" />
          <Text style={ss.deleteBtnText}>Supprimer</Text>
        </TouchableOpacity>
      </View>

      <GestureDetector gesture={pan}>
        <Animated.View style={rowStyle}>
          <TouchableOpacity
            style={ss.row}
            onPress={onPress}
            activeOpacity={0.75}
          >
            {/* Avatar + online dot */}
            <View style={ss.avatarWrap}>
              <Image
                source={{ uri: item.participant.avatar }}
                style={ss.avatar}
                contentFit="cover"
                transition={{ effect: 'cross-dissolve', duration: 200 }}
              />
              {item.participant.isOnline && <View style={ss.onlineDot} />}
            </View>

            {/* Main content */}
            <View style={ss.rowContent}>
              {/* Top row: name + timestamp */}
              <View style={ss.rowTop}>
                <View style={ss.nameRow}>
                  <Text
                    style={[
                      ss.username,
                      item.unreadCount > 0 && ss.usernameBold,
                    ]}
                    numberOfLines={1}
                  >
                    {item.participant.username}
                  </Text>
                  {item.participant.isVerified && (
                    <Ionicons
                      name="checkmark-circle"
                      size={14}
                      color={t.primary}
                    />
                  )}
                </View>
                <Text style={ss.timestamp}>
                  {lastMsg ? formatConvTime(lastMsg.createdAt) : ''}
                </Text>
              </View>

              {/* Last message */}
              <Text
                style={[
                  ss.lastMsg,
                  item.unreadCount > 0 && ss.lastMsgBold,
                ]}
                numberOfLines={1}
              >
                {lastMsg
                  ? lastMsg.type === 'offer'
                    ? `🏷️ Offre de ${lastMsg.offerAmount}€`
                    : lastMsg.type === 'system'
                    ? `ℹ️ ${lastMsg.text}`
                    : lastMsg.senderId === 'me'
                    ? `Vous : ${lastMsg.text}`
                    : lastMsg.text
                  : ''}
              </Text>

              {/* Bottom row: product + unread badge */}
              <View style={ss.rowBottom}>
                <View style={ss.productRow}>
                  <Image
                    source={{ uri: item.product.image }}
                    style={ss.productThumb}
                    contentFit="cover"
                  />
                  <Text style={ss.productTitle} numberOfLines={1}>
                    {item.product.title}
                  </Text>
                  <Text style={ss.productPrice}>
                    {item.product.price}€
                  </Text>
                </View>
                {item.unreadCount > 0 && (
                  <View style={ss.badge}>
                    <Text style={ss.badgeText}>{item.unreadCount}</Text>
                  </View>
                )}
                {item.isTyping && item.unreadCount === 0 && (
                  <View style={ss.typingPill}>
                    <Text style={ss.typingPillText}>écrit…</Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────

function EmptyState({ tab }: { tab: ConversationTab }) {
  const colorScheme = useColorScheme();
  const t = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const ss = createStyles(t);
  return (
    <View style={ss.empty}>
      <View style={ss.emptyIcon}>
        <Ionicons
          name={tab === 'buy' ? 'bag-outline' : 'pricetag-outline'}
          size={40}
          color={t.textSecondary}
        />
      </View>
      <Text style={ss.emptyTitle}>Pas encore de messages</Text>
      <Text style={ss.emptySub}>
        {tab === 'buy'
          ? 'Vos échanges avec les vendeurs apparaîtront ici'
          : 'Vos échanges avec les acheteurs apparaîtront ici'}
      </Text>
    </View>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────

const TABS: { key: ConversationTab; label: string }[] = [
  { key: 'buy', label: 'Achats' },
  { key: 'sell', label: 'Ventes' },
];

export default function MessagesScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const ss = createStyles(theme);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ConversationTab>('buy');
  const [refreshing, setRefreshing] = useState(false);

  const { conversations, deleteConversation, markAsRead } = useMessagesStore();

  const filtered = conversations.filter((c) => c.tab === activeTab);
  const totalUnread = conversations.reduce((s, c) => s + c.unreadCount, 0);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleDelete = useCallback(
    (id: string) => {
      Alert.alert('Supprimer la conversation', 'Cette conversation sera définitivement supprimée.', [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => deleteConversation(id),
        },
      ]);
    },
    [deleteConversation],
  );

  const handlePress = useCallback(
    (conv: Conversation) => {
      markAsRead(conv.id);
      router.push(`/chat/${conv.id}` as never);
    },
    [markAsRead, router],
  );

  return (
    <View style={[ss.root, { paddingTop: insets.top }]}>
      {/* ── Header ── */}
      <View style={ss.header}>
        <View style={ss.headerLeft}>
          <Text style={ss.headerTitle}>Messages</Text>
          {totalUnread > 0 && (
            <View style={ss.totalBadge}>
              <Text style={ss.totalBadgeText}>{totalUnread}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity style={ss.composeBtn} activeOpacity={0.75}>
          <Feather name="edit-2" size={18} color={theme.primary} />
        </TouchableOpacity>
      </View>

      {/* ── Tab switcher ── */}
      <View style={ss.tabBar}>
        <View style={ss.tabPill}>
          {TABS.map((t) => {
            const active = activeTab === t.key;
            const tabUnread = conversations
              .filter((c) => c.tab === t.key)
              .reduce((s, c) => s + c.unreadCount, 0);
            return (
              <TouchableOpacity
                key={t.key}
                onPress={() => setActiveTab(t.key)}
                style={[ss.tabItem, active && ss.tabItemActive]}
                activeOpacity={0.8}
              >
                <Text style={[ss.tabText, active && ss.tabTextActive]}>
                  {t.label}
                </Text>
                {tabUnread > 0 && !active && (
                  <View style={ss.tabBadge}>
                    <Text style={ss.tabBadgeText}>{tabUnread}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ── List ── */}
      <FlatList
        data={filtered}
        keyExtractor={(c) => c.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          ss.listContent,
          filtered.length === 0 && { flex: 1 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
          />
        }
        ListEmptyComponent={<EmptyState tab={activeTab} />}
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(index * 40).springify()}>
            <ConversationRow
              item={item}
              onPress={() => handlePress(item)}
              onDelete={() => handleDelete(item.id)}
            />
          </Animated.View>
        )}
        ItemSeparatorComponent={() => (
          <View style={ss.separator} />
        )}
      />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────

const createStyles = (t: ThemeColors) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: t.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: t.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: t.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 22,
    color: t.text,
    lineHeight: 28,
  },
  totalBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: t.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  totalBadgeText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 11,
    color: '#FFF',
    lineHeight: 14,
  },
  composeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: `${t.primary}12`,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Tabs
  tabBar: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: t.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: t.border,
  },
  tabPill: {
    flexDirection: 'row',
    backgroundColor: t.background,
    borderRadius: BorderRadius.full,
    padding: 3,
    height: 36,
  },
  tabItem: {
    flex: 1,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  tabItemActive: {
    backgroundColor: t.primary,
  },
  tabText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: t.textSecondary,
    lineHeight: 18,
  },
  tabTextActive: {
    color: '#FFF',
  },
  tabBadge: {
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: t.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  tabBadgeText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 10,
    color: '#FFF',
    lineHeight: 13,
  },

  // List
  listContent: {
    paddingBottom: 100,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: t.border,
    marginLeft: 76,
  },

  // Row
  rowWrap: {
    position: 'relative',
    backgroundColor: t.surface,
    overflow: 'hidden',
  },
  deleteAction: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: REVEAL_W,
  },
  deleteBtn: {
    flex: 1,
    backgroundColor: t.error,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  deleteBtnText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 10,
    color: '#FFF',
    lineHeight: 14,
  },
  row: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
    backgroundColor: t.surface,
  },
  avatarWrap: { position: 'relative' },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: t.background,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: t.success,
    borderWidth: 2,
    borderColor: t.surface,
  },
  rowContent: {
    flex: 1,
    gap: 4,
    justifyContent: 'center',
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  username: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: t.text,
    lineHeight: 20,
  },
  usernameBold: {
    fontFamily: 'Poppins_700Bold',
  },
  timestamp: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: t.textSecondary,
    lineHeight: 16,
    marginLeft: Spacing.sm,
  },
  lastMsg: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: t.textSecondary,
    lineHeight: 17,
  },
  lastMsgBold: {
    fontFamily: 'Poppins_600SemiBold',
    color: t.text,
  },
  rowBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  productThumb: {
    width: 22,
    height: 22,
    borderRadius: 4,
    backgroundColor: t.background,
  },
  productTitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: t.textSecondary,
    flex: 1,
    lineHeight: 15,
  },
  productPrice: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11,
    color: t.primary,
    lineHeight: 15,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: t.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  badgeText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 11,
    color: '#FFF',
    lineHeight: 14,
  },
  typingPill: {
    backgroundColor: `${t.primary}18`,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  typingPillText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 10,
    color: t.primary,
    lineHeight: 14,
  },

  // Empty
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxxl,
    gap: Spacing.md,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: t.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  emptyTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    color: t.text,
  },
  emptySub: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: t.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
