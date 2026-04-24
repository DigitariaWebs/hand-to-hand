import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
  Image,
  Dimensions,
  Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
// Clipboard copy via native share sheet (no extra dependency)
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { mockHandoffTransaction } from '@/services/mock/handoffs';
import { mockHubs } from '@/services/mock/hubs';
import { haversineDistance, getProximityStatus, ProximityStatus } from '@/utils/haversine';
import { ToleranceWindow } from '@/components/logistics/ToleranceWindow';
import { useLogisticsStore } from '@/stores/useLogisticsStore';
import QRCode from 'react-native-qrcode-svg';

const { width: SW } = Dimensions.get('window');
const QR_VALIDITY_S = 10 * 60; // 10 minutes

// ── Confetti pieces ─────────────────────────────────────────────────────────
const CONFETTI_COLORS = [
  '#14248A', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#F97316',
];
const CONFETTI_COUNT = 14;

function ConfettiDot({ index }: { index: number }) {
  const angle = (index / CONFETTI_COUNT) * Math.PI * 2;
  const distance = useRef(110 + Math.random() * 70).current;
  const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length];

  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0);

  useEffect(() => {
    const delay = index * 40;
    opacity.value = withDelay(delay, withSequence(withTiming(1, { duration: 150 }), withDelay(700, withTiming(0, { duration: 500 }))));
    scale.value = withDelay(delay, withSequence(withTiming(1.2, { duration: 300 }), withTiming(0.8, { duration: 900 })));
    tx.value = withDelay(delay, withTiming(Math.cos(angle) * distance, { duration: 1200, easing: Easing.out(Easing.quad) }));
    ty.value = withDelay(delay, withTiming(Math.sin(angle) * distance - 40, { duration: 1200, easing: Easing.out(Easing.quad) }));
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        { position: 'absolute', width: 10, height: 10, borderRadius: 5, backgroundColor: color },
        style,
      ]}
    />
  );
}

// ── Star Rating ─────────────────────────────────────────────────────────────
function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity key={star} onPress={() => onChange(star)}>
          <Feather
            name="star"
            size={34}
            color={star <= value ? '#F59E0B' : '#D1D5DB'}
            style={star <= value ? { opacity: 1 } : { opacity: 0.5 }}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ── Main screen ─────────────────────────────────────────────────────────────
export default function BuyerHandoffScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handoff = mockHandoffTransaction;
  const hub = mockHubs.find((h) => h.id === handoff.destinationHubId) ?? mockHubs[2];
  const buyerCode = handoff.buyerQRCode;
  const qrPayload = JSON.stringify({
    type: 'buyer' as const,
    code: buyerCode,
    missionId: handoff.id,
  });

  const [step, setStep] = useState(0);
  const [proximity, setProximity] = useState<ProximityStatus>('far');
  const [distanceStr, setDistanceStr] = useState('...');
  const [rating, setRating] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [copied, setCopied] = useState(false);
  const [qrSecondsLeft, setQrSecondsLeft] = useState(QR_VALIDITY_S);

  // Favorite transporter
  const { addFavoriteTransporter, removeFavoriteTransporter, isFavoriteTransporter } = useLogisticsStore();
  const [isFav, setIsFav] = useState(isFavoriteTransporter(handoff.transporterId));

  const favScale = useSharedValue(1);
  const favStyle = useAnimatedStyle(() => ({
    transform: [{ scale: favScale.value }],
  }));

  const toggleFavorite = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    favScale.value = withSequence(
      withTiming(1.1, { duration: 120 }),
      withTiming(1.0, { duration: 120 }),
    );
    if (isFav) {
      removeFavoriteTransporter(handoff.transporterId);
      setIsFav(false);
    } else {
      addFavoriteTransporter(handoff.transporterId);
      setIsFav(true);
    }
  };

  // QR countdown
  useEffect(() => {
    if (step !== 1) return;
    const id = setInterval(() => {
      setQrSecondsLeft((prev) => {
        if (prev <= 1) { clearInterval(id); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [step]);

  const formatQrTimer = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

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
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const dist = haversineDistance(loc.coords.latitude, loc.coords.longitude, hub.coordinates.lat, hub.coordinates.lng);
        setProximity(getProximityStatus(dist));
        setDistanceStr(dist < 1 ? `${Math.round(dist * 1000)}m` : `${dist.toFixed(1)}km`);
      } catch {
        setProximity('far');
      }
    })();
  }, []);

  // DEV: simulate transporter scanning QR after 4s on step 1
  useEffect(() => {
    if (step !== 1 || !__DEV__) return;
    const t = setTimeout(() => setStep(2), 4000);
    return () => clearTimeout(t);
  }, [step]);

  const handleCopyCode = async () => {
    try {
      await Share.share({ message: buyerCode });
    } catch {}
    setCopied(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirm = async () => {
    try { await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
    setShowConfetti(true);
    setStep(3);
  };

  const canProceed = proximity === 'at_hub';
  const proxConfig = {
    at_hub: { color: theme.success, text: '📍 Vous êtes au hub ✓' },
    nearby: { color: theme.warning, text: `📍 Vous êtes à ${distanceStr} du hub` },
    far: { color: theme.error, text: `📍 Vous êtes à ${distanceStr} du hub` },
  }[proximity];

  const TOTAL_STEPS = 4;

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
        <Text style={styles.headerTitle}>Récupération du colis</Text>
        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>{step + 1}/{TOTAL_STEPS}</Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* ── Step 0: Hub arrival ──────────────────────────────────────── */}
        {step === 0 && (
          <Animated.View entering={FadeIn} style={styles.stepContainer}>
            <View style={styles.stepHeader}>
              <View style={[styles.stepDot, { backgroundColor: theme.primary }]}>
                <Text style={styles.stepDotText}>1</Text>
              </View>
              <Text style={[styles.stepTitle, { color: theme.text }]}>
                Rendez-vous au hub d'arrivée
              </Text>
            </View>

            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={[styles.hubIcon, { backgroundColor: `${theme.primary}12` }]}>
                <Feather name="map-pin" size={22} color={theme.primary} />
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={[styles.hubName, { color: theme.text }]}>{hub.name}</Text>
                <Text style={[styles.hubAddress, { color: theme.textSecondary }]}>{hub.address}, {hub.city}</Text>
                <Text style={[styles.hubHours, { color: theme.textSecondary }]}>{hub.operatingHours}</Text>
              </View>
            </View>

            {/* Tolerance window */}
            <ToleranceWindow
              referenceTime={new Date(handoff.pickupWindowStart)}
              role="buyer"
            />

            <View style={[styles.geoCard, { backgroundColor: `${proxConfig.color}10`, borderColor: `${proxConfig.color}30` }]}>
              <Feather name="navigation" size={16} color={proxConfig.color} />
              <Text style={[styles.geoText, { color: proxConfig.color }]}>{proxConfig.text}</Text>
            </View>

            <View style={[styles.infoCard, { backgroundColor: `${theme.accent}15`, borderColor: `${theme.accent}30` }]}>
              <Feather name="info" size={16} color={theme.accent} />
              <Text style={[styles.infoText, { color: theme.textSecondary }]}>
                Le transporteur vous attend avec votre colis. Lorsqu'il arrive, présentez-lui
                simplement votre écran avec le QR code pour valider la remise.
              </Text>
            </View>

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
                Rendez-vous au hub pour récupérer votre colis
              </Text>
            )}
          </Animated.View>
        )}

        {/* ── Step 1: QR code display ──────────────────────────────────── */}
        {step === 1 && (
          <Animated.View entering={FadeIn} style={styles.stepContainer}>
            <View style={styles.stepHeader}>
              <View style={[styles.stepDot, { backgroundColor: theme.primary }]}>
                <Text style={styles.stepDotText}>2</Text>
              </View>
              <Text style={[styles.stepTitle, { color: theme.text }]}>
                Votre code de remise
              </Text>
            </View>

            {/* Transporter info */}
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Image source={{ uri: handoff.transporterAvatar }} style={styles.avatar} />
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={[styles.hubName, { color: theme.text }]}>{handoff.transporterName}</Text>
                <Text style={[styles.hubAddress, { color: theme.textSecondary }]}>{handoff.transporterVehicle}</Text>
              </View>
            </View>

            {/* QR code display */}
            <View style={[styles.qrContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.qrLabel, { color: theme.text }]}>
                Présentez ce QR code au transporteur pour valider la remise
              </Text>

              <View style={[styles.qrBox, { opacity: qrSecondsLeft === 0 ? 0.25 : 1 }]}>
                <QRCode
                  value={qrPayload}
                  size={220}
                  color="#111111"
                  backgroundColor="#FFFFFF"
                />
              </View>

              <Text style={[styles.qrHint, { color: theme.textSecondary }]}>
                Le transporteur scannera ce code puis le code du colis
              </Text>

              {/* Timer */}
              <View style={[styles.otpTimerRow, { backgroundColor: `${theme.warning}10` }]}>
                <Feather name="clock" size={14} color={theme.warning} />
                <Text style={[styles.otpTimer, { color: theme.warning }]}>
                  {qrSecondsLeft === 0
                    ? 'Votre code a expiré. Un nouveau sera généré automatiquement.'
                    : `Code valide pendant ${formatQrTimer(qrSecondsLeft)}`}
                </Text>
              </View>

              {/* Fallback manual code */}
              <Text style={[styles.fallbackText, { color: theme.textSecondary }]}>
                En cas de problème, votre code manuel est :{' '}
                <Text style={[styles.fallbackCode, { color: theme.primary }]}>{buyerCode}</Text>
              </Text>

              {/* Copy button */}
              <TouchableOpacity
                style={[styles.copyBtn, { borderColor: theme.primary }]}
                onPress={handleCopyCode}
              >
                <Feather name={copied ? 'check' : 'copy'} size={14} color={theme.primary} />
                <Text style={[styles.copyText, { color: theme.primary }]}>
                  {copied ? 'Copié !' : 'Copier le code manuel'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Waiting indicator */}
            <View style={styles.waitingRow}>
              <View style={[styles.pulseDot, { backgroundColor: theme.primary }]} />
              <Text style={[styles.waitingText, { color: theme.textSecondary }]}>
                En attente de validation par le transporteur{__DEV__ ? ' (dev: auto 4s)' : '...'}
              </Text>
            </View>
          </Animated.View>
        )}

        {/* ── Step 2: Verify package ───────────────────────────────────── */}
        {step === 2 && (
          <Animated.View entering={FadeIn} style={styles.stepContainer}>
            <View style={styles.stepHeader}>
              <View style={[styles.stepDot, { backgroundColor: theme.primary }]}>
                <Text style={styles.stepDotText}>3</Text>
              </View>
              <Text style={[styles.stepTitle, { color: theme.text }]}>Vérifiez le colis</Text>
            </View>

            <View style={[styles.verifyCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Image source={{ uri: handoff.productImage }} style={styles.productImageLarge} />
              <View style={{ gap: Spacing.sm }}>
                <Text style={[styles.verifyQuestion, { color: theme.text }]}>
                  Le colis correspond-il à votre commande ?
                </Text>
                <Text style={[styles.productName, { color: theme.textSecondary }]}>{handoff.productName}</Text>
                <Text style={[styles.productPrice, { color: theme.primary }]}>{handoff.price.toFixed(2)}€</Text>
              </View>
            </View>

            <TouchableOpacity onPress={handleConfirm}>
              <LinearGradient
                colors={[theme.success, '#059669']}
                style={styles.primaryBtn}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Feather name="check" size={18} color="#FFF" />
                <Text style={styles.primaryBtnText}>Oui, tout est conforme</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.problemBtn, { borderColor: theme.error }]}>
              <Feather name="alert-circle" size={16} color={theme.error} />
              <Text style={[styles.problemBtnText, { color: theme.error }]}>Non, il y a un problème</Text>
            </TouchableOpacity>

            <Text style={[styles.verifyNote, { color: theme.textSecondary }]}>
              En confirmant, le paiement sera libéré automatiquement pour le vendeur et le transporteur.
            </Text>
          </Animated.View>
        )}

        {/* ── Step 3: Success + Rating ─────────────────────────────────── */}
        {step === 3 && (
          <Animated.View entering={FadeIn} style={[styles.stepContainer, styles.successContainer]}>
            {showConfetti && (
              <View style={{ position: 'absolute', top: 90, left: SW / 2 - 5, width: 10, height: 10 }} pointerEvents="none">
                {Array.from({ length: CONFETTI_COUNT }, (_, i) => <ConfettiDot key={i} index={i} />)}
              </View>
            )}

            <View style={[styles.successIconBig, { backgroundColor: `${theme.success}15` }]}>
              <Feather name="package" size={52} color={theme.success} />
            </View>
            <Text style={[styles.successTitle, { color: theme.text }]}>Colis récupéré ✓</Text>
            <Text style={[styles.successSub, { color: theme.textSecondary }]}>
              Paiement libéré automatiquement. Merci pour votre confiance !
            </Text>

            {/* Payment banner */}
            <View style={[styles.paymentBanner, { backgroundColor: `${theme.success}12`, borderColor: `${theme.success}30` }]}>
              <Feather name="unlock" size={18} color={theme.success} />
              <View>
                <Text style={[styles.paymentTitle, { color: theme.success }]}>Paiement débloqué</Text>
                <Text style={[styles.paymentSub, { color: theme.textSecondary }]}>
                  {handoff.price.toFixed(2)}€ → {handoff.sellerName} · {handoff.deliveryFee.toFixed(2)}€ → {handoff.transporterName}
                </Text>
              </View>
            </View>

            {/* Rating */}
            <View style={[styles.ratingCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={styles.ratingRow}>
                <Image source={{ uri: handoff.transporterAvatar }} style={styles.ratingAvatar} />
                <Text style={[styles.ratingTitle, { color: theme.text }]}>Notez {handoff.transporterName}</Text>
              </View>
              <StarRating value={rating} onChange={setRating} />
              {rating > 0 && (
                <Animated.View entering={FadeIn}>
                  <Text style={[styles.ratingThanks, { color: theme.success }]}>Merci pour votre note !</Text>
                </Animated.View>
              )}
            </View>

            {/* Favorite transporter button */}
            <Animated.View style={[{ width: '100%' }, favStyle]}>
              <TouchableOpacity
                onPress={toggleFavorite}
                style={[
                  styles.problemBtn,
                  {
                    borderColor: isFav ? theme.primary : theme.border,
                    backgroundColor: isFav ? `${theme.primary}08` : 'transparent',
                  },
                ]}
              >
                <Feather
                  name="star"
                  size={16}
                  color={isFav ? '#F59E0B' : theme.textSecondary}
                />
                <Text
                  style={[
                    styles.problemBtnText,
                    { color: isFav ? theme.primary : theme.textSecondary },
                  ]}
                >
                  {isFav ? 'Transporteur favori' : 'Ajouter aux transporteurs favoris'}
                </Text>
              </TouchableOpacity>
            </Animated.View>

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
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md,
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...Typography.h3, color: '#FFF', flex: 1 },
  stepBadge: { backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: BorderRadius.full },
  stepBadgeText: { ...Typography.captionMedium, color: '#FFF' },

  body: { padding: Spacing.lg, paddingBottom: 40 },
  stepContainer: { gap: Spacing.lg },

  stepHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  stepDot: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  stepDotText: { ...Typography.captionMedium, color: '#FFF' },
  stepTitle: { ...Typography.h3, flex: 1 },

  card: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.lg, borderRadius: BorderRadius.md, borderWidth: 1 },
  hubIcon: { width: 48, height: 48, borderRadius: BorderRadius.sm, alignItems: 'center', justifyContent: 'center' },
  hubName: { ...Typography.bodyMedium, fontFamily: 'Poppins_600SemiBold' },
  hubAddress: { ...Typography.caption },
  hubHours: { ...Typography.caption },

  geoCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1 },
  geoText: { ...Typography.bodyMedium },
  infoCard: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, padding: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1 },
  infoText: { ...Typography.caption, flex: 1 },

  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, paddingVertical: Spacing.md + 2, borderRadius: BorderRadius.md },
  primaryBtnText: { ...Typography.button, color: '#FFF' },
  geoWarning: { ...Typography.caption, textAlign: 'center', marginTop: -Spacing.sm },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#E5E7EB' },

  // QR display
  qrContainer: {
    alignItems: 'center', gap: Spacing.lg, padding: Spacing.xl,
    borderRadius: BorderRadius.lg, borderWidth: 1.5,
  },
  qrLabel: { ...Typography.bodyMedium, textAlign: 'center', fontFamily: 'Poppins_600SemiBold' },
  qrBox: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: '#FFFFFF',
  },
  qrHint: { ...Typography.caption, textAlign: 'center', maxWidth: 280 },
  fallbackText: { ...Typography.caption, textAlign: 'center' },
  fallbackCode: { fontFamily: 'Poppins_700Bold', letterSpacing: 1 },
  otpTimerRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full,
  },
  otpTimer: { ...Typography.captionMedium },
  copyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full, borderWidth: 1.5,
  },
  copyText: { ...Typography.captionMedium },

  waitingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, paddingVertical: Spacing.sm },
  pulseDot: { width: 10, height: 10, borderRadius: 5 },
  waitingText: { ...Typography.body },

  // Verify
  verifyCard: { gap: Spacing.lg, padding: Spacing.lg, borderRadius: BorderRadius.lg, borderWidth: 1 },
  productImageLarge: { width: '100%', height: 180, borderRadius: BorderRadius.md, backgroundColor: '#E5E7EB' },
  verifyQuestion: { ...Typography.h3 },
  productName: { ...Typography.body },
  productPrice: { ...Typography.body, fontFamily: 'Poppins_600SemiBold' },
  problemBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, paddingVertical: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1.5 },
  problemBtnText: { ...Typography.button },
  verifyNote: { ...Typography.caption, textAlign: 'center' },

  // Success
  successContainer: { alignItems: 'center', paddingTop: Spacing.xl },
  successIconBig: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center' },
  successTitle: { ...Typography.h1, textAlign: 'center' },
  successSub: { ...Typography.body, textAlign: 'center', maxWidth: 260 },
  paymentBanner: { width: '100%', flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, padding: Spacing.lg, borderRadius: BorderRadius.md, borderWidth: 1 },
  paymentTitle: { ...Typography.bodyMedium, fontFamily: 'Poppins_600SemiBold' },
  paymentSub: { ...Typography.caption },
  ratingCard: { width: '100%', padding: Spacing.lg, borderRadius: BorderRadius.lg, borderWidth: 1, gap: Spacing.md, alignItems: 'center' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  ratingAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E5E7EB' },
  ratingTitle: { ...Typography.bodyMedium, fontFamily: 'Poppins_600SemiBold' },
  ratingThanks: { ...Typography.captionMedium },
});
