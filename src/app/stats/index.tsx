import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { currentMockUser } from '@/services/mock/users';

const SW = Dimensions.get('window').width;

// ── Mock data ──────────────────────────────────────────────────────────────

const MONTHLY_DATA = [
  { month: 'Nov', value: 12 },
  { month: 'Déc', value: 18 },
  { month: 'Jan', value: 15 },
  { month: 'Fév', value: 22 },
  { month: 'Mar', value: 28 },
  { month: 'Avr', value: 19 },
];

const MAX_BAR_VALUE = Math.max(...MONTHLY_DATA.map((d) => d.value));
const BAR_MAX_HEIGHT = 120;

// ── Main screen ────────────────────────────────────────────────────────────

export default function StatsIndexScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const user = currentMockUser;

  const summaryCards: {
    label: string;
    value: string;
    color: string;
    icon: keyof typeof Feather.glyphMap;
  }[] = [
    {
      label: 'Total ventes',
      value: String(user.totalSales),
      color: '#14248A',
      icon: 'shopping-bag',
    },
    {
      label: 'Total achats',
      value: String(user.totalPurchases),
      color: '#10B981',
      icon: 'shopping-cart',
    },
    {
      label: 'Note moyenne',
      value: String(user.rating),
      color: '#F59E0B',
      icon: 'star',
    },
    {
      label: 'Avis reçus',
      value: String(user.reviewCount),
      color: '#8B5CF6',
      icon: 'message-square',
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
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
          Statistiques
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 32 },
        ]}
      >
        {/* ── Summary cards (2x2) ────────────────────────────────────────── */}
        <View style={styles.summaryGrid}>
          {summaryCards.map((card) => (
            <View
              key={card.label}
              style={[
                styles.summaryCard,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
            >
              <View
                style={[
                  styles.summaryIcon,
                  { backgroundColor: `${card.color}15` },
                ]}
              >
                <Feather name={card.icon} size={18} color={card.color} />
              </View>
              <Text style={[styles.summaryValue, { color: card.color }]}>
                {card.value}
              </Text>
              <Text
                style={[styles.summaryLabel, { color: theme.textSecondary }]}
              >
                {card.label}
              </Text>
            </View>
          ))}
        </View>

        {/* ── Activité récente (bar chart) ───────────────────────────────── */}
        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            {"Activité récente"}
          </Text>
          <Text
            style={[styles.sectionSubtitle, { color: theme.textSecondary }]}
          >
            Transactions par mois (6 derniers mois)
          </Text>

          <View style={styles.chartContainer}>
            {MONTHLY_DATA.map((item, index) => {
              const barHeight = (item.value / MAX_BAR_VALUE) * BAR_MAX_HEIGHT;
              const barColor = index % 2 === 0 ? '#14248A' : '#10B981';

              return (
                <View key={item.month} style={styles.barWrapper}>
                  <Text
                    style={[styles.barValue, { color: theme.text }]}
                  >
                    {item.value}
                  </Text>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: barHeight,
                        backgroundColor: barColor,
                      },
                    ]}
                  />
                  <Text
                    style={[
                      styles.barLabel,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {item.month}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* ── Répartition ────────────────────────────────────────────────── */}
        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Répartition
          </Text>

          <View style={styles.distributionRow}>
            <View style={[styles.dot, { backgroundColor: '#10B981' }]} />
            <Text style={[styles.distributionLabel, { color: theme.text }]}>
              Ventes réussies
            </Text>
            <Text
              style={[
                styles.distributionValue,
                { color: theme.text },
              ]}
            >
              85
            </Text>
            <View
              style={[
                styles.percentBadge,
                { backgroundColor: '#10B98115' },
              ]}
            >
              <Text style={[styles.percentText, { color: '#10B981' }]}>
                96%
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.divider,
              { backgroundColor: theme.border },
            ]}
          />

          <View style={styles.distributionRow}>
            <View style={[styles.dot, { backgroundColor: '#EF4444' }]} />
            <Text style={[styles.distributionLabel, { color: theme.text }]}>
              Annulées
            </Text>
            <Text
              style={[
                styles.distributionValue,
                { color: theme.text },
              ]}
            >
              4
            </Text>
            <View
              style={[
                styles.percentBadge,
                { backgroundColor: '#EF444415' },
              ]}
            >
              <Text style={[styles.percentText, { color: '#EF4444' }]}>
                4%
              </Text>
            </View>
          </View>
        </View>

        {/* ── Livraison Hand to Hand ─────────────────────────────────────── */}
        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Livraison Hand to Hand
          </Text>

          <View style={styles.deliveryRow}>
            <View
              style={[
                styles.deliveryIcon,
                { backgroundColor: `${theme.primary}12` },
              ]}
            >
              <Feather name="truck" size={16} color={theme.primary} />
            </View>
            <Text
              style={[styles.deliveryLabel, { color: theme.textSecondary }]}
            >
              Livraisons effectuées
            </Text>
            <Text style={[styles.deliveryValue, { color: theme.text }]}>
              23
            </Text>
          </View>

          <View
            style={[
              styles.divider,
              { backgroundColor: theme.border },
            ]}
          />

          <View style={styles.deliveryRow}>
            <View
              style={[
                styles.deliveryIcon,
                { backgroundColor: '#10B98112' },
              ]}
            >
              <Feather name="dollar-sign" size={16} color="#10B981" />
            </View>
            <Text
              style={[styles.deliveryLabel, { color: theme.textSecondary }]}
            >
              Gains transporteur
            </Text>
            <Text style={[styles.deliveryValue, { color: '#10B981' }]}>
              {"115.50 €"}
            </Text>
          </View>

          <View
            style={[
              styles.divider,
              { backgroundColor: theme.border },
            ]}
          />

          <View style={styles.deliveryRow}>
            <View
              style={[
                styles.deliveryIcon,
                { backgroundColor: '#F59E0B12' },
              ]}
            >
              <Feather name="star" size={16} color="#F59E0B" />
            </View>
            <Text
              style={[styles.deliveryLabel, { color: theme.textSecondary }]}
            >
              Note transporteur
            </Text>
            <Text style={[styles.deliveryValue, { color: '#F59E0B' }]}>
              4.9
            </Text>
          </View>
        </View>

        {/* ── Membre depuis ──────────────────────────────────────────────── */}
        <View
          style={[
            styles.memberCard,
            {
              backgroundColor: `${theme.primary}08`,
              borderColor: `${theme.primary}20`,
            },
          ]}
        >
          <Feather
            name="calendar"
            size={16}
            color={theme.primary}
            style={{ marginTop: 1 }}
          />
          <Text style={[styles.memberText, { color: theme.textSecondary }]}>
            {"Membre depuis "}
            <Text
              style={{
                fontFamily: 'Poppins_600SemiBold',
                color: theme.text,
              }}
            >
              {"mars 2023"}
            </Text>
            {" · "}
            <Text
              style={{
                fontFamily: 'Poppins_600SemiBold',
                color: theme.text,
              }}
            >
              {user.location.city}
            </Text>
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────

const CARD_W = (SW - Spacing.lg * 2 - Spacing.sm) / 2;

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
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
    gap: Spacing.md,
  },

  // Summary grid
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  summaryCard: {
    width: CARD_W,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.xs,
    alignItems: 'flex-start',
  },
  summaryIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  summaryValue: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 22,
    lineHeight: 28,
  },
  summaryLabel: { ...Typography.caption },

  // Section card
  sectionCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.bodyMedium,
    fontFamily: 'Poppins_600SemiBold',
  },
  sectionSubtitle: { ...Typography.caption },

  // Bar chart
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: BAR_MAX_HEIGHT + 48,
    marginTop: Spacing.sm,
    paddingTop: Spacing.xl,
  },
  barWrapper: {
    alignItems: 'center',
    gap: Spacing.xs,
    flex: 1,
  },
  bar: {
    width: 28,
    borderRadius: 6,
  },
  barValue: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11,
    lineHeight: 14,
  },
  barLabel: {
    ...Typography.caption,
    fontSize: 10,
  },

  // Distribution
  distributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  distributionLabel: {
    ...Typography.bodyMedium,
    flex: 1,
  },
  distributionValue: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    lineHeight: 20,
  },
  percentBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    marginLeft: Spacing.xs,
  },
  percentText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11,
    lineHeight: 15,
  },

  divider: {
    height: StyleSheet.hairlineWidth,
  },

  // Delivery
  deliveryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  deliveryIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deliveryLabel: {
    ...Typography.bodyMedium,
    flex: 1,
  },
  deliveryValue: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    lineHeight: 20,
  },

  // Member since
  memberCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  memberText: {
    ...Typography.body,
    flex: 1,
    lineHeight: 21,
  },
});
