import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  ScrollView,
  TouchableOpacity,
  TextInput,
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
import { mockHubs } from '@/services/mock/hubs';
import { ToleranceWindow } from '@/components/logistics/ToleranceWindow';

type Mode = 'pickup' | 'delivery';

export default function TransporterValidationScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();

  const mode: Mode = (params.mode as Mode) ?? 'pickup';
  const handoff = mockHandoffTransaction;

  const [step, setStep] = useState<'action' | 'success'>('action');
  const [scannerVisible, setScannerVisible] = useState(false);

  // OTP input state (delivery mode)
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Shake animation for wrong OTP
  const shakeX = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shakeX.value }] }));

  const handleOtpChange = useCallback(
    (index: number, value: string) => {
      if (!/^\d?$/.test(value)) return;
      setOtpError(false);
      const next = [...otpValues];
      next[index] = value;
      setOtpValues(next);

      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }

      // Auto-validate when all 6 digits entered
      if (value && index === 5) {
        const fullCode = [...next.slice(0, 5), value].join('');
        if (fullCode.length === 6) {
          setTimeout(() => validateOTP(fullCode), 200);
        }
      }
    },
    [otpValues],
  );

  const handleOtpKeyPress = useCallback(
    (index: number, key: string) => {
      if (key === 'Backspace' && !otpValues[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
        const next = [...otpValues];
        next[index - 1] = '';
        setOtpValues(next);
      }
    },
    [otpValues],
  );

  const validateOTP = useCallback(
    (code: string) => {
      if (code === handoff.buyerOTPCode) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        setStep('success');
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
        setOtpError(true);
        shakeX.value = withSequence(
          withTiming(-12, { duration: 50 }),
          withTiming(12, { duration: 50 }),
          withTiming(-8, { duration: 50 }),
          withTiming(8, { duration: 50 }),
          withTiming(0, { duration: 50 }),
        );
        // Clear inputs
        setOtpValues(['', '', '', '', '', '']);
        setTimeout(() => inputRefs.current[0]?.focus(), 300);
      }
    },
    [handoff.buyerOTPCode, shakeX],
  );

  const handleScanSuccess = useCallback((_data: string) => {
    setScannerVisible(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setStep('success');
  }, []);

  // ── Success state ───────────────────────────────────────────────────
  if (step === 'success') {
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

  // ── Pickup mode: QR scanner ─────────────────────────────────────────
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

          {/* Tolerance window */}
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
              onScanSuccess={handleScanSuccess}
              onClose={() => setScannerVisible(false)}
            />
          </View>
        )}
      </View>
    );
  }

  // ── Delivery mode: OTP input ────────────────────────────────────────
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
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={[styles.iconCircle, { backgroundColor: `${theme.primary}12` }]}>
            <Feather name="lock" size={22} color={theme.primary} />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Entrez le code de l'acheteur</Text>
            <Text style={[styles.cardSub, { color: theme.textSecondary }]}>
              L'acheteur va vous communiquer un code à 6 chiffres. Saisissez-le ci-dessous pour
              confirmer la livraison.
            </Text>
          </View>
        </View>

        <View style={[styles.productRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Feather name="package" size={16} color={theme.textSecondary} />
          <Text style={[styles.productText, { color: theme.text }]}>
            {handoff.productName} · {handoff.buyerName}
          </Text>
        </View>

        {/* Tolerance window */}
        <ToleranceWindow
          referenceTime={new Date(handoff.pickupWindowStart)}
          role="transporter"
          compact
        />

        {/* OTP input */}
        <Animated.View style={[styles.otpInputContainer, shakeStyle]}>
          <View style={styles.otpInputRow}>
            {otpValues.map((val, i) => (
              <TextInput
                key={i}
                ref={(r) => { inputRefs.current[i] = r; }}
                style={[
                  styles.otpInput,
                  {
                    backgroundColor: theme.surface,
                    borderColor: otpError ? theme.error : val ? theme.primary : theme.border,
                    color: theme.text,
                  },
                ]}
                value={val}
                onChangeText={(t) => handleOtpChange(i, t)}
                onKeyPress={({ nativeEvent }) => handleOtpKeyPress(i, nativeEvent.key)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
              />
            ))}
          </View>
          {otpError && (
            <Animated.View entering={FadeIn}>
              <Text style={[styles.otpErrorText, { color: theme.error }]}>
                Code incorrect, veuillez réessayer
              </Text>
            </Animated.View>
          )}
        </Animated.View>

        <View style={[styles.infoCard, { backgroundColor: `${theme.primary}06`, borderColor: `${theme.primary}15` }]}>
          <Feather name="info" size={14} color={theme.primary} />
          <Text style={[styles.infoText, { color: theme.primary }]}>
            La validation est automatique dès que les 6 chiffres sont saisis correctement.
          </Text>
        </View>
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

  // OTP input
  otpInputContainer: { alignItems: 'center', gap: Spacing.md },
  otpInputRow: { flexDirection: 'row', gap: Spacing.md, justifyContent: 'center' },
  otpInput: {
    width: 48, height: 56, borderRadius: BorderRadius.md, borderWidth: 2,
    textAlign: 'center', fontFamily: 'Poppins_700Bold', fontSize: 24, lineHeight: 32,
  },
  otpErrorText: { ...Typography.captionMedium, textAlign: 'center' },

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
});
