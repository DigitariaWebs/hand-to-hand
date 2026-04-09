import React from "react";
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Colors } from "@/constants/Colors";
import { Typography } from "@/constants/Typography";
import { Spacing, BorderRadius } from "@/constants/Spacing";

// ── Mock data ─────────────────────────────────────────────────────────────

const TRANSACTIONS = [
  {
    id: "t1",
    type: "income" as const,
    description: "Vente — Veste en cuir vintage",
    amount: 85.0,
    date: "8 avr. 2026",
  },
  {
    id: "t2",
    type: "expense" as const,
    description: "Livraison — Nice → Marseille",
    amount: -4.5,
    date: "7 avr. 2026",
  },
  {
    id: "t3",
    type: "income" as const,
    description: "Vente — Sac à main Longchamp",
    amount: 45.0,
    date: "5 avr. 2026",
  },
  {
    id: "t4",
    type: "expense" as const,
    description: "Livraison — Cannes → Nice",
    amount: -3.0,
    date: "3 avr. 2026",
  },
  {
    id: "t5",
    type: "income" as const,
    description: "Vente — Baskets Nike Air Max 90",
    amount: 65.0,
    date: "1 avr. 2026",
  },
  {
    id: "t6",
    type: "expense" as const,
    description: "Frais de service — Commission",
    amount: -8.5,
    date: "30 mars 2026",
  },
];

// ── Main screen ───────────────────────────────────────────────────────────

export default function WalletScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const router = useRouter();

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
          Mon portefeuille
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Balance card */}
        <LinearGradient
          colors={[theme.primary, theme.primaryGradientEnd]}
          style={styles.balanceCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.balanceLabel}>Solde disponible</Text>
          <Text style={styles.balanceValue}>215.50 €</Text>
          <Text style={styles.balancePending}>
            En attente de libération: 45.00 €
          </Text>
        </LinearGradient>

        {/* Action buttons row */}
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
          >
            <Feather name="list" size={16} color={theme.primary} />
            <Text style={[styles.actionPillText, { color: theme.primary }]}>
              Historique
            </Text>
          </TouchableOpacity>
        </View>

        {/* Section: Prochaine libération */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Prochaine libération
        </Text>
        <View
          style={[
            styles.card,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <View style={styles.releaseHeader}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.releaseOrder, { color: theme.text }]}>
                Commande #HTH-0042 · 85.00€
              </Text>
              <Text
                style={[styles.releaseDate, { color: theme.textSecondary }]}
              >
                Libération prévue: 12 avr. 2026
              </Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: `${theme.warning}18` },
              ]}
            >
              <Text style={[styles.statusBadgeText, { color: theme.warning }]}>
                En attente de confirmation
              </Text>
            </View>
          </View>
        </View>

        {/* Section: Transactions récentes */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Transactions récentes
        </Text>
        <View
          style={[
            styles.card,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          {TRANSACTIONS.map((tx, index) => {
            const isIncome = tx.type === "income";
            const isLast = index === TRANSACTIONS.length - 1;

            return (
              <View
                key={tx.id}
                style={[
                  styles.txRow,
                  !isLast && {
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: theme.border,
                  },
                ]}
              >
                {/* Icon */}
                <View
                  style={[
                    styles.txIcon,
                    {
                      backgroundColor: isIncome
                        ? `${theme.success}15`
                        : `${theme.primary}12`,
                    },
                  ]}
                >
                  <Feather
                    name={isIncome ? "arrow-up-right" : "arrow-down-left"}
                    size={16}
                    color={isIncome ? theme.success : theme.primary}
                  />
                </View>

                {/* Description + date */}
                <View style={{ flex: 1 }}>
                  <Text
                    style={[styles.txDescription, { color: theme.text }]}
                    numberOfLines={1}
                  >
                    {tx.description}
                  </Text>
                  <Text
                    style={[styles.txDate, { color: theme.textSecondary }]}
                  >
                    {tx.date}
                  </Text>
                </View>

                {/* Amount */}
                <Text
                  style={[
                    styles.txAmount,
                    {
                      color: isIncome ? theme.success : theme.textSecondary,
                    },
                  ]}
                >
                  {isIncome ? "+" : ""}
                  {tx.amount.toFixed(2)}€
                </Text>
              </View>
            );
          })}
        </View>

        {/* Info card */}
        <View
          style={[
            styles.infoCard,
            { backgroundColor: `${theme.primary}08`, borderColor: `${theme.primary}20` },
          ]}
        >
          <Feather
            name="info"
            size={16}
            color={theme.primary}
            style={{ marginTop: 2 }}
          />
          <Text style={[styles.infoText, { color: theme.textSecondary }]}>
            Les fonds sont libérés après validation de la livraison par code
            OTP. Comptez 24 à 48h pour le virement.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { ...Typography.h3, flex: 1, textAlign: "center" },

  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 80,
  },

  // Balance card
  balanceCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    gap: Spacing.xs,
  },
  balanceLabel: {
    ...Typography.caption,
    color: "#FFFFFF",
    opacity: 0.85,
  },
  balanceValue: {
    fontFamily: "Poppins_700Bold",
    fontSize: 28,
    lineHeight: 36,
    color: "#FFFFFF",
  },
  balancePending: {
    ...Typography.caption,
    color: "#FFFFFF",
    opacity: 0.7,
    marginTop: Spacing.xs,
  },

  // Action pills
  actionsRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  actionPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
  },
  actionPillText: {
    ...Typography.button,
  },

  // Section title
  sectionTitle: {
    ...Typography.h3,
    marginTop: Spacing.xxl,
    marginBottom: Spacing.md,
  },

  // Card
  card: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: "hidden",
  },

  // Release card
  releaseHeader: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  releaseOrder: {
    ...Typography.bodyMedium,
    fontFamily: "Poppins_600SemiBold",
  },
  releaseDate: {
    ...Typography.caption,
    marginTop: Spacing.xs,
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  statusBadgeText: {
    ...Typography.captionMedium,
  },

  // Transaction row
  txRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  txIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  txDescription: {
    ...Typography.bodyMedium,
  },
  txDate: {
    ...Typography.caption,
    marginTop: 2,
  },
  txAmount: {
    ...Typography.bodyMedium,
    fontFamily: "Poppins_600SemiBold",
  },

  // Info card
  infoCard: {
    flexDirection: "row",
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
