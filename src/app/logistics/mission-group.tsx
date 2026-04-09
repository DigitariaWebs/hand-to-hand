import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { Colors, ThemeColors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { useLogisticsStore, GroupMember, MissionStatus } from '@/stores/useLogisticsStore';
import { mockHubs } from '@/services/mock/hubs';
import { ToleranceWindow } from '@/components/logistics/ToleranceWindow';

// ── Quick messages ────────────────────────────────────────────────────────

const QUICK_MESSAGES = [
  'Je suis en route',
  'Je suis arrivé',
  'Le colis est prêt',
  'Un léger décalage, merci pour votre patience',
  'Tout est prêt pour la remise',
];

// ── Timeline steps ────────────────────────────────────────────────────────

type TimelineItem = {
  label: string;
  detail?: string;
  status: 'done' | 'active' | 'pending';
  icon: keyof typeof Feather.glyphMap;
};

function buildTimeline(missionStatus: MissionStatus, originName: string, destName: string): TimelineItem[] {
  const idx = [
    'pending_transporter', 'pending_seller', 'seller_timer', 'group_created',
    'pickup_pending', 'picked_up', 'in_transit', 'delivery_pending', 'completed',
  ].indexOf(missionStatus);

  const steps: Omit<TimelineItem, 'status'>[] = [
    { label: 'Commande confirmée', icon: 'check-circle' },
    { label: 'Transporteur accepté', icon: 'truck' },
    { label: 'Vendeur confirmé', icon: 'user-check' },
    { label: 'Groupe créé', detail: 'Communication activée', icon: 'users' },
    { label: 'En attente au hub vendeur', detail: originName, icon: 'map-pin' },
    { label: 'Colis pris en charge', detail: 'QR code validé', icon: 'package' },
    { label: 'Transporteur en route', detail: `Vers ${destName}`, icon: 'navigation' },
    { label: 'Livraison au hub acheteur', detail: destName, icon: 'map-pin' },
    { label: 'Transaction complétée', detail: 'Paiement débloqué', icon: 'dollar-sign' },
  ];

  return steps.map((s, i) => ({
    ...s,
    status: i < idx ? 'done' : i === idx ? 'active' : 'pending',
  }));
}

// ── Screen ────────────────────────────────────────────────────────────────

export default function MissionGroupScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { mission, isHubLocked, lockedHubId } = useLogisticsStore();
  const [sentMsg, setSentMsg] = useState<string | null>(null);

  const handoff = mission?.handoff;
  const originHub = mockHubs.find((h) => h.id === handoff?.originHubId);
  const destHub = mockHubs.find((h) => h.id === handoff?.destinationHubId);

  const timeline = buildTimeline(
    mission?.status ?? 'group_created',
    originHub?.name ?? 'Hub vendeur',
    destHub?.name ?? 'Hub acheteur',
  );

  const sendQuickMsg = useCallback((msg: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setSentMsg(msg);
    setTimeout(() => setSentMsg(null), 2000);
  }, []);

  if (!mission || !handoff) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={[Typography.body, { color: theme.textSecondary }]}>Aucun groupe de mission actif</Text>
      </View>
    );
  }

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
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Groupe de mission</Text>
          <Text style={styles.headerSub}>#{handoff.id}</Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* Hub locked indicator */}
        {isHubLocked && lockedHubId && destHub && (
          <View style={[styles.sentBanner, { backgroundColor: `${theme.warning}10`, borderColor: `${theme.warning}25` }]}>
            <Feather name="lock" size={14} color={theme.warning} />
            <Text style={[styles.sentText, { color: theme.warning }]}>
              Vous êtes engagé sur le hub {destHub.name} jusqu'à la fin de cette livraison
            </Text>
          </View>
        )}

        {/* Participants */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Participants</Text>
        <View style={styles.participantsRow}>
          {mission.groupMembers.map((m, i) => (
            <Animated.View key={m.userId} entering={FadeInUp.delay(i * 100)}>
              <ParticipantCard member={m} theme={theme} onContact={() => router.push(`/chat/${m.userId}` as never)} />
            </Animated.View>
          ))}
        </View>

        {/* Quick messages */}
        <Text style={[styles.sectionTitle, { color: theme.text, marginTop: Spacing.xl }]}>Messages rapides</Text>
        {sentMsg && (
          <Animated.View entering={FadeIn} style={[styles.sentBanner, { backgroundColor: `${theme.success}10`, borderColor: `${theme.success}25` }]}>
            <Feather name="check" size={14} color={theme.success} />
            <Text style={[styles.sentText, { color: theme.success }]}>Envoyé : "{sentMsg}"</Text>
          </Animated.View>
        )}
        <View style={styles.quickMsgRow}>
          {QUICK_MESSAGES.map((msg) => (
            <TouchableOpacity
              key={msg}
              style={[styles.quickMsgChip, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={() => sendQuickMsg(msg)}
              activeOpacity={0.7}
            >
              <Text style={[styles.quickMsgText, { color: theme.text }]}>{msg}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tolerance window for current step */}
        {(mission.status === 'pickup_pending' || mission.status === 'delivery_pending' || mission.status === 'group_created') && (
          <View style={{ marginTop: Spacing.xl }}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Fenêtre de rendez-vous</Text>
            <ToleranceWindow
              referenceTime={new Date(handoff.pickupWindowStart)}
              compact={false}
            />
          </View>
        )}

        {/* Timeline */}
        <Text style={[styles.sectionTitle, { color: theme.text, marginTop: Spacing.xl }]}>Suivi de la mission</Text>
        <View style={styles.timeline}>
          {timeline.map((item, i) => (
            <TimelineRow key={i} item={item} isLast={i === timeline.length - 1} theme={theme} />
          ))}
        </View>

        {/* Track button */}
        <TouchableOpacity
          onPress={() => router.push('/logistics/delivery-tracking')}
          style={{ marginTop: Spacing.lg }}
        >
          <LinearGradient
            colors={[theme.primary, theme.primaryGradientEnd]}
            style={styles.primaryBtn}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Feather name="map" size={18} color="#FFF" />
            <Text style={styles.primaryBtnText}>Voir le suivi en temps réel</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function ParticipantCard({
  member,
  theme,
  onContact,
}: {
  member: GroupMember;
  theme: ThemeColors;
  onContact: () => void;
}) {
  const roleLabels: Record<string, string> = {
    seller: 'Vendeur',
    transporter: 'Transporteur',
    buyer: 'Acheteur',
  };
  const roleColors: Record<string, string> = {
    seller: '#8B5CF6',
    transporter: theme.primary,
    buyer: theme.success,
  };
  const color = roleColors[member.role] ?? theme.primary;

  return (
    <View style={[styles.participantCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <Image source={{ uri: member.avatar }} style={styles.participantAvatar} contentFit="cover" />
      <Text style={[styles.participantName, { color: theme.text }]} numberOfLines={1}>
        {member.name}
      </Text>
      <View style={[styles.rolePill, { backgroundColor: `${color}12` }]}>
        <Text style={[styles.roleLabel, { color }]}>{roleLabels[member.role]}</Text>
      </View>
      <View style={styles.participantRating}>
        <Feather name="star" size={10} color="#F59E0B" />
        <Text style={[styles.ratingVal, { color: theme.textSecondary }]}>{member.rating}</Text>
      </View>
      <TouchableOpacity
        style={[styles.contactBtn, { borderColor: `${color}40` }]}
        onPress={onContact}
      >
        <Feather name="message-circle" size={14} color={color} />
        <Text style={[styles.contactText, { color }]}>Contacter</Text>
      </TouchableOpacity>
    </View>
  );
}

function TimelineRow({
  item,
  isLast,
  theme,
}: {
  item: TimelineItem;
  isLast: boolean;
  theme: ThemeColors;
}) {
  const dotColor =
    item.status === 'done' ? theme.success : item.status === 'active' ? theme.primary : theme.border;

  return (
    <View style={styles.timelineRow}>
      <View style={styles.timelineDotCol}>
        <View style={[styles.timelineDot, { backgroundColor: dotColor }]}>
          {item.status === 'done' && <Feather name="check" size={10} color="#FFF" />}
          {item.status === 'active' && <View style={styles.activePulse} />}
        </View>
        {!isLast && (
          <View
            style={[
              styles.timelineLine,
              { backgroundColor: item.status === 'done' ? theme.success : theme.border },
            ]}
          />
        )}
      </View>
      <View style={[styles.timelineContent, { opacity: item.status === 'pending' ? 0.45 : 1 }]}>
        <Text style={[styles.timelineLabel, { color: theme.text }]}>{item.label}</Text>
        {item.detail && (
          <Text style={[styles.timelineDetail, { color: theme.textSecondary }]}>{item.detail}</Text>
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
  headerSub: { ...Typography.caption, color: 'rgba(255,255,255,0.7)' },
  body: { padding: Spacing.lg, paddingBottom: 100 },

  sectionTitle: { ...Typography.h3, marginBottom: Spacing.sm },

  // Participants
  participantsRow: { gap: Spacing.md },
  participantCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    padding: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1,
  },
  participantAvatar: { width: 40, height: 40, borderRadius: 20 },
  participantName: { ...Typography.bodyMedium, fontFamily: 'Poppins_600SemiBold', flex: 1 },
  rolePill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: BorderRadius.full },
  roleLabel: { ...Typography.caption, fontSize: 10 },
  participantRating: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  ratingVal: { ...Typography.caption, fontSize: 10 },
  contactBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: BorderRadius.full, borderWidth: 1,
  },
  contactText: { ...Typography.caption, fontSize: 10, fontFamily: 'Poppins_600SemiBold' },

  // Quick messages
  sentBanner: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    padding: Spacing.sm, borderRadius: BorderRadius.md, borderWidth: 1, marginBottom: Spacing.sm,
  },
  sentText: { ...Typography.caption },
  quickMsgRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  quickMsgChip: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full, borderWidth: 1,
  },
  quickMsgText: { ...Typography.caption },

  // Timeline
  timeline: { gap: 0 },
  timelineRow: { flexDirection: 'row', minHeight: 52 },
  timelineDotCol: { width: 28, alignItems: 'center' },
  timelineDot: {
    width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
  },
  activePulse: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFF' },
  timelineLine: { width: 2, flex: 1, marginVertical: 2 },
  timelineContent: { flex: 1, paddingLeft: Spacing.sm, paddingBottom: Spacing.lg },
  timelineLabel: { ...Typography.bodyMedium, fontFamily: 'Poppins_600SemiBold' },
  timelineDetail: { ...Typography.caption, marginTop: 2 },

  // Button
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, paddingVertical: 14, borderRadius: BorderRadius.md,
  },
  primaryBtnText: { ...Typography.button, color: '#FFF' },
});
