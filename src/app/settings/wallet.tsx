import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { useWalletStore } from '@/stores/useWalletStore';
import type {
  WalletFilter,
  WalletTransaction,
  TransactionType,
} from '@/types/wallet';
import { NumberTicker } from '@/components/ui/NumberTicker';

const FILTER_TABS: { key: WalletFilter; label: string }[] = [
  { key: 'all', label: 'Tout' },
  { key: 'sales', label: 'Ventes' },
  { key: 'purchases', label: 'Achats' },
  { key: 'deliveries', label: 'Livraisons' },
];

type TxStyleToken = {
  bgCircle: string;
  textColor: string;
  borderColor: string;
  icon: keyof typeof Feather.glyphMap;
};

function getTxStyle(type: TransactionType, theme: typeof Colors.light): TxStyleToken {
  switch (type) {
    case 'sale':
      return {
        bgCircle: theme.successLight,
        textColor: theme.success,
        borderColor: theme.success,
        icon: 'arrow-up-right',
      };
    case 'purchase':
    case 'refund':
      return {
        bgCircle: theme.errorLight,
        textColor: theme.error,
        borderColor: theme.error,
        icon: 'arrow-down-left',
      };
    case 'delivery_fee':
      return {
        bgCircle: theme.violetLight,
        textColor: theme.violet,
        borderColor: theme.violet,
        icon: 'truck',
      };
    case 'delivery_earning':
      return {
        bgCircle: theme.goldLight,
        textColor: theme.gold,
        borderColor: theme.gold,
        icon: 'package',
      };
    case 'withdrawal':
      return {
        bgCircle: theme.surfaceElevated,
        textColor: theme.textSecondary,
        borderColor: theme.border,
        icon: 'download',
      };
  }
}

function matchesFilter(tx: WalletTransaction, filter: WalletFilter): boolean {
  if (filter === 'all') return true;
  if (filter === 'sales') return tx.type === 'sale';
  if (filter === 'purchases') return tx.type === 'purchase' || tx.type === 'refund';
  if (filter === 'deliveries')
    return tx.type === 'delivery_fee' || tx.type === 'delivery_earning';
  return true;
}

function formatShortDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

function formatAmount(amount: number): string {
  const abs = Math.abs(amount).toFixed(2).replace('.', ',');
  const sign = amount > 0 ? '+' : '-';
  return `${sign}${abs} €`;
}

export default function WalletScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { balance, pendingBalance, transactions, filter, setFilter } =
    useWalletStore();

  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    translateY.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
    );
    scale.value = withRepeat(
      withSequence(
        withTiming(1.015, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
    );
  }, []);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  const filteredTx = useMemo(
    () => transactions.filter((t) => matchesFilter(t, filter)),
    [transactions, filter],
  );

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
          Mon portefeuille
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroWrap}>
          <LinearGradient
            colors={[theme.primary, theme.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.hero,
              Platform.select({
                ios: {
                  shadowColor: theme.primary,
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.4,
                  shadowRadius: 24,
                },
                android: { elevation: 12 },
              }),
            ]}
          >
            <LinearGradient
              colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0)']}
              start={{ x: 1, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />
            <View style={styles.heroContent}>
              <Text style={styles.heroLabel}>Solde disponible</Text>
              <Animated.View style={floatStyle}>
                <NumberTicker
                  value={balance}
                  style={styles.heroAmount}
                  decimals={2}
                  currency="€"
                />
              </Animated.View>
              {pendingBalance > 0 && (
                <Text style={styles.heroPending}>
                  En attente : {pendingBalance.toFixed(2).replace('.', ',')} €
                </Text>
              )}
            </View>
          </LinearGradient>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionPill, { borderColor: theme.primary }]}
            activeOpacity={0.7}
          >
            <Feather name="download" size={16} color={theme.primary} />
            <Text style={[styles.actionPillText, { color: theme.primary }]}>
              Retirer
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionPill, { borderColor: theme.primary }]}
            activeOpacity={0.7}
            onPress={() => router.push('/settings/transactions' as any)}
          >
            <Feather name="list" size={16} color={theme.primary} />
            <Text style={[styles.actionPillText, { color: theme.primary }]}>
              Détails
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.historyHeader}>
          <Text style={[styles.historyTitle, { color: theme.text }]}>Historique</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {FILTER_TABS.map((tab) => {
            const active = tab.key === filter;
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setFilter(tab.key)}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: active ? theme.primary : theme.surface,
                    borderColor: active ? theme.primary : theme.border,
                  },
                ]}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.filterText,
                    { color: active ? '#FFFFFF' : theme.textSecondary },
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.txList}>
          {filteredTx.length === 0 ? (
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              Aucune transaction pour ce filtre.
            </Text>
          ) : (
            filteredTx.map((tx) => {
              const tokens = getTxStyle(tx.type, theme);
              return (
                <View
                  key={tx.id}
                  style={[
                    styles.txCard,
                    {
                      backgroundColor: theme.surface,
                      borderLeftColor: tokens.borderColor,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.txIcon,
                      { backgroundColor: tokens.bgCircle },
                    ]}
                  >
                    <Feather name={tokens.icon} size={16} color={tokens.textColor} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[styles.txLabel, { color: theme.text }]}
                      numberOfLines={1}
                    >
                      {tx.label}
                    </Text>
                    {tx.subtitle && (
                      <Text
                        style={[styles.txSubtitle, { color: theme.textSecondary }]}
                        numberOfLines={1}
                      >
                        {tx.subtitle}
                      </Text>
                    )}
                    <Text style={[styles.txDate, { color: theme.textMuted }]}>
                      {formatShortDate(tx.date)}
                    </Text>
                  </View>
                  <Text style={[styles.txAmount, { color: tokens.textColor }]}>
                    {formatAmount(tx.amount)}
                  </Text>
                </View>
              );
            })
          )}
        </View>

        <View
          style={[
            styles.infoCard,
            {
              backgroundColor: `${theme.primary}08`,
              borderColor: `${theme.primary}20`,
            },
          ]}
        >
          <Feather
            name="info"
            size={16}
            color={theme.primary}
            style={{ marginTop: 2 }}
          />
          <Text style={[styles.infoText, { color: theme.textSecondary }]}>
            Les fonds sont libérés après validation de la livraison par scan QR.
            Comptez 24 à 48h pour le virement.
          </Text>
        </View>
      </ScrollView>
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

  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 80,
  },

  heroWrap: {
    borderRadius: 24,
  },
  hero: {
    borderRadius: 24,
    height: 200,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  heroLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  heroAmount: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 44,
    lineHeight: 54,
    color: '#FFFFFF',
  },
  heroPending: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 4,
  },

  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
  actionPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
  },
  actionPillText: { ...Typography.button },

  historyHeader: {
    marginTop: Spacing.xxl,
    marginBottom: Spacing.md,
  },
  historyTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 18,
    lineHeight: 24,
  },

  filterRow: {
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
    paddingRight: Spacing.md,
  },
  filterPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  filterText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    lineHeight: 16,
  },

  txList: {
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  txCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderLeftWidth: 3,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 3,
      },
      android: { elevation: 2 },
    }),
  },
  txIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txLabel: {
    ...Typography.bodyMedium,
    fontFamily: 'Poppins_600SemiBold',
  },
  txSubtitle: {
    ...Typography.caption,
    marginTop: 1,
  },
  txDate: {
    ...Typography.caption,
    fontSize: 11,
    marginTop: 2,
  },
  txAmount: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    lineHeight: 22,
  },

  emptyText: {
    ...Typography.caption,
    textAlign: 'center',
    paddingVertical: Spacing.xl,
  },

  infoCard: {
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginTop: Spacing.xxl,
  },
  infoText: {
    ...Typography.caption,
    flex: 1,
    lineHeight: 18,
  },
});
