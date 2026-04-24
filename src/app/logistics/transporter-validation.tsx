import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { QRScanner } from '@/components/logistics/QRScanner';
import { mockHandoffTransaction } from '@/services/mock/handoffs';
import { ToleranceWindow } from '@/components/logistics/ToleranceWindow';

type Mode = 'pickup' | 'delivery';
type DeliveryStep = 'buyer_scan' | 'package_scan' | 'success';

export default function TransporterValidationScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();

  const mode: Mode = (params.mode as Mode) ?? 'pickup';
  const handoff = mockHandoffTransaction;

  const [pickupSuccess, setPickupSuccess] = useState(false);
  const [scannerVisible, setScannerVisible] = useState(false);

  // Delivery flow state: scan buyer QR → scan package → success
  const [deliveryStep, setDeliveryStep] = useState<DeliveryStep>('buyer_scan');
  const [buyerScanned, setBuyerScanned] = useState(false);

  // Manual entry fallback (delivery)
  const [manualVisible, setManualVisible] = useState(false);
  const [manualBuyerCode, setManualBuyerCode] = useState('');
  const [manualPackageCode, setManualPackageCode] = useState('');
  const [manualError, setManualError] = useState(false);

  const shakeX = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shakeX.value }] }));
  const shake = () => {
    shakeX.value = withSequence(
      withTiming(-12, { duration: 50 }),
      withTiming(12, { duration: 50 }),
      withTiming(-8, { duration: 50 }),
      withTiming(8, { duration: 50 }),
      withTiming(0, { duration: 50 }),
    );
  };

  // ── Pickup handler ─────────────────────────────────────────────────
  const handlePickupScanSuccess = useCallback((_data: string) => {
    setScannerVisible(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setPickupSuccess(true);
  }, []);

  // ── Delivery handlers ──────────────────────────────────────────────
  const handleBuyerScanSuccess = useCallback((data: string) => {
    setScannerVisible(false);
    // Accept any QR in dev / or anything that parses to a buyer payload
    let ok = true;
    try {
      const parsed = JSON.parse(data);
      if (parsed && parsed.type && parsed.type !== 'buyer') ok = false;
    } catch {
      // Not JSON — treat as raw manual code, still OK in mock
    }
    if (!ok) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setBuyerScanned(true);
    setDeliveryStep('package_scan');
  }, []);

  const handlePackageScanSuccess = useCallback((_data: string) => {
    setScannerVisible(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setDeliveryStep('success');
  }, []);

  const submitManual = () => {
    const buyerOk =
      manualBuyerCode.trim().toUpperCase() === handoff.buyerQRCode.toUpperCase() ||
      manualBuyerCode.trim().length >= 4;
    const packageOk =
      manualPackageCode.trim().toUpperCase() === handoff.packageTrackingNumber.toUpperCase() ||
      manualPackageCode.trim().length >= 4;
    if (!buyerOk || !packageOk) {
      setManualError(true);
      shake();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      return;
    }
    setManualError(false);
    setManualVisible(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setBuyerScanned(true);
    setDeliveryStep('success');
  };

  // ── Success screen (both modes) ────────────────────────────────────
  const isSuccess = (mode === 'pickup' && pickupSuccess) || (mode === 'delivery' && deliveryStep === 'success');
  if (isSuccess) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.successWrap, { paddingTop: insets.top + 80 }]}>
          <Animated.View entering={FadeIn.duration(400)} style={styles.successContent}>
            <View style={[styles.successIcon, { backgroundColor: `${theme.success}15` }]}>
              <Feather name="check-circle" size={56} color={theme.success} />
            </View>
            <Text style={[styles.successTitle, { color: theme.text }]}>
              {mode === 'pickup' ? 'Colis pris en charge ✓' : 'Livraison confirmée ✓'}
            </Text>
            <Text style={[styles.successSub, { color: theme.textSecondary }]}>
              {mode === 'pickup'
                ? 'Prise en charge confirmée. Bonne route !'
                : 'Livraison validée. Le paiement sera libéré. Merci pour votre aide !'}
            </Text>

            <TouchableOpacity
              onPress={() => router.replace(mode === 'pickup' ? '/logistics/delivery-tracking' : '/')}
              style={{ marginTop: Spacing.xxl }}
            >
              <LinearGradient
                colors={[theme.primary, theme.primaryGradientEnd]}
                style={styles.primaryBtn}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Feather name={mode === 'pickup' ? 'navigation' : 'home'} size={18} color="#FFF" />
                <Text style={styles.primaryBtnText}>
                  {mode === 'pickup' ? 'Continuer la livraison' : 'Retour'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    );
  }

  // ── Pickup mode: scan seller QR ────────────────────────────────────
  if (mode === 'pickup') {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <LinearGradient
          colors={[theme.primary, theme.primaryGradientEnd]}
          style={[styles.header, { paddingTop: insets.top + 8 }]}
        >
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={20} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Validation de prise en charge</Text>
        </LinearGradient>

        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={[styles.iconCircle, { backgroundColor: `${theme.primary}12` }]}>
              <Feather name="camera" size={22} color={theme.primary} />
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Scanner le QR du vendeur</Text>
              <Text style={[styles.cardSub, { color: theme.textSecondary }]}>
                Demandez au vendeur d'afficher son QR code, puis scannez-le pour confirmer la
                prise en charge du colis.
              </Text>
            </View>
          </View>

          <View style={[styles.productRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Feather name="package" size={16} color={theme.textSecondary} />
            <Text style={[styles.productText, { color: theme.text }]}>
              {handoff.productName} · {handoff.sellerName}
            </Text>
          </View>

          <ToleranceWindow
            referenceTime={new Date(handoff.pickupWindowStart)}
            role="transporter"
          />

          <TouchableOpacity onPress={() => setScannerVisible(true)}>
            <LinearGradient
              colors={[theme.primary, theme.primaryGradientEnd]}
              style={styles.primaryBtn}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Feather name="camera" size={18} color="#FFF" />
              <Text style={styles.primaryBtnText}>Ouvrir le scanner</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>

        {scannerVisible && (
          <View style={StyleSheet.absoluteFillObject}>
            <QRScanner
              onScanSuccess={handlePickupScanSuccess}
              onClose={() => setScannerVisible(false)}
            />
          </View>
        )}
      </View>
    );
  }

  // ── Delivery mode: 2-step QR scan (buyer → package) ────────────────
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={[theme.primary, theme.primaryGradientEnd]}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Validation de livraison</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* Step indicator */}
        <View style={[styles.stepIndicator, { borderColor: theme.border }]}>
          <View style={styles.stepIndicatorRow}>
            <View style={[styles.stepPill, { backgroundColor: buyerScanned ? theme.success : theme.primary }]}>
              <Feather name={buyerScanned ? 'check' : 'user'} size={14} color="#FFF" />
              <Text style={styles.stepPillText}>Acheteur</Text>
            </View>
            <View style={[styles.stepDivider, { backgroundColor: theme.border }]} />
            <View
              style={[
                styles.stepPill,
                {
                  backgroundColor:
                    deliveryStep === 'package_scan' ? theme.primary : `${theme.textSecondary}33`,
                },
              ]}
            >
              <Feather name="package" size={14} color="#FFF" />
              <Text style={styles.stepPillText}>Colis</Text>
            </View>
          </View>
        </View>

        {/* Step 1: Scan buyer QR */}
        {deliveryStep === 'buyer_scan' && (
          <Animated.View entering={FadeIn} style={{ gap: Spacing.lg }}>
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={[styles.iconCircle, { backgroundColor: `${theme.primary}12` }]}>
                <Feather name="user-check" size={22} color={theme.primary} />
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={[styles.cardTitle, { color: theme.text }]}>
                  Scanner le QR code de l'acheteur
                </Text>
                <Text style={[styles.cardSub, { color: theme.textSecondary }]}>
                  Demandez à l'acheteur de présenter son écran avec le QR code, puis scannez-le.
                </Text>
              </View>
            </View>

            <View style={[styles.productRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Feather name="user" size={16} color={theme.textSecondary} />
              <Text style={[styles.productText, { color: theme.text }]}>
                Acheteur : {handoff.buyerName}
              </Text>
            </View>

            <ToleranceWindow
              referenceTime={new Date(handoff.pickupWindowStart)}
              role="transporter"
              compact
            />

            <TouchableOpacity onPress={() => setScannerVisible(true)}>
              <LinearGradient
                colors={[theme.primary, theme.primaryGradientEnd]}
                style={styles.primaryBtn}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Feather name="camera" size={18} color="#FFF" />
                <Text style={styles.primaryBtnText}>Scanner le QR de l'acheteur</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryBtn, { borderColor: theme.border }]}
              onPress={() => setManualVisible(true)}
            >
              <Feather name="edit-3" size={16} color={theme.textSecondary} />
              <Text style={[styles.secondaryBtnText, { color: theme.textSecondary }]}>
                Saisie manuelle
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Step 2: Scan package */}
        {deliveryStep === 'package_scan' && (
          <Animated.View entering={FadeIn} style={{ gap: Spacing.lg }}>
            <View style={[styles.successBanner, { backgroundColor: `${theme.success}12`, borderColor: `${theme.success}30` }]}>
              <Feather name="check-circle" size={18} color={theme.success} />
              <Text style={[styles.successBannerText, { color: theme.success }]}>
                Acheteur identifié ✓
              </Text>
            </View>

            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={[styles.iconCircle, { backgroundColor: `${theme.primary}12` }]}>
                <Feather name="package" size={22} color={theme.primary} />
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={[styles.cardTitle, { color: theme.text }]}>Scanner le colis</Text>
                <Text style={[styles.cardSub, { color: theme.textSecondary }]}>
                  Scannez le QR code du bon d'envoi collé sur le colis pour confirmer la livraison.
                </Text>
              </View>
            </View>

            <TouchableOpacity onPress={() => setScannerVisible(true)}>
              <LinearGradient
                colors={[theme.primary, theme.primaryGradientEnd]}
                style={styles.primaryBtn}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Feather name="camera" size={18} color="#FFF" />
                <Text style={styles.primaryBtnText}>Scanner le colis</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryBtn, { borderColor: theme.border }]}
              onPress={() => setManualVisible(true)}
            >
              <Feather name="edit-3" size={16} color={theme.textSecondary} />
              <Text style={[styles.secondaryBtnText, { color: theme.textSecondary }]}>
                Saisie manuelle
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        <View style={[styles.infoCard, { backgroundColor: `${theme.primary}06`, borderColor: `${theme.primary}15` }]}>
          <Feather name="info" size={14} color={theme.primary} />
          <Text style={[styles.infoText, { color: theme.primary }]}>
            La validation est automatique dès que les deux scans sont effectués.
          </Text>
        </View>
      </ScrollView>

      {scannerVisible && (
        <View style={StyleSheet.absoluteFillObject}>
          <QRScanner
            onScanSuccess={
              deliveryStep === 'buyer_scan' ? handleBuyerScanSuccess : handlePackageScanSuccess
            }
            onClose={() => setScannerVisible(false)}
          />
        </View>
      )}

      {/* Manual entry fallback modal */}
      <Modal visible={manualVisible} transparent animationType="slide">
        <View style={styles.manualOverlay}>
          <Animated.View style={[styles.manualCard, shakeStyle]}>
            <Text style={styles.manualTitle}>Saisie manuelle</Text>
            <Text style={styles.manualSub}>
              Entrez le code de l'acheteur et le numéro du colis.
            </Text>

            <Text style={styles.manualLabel}>Code acheteur</Text>
            <TextInput
              style={styles.manualInput}
              value={manualBuyerCode}
              onChangeText={(t) => {
                setManualBuyerCode(t.toUpperCase());
                setManualError(false);
              }}
              autoCapitalize="characters"
              placeholder="BUY-XXXX"
              placeholderTextColor="#9CA3AF"
            />

            <Text style={styles.manualLabel}>Numéro de colis</Text>
            <TextInput
              style={styles.manualInput}
              value={manualPackageCode}
              onChangeText={(t) => {
                setManualPackageCode(t.toUpperCase());
                setManualError(false);
              }}
              autoCapitalize="characters"
              placeholder="HTH-XXXXX"
              placeholderTextColor="#9CA3AF"
            />

            {manualError && (
              <Text style={styles.manualErrorText}>
                Un des codes semble incorrect. Réessayez.
              </Text>
            )}

            <TouchableOpacity
              style={[
                styles.manualConfirm,
                {
                  opacity: manualBuyerCode.length > 0 && manualPackageCode.length > 0 ? 1 : 0.4,
                },
              ]}
              disabled={manualBuyerCode.length === 0 || manualPackageCode.length === 0}
              onPress={submitManual}
            >
              <Text style={styles.manualConfirmText}>Confirmer</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setManualVisible(false)}>
              <Text style={styles.manualCancel}>Annuler</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)' },
  headerTitle: { ...Typography.h3, color: '#FFF', flex: 1 },
  body: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: 100 },

  card: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    padding: Spacing.lg, borderRadius: BorderRadius.md, borderWidth: 1,
  },
  cardTitle: { ...Typography.bodyMedium, fontFamily: 'Poppins_600SemiBold' },
  cardSub: { ...Typography.caption },
  iconCircle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },

  productRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    padding: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1,
  },
  productText: { ...Typography.body, flex: 1 },

  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, paddingVertical: 14, borderRadius: BorderRadius.md,
  },
  primaryBtnText: { ...Typography.button, color: '#FFF' },

  secondaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, paddingVertical: 12, borderRadius: BorderRadius.md,
    borderWidth: 1.5,
  },
  secondaryBtnText: { ...Typography.button },

  // Step indicator
  stepIndicator: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  stepIndicatorRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm,
  },
  stepPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: Spacing.md, paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  stepPillText: { ...Typography.captionMedium, color: '#FFF' },
  stepDivider: { width: 24, height: 1 },

  successBanner: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    padding: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1,
  },
  successBannerText: { ...Typography.bodyMedium, fontFamily: 'Poppins_600SemiBold' },

  infoCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
    padding: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1,
  },
  infoText: { ...Typography.caption, flex: 1 },

  // Success
  successWrap: { flex: 1, alignItems: 'center' },
  successContent: { alignItems: 'center', gap: Spacing.lg, maxWidth: 300 },
  successIcon: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center' },
  successTitle: { ...Typography.h1, textAlign: 'center' },
  successSub: { ...Typography.body, textAlign: 'center' },

  // Manual entry modal
  manualOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  manualCard: {
    backgroundColor: '#FFF',
    padding: Spacing.xl,
    paddingBottom: 40,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    gap: Spacing.md,
  },
  manualTitle: { ...Typography.h3, color: '#111' },
  manualSub: { ...Typography.body, color: '#6B7280' },
  manualLabel: { ...Typography.captionMedium, color: '#6B7280' },
  manualInput: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 18,
    letterSpacing: 1,
    color: '#111',
  },
  manualErrorText: { ...Typography.captionMedium, color: '#DC2626', textAlign: 'center' },
  manualConfirm: {
    backgroundColor: '#14248A',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
  },
  manualConfirmText: { ...Typography.button, color: '#FFF' },
  manualCancel: {
    ...Typography.body,
    color: '#6B7280',
    textAlign: 'center',
    paddingVertical: Spacing.sm,
  },
});
