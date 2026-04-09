import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  FlatList,
  useColorScheme,
  ListRenderItemInfo,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useRef, useState, useEffect, useCallback } from 'react';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  withDelay,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { Colors } from '@/constants/Colors';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { storage, StorageKeys } from '@/utils/storage';

const { width: W, height: H } = Dimensions.get('window');

// ─── Layout ────────────────────────────────────────────────────────────────────
const EMOJI_AREA_H = H * 0.56;   // top portion — gradient bg + logo + emoji
const EMOJI_SIZE   = Math.round(W * 0.60);

// ─── Assets ────────────────────────────────────────────────────────────────────
const LOGO = require('../../../assets/images/logo.png');

const E = {
  shoppingBag:   require('../../../assets/images/3d-emojis/shopping-bag.png'),
  handshake:     require('../../../assets/images/3d-emojis/Handshake.png'),
  moneyBag:      require('../../../assets/images/3d-emojis/Money-bag.png'),
  packageBox:    require('../../../assets/images/3d-emojis/Package-box.png'),
  scooter:       require('../../../assets/images/3d-emojis/Scooter.png'),
  locationPin:   require('../../../assets/images/3d-emojis/Location-pin.png'),
  lockedPadlock: require('../../../assets/images/3d-emojis/Locked-padlock.png'),
  creditCard:    require('../../../assets/images/3d-emojis/Credit-card.png'),
  shield:        require('../../../assets/images/3d-emojis/Shield.png'),
} as const;

// ─── Slide data ────────────────────────────────────────────────────────────────
type SlideData = {
  id: string;
  emojis: [number, number, number];
  bgLight: string;
  bgDark: string;
  title: string;
  subtitle: string;
};

const SLIDES: SlideData[] = [
  {
    id: '1',
    emojis:   [E.handshake, E.shoppingBag, E.moneyBag],
    bgLight:  '#EBF0FF',
    bgDark:   '#0B1020',
    title:    'Faites des affaires facilement',
    subtitle: "La marketplace qui connecte acheteurs et vendeurs sur la Côte d'Azur.",
  },
  {
    id: '2',
    emojis:   [E.scooter, E.packageBox, E.locationPin],
    bgLight:  '#E6F4EE',
    bgDark:   '#071410',
    title:    'Livraison par des particuliers',
    subtitle: 'Moins cher, écologique et suivi en temps réel — pas de camion, juste des voisins.',
  },
  {
    id: '3',
    emojis:   [E.shield, E.lockedPadlock, E.creditCard],
    bgLight:  '#EDEAFF',
    bgDark:   '#0F091E',
    title:    'Sécurisé de A à Z',
    subtitle: 'Paiement Stripe, vérification QR code et protection acheteur sur chaque transaction.',
  },
];

// ─── EmojiRotator ──────────────────────────────────────────────────────────────
// Shows emojis one at a time.
// expo-image crossfades automatically when `source` changes (transition prop).
// Floating is handled by Reanimated on the wrapper — no runOnJS needed.
function EmojiRotator({ emojis }: { emojis: SlideData['emojis'] }) {
  const [idx, setIdx] = useState(0);

  // Bounce-in on mount + perpetual float
  const scale      = useSharedValue(0.65);
  const opacity    = useSharedValue(0);
  const translateY = useSharedValue(0);

  useEffect(() => {
    scale.value   = withSpring(1, { damping: 13, stiffness: 85 });
    opacity.value = withTiming(1, { duration: 380 });

    translateY.value = withDelay(
      500,
      withRepeat(
        withSequence(
          withTiming(-16, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
          withTiming(0,   { duration: 2200, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,    // infinite
        false,
      ),
    );
  }, []);

  // Advance index every 2.8 s — expo-image crossfades when source changes
  useEffect(() => {
    const t = setInterval(
      () => setIdx((p) => (p + 1) % emojis.length),
      2800,
    );
    return () => clearInterval(t);
  }, [emojis.length]);

  const animStyle = useAnimatedStyle(() => ({
    opacity:   opacity.value,
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.emojiWrapper, animStyle]}>
      <Image
        source={emojis[idx]}
        style={styles.emoji}
        contentFit="contain"
        transition={600}   // expo-image handles the crossfade natively
      />
    </Animated.View>
  );
}

// ─── SlideItem ─────────────────────────────────────────────────────────────────
function SlideItem({ item }: { item: SlideData }) {
  const isDark  = useColorScheme() === 'dark';
  const surface = isDark ? Colors.dark.surface : '#FFFFFF';
  const bgTop   = isDark ? item.bgDark : item.bgLight;

  return (
    <View style={styles.slide}>
      {/* Tinted gradient that fully resolves to surface by EMOJI_AREA_H */}
      <LinearGradient
        colors={[bgTop, bgTop, surface]}
        locations={[0, 0.28, 0.56]}
        style={StyleSheet.absoluteFill}
      />

      {/* Emoji centred in the visual area (below the logo) */}
      <View style={styles.emojiArea}>
        <EmojiRotator emojis={item.emojis} />
      </View>
    </View>
  );
}

// ─── PaginationDot ─────────────────────────────────────────────────────────────
function PaginationDot({
  index,
  currentSlide,
  color,
}: {
  index: number;
  currentSlide: number;
  color: string;
}) {
  const w = useSharedValue(index === currentSlide ? 24 : 8);
  const o = useSharedValue(index === currentSlide ? 1 : 0.35);

  useEffect(() => {
    w.value = withTiming(index === currentSlide ? 24 : 8,    { duration: 260 });
    o.value = withTiming(index === currentSlide ? 1 : 0.35, { duration: 260 });
  }, [currentSlide, index]);

  const style = useAnimatedStyle(() => ({ width: w.value, opacity: o.value }));
  return <Animated.View style={[styles.dot, { backgroundColor: color }, style]} />;
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function OnboardingScreen() {
  const isDark  = useColorScheme() === 'dark';
  const theme   = isDark ? Colors.dark : Colors.light;
  const surface = isDark ? Colors.dark.surface : '#FFFFFF';
  const insets  = useSafeAreaInsets();
  const router  = useRouter();

  const listRef = useRef<FlatList<SlideData>>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const isLast = currentSlide === SLIDES.length - 1;

  // Fade text in on every slide change
  const textOpacity = useSharedValue(1);
  useEffect(() => {
    textOpacity.value = withSequence(
      withTiming(0, { duration: 0 }),
      withTiming(1, { duration: 300 }),
    );
  }, [currentSlide]);
  const textFade = useAnimatedStyle(() => ({ opacity: textOpacity.value }));

  // Button spring on press
  const btnScale    = useSharedValue(1);
  const btnAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: btnScale.value }],
  }));

  const skipOnboarding = useCallback(() => {
    storage.set(StorageKeys.HAS_ONBOARDED, 'true').then(() => {
      router.replace('/(tabs)');
    });
  }, [router]);

  const handleAuth = useCallback(() => {
    router.push('/(auth)');
  }, [router]);

  const handleNext = () => {
    btnScale.value = withSpring(0.94, { damping: 12 }, () => {
      btnScale.value = withSpring(1, { damping: 12 });
    });
    if (isLast) {
      handleAuth();
    } else {
      const next = currentSlide + 1;
      setCurrentSlide(next);
      listRef.current?.scrollToIndex({ index: next, animated: true });
    }
  };

  const handleScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      setCurrentSlide(Math.round(e.nativeEvent.contentOffset.x / W));
    },
    [],
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<SlideData>) => <SlideItem item={item} />,
    [],
  );

  const getItemLayout = useCallback(
    (_: ArrayLike<SlideData> | null | undefined, index: number) => ({
      length: W, offset: W * index, index,
    }),
    [],
  );

  const slide = SLIDES[currentSlide];

  return (
    <View style={[styles.container, { backgroundColor: surface }]}>

      {/* ── Swipeable slides ──────────────────────────────── */}
      <FlatList
        ref={listRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        scrollEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(s) => s.id}
        renderItem={renderItem}
        getItemLayout={getItemLayout}
        onMomentumScrollEnd={handleScrollEnd}
        initialNumToRender={1}
        maxToRenderPerBatch={2}
        style={StyleSheet.absoluteFill}
      />

      {/* ── Logo — top centre, above the emoji area ───────── */}
      <View
        style={[styles.logoContainer, { top: insets.top + 16 }]}
        pointerEvents="none"
      >
        <Image
          source={LOGO}
          style={styles.logo}
          contentFit="contain"
        />
      </View>

      {/* ── Skip — top right ──────────────────────────────── */}
      <TouchableOpacity
        style={[styles.skipBtn, { top: insets.top + 18 }]}
        onPress={skipOnboarding}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        activeOpacity={0.6}
      >
        <Text style={[styles.skipText, { color: theme.textSecondary }]}>Passer</Text>
      </TouchableOpacity>

      {/* ── Content panel — sits below the visual area ───── */}
      <View
        style={[
          styles.panel,
          {
            top:             EMOJI_AREA_H,
            backgroundColor: surface,
            paddingBottom:   insets.bottom + 20,
          },
        ]}
      >
        {/* Title + subtitle fade in on slide change */}
        <Animated.View style={[styles.textBlock, textFade]}>
          <Text style={[styles.title, { color: theme.text }]}>
            {slide.title}
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {slide.subtitle}
          </Text>
        </Animated.View>

        <View style={{ flex: 1 }} />

        {/* Pagination dots */}
        <View style={styles.dotsRow}>
          {SLIDES.map((_, i) => (
            <PaginationDot
              key={i}
              index={i}
              currentSlide={currentSlide}
              color={theme.primary}
            />
          ))}
        </View>

        {/* Pill CTA */}
        <Animated.View style={[styles.btnWrapper, btnAnimStyle]}>
          <TouchableOpacity
            onPress={handleNext}
            activeOpacity={1}
            style={styles.btnTouchable}
          >
            <LinearGradient
              colors={[theme.primary, theme.primaryGradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.btnGradient}
            >
              <Text style={styles.btnText}>
                {isLast ? 'Commencer' : 'Suivant'}
              </Text>
              <Feather
                name={isLast ? 'check' : 'arrow-right'}
                size={18}
                color="#FFF"
              />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>

    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },

  // ── Slide ──
  slide: { width: W, height: H },

  // The visual area is the top EMOJI_AREA_H of each slide.
  // We push the emoji down enough to clear the logo (≈ 110pt).
  emojiArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: EMOJI_AREA_H,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,    // clear space for the logo overlay
    paddingBottom: 16,
  },

  emojiWrapper: {
    ...Platform.select({
      ios: {
        shadowColor:   '#000',
        shadowOffset:  { width: 0, height: 12 },
        shadowOpacity: 0.12,
        shadowRadius:  20,
      },
    }),
  },
  emoji: {
    width:  EMOJI_SIZE,
    height: EMOJI_SIZE,
  },

  // ── Logo ──
  logoContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  logo: {
    width:  44,
    height: 44,
  },

  // ── Skip ──
  skipBtn: {
    position: 'absolute',
    right: Spacing.lg,
    zIndex: 20,
  },
  skipText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    lineHeight: 20,
  },

  // ── Content panel ──
  panel: {
    position: 'absolute',
    left:  0,
    right: 0,
    bottom: 0,
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.xl,
    gap: Spacing.lg,
  },

  // ── Text ──
  textBlock: { gap: Spacing.sm },
  title: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 28,
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 15,
    lineHeight: 24,
  },

  // ── Dots ──
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  dot: { height: 8, borderRadius: 4 },

  // ── Pill button ──
  btnWrapper: {
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  btnTouchable: {
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  btnGradient: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  btnText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    lineHeight: 22,
    color: '#FFFFFF',
  },
});
