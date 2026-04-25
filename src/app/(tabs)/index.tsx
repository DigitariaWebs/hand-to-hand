import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  memo,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ScrollView,
  RefreshControl,
  Dimensions,
  Platform,
  NativeSyntheticEvent,
  NativeScrollEvent,
  ListRenderItemInfo,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Colors, ThemeColors } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { Categories } from '@/constants/Categories';
import { mockProducts } from '@/services/mock/products';
import { mockAuctions } from '@/services/mock/auctions';
import { mockPepites } from '@/services/mock/pepites';
import { Product, Auction } from '@/types/product';
import { formatPrice, formatCountdown, formatRelativeTime } from '@/utils';
import { ProductCard } from '@/components/product/ProductCard';

// ─── Layout constants ───────────────────────────────────────────────────────────

const { width: W } = Dimensions.get('window');
const HEADER_H = 56;
const PAGE_SIZE   = 20;
const LOAD_MORE   = 10;

const LOGO = require('../../../assets/images/logo.png');

// Dynamic theme accessor for sub-components
function getTheme(scheme: ReturnType<typeof useColorScheme>) {
  return scheme === 'dark' ? Colors.dark : Colors.light;
}

// ─── Static mock data ───────────────────────────────────────────────────────────

const BANNERS = [
  { id: 'b1', text: '🔥 Offres du jour — Jusqu\'à -50%',   sub: 'Profitez avant la fin de journée'    },
  { id: 'b2', text: 'Livraison gratuite ce week-end',       sub: 'Sur toutes les commandes +50€'       },
  { id: 'b3', text: 'Nouveau : Enchères en direct 🎙️',     sub: 'Misez en temps réel sur vos articles'  },
];

const LIVE_SESSIONS = [
  {
    id: 'l1',
    host: 'sophie_m',
    avatar: 'https://i.pravatar.cc/150?img=1',
    title: 'Vide-dressing Luxe',
    viewers: 234,
    thumbnail: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80',
  },
  {
    id: 'l2',
    host: 'karim_b',
    avatar: 'https://i.pravatar.cc/150?img=3',
    title: 'Électronique Deals',
    viewers: 187,
    thumbnail: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&q=80',
  },
  {
    id: 'l3',
    host: 'amelie_d',
    avatar: 'https://i.pravatar.cc/150?img=5',
    title: 'Mode & Style',
    viewers: 312,
    thumbnail: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400&q=80',
  },
];

// Category icon mapping (Ionicons names)
const CAT_ICONS: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  all:          'apps-outline',
  vetements:    'shirt-outline',
  chaussures:   'footsteps-outline',
  vehicules:    'car-outline',
  electronique: 'phone-portrait-outline',
  maison:       'home-outline',
  sport:        'fitness-outline',
  luxe:         'diamond-outline',
  enfants:      'happy-outline',
  beaute:       'color-palette-outline',
  bricolage:    'hammer-outline',
  autre:        'grid-outline',
};

// ─── Skeleton card ──────────────────────────────────────────────────────────────

function SkeletonCard() {
  const colorScheme = useColorScheme();
  const t = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const styles = createStyles(t);
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1,   { duration: 600, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.4, { duration: 600, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
    );
  }, []);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View style={[styles.skeletonCard, style]}>
      <View style={styles.skeletonImg} />
      <View style={{ padding: 8, gap: 6 }}>
        <View style={styles.skeletonLine} />
        <View style={[styles.skeletonLine, { width: '60%' }]} />
        <View style={[styles.skeletonLine, { width: '40%' }]} />
      </View>
    </Animated.View>
  );
}

// ─── Home header ────────────────────────────────────────────────────────────────

const HomeHeader = memo(function HomeHeader({
  onBellPress,
}: {
  onBellPress: () => void;
}) {
  const colorScheme = useColorScheme();
  const t = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const styles = createStyles(t);
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top, height: HEADER_H + insets.top }]}>
      {/* Logo */}
      <Image source={LOGO} style={styles.headerLogo} contentFit="contain" />

      {/* Location selector */}
      <TouchableOpacity style={styles.locationBtn} activeOpacity={0.7}>
        <Feather name="map-pin" size={12} color={t.primary} />
        <Text style={styles.locationText}>Nice, France</Text>
        <Feather name="chevron-down" size={14} color={t.textSecondary} />
      </TouchableOpacity>

      {/* Notification bell */}
      <TouchableOpacity
        style={styles.bellBtn}
        onPress={onBellPress}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Feather name="bell" size={22} color={t.text} />
        {/* Red dot badge */}
        <View style={styles.bellDot} />
      </TouchableOpacity>
    </View>
  );
});

// ─── Category pill ──────────────────────────────────────────────────────────────

const CategoryPill = memo(function CategoryPill({
  id,
  label,
  active,
  onPress,
}: {
  id: string;
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const colorScheme = useColorScheme();
  const t = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const styles = createStyles(t);
  const iconName = CAT_ICONS[id] ?? 'grid-outline';

  return (
    <TouchableOpacity
      style={[styles.catPill, active && styles.catPillActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons
        name={iconName}
        size={22}
        color={active ? t.primary : '#9CA3AF'}
      />
      <Text style={[styles.catLabel, active && styles.catLabelActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
});

// ─── Deal banner ────────────────────────────────────────────────────────────────

function DealBanner() {
  const colorScheme = useColorScheme();
  const t = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const styles = createStyles(t);
  const [idx, setIdx] = useState(0);
  const bannerRef = useRef<FlatList>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setIdx((prev) => {
        const next = (prev + 1) % BANNERS.length;
        bannerRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <View style={styles.bannerWrap}>
      <FlatList
        ref={bannerRef}
        data={BANNERS}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(b) => b.id}
        renderItem={({ item }) => (
          <LinearGradient
            colors={[t.primary, t.primaryGradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.bannerSlide}
          >
            <Text style={styles.bannerMain}>{item.text}</Text>
            <Text style={styles.bannerSub}>{item.sub}</Text>
          </LinearGradient>
        )}
        getItemLayout={(_, index) => ({
          length: W - 32,
          offset: (W - 32) * index,
          index,
        })}
      />
      {/* Pagination dots */}
      <View style={styles.bannerDots}>
        {BANNERS.map((_, i) => (
          <View
            key={i}
            style={[styles.bannerDot, i === idx && styles.bannerDotActive]}
          />
        ))}
      </View>
    </View>
  );
}

// ─── Section header ─────────────────────────────────────────────────────────────

function SectionHeader({ title, onSeeAll }: { title: string; onSeeAll?: () => void }) {
  const colorScheme = useColorScheme();
  const t = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const styles = createStyles(t);
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {onSeeAll && (
        <TouchableOpacity onPress={onSeeAll} activeOpacity={0.7}>
          <Text style={styles.seeAll}>Voir tout</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Countdown timer ────────────────────────────────────────────────────────────

function CountdownTimer({ endsAt }: { endsAt: string }) {
  const colorScheme = useColorScheme();
  const t = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const styles = createStyles(t);
  const [text, setText] = useState(() => formatCountdown(endsAt));

  useEffect(() => {
    const timer = setInterval(() => setText(formatCountdown(endsAt)), 1000);
    return () => clearInterval(timer);
  }, [endsAt]);

  const isEnded = text === 'Terminé';

  return (
    <Text style={[styles.auctionTimer, isEnded && { color: t.textSecondary }]}>
      {isEnded ? '⏰ Terminé' : `⏰ ${text}`}
    </Text>
  );
}

// ─── Auction card ───────────────────────────────────────────────────────────────

const AuctionCard = memo(function AuctionCard({
  auction,
  onPress,
}: {
  auction: Auction;
  onPress: () => void;
}) {
  const colorScheme = useColorScheme();
  const t = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const styles = createStyles(t);
  const img = auction.product.images[0]?.url ?? '';

  return (
    <TouchableOpacity style={styles.auctionCard} onPress={onPress} activeOpacity={0.9}>
      <Image
        source={{ uri: img }}
        style={styles.auctionImg}
        contentFit="cover"
        transition={{ effect: 'cross-dissolve', duration: 200 }}
      />
      <View style={styles.auctionInfo}>
        <Text style={styles.auctionTitle} numberOfLines={2}>
          {auction.product.title}
        </Text>
        <Text style={styles.auctionBid}>
          {formatPrice(auction.currentPrice)}
        </Text>
        <CountdownTimer endsAt={auction.endsAt} />
        <Text style={styles.auctionBidCount}>
          {auction.bids.length} enchère{auction.bids.length !== 1 ? 's' : ''}
        </Text>
      </View>
    </TouchableOpacity>
  );
});

// ─── Pépite card ────────────────────────────────────────────────────────────────

const PepiteCard = memo(function PepiteCard({
  product,
  onPress,
}: {
  product: Product;
  onPress: () => void;
}) {
  const colorScheme = useColorScheme();
  const t = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const styles = createStyles(t);
  const img = product.images[0]?.url ?? '';

  return (
    <TouchableOpacity style={styles.pepiteCard} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.pepiteImgWrap}>
        <Image
          source={{ uri: img }}
          style={styles.pepiteImg}
          contentFit="cover"
          transition={{ effect: 'cross-dissolve', duration: 200 }}
        />
        <View style={styles.pepiteBadge}>
          <Text style={styles.pepiteBadgeText}>💎 Pépite</Text>
        </View>
      </View>
      <View style={styles.pepiteInfo}>
        <Text style={styles.pepiteTitle} numberOfLines={2}>
          {product.title}
        </Text>
        <Text style={styles.pepitePrice}>{formatPrice(product.price)}</Text>
        <View style={styles.pepiteSellerRow}>
          <Image
            source={{ uri: product.seller.avatar }}
            style={styles.pepiteSellerAvatar}
            contentFit="cover"
          />
          <Text style={styles.pepiteSellerName} numberOfLines={1}>
            {product.seller.username}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});

// ─── Live card ──────────────────────────────────────────────────────────────────

const LiveCard = memo(function LiveCard({
  session,
}: {
  session: typeof LIVE_SESSIONS[0];
}) {
  const colorScheme = useColorScheme();
  const t = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const styles = createStyles(t);
  return (
    <TouchableOpacity style={styles.liveCard} activeOpacity={0.9}>
      <View style={styles.liveImgWrap}>
        <Image
          source={{ uri: session.thumbnail }}
          style={styles.liveImg}
          contentFit="cover"
          transition={{ effect: 'cross-dissolve', duration: 200 }}
        />
        {/* EN DIRECT badge */}
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveBadgeText}>EN DIRECT</Text>
        </View>
        {/* Viewer count */}
        <View style={styles.liveViewers}>
          <Ionicons name="eye-outline" size={11} color="#FFF" />
          <Text style={styles.liveViewerText}>{session.viewers}</Text>
        </View>
      </View>
      <View style={styles.liveInfo}>
        <Image
          source={{ uri: session.avatar }}
          style={styles.liveAvatar}
          contentFit="cover"
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.liveTitle} numberOfLines={1}>{session.title}</Text>
          <Text style={styles.liveHost} numberOfLines={1}>@{session.host}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});

// ─── Main home screen ───────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;
  const styles = createStyles(theme);

  // ── Category state ──
  const [activeCategory, setActiveCategory] = useState('all');

  // ── Product list state ──
  const filteredBase = useMemo(
    () =>
      activeCategory === 'all'
        ? mockProducts
        : mockProducts.filter((p) => p.category === activeCategory),
    [activeCategory],
  );

  const [displayedProducts, setDisplayedProducts] = useState<Product[]>(() =>
    filteredBase.slice(0, PAGE_SIZE),
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const pageRef = useRef(1);

  // Reset list when category changes
  useEffect(() => {
    setDisplayedProducts(filteredBase.slice(0, PAGE_SIZE));
    pageRef.current = 1;
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [filteredBase]);

  // ── Infinite scroll ──
  const handleEndReached = useCallback(() => {
    if (isLoadingMore || isRefreshing) return;
    setIsLoadingMore(true);
    setTimeout(() => {
      const p = pageRef.current;
      const more = Array.from({ length: LOAD_MORE }, (_, i) => {
        const base = filteredBase[(p * LOAD_MORE + i) % filteredBase.length];
        return { ...base, id: `${base.id}-p${p}-${i}` };
      });
      setDisplayedProducts((prev) => [...prev, ...more]);
      pageRef.current = p + 1;
      setIsLoadingMore(false);
    }, 800);
  }, [isLoadingMore, isRefreshing, filteredBase]);

  // ── Pull to refresh ──
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => {
      setDisplayedProducts(filteredBase.slice(0, PAGE_SIZE));
      pageRef.current = 1;
      setIsRefreshing(false);
    }, 800);
  }, [filteredBase]);

  // ── Floating scroll-to-top ──
  const listRef = useRef<FlatList<Product>>(null);
  const scrollY = useRef(0);
  const scrollBtnOpacity = useSharedValue(0);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const handleScroll = useCallback(
    ({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = nativeEvent.contentOffset.y;
      const shouldShow = y > 500;
      if (shouldShow && scrollY.current <= 500) {
        setShowScrollBtn(true);
        scrollBtnOpacity.value = withTiming(1, { duration: 200 });
      } else if (!shouldShow && scrollY.current > 500) {
        scrollBtnOpacity.value = withTiming(0, { duration: 200 });
        setTimeout(() => setShowScrollBtn(false), 200);
      }
      scrollY.current = y;
    },
    [],
  );

  const scrollToTop = useCallback(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  const scrollBtnStyle = useAnimatedStyle(() => ({
    opacity: scrollBtnOpacity.value,
  }));

  // ── renderItem ──
  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Product>) => (
      <View style={styles.cardWrapper}>
        <ProductCard
          product={item}
          onPress={() => router.push(`/product/${item.id}`)}
        />
      </View>
    ),
    [router, styles],
  );

  const keyExtractor = useCallback((item: Product) => item.id, []);

  // ── List header (all sections above the grid) ──
  const listHeader = useMemo(
    () => (
      <View>
        {/* ── Categories row ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catRow}
          style={styles.catScroll}
        >
          <CategoryPill
            id="all"
            label="Tout"
            active={activeCategory === 'all'}
            onPress={() => setActiveCategory('all')}
          />
          {Categories.map((cat) => (
            <CategoryPill
              key={cat.id}
              id={cat.id}
              label={cat.labelFr}
              active={activeCategory === cat.id}
              onPress={() => setActiveCategory(cat.id)}
            />
          ))}
        </ScrollView>

        {/* ── Deal banner ── */}
        <DealBanner />

        {/* ── Pépites du moment ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>💎 Pépites du moment</Text>
              <Text style={styles.sectionSubtitle}>
                Trouvailles rares et offres exceptionnelles
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/pepites' as any)}
              activeOpacity={0.7}
            >
              <Text style={styles.seeAll}>Voir tout</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizList}
            decelerationRate="fast"
            snapToInterval={212}
            snapToAlignment="start"
          >
            {mockPepites.map((product) => (
              <PepiteCard
                key={product.id}
                product={product}
                onPress={() => router.push(`/product/${product.id}`)}
              />
            ))}
          </ScrollView>
        </View>

        {/* ── Auctions section ── */}
        <View style={styles.section}>
          <SectionHeader
            title="Enchères en cours 🔥"
            onSeeAll={() => {}}
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizList}
            decelerationRate="fast"
            snapToInterval={210}
            snapToAlignment="start"
          >
            {mockAuctions.map((auction) => (
              <AuctionCard
                key={auction.id}
                auction={auction}
                onPress={() => router.push(`/auction/${auction.id}`)}
              />
            ))}
          </ScrollView>
        </View>

        {/* ── Live section ── */}
        <View style={styles.section}>
          <SectionHeader
            title="Live Shopping 🎥"
            onSeeAll={() => {}}
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizList}
            decelerationRate="fast"
            snapToInterval={190}
            snapToAlignment="start"
          >
            {LIVE_SESSIONS.map((session) => (
              <LiveCard key={session.id} session={session} />
            ))}
          </ScrollView>
        </View>

        {/* ── Grid header ── */}
        <View style={styles.section}>
          <SectionHeader title="Toutes les annonces" />
        </View>
      </View>
    ),
    [activeCategory, router, styles],
  );

  // ── List footer ──
  const listFooter = useMemo(
    () =>
      isLoadingMore ? (
        <View style={styles.skeletonRow}>
          <View style={styles.cardWrapper}><SkeletonCard /></View>
          <View style={styles.cardWrapper}><SkeletonCard /></View>
        </View>
      ) : (
        <View style={{ height: 24 }} />
      ),
    [isLoadingMore, styles],
  );

  return (
    <View style={styles.screen}>

      {/* ── Sticky header ── */}
      <HomeHeader onBellPress={() => {}} />

      {/* ── Product grid + sections ── */}
      <FlatList
        ref={listRef}
        data={displayedProducts}
        numColumns={2}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        ListFooterComponent={listFooter}
        extraData={`${activeCategory}-${colorScheme}`}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        onScroll={handleScroll}
        scrollEventThrottle={100}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
        removeClippedSubviews
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={7}
      />

      {/* ── Floating scroll-to-top ── */}
      {showScrollBtn && (
        <Animated.View
          style={[
            styles.floatBtnAbsolute,
            { bottom: insets.bottom + 60 + 20 },
            scrollBtnStyle,
          ]}
          pointerEvents="box-none"
        >
          <TouchableOpacity style={styles.floatBtn} onPress={scrollToTop} activeOpacity={0.85}>
            <Feather name="arrow-up" size={18} color="#FFF" />
          </TouchableOpacity>
        </Animated.View>
      )}

    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const createStyles = (t: ThemeColors) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: t.background,
    },

    // ── Header ──
    header: {
      backgroundColor: t.surface,
      flexDirection: 'row',
      alignItems: 'flex-end',
      paddingHorizontal: Spacing.lg,
      paddingBottom: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: t.border,
      zIndex: 10,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
        },
        android: { elevation: 3 },
      }),
    },
    headerLogo: {
      width: 28,
      height: 28,
      marginRight: 8,
    },
    locationBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
    },
    locationText: {
      fontFamily: 'Poppins_600SemiBold',
      fontSize: 15,
      color: t.text,
      lineHeight: 20,
    },
    bellBtn: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 8,
    },
    bellDot: {
      position: 'absolute',
      top: 4,
      right: 4,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#EF4444',
      borderWidth: 1.5,
      borderColor: t.surface,
    },

    // ── Categories ──
    catScroll: {
      backgroundColor: t.surface,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: t.border,
    },
    catRow: {
      flexDirection: 'row',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
      gap: 4,
    },
    catPill: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 10,
      gap: 3,
      minWidth: 60,
    },
    catPillActive: {
      backgroundColor: `${t.primary}14`, // primary at 8% opacity
    },
    catLabel: {
      fontFamily: 'Poppins_500Medium',
      fontSize: 10,
      color: '#9CA3AF',
      lineHeight: 14,
      textAlign: 'center',
    },
    catLabelActive: {
      color: t.primary,
    },

    // ── Banner ──
    bannerWrap: {
      marginHorizontal: Spacing.lg,
      marginTop: Spacing.lg,
    },
    bannerSlide: {
      width: W - 32,
      height: 100,
      borderRadius: 12,
      paddingHorizontal: 20,
      paddingVertical: 16,
      justifyContent: 'center',
      gap: 4,
    },
    bannerMain: {
      fontFamily: 'Poppins_700Bold',
      fontSize: 16,
      color: '#FFF',
      lineHeight: 22,
    },
    bannerSub: {
      fontFamily: 'Poppins_400Regular',
      fontSize: 12,
      color: 'rgba(255,255,255,0.80)',
      lineHeight: 17,
    },
    bannerDots: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 5,
      marginTop: 8,
    },
    bannerDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: t.border,
    },
    bannerDotActive: {
      width: 16,
      backgroundColor: t.primary,
    },

    // ── Sections ──
    section: {
      marginTop: Spacing.xl,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.lg,
      marginBottom: Spacing.md,
    },
    sectionTitle: {
      fontFamily: 'Poppins_600SemiBold',
      fontSize: 16,
      color: t.text,
      lineHeight: 22,
    },
    sectionSubtitle: {
      fontFamily: 'Poppins_400Regular',
      fontSize: 11,
      color: t.textSecondary,
      lineHeight: 15,
      marginTop: 2,
    },
    seeAll: {
      fontFamily: 'Poppins_500Medium',
      fontSize: 13,
      color: t.primary,
      lineHeight: 18,
    },
    horizList: {
      paddingHorizontal: Spacing.lg,
      gap: 12,
    },

    // ── Pépite card ──
    pepiteCard: {
      width: 200,
      height: 260,
      backgroundColor: t.surface,
      borderRadius: 12,
      overflow: 'hidden',
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.08,
          shadowRadius: 4,
        },
        android: { elevation: 3 },
      }),
    },
    pepiteImgWrap: {
      width: 200,
      height: 140,
      backgroundColor: '#F3F4F6',
      position: 'relative',
    },
    pepiteImg: { width: '100%', height: '100%' },
    pepiteBadge: {
      position: 'absolute',
      top: 8,
      left: 8,
      backgroundColor: 'rgba(212,160,23,0.92)',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
    },
    pepiteBadgeText: {
      fontFamily: 'Poppins_600SemiBold',
      fontSize: 11,
      color: '#FFFFFF',
    },
    pepiteInfo: {
      padding: 10,
      gap: 3,
    },
    pepiteTitle: {
      fontFamily: 'Poppins_500Medium',
      fontSize: 13,
      color: t.text,
      lineHeight: 17,
    },
    pepitePrice: {
      fontFamily: 'Poppins_700Bold',
      fontSize: 16,
      color: t.primary,
      lineHeight: 22,
      marginTop: 2,
    },
    pepiteSellerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 3,
    },
    pepiteSellerAvatar: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: '#E5E7EB',
    },
    pepiteSellerName: {
      fontFamily: 'Poppins_400Regular',
      fontSize: 11,
      color: t.textSecondary,
      flex: 1,
    },

    // ── Auction card ──
    auctionCard: {
      width: 200,
      backgroundColor: t.surface,
      borderRadius: 12,
      overflow: 'hidden',
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.07,
          shadowRadius: 4,
        },
        android: { elevation: 2 },
      }),
    },
    auctionImg: {
      width: '100%',
      height: 130,
    },
    auctionInfo: {
      padding: 10,
      gap: 3,
    },
    auctionTitle: {
      fontFamily: 'Poppins_500Medium',
      fontSize: 12,
      color: t.text,
      lineHeight: 17,
    },
    auctionBid: {
      fontFamily: 'Poppins_700Bold',
      fontSize: 15,
      color: t.primary,
      lineHeight: 20,
      marginTop: 2,
    },
    auctionTimer: {
      fontFamily: 'Poppins_600SemiBold',
      fontSize: 12,
      color: '#EF4444',
      lineHeight: 17,
    },
    auctionBidCount: {
      fontFamily: 'Poppins_400Regular',
      fontSize: 11,
      color: t.textSecondary,
      lineHeight: 15,
    },

    // ── Live card ──
    liveCard: {
      width: 180,
      backgroundColor: t.surface,
      borderRadius: 12,
      overflow: 'hidden',
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.07,
          shadowRadius: 4,
        },
        android: { elevation: 2 },
      }),
    },
    liveImgWrap: {
      width: '100%',
      height: 120,
      position: 'relative',
    },
    liveImg: {
      width: '100%',
      height: '100%',
    },
    liveBadge: {
      position: 'absolute',
      top: 8,
      left: 8,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: '#EF4444',
      borderRadius: 4,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    liveDot: {
      width: 5,
      height: 5,
      borderRadius: 2.5,
      backgroundColor: '#FFF',
    },
    liveBadgeText: {
      fontFamily: 'Poppins_700Bold',
      fontSize: 9,
      color: '#FFF',
      lineHeight: 13,
      letterSpacing: 0.5,
    },
    liveViewers: {
      position: 'absolute',
      bottom: 8,
      right: 8,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      backgroundColor: 'rgba(0,0,0,0.5)',
      borderRadius: 4,
      paddingHorizontal: 5,
      paddingVertical: 2,
    },
    liveViewerText: {
      fontFamily: 'Poppins_500Medium',
      fontSize: 10,
      color: '#FFF',
      lineHeight: 14,
    },
    liveInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 8,
      gap: 8,
    },
    liveAvatar: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: t.border,
    },
    liveTitle: {
      fontFamily: 'Poppins_600SemiBold',
      fontSize: 12,
      color: t.text,
      lineHeight: 17,
    },
    liveHost: {
      fontFamily: 'Poppins_400Regular',
      fontSize: 10,
      color: t.textSecondary,
      lineHeight: 14,
    },

    // ── Product grid ──
    listContent: {
      paddingBottom: 40,
    },
    columnWrapper: {
      paddingHorizontal: Spacing.lg,
      gap: 10,
      marginBottom: 12,
    },
    cardWrapper: {
      flex: 1,
    },

    // ── Skeleton ──
    skeletonRow: {
      flexDirection: 'row',
      paddingHorizontal: Spacing.lg,
      gap: 10,
      marginBottom: 12,
    },
    skeletonCard: {
      flex: 1,
      backgroundColor: t.border,
      borderRadius: 12,
      overflow: 'hidden',
    },
    skeletonImg: {
      aspectRatio: 1,
      backgroundColor: t.border,
    },
    skeletonLine: {
      height: 10,
      borderRadius: 5,
      backgroundColor: t.border,
      width: '100%',
    },

    // ── Floating button ──
    floatBtnAbsolute: {
      position: 'absolute',
      right: Spacing.lg,
    },
    floatBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: t.primary,
      alignItems: 'center',
      justifyContent: 'center',
      ...Platform.select({
        ios: {
          shadowColor: t.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.35,
          shadowRadius: 8,
        },
        android: { elevation: 6 },
      }),
    },
  });
