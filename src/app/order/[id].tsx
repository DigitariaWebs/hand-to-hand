import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { formatPrice } from '@/utils';
import { useCartStore } from '@/stores/useCartStore';
import { mockProducts } from '@/services/mock/products';
import { mockHubs } from '@/services/mock/hubs';
import { shareInvoice } from '@/services/invoiceGenerator';
import { generateInvoiceNumber } from '@/utils/invoiceNumber';
import type { InvoiceData } from '@/types/invoice';
import { currentMockUser } from '@/services/mock/users';

// ── Types ──────────────────────────────────────────────────────────────────

type TrackingStep = {
  key: string;
  label: string;
  subLabel?: string;
  icon: string;
  state: 'done' | 'active' | 'pending';
  timestamp?: string;
};

// ── Mock tracking data ─────────────────────────────────────────────────────

const TRACKING_STEPS: TrackingStep[] = [
  {
    key: 'confirmed',
    label: 'Commande confirmée',
    subLabel: 'Paiement sécurisé et bloqué',
    icon: 'check-circle',
    state: 'done',
    timestamp: '02 Avr, 14:30',
  },
  {
    key: 'paid',
    label: 'Paiement sécurisé',
    subLabel: 'Montant bloqué jusqu\'à la livraison',
    icon: 'lock',
    state: 'done',
    timestamp: '02 Avr, 14:31',
  },
  {
    key: 'hub_waiting',
    label: 'En attente du vendeur au hub',
    subLabel: `${mockHubs[0].name} · Fenêtre : 14:00–14:10`,
    icon: 'package',
    state: 'active',
    timestamp: 'Aujourd\'hui 14:00',
  },
  {
    key: 'in_transit',
    label: 'Transporteur en route',
    subLabel: 'karim_b · Renault Kangoo',
    icon: 'truck',
    state: 'pending',
  },
  {
    key: 'arrived',
    label: 'Livraison au hub d\'arrivée',
    subLabel: mockHubs[2].name,
    icon: 'map-pin',
    state: 'pending',
  },
  {
    key: 'picked_up',
    label: 'Colis récupéré par l\'acheteur',
    icon: 'user-check',
    state: 'pending',
  },
  {
    key: 'completed',
    label: 'Transaction complétée',
    subLabel: 'Paiement débloqué pour le vendeur',
    icon: 'award',
    state: 'pending',
  },
];

// ── Pulsing active dot ─────────────────────────────────────────────────────

function PulsingDot({ color }: { color: string }) {
  const scale = useSharedValue(1);
  React.useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.4, { duration: 700, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
    );
  }, []);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: color,
  }));
  return <Animated.View style={[styles.activeDot, style]} />;
}

// ── Main screen ────────────────────────────────────────────────────────────

export default function OrderTrackingScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const recentOrderNumber = useCartStore((s) => s.recentOrderNumber);
  const orderNumber = recentOrderNumber ?? 'HTH-2024-0042';

  // Use mock product as order item reference
  const product = mockProducts[0];
  const originHub = mockHubs[0];
  const destHub = mockHubs[2];

  const activeStep = TRACKING_STEPS.find((s) => s.state === 'active');
  const doneCount = TRACKING_STEPS.filter((s) => s.state === 'done').length;
  const progress = doneCount / TRACKING_STEPS.length;

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
        <Text style={styles.headerTitle}>Suivi commande</Text>
        <View style={styles.orderBadge}>
          <Text style={styles.orderBadgeText}>#{orderNumber}</Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Order details card ──────────────────────────────────────── */}
        <View
          style={[
            styles.orderCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <View style={styles.orderCardTop}>
            <Image
              source={{ uri: product.images[0]?.url ?? product.images[0]?.thumbnail }}
              style={styles.orderThumb}
            />
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={[styles.orderItemTitle, { color: theme.text }]} numberOfLines={2}>
                {product.title}
              </Text>
              <View style={styles.sellerRow}>
                <Image
                  source={{ uri: product.seller.avatar }}
                  style={styles.sellerAvatar}
                />
                <Text style={[styles.sellerName, { color: theme.textSecondary }]}>
                  {product.seller.username}
                </Text>
              </View>
              <Text style={[styles.orderPrice, { color: theme.primary }]}>
                {formatPrice(product.price)}
              </Text>
            </View>
          </View>

          {/* Route */}
          <View style={[styles.routeBar, { backgroundColor: theme.background, borderColor: theme.border }]}>
            <View style={styles.routePoint}>
              <View style={[styles.routeDot, { backgroundColor: theme.primary }]} />
              <Text style={[styles.routeCity, { color: theme.text }]}>{originHub.city}</Text>
              <Text style={[styles.routeHub, { color: theme.textSecondary }]}>
                {originHub.name}
              </Text>
            </View>
            <View style={styles.routeArrowWrapper}>
              <View style={[styles.routeLine, { backgroundColor: theme.border }]} />
              <Feather name="chevron-right" size={16} color={theme.textSecondary} />
            </View>
            <View style={[styles.routePoint, { alignItems: 'flex-end' }]}>
              <View style={[styles.routeDot, { backgroundColor: theme.success }]} />
              <Text style={[styles.routeCity, { color: theme.text }]}>{destHub.city}</Text>
              <Text style={[styles.routeHub, { color: theme.textSecondary }]}>
                {destHub.name}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Progress bar ────────────────────────────────────────────── */}
        {activeStep && (
          <View
            style={[
              styles.statusBanner,
              { backgroundColor: `${theme.primary}12`, borderColor: `${theme.primary}25` },
            ]}
          >
            <Feather name="truck" size={16} color={theme.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.statusLabel, { color: theme.primary }]}>
                {activeStep.label}
              </Text>
              {activeStep.subLabel && (
                <Text style={[styles.statusSub, { color: theme.textSecondary }]}>
                  {activeStep.subLabel}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Progress strip */}
        <View style={[styles.progressTrack, { backgroundColor: theme.border }]}>
          <View
            style={[
              styles.progressFill,
              { backgroundColor: theme.primary, width: `${Math.round(progress * 100)}%` },
            ]}
          />
        </View>

        {/* ── Timeline ────────────────────────────────────────────────── */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Progression</Text>

        <View style={styles.timeline}>
          {TRACKING_STEPS.map((step, index) => {
            const isLast = index === TRACKING_STEPS.length - 1;
            return (
              <View key={step.key} style={styles.timelineStep}>
                {/* Vertical connector */}
                {!isLast && (
                  <View
                    style={[
                      styles.connector,
                      {
                        backgroundColor:
                          step.state === 'done' ? theme.success : theme.border,
                      },
                    ]}
                  />
                )}

                {/* Step icon */}
                {step.state === 'active' ? (
                  <View style={styles.activeIconWrapper}>
                    <PulsingDot color={theme.primary} />
                    <View
                      style={[
                        styles.iconCircle,
                        { backgroundColor: theme.primary, borderColor: theme.primary },
                      ]}
                    >
                      <Feather name={step.icon as any} size={15} color="#FFF" />
                    </View>
                  </View>
                ) : (
                  <View
                    style={[
                      styles.iconCircle,
                      {
                        backgroundColor:
                          step.state === 'done' ? theme.success : theme.background,
                        borderColor:
                          step.state === 'done' ? theme.success : theme.border,
                      },
                    ]}
                  >
                    <Feather
                      name={step.icon as any}
                      size={15}
                      color={step.state === 'done' ? '#FFF' : theme.border}
                    />
                  </View>
                )}

                {/* Step content */}
                <View style={styles.stepContent}>
                  <Text
                    style={[
                      styles.stepLabel,
                      {
                        color:
                          step.state === 'pending' ? theme.textSecondary : theme.text,
                        fontFamily:
                          step.state === 'active'
                            ? 'Poppins_600SemiBold'
                            : 'Poppins_500Medium',
                      },
                    ]}
                  >
                    {step.label}
                  </Text>
                  {step.subLabel && (
                    <Text style={[styles.stepSub, { color: theme.textSecondary }]}>
                      {step.subLabel}
                    </Text>
                  )}
                  {step.timestamp && (
                    <Text style={[styles.stepTime, { color: theme.textSecondary }]}>
                      {step.timestamp}
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* ── Participants card ────────────────────────────────────────── */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Participants</Text>

        <View
          style={[
            styles.participantsCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          {[
            {
              role: 'Vendeur',
              name: product.seller.username,
              avatar: product.seller.avatar,
              detail: originHub.name,
              icon: 'package',
            },
            {
              role: 'Transporteur',
              name: 'karim_b',
              avatar: 'https://i.pravatar.cc/150?img=3',
              detail: 'Renault Kangoo',
              icon: 'truck',
            },
            {
              role: 'Acheteur',
              name: 'Vous',
              avatar: 'https://i.pravatar.cc/150?img=5',
              detail: destHub.name,
              icon: 'user',
            },
          ].map((p, i, arr) => (
            <React.Fragment key={p.role}>
              <View style={styles.participantRow}>
                <View style={[styles.participantAvatar]}>
                  <Image source={{ uri: p.avatar }} style={styles.pAvatar} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[styles.participantRole, { color: theme.textSecondary }]}>
                    {p.role}
                  </Text>
                  <Text style={[styles.participantName, { color: theme.text }]}>
                    {p.name}
                  </Text>
                  <Text style={[styles.participantDetail, { color: theme.textSecondary }]}>
                    {p.detail}
                  </Text>
                </View>
                {p.role !== 'Acheteur' && (
                  <TouchableOpacity
                    style={[styles.contactBtn, { borderColor: theme.border }]}
                  >
                    <Feather name="message-circle" size={14} color={theme.primary} />
                    <Text style={[styles.contactBtnText, { color: theme.primary }]}>
                      Contacter
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              {i < arr.length - 1 && (
                <View style={[styles.participantDivider, { backgroundColor: theme.border }]} />
              )}
            </React.Fragment>
          ))}
        </View>

        {/* ── Invoice row (always visible; disabled if not completed) ─── */}
        <TouchableOpacity
          style={[
            styles.invoiceRow,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
          onPress={async () => {
            const deliveryFee = 2.5;
            const invoice: InvoiceData = {
              invoiceNumber: generateInvoiceNumber(orderNumber),
              date: new Date().toISOString(),
              seller: {
                name: product.seller.username,
                city: product.location?.city,
              },
              buyer: {
                name: `${currentMockUser.firstName} ${currentMockUser.lastName}`,
                city: currentMockUser.location?.city,
              },
              product: {
                title: product.title,
                description: product.description?.slice(0, 80),
                quantity: 1,
                unitPrice: product.price,
              },
              deliveryFee,
              serviceFee: 0,
              total: product.price + deliveryFee,
              orderReference: orderNumber,
            };
            try {
              await shareInvoice(invoice);
            } catch {
              // silent — warm fallback: user can retry
            }
          }}
        >
          <View
            style={[
              styles.invoiceIcon,
              { backgroundColor: `${theme.primary}12` },
            ]}
          >
            <Feather name="file-text" size={18} color={theme.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.invoiceTitle, { color: theme.text }]}>
              Facture
            </Text>
            <Text style={[styles.invoiceSub, { color: theme.textSecondary }]}>
              Voir / Télécharger le PDF
            </Text>
          </View>
          <Feather name="download" size={16} color={theme.primary} />
        </TouchableOpacity>

        {/* ── Insurance / Protection card ────────────────────────────── */}
        <View
          style={[
            styles.insuranceCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <View style={styles.insuranceCardHeader}>
            <View style={[styles.insuranceCardIcon, { backgroundColor: `${theme.success}15` }]}>
              <Feather name="shield" size={18} color={theme.success} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[styles.insuranceCardTitle, { color: theme.text }]}>
                Protection acheteur
              </Text>
              <Text style={[styles.insuranceCardSub, { color: theme.textSecondary }]}>
                Votre achat est couvert par la protection de base
              </Text>
            </View>
            <View
              style={[
                styles.insuranceBadge,
                { backgroundColor: `${theme.success}15` },
              ]}
            >
              <Text style={[styles.insuranceBadgeText, { color: theme.success }]}>
                Actif
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.claimBtn, { borderColor: theme.primary }]}
            onPress={() => router.push(`/order/insurance-claim?id=${orderNumber}`)}
          >
            <Feather name="alert-circle" size={14} color={theme.primary} />
            <Text style={[styles.claimBtnText, { color: theme.primary }]}>
              Ouvrir une réclamation
            </Text>
          </TouchableOpacity>
          <Text style={[styles.claimWindowNote, { color: theme.textMuted }]}>
            Vous disposez de 7 jours après la livraison pour signaler un problème.
          </Text>
        </View>

        {/* ── Help link ────────────────────────────────────────────────── */}
        <TouchableOpacity style={styles.helpRow}>
          <Feather name="help-circle" size={16} color={theme.textSecondary} />
          <Text style={[styles.helpText, { color: theme.textSecondary }]}>
            Besoin d'aide ?
          </Text>
          <Feather name="chevron-right" size={14} color={theme.textSecondary} />
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  headerTitle: { ...Typography.h3, color: '#FFF', flex: 1 },
  orderBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  orderBadgeText: { ...Typography.captionMedium, color: '#FFF' },

  scroll: { flex: 1 },
  scrollContent: {
    padding: Spacing.lg,
    gap: Spacing.lg,
    paddingBottom: 60,
  },

  // Order card
  orderCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  orderCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    padding: Spacing.lg,
  },
  orderThumb: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.md,
    backgroundColor: '#E5E7EB',
  },
  orderItemTitle: { ...Typography.bodyMedium, fontFamily: 'Poppins_600SemiBold' },
  sellerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  sellerAvatar: { width: 18, height: 18, borderRadius: 9, backgroundColor: '#E5E7EB' },
  sellerName: { ...Typography.caption },
  orderPrice: { ...Typography.bodyMedium, fontFamily: 'Poppins_700Bold' },

  routeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
  },
  routePoint: { gap: 2 },
  routeDot: { width: 8, height: 8, borderRadius: 4, marginBottom: 2 },
  routeCity: { ...Typography.captionMedium, fontFamily: 'Poppins_600SemiBold' },
  routeHub: { ...Typography.caption },
  routeArrowWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    marginHorizontal: Spacing.sm,
  },
  routeLine: { flex: 1, height: 1 },

  // Status banner
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  statusLabel: { ...Typography.bodyMedium, fontFamily: 'Poppins_600SemiBold' },
  statusSub: { ...Typography.caption },

  // Progress bar
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },

  sectionTitle: { ...Typography.h3 },

  // Timeline
  timeline: { gap: 0 },
  timelineStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    paddingBottom: Spacing.xl,
    position: 'relative',
  },
  connector: {
    position: 'absolute',
    left: 16,
    top: 34,
    width: 2,
    bottom: 0,
  },
  activeIconWrapper: {
    position: 'relative',
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeDot: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderRadius: 17,
    opacity: 0.25,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    zIndex: 1,
  },
  stepContent: { flex: 1, gap: 3, paddingTop: 5 },
  stepLabel: { ...Typography.bodyMedium },
  stepSub: { ...Typography.caption },
  stepTime: { ...Typography.caption },

  // Participants
  participantsCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
  },
  participantAvatar: {},
  pAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E5E7EB',
  },
  participantRole: { ...Typography.captionMedium },
  participantName: { ...Typography.bodyMedium, fontFamily: 'Poppins_600SemiBold' },
  participantDetail: { ...Typography.caption },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  contactBtnText: { ...Typography.captionMedium },
  participantDivider: { height: StyleSheet.hairlineWidth, marginHorizontal: Spacing.lg },

  // Invoice
  invoiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  invoiceIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  invoiceTitle: { ...Typography.bodyMedium, fontFamily: 'Poppins_600SemiBold' },
  invoiceSub: { ...Typography.caption, marginTop: 1 },

  // Help
  helpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    alignSelf: 'center',
  },
  helpText: { ...Typography.body },

  // Insurance card
  insuranceCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.md,
  },
  insuranceCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  insuranceCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insuranceCardTitle: { ...Typography.bodyMedium, fontFamily: 'Poppins_600SemiBold' },
  insuranceCardSub: { ...Typography.caption },
  insuranceBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  insuranceBadgeText: { ...Typography.captionMedium, fontSize: 10, fontFamily: 'Poppins_700Bold' },
  claimBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
  },
  claimBtnText: { ...Typography.button },
  claimWindowNote: { ...Typography.caption, textAlign: 'center' },
});
