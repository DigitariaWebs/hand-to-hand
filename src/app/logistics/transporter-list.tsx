import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  FlatList,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useQuery } from '@tanstack/react-query';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { RoutesAPI } from '@/services/api';
import { useLogisticsStore } from '@/stores/useLogisticsStore';
import { mockHandoffTransaction } from '@/services/mock/handoffs';
import { Route } from '@/types/logistics';

type FlowState = 'browse' | 'pending_transporter' | 'pending_seller' | 'done';

export default function TransporterListScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { startMission, acceptMission, startSellerTimer, sellerAccept, isHubLocked, lockedHubId, favoriteTransporterIds } = useLogisticsStore();

  const [flowState, setFlowState] = useState<FlowState>('browse');
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const timerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Priority countdown for favorite transporters (mock: 8 min window)
  const [prioritySecondsLeft, setPrioritySecondsLeft] = useState(8 * 60);
  React.useEffect(() => {
    if (prioritySecondsLeft <= 0) return;
    const id = setInterval(() => setPrioritySecondsLeft((p) => Math.max(0, p - 1)), 1000);
    return () => clearInterval(id);
  }, [prioritySecondsLeft]);
  const priorityMins = Math.floor(prioritySecondsLeft / 60);
  const prioritySecs = prioritySecondsLeft % 60;

  const { data: routes } = useQuery({
    queryKey: ['routes'],
    queryFn: () => RoutesAPI.list(),
  });

  // Split routes into favorites and others
  const favoriteRoutes = (routes ?? []).filter((r) => favoriteTransporterIds.includes(r.transporterId));
  const otherRoutes = (routes ?? []).filter((r) => !favoriteTransporterIds.includes(r.transporterId));

  const TRANSPORT_ICONS: Record<string, string> = {
    foot: '🚶', bike: '🚴', scooter: '🛵', car: '🚗', bus: '🚌', train: '🚆',
    moto: '🏍️', voiture: '🚗', camionnette: '🚚', camion: '📦',
  };

  const handleSelect = useCallback(
    (route: Route) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      setSelectedRoute(route);
      setFlowState('pending_transporter');

      // Create the mission
      startMission(mockHandoffTransaction);

      // Mock: transporter auto-accepts after 2s
      const t1 = setTimeout(() => {
        acceptMission();
        startSellerTimer();
        setFlowState('pending_seller');

        // Mock: seller auto-accepts after 3s
        const t2 = setTimeout(() => {
          sellerAccept();
          setFlowState('done');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

          // Navigate to mission group after brief delay
          const t3 = setTimeout(() => {
            router.push('/logistics/mission-group');
          }, 1200);
          timerRefs.current.push(t3);
        }, 3000);
        timerRefs.current.push(t2);
      }, 2000);
      timerRefs.current.push(t1);
    },
    [startMission, acceptMission, startSellerTimer, sellerAccept, router],
  );

  // Cleanup on unmount
  React.useEffect(() => {
    return () => timerRefs.current.forEach(clearTimeout);
  }, []);

  // ── Loading overlay ───────────────────────────────────────────────
  if (flowState !== 'browse') {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <LinearGradient
          colors={[theme.primary, theme.primaryGradientEnd]}
          style={[styles.header, { paddingTop: insets.top + 8 }]}
        >
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={20} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Confirmation en cours</Text>
        </LinearGradient>

        <View style={styles.loadingWrap}>
          {/* Step 1: Transporter */}
          <Animated.View entering={FadeIn} style={styles.loadingStep}>
            <View
              style={[
                styles.loadingDot,
                {
                  backgroundColor:
                    flowState === 'pending_transporter'
                      ? theme.warning
                      : theme.success,
                },
              ]}
            >
              {flowState !== 'pending_transporter' ? (
                <Feather name="check" size={14} color="#FFF" />
              ) : (
                <Animated.View style={styles.pulse} />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.loadingLabel, { color: theme.text }]}>
                {flowState === 'pending_transporter'
                  ? 'En attente du transporteur...'
                  : 'Transporteur confirmé'}
              </Text>
              <Text style={[styles.loadingSub, { color: theme.textSecondary }]}>
                {selectedRoute?.transporterName}
              </Text>
            </View>
          </Animated.View>

          {/* Step 2: Seller */}
          {flowState !== 'pending_transporter' && (
            <Animated.View entering={FadeIn} style={styles.loadingStep}>
              <View
                style={[
                  styles.loadingDot,
                  {
                    backgroundColor:
                      flowState === 'pending_seller' ? theme.warning : theme.success,
                  },
                ]}
              >
                {flowState === 'done' ? (
                  <Feather name="check" size={14} color="#FFF" />
                ) : (
                  <Animated.View style={styles.pulse} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.loadingLabel, { color: theme.text }]}>
                  {flowState === 'pending_seller'
                    ? 'En attente du vendeur...'
                    : 'Vendeur confirmé'}
                </Text>
                <Text style={[styles.loadingSub, { color: theme.textSecondary }]}>
                  Délai de confirmation : 20 minutes
                </Text>
              </View>
            </Animated.View>
          )}

          {/* Step 3: Group created */}
          {flowState === 'done' && (
            <Animated.View entering={FadeIn} style={styles.loadingStep}>
              <View style={[styles.loadingDot, { backgroundColor: theme.success }]}>
                <Feather name="users" size={14} color="#FFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.loadingLabel, { color: theme.success }]}>
                  Groupe de mission créé !
                </Text>
                <Text style={[styles.loadingSub, { color: theme.textSecondary }]}>
                  Communication activée entre les 3 parties
                </Text>
              </View>
            </Animated.View>
          )}
        </View>
      </View>
    );
  }

  // ── Browse transporters ───────────────────────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={[theme.primary, theme.primaryGradientEnd]}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transporteurs disponibles</Text>
      </LinearGradient>

      {/* Hub locked banner */}
      {isHubLocked && lockedHubId && (
        <View style={[styles.infoBanner, { backgroundColor: `${theme.warning}08`, borderBottomColor: `${theme.warning}20` }]}>
          <Feather name="lock" size={14} color={theme.warning} />
          <Text style={[styles.infoText, { color: theme.warning }]}>
            Hub verrouillé pendant une mission active. Seules les missions sur ce hub sont disponibles.
          </Text>
        </View>
      )}

      {/* Info banner */}
      <View style={[styles.infoBanner, { backgroundColor: `${theme.primary}06`, borderBottomColor: `${theme.primary}15` }]}>
        <Feather name="info" size={14} color={theme.primary} />
        <Text style={[styles.infoText, { color: theme.primary }]}>
          Sélectionnez un transporteur. Il recevra une notification et aura quelques minutes pour accepter.
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.md, paddingBottom: 100 }}
      >
        {/* Favorite transporters section */}
        {favoriteRoutes.length > 0 && (
          <>
            <View style={styles.sectionHeaderRow}>
              <Feather name="star" size={14} color="#F59E0B" />
              <Text style={[styles.sectionHeaderText, { color: theme.primary }]}>
                Vos transporteurs favoris
              </Text>
              {prioritySecondsLeft > 0 && (
                <View style={[styles.priorityPill, { backgroundColor: `${theme.primary}12` }]}>
                  <Feather name="clock" size={10} color={theme.primary} />
                  <Text style={[styles.priorityText, { color: theme.primary }]}>
                    Priorité favori : {priorityMins}:{String(prioritySecs).padStart(2, '0')}
                  </Text>
                </View>
              )}
            </View>
            {favoriteRoutes.map((item, index) => (
              <Animated.View key={item.id} entering={FadeInDown.delay(index * 60).springify()}>
                <TouchableOpacity
                  style={[
                    styles.routeCard,
                    {
                      backgroundColor: isDark ? `${theme.primary}08` : '#F0F1FA',
                      borderColor: theme.primary,
                      borderLeftWidth: 3,
                    },
                  ]}
                  activeOpacity={0.8}
                  onPress={() => handleSelect(item)}
                >
                  {/* Favorite badge */}
                  <View style={[styles.favBadge, { backgroundColor: `${theme.primary}10` }]}>
                    <Feather name="star" size={10} color="#F59E0B" />
                    <Text style={[styles.favBadgeText, { color: theme.primary }]}>Transporteur favori</Text>
                  </View>

                  <View style={styles.transporterRow}>
                    <Image source={{ uri: item.transporterAvatar }} style={styles.avatar} contentFit="cover" />
                    <View style={styles.transporterInfo}>
                      <Text style={[styles.transporterName, { color: theme.text }]}>{item.transporterName}</Text>
                      <View style={styles.ratingRow}>
                        <Feather name="star" size={12} color="#F59E0B" />
                        <Text style={[styles.rating, { color: theme.textSecondary }]}>{item.transporterRating}</Text>
                      </View>
                      <Text style={[Typography.caption, { color: theme.success, fontSize: 10 }]}>
                        Relation de confiance
                      </Text>
                    </View>
                    <View style={[styles.transportBadge, { backgroundColor: `${theme.primary}12` }]}>
                      <Text style={styles.transportEmoji}>
                        {TRANSPORT_ICONS[item.transportMode] ?? TRANSPORT_ICONS[item.vehicleType] ?? '🚗'}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.routeRow, { borderTopColor: theme.border }]}>
                    <View style={styles.routePoint}>
                      <Feather name="map-pin" size={12} color={theme.success} />
                      <Text style={[styles.routeCity, { color: theme.text }]}>{item.origin.city}</Text>
                    </View>
                    <Feather name="arrow-right" size={14} color={theme.textSecondary} />
                    <View style={styles.routePoint}>
                      <Feather name="map-pin" size={12} color={theme.error} />
                      <Text style={[styles.routeCity, { color: theme.text }]}>{item.destination.city}</Text>
                    </View>
                    <Text style={[styles.distance, { color: theme.textSecondary }]}>{item.distance} km</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={[styles.detailChip, { color: theme.textSecondary }]}>
                      {item.maxPackages} colis · {item.maxSize} max · {item.maxWeight} kg
                    </Text>
                    <Text style={[styles.priceChip, { color: theme.success }]}>{item.pricePerItem}€/article</Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </>
        )}

        {/* Other transporters section */}
        {otherRoutes.length > 0 && (
          <>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionHeaderText, { color: theme.textSecondary }]}>
                {favoriteRoutes.length > 0 ? 'Autres transporteurs disponibles' : 'Transporteurs disponibles'}
              </Text>
            </View>
            {otherRoutes.map((item, index) => (
              <Animated.View key={item.id} entering={FadeInDown.delay((favoriteRoutes.length + index) * 60).springify()}>
                <TouchableOpacity
                  style={[styles.routeCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
                  activeOpacity={0.8}
                  onPress={() => handleSelect(item)}
                >
                  <View style={styles.transporterRow}>
                    <Image source={{ uri: item.transporterAvatar }} style={styles.avatar} contentFit="cover" />
                    <View style={styles.transporterInfo}>
                      <Text style={[styles.transporterName, { color: theme.text }]}>{item.transporterName}</Text>
                      <View style={styles.ratingRow}>
                        <Feather name="star" size={12} color="#F59E0B" />
                        <Text style={[styles.rating, { color: theme.textSecondary }]}>{item.transporterRating}</Text>
                      </View>
                    </View>
                    <View style={[styles.transportBadge, { backgroundColor: `${theme.primary}12` }]}>
                      <Text style={styles.transportEmoji}>
                        {TRANSPORT_ICONS[item.transportMode] ?? TRANSPORT_ICONS[item.vehicleType] ?? '🚗'}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.routeRow, { borderTopColor: theme.border }]}>
                    <View style={styles.routePoint}>
                      <Feather name="map-pin" size={12} color={theme.success} />
                      <Text style={[styles.routeCity, { color: theme.text }]}>{item.origin.city}</Text>
                    </View>
                    <Feather name="arrow-right" size={14} color={theme.textSecondary} />
                    <View style={styles.routePoint}>
                      <Feather name="map-pin" size={12} color={theme.error} />
                      <Text style={[styles.routeCity, { color: theme.text }]}>{item.destination.city}</Text>
                    </View>
                    <Text style={[styles.distance, { color: theme.textSecondary }]}>{item.distance} km</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={[styles.detailChip, { color: theme.textSecondary }]}>
                      {item.maxPackages} colis · {item.maxSize} max · {item.maxWeight} kg
                    </Text>
                    <Text style={[styles.priceChip, { color: theme.success }]}>{item.pricePerItem}€/article</Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </>
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
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)' },
  headerTitle: { ...Typography.h3, color: '#FFF', flex: 1 },

  // Info banner
  infoBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  infoText: { ...Typography.caption, flex: 1 },

  // Route card
  routeCard: {
    borderRadius: BorderRadius.md, borderWidth: 1, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 1,
  },
  transporterRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md,
  },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  transporterInfo: { flex: 1, gap: 3 },
  transporterName: { ...Typography.bodyMedium, fontFamily: 'Poppins_600SemiBold' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rating: { ...Typography.caption },
  transportBadge: {
    width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
  },
  transportEmoji: { fontSize: 18 },
  routeRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  routePoint: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  routeCity: { ...Typography.bodyMedium },
  distance: { ...Typography.caption, marginLeft: 'auto' },
  detailRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingBottom: Spacing.md,
  },
  detailChip: { ...Typography.caption },
  priceChip: { ...Typography.captionMedium },

  // Section headers
  sectionHeaderRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.sm,
  },
  sectionHeaderText: {
    ...Typography.bodyMedium, fontFamily: 'Poppins_600SemiBold', fontSize: 14,
  },
  priorityPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 'auto',
    paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.full,
  },
  priorityText: { ...Typography.caption, fontSize: 10, fontFamily: 'Poppins_500Medium' },

  // Favorite badge
  favBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    alignSelf: 'flex-end', paddingHorizontal: Spacing.sm, paddingVertical: 2,
    borderRadius: BorderRadius.full, marginTop: Spacing.sm, marginRight: Spacing.sm,
  },
  favBadgeText: { ...Typography.caption, fontSize: 11, fontFamily: 'Poppins_500Medium' },

  // Loading states
  loadingWrap: { flex: 1, padding: Spacing.xl, gap: Spacing.xl, paddingTop: 60 },
  loadingStep: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },
  loadingDot: {
    width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
  },
  pulse: { width: 10, height: 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.6)' },
  loadingLabel: { ...Typography.bodyMedium, fontFamily: 'Poppins_600SemiBold' },
  loadingSub: { ...Typography.caption, marginTop: 2 },
});
