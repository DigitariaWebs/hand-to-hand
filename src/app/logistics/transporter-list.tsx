import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useQuery } from '@tanstack/react-query';
import { Colors, ThemeColors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { RoutesAPI } from '@/services/api';
import { useLogisticsStore } from '@/stores/useLogisticsStore';
import { mockHandoffTransaction } from '@/services/mock/handoffs';
import { Route } from '@/types/logistics';
import { calculateCo2Saved, formatCo2, TransportType } from '@/utils/carbon';

type FlowState = 'browse' | 'pending_transporter' | 'pending_seller' | 'done';
type DayBucket = 'today' | 'tomorrow' | 'day_after' | 'later';

const TRANSPORT_ICONS: Record<string, string> = {
  foot: '🚶', bike: '🚴', scooter: '🛵', car: '🚗', bus: '🚌', train: '🚆',
  moto: '🏍️', voiture: '🚗', camionnette: '🚚', camion: '📦',
};

const STAGGER_MS = 3 * 60 * 1000; // 3 minutes

function startOfDay(d: Date): Date {
  const n = new Date(d);
  n.setHours(0, 0, 0, 0);
  return n;
}

function classifyDeparture(departureIso: string, now: Date = new Date()): DayBucket {
  const dep = startOfDay(new Date(departureIso));
  const today = startOfDay(now);
  const diffDays = Math.round((dep.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
  if (diffDays <= 0) return 'today';
  if (diffDays === 1) return 'tomorrow';
  if (diffDays === 2) return 'day_after';
  return 'later';
}

function formatDepartureTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

function formatCountdownToSlot(iso: string): string | null {
  const dep = new Date(iso).getTime();
  const diff = dep - Date.now();
  if (diff <= 0 || diff > 12 * 60 * 60 * 1000) return null;
  const h = Math.floor(diff / (60 * 60 * 1000));
  const m = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
  if (h >= 1) return `dans ${h}h${String(m).padStart(2, '0')}`;
  return `dans ${m} min`;
}

export default function TransporterListScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const {
    startMission,
    acceptMission,
    startSellerTimer,
    sellerAccept,
    isHubLocked,
    lockedHubId,
    favoriteTransporterIds,
  } = useLogisticsStore();

  const [flowState, setFlowState] = useState<FlowState>('browse');
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const timerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Stagger reveal for "today" section
  const loadStartRef = useRef<number>(Date.now());
  const [nowTick, setNowTick] = useState<number>(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Priority countdown for favorite transporters (existing behaviour)
  const [prioritySecondsLeft, setPrioritySecondsLeft] = useState(8 * 60);
  useEffect(() => {
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

  const {
    favoriteRoutes,
    todayRoutes,
    tomorrowRoutes,
    dayAfterRoutes,
  } = useMemo(() => {
    const all = routes ?? [];
    const favoriteRoutes: Route[] = [];
    const todayRoutes: Route[] = [];
    const tomorrowRoutes: Route[] = [];
    const dayAfterRoutes: Route[] = [];

    for (const r of all) {
      if (favoriteTransporterIds.includes(r.transporterId)) {
        favoriteRoutes.push(r);
        continue;
      }
      const bucket = classifyDeparture(r.departureTime);
      if (bucket === 'today') todayRoutes.push(r);
      else if (bucket === 'tomorrow') tomorrowRoutes.push(r);
      else if (bucket === 'day_after') dayAfterRoutes.push(r);
    }

    const byTime = (a: Route, b: Route) =>
      new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime();

    return {
      favoriteRoutes: favoriteRoutes.sort(byTime),
      todayRoutes: todayRoutes.sort(byTime),
      tomorrowRoutes: tomorrowRoutes.sort(byTime),
      dayAfterRoutes: dayAfterRoutes.sort(byTime),
    };
  }, [routes, favoriteTransporterIds]);

  // Stagger state: number of today-routes currently revealed
  const elapsed = nowTick - loadStartRef.current;
  const visibleTodayCount = Math.min(todayRoutes.length, Math.floor(elapsed / STAGGER_MS) + 1);
  const visibleToday = todayRoutes.slice(0, visibleTodayCount);
  const hiddenTodayCount = todayRoutes.length - visibleTodayCount;
  const nextRevealInSec =
    hiddenTodayCount > 0 ? Math.max(0, Math.ceil((STAGGER_MS - (elapsed % STAGGER_MS)) / 1000)) : 0;

  const handleSelect = useCallback(
    (route: Route) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      setSelectedRoute(route);
      setFlowState('pending_transporter');

      startMission(mockHandoffTransaction);

      const t1 = setTimeout(() => {
        acceptMission();
        startSellerTimer();
        setFlowState('pending_seller');

        const t2 = setTimeout(() => {
          sellerAccept();
          setFlowState('done');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

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

  useEffect(() => {
    return () => timerRefs.current.forEach(clearTimeout);
  }, []);

  // ── Loading overlay (unchanged) ───────────────────────────────────
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
          <Animated.View entering={FadeIn} style={styles.loadingStep}>
            <View style={[styles.loadingDot, { backgroundColor: flowState === 'pending_transporter' ? theme.warning : theme.success }]}>
              {flowState !== 'pending_transporter' ? (
                <Feather name="check" size={14} color="#FFF" />
              ) : (
                <Animated.View style={styles.pulse} />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.loadingLabel, { color: theme.text }]}>
                {flowState === 'pending_transporter' ? 'En attente du transporteur...' : 'Transporteur confirmé'}
              </Text>
              <Text style={[styles.loadingSub, { color: theme.textSecondary }]}>{selectedRoute?.transporterName}</Text>
            </View>
          </Animated.View>

          {flowState !== 'pending_transporter' && (
            <Animated.View entering={FadeIn} style={styles.loadingStep}>
              <View style={[styles.loadingDot, { backgroundColor: flowState === 'pending_seller' ? theme.warning : theme.success }]}>
                {flowState === 'done' ? (
                  <Feather name="check" size={14} color="#FFF" />
                ) : (
                  <Animated.View style={styles.pulse} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.loadingLabel, { color: theme.text }]}>
                  {flowState === 'pending_seller' ? 'En attente du vendeur...' : 'Vendeur confirmé'}
                </Text>
                <Text style={[styles.loadingSub, { color: theme.textSecondary }]}>
                  Délai de confirmation : 20 minutes
                </Text>
              </View>
            </Animated.View>
          )}

          {flowState === 'done' && (
            <Animated.View entering={FadeIn} style={styles.loadingStep}>
              <View style={[styles.loadingDot, { backgroundColor: theme.success }]}>
                <Feather name="users" size={14} color="#FFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.loadingLabel, { color: theme.success }]}>Groupe de mission créé !</Text>
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

  const allEmpty =
    favoriteRoutes.length === 0 &&
    todayRoutes.length === 0 &&
    tomorrowRoutes.length === 0 &&
    dayAfterRoutes.length === 0;

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

      {isHubLocked && lockedHubId && (
        <View style={[styles.infoBanner, { backgroundColor: `${theme.warning}08`, borderBottomColor: `${theme.warning}20` }]}>
          <Feather name="lock" size={14} color={theme.warning} />
          <Text style={[styles.infoText, { color: theme.warning }]}>
            Hub verrouillé pendant une mission active. Seules les missions sur ce hub sont disponibles.
          </Text>
        </View>
      )}

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
        {allEmpty && (
          <View style={[styles.emptyCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Feather name="truck" size={28} color={theme.textSecondary} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>Aucun transporteur disponible</Text>
            <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
              Aucun transporteur disponible sur cette route pour le moment. De nouveaux trajets sont publiés chaque jour — revenez bientôt !
            </Text>
          </View>
        )}

        {/* Section 1: Favoris */}
        {favoriteRoutes.length > 0 && (
          <>
            <SectionHeader
              icon="star"
              iconColor="#F59E0B"
              title="Vos transporteurs favoris"
              titleColor={theme.primary}
              rightChild={
                prioritySecondsLeft > 0 ? (
                  <View style={[styles.priorityPill, { backgroundColor: `${theme.primary}12` }]}>
                    <Feather name="clock" size={10} color={theme.primary} />
                    <Text style={[styles.priorityText, { color: theme.primary }]}>
                      Priorité favori : {priorityMins}:{String(prioritySecs).padStart(2, '0')}
                    </Text>
                  </View>
                ) : null
              }
            />
            {favoriteRoutes.map((item, index) => (
              <Animated.View key={item.id} entering={FadeInDown.delay(index * 60).springify()}>
                <RouteCard
                  route={item}
                  theme={theme}
                  isDark={isDark}
                  isFavorite
                  onPress={() => handleSelect(item)}
                />
              </Animated.View>
            ))}
          </>
        )}

        {/* Section 2: Disponibles aujourd'hui (with stagger) */}
        {todayRoutes.length > 0 && (
          <>
            <SectionHeader
              icon="circle"
              iconColor={theme.success}
              title="Disponibles aujourd'hui"
              titleColor={theme.success}
            />
            {visibleToday.map((item, index) => (
              <Animated.View key={item.id} entering={FadeInDown.delay(index * 60).springify()}>
                <RouteCard
                  route={item}
                  theme={theme}
                  isDark={isDark}
                  onPress={() => handleSelect(item)}
                />
              </Animated.View>
            ))}
            {hiddenTodayCount > 0 && (
              <Animated.View
                entering={FadeIn}
                style={[styles.teaserCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
                accessibilityLiveRegion="polite"
                accessibilityLabel={`Un nouveau transporteur sera visible dans ${Math.ceil(nextRevealInSec / 60)} minutes`}
              >
                <Feather name="clock" size={16} color={theme.textSecondary} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.teaserTitle, { color: theme.text }]}>
                    Un transporteur supplémentaire dans {Math.floor(nextRevealInSec / 60)}:
                    {String(nextRevealInSec % 60).padStart(2, '0')}
                  </Text>
                  <Text style={[styles.teaserSub, { color: theme.textSecondary }]}>
                    Patience, d'autres options arrivent...
                  </Text>
                </View>
              </Animated.View>
            )}
          </>
        )}
        {favoriteRoutes.length === 0 && todayRoutes.length === 0 && !allEmpty && (
          <View style={[styles.emptyRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.emptyRowText, { color: theme.textSecondary }]}>
              Aucun transporteur disponible aujourd'hui sur cette route.
            </Text>
          </View>
        )}

        {/* Section 3: Demain */}
        {tomorrowRoutes.length > 0 && (
          <>
            <SectionHeader
              icon="calendar"
              iconColor={theme.textSecondary}
              title="Disponibles demain"
              titleColor={theme.textSecondary}
            />
            {tomorrowRoutes.map((item, index) => (
              <Animated.View key={item.id} entering={FadeInDown.delay(index * 60).springify()}>
                <RouteCard
                  route={item}
                  theme={theme}
                  isDark={isDark}
                  onPress={() => handleSelect(item)}
                />
              </Animated.View>
            ))}
          </>
        )}

        {/* Section 4: Après-demain */}
        {dayAfterRoutes.length > 0 && (
          <>
            <SectionHeader
              icon="calendar"
              iconColor={theme.textSecondary}
              title="Disponibles après-demain"
              titleColor={theme.textSecondary}
            />
            {dayAfterRoutes.map((item, index) => (
              <Animated.View key={item.id} entering={FadeInDown.delay(index * 60).springify()}>
                <RouteCard
                  route={item}
                  theme={theme}
                  isDark={isDark}
                  onPress={() => handleSelect(item)}
                />
              </Animated.View>
            ))}
          </>
        )}

        {!allEmpty && (
          <Text style={[styles.futureNote, { color: theme.textSecondary }]}>
            Pas de transporteur prévu au-delà ? De nouveaux trajets sont publiés chaque jour.
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────

function SectionHeader({
  icon,
  iconColor,
  title,
  titleColor,
  rightChild,
}: {
  icon: keyof typeof Feather.glyphMap;
  iconColor: string;
  title: string;
  titleColor: string;
  rightChild?: React.ReactNode;
}) {
  return (
    <View style={styles.sectionHeaderRow} accessibilityRole="header">
      <Feather name={icon} size={14} color={iconColor} />
      <Text style={[styles.sectionHeaderText, { color: titleColor }]}>{title}</Text>
      {rightChild}
    </View>
  );
}

function RouteCard({
  route,
  theme,
  isDark,
  isFavorite,
  onPress,
}: {
  route: Route;
  theme: ThemeColors;
  isDark: boolean;
  isFavorite?: boolean;
  onPress: () => void;
}) {
  const transportTypeForCarbon: TransportType =
    route.transportMode === 'foot' || route.transportMode === 'bike'
      ? (route.transportMode as TransportType)
      : (route.transportMode as TransportType) ?? 'car';
  const co2Kg = calculateCo2Saved(route.distance, transportTypeForCarbon);
  const co2Label = formatCo2(co2Kg);

  const bucket = classifyDeparture(route.departureTime);
  const departureTime = formatDepartureTime(route.departureTime);
  const countdown = bucket === 'today' ? formatCountdownToSlot(route.departureTime) : null;

  const dayLabel =
    bucket === 'today'
      ? `Aujourd'hui à ${departureTime}${countdown ? ` · ${countdown}` : ''}`
      : bucket === 'tomorrow'
      ? `Demain à ${departureTime}`
      : bucket === 'day_after'
      ? `Après-demain à ${departureTime}`
      : departureTime;

  return (
    <TouchableOpacity
      style={[
        styles.routeCard,
        isFavorite
          ? { backgroundColor: isDark ? `${theme.primary}08` : '#F0F1FA', borderColor: theme.primary, borderLeftWidth: 3 }
          : { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
      activeOpacity={0.8}
      onPress={onPress}
    >
      {isFavorite && (
        <View style={[styles.favBadge, { backgroundColor: `${theme.primary}10` }]}>
          <Feather name="star" size={10} color="#F59E0B" />
          <Text style={[styles.favBadgeText, { color: theme.primary }]}>Transporteur favori</Text>
        </View>
      )}

      <View style={styles.transporterRow}>
        <Image source={{ uri: route.transporterAvatar }} style={styles.avatar} contentFit="cover" />
        <View style={styles.transporterInfo}>
          <Text style={[styles.transporterName, { color: theme.text }]}>{route.transporterName}</Text>
          <View style={styles.ratingRow}>
            <Feather name="star" size={12} color="#F59E0B" />
            <Text style={[styles.rating, { color: theme.textSecondary }]}>{route.transporterRating}</Text>
          </View>
          <Text style={[styles.dayLabel, { color: theme.textSecondary }]}>{dayLabel}</Text>
        </View>
        <View style={[styles.transportBadge, { backgroundColor: `${theme.primary}12` }]}>
          <Text style={styles.transportEmoji}>
            {TRANSPORT_ICONS[route.transportMode] ?? TRANSPORT_ICONS[route.vehicleType] ?? '🚗'}
          </Text>
        </View>
      </View>

      <View style={[styles.routeRow, { borderTopColor: theme.border }]}>
        <View style={styles.routePoint}>
          <Feather name="map-pin" size={12} color={theme.success} />
          <Text style={[styles.routeCity, { color: theme.text }]}>{route.origin.city}</Text>
        </View>
        <Feather name="arrow-right" size={14} color={theme.textSecondary} />
        <View style={styles.routePoint}>
          <Feather name="map-pin" size={12} color={theme.error} />
          <Text style={[styles.routeCity, { color: theme.text }]}>{route.destination.city}</Text>
        </View>
        <Text style={[styles.distance, { color: theme.textSecondary }]}>{route.distance} km</Text>
      </View>

      <View style={styles.detailRow}>
        <Text style={[styles.detailChip, { color: theme.textSecondary }]}>
          {route.maxPackages} colis · {route.maxSize} max · {route.maxWeight} kg
        </Text>
        <Text style={[styles.priceChip, { color: theme.success }]}>{route.pricePerItem}€/article</Text>
      </View>

      {/* Eco badge */}
      <View style={[styles.ecoBadge, { backgroundColor: `${theme.success}14` }]}>
        <Feather name="feather" size={12} color={theme.success} />
        <Text style={[styles.ecoText, { color: theme.success }]}>≈ {co2Label} évités</Text>
      </View>
    </TouchableOpacity>
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

  infoBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  infoText: { ...Typography.caption, flex: 1 },

  routeCard: {
    borderRadius: BorderRadius.md, borderWidth: 1, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 1,
  },
  transporterRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  transporterInfo: { flex: 1, gap: 3 },
  transporterName: { ...Typography.bodyMedium, fontFamily: 'Poppins_600SemiBold' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rating: { ...Typography.caption },
  dayLabel: { ...Typography.caption, fontSize: 11 },
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
    paddingHorizontal: Spacing.md, paddingBottom: Spacing.sm,
  },
  detailChip: { ...Typography.caption },
  priceChip: { ...Typography.captionMedium },

  ecoBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginHorizontal: Spacing.md, marginBottom: Spacing.md,
    paddingHorizontal: Spacing.sm, paddingVertical: 5,
    borderRadius: BorderRadius.sm, alignSelf: 'flex-start',
  },
  ecoText: { ...Typography.caption, fontSize: 11, fontFamily: 'Poppins_500Medium' },

  sectionHeaderRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    marginTop: Spacing.md, paddingBottom: Spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E5E7EB',
  },
  sectionHeaderText: {
    ...Typography.bodyMedium, fontFamily: 'Poppins_600SemiBold', fontSize: 14,
  },
  priorityPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 'auto',
    paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.full,
  },
  priorityText: { ...Typography.caption, fontSize: 10, fontFamily: 'Poppins_500Medium' },

  favBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    alignSelf: 'flex-end', paddingHorizontal: Spacing.sm, paddingVertical: 2,
    borderRadius: BorderRadius.full, marginTop: Spacing.sm, marginRight: Spacing.sm,
  },
  favBadgeText: { ...Typography.caption, fontSize: 11, fontFamily: 'Poppins_500Medium' },

  teaserCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    padding: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1,
    borderStyle: 'dashed',
  },
  teaserTitle: { ...Typography.bodyMedium, fontFamily: 'Poppins_600SemiBold' },
  teaserSub: { ...Typography.caption, marginTop: 2 },

  emptyCard: {
    alignItems: 'center', gap: Spacing.sm,
    padding: Spacing.xl, borderRadius: BorderRadius.lg, borderWidth: 1,
  },
  emptyTitle: { ...Typography.h3, textAlign: 'center' },
  emptySub: { ...Typography.body, textAlign: 'center' },

  emptyRow: {
    padding: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1,
  },
  emptyRowText: { ...Typography.caption, textAlign: 'center' },

  futureNote: { ...Typography.caption, textAlign: 'center', marginTop: Spacing.md },

  // Loading
  loadingWrap: { flex: 1, padding: Spacing.xl, gap: Spacing.xl, paddingTop: 60 },
  loadingStep: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },
  loadingDot: {
    width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
  },
  pulse: { width: 10, height: 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.6)' },
  loadingLabel: { ...Typography.bodyMedium, fontFamily: 'Poppins_600SemiBold' },
  loadingSub: { ...Typography.caption, marginTop: 2 },
});
