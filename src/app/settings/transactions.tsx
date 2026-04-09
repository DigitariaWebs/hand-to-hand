import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing, BorderRadius } from '@/constants/Spacing';

type TransactionType = 'achat' | 'vente' | 'livraison';

type Transaction = {
  id: string;
  type: TransactionType;
  description: string;
  amount: string;
  date: string;
};

const FILTERS = ['Toutes', 'Achats', 'Ventes', 'Livraisons'] as const;

const TRANSACTIONS: Transaction[] = [
  { id: '1', type: 'achat', description: "Achat — Veste en cuir", amount: "-85 €", date: "5 avr. 2026" },
  { id: '2', type: 'vente', description: "Vente — MacBook Air", amount: "+450 €", date: "3 avr. 2026" },
  { id: '3', type: 'livraison', description: "Livraison — Nice → Marseille", amount: "+4,50 €", date: "2 avr. 2026" },
  { id: '4', type: 'achat', description: "Achat — Sneakers Nike", amount: "-65 €", date: "30 mars 2026" },
  { id: '5', type: 'vente', description: "Vente — Vélo électrique", amount: "+320 €", date: "28 mars 2026" },
  { id: '6', type: 'livraison', description: "Livraison — Cannes → Nice", amount: "+3,00 €", date: "25 mars 2026" },
  { id: '7', type: 'achat', description: "Achat — Livre de cuisine", amount: "-12 €", date: "22 mars 2026" },
  { id: '8', type: 'vente', description: "Vente — Sac à main Zara", amount: "+35 €", date: "20 mars 2026" },
];

const FILTER_MAP: Record<string, TransactionType | null> = {
  Toutes: null,
  Achats: 'achat',
  Ventes: 'vente',
  Livraisons: 'livraison',
};

const ICON_MAP: Record<TransactionType, { name: keyof typeof Feather.glyphMap; color: string }> = {
  achat: { name: 'arrow-down-left', color: Colors.light.error },
  vente: { name: 'arrow-up-right', color: Colors.light.success },
  livraison: { name: 'truck', color: Colors.light.primary },
};

export default function TransactionsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<string>('Toutes');

  const filtered = FILTER_MAP[activeFilter]
    ? TRANSACTIONS.filter((t) => t.type === FILTER_MAP[activeFilter])
    : TRANSACTIONS;

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
          Historique des transactions
        </Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Filter chips */}
      <View style={styles.filtersRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersContent}>
          {FILTERS.map((f) => {
            const isActive = activeFilter === f;
            return (
              <TouchableOpacity
                key={f}
                style={[
                  styles.chip,
                  {
                    backgroundColor: isActive ? theme.primary : theme.surface,
                    borderColor: isActive ? theme.primary : theme.border,
                  },
                ]}
                onPress={() => setActiveFilter(f)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: isActive ? '#FFFFFF' : theme.textSecondary },
                  ]}
                >
                  {f}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {filtered.map((tx, index) => {
          const icon = ICON_MAP[tx.type];
          const isPositive = tx.amount.startsWith('+');
          return (
            <View
              key={tx.id}
              style={[
                styles.txRow,
                index < filtered.length - 1 && {
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: theme.border,
                },
              ]}
            >
              <View style={[styles.txIcon, { backgroundColor: `${icon.color}12` }]}>
                <Feather name={icon.name} size={18} color={icon.color} />
              </View>
              <View style={styles.txInfo}>
                <Text style={[styles.txDesc, { color: theme.text }]} numberOfLines={1}>
                  {tx.description}
                </Text>
                <Text style={[styles.txDate, { color: theme.textSecondary }]}>
                  {tx.date}
                </Text>
              </View>
              <Text
                style={[
                  styles.txAmount,
                  { color: isPositive ? theme.success : theme.error },
                ]}
              >
                {tx.amount}
              </Text>
            </View>
          );
        })}
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

  filtersRow: {
    paddingVertical: Spacing.md,
  },
  filtersContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  chipText: {
    ...Typography.captionMedium,
  },

  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100,
  },

  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
  },
  txIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txInfo: {
    flex: 1,
    gap: 2,
  },
  txDesc: {
    ...Typography.bodyMedium,
  },
  txDate: {
    ...Typography.caption,
  },
  txAmount: {
    ...Typography.bodyMedium,
    fontFamily: 'Poppins_600SemiBold',
  },
});
