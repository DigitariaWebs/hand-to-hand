import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { mockAuctions } from '@/services/mock/auctions';
import { mockProducts } from '@/services/mock/products';
import { Toast } from '@/components/ui/Toast';
import { AuctionBid } from '@/types/product';
import { formatPrice, formatRelativeTime } from '@/utils';

const { width: W, height: H } = Dimensions.get('window');
const GALLERY_H = H * 0.42;

const AUTO_BIDDERS = [
  { id: 'ab1', username: 'pierre_r' },
  { id: 'ab2', username: 'yasmine_k' },
  { id: 'ab3', username: 'nicolas_f' },
  { id: 'ab4', username: 'celine_v' },
  { id: 'ab5', username: 'omar_s' },
];

const WATCHER_COUNTS: Record<string, number> = {
  a1: 34, a2: 67, a3: 12,
};

const QUICK_INCREMENTS = [5, 10, 20];

const CONFETTI_DEFS = [
  { dx: -52, dy: -68, color: '#F59E0B' },
  { dx: -18, dy: -88, color: '#10B981' },
  { dx: 22, dy: -80, color: '#3B82F6' },
  { dx: 52, dy: -65, color: '#EF4444' },
  { dx: 0,  dy: -55, color: '#8B5CF6' },
  { dx: -36, dy: -48, color: '#F97316' },
];

// ── Helpers ────────────────────────────────────────────────────────────────

function computeTimeLeft(endsAt: string) {
  const total = Math.max(
    0,
    Math.floor((new Date(endsAt).getTime() - Date.now()) / 1000),
  );
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
    total,
  };
}

function pad(n: number) {
  return n.toString().padStart(2, '0');
}

// ── Confetti particle ──────────────────────────────────────────────────────

function ConfettiParticle({ dx, dy, color }: { dx: number; dy: number; color: string }) {
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1.2);

  useEffect(() => {
    tx.value = withTiming(dx, { duration: 550 });
    ty.value = withTiming(dy, { duration: 550 });
    scale.value = withTiming(0.3, { duration: 550 });
    opacity.value = withDelay(350, withTiming(0, { duration: 200 }));
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: 9,
          height: 9,
          borderRadius: 4.5,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}

function BidConfettiOverlay({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 700);
    return () => clearTimeout(t);
  }, []);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
      <View style={styles.confettiOrigin}>
        {CONFETTI_DEFS.map((p, i) => (
          <ConfettiParticle key={i} dx={p.dx} dy={p.dy} color={p.color} />
        ))}
      </View>
    </View>
  );
}

// ── Countdown box ──────────────────────────────────────────────────────────

function CountdownBox({
  value,
  label,
  urgent,
  theme,
}: {
  value: number;
  label: string;
  urgent: boolean;
  theme: typeof Colors.light;
}) {
  return (
    <View style={[styles.countdownBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <Text
        style={[
          styles.countdownNum,
          { color: urgent ? '#EF4444' : theme.text },
        ]}
      >
        {pad(value)}
      </Text>
      <Text style={[styles.countdownLabel, { color: theme.textSecondary }]}>
        {label}
      </Text>
    </View>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────

export default function AuctionDetailScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const auction = mockAuctions.find((a) => a.id === id);

  // Local mutable state
  const [bids, setBids] = useState<AuctionBid[]>(() =>
    auction ? [...auction.bids].reverse() : [],
  );
  const [currentBid, setCurrentBid] = useState(auction?.currentPrice ?? 0);
  const [imageIndex, setImageIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(() =>
    computeTimeLeft(auction?.endsAt ?? new Date(Date.now() + 86400000).toISOString()),
  );
  const [bidAmount, setBidAmount] = useState('');
  const [bidError, setBidError] = useState('');
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [showAllBids, setShowAllBids] = useState(false);
  const [userTopBid, setUserTopBid] = useState<number | null>(null);
  const [isOutbid, setIsOutbid] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [confettiKey, setConfettiKey] = useState(-1);

  const currentBidRef = useRef(currentBid);
  const userTopBidRef = useRef<number | null>(null);
  const autoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isEnded = timeLeft.total === 0;
  const isUrgent = timeLeft.total > 0 && timeLeft.total < 3600;
  const minBid = currentBid + (auction?.minBidIncrement ?? 5);
  const parsedBid = bidAmount ? parseFloat(bidAmount) : null;
  const effectiveBid = parsedBid ?? 0;
  const isBidValid = effectiveBid >= minBid;

  const watchers = WATCHER_COUNTS[id ?? ''] ?? 20;

  // Sync refs
  useEffect(() => { currentBidRef.current = currentBid; }, [currentBid]);
  useEffect(() => { userTopBidRef.current = userTopBid; }, [userTopBid]);

  // Countdown timer
  useEffect(() => {
    if (!auction) return;
    const interval = setInterval(() => {
      setTimeLeft(computeTimeLeft(auction.endsAt));
    }, 1000);
    return () => clearInterval(interval);
  }, [auction?.endsAt]);

  // Auto-bidder simulation
  useEffect(() => {
    if (!auction || isEnded) return;

    const scheduleNext = () => {
      const delay = 12000 + Math.random() * 18000; // 12-30s
      autoTimerRef.current = setTimeout(() => {
        const amount =
          Math.round((currentBidRef.current + (auction.minBidIncrement ?? 5)) * 100) / 100;
        const bidder = AUTO_BIDDERS[Math.floor(Math.random() * AUTO_BIDDERS.length)];
        const newBid: AuctionBid = {
          id: `auto-${Date.now()}`,
          bidderId: bidder.id,
          bidderUsername: bidder.username,
          amount,
          createdAt: new Date().toISOString(),
        };
        setBids((prev) => [newBid, ...prev]);
        setCurrentBid(amount);
        currentBidRef.current = amount;
        if (
          userTopBidRef.current !== null &&
          amount > userTopBidRef.current
        ) {
          setIsOutbid(true);
          setToastMsg('⚡ Nouvelle enchère placée sur cet article');
          setToastVisible(true);
        }
        scheduleNext();
      }, delay);
    };

    scheduleNext();
    return () => {
      if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
    };
  }, [auction?.id]);

  // Pulsing dot animation
  const dotOpacity = useSharedValue(1);
  useEffect(() => {
    dotOpacity.value = withRepeat(
      withSequence(
        withTiming(0.15, { duration: 550 }),
        withTiming(1, { duration: 550 }),
      ),
      -1,
      false,
    );
  }, []);
  const dotStyle = useAnimatedStyle(() => ({ opacity: dotOpacity.value }));

  // Scale pulse on new bid
  const bidScale = useSharedValue(1);
  const bidScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: bidScale.value }],
  }));

  const pulseBid = useCallback(() => {
    bidScale.value = withSequence(
      withSpring(1.12, { damping: 5, stiffness: 400 }),
      withSpring(1, { damping: 12 }),
    );
  }, []);

  const handleBid = useCallback(() => {
    if (!isBidValid) {
      setBidError(`Enchère min. : ${minBid}€`);
      return;
    }
    const newBid: AuctionBid = {
      id: `user-${Date.now()}`,
      bidderId: 'current_user',
      bidderUsername: 'Vous',
      amount: effectiveBid,
      createdAt: new Date().toISOString(),
    };
    setBids((prev) => [newBid, ...prev]);
    setCurrentBid(effectiveBid);
    currentBidRef.current = effectiveBid;
    setUserTopBid(effectiveBid);
    userTopBidRef.current = effectiveBid;
    setIsOutbid(false);
    setBidAmount('');
    setBidError('');
    setConfettiKey((k) => k + 1);
    setToastMsg('🏆 Enchère placée !');
    setToastVisible(true);
    pulseBid();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [isBidValid, effectiveBid, minBid, pulseBid]);

  const handleQuickBid = (delta: number) => {
    setBidAmount((currentBid + delta).toString());
    setBidError('');
  };

  if (!auction) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Text style={[Typography.body, { color: theme.textSecondary }]}>
          Enchère introuvable
        </Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtnFallback}>
          <Text style={[Typography.button, { color: theme.primary }]}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const product = auction.product;
  const displayedBids = showAllBids ? bids : bids.slice(0, 10);
  const isWinner =
    isEnded && userTopBid !== null && userTopBid >= currentBid;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Toast */}
        <Toast
          visible={toastVisible}
          message={toastMsg}
          type={isOutbid ? 'error' : 'success'}
          duration={2500}
          onHide={() => setToastVisible(false)}
        />

        {/* Confetti overlay */}
        {confettiKey >= 0 && (
          <BidConfettiOverlay
            key={confettiKey}
            onDone={() => setConfettiKey(-1)}
          />
        )}

        {/* ── Scroll content ── */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: 180 + insets.bottom },
          ]}
        >
          {/* Gallery */}
          <View style={{ height: GALLERY_H, backgroundColor: '#F3F4F6' }}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              decelerationRate="fast"
              onMomentumScrollEnd={(e) => {
                setImageIndex(
                  Math.round(e.nativeEvent.contentOffset.x / W),
                );
              }}
            >
              {product.images.map((img) => (
                <Image
                  key={img.id}
                  source={{ uri: img.url }}
                  style={{ width: W, height: GALLERY_H }}
                  contentFit="cover"
                  transition={{ effect: 'cross-dissolve', duration: 250 }}
                />
              ))}
            </ScrollView>

            {/* Back button */}
            <TouchableOpacity
              style={[styles.galleryBack, { top: insets.top + 10 }]}
              onPress={() => router.back()}
            >
              <Feather name="arrow-left" size={18} color="#FFF" />
            </TouchableOpacity>

            {/* Dot indicators */}
            {product.images.length > 1 && (
              <View style={styles.dotsRow}>
                {product.images.map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.dot,
                      i === imageIndex && styles.dotActive,
                    ]}
                  />
                ))}
              </View>
            )}

            {/* Image count */}
            <View style={styles.imgCount}>
              <Text style={styles.imgCountText}>
                {imageIndex + 1}/{product.images.length}
              </Text>
            </View>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {/* EN DIRECT badge */}
            {!isEnded && (
              <View style={styles.liveBadge}>
                <Animated.View style={[styles.liveDot, dotStyle]} />
                <Text style={styles.liveBadgeText}>EN DIRECT</Text>
                <Text style={[styles.enchereLabel, { color: theme.textSecondary }]}>
                  · Enchère en cours
                </Text>
              </View>
            )}

            {/* Title */}
            <Text style={[styles.title, { color: theme.text }]}>
              {product.title}
            </Text>

            {/* Bid info card */}
            <View
              style={[
                styles.bidInfoCard,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.bidInfoLabel, { color: theme.textSecondary }]}>
                  Enchère actuelle
                </Text>
                <Animated.Text
                  style={[
                    styles.currentBidAmount,
                    { color: theme.primary },
                    bidScaleStyle,
                  ]}
                >
                  {formatPrice(currentBid)}
                </Animated.Text>
                <Text style={[styles.startPrice, { color: theme.textSecondary }]}>
                  Prix de départ :{' '}
                  <Text style={styles.strikethrough}>
                    {formatPrice(auction.startPrice)}
                  </Text>
                </Text>
              </View>
              <View style={styles.bidStats}>
                <Text style={[styles.statLine, { color: theme.text }]}>
                  🔨 {bids.length} enchère{bids.length > 1 ? 's' : ''}
                </Text>
                <Text style={[styles.statLine, { color: theme.textSecondary }]}>
                  👁️ {watchers} suivi{watchers > 1 ? 'ent' : ''}
                </Text>
              </View>
            </View>

            {/* Countdown */}
            {!isEnded ? (
              <View style={styles.countdownRow}>
                <CountdownBox value={timeLeft.days} label="j" urgent={isUrgent} theme={theme} />
                <Text style={[styles.countdownSep, { color: isUrgent ? '#EF4444' : theme.textSecondary }]}>:</Text>
                <CountdownBox value={timeLeft.hours} label="h" urgent={isUrgent} theme={theme} />
                <Text style={[styles.countdownSep, { color: isUrgent ? '#EF4444' : theme.textSecondary }]}>:</Text>
                <CountdownBox value={timeLeft.minutes} label="m" urgent={isUrgent} theme={theme} />
                <Text style={[styles.countdownSep, { color: isUrgent ? '#EF4444' : theme.textSecondary }]}>:</Text>
                <CountdownBox value={timeLeft.seconds} label="s" urgent={isUrgent} theme={theme} />
              </View>
            ) : (
              <View style={[styles.endedBanner, { backgroundColor: `${theme.error}12`, borderColor: `${theme.error}30` }]}>
                <Text style={[styles.endedText, { color: theme.error }]}>
                  Enchère terminée
                </Text>
              </View>
            )}

            {/* Winner / Loser banner */}
            {isEnded && isWinner && (
              <View style={[styles.winnerCard, { backgroundColor: `${theme.success}12`, borderColor: `${theme.success}30` }]}>
                <Text style={[styles.winnerText, { color: theme.success }]}>
                  🏆 Vous avez remporté cette enchère !
                </Text>
                <TouchableOpacity
                  style={[styles.checkoutBtn, { backgroundColor: theme.success }]}
                  onPress={() => router.push(`/checkout/${product.id}` as any)}
                >
                  <Text style={styles.checkoutBtnText}>Procéder au paiement</Text>
                </TouchableOpacity>
              </View>
            )}
            {isEnded && !isWinner && bids.length > 0 && (
              <View style={[styles.loserCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Text style={[styles.loserText, { color: theme.textSecondary }]}>
                  Enchère terminée — Remportée par{' '}
                  <Text style={{ fontFamily: 'Poppins_600SemiBold', color: theme.text }}>
                    {bids[0].bidderUsername}
                  </Text>{' '}
                  pour{' '}
                  <Text style={{ fontFamily: 'Poppins_700Bold', color: theme.primary }}>
                    {formatPrice(bids[0].amount)}
                  </Text>
                </Text>
              </View>
            )}

            {/* Outbid warning */}
            {isOutbid && !isEnded && (
              <View style={[styles.outbidBanner, { backgroundColor: `${theme.warning}12`, borderColor: `${theme.warning}30` }]}>
                <Feather name="alert-triangle" size={14} color={theme.warning} />
                <Text style={[styles.outbidText, { color: theme.warning }]}>
                  Vous avez été surenchéri ! Enchérissez à nouveau.
                </Text>
              </View>
            )}

            {/* Bid history */}
            <TouchableOpacity
              style={styles.historyHeader}
              onPress={() => setHistoryExpanded((v) => !v)}
              activeOpacity={0.7}
            >
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Historique des enchères
              </Text>
              <View style={styles.historyRight}>
                <Text style={[styles.bidCount, { color: theme.textSecondary }]}>
                  {bids.length}
                </Text>
                <Feather
                  name={historyExpanded ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={theme.textSecondary}
                />
              </View>
            </TouchableOpacity>

            {historyExpanded && (
              <View style={[styles.historyList, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                {displayedBids.map((bid, i) => (
                  <View
                    key={bid.id}
                    style={[
                      styles.bidRow,
                      i < displayedBids.length - 1 && {
                        borderBottomWidth: StyleSheet.hairlineWidth,
                        borderBottomColor: theme.border,
                      },
                    ]}
                  >
                    <Image
                      source={{ uri: `https://i.pravatar.cc/50?u=${bid.bidderId}` }}
                      style={styles.bidAvatar}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.bidderName, { color: bid.bidderId === 'current_user' ? theme.primary : theme.text }]}>
                        {i === 0 ? '🏆 ' : ''}{bid.bidderUsername}
                      </Text>
                      <Text style={[styles.bidTime, { color: theme.textSecondary }]}>
                        {formatRelativeTime(bid.createdAt)}
                      </Text>
                    </View>
                    <Text style={[styles.bidAmount, { color: theme.primary }]}>
                      {formatPrice(bid.amount)}
                    </Text>
                  </View>
                ))}
                {bids.length > 10 && (
                  <TouchableOpacity
                    style={styles.showAllBtn}
                    onPress={() => setShowAllBids((v) => !v)}
                  >
                    <Text style={[styles.showAllText, { color: theme.primary }]}>
                      {showAllBids
                        ? 'Réduire'
                        : `Voir tout (${bids.length})`}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Description */}
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Description</Text>
            <Text style={[styles.description, { color: theme.textSecondary }]}>
              {product.description}
            </Text>

            {/* Product specs */}
            <View style={[styles.specsCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              {[
                { label: 'État', value: product.condition === 'new' ? 'Neuf' : product.condition === 'like_new' ? 'Très bon état' : 'Bon état' },
                { label: 'Catégorie', value: product.category },
                { label: 'Vendeur', value: product.seller.username },
                { label: 'Localisation', value: product.location.city },
              ].map((spec, i, arr) => (
                <View
                  key={spec.label}
                  style={[
                    styles.specRow,
                    i < arr.length - 1 && {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: theme.border,
                    },
                  ]}
                >
                  <Text style={[styles.specLabel, { color: theme.textSecondary }]}>
                    {spec.label}
                  </Text>
                  <Text style={[styles.specValue, { color: theme.text }]}>
                    {spec.value}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>

        {/* ── Fixed bottom bar ── */}
        {!isEnded && (
          <View
            style={[
              styles.bottomBar,
              {
                backgroundColor: theme.surface,
                borderTopColor: theme.border,
                paddingBottom: insets.bottom + 8,
              },
            ]}
          >
            {/* Current bid label */}
            <Text style={[styles.bottomBidLabel, { color: theme.textSecondary }]}>
              Enchère actuelle :{' '}
              <Text style={{ fontFamily: 'Poppins_700Bold', color: theme.primary }}>
                {formatPrice(currentBid)}
              </Text>
            </Text>

            {/* Quick bid pills */}
            <View style={styles.quickRow}>
              {QUICK_INCREMENTS.map((delta) => (
                <TouchableOpacity
                  key={delta}
                  style={[
                    styles.quickPill,
                    {
                      borderColor: theme.primary,
                      backgroundColor:
                        parsedBid === currentBid + delta
                          ? `${theme.primary}12`
                          : 'transparent',
                    },
                  ]}
                  onPress={() => handleQuickBid(delta)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[styles.quickPillText, { color: theme.primary }]}
                  >
                    +{delta}€
                  </Text>
                </TouchableOpacity>
              ))}
              <Text style={[styles.quickHint, { color: theme.textSecondary }]}>
                min. {formatPrice(minBid)}
              </Text>
            </View>

            {/* Input row */}
            <View style={styles.inputRow}>
              <View
                style={[
                  styles.bidInputWrap,
                  {
                    borderColor: bidError ? theme.error : theme.border,
                    backgroundColor: theme.background,
                  },
                ]}
              >
                <Text style={[styles.currency, { color: theme.textSecondary }]}>€</Text>
                <TextInput
                  style={[styles.bidInput, { color: theme.text }]}
                  value={bidAmount}
                  onChangeText={(t) => {
                    setBidAmount(t.replace(/[^0-9.]/g, ''));
                    setBidError('');
                  }}
                  placeholder={`${minBid}`}
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="numeric"
                />
              </View>
              <TouchableOpacity
                style={[styles.bidBtn, { opacity: isBidValid ? 1 : 0.5 }]}
                onPress={handleBid}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={[theme.primary, theme.primaryGradientEnd]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.bidBtnGrad}
                >
                  <Text style={styles.bidBtnText}>
                    Enchérir{parsedBid && parsedBid > 0 ? ` ${parsedBid}€` : ''}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Error */}
            {!!bidError && (
              <Text style={[styles.bidErrorText, { color: theme.error }]}>
                {bidError}
              </Text>
            )}
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  backBtnFallback: { marginTop: Spacing.lg, padding: Spacing.md },

  // Gallery
  galleryBack: {
    position: 'absolute',
    left: Spacing.lg,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotsRow: {
    position: 'absolute',
    bottom: Spacing.md,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  dotActive: {
    width: 18,
    backgroundColor: '#FFF',
  },
  imgCount: {
    position: 'absolute',
    bottom: Spacing.md,
    right: Spacing.md,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  imgCountText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 11,
    color: '#FFF',
    lineHeight: 15,
  },

  // Content
  scrollContent: {},
  content: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },

  // Live badge
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  liveBadgeText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 11,
    color: '#EF4444',
    letterSpacing: 0.8,
  },
  enchereLabel: { ...Typography.caption },

  // Title
  title: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 18,
    lineHeight: 26,
  },

  // Bid info card
  bidInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.md,
  },
  bidInfoLabel: { ...Typography.caption },
  currentBidAmount: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 28,
    lineHeight: 36,
  },
  startPrice: { ...Typography.caption, marginTop: 2 },
  strikethrough: {
    textDecorationLine: 'line-through',
  },
  bidStats: {
    alignItems: 'flex-end',
    gap: 4,
  },
  statLine: { ...Typography.caption },

  // Countdown
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  countdownBox: {
    width: 52,
    height: 60,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  countdownNum: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 20,
    lineHeight: 24,
  },
  countdownLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 10,
    lineHeight: 12,
  },
  countdownSep: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 20,
    lineHeight: 24,
    marginBottom: 12,
  },

  // State banners
  endedBanner: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  endedText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    lineHeight: 20,
  },
  winnerCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.md,
    alignItems: 'center',
  },
  winnerText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  checkoutBtn: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  checkoutBtnText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: '#FFF',
    lineHeight: 20,
  },
  loserCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  loserText: { ...Typography.body, lineHeight: 22 },
  outbidBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  outbidText: { ...Typography.captionMedium, flex: 1 },

  // Bid history
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  bidCount: { ...Typography.caption },
  sectionTitle: { ...Typography.h3 },
  historyList: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  bidRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
  },
  bidAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E5E7EB',
  },
  bidderName: { ...Typography.captionMedium },
  bidTime: { ...Typography.caption, fontSize: 10, lineHeight: 13 },
  bidAmount: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    lineHeight: 18,
  },
  showAllBtn: {
    padding: Spacing.md,
    alignItems: 'center',
  },
  showAllText: { ...Typography.captionMedium },

  // Description + specs
  description: { ...Typography.body, lineHeight: 22 },
  specsCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  specRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
  },
  specLabel: { ...Typography.caption },
  specValue: { ...Typography.captionMedium },

  // Bottom bar
  bottomBar: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: Spacing.sm,
  },
  bottomBidLabel: { ...Typography.body },
  quickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  quickPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
  },
  quickPillText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    lineHeight: 16,
  },
  quickHint: {
    ...Typography.caption,
    marginLeft: 'auto' as any,
  },
  inputRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  bidInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    borderWidth: 1.5,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    height: 48,
  },
  currency: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    lineHeight: 22,
  },
  bidInput: {
    flex: 1,
    ...Typography.body,
    padding: 0,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
  },
  bidBtn: {
    flex: 1.2,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  bidBtnGrad: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bidBtnText: { ...Typography.button, color: '#FFF' },
  bidErrorText: { ...Typography.caption, textAlign: 'center' },

  // Confetti
  confettiOrigin: {
    position: 'absolute',
    bottom: 80,
    right: '35%',
  },
});
