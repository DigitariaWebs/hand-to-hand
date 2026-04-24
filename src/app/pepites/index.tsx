import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { mockPepites } from '@/services/mock/pepites';
import {
  calculatePepiteScore,
  getRotationKey,
  PEPITE_REASON_LABELS,
  shufflePepites,
} from '@/utils/pepiteScore';
import type { Product } from '@/types/product';
import { formatPrice } from '@/utils';

type TabKey = 'today' | 'week' | 'month';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'today', label: 'Aujourd\'hui' },
  { key: 'week', label: 'Cette semaine' },
  { key: 'month', label: 'Ce mois' },
];

function reasonBadgeColor(reasonKey: string, theme: typeof Colors.light): {
  bg: string;
  fg: string;
} {
  switch (reasonKey) {
    case 'below_market':
      return { bg: `${theme.success}18`, fg: theme.success };
    case 'excellent_condition':
      return { bg: `${theme.primary}15`, fg: theme.primary };
    case 'verified_seller':
      return { bg: `${theme.primary}10`, fg: theme.primary };
    case 'fast_delivery':
      return { bg: theme.goldLight, fg: theme.gold };
    case 'limited_stock':
      return { bg: theme.violetLight, fg: theme.violet };
    case 'rare_category':
      return { bg: theme.violetLight, fg: theme.violet };
    case 'high_demand':
      return { bg: `${theme.warning}20`, fg: theme.warning };
    default:
      return { bg: theme.surfaceElevated, fg: theme.textSecondary };
  }
}

function PepiteGridCard({
  product,
  theme,
  onPress,
}: {
  product: Product;
  theme: typeof Colors.light;
  onPress: () => void;
}) {
  const { reasons } = calculatePepiteScore(product);
  const pills = reasons.slice(0, 2);
  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: theme.surface }]}
      activeOpacity={0.85}
      onPress={onPress}
    >
      <View style={styles.imageWrap}>
        <Image
          source={{ uri: product.images[0]?.url ?? product.images[0]?.thumbnail }}
          style={styles.image}
          contentFit="cover"
        />
        <View style={styles.badge}>
          <Text style={styles.badgeText}>💎 Pépite</Text>
        </View>
      </View>
      <View style={styles.cardBody}>
        <Text
          style={[styles.cardTitle, { color: theme.text }]}
          numberOfLines={2}
        >
          {product.title}
        </Text>
        <Text style={[styles.cardPrice, { color: theme.primary }]}>
          {formatPrice(product.price)}
        </Text>
        <View style={styles.sellerRow}>
          <Image
            source={{ uri: product.seller.avatar }}
            style={styles.sellerAvatar}
          />
          <Text
            style={[styles.sellerName, { color: theme.textSecondary }]}
            numberOfLines={1}
          >
            {product.seller.username}
          </Text>
        </View>
        {pills.length > 0 && (
          <View style={styles.pillsRow}>
            {pills.map((p) => {
              const tone = reasonBadgeColor(p, theme);
              return (
                <View
                  key={p}
                  style={[styles.pill, { backgroundColor: tone.bg }]}
                >
                  <Text style={[styles.pillText, { color: tone.fg }]}>
                    {PEPITE_REASON_LABELS[p]}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function PepitesScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [tab, setTab] = useState<TabKey>('today');
  const [refreshing, setRefreshing] = useState(false);

  const products = useMemo(
    () => shufflePepites(mockPepites, getRotationKey(tab)),
    [tab],
  );

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 8,
            backgroundColor: theme.surface,
            borderBottomColor: theme.border,
          },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          💎 Pépites du moment
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={{ paddingHorizontal: Spacing.lg, paddingTop: Spacing.md }}>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Les trouvailles les plus rares sélectionnées pour vous.
        </Text>
        <View style={styles.tabsRow}>
          {TABS.map((t) => {
            const active = t.key === tab;
            return (
              <TouchableOpacity
                key={t.key}
                onPress={() => setTab(t.key)}
                style={[
                  styles.tabPill,
                  {
                    backgroundColor: active ? theme.primary : theme.surface,
                    borderColor: active ? theme.primary : theme.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.tabText,
                    { color: active ? '#FFF' : theme.textSecondary },
                  ]}
                >
                  {t.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.column}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.primary}
          />
        }
        renderItem={({ item }) => (
          <PepiteGridCard
            product={item}
            theme={theme}
            onPress={() => router.push(`/product/${item.id}`)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              Aucune pépite pour le moment. Revenez bientôt !
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { ...Typography.h3, flex: 1, textAlign: 'center' },

  subtitle: { ...Typography.caption, marginBottom: Spacing.md },

  tabsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  tabPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  tabText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    lineHeight: 16,
  },

  list: {
    padding: Spacing.lg,
    paddingTop: 0,
    gap: Spacing.md,
  },
  column: { gap: Spacing.md },

  card: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: { elevation: 3 },
    }),
  },
  imageWrap: {
    width: '100%',
    aspectRatio: 1.4,
    backgroundColor: '#F3F4F6',
    position: 'relative',
  },
  image: { width: '100%', height: '100%' },
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(212,160,23,0.92)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11,
    color: '#FFFFFF',
  },

  cardBody: {
    padding: 10,
    gap: 4,
  },
  cardTitle: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    lineHeight: 17,
  },
  cardPrice: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    lineHeight: 22,
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  sellerAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
  },
  sellerName: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
  },

  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  pill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  pillText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 10,
  },

  empty: {
    paddingVertical: 80,
    alignItems: 'center',
  },
  emptyText: {
    ...Typography.caption,
    textAlign: 'center',
  },
});
