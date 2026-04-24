import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
  Image,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { QRGenerator } from '@/components/logistics/QRGenerator';
import { QRScanner } from '@/components/logistics/QRScanner';
import { mockHandoffTransaction } from '@/services/mock/handoffs';
import { getToleranceWindow, formatToleranceTime } from '@/utils/tolerance';

type ConfirmState = 'pending' | 'confirmed' | 'declined';
type Role = 'transporter' | 'seller' | 'buyer';
type ScreenStep = 'check' | 'propose' | 'received' | 'both_confirmed' | 'qr_exchange' | 'success';

export default function OffHubDeliveryScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ role?: string }>();

  const handoff = mockHandoffTransaction;
  const referenceTime = new Date(handoff.pickupWindowStart);
  const toleranceWindow = getToleranceWindow(referenceTime);

  // Role: transporter initiates, buyer/seller receive
  const role: Role = (params.role as Role) ?? 'transporter';
  const isTransporter = role === 'transporter';

  // Time check: off-hub only available BEFORE reference time
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const isBeforeSlot = now.getTime() < referenceTime.getTime();

  // Proposal state
  const [proposedPoint, setProposedPoint] = useState('');
  const [proposedTime, setProposedTime] = useState('');
  const [step, setStep] = useState<ScreenStep>(isBeforeSlot ? (isTransporter ? 'propose' : 'received') : 'check');
  const [counterpartConfirm, setCounterpartConfirm] = useState<ConfirmState>('pending');
  const [scannerVisible, setScannerVisible] = useState(false);

  // Update step when time changes
  useEffect(() => {
    if (!isBeforeSlot && step === 'propose') setStep('check');
  }, [isBeforeSlot]);

  // Mock: counterpart confirms after 2s
  const handleSendProposal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setStep('both_confirmed');
    if (__DEV__) {
      setTimeout(() => setCounterpartConfirm('confirmed'), 2000);
    }
  };

  const handleAcceptProposal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setCounterpartConfirm('confirmed');
    setStep('both_confirmed');
  };

  const handleDeclineProposal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    router.back();
  };

  const handleScanSuccess = (_data: string) => {
    setScannerVisible(false);
    setStep('success');
  };

  const qrPayload = {
    transactionId: handoff.id,
    role: 'seller' as const,
    hubId: 'off-hub',
    timestamp: Date.now(),
    orderId: handoff.orderId,
  };

  const canSendProposal = proposedPoint.trim().length > 3 && proposedTime.trim().length > 0;

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
        <Text style={styles.headerTitle}>Proposition hors hub</Text>
      </LinearGradient>

      {/* Top info banner */}
      <View style={[styles.infoBanner, { backgroundColor: `${theme.primary}06`, borderBottomColor: `${theme.primary}15` }]}>
        <Feather name="refresh-cw" size={14} color={theme.primary} />
        <Text style={[styles.infoText, { color: theme.primary }]}>
          Cette option vous permet de proposer un point de rencontre alternatif, de façon exceptionnelle.
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* ── Time check: slot already started ───────────────────────── */}
        {!isBeforeSlot && step === 'check' && (
          <Animated.View entering={FadeIn} style={styles.stepContainer}>
            <View style={[styles.disabledCard, { backgroundColor: `${theme.textSecondary}08`, borderColor: theme.border }]}>
              <Feather name="clock" size={32} color={theme.textSecondary} />
              <Text style={[styles.disabledTitle, { color: theme.text }]}>
                Fenêtre déjà ouverte
              </Text>
              <Text style={[styles.disabledText, { color: theme.textSecondary }]}>
                La fenêtre de rendez-vous a commencé à {formatToleranceTime(toleranceWindow.start)}. Le hors hub n'est plus disponible.
              </Text>
              <TouchableOpacity onPress={() => router.back()}>
                <LinearGradient
                  colors={[theme.primary, theme.primaryGradientEnd]}
                  style={styles.primaryBtn}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Feather name="arrow-left" size={18} color="#FFF" />
                  <Text style={styles.primaryBtnText}>Retour au hub</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {/* ── Transporter: proposal form ─────────────────────────────── */}
        {isBeforeSlot && isTransporter && step === 'propose' && (
          <Animated.View entering={FadeIn} style={styles.stepContainer}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Proposer un rendez-vous alternatif
            </Text>
            <Text style={[styles.sectionSub, { color: theme.textSecondary }]}>
              Vous pouvez proposer un point de rencontre différent. L'autre partie devra accepter.
            </Text>

            {/* Time remaining */}
            <View style={[styles.timeCard, { backgroundColor: `${theme.warning}10`, borderColor: `${theme.warning}25` }]}>
              <Feather name="clock" size={14} color={theme.warning} />
              <Text style={[styles.timeText, { color: theme.warning }]}>
                Disponible jusqu'à {formatToleranceTime(referenceTime)} (heure prévue)
              </Text>
            </View>

            {/* Proposed meeting point */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: theme.text }]}>Point de rencontre proposé</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                placeholder="Ex: Parking du centre commercial, entrée B"
                placeholderTextColor={theme.textSecondary}
                value={proposedPoint}
                onChangeText={setProposedPoint}
                multiline
              />
            </View>

            {/* Proposed time */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: theme.text }]}>Heure proposée</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                placeholder="Ex: 6h45"
                placeholderTextColor={theme.textSecondary}
                value={proposedTime}
                onChangeText={setProposedTime}
              />
              <Text style={[styles.fieldHint, { color: theme.textSecondary }]}>
                Doit être avant l'heure prévue ({formatToleranceTime(referenceTime)})
              </Text>
            </View>

            {/* GPS warning */}
            <View style={[styles.warningCard, { backgroundColor: `${theme.warning}10`, borderColor: `${theme.warning}25` }]}>
              <Feather name="alert-triangle" size={14} color={theme.warning} />
              <Text style={[styles.warningCardText, { color: theme.warning }]}>
                La localisation GPS ne sera pas active pour les rendez-vous hors hub.
              </Text>
            </View>

            {/* Send button */}
            <TouchableOpacity
              onPress={handleSendProposal}
              disabled={!canSendProposal}
              style={{ opacity: canSendProposal ? 1 : 0.5 }}
            >
              <LinearGradient
                colors={[theme.primary, theme.primaryGradientEnd]}
                style={styles.primaryBtn}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Feather name="send" size={18} color="#FFF" />
                <Text style={styles.primaryBtnText}>Envoyer la proposition</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* ── Buyer/Seller: received proposal ────────────────────────── */}
        {isBeforeSlot && !isTransporter && step === 'received' && (
          <Animated.View entering={FadeIn} style={styles.stepContainer}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Proposition du transporteur
            </Text>
            <Text style={[styles.sectionSub, { color: theme.textSecondary }]}>
              Le transporteur propose un rendez-vous alternatif hors hub.
            </Text>

            {/* Transporter info */}
            <View style={[styles.personCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Image source={{ uri: handoff.transporterAvatar }} style={styles.avatar} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[styles.personName, { color: theme.text }]}>{handoff.transporterName}</Text>
                <Text style={[styles.personRole, { color: theme.textSecondary }]}>{handoff.transporterVehicle}</Text>
              </View>
            </View>

            {/* Proposal details (mock) */}
            <View style={[styles.proposalCard, { backgroundColor: `${theme.primary}06`, borderColor: `${theme.primary}20` }]}>
              <View style={styles.proposalRow}>
                <Feather name="map-pin" size={14} color={theme.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.proposalLabel, { color: theme.textSecondary }]}>Point de rencontre</Text>
                  <Text style={[styles.proposalValue, { color: theme.text }]}>Parking Centre Commercial Cap 3000, entrée B</Text>
                </View>
              </View>
              <View style={styles.proposalRow}>
                <Feather name="clock" size={14} color={theme.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.proposalLabel, { color: theme.textSecondary }]}>Heure proposée</Text>
                  <Text style={[styles.proposalValue, { color: theme.text }]}>6h45</Text>
                </View>
              </View>
            </View>

            {/* GPS warning */}
            <View style={[styles.warningCard, { backgroundColor: `${theme.warning}10`, borderColor: `${theme.warning}25` }]}>
              <Feather name="alert-triangle" size={14} color={theme.warning} />
              <Text style={[styles.warningCardText, { color: theme.warning }]}>
                La localisation GPS ne sera pas active pour les rendez-vous hors hub.
              </Text>
            </View>

            {/* Accept / Refuse */}
            <TouchableOpacity onPress={handleAcceptProposal}>
              <LinearGradient
                colors={[theme.success, '#059669']}
                style={styles.primaryBtn}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Feather name="check" size={18} color="#FFF" />
                <Text style={styles.primaryBtnText}>Accepter</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleDeclineProposal}
              style={[styles.outlineBtn, { borderColor: theme.error }]}
            >
              <Feather name="x" size={16} color={theme.error} />
              <Text style={[styles.outlineBtnText, { color: theme.error }]}>Refuser et revenir au hub</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* ── Both confirmed: waiting + proceed ──────────────────────── */}
        {step === 'both_confirmed' && (
          <Animated.View entering={FadeIn} style={styles.stepContainer}>
            {counterpartConfirm === 'pending' ? (
              <View style={[styles.waitingCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Feather name="clock" size={24} color={theme.primary} />
                <Text style={[styles.waitingTitle, { color: theme.text }]}>
                  En attente de confirmation
                </Text>
                <Text style={[styles.waitingText, { color: theme.textSecondary }]}>
                  {isTransporter
                    ? 'En attente de l\'accord de l\'autre partie...'
                    : 'Votre réponse a été envoyée.'}
                  {__DEV__ ? ' (dev: auto 2s)' : ''}
                </Text>
              </View>
            ) : (
              <>
                <View style={[styles.confirmedBanner, { backgroundColor: `${theme.success}12`, borderColor: `${theme.success}30` }]}>
                  <Feather name="check-circle" size={16} color={theme.success} />
                  <Text style={[styles.confirmedText, { color: theme.success }]}>
                    Tout est prêt ! Les deux parties ont donné leur accord.
                  </Text>
                </View>

                <View style={[styles.warningCard, { backgroundColor: `${theme.warning}10`, borderColor: `${theme.warning}25` }]}>
                  <Feather name="alert-triangle" size={14} color={theme.warning} />
                  <Text style={[styles.warningCardText, { color: theme.warning }]}>
                    Le nouveau point de rencontre est désormais le point officiel de cette mission.
                  </Text>
                </View>

                <TouchableOpacity onPress={() => setStep('qr_exchange')}>
                  <LinearGradient
                    colors={[theme.primary, theme.primaryGradientEnd]}
                    style={styles.primaryBtn}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Feather name="arrow-right" size={18} color="#FFF" />
                    <Text style={styles.primaryBtnText}>Procéder à l'échange</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}
          </Animated.View>
        )}

        {/* ── QR exchange ────────────────────────────────────────────── */}
        {step === 'qr_exchange' && (
          <Animated.View entering={FadeIn} style={styles.stepContainer}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Tout est prêt pour la remise
            </Text>

            <View style={[styles.warningCard, { backgroundColor: `${theme.warning}10`, borderColor: `${theme.warning}25` }]}>
              <Feather name="alert-triangle" size={14} color={theme.warning} />
              <Text style={[styles.warningCardText, { color: theme.warning }]}>
                GPS non actif en mode hors hub — retrouvez-vous au point de rendez-vous convenu
              </Text>
            </View>

            <QRGenerator payload={qrPayload} />

            <TouchableOpacity onPress={() => setScannerVisible(true)}>
              <LinearGradient
                colors={[theme.primary, theme.primaryGradientEnd]}
                style={styles.primaryBtn}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Feather name="camera" size={18} color="#FFF" />
                <Text style={styles.primaryBtnText}>Scanner le QR code</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* ── Success ────────────────────────────────────────────────── */}
        {step === 'success' && (
          <Animated.View entering={FadeIn} style={[styles.stepContainer, styles.successContainer]}>
            <View style={[styles.successIconBig, { backgroundColor: `${theme.success}15` }]}>
              <Feather name="check-circle" size={52} color={theme.success} />
            </View>
            <Text style={[styles.successTitle, { color: theme.text }]}>Remise réussie</Text>
            <Text style={[styles.successSub, { color: theme.textSecondary }]}>
              Tout s'est bien passé ! Le paiement sera débloqué après validation par scan QR.
            </Text>

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

      {/* QR Scanner overlay */}
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

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { ...Typography.h3, color: '#FFF' },

  infoBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 1,
  },
  infoText: { ...Typography.caption, flex: 1 },

  body: { padding: Spacing.lg, paddingBottom: 40 },
  stepContainer: { gap: Spacing.lg },

  sectionTitle: { ...Typography.h3 },
  sectionSub: { ...Typography.body },

  // Disabled state
  disabledCard: {
    alignItems: 'center', gap: Spacing.lg, padding: Spacing.xxl,
    borderRadius: BorderRadius.lg, borderWidth: 1,
  },
  disabledTitle: { ...Typography.h3, textAlign: 'center' },
  disabledText: { ...Typography.body, textAlign: 'center' },

  // Time card
  timeCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    padding: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1,
  },
  timeText: { ...Typography.captionMedium, flex: 1 },

  // Form fields
  fieldGroup: { gap: Spacing.xs },
  fieldLabel: { ...Typography.bodyMedium, fontFamily: 'Poppins_600SemiBold' },
  textInput: {
    ...Typography.body, borderWidth: 1, borderRadius: BorderRadius.md,
    padding: Spacing.md, minHeight: 44,
  },
  fieldHint: { ...Typography.caption, fontSize: 11 },

  // Warning card
  warningCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
    padding: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1,
  },
  warningCardText: { ...Typography.caption, flex: 1 },

  // Person card
  personCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    padding: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1,
  },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#E5E7EB' },
  personName: { ...Typography.bodyMedium, fontFamily: 'Poppins_600SemiBold' },
  personRole: { ...Typography.caption },

  // Proposal card
  proposalCard: {
    padding: Spacing.lg, borderRadius: BorderRadius.md, borderWidth: 1, gap: Spacing.md,
  },
  proposalRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  proposalLabel: { ...Typography.caption },
  proposalValue: { ...Typography.bodyMedium },

  // Buttons
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, paddingVertical: Spacing.md + 2, borderRadius: BorderRadius.md,
  },
  primaryBtnText: { ...Typography.button, color: '#FFF' },
  outlineBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, paddingVertical: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1.5,
  },
  outlineBtnText: { ...Typography.button },

  // Waiting
  waitingCard: {
    alignItems: 'center', gap: Spacing.md, padding: Spacing.xxl,
    borderRadius: BorderRadius.lg, borderWidth: 1,
  },
  waitingTitle: { ...Typography.h3 },
  waitingText: { ...Typography.body, textAlign: 'center' },

  // Confirmed
  confirmedBanner: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    padding: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1,
  },
  confirmedText: { ...Typography.captionMedium, flex: 1 },

  // Success
  successContainer: { alignItems: 'center', paddingTop: Spacing.xl },
  successIconBig: {
    width: 96, height: 96, borderRadius: 48,
    alignItems: 'center', justifyContent: 'center',
  },
  successTitle: { ...Typography.h1, textAlign: 'center' },
  successSub: { ...Typography.body, textAlign: 'center', maxWidth: 280 },
});
