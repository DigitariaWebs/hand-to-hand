import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { DELIVERY_LIMITS } from '@/constants/deliveryLimits';
import { useLogisticsStore } from '@/stores/useLogisticsStore';
import { mockFailedHandoffTransaction } from '@/services/mock/handoffs';
import { mockHubs } from '@/services/mock/hubs';

// ── Failure reason labels ──────────────────────────────────────────────────

const FAILURE_REASONS: Record<string, { icon: any; title: string; body: string }> = {
  buyer_no_show: {
    icon: 'map-pin',
    title: 'Absence au hub',
    body: 'L\'acheteur ne s\'est pas présenté au point de retrait dans le délai prévu.',
  },
  transporter_no_show: {
    icon: 'truck',
    title: 'Transporteur indisponible',
    body: 'Le transporteur n\'a pas pu effectuer la livraison. Ce n\'est pas de votre faute.',
  },
  package_damaged: {
    icon: 'package',
    title: 'Colis endommagé',
    body: 'Le colis a subi des dommages pendant le transport. Votre protection couvre ce cas.',
  },
  wrong_hub: {
    icon: 'map',
    title: 'Mauvais point de retrait',
    body: 'Le colis a été livré à un hub incorrect. Nous corrigeons la situation.',
  },
  other: {
    icon: 'alert-triangle',
    title: 'Problème rencontré',
    body: 'Un imprévu a empêché la livraison. Nous travaillons à une solution.',
  },
};

// ── Screen ────────────────────────────────────────────────────────────────

export default function DeliveryFailedScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const mission = useLogisticsStore((s) => s.mission);
  const handoff = mission?.handoff ?? mockFailedHandoffTransaction;
  const hub = mockHubs.find((h) => h.id === handoff.destinationHubId) ?? mockHubs[2];

  const lastAttempt = handoff.deliveryAttempts.find((a) => a.status === 'failed');
  const failureReason = lastAttempt?.failureReason ?? 'other';
  const reasonInfo = FAILURE_REASONS[failureReason] ?? FAILURE_REASONS.other;

  const attemptNum = handoff.currentAttempt;
  const maxAttempts = handoff.maxAttempts || DELIVERY_LIMITS.MAX_DELIVERY_ATTEMPTS;
  const canRetry = attemptNum < maxAttempts;

  const isBuyerFault = failureReason === 'buyer_no_show';

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <LinearGradient
        colors={[theme.warning, '#E08B00']}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Livraison non aboutie</Text>
        <View style={styles.attemptBadge}>
          <Text style={styles.attemptBadgeText}>
            Tentative {attemptNum}/{maxAttempts}
          </Text>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero illustration ──────────────────────────────────────── */}
        <Animated.View entering={FadeIn.duration(500)} style={styles.heroSection}>
          <View style={[styles.heroIcon, { backgroundColor: `${theme.warning}15` }]}>
            <Feather name="alert-triangle" size={48} color={theme.warning} />
          </View>
          <Text style={[styles.heroTitle, { color: theme.text }]}>
            Pas de panique !
          </Text>
          <Text style={[styles.heroSub, { color: theme.textSecondary }]}>
            {canRetry
              ? 'Nous avons une solution pour vous. Une nouvelle livraison peut être programmée.'
              : 'Toutes les tentatives de livraison ont été épuisées. Nous allons vous aider à résoudre la situation.'}
          </Text>
        </Animated.View>

        {/* ── Failure reason card ────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <View
            style={[
              styles.reasonCard,
              {
                backgroundColor: `${theme.warning}08`,
                borderColor: `${theme.warning}30`,
              },
            ]}
          >
            <View style={{ marginTop: 2 }}>
              <Feather name={reasonInfo.icon} size={28} color={theme.warning} />
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={[styles.reasonTitle, { color: theme.text }]}>
                {reasonInfo.title}
              </Text>
              <Text style={[styles.reasonBody, { color: theme.textSecondary }]}>
                {reasonInfo.body}
              </Text>
              {lastAttempt?.failureNote && (
                <Text style={[styles.reasonNote, { color: theme.textMuted }]}>
                  « {lastAttempt.failureNote} »
                </Text>
              )}
            </View>
          </View>
        </Animated.View>

        {/* ── Product card ───────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
          <View
            style={[
              styles.productCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <Image source={{ uri: handoff.productImage }} style={styles.productThumb} />
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={[styles.productName, { color: theme.text }]} numberOfLines={2}>
                {handoff.productName}
              </Text>
              <Text style={[styles.productPrice, { color: theme.primary }]}>
                {handoff.price.toFixed(2)}€
              </Text>
              {handoff.insuranceTier && (
                <View style={[styles.insurancePill, { backgroundColor: handoff.insuranceTier === 'premium' ? `${theme.gold}15` : `${theme.success}15` }]}>
                  <Feather name="shield" size={10} color={handoff.insuranceTier === 'premium' ? theme.gold : theme.success} />
                  <Text
                    style={[
                      styles.insurancePillText,
                      { color: handoff.insuranceTier === 'premium' ? theme.gold : theme.success },
                    ]}
                  >
                    Protection {handoff.insuranceTier === 'premium' ? 'Premium' : 'de base'}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </Animated.View>

        {/* ── Re-delivery fee notice ─────────────────────────────────── */}
        {canRetry && isBuyerFault && (
          <Animated.View entering={FadeInDown.delay(350).duration(400)}>
            <View
              style={[
                styles.feeCard,
                {
                  backgroundColor: `${theme.violet}08`,
                  borderColor: `${theme.violet}25`,
                },
              ]}
            >
              <Feather name="info" size={16} color={theme.violet} />
              <Text style={[styles.feeText, { color: theme.textSecondary }]}>
                Des frais de re-livraison de{' '}
                <Text style={{ fontFamily: 'Poppins_600SemiBold', color: theme.violet }}>
                  {DELIVERY_LIMITS.REDELIVERY_FEE_BUYER_FAULT.toFixed(2)}€
                </Text>{' '}
                s'appliquent en cas de non-présentation au hub.
              </Text>
            </View>
          </Animated.View>
        )}

        {/* ── Action buttons ─────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.actions}>
          {canRetry && (
            <>
              <TouchableOpacity
                onPress={() => router.push('/logistics/redelivery-schedule' as never)}
              >
                <LinearGradient
                  colors={[theme.primary, theme.primaryGradientEnd]}
                  style={styles.primaryBtn}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Feather name="refresh-cw" size={18} color="#FFF" />
                  <Text style={styles.primaryBtnText}>
                    Programmer une nouvelle livraison
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push('/logistics/select-hub')}
                style={[
                  styles.secondaryBtn,
                  { borderColor: theme.primary },
                ]}
              >
                <Feather name="map-pin" size={16} color={theme.primary} />
                <Text style={[styles.secondaryBtnText, { color: theme.primary }]}>
                  Choisir un autre hub
                </Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity
            style={[
              styles.secondaryBtn,
              { borderColor: theme.error },
            ]}
          >
            <Feather name="dollar-sign" size={16} color={theme.error} />
            <Text style={[styles.secondaryBtnText, { color: theme.error }]}>
              Demander un remboursement
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* ── Info card ──────────────────────────────────────────────── */}
        {canRetry && (
          <Animated.View entering={FadeInDown.delay(500).duration(400)}>
            <View
              style={[
                styles.infoCard,
                {
                  backgroundColor: `${theme.success}08`,
                  borderColor: `${theme.success}25`,
                },
              ]}
            >
              <Feather name="clock" size={16} color={theme.success} />
              <Text style={[styles.infoText, { color: theme.textSecondary }]}>
                La re-livraison est automatiquement programmée dans les{' '}
                <Text style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  {DELIVERY_LIMITS.REDELIVERY_WINDOW_HOURS}h
                </Text>{' '}
                suivantes. Vous recevrez une notification avec les détails.
              </Text>
            </View>
          </Animated.View>
        )}

        {/* ── Contact support ────────────────────────────────────────── */}
        <TouchableOpacity style={styles.helpRow}>
          <Feather name="headphones" size={16} color={theme.textSecondary} />
          <Text style={[styles.helpText, { color: theme.textSecondary }]}>
            Besoin d'aide ? Contactez le support
          </Text>
          <Feather name="chevron-right" size={14} color={theme.textSecondary} />
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { ...Typography.h3, color: '#FFF', flex: 1 },
  attemptBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  attemptBadgeText: { ...Typography.captionMedium, color: '#FFF' },

  body: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: 40 },

  // Hero
  heroSection: { alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.lg },
  heroIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: { ...Typography.h1, textAlign: 'center' },
  heroSub: { ...Typography.body, textAlign: 'center', maxWidth: 300 },

  // Reason card
  reasonCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  reasonEmoji: { fontSize: 28, marginTop: 2 },
  reasonTitle: { ...Typography.bodyMedium, fontFamily: 'Poppins_600SemiBold' },
  reasonBody: { ...Typography.caption },
  reasonNote: { ...Typography.caption, fontStyle: 'italic', marginTop: 4 },

  // Product card
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  productThumb: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.sm,
    backgroundColor: '#E5E7EB',
  },
  productName: { ...Typography.bodyMedium },
  productPrice: { ...Typography.bodyMedium, fontFamily: 'Poppins_600SemiBold' },
  insurancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  insurancePillText: { ...Typography.captionMedium, fontSize: 10 },

  // Fee card
  feeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  feeText: { ...Typography.caption, flex: 1 },

  // Actions
  actions: { gap: Spacing.md },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md + 2,
    borderRadius: BorderRadius.md,
  },
  primaryBtnText: { ...Typography.button, color: '#FFF' },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
  },
  secondaryBtnText: { ...Typography.button },

  // Info card
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  infoText: { ...Typography.caption, flex: 1 },

  // Help
  helpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    alignSelf: 'center',
  },
  helpText: { ...Typography.body },
});
