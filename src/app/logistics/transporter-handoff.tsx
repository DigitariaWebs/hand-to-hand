import React, { useEffect, useState } from 'react';
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
import { QRScanner } from '@/components/logistics/QRScanner';
import { mockHandoffTransaction } from '@/services/mock/handoffs';
import { mockHubs } from '@/services/mock/hubs';
import { haversineDistance, getProximityStatus, ProximityStatus } from '@/utils/haversine';

type Phase = 'pickup' | 'delivery';

function useGeoCheck(hubLat: number, hubLng: number) {
  const [proximity, setProximity] = useState<ProximityStatus>('far');
  const [distanceStr, setDistanceStr] = useState('...');

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
          hubLat,
          hubLng,
        );
        setProximity(getProximityStatus(dist));
        setDistanceStr(dist < 1 ? `${Math.round(dist * 1000)}m` : `${dist.toFixed(1)}km`);
      } catch {
        setProximity('far');
      }
    })();
  }, [hubLat, hubLng]);

  return { proximity, distanceStr };
}

export default function TransporterHandoffScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handoff = mockHandoffTransaction;
  const originHub = mockHubs.find((h) => h.id === handoff.originHubId) ?? mockHubs[0];
  const destHub = mockHubs.find((h) => h.id === handoff.destinationHubId) ?? mockHubs[2];

  const [phase, setPhase] = useState<Phase>('pickup');
  const [step, setStep] = useState(0);
  const [scannerVisible, setScannerVisible] = useState(false);

  const activeHub = phase === 'pickup' ? originHub : destHub;
  const { proximity, distanceStr } = useGeoCheck(
    activeHub.coordinates.lat,
    activeHub.coordinates.lng,
  );

  // Pulsing dot
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

  // DEV: auto-advance scan success after 3s in delivery QR display step
  useEffect(() => {
    if (phase !== 'delivery' || step !== 1 || !__DEV__) return;
    const t = setTimeout(async () => {
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
      setStep(2);
    }, 3000);
    return () => clearTimeout(t);
  }, [phase, step]);

  const canProceed = proximity === 'at_hub';
  const proxConfig = {
    at_hub: { color: theme.success, text: `📍 Vous êtes au hub ✓` },
    nearby: { color: theme.warning, text: `📍 ${distanceStr} du hub` },
    far: { color: theme.error, text: `📍 ${distanceStr} du hub` },
  }[proximity];

  const totalSteps = phase === 'pickup' ? 3 : 3;
  const phaseLabel = phase === 'pickup' ? 'Prise en charge' : 'Livraison';
  const phaseBg: [string, string] =
    phase === 'pickup'
      ? [theme.primary, theme.primaryGradientEnd]
      : ['#059669', '#10B981'];

  const qrDeliveryPayload = {
    transactionId: handoff.id,
    role: 'transporter_delivery' as const,
    hubId: destHub.id,
    timestamp: Date.now(),
    orderId: handoff.orderId,
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <LinearGradient
        colors={phaseBg}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color="#FFF" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{phaseLabel}</Text>
          <Text style={styles.headerSub}>
            {phase === 'pickup'
              ? `${originHub.city} → ${destHub.city}`
              : `Arrivée à ${destHub.city}`}
          </Text>
        </View>
        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>{step + 1}/{totalSteps}</Text>
        </View>
      </LinearGradient>

      {/* Phase switcher */}
      <View style={[styles.phaseSwitcher, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        {(['pickup', 'delivery'] as Phase[]).map((p) => (
          <TouchableOpacity
            key={p}
            style={[
              styles.phaseTab,
              phase === p && {
                borderBottomColor: p === 'pickup' ? theme.primary : theme.success,
                borderBottomWidth: 2,
              },
            ]}
            onPress={() => {
              setPhase(p);
              setStep(0);
            }}
          >
            <Feather
              name={p === 'pickup' ? 'package' : 'check-circle'}
              size={14}
              color={
                phase === p
                  ? p === 'pickup'
                    ? theme.primary
                    : theme.success
                  : theme.textSecondary
              }
            />
            <Text
              style={[
                styles.phaseTabText,
                {
                  color:
                    phase === p
                      ? p === 'pickup'
                        ? theme.primary
                        : theme.success
                      : theme.textSecondary,
                },
              ]}
            >
              {p === 'pickup' ? 'Prise en charge' : 'Livraison'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>

        {/* ═══ PICKUP PHASE ════════════════════════════════════════════ */}
        {phase === 'pickup' && (
          <>
            {/* Pickup Step 0: Go to origin hub */}
            {step === 0 && (
              <Animated.View entering={FadeIn} style={styles.stepContainer}>
                <View style={styles.stepHeader}>
                  <View style={[styles.stepDot, { backgroundColor: theme.primary }]}>
                    <Text style={styles.stepDotText}>1</Text>
                  </View>
                  <Text style={[styles.stepTitle, { color: theme.text }]}>
                    Rendez-vous au hub de départ
                  </Text>
                </View>

                <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <View style={[styles.hubIcon, { backgroundColor: `${theme.primary}12` }]}>
                    <Feather name="map-pin" size={22} color={theme.primary} />
                  </View>
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text style={[styles.hubName, { color: theme.text }]}>{originHub.name}</Text>
                    <Text style={[styles.hubAddress, { color: theme.textSecondary }]}>
                      {originHub.address}, {originHub.city}
                    </Text>
                  </View>
                </View>

                <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <Image source={{ uri: handoff.sellerAvatar }} style={styles.avatar} />
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text style={[styles.hubName, { color: theme.text }]}>
                      Vendeur : {handoff.sellerName}
                    </Text>
                    <Text style={[styles.hubAddress, { color: theme.textSecondary }]}>
                      {handoff.productName}
                    </Text>
                  </View>
                </View>

                <View style={[styles.geoCard, { backgroundColor: `${proxConfig.color}10`, borderColor: `${proxConfig.color}30` }]}>
                  <Feather name="navigation" size={16} color={proxConfig.color} />
                  <Text style={[styles.geoText, { color: proxConfig.color }]}>
                    {proxConfig.text}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => {
                    setScannerVisible(true);
                    setStep(1);
                  }}
                  disabled={!canProceed}
                  style={{ opacity: canProceed ? 1 : 0.5 }}
                >
                  <LinearGradient
                    colors={[theme.primary, theme.primaryGradientEnd]}
                    style={styles.primaryBtn}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Feather name="camera" size={18} color="#FFF" />
                    <Text style={styles.primaryBtnText}>Scanner le QR du vendeur</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            )}

            {/* Pickup Step 1: Scanning (scanner opened above) */}
            {step === 1 && !scannerVisible && (
              <Animated.View entering={FadeIn} style={styles.stepContainer}>
                <View style={styles.stepHeader}>
                  <View style={[styles.stepDot, { backgroundColor: theme.primary }]}>
                    <Text style={styles.stepDotText}>2</Text>
                  </View>
                  <Text style={[styles.stepTitle, { color: theme.text }]}>
                    Scan du vendeur en cours...
                  </Text>
                </View>

                <View style={[styles.waitingCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <Animated.View style={[styles.pulseDot, { backgroundColor: theme.primary }, pulseStyle]} />
                  <Text style={[styles.waitingText, { color: theme.textSecondary }]}>
                    Vérification du QR code{__DEV__ ? ' (dev mode)' : '...'}
                  </Text>
                </View>
              </Animated.View>
            )}

            {/* Pickup Step 2: Success */}
            {step === 2 && (
              <Animated.View entering={FadeIn} style={[styles.stepContainer, styles.successContainer]}>
                <View style={[styles.successIconBig, { backgroundColor: `${theme.success}15` }]}>
                  <Feather name="package" size={48} color={theme.success} />
                </View>
                <Text style={[styles.successTitle, { color: theme.text }]}>
                  Colis pris en charge ✓
                </Text>
                <Text style={[styles.successSub, { color: theme.textSecondary }]}>
                  Colis bien récupéré auprès de {handoff.sellerName}. Bonne route vers{' '}
                  {destHub.city}, on vous accompagne !
                </Text>

                <View style={[styles.routeCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <View style={styles.routeRow}>
                    <View style={[styles.routeDot, { backgroundColor: theme.primary }]} />
                    <Text style={[styles.routeCity, { color: theme.text }]}>{originHub.city} — {originHub.name}</Text>
                  </View>
                  <View style={[styles.routeLine, { backgroundColor: theme.border }]} />
                  <View style={styles.routeRow}>
                    <View style={[styles.routeDot, { backgroundColor: theme.success }]} />
                    <Text style={[styles.routeCity, { color: theme.text }]}>{destHub.city} — {destHub.name}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => {
                    setPhase('delivery');
                    setStep(0);
                  }}
                >
                  <LinearGradient
                    colors={['#059669', '#10B981']}
                    style={styles.primaryBtn}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Feather name="arrow-right" size={18} color="#FFF" />
                    <Text style={styles.primaryBtnText}>Passer à la livraison</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            )}
          </>
        )}

        {/* ═══ DELIVERY PHASE ══════════════════════════════════════════ */}
        {phase === 'delivery' && (
          <>
            {/* Delivery Step 0: Go to destination hub */}
            {step === 0 && (
              <Animated.View entering={FadeIn} style={styles.stepContainer}>
                <View style={styles.stepHeader}>
                  <View style={[styles.stepDot, { backgroundColor: theme.success }]}>
                    <Text style={styles.stepDotText}>1</Text>
                  </View>
                  <Text style={[styles.stepTitle, { color: theme.text }]}>
                    Rendez-vous au hub de destination
                  </Text>
                </View>

                <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <View style={[styles.hubIcon, { backgroundColor: `${theme.success}12` }]}>
                    <Feather name="map-pin" size={22} color={theme.success} />
                  </View>
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text style={[styles.hubName, { color: theme.text }]}>{destHub.name}</Text>
                    <Text style={[styles.hubAddress, { color: theme.textSecondary }]}>
                      {destHub.address}, {destHub.city}
                    </Text>
                  </View>
                </View>

                <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <Image source={{ uri: handoff.buyerAvatar }} style={styles.avatar} />
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text style={[styles.hubName, { color: theme.text }]}>
                      Acheteur : {handoff.buyerName}
                    </Text>
                    <Text style={[styles.hubAddress, { color: theme.textSecondary }]}>
                      L'acheteur sera notifié de votre arrivée
                    </Text>
                  </View>
                </View>

                <View style={[styles.geoCard, { backgroundColor: `${proxConfig.color}10`, borderColor: `${proxConfig.color}30` }]}>
                  <Feather name="navigation" size={16} color={proxConfig.color} />
                  <Text style={[styles.geoText, { color: proxConfig.color }]}>
                    {proxConfig.text}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => setStep(1)}
                  disabled={!canProceed}
                  style={{ opacity: canProceed ? 1 : 0.5 }}
                >
                  <LinearGradient
                    colors={['#059669', '#10B981']}
                    style={styles.primaryBtn}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Feather name="check-circle" size={18} color="#FFF" />
                    <Text style={styles.primaryBtnText}>Je suis au hub de livraison</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            )}

            {/* Delivery Step 1: Show QR to buyer */}
            {step === 1 && (
              <Animated.View entering={FadeIn} style={styles.stepContainer}>
                <View style={styles.stepHeader}>
                  <View style={[styles.stepDot, { backgroundColor: theme.success }]}>
                    <Text style={styles.stepDotText}>2</Text>
                  </View>
                  <Text style={[styles.stepTitle, { color: theme.text }]}>
                    Montrez ce code à l'acheteur
                  </Text>
                </View>

                <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <Image source={{ uri: handoff.buyerAvatar }} style={styles.avatar} />
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text style={[styles.hubName, { color: theme.text }]}>{handoff.buyerName}</Text>
                    <Text style={[styles.hubAddress, { color: theme.textSecondary }]}>
                      {handoff.productName}
                    </Text>
                  </View>
                </View>

                <QRGenerator payload={qrDeliveryPayload} />

                <View style={styles.waitingRow}>
                  <Animated.View style={[styles.pulseDot, { backgroundColor: theme.success }, pulseStyle]} />
                  <Text style={[styles.waitingText, { color: theme.textSecondary }]}>
                    En attente que l'acheteur scanne{__DEV__ ? ' (dev: auto 3s)' : '...'}
                  </Text>
                </View>
              </Animated.View>
            )}

            {/* Delivery Step 2: Success */}
            {step === 2 && (
              <Animated.View entering={FadeIn} style={[styles.stepContainer, styles.successContainer]}>
                <View style={[styles.successIconBig, { backgroundColor: `${theme.success}15` }]}>
                  <Feather name="check-circle" size={52} color={theme.success} />
                </View>
                <Text style={[styles.successTitle, { color: theme.text }]}>Colis livré ✓</Text>
                <Text style={[styles.successSub, { color: theme.textSecondary }]}>
                  Merci pour votre aide ! {handoff.buyerName} a bien reçu son colis. Votre rémunération est disponible.
                </Text>

                <View
                  style={[
                    styles.earningsCard,
                    { backgroundColor: `${theme.success}12`, borderColor: `${theme.success}30` },
                  ]}
                >
                  <Feather name="dollar-sign" size={24} color={theme.success} />
                  <View>
                    <Text style={[styles.earningsTitle, { color: theme.success }]}>
                      {handoff.deliveryFee.toFixed(2)}€ débloqués
                    </Text>
                    <Text style={[styles.earningsSub, { color: theme.textSecondary }]}>
                      {originHub.city} → {destHub.city} · {handoff.productName}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity onPress={() => router.replace('/')}>
                  <LinearGradient
                    colors={['#059669', '#10B981']}
                    style={styles.primaryBtn}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Feather name="home" size={18} color="#FFF" />
                    <Text style={styles.primaryBtnText}>Retour à l'accueil</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            )}
          </>
        )}
      </ScrollView>

      {/* Full-screen QR scanner (pickup phase) */}
      {scannerVisible && (
        <View style={StyleSheet.absoluteFillObject}>
          <QRScanner
            onScanSuccess={(_data) => {
              setScannerVisible(false);
              setStep(2);
            }}
            onClose={() => {
              setScannerVisible(false);
              setStep(0);
            }}
          />
        </View>
      )}
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
  headerTitle: { ...Typography.h3, color: '#FFF' },
  headerSub: { ...Typography.caption, color: 'rgba(255,255,255,0.8)' },
  stepBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  stepBadgeText: { ...Typography.captionMedium, color: '#FFF' },

  phaseSwitcher: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  phaseTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  phaseTabText: { ...Typography.captionMedium },

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

  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#E5E7EB' },

  geoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  geoText: { ...Typography.bodyMedium },

  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md + 2,
    borderRadius: BorderRadius.md,
  },
  primaryBtnText: { ...Typography.button, color: '#FFF' },

  waitingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    padding: Spacing.xl,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  waitingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
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
  successSub: { ...Typography.body, textAlign: 'center', maxWidth: 280 },

  routeCard: {
    width: '100%',
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  routeDot: { width: 10, height: 10, borderRadius: 5 },
  routeCity: { ...Typography.body },
  routeLine: { width: 2, height: 20, marginLeft: 4 },

  earningsCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  earningsTitle: { ...Typography.bodyMedium, fontFamily: 'Poppins_600SemiBold' },
  earningsSub: { ...Typography.caption },
});
