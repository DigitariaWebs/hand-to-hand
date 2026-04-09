import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { formatDate } from '@/utils';
import { mockDeliveryHistory } from '@/services/mock/deliveries';
import { DeliveryHistoryStatus } from '@/types/logistics';

type Filter = 'all' | 'completed' | 'cancelled' | 'disputed';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Toutes' },
  { key: 'completed', label: 'Réussies' },
  { key: 'cancelled', label: 'Annulées' },
  { key: 'disputed', label: 'Litiges' },
];

const STATUS_CONFIG: Record<DeliveryHistoryStatus, { label: string; color: string; icon: string }> = {
  completed: { label: 'Réussie', color: '#10B981', icon: '✅' },
  cancelled: { label: 'Annulée', color: '#EF4444', icon: '❌' },
  disputed: { label: 'Litige', color: '#F59E0B', icon: '⚠️' },
};

function Stars({ rating, size = 11 }: { rating: number; size?: number }) {
  if (rating === 0) return null;
  return (
    <View style={{ flexDirection: 'row', gap: 1 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Feather key={s} name="star" size={size} color={s <= rating ? '#F59E0B' : '#D1D5DB'} />
      ))}
    </View>
  );
}

export default function DeliveryHistoryScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [filter, setFilter] = useState<Filter>('all');

  const filtered = useMemo(() => {
    if (filter === 'all') return mockDeliveryHistory;
    return mockDeliveryHistory.filter((d) => d.status === filter);
  }, [filter]);

  // Stats
  const totalDeliveries = mockDeliveryHistory.length;
  const completed = mockDeliveryHistory.filter((d) => d.status === 'completed');
  const successRate = totalDeliveries > 0 ? Math.round((completed.length / totalDeliveries) * 100) : 0;
  const totalEarnings = completed.reduce((sum, d) => sum + d.earnings, 0);
  const avgRating = completed.length > 0
    ? (completed.reduce((sum, d) => sum + d.rating, 0) / completed.length).toFixed(1)
    : '0';

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Historique des livraisons</Text>
        <View style={{ width: 36 }} />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            {/* Stats card */}
            <View style={[styles.statsCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: theme.text }]}>{totalDeliveries}</Text>
                  <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Livraisons</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: theme.success }]}>{successRate}%</Text>
                  <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Réussite</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: theme.success }]}>{totalEarnings.toFixed(2)}€</Text>
                  <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Gains</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: '#F59E0B' }]}>{avgRating}</Text>
                  <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Note</Text>
                </View>
              </View>
            </View>

            {/* Filters */}
            <View style={styles.filterRow}>
              {FILTERS.map((f) => {
                const active = filter === f.key;
                return (
                  <TouchableOpacity
                    key={f.key}
                    onPress={() => setFilter(f.key)}
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor: active ? `${theme.primary}15` : theme.surface,
                        borderColor: active ? theme.primary : theme.border,
                      },
                    ]}
                  >
                    <Text style={[styles.filterText, { color: active ? theme.primary : theme.textSecondary }]}>
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.countText, { color: theme.textSecondary }]}>
              {filtered.length} livraison{filtered.length !== 1 ? 's' : ''}
            </Text>
          </>
        }
        renderItem={({ item, index }) => {
          const cfg = STATUS_CONFIG[item.status];
          return (
            <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
              <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={styles.cardHeader}>
                  <Text style={[styles.cardDate, { color: theme.textSecondary }]}>
                    {formatDate(item.date, 'DD MMM YYYY')}
                  </Text>
                  <View style={[styles.statusBadge, { backgroundColor: `${cfg.color}15` }]}>
                    <Text style={[styles.statusText, { color: cfg.color }]}>
                      {cfg.icon} {cfg.label}
                    </Text>
                  </View>
                </View>

                <View style={styles.routeRow}>
                  <Feather name="map-pin" size={12} color={theme.success} />
                  <Text style={[styles.routeText, { color: theme.text }]}>{item.routeOriginCity}</Text>
                  <Feather name="arrow-right" size={12} color={theme.textSecondary} />
                  <Feather name="map-pin" size={12} color={theme.error} />
                  <Text style={[styles.routeText, { color: theme.text }]}>{item.routeDestinationCity}</Text>
                </View>

                <Text style={[styles.hubsText, { color: theme.textSecondary }]}>
                  {item.originHubName} → {item.destinationHubName}
                </Text>

                <View style={styles.cardFooter}>
                  <Text style={[styles.productText, { color: theme.textSecondary }]}>
                    {item.productName}
                  </Text>
                  <View style={styles.footerRight}>
                    {item.status === 'completed' && (
                      <>
                        <Stars rating={item.rating} />
                        <Text style={[styles.earningsText, { color: theme.success }]}>
                          +{item.earnings.toFixed(2)}€
                        </Text>
                      </>
                    )}
                  </View>
                </View>
              </View>
            </Animated.View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Feather name="inbox" size={48} color={theme.border} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>Aucune livraison</Text>
            <Text style={[styles.emptyDesc, { color: theme.textSecondary }]}>
              Aucune livraison effectuée pour le moment. Publiez un trajet pour commencer !
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...Typography.h3, flex: 1, textAlign: 'center' },

  listContent: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: 100 },

  // Stats
  statsCard: {
    borderRadius: BorderRadius.md, borderWidth: 1, padding: Spacing.lg,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 1,
  },
  statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  statItem: { alignItems: 'center', gap: 2 },
  statValue: { ...Typography.h3 },
  statLabel: { ...Typography.caption, fontSize: 11 },
  statDivider: { width: 1, height: 32 },

  // Filters
  filterRow: { flexDirection: 'row', gap: Spacing.sm },
  filterChip: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full, borderWidth: 1,
  },
  filterText: { ...Typography.captionMedium },
  countText: { ...Typography.caption },

  // Card
  card: {
    borderRadius: BorderRadius.md, borderWidth: 1, padding: Spacing.md, gap: Spacing.sm,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardDate: { ...Typography.captionMedium },
  statusBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.full },
  statusText: { ...Typography.caption, fontSize: 11, fontFamily: 'Poppins_500Medium' },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  routeText: { ...Typography.bodyMedium, fontFamily: 'Poppins_600SemiBold' },
  hubsText: { ...Typography.caption, fontSize: 11 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  productText: { ...Typography.caption, flex: 1 },
  footerRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  earningsText: { ...Typography.bodyMedium, fontFamily: 'Poppins_600SemiBold' },

  // Empty
  emptyWrap: { alignItems: 'center', paddingTop: 60, gap: Spacing.md },
  emptyTitle: { ...Typography.h3 },
  emptyDesc: { ...Typography.body, textAlign: 'center', maxWidth: 260 },
});
