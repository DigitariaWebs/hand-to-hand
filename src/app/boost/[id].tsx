import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import {
  detectCardType,
  formatCardNumber,
  cardMaxLength,
  type CardType,
} from '@/utils/pricing';

// ── Config ─────────────────────────────────────────────────────────────────

type TierId = 'essentiel' | 'premium' | 'ultra';

type Tier = {
  id: TierId;
  name: string;
  price: number;
  durationLabel: string;
  features: string[];
  popular: boolean;
};

const TIERS: Tier[] = [
  {
    id: 'essentiel',
    name: 'Essentiel',
    price: 1.99,
    durationLabel: '24 heures',
    features: [
      'Mise en avant 24h',
      'Priorité dans les recherches',
      'Badge ⚡ Boost visible',
    ],
    popular: false,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 3.49,
    durationLabel: '3 jours',
    features: [
      'Mise en avant 3 jours',
      'Priorité dans les recherches',
      'Badge ⚡ Boost visible',
      'Notification aux acheteurs favoris',
      'Statistiques de performance',
    ],
    popular: true,
  },
  {
    id: 'ultra',
    name: 'Ultra',
    price: 4.99,
    durationLabel: '7 jours',
    features: [
      'Mise en avant 7 jours',
      'Priorité dans les recherches',
      'Badge ⚡ Boost visible',
      'Notification aux acheteurs favoris',
      'Statistiques de performance',
      'Mise en avant sur la homepage',
      'Relance automatique incluse',
    ],
    popular: false,
  },
];

type ExtraId = 'photos' | 'relance';

const EXTRAS: { id: ExtraId; label: string; sub: string; price: number }[] = [
  {
    id: 'photos',
    label: 'Photos supplémentaires',
    sub: "Jusqu'à 10 photos dans l'annonce",
    price: 0.99,
  },
  {
    id: 'relance',
    label: 'Relance automatique',
    sub: 'Rappel envoyé aux acheteurs potentiels',
    price: 0.49,
  },
];

// ── Tier card ──────────────────────────────────────────────────────────────

function TierCard({
  tier,
  isSelected,
  onPress,
  theme,
}: {
  tier: Tier;
  isSelected: boolean;
  onPress: () => void;
  theme: typeof Colors.light;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.tierCard,
        {
          backgroundColor: isSelected ? `${theme.primary}08` : theme.surface,
          borderColor: isSelected ? theme.primary : theme.border,
          borderWidth: isSelected ? 2 : 1,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Popular badge */}
      {tier.popular && (
        <View
          style={[
            styles.popularBadge,
            { transform: [{ rotate: '-5deg' }] },
          ]}
        >
          <Text style={styles.popularText}>Populaire</Text>
        </View>
      )}

      {/* Header row */}
      <View style={styles.tierHeader}>
        <View style={{ flex: 1 }}>
          <Text
            style={[
              styles.tierName,
              { color: isSelected ? theme.primary : theme.text },
            ]}
          >
            {tier.name}
          </Text>
          <Text style={[styles.tierDuration, { color: theme.textSecondary }]}>
            {tier.durationLabel}
          </Text>
        </View>

        <Text
          style={[
            styles.tierPrice,
            { color: isSelected ? theme.primary : theme.text },
          ]}
        >
          {tier.price.toFixed(2)}€
        </Text>

        {isSelected ? (
          <View style={[styles.tierCheck, { backgroundColor: theme.primary }]}>
            <Feather name="check" size={12} color="#FFF" />
          </View>
        ) : (
          <View style={[styles.tierCheckEmpty, { borderColor: theme.border }]} />
        )}
      </View>

      {/* Features */}
      <View style={styles.tierFeatures}>
        {tier.features.map((f) => (
          <View key={f} style={styles.featureRow}>
            <Feather
              name="check"
              size={12}
              color={isSelected ? theme.primary : theme.success}
            />
            <Text style={[styles.featureText, { color: theme.textSecondary }]}>
              {f}
            </Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────

export default function BoostScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [selectedTier, setSelectedTier] = useState<TierId>('premium');
  const [extras, setExtras] = useState<Record<ExtraId, boolean>>({
    photos: false,
    relance: false,
  });
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const expiryRef = useRef<TextInput>(null);
  const cvvRef = useRef<TextInput>(null);

  const cardType: CardType = detectCardType(cardNumber);
  const maxLen = cardMaxLength(cardType);
  const formattedCard = formatCardNumber(cardNumber, cardType);

  const tier = TIERS.find((t) => t.id === selectedTier)!;
  const extrasTotal = EXTRAS.reduce(
    (sum, e) => sum + (extras[e.id] ? e.price : 0),
    0,
  );
  const total = Math.round((tier.price + extrasTotal) * 100) / 100;

  // Success animation values
  const checkScale = useSharedValue(0);
  const successOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));
  const successOverlayStyle = useAnimatedStyle(() => ({
    opacity: successOpacity.value,
  }));
  const successContentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  const handlePay = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setShowSuccess(true);
      successOpacity.value = withTiming(1, { duration: 200 });
      checkScale.value = withSpring(1, { damping: 12, stiffness: 180 });
      contentOpacity.value = withDelay(400, withTiming(1, { duration: 300 }));
    }, 2000);
  }, []);

  const handleCardChange = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, maxLen);
    setCardNumber(digits);
    if (digits.length === maxLen) expiryRef.current?.focus();
  };

  const handleExpiryChange = (text: string) => {
    let v = text.replace(/\D/g, '');
    if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2, 4);
    setExpiry(v);
    if (v.length === 5) cvvRef.current?.focus();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Header */}
        <View
          style={[
            styles.header,
            {
              paddingTop: insets.top + 8,
              backgroundColor: theme.surface,
              borderBottomColor: theme.border,
            },
          ]}
        >
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="x" size={20} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            Booster l'annonce
          </Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 100 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Info banner */}
          <View
            style={[
              styles.infoBanner,
              {
                backgroundColor: `${theme.boost}15`,
                borderColor: `${theme.boost}40`,
              },
            ]}
          >
            <Feather name="zap" size={18} color={theme.boost} />
            <Text style={[styles.infoText, { color: theme.text }]}>
              Les annonces boostées obtiennent jusqu'à{' '}
              <Text
                style={{
                  fontFamily: 'Poppins_700Bold',
                  color: theme.boost,
                }}
              >
                5× plus de vues
              </Text>{' '}
              et se vendent 3× plus vite.
            </Text>
          </View>

          {/* Tier cards */}
          <Text style={[styles.sectionLabel, { color: theme.text }]}>
            Durée du boost
          </Text>

          {TIERS.map((t) => (
            <TierCard
              key={t.id}
              tier={t}
              isSelected={selectedTier === t.id}
              onPress={() => setSelectedTier(t.id)}
              theme={theme}
            />
          ))}

          {/* Extras */}
          <Text style={[styles.sectionLabel, { color: theme.text }]}>
            Options supplémentaires
          </Text>

          {EXTRAS.map((extra) => (
            <View
              key={extra.id}
              style={[
                styles.extraRow,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.extraLabel, { color: theme.text }]}>
                  {extra.label}
                </Text>
                <Text style={[styles.extraSub, { color: theme.textSecondary }]}>
                  {extra.sub}
                </Text>
              </View>
              <Text style={[styles.extraPrice, { color: theme.primary }]}>
                +{extra.price.toFixed(2)}€
              </Text>
              <Switch
                value={extras[extra.id]}
                onValueChange={() =>
                  setExtras((prev) => ({ ...prev, [extra.id]: !prev[extra.id] }))
                }
                trackColor={{ false: theme.border, true: `${theme.primary}60` }}
                thumbColor={extras[extra.id] ? theme.primary : '#F3F4F6'}
              />
            </View>
          ))}

          {/* Payment */}
          <Text style={[styles.sectionLabel, { color: theme.text }]}>
            Paiement
          </Text>

          <View
            style={[
              styles.payCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            {/* Card number */}
            <View
              style={[
                styles.inputWrap,
                {
                  borderColor: theme.border,
                  backgroundColor: theme.background,
                },
              ]}
            >
              <Feather name="credit-card" size={16} color={theme.textSecondary} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Numéro de carte"
                placeholderTextColor={theme.textSecondary}
                value={formattedCard}
                onChangeText={handleCardChange}
                keyboardType="numeric"
                maxLength={maxLen + Math.floor(maxLen / 4) - 1}
              />
            </View>

            {/* Expiry + CVV row */}
            <View style={styles.inputRow}>
              <View
                style={[
                  styles.inputWrap,
                  {
                    flex: 1,
                    borderColor: theme.border,
                    backgroundColor: theme.background,
                  },
                ]}
              >
                <TextInput
                  ref={expiryRef}
                  style={[styles.input, { color: theme.text }]}
                  placeholder="MM/AA"
                  placeholderTextColor={theme.textSecondary}
                  value={expiry}
                  onChangeText={handleExpiryChange}
                  keyboardType="numeric"
                  maxLength={5}
                />
              </View>
              <View
                style={[
                  styles.inputWrap,
                  {
                    flex: 1,
                    borderColor: theme.border,
                    backgroundColor: theme.background,
                  },
                ]}
              >
                <TextInput
                  ref={cvvRef}
                  style={[styles.input, { color: theme.text }]}
                  placeholder="CVV"
                  placeholderTextColor={theme.textSecondary}
                  value={cvv}
                  onChangeText={(t) =>
                    setCvv(
                      t
                        .replace(/\D/g, '')
                        .slice(0, cardType === 'amex' ? 4 : 3),
                    )
                  }
                  keyboardType="numeric"
                  maxLength={cardType === 'amex' ? 4 : 3}
                  secureTextEntry
                />
              </View>
            </View>
          </View>

          {/* Total breakdown */}
          <View
            style={[
              styles.totalCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: theme.textSecondary }]}>
                Boost {tier.name}
              </Text>
              <Text style={[styles.totalValue, { color: theme.text }]}>
                {tier.price.toFixed(2)}€
              </Text>
            </View>
            {EXTRAS.filter((e) => extras[e.id]).map((e) => (
              <View key={e.id} style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: theme.textSecondary }]}>
                  {e.label}
                </Text>
                <Text style={[styles.totalValue, { color: theme.text }]}>
                  +{e.price.toFixed(2)}€
                </Text>
              </View>
            ))}
            <View style={[styles.totalDivider, { backgroundColor: theme.border }]} />
            <View style={styles.totalRow}>
              <Text style={[styles.totalFinalLabel, { color: theme.text }]}>
                Total
              </Text>
              <Text style={[styles.totalFinalValue, { color: theme.primary }]}>
                {total.toFixed(2)}€
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Pay button */}
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
          <TouchableOpacity
            style={styles.payBtn}
            onPress={handlePay}
            activeOpacity={0.85}
            disabled={loading}
          >
            <LinearGradient
              colors={['#F59E0B', '#F97316']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.payBtnGradient}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <>
                  <Feather name="zap" size={18} color="#FFF" />
                  <Text style={styles.payBtnText}>Payer {total.toFixed(2)}€</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* ── Success overlay ── */}
        {showSuccess && (
          <Animated.View
            style={[
              styles.successOverlay,
              { backgroundColor: theme.background },
              successOverlayStyle,
            ]}
          >
            <View style={[styles.successInner, { paddingBottom: insets.bottom + 24 }]}>
              {/* Animated check circle */}
              <Animated.View style={checkStyle}>
                <LinearGradient
                  colors={['#F59E0B', '#F97316']}
                  style={styles.checkCircle}
                >
                  <Feather name="zap" size={40} color="#FFF" />
                </LinearGradient>
              </Animated.View>

              {/* Title + info */}
              <Animated.View style={[styles.successInfo, successContentStyle]}>
                <Text style={[styles.successTitle, { color: theme.text }]}>
                  Annonce boostée !
                </Text>
                <Text style={[styles.successSub, { color: theme.textSecondary }]}>
                  ⚡ {tier.name} · {tier.durationLabel}
                </Text>
                <View
                  style={[
                    styles.successTimer,
                    {
                      backgroundColor: `${theme.boost}15`,
                      borderColor: `${theme.boost}30`,
                    },
                  ]}
                >
                  <Feather name="clock" size={13} color={theme.boost} />
                  <Text style={[styles.successTimerText, { color: theme.boost }]}>
                    Boost actif — expire dans {tier.durationLabel}
                  </Text>
                </View>
              </Animated.View>

              {/* CTA buttons */}
              <Animated.View style={[styles.successButtons, successContentStyle]}>
                <TouchableOpacity
                  style={[styles.statsBtn, { backgroundColor: theme.primary }]}
                  onPress={() => router.replace(`/stats/${id}` as any)}
                  activeOpacity={0.85}
                >
                  <Feather name="bar-chart-2" size={16} color="#FFF" />
                  <Text style={styles.statsBtnText}>Voir les statistiques</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.backToProductBtn, { borderColor: theme.border }]}
                  onPress={() => router.back()}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[styles.backToProductText, { color: theme.textSecondary }]}
                  >
                    Retour à l'annonce
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </Animated.View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { ...Typography.h3, flex: 1, textAlign: 'center' },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },

  // Info banner
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  infoText: { ...Typography.body, flex: 1, lineHeight: 22 },

  sectionLabel: {
    ...Typography.h3,
    marginTop: Spacing.sm,
  },

  // Tier card
  tierCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    position: 'relative',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: 20,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    zIndex: 1,
  },
  popularText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 10,
    color: '#FFF',
    lineHeight: 14,
  },
  tierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  tierName: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    lineHeight: 22,
  },
  tierDuration: { ...Typography.caption },
  tierPrice: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 22,
    lineHeight: 28,
  },
  tierCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierCheckEmpty: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
  },
  tierFeatures: {
    marginTop: Spacing.md,
    gap: 6,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  featureText: { ...Typography.caption, flex: 1, lineHeight: 18 },

  // Extras
  extraRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  extraLabel: { ...Typography.bodyMedium },
  extraSub: { ...Typography.caption, marginTop: 2 },
  extraPrice: {
    ...Typography.bodyMedium,
    fontFamily: 'Poppins_600SemiBold',
  },

  // Payment card
  payCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    height: 44,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    ...Typography.body,
    padding: 0,
  },
  inputRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },

  // Total
  totalCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalLabel: { ...Typography.body },
  totalValue: { ...Typography.body },
  totalDivider: { height: StyleSheet.hairlineWidth, marginVertical: 2 },
  totalFinalLabel: { ...Typography.bodyMedium, fontFamily: 'Poppins_600SemiBold' },
  totalFinalValue: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    lineHeight: 24,
  },

  // Bottom bar
  bottomBar: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  payBtn: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  payBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: 15,
  },
  payBtnText: { ...Typography.button, color: '#FFF', fontSize: 15 },

  // Success overlay
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 99,
  },
  successInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxl,
    gap: Spacing.xl,
  },
  checkCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successInfo: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  successTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 22,
    lineHeight: 30,
    textAlign: 'center',
  },
  successSub: {
    ...Typography.bodyMedium,
    textAlign: 'center',
  },
  successTimer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    marginTop: Spacing.xs,
  },
  successTimerText: { ...Typography.captionMedium },
  successButtons: {
    width: '100%',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  statsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
  },
  statsBtnText: { ...Typography.button, color: '#FFF' },
  backToProductBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  backToProductText: { ...Typography.bodyMedium },
});
