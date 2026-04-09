import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  ActionSheetIOS,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  FadeIn,
  FadeInUp,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/Colors';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import {
  useMessagesStore,
  ChatMessage,
} from '@/stores/useMessagesStore';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';

dayjs.locale('fr');

const { width: W } = Dimensions.get('window');
const MAX_BUBBLE_W = W * 0.75;

// ── Date separator helper ─────────────────────────────────────────────────

function getDateLabel(iso: string): string {
  const d = dayjs(iso);
  const now = dayjs();
  if (d.isSame(now, 'day')) return "Aujourd'hui";
  if (d.isSame(now.subtract(1, 'day'), 'day')) return 'Hier';
  return d.format('dddd D MMMM');
}

function shouldShowDateSep(msgs: ChatMessage[], idx: number): boolean {
  if (idx === 0) return true;
  const cur = dayjs(msgs[idx].createdAt);
  const prev = dayjs(msgs[idx - 1].createdAt);
  return !cur.isSame(prev, 'day');
}

// ── Typing dots indicator ─────────────────────────────────────────────────

function TypingDots() {
  const dot1 = useSharedValue(0);
  const dot2 = useSharedValue(0);
  const dot3 = useSharedValue(0);

  useEffect(() => {
    const bounce = withRepeat(
      withSequence(
        withTiming(-5, { duration: 300 }),
        withTiming(0, { duration: 300 }),
      ),
      -1,
      false,
    );
    dot1.value = bounce;
    setTimeout(() => { dot2.value = bounce; }, 150);
    setTimeout(() => { dot3.value = bounce; }, 300);
  }, []);

  const s1 = useAnimatedStyle(() => ({ transform: [{ translateY: dot1.value }] }));
  const s2 = useAnimatedStyle(() => ({ transform: [{ translateY: dot2.value }] }));
  const s3 = useAnimatedStyle(() => ({ transform: [{ translateY: dot3.value }] }));

  return (
    <Animated.View entering={FadeIn} style={ts.typingWrap}>
      <View style={ts.dotsRow}>
        <Animated.View style={[ts.dot, s1]} />
        <Animated.View style={[ts.dot, s2]} />
        <Animated.View style={[ts.dot, s3]} />
      </View>
    </Animated.View>
  );
}

const ts = StyleSheet.create({
  typingWrap: {
    alignSelf: 'flex-start',
    marginLeft: Spacing.lg,
    marginBottom: Spacing.sm,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#9CA3AF',
  },
});

// ── Offer Card ────────────────────────────────────────────────────────────

function OfferCard({
  message,
  isMine,
  product,
  onAccept,
  onReject,
  onCounter,
}: {
  message: ChatMessage;
  isMine: boolean;
  product: { title: string; image: string };
  onAccept: () => void;
  onReject: () => void;
  onCounter: () => void;
}) {
  const status = message.offerStatus;

  return (
    <View style={[oc.wrap, isMine ? oc.mine : oc.theirs]}>
      {/* Product preview */}
      <View style={oc.productRow}>
        <Image source={{ uri: product.image }} style={oc.productImg} contentFit="cover" />
        <Text style={oc.productTitle} numberOfLines={1}>{product.title}</Text>
      </View>

      {/* Offer amount */}
      <View style={oc.amountRow}>
        <Text style={oc.emoji}>🏷️</Text>
        <Text style={oc.amount}>{message.offerAmount}€</Text>
        <Text style={oc.label}>
          {isMine ? 'Votre offre' : 'Offre reçue'}
        </Text>
      </View>

      {/* Status / Actions */}
      {status === 'pending' && !isMine && (
        <View style={oc.actions}>
          <TouchableOpacity style={oc.acceptBtn} onPress={onAccept} activeOpacity={0.85}>
            <Ionicons name="checkmark" size={16} color="#FFF" />
            <Text style={oc.acceptText}>Accepter</Text>
          </TouchableOpacity>
          <TouchableOpacity style={oc.rejectBtn} onPress={onReject} activeOpacity={0.85}>
            <Ionicons name="close" size={16} color="#FFF" />
            <Text style={oc.rejectText}>Refuser</Text>
          </TouchableOpacity>
        </View>
      )}
      {status === 'pending' && isMine && (
        <Text style={oc.pendingText}>En attente de réponse…</Text>
      )}
      {status === 'accepted' && (
        <View style={oc.statusRow}>
          <Ionicons name="checkmark-circle" size={16} color={Colors.light.success} />
          <Text style={[oc.statusText, { color: Colors.light.success }]}>Offre acceptée ✓</Text>
        </View>
      )}
      {status === 'rejected' && (
        <View style={oc.statusCol}>
          <View style={oc.statusRow}>
            <Ionicons name="close-circle" size={16} color={Colors.light.error} />
            <Text style={[oc.statusText, { color: Colors.light.error }]}>Offre refusée ✗</Text>
          </View>
          {!isMine && (
            <TouchableOpacity onPress={onCounter} style={oc.counterBtn}>
              <Text style={oc.counterText}>Proposer un autre prix</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const oc = StyleSheet.create({
  wrap: {
    maxWidth: MAX_BUBBLE_W,
    borderRadius: 16,
    padding: Spacing.md,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.surface,
  },
  mine: { alignSelf: 'flex-end', marginRight: Spacing.lg },
  theirs: { alignSelf: 'flex-start', marginLeft: Spacing.lg },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  productImg: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: Colors.light.background,
  },
  productTitle: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: Colors.light.textSecondary,
    flex: 1,
    lineHeight: 16,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  emoji: { fontSize: 20 },
  amount: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 22,
    color: Colors.light.text,
    lineHeight: 28,
  },
  label: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: Colors.light.textSecondary,
    lineHeight: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: 2,
  },
  acceptBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.light.success,
  },
  acceptText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: '#FFF',
    lineHeight: 18,
  },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.light.error,
  },
  rejectText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: '#FFF',
    lineHeight: 18,
  },
  pendingText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  statusCol: {
    gap: Spacing.sm,
  },
  statusText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    lineHeight: 18,
  },
  counterBtn: {
    alignItems: 'center',
  },
  counterText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: Colors.light.primary,
    lineHeight: 16,
    textDecorationLine: 'underline',
  },
});

// ── Bubble ────────────────────────────────────────────────────────────────

function Bubble({ message }: { message: ChatMessage }) {
  const isMine = message.senderId === 'me';

  if (message.type === 'system') {
    return (
      <View style={bubble.systemWrap}>
        <View style={bubble.systemPill}>
          <Text style={bubble.systemText}>{message.text}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[bubble.row, isMine ? bubble.rowMine : bubble.rowTheirs]}>
      {isMine ? (
        <LinearGradient
          colors={[Colors.light.primary, Colors.light.primaryGradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[bubble.wrap, bubble.wrapMine]}
        >
          <Text style={bubble.textMine}>{message.text}</Text>
        </LinearGradient>
      ) : (
        <View style={[bubble.wrap, bubble.wrapTheirs]}>
          <Text style={bubble.textTheirs}>{message.text}</Text>
        </View>
      )}

      {/* Time + read receipts */}
      <View style={[bubble.meta, isMine ? bubble.metaMine : bubble.metaTheirs]}>
        <Text style={bubble.time}>
          {dayjs(message.createdAt).format('HH:mm')}
        </Text>
        {isMine && (
          <Ionicons
            name="checkmark-done"
            size={14}
            color={message.read ? '#60A5FA' : '#9CA3AF'}
          />
        )}
      </View>
    </View>
  );
}

const bubble = StyleSheet.create({
  row: {
    paddingHorizontal: Spacing.lg,
    gap: 2,
    marginBottom: 2,
  },
  rowMine: { alignItems: 'flex-end' },
  rowTheirs: { alignItems: 'flex-start' },
  wrap: {
    maxWidth: MAX_BUBBLE_W,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 18,
  },
  wrapMine: {
    borderBottomRightRadius: 4,
  },
  wrapTheirs: {
    backgroundColor: '#F3F4F6',
    borderBottomLeftRadius: 4,
  },
  textMine: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: '#FFF',
    lineHeight: 20,
  },
  textTheirs: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 2,
  },
  metaMine: { justifyContent: 'flex-end' },
  metaTheirs: { justifyContent: 'flex-start' },
  time: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 10,
    color: Colors.light.textSecondary,
    lineHeight: 14,
  },
  systemWrap: {
    alignItems: 'center',
    marginVertical: Spacing.sm,
    paddingHorizontal: Spacing.xl,
  },
  systemPill: {
    backgroundColor: `${Colors.light.primary}12`,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: `${Colors.light.primary}20`,
  },
  systemText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 11,
    color: Colors.light.primary,
    textAlign: 'center',
    lineHeight: 16,
  },
});

// ── Date separator ────────────────────────────────────────────────────────

function DateSep({ label }: { label: string }) {
  return (
    <View style={ds.wrap}>
      <View style={ds.line} />
      <Text style={ds.text}>{label}</Text>
      <View style={ds.line} />
    </View>
  );
}

const ds = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    marginVertical: Spacing.md,
    gap: Spacing.sm,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.light.border,
  },
  text: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 11,
    color: Colors.light.textSecondary,
    lineHeight: 15,
  },
});

// ── Offer input modal ─────────────────────────────────────────────────────

function OfferInput({
  visible,
  onSend,
  onClose,
}: {
  visible: boolean;
  onSend: (amount: number) => void;
  onClose: () => void;
}) {
  const [val, setVal] = useState('');
  const ty = useSharedValue(200);

  useEffect(() => {
    ty.value = visible ? withSpring(0, { damping: 20, stiffness: 200 }) : withSpring(200);
  }, [visible]);

  const style = useAnimatedStyle(() => ({ transform: [{ translateY: ty.value }] }));

  if (!visible) return null;

  return (
    <Animated.View style={[oi.wrap, style]}>
      <View style={oi.header}>
        <Text style={oi.title}>Faire une offre</Text>
        <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close" size={20} color={Colors.light.text} />
        </TouchableOpacity>
      </View>
      <View style={oi.inputRow}>
        <TextInput
          style={oi.input}
          value={val}
          onChangeText={setVal}
          placeholder="Montant (€)"
          placeholderTextColor={Colors.light.textSecondary}
          keyboardType="numeric"
          autoFocus
        />
        <TouchableOpacity
          onPress={() => {
            const n = parseFloat(val);
            if (n > 0) { onSend(n); setVal(''); onClose(); }
          }}
          activeOpacity={0.85}
          disabled={!val || parseFloat(val) <= 0}
        >
          <LinearGradient
            colors={[Colors.light.primary, Colors.light.primaryGradientEnd]}
            style={oi.sendBtn}
          >
            <Text style={oi.sendText}>Envoyer l'offre</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const oi = StyleSheet.create({
  wrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.light.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: Spacing.xl,
    gap: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 17,
    color: Colors.light.text,
    lineHeight: 22,
  },
  inputRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 48,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    fontFamily: 'Poppins_500Medium',
    fontSize: 16,
    color: Colors.light.text,
  },
  sendBtn: {
    height: 48,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: '#FFF',
    lineHeight: 18,
  },
});

// ── Main ──────────────────────────────────────────────────────────────────

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [text, setText] = useState('');
  const [showProduct, setShowProduct] = useState(true);
  const [showOfferInput, setShowOfferInput] = useState(false);
  const flatRef = useRef<FlatList>(null);

  const {
    conversations,
    messages,
    sendMessage,
    sendOffer,
    respondOffer,
  } = useMessagesStore();

  const conv = conversations.find((c) => c.id === id);
  const msgs = messages[id ?? ''] ?? [];

  const handleSend = useCallback(() => {
    if (!text.trim() || !id) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    sendMessage(id, text.trim());
    setText('');
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 50);
  }, [text, id, sendMessage]);

  const handleSendOffer = useCallback(
    (amount: number) => {
      if (!id) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      sendOffer(id, amount);
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 50);
    },
    [id, sendOffer],
  );

  const showAttachSheet = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Annuler', 'Envoyer une photo', 'Faire une offre'],
          cancelButtonIndex: 0,
        },
        (idx) => {
          if (idx === 2) setShowOfferInput(true);
        },
      );
    } else {
      Alert.alert('Ajouter', 'Choisissez une option', [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Faire une offre', onPress: () => setShowOfferInput(true) },
      ]);
    }
  };

  const handleCounterOffer = () => setShowOfferInput(true);

  if (!conv) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Conversation introuvable</Text>
      </View>
    );
  }

  const lastSeenLabel = conv.participant.isOnline
    ? 'En ligne'
    : conv.participant.lastSeen
    ? `Vu ${dayjs(conv.participant.lastSeen).fromNow()}`
    : 'Hors ligne';

  // Build render list with date separators
  type ListItem =
    | { kind: 'sep'; label: string; key: string }
    | { kind: 'msg'; message: ChatMessage; key: string };

  const listItems: ListItem[] = [];
  msgs.forEach((m, i) => {
    if (shouldShowDateSep(msgs, i)) {
      listItems.push({
        kind: 'sep',
        label: getDateLabel(m.createdAt),
        key: `sep_${m.id}`,
      });
    }
    listItems.push({ kind: 'msg', message: m, key: m.id });
  });

  const renderItem = ({ item }: { item: ListItem }) => {
    if (item.kind === 'sep') {
      return <DateSep key={item.key} label={item.label} />;
    }
    const m = item.message;
    if (m.type === 'offer') {
      return (
        <View style={{ marginVertical: Spacing.sm }}>
          <OfferCard
            key={m.id}
            message={m}
            isMine={m.senderId === 'me'}
            product={conv.product}
            onAccept={() => respondOffer(id!, m.id, 'accepted')}
            onReject={() => respondOffer(id!, m.id, 'rejected')}
            onCounter={handleCounterOffer}
          />
          <Text
            style={[
              bubble.time,
              {
                textAlign: m.senderId === 'me' ? 'right' : 'left',
                paddingHorizontal: Spacing.lg,
                marginTop: 2,
              },
            ]}
          >
            {dayjs(m.createdAt).format('HH:mm')}
          </Text>
        </View>
      );
    }
    return <Bubble key={m.id} message={m} />;
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <View style={[ms.root, { paddingTop: insets.top }]}>
        {/* ── Header ── */}
        <View style={ms.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={ms.backBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="arrow-back" size={22} color={Colors.light.text} />
          </TouchableOpacity>

          <View style={ms.headerCenter}>
            <View style={ms.headerAvatarWrap}>
              <Image
                source={{ uri: conv.participant.avatar }}
                style={ms.headerAvatar}
                contentFit="cover"
              />
              {conv.participant.isOnline && <View style={ms.onlineDot} />}
            </View>
            <View style={{ flex: 1 }}>
              <View style={ms.nameRow}>
                <Text style={ms.headerName} numberOfLines={1}>
                  {conv.participant.username}
                </Text>
                {conv.participant.isVerified && (
                  <Ionicons
                    name="checkmark-circle"
                    size={14}
                    color={Colors.light.primary}
                  />
                )}
              </View>
              <Text style={ms.onlineStatus}>{lastSeenLabel}</Text>
            </View>
          </View>

          <TouchableOpacity style={ms.moreBtn} activeOpacity={0.75}>
            <Feather name="more-horizontal" size={20} color={Colors.light.text} />
          </TouchableOpacity>
        </View>

        {/* ── Product mini bar ── */}
        {showProduct && (
          <Animated.View entering={FadeInUp.duration(200)} style={ms.productBar}>
            <TouchableOpacity
              style={ms.productBarInner}
              onPress={() => router.push(`/product/${conv.product.id}` as never)}
              activeOpacity={0.8}
            >
              <Image
                source={{ uri: conv.product.image }}
                style={ms.productBarThumb}
                contentFit="cover"
              />
              <View style={{ flex: 1 }}>
                <Text style={ms.productBarTitle} numberOfLines={1}>
                  {conv.product.title}
                </Text>
                <Text style={ms.productBarPrice}>{conv.product.price} €</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.light.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowProduct(false)}
              style={ms.productBarDismiss}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Ionicons name="close" size={16} color={Colors.light.textSecondary} />
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* ── Messages ── */}
        <FlatList
          ref={flatRef}
          data={listItems}
          keyExtractor={(item) => item.key}
          contentContainerStyle={ms.listContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() =>
            flatRef.current?.scrollToEnd({ animated: false })
          }
          ListFooterComponent={
            conv.isTyping ? <TypingDots /> : null
          }
          renderItem={renderItem}
        />

        {/* ── Input bar ── */}
        <View style={[ms.inputBar, { paddingBottom: insets.bottom + Spacing.sm }]}>
          {/* + attachment */}
          <TouchableOpacity
            onPress={showAttachSheet}
            style={ms.attachBtn}
            activeOpacity={0.75}
          >
            <Ionicons name="add" size={22} color={Colors.light.primary} />
          </TouchableOpacity>

          {/* Text input */}
          <TextInput
            style={ms.input}
            value={text}
            onChangeText={setText}
            placeholder="Message…"
            placeholderTextColor={Colors.light.textSecondary}
            multiline
            maxLength={1000}
            returnKeyType="default"
          />

          {/* Send button — appears when typing */}
          {text.trim().length > 0 && (
            <Animated.View entering={FadeIn.duration(150)}>
              <TouchableOpacity onPress={handleSend} activeOpacity={0.85}>
                <LinearGradient
                  colors={[Colors.light.primary, Colors.light.primaryGradientEnd]}
                  style={ms.sendBtn}
                >
                  <Ionicons name="arrow-up" size={20} color="#FFF" />
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>
      </View>

      {/* ── Offer input ── */}
      <OfferInput
        visible={showOfferInput}
        onSend={handleSendOffer}
        onClose={() => setShowOfferInput(false)}
      />
    </KeyboardAvoidingView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────

const ms = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.light.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.border,
    gap: Spacing.md,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerAvatarWrap: { position: 'relative' },
  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.light.background,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.light.success,
    borderWidth: 1.5,
    borderColor: Colors.light.surface,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerName: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    color: Colors.light.text,
    lineHeight: 20,
  },
  onlineStatus: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: Colors.light.textSecondary,
    lineHeight: 15,
  },
  moreBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.background,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Product bar
  productBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    backgroundColor: Colors.light.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.border,
    gap: Spacing.sm,
    height: 56,
  },
  productBarInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  productBarThumb: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: Colors.light.background,
  },
  productBarTitle: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: Colors.light.text,
    lineHeight: 17,
  },
  productBarPrice: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 13,
    color: Colors.light.primary,
    lineHeight: 17,
  },
  productBarDismiss: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.light.background,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Messages
  listContent: {
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },

  // Input bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    backgroundColor: Colors.light.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.light.border,
    gap: Spacing.sm,
  },
  attachBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${Colors.light.primary}12`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: Colors.light.background,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
});
