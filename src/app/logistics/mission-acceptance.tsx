import React, { useState, useEffect, useRef } from 'react';
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
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { useLogisticsStore } from '@/stores/useLogisticsStore';
import { mockHubs } from '@/services/mock/hubs';

const OFFER_DURATION_S = 300; // 5 minutes to accept

export default function MissionAcceptanceScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { mission, acceptMission, cancelMission, startSellerTimer } = useLogisticsStore();
  const [secondsLeft, setSecondsLeft] = useState(OFFER_DURATION_S);
  const [accepted, setAccepted] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const handoff = mission?.handoff;
  const originHub = mockHubs.find((h) => h.id === handoff?.originHubId);
  const destHub = mockHubs.find((h) => h.id === handoff?.destinationHubId);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          cancelMission();
          router.back();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const formatTimer = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const handleAccept = () => {
    clearInterval(timerRef.current);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setAccepted(true);
    acceptMission();
    startSellerTimer();
    setTimeout(() => router.replace('/logistics/seller-confirmation'), 1500);
  };

  const handleRefuse = () => {
    clearInterval(timerRef.current);
    cancelMission();
    router.back();
  };

  if (!handoff) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={[Typography.body, { color: theme.textSecondary }]}>Aucune mission en cours</Text>
      </View>
    );
  }

  if (accepted) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.acceptedWrap, { paddingTop: insets.top + 80 }]}>
          <Animated.View entering={FadeIn.duration(400)} style={styles.acceptedContent}>
            <View style={[styles.acceptedIcon, { backgroundColor: `${theme.success}15` }]}>
              <Feather name="check-circle" size={56} color={theme.success} />
            </View>
            <Text style={[styles.acceptedTitle, { color: theme.text }]}>Mission acceptée !</Text>
            <Text style={[styles.acceptedSub, { color: theme.textSecondary }]}>
              En attente de la confirmation du vendeur...
            </Text>
          </Animated.View>
        </View>
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
        <Text style={styles.headerTitle}>Nouvelle mission</Text>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
      >
        {/* Timer */}
        <Animated.View entering={FadeInUp.delay(100)} style={[styles.timerCard, { backgroundColor: `${theme.warning}10`, borderColor: `${theme.warning}25` }]}>
          <Feather name="clock" size={18} color={theme.warning} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.timerLabel, { color: theme.warning }]}>Offre disponible encore</Text>
            <Text style={[styles.timerValue, { color: theme.warning }]}>{formatTimer(secondsLeft)}</Text>
          </View>
        </Animated.View>

        {/* Product */}
        <Animated.View entering={FadeInUp.delay(200)} style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Image source={{ uri: handoff.productImage }} style={styles.productImg} contentFit="cover" />
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>{handoff.productName}</Text>
            <Text style={[styles.cardSub, { color: theme.textSecondary }]}>
              {handoff.price.toFixed(2)}€ · Frais de livraison : {handoff.deliveryFee.toFixed(2)}€
            </Text>
          </View>
        </Animated.View>

        {/* Route */}
        <Animated.View entering={FadeInUp.delay(300)} style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={[styles.iconCircle, { backgroundColor: `${theme.primary}12` }]}>
            <Feather name="navigation" size={18} color={theme.primary} />
          </View>
          <View style={{ flex: 1, gap: 6 }}>
            <View style={styles.routeRow}>
              <Feather name="map-pin" size={12} color={theme.success} />
              <Text style={[styles.routeText, { color: theme.text }]}>
                {originHub?.name ?? 'Hub de départ'}
              </Text>
            </View>
            <View style={[styles.routeLine, { borderLeftColor: theme.border }]} />
            <View style={styles.routeRow}>
              <Feather name="map-pin" size={12} color={theme.error} />
              <Text style={[styles.routeText, { color: theme.text }]}>
                {destHub?.name ?? 'Hub d\'arrivée'}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Schedule */}
        <Animated.View entering={FadeInUp.delay(400)} style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={[styles.iconCircle, { backgroundColor: `${theme.primary}12` }]}>
            <Feather name="clock" size={18} color={theme.primary} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Horaires prévus</Text>
            <Text style={[styles.cardSub, { color: theme.textSecondary }]}>
              Prise en charge : {new Date(handoff.pickupWindowStart).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              {' – '}
              {new Date(handoff.pickupWindowEnd).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </Animated.View>

        {/* Buyer info */}
        <Animated.View entering={FadeInUp.delay(500)} style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Image source={{ uri: handoff.buyerAvatar }} style={styles.avatar} contentFit="cover" />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>{handoff.buyerName}</Text>
            <View style={styles.ratingRow}>
              <Feather name="star" size={12} color="#F59E0B" />
              <Text style={[styles.ratingText, { color: theme.textSecondary }]}>4.7</Text>
              <Text style={[styles.cardSub, { color: theme.textSecondary }]}> · Acheteur</Text>
            </View>
          </View>
        </Animated.View>

        {/* Earnings */}
        <Animated.View entering={FadeInUp.delay(600)} style={[styles.earningsCard, { backgroundColor: `${theme.success}10`, borderColor: `${theme.success}25` }]}>
          <Feather name="dollar-sign" size={22} color={theme.success} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.earningsLabel, { color: theme.success }]}>Vous gagnerez</Text>
            <Text style={[styles.earningsValue, { color: theme.success }]}>{handoff.deliveryFee.toFixed(2)}€</Text>
          </View>
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
            <Text style={styles.acceptText}>Accepter la mission</Text>
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

  timerCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    padding: Spacing.lg, borderRadius: BorderRadius.md, borderWidth: 1,
  },
  timerLabel: { ...Typography.caption },
  timerValue: { ...Typography.h2, fontSize: 22 },

  card: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    padding: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1,
  },
  cardTitle: { ...Typography.bodyMedium, fontFamily: 'Poppins_600SemiBold' },
  cardSub: { ...Typography.caption },
  productImg: { width: 56, height: 56, borderRadius: BorderRadius.sm },
  iconCircle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 44, height: 44, borderRadius: 22 },

  routeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  routeText: { ...Typography.body },
  routeLine: { borderLeftWidth: 2, borderStyle: 'dashed', height: 16, marginLeft: 5 },

  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { ...Typography.captionMedium },

  earningsCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    padding: Spacing.lg, borderRadius: BorderRadius.md, borderWidth: 1,
  },
  earningsLabel: { ...Typography.caption },
  earningsValue: { ...Typography.h1, fontSize: 28 },

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
  acceptText: { ...Typography.button, color: '#FFF' },

  acceptedWrap: { flex: 1, alignItems: 'center' },
  acceptedContent: { alignItems: 'center', gap: Spacing.lg },
  acceptedIcon: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center' },
  acceptedTitle: { ...Typography.h1, textAlign: 'center' },
  acceptedSub: { ...Typography.body, textAlign: 'center' },
});
