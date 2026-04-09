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
  TouchableOpacity,
  FlatList,
  TextInput,
  Dimensions,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import { mockLiveSessions, INITIAL_MESSAGES, getRandomLiveMessage } from '@/services/mock/live';
import { mockProducts } from '@/services/mock/products';
import type { LiveMessage } from '@/services/mock/live';
import { formatPrice } from '@/utils';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';

const { width: SW, height: SH } = Dimensions.get('window');

const REACTION_EMOJIS = ['❤️', '🔥', '😍', '👏', '💛', '⚡'];

const INPUT_BAR_H = 56;
const PRODUCT_CARD_H = 84;
const CHAT_H = 200;

// ── Floating reaction bubble ───────────────────────────────────────────────

type Reaction = { id: string; emoji: string; rightOffset: number };

function FloatingReaction({
  emoji,
  rightOffset,
  onDone,
}: {
  emoji: string;
  rightOffset: number;
  onDone: () => void;
}) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(0.4);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 7, stiffness: 280 });
    translateY.value = withTiming(-200, { duration: 2600 });
    opacity.value = withDelay(
      1900,
      withTiming(0, { duration: 700 }, () => runOnJS(onDone)()),
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          right: rightOffset,
          bottom: 0,
        },
        style,
      ]}
    >
      <Text style={{ fontSize: 28 }}>{emoji}</Text>
    </Animated.View>
  );
}

// ── Chat message row ───────────────────────────────────────────────────────

function ChatMessageRow({ item }: { item: LiveMessage }) {
  return (
    <View style={chatStyles.row}>
      <Image
        source={{ uri: item.avatar }}
        style={chatStyles.avatar}
      />
      <View style={chatStyles.bubble}>
        <Text style={chatStyles.username}>{item.username} </Text>
        <Text style={chatStyles.message}>{item.message}</Text>
      </View>
    </View>
  );
}

const chatStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: 3,
  },
  avatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#444',
    flexShrink: 0,
  },
  bubble: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    flex: 1,
  },
  username: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: '#FFF',
    lineHeight: 17,
  },
  message: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 17,
  },
});

// ── Main screen ────────────────────────────────────────────────────────────

export default function LiveViewerScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const session = mockLiveSessions.find((s) => s.id === id);

  const [messages, setMessages] = useState<LiveMessage[]>([...INITIAL_MESSAGES]);
  const [inputText, setInputText] = useState('');
  const [viewerCount, setViewerCount] = useState(session?.viewerCount ?? 0);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [activeProductIdx, setActiveProductIdx] = useState(0);

  const flatListRef = useRef<FlatList<LiveMessage>>(null);
  const autoMsgTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const viewerTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const products = (session?.productIds ?? [])
    .map((pid) => mockProducts.find((p) => p.id === pid))
    .filter(Boolean) as (typeof mockProducts)[number][];

  // Auto-message generator
  useEffect(() => {
    const schedule = () => {
      const delay = 2000 + Math.random() * 3000;
      autoMsgTimerRef.current = setTimeout(() => {
        const msg = getRandomLiveMessage();
        setMessages((prev) => [...prev, msg].slice(-60)); // keep max 60
        schedule();
      }, delay);
    };
    schedule();
    return () => {
      if (autoMsgTimerRef.current) clearTimeout(autoMsgTimerRef.current);
    };
  }, []);

  // Auto-scroll chat on new messages
  useEffect(() => {
    const t = setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 80);
    return () => clearTimeout(t);
  }, [messages]);

  // Viewer count fluctuation
  useEffect(() => {
    viewerTimerRef.current = setInterval(() => {
      setViewerCount((v) => Math.max(1, v + Math.floor(Math.random() * 5) - 2));
    }, 4000);
    return () => {
      if (viewerTimerRef.current) clearInterval(viewerTimerRef.current);
    };
  }, []);

  const handleSend = useCallback(() => {
    if (!inputText.trim()) return;
    const msg: LiveMessage = {
      id: `me-${Date.now()}`,
      userId: 'current_user',
      username: 'Vous',
      avatar: 'https://i.pravatar.cc/50?img=10',
      message: inputText.trim(),
    };
    setMessages((prev) => [...prev, msg]);
    setInputText('');
  }, [inputText]);

  const handleReaction = () => {
    const emoji = REACTION_EMOJIS[Math.floor(Math.random() * REACTION_EMOJIS.length)];
    const rightOffset = 8 + Math.random() * 44;
    const reaction: Reaction = {
      id: `r-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      emoji,
      rightOffset,
    };
    setReactions((prev) => [...prev, reaction]);
  };

  const removeReaction = useCallback((rid: string) => {
    setReactions((prev) => prev.filter((r) => r.id !== rid));
  }, []);

  if (!session) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: '#FFF', fontFamily: 'Poppins_400Regular' }}>
          Session introuvable
        </Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: '#F59E0B', fontFamily: 'Poppins_500Medium' }}>
            Retour
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentProduct = products[activeProductIdx];
  const bottomOffset = insets.bottom + INPUT_BAR_H;

  return (
    <View style={styles.container}>
      {/* ── Background: video placeholder ── */}
      <Image
        source={{ uri: session.thumbnail }}
        style={StyleSheet.absoluteFillObject}
        contentFit="cover"
      />

      {/* Dark overlay */}
      <View style={styles.darkOverlay} />

      {/* Top gradient */}
      <LinearGradient
        colors={['rgba(0,0,0,0.75)', 'transparent']}
        style={[styles.topGradient, { height: insets.top + 100 }]}
      />

      {/* Bottom gradient */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.85)']}
        style={[styles.bottomGradient, { height: CHAT_H + PRODUCT_CARD_H + bottomOffset + 60 }]}
      />

      {/* ── Top bar ── */}
      <View style={[styles.topBar, { top: insets.top + 8 }]}>
        {/* Close */}
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Feather name="x" size={20} color="#FFF" />
        </TouchableOpacity>

        {/* Host info */}
        <View style={styles.hostInfo}>
          <Image
            source={{ uri: session.hostAvatar }}
            style={styles.hostAvatar}
          />
          <View style={{ gap: 1 }}>
            <Text style={styles.hostName}>{session.hostName}</Text>
          </View>
          <View style={styles.liveChip}>
            <View style={styles.liveDot} />
            <Text style={styles.liveChipText}>EN DIRECT</Text>
          </View>
          <View style={styles.viewerChip}>
            <Feather name="eye" size={11} color="rgba(255,255,255,0.9)" />
            <Text style={styles.viewerCount}>{viewerCount}</Text>
          </View>
        </View>

        {/* Share */}
        <TouchableOpacity style={styles.closeBtn}>
          <Feather name="share-2" size={18} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* ── Chat feed ── */}
      <View
        style={[
          styles.chatContainer,
          { bottom: bottomOffset + PRODUCT_CARD_H + 8, height: CHAT_H },
        ]}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ChatMessageRow item={item} />}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }}
        />
      </View>

      {/* ── Product floating card ── */}
      {currentProduct && (
        <View
          style={[
            styles.productCard,
            { bottom: bottomOffset + 8 },
          ]}
        >
          <Image
            source={{ uri: currentProduct.images[0]?.url }}
            style={styles.productThumb}
          />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.productTitle} numberOfLines={1}>
              {currentProduct.title}
            </Text>
            <Text style={styles.productPrice}>
              {formatPrice(currentProduct.price)}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.buyBtn}
            onPress={() => router.push(`/checkout/${currentProduct.id}` as any)}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#14248A', '#2A8A6A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buyBtnGrad}
            >
              <Text style={styles.buyBtnText}>Acheter</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* Multiple products — swipe dots */}
      {products.length > 1 && (
        <View
          style={[
            styles.productDots,
            { bottom: bottomOffset + PRODUCT_CARD_H + 4 },
          ]}
        >
          {products.map((_, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => setActiveProductIdx(i)}
              style={[
                styles.productDot,
                i === activeProductIdx && styles.productDotActive,
              ]}
            />
          ))}
        </View>
      )}

      {/* ── Reaction button ── */}
      <TouchableOpacity
        style={[
          styles.reactionBtn,
          { bottom: bottomOffset + PRODUCT_CARD_H / 2 - 20 },
        ]}
        onPress={handleReaction}
        activeOpacity={0.8}
      >
        <Text style={{ fontSize: 26 }}>❤️</Text>
      </TouchableOpacity>

      {/* ── Floating reactions layer ── */}
      <View
        pointerEvents="none"
        style={[
          styles.reactionsLayer,
          { bottom: bottomOffset + PRODUCT_CARD_H },
        ]}
      >
        {reactions.map((r) => (
          <FloatingReaction
            key={r.id}
            emoji={r.emoji}
            rightOffset={r.rightOffset}
            onDone={() => removeReaction(r.id)}
          />
        ))}
      </View>

      {/* ── Input bar ── */}
      <View
        style={[
          styles.inputBar,
          { paddingBottom: insets.bottom + 8, height: INPUT_BAR_H + insets.bottom },
        ]}
      >
        <TouchableOpacity style={styles.emojiBtn} onPress={handleReaction}>
          <Text style={{ fontSize: 22 }}>😊</Text>
        </TouchableOpacity>
        <View style={styles.inputWrap}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Commenter..."
            placeholderTextColor="rgba(255,255,255,0.45)"
            returnKeyType="send"
            onSubmitEditing={handleSend}
          />
        </View>
        <TouchableOpacity
          style={[
            styles.sendBtn,
            { opacity: inputText.trim() ? 1 : 0.5 },
          ]}
          onPress={handleSend}
          disabled={!inputText.trim()}
        >
          <Feather name="send" size={18} color="#FFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },

  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },

  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },

  // Top bar
  topBar: {
    position: 'absolute',
    left: Spacing.md,
    right: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hostInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  hostAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#FFF',
    backgroundColor: '#333',
  },
  hostName: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: '#FFF',
    lineHeight: 17,
  },
  liveChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#FFF',
  },
  liveChipText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 9,
    color: '#FFF',
    letterSpacing: 0.5,
    lineHeight: 12,
  },
  viewerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  viewerCount: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 11,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 15,
  },

  // Chat
  chatContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
  },

  // Product card
  productCard: {
    position: 'absolute',
    left: Spacing.md,
    right: Spacing.md,
    height: PRODUCT_CARD_H,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  productThumb: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.sm,
    backgroundColor: '#333',
  },
  productTitle: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: '#FFF',
    lineHeight: 18,
  },
  productPrice: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 15,
    color: '#F59E0B',
    lineHeight: 20,
  },
  buyBtn: {
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
  },
  buyBtnGrad: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
  },
  buyBtnText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: '#FFF',
    lineHeight: 16,
  },

  // Product dots
  productDots: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  productDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  productDotActive: {
    width: 14,
    backgroundColor: '#F59E0B',
  },

  // Reaction button
  reactionBtn: {
    position: 'absolute',
    right: Spacing.md,
  },

  // Reactions layer
  reactionsLayer: {
    position: 'absolute',
    right: 0,
    width: 80,
    height: 240,
  },

  // Input bar
  inputBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 8,
  },
  emojiBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputWrap: {
    flex: 1,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: Spacing.md,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  input: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: '#FFF',
    padding: 0,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#14248A',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
