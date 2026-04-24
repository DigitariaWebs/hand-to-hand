import React from 'react';
import { View, Text, StyleSheet, useColorScheme, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Colors, ThemeColors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { useLogisticsStore, MissionStatus } from '@/stores/useLogisticsStore';
import { mockHubs } from '@/services/mock/hubs';
import { mockHandoffTransaction } from '@/services/mock/handoffs';
import { ToleranceWindow } from '@/components/logistics/ToleranceWindow';
import { DeliveryMap } from '@/components/logistics/DeliveryMap';

// ── Timeline builder ──────────────────────────────────────────────────────

type TimelineStep = {
  label: string;
  detail?: string;
  status: 'done' | 'active' | 'pending';
  icon: keyof typeof Feather.glyphMap;
};

const STATUS_ORDER: MissionStatus[] = [
  'pending_transporter', 'pending_seller', 'seller_timer', 'group_created',
  'pickup_pending', 'picked_up', 'in_transit', 'delivery_pending', 'completed',
];

function buildTimeline(
  missionStatus: MissionStatus,
  transporterName: string,
  originHubName: string,
  originWindow: string,
  destHubName: string,
  destWindow: string,
): TimelineStep[] {
  const idx = STATUS_ORDER.indexOf(missionStatus);

  const steps: Omit<TimelineStep, 'status'>[] = [
    { label: 'Commande confirmée', detail: 'Paiement sécurisé', icon: 'check-circle' },
    { label: 'Transporteur accepté', detail: transporterName, icon: 'truck' },
    { label: 'Vendeur confirmé', detail: 'Délai 20 min respecté', icon: 'user-check' },
    { label: 'Groupe créé', detail: 'Communication activée', icon: 'users' },
    { label: 'En attente au hub vendeur', detail: `${originHubName} · ${originWindow}`, icon: 'map-pin' },
    { label: 'Colis pris en charge', detail: 'QR code validé', icon: 'package' },
    { label: 'Transporteur en route', detail: `Vers ${destHubName}`, icon: 'navigation' },
    { label: 'Livraison au hub acheteur', detail: `${destHubName} · ${destWindow}`, icon: 'map-pin' },
    { label: 'Transaction complétée', detail: 'Paiement débloqué', icon: 'dollar-sign' },
  ];

  return steps.map((s, i) => ({
    ...s,
    status: i < idx ? 'done' : i === idx ? 'active' : 'pending',
  }));
}

// ── Screen ────────────────────────────────────────────────────────────────

export default function DeliveryTrackingScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { mission, isHubLocked, lockedHubId } = useLogisticsStore();
  const handoff = mission?.handoff ?? mockHandoffTransaction;
  const missionStatus = mission?.status ?? 'in_transit';

  const originHub = mockHubs.find((h) => h.id === handoff.originHubId);
  const destHub = mockHubs.find((h) => h.id === handoff.destinationHubId);
  const transporter = mission?.groupMembers.find((m) => m.role === 'transporter');

  const fmtTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  const originWindow = `${fmtTime(handoff.pickupWindowStart)} – ${fmtTime(handoff.pickupWindowEnd)}`;
  const destWindow = originWindow; // mock: same window

  const timeline = buildTimeline(
    missionStatus,
    transporter?.name ?? handoff.transporterName,
    originHub?.name ?? 'Hub vendeur',
    originWindow,
    destHub?.name ?? 'Hub acheteur',
    destWindow,
  );

  const activeStep = timeline.find((s) => s.status === 'active');

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
        <Text style={styles.headerTitle}>Suivi livraison</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* Live tracking map */}
        <DeliveryMap
          originCoords={[originHub?.coordinates.lng ?? 7.2686, originHub?.coordinates.lat ?? 43.7042]}
          destinationCoords={[destHub?.coordinates.lng ?? 5.3754, destHub?.coordinates.lat ?? 43.2950]}
          originLabel={originHub?.name ?? 'Hub vendeur'}
          destinationLabel={destHub?.name ?? 'Hub acheteur'}
          simulateMovement={missionStatus === 'in_transit'}
        />

        {/* Current status card */}
        <View style={[styles.statusCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={[styles.statusIcon, { backgroundColor: `${theme.success}15` }]}>
            <Feather name={(activeStep?.icon ?? 'truck') as any} size={24} color={theme.success} />
          </View>
          <View style={styles.statusInfo}>
            <Text style={[styles.statusLabel, { color: theme.text }]}>
              {activeStep?.label ?? 'En cours'}
            </Text>
            <Text style={[styles.statusSub, { color: theme.textSecondary }]}>
              {activeStep?.detail ?? `${originHub?.city ?? 'Départ'} → ${destHub?.city ?? 'Arrivée'}`}
            </Text>
          </View>
        </View>

        {/* Tolerance window for pending steps */}
        {(missionStatus === 'pickup_pending' || missionStatus === 'delivery_pending') && (
          <ToleranceWindow
            referenceTime={new Date(handoff.pickupWindowStart)}
            compact={false}
          />
        )}

        {/* Transporter card */}
        <View style={[styles.transporterCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Image source={{ uri: handoff.transporterAvatar }} style={styles.avatar} contentFit="cover" />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[styles.transporterName, { color: theme.text }]}>{handoff.transporterName}</Text>
            <Text style={[styles.transporterVehicle, { color: theme.textSecondary }]}>
              {handoff.transporterVehicle}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.chatBtn, { borderColor: theme.primary }]}
            onPress={() => router.push(`/chat/${handoff.transporterId}` as never)}
          >
            <Feather name="message-circle" size={16} color={theme.primary} />
          </TouchableOpacity>
        </View>

        {/* Buyer awareness card: shown when transporter is en route / in_transit */}
        {(missionStatus === 'in_transit' || missionStatus === 'picked_up' || missionStatus === 'delivery_pending') && (
          <View style={[styles.awarenessCard, { backgroundColor: `${theme.primary}08`, borderColor: `${theme.primary}25` }]}>
            <View style={styles.awarenessHeader}>
              <Feather name="smartphone" size={18} color={theme.primary} />
              <Text style={[styles.awarenessTitle, { color: theme.primary }]}>
                Préparez-vous pour la remise
              </Text>
            </View>
            <Text style={[styles.awarenessBody, { color: theme.textSecondary }]}>
              À l'arrivée du transporteur, vous aurez besoin de :
            </Text>
            <Text style={[styles.awarenessStep, { color: theme.text }]}>1. Votre QR code (affiché sur l'écran de remise)</Text>
            <Text style={[styles.awarenessStep, { color: theme.text }]}>2. Vérifier visuellement le colis</Text>
            <Text style={[styles.awarenessBody, { color: theme.textSecondary, marginTop: 6 }]}>
              Le transporteur scannera votre QR code puis le code du colis pour confirmer la livraison. Tout se passe rapidement et simplement ! 😊
            </Text>
            <TouchableOpacity onPress={() => router.push('/logistics/buyer-handoff')} style={{ marginTop: 10 }}>
              <Text style={[styles.awarenessLink, { color: theme.primary }]}>
                Ouvrir mon QR code →
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Seller awareness card: bon d'envoi reminder after confirmation, before pickup */}
        {(missionStatus === 'group_created' || missionStatus === 'pickup_pending') && (
          <View style={[styles.awarenessCard, { backgroundColor: `${theme.warning}08`, borderColor: `${theme.warning}30` }]}>
            <View style={styles.awarenessHeader}>
              <Feather name="package" size={18} color={theme.warning} />
              <Text style={[styles.awarenessTitle, { color: theme.warning }]}>
                Rappel : bon d'envoi
              </Text>
            </View>
            <Text style={[styles.awarenessBody, { color: theme.textSecondary }]}>
              Avez-vous imprimé et collé le bon d'envoi sur le colis ? Le transporteur en a besoin pour valider la prise en charge.
            </Text>
            <TouchableOpacity onPress={() => router.push('/logistics/mission-group')} style={{ marginTop: 10 }}>
              <Text style={[styles.awarenessLink, { color: theme.warning }]}>
                Retélécharger le bon d'envoi →
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Hub locked indicator */}
        {isHubLocked && lockedHubId && destHub && (
          <View style={[styles.statusCard, { backgroundColor: `${theme.warning}08`, borderColor: `${theme.warning}25` }]}>
            <View style={[styles.statusIcon, { backgroundColor: `${theme.warning}15` }]}>
              <Feather name="lock" size={20} color={theme.warning} />
            </View>
            <View style={styles.statusInfo}>
              <Text style={[styles.statusLabel, { color: theme.warning }]}>
                Hub verrouillé
              </Text>
              <Text style={[styles.statusSub, { color: theme.textSecondary }]}>
                Vous êtes engagé sur le hub {destHub.name} jusqu'à la fin de cette livraison
              </Text>
            </View>
          </View>
        )}

        {/* Full timeline */}
        <Text style={[styles.timelineTitle, { color: theme.text }]}>Étapes de la mission</Text>
        <View style={styles.timeline}>
          {timeline.map((item, i) => (
            <TimelineRow key={i} item={item} isLast={i === timeline.length - 1} theme={theme} />
          ))}
        </View>

        {/* Group link */}
        {mission && (
          <TouchableOpacity
            onPress={() => router.push('/logistics/mission-group')}
            style={{ marginTop: Spacing.md }}
          >
            <LinearGradient
              colors={[theme.primary, theme.primaryGradientEnd]}
              style={styles.primaryBtn}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Feather name="users" size={18} color="#FFF" />
              <Text style={styles.primaryBtnText}>Voir le groupe de mission</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

// ── Timeline sub-component ────────────────────────────────────────────────

function TimelineRow({
  item,
  isLast,
  theme,
}: {
  item: TimelineStep;
  isLast: boolean;
  theme: ThemeColors;
}) {
  const dotColor =
    item.status === 'done' ? theme.success : item.status === 'active' ? theme.primary : theme.border;
  const dotSymbol =
    item.status === 'done' ? '✓' : item.status === 'active' ? '●' : '';

  return (
    <View style={styles.timelineRow}>
      <View style={styles.dotCol}>
        <View style={[styles.dot, { backgroundColor: dotColor }]}>
          {item.status === 'done' && <Feather name="check" size={10} color="#FFF" />}
          {item.status === 'active' && <View style={styles.activePulse} />}
        </View>
        {!isLast && (
          <View style={[styles.line, { backgroundColor: item.status === 'done' ? theme.success : theme.border }]} />
        )}
      </View>
      <View style={[styles.stepContent, { opacity: item.status === 'pending' ? 0.4 : 1 }]}>
        <Text style={[styles.stepLabel, { color: theme.text }]}>{item.label}</Text>
        {item.detail && (
          <Text style={[styles.stepDetail, { color: theme.textSecondary }]}>{item.detail}</Text>
        )}
      </View>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)' },
  headerTitle: { ...Typography.h3, color: '#FFF' },
  body: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: 100 },

  // Map
  mapPlaceholder: {
    height: 180, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    borderRadius: BorderRadius.lg, borderWidth: 2, borderStyle: 'dashed',
  },
  mapText: { ...Typography.body },
  mapSub: { ...Typography.caption },

  // Status
  statusCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    padding: Spacing.lg, borderRadius: BorderRadius.md, borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 1,
  },
  statusIcon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  statusInfo: { flex: 1, gap: 4 },
  statusLabel: { ...Typography.bodyMedium, fontFamily: 'Poppins_600SemiBold' },
  statusSub: { ...Typography.caption },

  // Transporter
  transporterCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    padding: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1,
  },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  transporterName: { ...Typography.bodyMedium, fontFamily: 'Poppins_600SemiBold' },
  transporterVehicle: { ...Typography.caption },
  chatBtn: {
    width: 38, height: 38, borderRadius: 19, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },

  // Awareness cards (V3-8)
  awarenessCard: {
    padding: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1,
    gap: 4,
  },
  awarenessHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.xs },
  awarenessTitle: { ...Typography.bodyMedium, fontFamily: 'Poppins_600SemiBold' },
  awarenessBody: { ...Typography.caption },
  awarenessStep: { ...Typography.caption, paddingLeft: 6 },
  awarenessLink: { ...Typography.captionMedium, textDecorationLine: 'underline' },

  // Timeline
  timelineTitle: { ...Typography.h3 },
  timeline: { gap: 0 },
  timelineRow: { flexDirection: 'row', minHeight: 56 },
  dotCol: { width: 28, alignItems: 'center' },
  dot: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  activePulse: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFF' },
  line: { width: 2, flex: 1, marginVertical: 2 },
  stepContent: { flex: 1, paddingLeft: Spacing.sm, paddingBottom: Spacing.lg },
  stepLabel: { ...Typography.bodyMedium, fontFamily: 'Poppins_600SemiBold' },
  stepDetail: { ...Typography.caption, marginTop: 2 },

  // Button
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, paddingVertical: 14, borderRadius: BorderRadius.md,
  },
  primaryBtnText: { ...Typography.button, color: '#FFF' },
});
