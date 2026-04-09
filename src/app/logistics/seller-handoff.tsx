import React, { useEffect, useRef, useState } from 'react';
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
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { QRGenerator } from '@/components/logistics/QRGenerator';
import { mockHandoffTransaction } from '@/services/mock/handoffs';
import { mockHubs } from '@/services/mock/hubs';
import { haversineDistance, getProximityStatus, ProximityStatus } from '@/utils/haversine';
import { ToleranceWindow } from '@/components/logistics/ToleranceWindow';
import { useLogisticsStore } from '@/stores/useLogisticsStore';

function useWindowTimer(windowEnd: string) {
  const getRemaining = () =>
    Math.max(0, Math.floor((new Date(windowEnd).getTime() - Date.now()) / 1000));
  const [remaining, setRemaining] = useState(getRemaining());
  useEffect(() => {
    const id = setInterval(() => setRemaining(getRemaining()), 1000);
    return () => clearInterval(id);
  }, [windowEnd]);
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

const PROXIMITY_CONFIG = (theme: typeof Colors.light) => ({
  at_hub: {
    color: theme.success,
    text: 'Vous êtes au hub ✓',
  },
  nearby: {
    color: theme.warning,
    text: 'Vous êtes à proximité du hub',
  },
  far: {
    color: theme.error,
    text: 'Vous êtes trop loin du hub',
  },
});

export default function SellerHandoffScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handoff = mockHandoffTransaction;
  const hub = mockHubs.find((h) => h.id === handoff.originHubId) ?? mockHubs[0];
  const destHub = mockHubs.find((h) => h.id === handoff.destinationHubId);

  const [step, setStep] = useState(0);
  const [proximity, setProximity] = useState<ProximityStatus>('far');
  const [distanceStr, setDistanceStr] = useState('...');

  const windowTimer = useWindowTimer(handoff.pickupWindowEnd);

  // Initialize tolerance notifications
  const { initToleranceNotifications, toleranceNotifications, fireToleranceNotification, addFavoriteTransporter, removeFavoriteTransporter, isFavoriteTransporter } = useLogisticsStore();
  const [isFav, setIsFav] = useState(isFavoriteTransporter(handoff.transporterId));
  const favScale = useSharedValue(1);
  const favStyle = useAnimatedStyle(() => ({ transform: [{ scale: favScale.value }] }));
  const toggleFavorite = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    favScale.value = withSequence(withTiming(1.1, { duration: 120 }), withTiming(1.0, { duration: 120 }));
    if (isFav) { removeFavoriteTransporter(handoff.transporterId); setIsFav(false); }
    else { addFavoriteTransporter(handoff.transporterId); setIsFav(true); }
  };
  useEffect(() => {
    initToleranceNotifications(new Date(handoff.pickupWindowStart), hub.name);
  }, []);

  // Fire tolerance notifications at the right time (mock simulation)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      toleranceNotifications.forEach((n) => {
        if (!n.fired && now >= n.triggerAt.getTime()) {
          fireToleranceNotification(n.id);
          // In production this would trigger a real push notification
          if (__DEV__) {
            console.log(`[Tolerance] ${n.title}: ${n.body}`);
          }
        }
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [toleranceNotifications]);

  // Geo check
  useEffect(() => {
    (async () => {
      if (__DEV__) {
        setProximity('at_hub');
        setDistanceStr('0m');
        return;
      }
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      try {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const dist = haversineDistance(
          loc.coords.latitude,
          loc.coords.longitude,
          hub.coordinates.lat,
          hub.coordinates.lng,
        );
        setProximity(getProximityStatus(dist));
        setDistanceStr(dist < 1 ? `${Math.round(dist * 1000)}m` : `${dist.toFixed(1)}km`);
      } catch {
        setProximity('far');
      }
    })();
  }, []);

  // Pulsing dot for "waiting" state
  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.3, { duration: 700, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
    );
  }, []);
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  // DEV: simulate transporter scan after 3s when on step 1
  useEffect(() => {
    if (step !== 1 || !__DEV__) return;
    const t = setTimeout(async () => {
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
      setStep(2);
    }, 3000);
    return () => clearTimeout(t);
  }, [step]);

  const qrPayload = {
    transactionId: handoff.id,
    role: 'seller' as const,
    hubId: hub.id,
    timestamp: Date.now(),
    orderId: handoff.orderId,
  };

  const proxConfig = PROXIMITY_CONFIG(theme)[proximity];
  const canProceed = proximity === 'at_hub';

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
        <Text style={styles.headerTitle}>Remise du colis</Text>
        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>{step + 1}/3</Text>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Step 0: Navigate to hub ─────────────────────────────────── */}
        {step === 0 && (
          <Animated.View entering={FadeIn} style={styles.stepContainer}>
            <View style={styles.stepHeader}>
              <View style={[styles.stepDot, { backgroundColor: theme.primary }]}>
                <Text style={styles.stepDotText}>1</Text>
              </View>
              <Text style={[styles.stepTitle, { color: theme.text }]}>
                Rendez-vous au hub
              </Text>
            </View>

            {/* Hub card */}
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={[styles.hubIcon, { backgroundColor: `${theme.primary}12` }]}>
                <Feather name="map-pin" size={22} color={theme.primary} />
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={[styles.hubName, { color: theme.text }]}>{hub.name}</Text>
                <Text style={[styles.hubAddress, { color: theme.textSecondary }]}>
                  {hub.address}, {hub.city}
                </Text>
                <Text style={[styles.hubHours, { color: theme.textSecondary }]}>
                  {hub.operatingHours}
                </Text>
              </View>
            </View>

            {/* Tolerance window */}
            <ToleranceWindow
              referenceTime={new Date(handoff.pickupWindowStart)}
              role="seller"
            />

            {/* Geo status */}
            <View
              style={[
                styles.geoCard,
                { backgroundColor: `${proxConfig.color}10`, borderColor: `${proxConfig.color}30` },
              ]}
            >
              <Feather name="navigation" size={16} color={proxConfig.color} />
              <Text style={[styles.geoText, { color: proxConfig.color }]}>
                {proximity === 'far'
                  ? `📍 Vous êtes à ${distanceStr} du hub`
                  : proximity === 'nearby'
                  ? `📍 Vous êtes à ${distanceStr} du hub`
                  : `📍 ${proxConfig.text}`}
              </Text>
            </View>

            {/* Product reminder */}
            <View
              style={[
                styles.productCard,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <Image source={{ uri: handoff.productImage }} style={styles.productThumb} />
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={[styles.productName, { color: theme.text }]}>
                  {handoff.productName}
                </Text>
                <Text style={[styles.productPrice, { color: theme.primary }]}>
                  {handoff.price.toFixed(2)}€{' '}
                  <Text style={{ color: theme.textSecondary }}>
                    + {handoff.deliveryFee.toFixed(2)}€ livraison
                  </Text>
                </Text>
              </View>
            </View>

            {/* CTA */}
            <TouchableOpacity
              onPress={() => setStep(1)}
              disabled={!canProceed}
              style={{ opacity: canProceed ? 1 : 0.5 }}
            >
              <LinearGradient
                colors={[theme.primary, theme.primaryGradientEnd]}
                style={styles.primaryBtn}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Feather name="check-circle" size={18} color="#FFF" />
                <Text style={styles.primaryBtnText}>Je suis au hub</Text>
              </LinearGradient>
            </TouchableOpacity>

            {!canProceed && (
              <Text style={[styles.geoWarning, { color: theme.error }]}>
                Rendez-vous au hub pour valider la remise
              </Text>
            )}
          </Animated.View>
        )}

        {/* ── Step 1: Show QR ─────────────────────────────────────────── */}
        {step === 1 && (
          <Animated.View entering={FadeIn} style={styles.stepContainer}>
            <View style={styles.stepHeader}>
              <View style={[styles.stepDot, { backgroundColor: theme.primary }]}>
                <Text style={styles.stepDotText}>2</Text>
              </View>
              <Text style={[styles.stepTitle, { color: theme.text }]}>
                Présentez votre QR code au transporteur
              </Text>
            </View>

            {/* Transporter info */}
            <View
              style={[
                styles.card,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <Image source={{ uri: handoff.transporterAvatar }} style={styles.avatar} />
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={[styles.hubName, { color: theme.text }]}>
                  {handoff.transporterName}
                </Text>
                <Text style={[styles.hubAddress, { color: theme.textSecondary }]}>
                  {handoff.transporterVehicle}
                </Text>
              </View>
              <View
                style={[
                  styles.verifiedBadge,
                  { backgroundColor: `${theme.success}15` },
                ]}
              >
                <Feather name="shield" size={11} color={theme.success} />
                <Text style={[styles.verifiedText, { color: theme.success }]}>Vérifié</Text>
              </View>
            </View>

            <QRGenerator payload={qrPayload} />

            <Text style={[Typography.caption, { color: theme.textSecondary, textAlign: 'center' }]}>
              Le transporteur va scanner ce code pour confirmer la prise en charge
            </Text>

            {/* Waiting state */}
            <View style={styles.waitingRow}>
              <Animated.View
                style={[styles.pulseDot, { backgroundColor: theme.primary }, pulseStyle]}
              />
              <Text style={[styles.waitingText, { color: theme.textSecondary }]}>
                En attente du scan{__DEV__ ? ' (dev: auto dans 3s)' : '...'}
              </Text>
            </View>
          </Animated.View>
        )}

        {/* ── Step 2: Success ──────────────────────────────────────────── */}
        {step === 2 && (
          <Animated.View entering={FadeIn} style={[styles.stepContainer, styles.successContainer]}>
            <View
              style={[
                styles.successIconBig,
                { backgroundColor: `${theme.success}15` },
              ]}
            >
              <Feather name="package" size={52} color={theme.success} />
            </View>
            <Text style={[styles.successTitle, { color: theme.text }]}>Colis remis ✓</Text>
            <Text style={[styles.successSub, { color: theme.textSecondary }]}>
              Merci pour votre ponctualité. Votre colis est entre de bonnes mains !
            </Text>

            <View
              style={[
                styles.summaryCard,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
                  Transporteur
                </Text>
                <Text style={[styles.summaryValue, { color: theme.text }]}>
                  {handoff.transporterName}
                </Text>
              </View>
              <View style={[styles.divider, { backgroundColor: theme.border }]} />
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
                  Destination
                </Text>
                <Text style={[styles.summaryValue, { color: theme.text }]}>
                  {destHub?.city ?? '—'} · {destHub?.name ?? '—'}
                </Text>
              </View>
              <View style={[styles.divider, { backgroundColor: theme.border }]} />
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
                  Référence
                </Text>
                <Text style={[styles.summaryValue, { color: theme.text }]}>
                  #{handoff.id.replace(/[^A-Z0-9]/gi, '').slice(-8).toUpperCase()}
                </Text>
              </View>
            </View>

            {/* Favorite transporter button */}
            <Animated.View style={[{ width: '100%' }, favStyle]}>
              <TouchableOpacity
                onPress={toggleFavorite}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: Spacing.sm,
                  paddingVertical: Spacing.md,
                  borderRadius: BorderRadius.md,
                  borderWidth: 1.5,
                  borderColor: isFav ? theme.primary : theme.border,
                  backgroundColor: isFav ? `${theme.primary}08` : 'transparent',
                }}
              >
                <Feather name="star" size={16} color={isFav ? '#F59E0B' : theme.textSecondary} />
                <Text style={[Typography.button, { color: isFav ? theme.primary : theme.textSecondary }]}>
                  {isFav ? 'Transporteur favori' : 'Ajouter aux transporteurs favoris'}
                </Text>
              </TouchableOpacity>
            </Animated.View>

            <TouchableOpacity
              onPress={() => router.replace('/logistics/delivery-tracking')}
            >
              <LinearGradient
                colors={[theme.primary, theme.primaryGradientEnd]}
                style={styles.primaryBtn}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Feather name="truck" size={18} color="#FFF" />
                <Text style={styles.primaryBtnText}>Suivre la livraison</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

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
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { ...Typography.h3, color: '#FFF', flex: 1 },
  stepBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  stepBadgeText: { ...Typography.captionMedium, color: '#FFF' },

  body: { padding: Spacing.lg, paddingBottom: 40 },
  stepContainer: { gap: Spacing.lg },

  stepHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  stepDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotText: { ...Typography.captionMedium, color: '#FFF' },
  stepTitle: { ...Typography.h3, flex: 1 },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  hubIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hubName: { ...Typography.bodyMedium, fontFamily: 'Poppins_600SemiBold' },
  hubAddress: { ...Typography.caption },
  hubHours: { ...Typography.caption },

  timerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  timerWindow: { ...Typography.bodyMedium, fontFamily: 'Poppins_600SemiBold' },

  geoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  geoText: { ...Typography.bodyMedium },

  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  productThumb: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.sm,
    backgroundColor: '#E5E7EB',
  },
  productName: { ...Typography.bodyMedium },
  productPrice: { ...Typography.body, fontFamily: 'Poppins_600SemiBold' },

  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md + 2,
    borderRadius: BorderRadius.md,
  },
  primaryBtnText: { ...Typography.button, color: '#FFF' },

  geoWarning: { ...Typography.caption, textAlign: 'center', marginTop: -Spacing.sm },

  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#E5E7EB' },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  verifiedText: { ...Typography.captionMedium },

  waitingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  pulseDot: { width: 10, height: 10, borderRadius: 5 },
  waitingText: { ...Typography.body },

  // Success
  successContainer: { alignItems: 'center', paddingTop: Spacing.xl },
  successIconBig: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: { ...Typography.h1, textAlign: 'center' },
  successSub: { ...Typography.body, textAlign: 'center', maxWidth: 260 },

  summaryCard: {
    width: '100%',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  summaryLabel: { ...Typography.body },
  summaryValue: { ...Typography.bodyMedium, fontFamily: 'Poppins_600SemiBold' },
  divider: { height: 1 },
});
