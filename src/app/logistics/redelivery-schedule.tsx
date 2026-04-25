import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { DELIVERY_LIMITS } from '@/constants/deliveryLimits';
import { useLogisticsStore } from '@/stores/useLogisticsStore';
import { mockHubs } from '@/services/mock/hubs';
import { formatPrice } from '@/utils';

// ── Time-slot generation ──────────────────────────────────────────────────

type TimeSlot = {
  id: string;
  label: string;
  sublabel: string;
  isoDate: string;
};

function generateTimeSlots(): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const now = new Date();

  // Generate slots for the next 2 days, every 3 hours between 8:00 and 20:00
  for (let dayOffset = 0; dayOffset < 2; dayOffset++) {
    const day = new Date(now);
    day.setDate(day.getDate() + dayOffset + 1); // start tomorrow

    const dayLabel = dayOffset === 0 ? 'Demain' : 'Après-demain';
    const dateStr = day.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });

    for (let hour = 8; hour <= 17; hour += 3) {
      const slotDate = new Date(day);
      slotDate.setHours(hour, 0, 0, 0);
      const endHour = hour + 2;

      slots.push({
        id: `slot-${dayOffset}-${hour}`,
        label: `${dayLabel}, ${dateStr}`,
        sublabel: `${String(hour).padStart(2, '0')}:00 – ${String(endHour).padStart(2, '0')}:00`,
        isoDate: slotDate.toISOString(),
      });
    }
  }

  return slots;
}

// ── Screen ────────────────────────────────────────────────────────────────

export default function RedeliveryScheduleScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const mission = useLogisticsStore((s) => s.mission);
  const scheduleRedelivery = useLogisticsStore((s) => s.scheduleRedelivery);
  const handoff = mission?.handoff;

  const lastFailedAttempt = handoff?.deliveryAttempts.find((a) => a.status === 'failed');
  const isBuyerFault = lastFailedAttempt?.failureReason === 'buyer_no_show';

  const currentHub = mockHubs.find((h) => h.id === handoff?.destinationHubId) ?? mockHubs[2];

  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [selectedHubId, setSelectedHubId] = useState(currentHub.id);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const timeSlots = useMemo(() => generateTimeSlots(), []);
  const selectedSlot = timeSlots.find((s) => s.id === selectedSlotId);

  const canConfirm = selectedSlotId !== null;

  const handleConfirm = async () => {
    if (!selectedSlot) return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}

    scheduleRedelivery(selectedHubId, selectedSlot.isoDate);
    setIsConfirmed(true);
  };

  // ── Success state ──────────────────────────────────────────────────────

  if (isConfirmed) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.headerSimple, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity onPress={() => router.replace('/')} style={styles.closeBtn}>
            <Feather name="x" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>
        <Animated.View entering={FadeIn.duration(500)} style={styles.successContainer}>
          <View style={[styles.successIcon, { backgroundColor: `${theme.success}15` }]}>
            <Feather name="calendar" size={48} color={theme.success} />
          </View>
          <Text style={[styles.successTitle, { color: theme.text }]}>
            Re-livraison programmée ✓
          </Text>
          <Text style={[styles.successSub, { color: theme.textSecondary }]}>
            Votre nouvelle livraison est prévue le{'\n'}
            <Text style={{ fontFamily: 'Poppins_600SemiBold', color: theme.text }}>
              {selectedSlot?.label} · {selectedSlot?.sublabel}
            </Text>
          </Text>

          <View
            style={[
              styles.successCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <View style={styles.successRow}>
              <Feather name="map-pin" size={14} color={theme.primary} />
              <Text style={[styles.successLabel, { color: theme.textSecondary }]}>Hub</Text>
              <Text style={[styles.successValue, { color: theme.text }]}>
                {currentHub.name}
              </Text>
            </View>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <View style={styles.successRow}>
              <Feather name="truck" size={14} color={theme.primary} />
              <Text style={[styles.successLabel, { color: theme.textSecondary }]}>
                Transporteur
              </Text>
              <Text style={[styles.successValue, { color: theme.text }]}>
                {handoff?.transporterName ?? 'À assigner'}
              </Text>
            </View>
            {isBuyerFault && (
              <>
                <View style={[styles.divider, { backgroundColor: theme.border }]} />
                <View style={styles.successRow}>
                  <Feather name="credit-card" size={14} color={theme.violet} />
                  <Text style={[styles.successLabel, { color: theme.textSecondary }]}>
                    Frais re-livraison
                  </Text>
                  <Text style={[styles.successValue, { color: theme.violet }]}>
                    {formatPrice(DELIVERY_LIMITS.REDELIVERY_FEE_BUYER_FAULT)}
                  </Text>
                </View>
              </>
            )}
          </View>

          <View style={[styles.infoCard, { backgroundColor: `${theme.primary}08`, borderColor: `${theme.primary}25` }]}>
            <Feather name="bell" size={14} color={theme.primary} />
            <Text style={[styles.infoText, { color: theme.textSecondary }]}>
              Vous recevrez une notification de rappel 1 heure avant la livraison.
            </Text>
          </View>

          <TouchableOpacity onPress={() => router.replace('/')}>
            <LinearGradient
              colors={[theme.primary, theme.primaryGradientEnd]}
              style={styles.primaryBtn}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Feather name="home" size={18} color="#FFF" />
              <Text style={styles.primaryBtnText}>Retour à l'accueil</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  // ── Main scheduling view ───────────────────────────────────────────────

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <LinearGradient
        colors={[theme.primary, theme.primaryGradientEnd]}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nouvelle livraison</Text>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hub selection ───────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Point de retrait
          </Text>
          <View
            style={[
              styles.hubCard,
              {
                backgroundColor: theme.surface,
                borderColor: theme.primary,
                borderWidth: 2,
              },
            ]}
          >
            <View style={[styles.hubIcon, { backgroundColor: `${theme.primary}12` }]}>
              <Feather name="map-pin" size={20} color={theme.primary} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[styles.hubName, { color: theme.text }]}>
                {currentHub.name}
              </Text>
              <Text style={[styles.hubAddress, { color: theme.textSecondary }]}>
                {currentHub.address}, {currentHub.city}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/logistics/select-hub')}
              style={[styles.changeBtn, { borderColor: theme.primary }]}
            >
              <Feather name="edit-2" size={12} color={theme.primary} />
              <Text style={[styles.changeBtnText, { color: theme.primary }]}>
                Modifier
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* ── Time slot selection ─────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Choisissez un créneau
          </Text>
          <Text style={[styles.sectionSub, { color: theme.textSecondary }]}>
            Sélectionnez l'horaire qui vous convient le mieux
          </Text>

          <View style={styles.slotsGrid}>
            {timeSlots.map((slot) => {
              const isSelected = selectedSlotId === slot.id;
              return (
                <TouchableOpacity
                  key={slot.id}
                  style={[
                    styles.slotCard,
                    {
                      backgroundColor: isSelected ? `${theme.primary}10` : theme.surface,
                      borderColor: isSelected ? theme.primary : theme.border,
                      borderWidth: isSelected ? 2 : 1,
                    },
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    setSelectedSlotId(slot.id);
                  }}
                  activeOpacity={0.8}
                >
                  <View style={styles.slotTop}>
                    <Feather name="calendar" size={14} color={isSelected ? theme.primary : theme.textSecondary} />
                    <Text
                      style={[
                        styles.slotDay,
                        { color: isSelected ? theme.primary : theme.text },
                      ]}
                    >
                      {slot.label}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.slotTime,
                      { color: isSelected ? theme.primary : theme.text },
                    ]}
                  >
                    {slot.sublabel}
                  </Text>
                  {isSelected && (
                    <View style={[styles.checkCircle, { backgroundColor: theme.primary }]}>
                      <Feather name="check" size={12} color="#FFF" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>

        {/* ── Fee notice ──────────────────────────────────────────────── */}
        {isBuyerFault && (
          <Animated.View entering={FadeInDown.delay(300).duration(400)}>
            <View
              style={[
                styles.feeNotice,
                {
                  backgroundColor: `${theme.warning}08`,
                  borderColor: `${theme.warning}25`,
                },
              ]}
            >
              <Feather name="alert-circle" size={14} color={theme.warning} />
              <Text style={[styles.feeText, { color: theme.textSecondary }]}>
                Frais de re-livraison :{' '}
                <Text style={{ fontFamily: 'Poppins_600SemiBold', color: theme.warning }}>
                  {formatPrice(DELIVERY_LIMITS.REDELIVERY_FEE_BUYER_FAULT)}
                </Text>
              </Text>
            </View>
          </Animated.View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Sticky confirm button ─────────────────────────────────────── */}
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: theme.surface,
            borderTopColor: theme.border,
            paddingBottom: insets.bottom + 8,
          },
        ]}
      >
        <TouchableOpacity
          onPress={handleConfirm}
          disabled={!canConfirm}
          style={{ opacity: canConfirm ? 1 : 0.5 }}
        >
          <LinearGradient
            colors={canConfirm ? [theme.primary, theme.primaryGradientEnd] : [theme.border, theme.border]}
            style={styles.primaryBtn}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Feather name="check-circle" size={18} color="#FFF" />
            <Text style={styles.primaryBtnText}>Confirmer la re-livraison</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
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
  headerSimple: {
    paddingHorizontal: Spacing.lg,
    alignItems: 'flex-end',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { ...Typography.h3, color: '#FFF', flex: 1 },

  body: { padding: Spacing.lg, gap: Spacing.xl, paddingBottom: 60 },

  sectionTitle: { ...Typography.h3, marginBottom: Spacing.xs },
  sectionSub: { ...Typography.caption, marginBottom: Spacing.sm },

  // Hub card
  hubCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  hubIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hubName: { ...Typography.bodyMedium, fontFamily: 'Poppins_600SemiBold' },
  hubAddress: { ...Typography.caption },
  changeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  changeBtnText: { ...Typography.captionMedium },

  // Time slots
  slotsGrid: { gap: Spacing.sm },
  slotCard: {
    flexDirection: 'column',
    gap: 4,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    position: 'relative',
  },
  slotTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  slotDay: { ...Typography.captionMedium },
  slotTime: { ...Typography.bodyMedium, fontFamily: 'Poppins_600SemiBold', paddingLeft: 22 },
  checkCircle: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Fee notice
  feeNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  feeText: { ...Typography.caption, flex: 1 },

  // Info card
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    width: '100%',
  },
  infoText: { ...Typography.caption, flex: 1 },

  // Bottom bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
  },

  // Buttons
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md + 2,
    borderRadius: BorderRadius.md,
  },
  primaryBtnText: { ...Typography.button, color: '#FFF' },

  // Divider
  divider: { height: 1 },

  // Success state
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  successIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: { ...Typography.h1, textAlign: 'center' },
  successSub: { ...Typography.body, textAlign: 'center', maxWidth: 280 },
  successCard: {
    width: '100%',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  successRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  successLabel: { ...Typography.caption, flex: 1 },
  successValue: { ...Typography.bodyMedium, fontFamily: 'Poppins_600SemiBold' },
});
