import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import Animated, { FadeIn, FadeInUp, useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { useLogisticsStore } from '@/stores/useLogisticsStore';
import { mockHubs } from '@/services/mock/hubs';

const TIMER_TOTAL_S = 20 * 60; // 20 minutes

export default function SellerConfirmationScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { mission, sellerAccept, cancelMission } = useLogisticsStore();
  const [secondsLeft, setSecondsLeft] = useState(() => {
    if (mission?.sellerTimerEnd) {
      return Math.max(0, Math.round((mission.sellerTimerEnd - Date.now()) / 1000));
    }
    return TIMER_TOTAL_S;
  });
  const [result, setResult] = useState<'accepted' | 'expired' | null>(null);
  const timerRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const progress = useSharedValue(secondsLeft / TIMER_TOTAL_S);
  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const handoff = mission?.handoff;
  const originHub = mockHubs.find((h) => h.id === handoff?.originHubId);
  const transporter = mission?.groupMembers.find((m) => m.role === 'transporter');

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        const next = prev - 1;
        progress.value = withTiming(Math.max(0, next / TIMER_TOTAL_S), { duration: 900 });
        if (next <= 0) {
          clearInterval(timerRef.current);
          setResult('expired');
          cancelMission();
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const formatTimer = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const handleAccept = useCallback(() => {
    clearInterval(timerRef.current);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setResult('accepted');
    sellerAccept();
    setTimeout(() => router.replace('/logistics/mission-group'), 1500);
  }, [sellerAccept, router]);

  const handleRefuse = useCallback(() => {
    clearInterval(timerRef.current);
    cancelMission();
    router.back();
  }, [cancelMission, router]);

  if (!handoff || !transporter) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={[Typography.body, { color: theme.textSecondary }]}>Aucune mission en attente</Text>
      </View>
    );
  }

  // Expired state
  if (result === 'expired') {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.resultWrap, { paddingTop: insets.top + 80 }]}>
          <Animated.View entering={FadeIn.duration(400)} style={styles.resultContent}>
            <View style={[styles.resultIcon, { backgroundColor: `${theme.warning}15` }]}>
              <Feather name="clock" size={52} color={theme.warning} />
            </View>
            <Text style={[styles.resultTitle, { color: theme.text }]}>Délai expiré</Text>
            <Text style={[styles.resultSub, { color: theme.textSecondary }]}>
              La mission a été annulée. Le transporteur a été libéré. Pas de souci, vous pourrez
              en choisir un autre.
            </Text>
            <TouchableOpacity onPress={() => router.replace('/')} style={{ marginTop: Spacing.xxl }}>
              <LinearGradient
                colors={[theme.primary, theme.primaryGradientEnd]}
                style={styles.primaryBtn}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.primaryBtnText}>Retour à l'accueil</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    );
  }

  // Accepted state
  if (result === 'accepted') {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.resultWrap, { paddingTop: insets.top + 80 }]}>
          <Animated.View entering={FadeIn.duration(400)} style={styles.resultContent}>
            <View style={[styles.resultIcon, { backgroundColor: `${theme.success}15` }]}>
              <Feather name="check-circle" size={52} color={theme.success} />
            </View>
            <Text style={[styles.resultTitle, { color: theme.text }]}>C'est parti !</Text>
            <Text style={[styles.resultSub, { color: theme.textSecondary }]}>
              Le groupe de mission est créé. Vous pouvez maintenant communiquer avec le
              transporteur et l'acheteur.
            </Text>
          </Animated.View>
        </View>
      </View>
    );
  }

  const urgency = secondsLeft <= 300 ? theme.error : secondsLeft <= 900 ? theme.warning : theme.primary;

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
        <Text style={styles.headerTitle}>Demande de prise en charge</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* Timer — prominent */}
        <Animated.View
          entering={FadeInUp.delay(100)}
          style={[styles.timerBlock, { borderColor: `${urgency}30` }]}
        >
          <Text style={[styles.timerTitle, { color: urgency }]}>Temps restant</Text>
          <Text style={[styles.timerBig, { color: urgency }]}>{formatTimer(secondsLeft)}</Text>
          <View style={[styles.progressTrack, { backgroundColor: `${urgency}15` }]}>
            <Animated.View style={[styles.progressFill, { backgroundColor: urgency }, progressStyle]} />
          </View>
          <Text style={[styles.timerHint, { color: theme.textSecondary }]}>
            {secondsLeft <= 300
              ? 'Moins de 5 minutes — prenez votre décision'
              : 'Prenez votre temps, vous êtes dans la fenêtre prévue'}
          </Text>
        </Animated.View>

        {/* Transporter info */}
        <Animated.View entering={FadeInUp.delay(200)} style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Image source={{ uri: transporter.avatar }} style={styles.avatar} contentFit="cover" />
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>{transporter.name}</Text>
            <View style={styles.badgeRow}>
              <View style={styles.ratingRow}>
                <Feather name="star" size={12} color="#F59E0B" />
                <Text style={[styles.ratingText, { color: theme.textSecondary }]}>{transporter.rating}</Text>
              </View>
              <View style={[styles.verifiedBadge, { backgroundColor: `${theme.success}12` }]}>
                <Feather name="shield" size={10} color={theme.success} />
                <Text style={[styles.verifiedText, { color: theme.success }]}>Vérifié</Text>
              </View>
            </View>
          </View>
          <View style={[styles.roleChip, { backgroundColor: `${theme.primary}12` }]}>
            <Feather name="truck" size={12} color={theme.primary} />
            <Text style={[styles.roleText, { color: theme.primary }]}>Transporteur</Text>
          </View>
        </Animated.View>

        {/* Schedule */}
        <Animated.View entering={FadeInUp.delay(300)} style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={[styles.iconCircle, { backgroundColor: `${theme.primary}12` }]}>
            <Feather name="calendar" size={18} color={theme.primary} />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Passage prévu</Text>
            <Text style={[styles.cardSub, { color: theme.textSecondary }]}>
              {originHub?.name ?? 'Hub de départ'}
            </Text>
            <Text style={[styles.cardSub, { color: theme.textSecondary }]}>
              Le{' '}
              {new Date(handoff.pickupWindowStart).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </Text>
            <View style={[styles.windowChip, { backgroundColor: `${theme.primary}10` }]}>
              <Feather name="clock" size={12} color={theme.primary} />
              <Text style={[styles.windowText, { color: theme.primary }]}>
                Fenêtre :{' '}
                {new Date(handoff.pickupWindowStart).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                {' – '}
                {new Date(handoff.pickupWindowEnd).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Info message */}
        <Animated.View entering={FadeInUp.delay(400)} style={[styles.infoCard, { backgroundColor: `${theme.primary}06`, borderColor: `${theme.primary}15` }]}>
          <Feather name="info" size={16} color={theme.primary} />
          <Text style={[styles.infoText, { color: theme.primary }]}>
            En acceptant, vous vous engagez à déposer le colis au hub avant la fin de la fenêtre
            prévue. Un léger décalage peut arriver, merci pour votre patience.
          </Text>
        </Animated.View>
      </ScrollView>

      {/* Bottom buttons */}
      <View style={[styles.bottomBar, { backgroundColor: theme.surface, borderTopColor: theme.border, paddingBottom: insets.bottom + 8 }]}>
        <TouchableOpacity onPress={handleRefuse} style={[styles.refuseBtn, { borderColor: theme.error }]}>
          <Text style={[styles.refuseText, { color: theme.error }]}>Refuser</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleAccept} style={{ flex: 2 }}>
          <LinearGradient
            colors={[theme.primary, theme.primaryGradientEnd]}
            style={styles.acceptBtn}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Feather name="check" size={18} color="#FFF" />
            <Text style={styles.acceptBtnText}>Accepter</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
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
  headerTitle: { ...Typography.h3, color: '#FFF' },
  body: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: 120 },

  // Timer block
  timerBlock: {
    alignItems: 'center', gap: Spacing.sm,
    padding: Spacing.xl, borderRadius: BorderRadius.lg, borderWidth: 1.5,
    backgroundColor: '#FFF',
  },
  timerTitle: { ...Typography.captionMedium, textTransform: 'uppercase', letterSpacing: 1 },
  timerBig: { ...Typography.h1, fontSize: 48, lineHeight: 56 },
  progressTrack: { width: '100%', height: 6, borderRadius: 3, overflow: 'hidden', marginTop: Spacing.xs },
  progressFill: { height: '100%', borderRadius: 3 },
  timerHint: { ...Typography.caption, textAlign: 'center', marginTop: Spacing.xs },

  // Cards
  card: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    padding: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1,
  },
  cardTitle: { ...Typography.bodyMedium, fontFamily: 'Poppins_600SemiBold' },
  cardSub: { ...Typography.caption },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },

  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingText: { ...Typography.captionMedium },
  verifiedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: BorderRadius.full,
  },
  verifiedText: { ...Typography.caption, fontSize: 10 },
  roleChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: BorderRadius.full,
  },
  roleText: { ...Typography.caption, fontSize: 10 },

  windowChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: BorderRadius.full, alignSelf: 'flex-start',
    marginTop: 4,
  },
  windowText: { ...Typography.captionMedium, fontSize: 11 },

  infoCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
    padding: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1,
  },
  infoText: { ...Typography.caption, flex: 1 },

  // Bottom
  bottomBar: {
    flexDirection: 'row', gap: Spacing.md,
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, borderTopWidth: StyleSheet.hairlineWidth,
  },
  refuseBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, borderRadius: BorderRadius.md, borderWidth: 1.5,
  },
  refuseText: { ...Typography.button },
  acceptBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, paddingVertical: 14, borderRadius: BorderRadius.md,
  },
  acceptBtnText: { ...Typography.button, color: '#FFF' },

  // Results
  resultWrap: { flex: 1, alignItems: 'center' },
  resultContent: { alignItems: 'center', gap: Spacing.lg, maxWidth: 300 },
  resultIcon: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center' },
  resultTitle: { ...Typography.h1, textAlign: 'center' },
  resultSub: { ...Typography.body, textAlign: 'center' },
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, paddingVertical: 14, paddingHorizontal: Spacing.xxl, borderRadius: BorderRadius.md,
  },
  primaryBtnText: { ...Typography.button, color: '#FFF' },
});
