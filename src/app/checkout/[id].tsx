import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { formatPrice } from '@/utils';
import {
  calculatePricing,
  detectCardType,
  luhnCheck,
  validateExpiry,
  validateCVV,
  formatCardNumber,
  cardMaxLength,
  CardType,
} from '@/utils/pricing';
import { useCartStore } from '@/stores/useCartStore';
import { mockProducts } from '@/services/mock/products';
import { mockHubs } from '@/services/mock/hubs';

// ── Types ──────────────────────────────────────────────────────────────────

type DeliveryMethod = 'h2h' | 'handoff' | 'postal';

type SavedCard = {
  id: string;
  type: CardType;
  last4: string;
  expiry: string;
};

type CardFormState = {
  number: string;
  expiry: string;
  cvv: string;
  saveCard: boolean;
};

type AddressFormState = {
  street: string;
  postalCode: string;
  city: string;
};

// ── Constants ──────────────────────────────────────────────────────────────

const DELIVERY_FEES: Record<DeliveryMethod, number> = {
  h2h: 4.5,
  handoff: 0,
  postal: 8.5,
};

const SAVED_CARDS: SavedCard[] = [
  { id: 'c1', type: 'visa', last4: '4242', expiry: '12/26' },
  { id: 'c2', type: 'mastercard', last4: '5555', expiry: '08/25' },
];

const CONDITION_META: Record<string, { label: string; color: string }> = {
  new: { label: 'Neuf', color: '#10B981' },
  like_new: { label: 'Comme neuf', color: '#34D399' },
  good: { label: 'Bon état', color: '#3B82F6' },
  fair: { label: 'État correct', color: '#F59E0B' },
  poor: { label: 'Médiocre', color: '#EF4444' },
};

const CARD_TYPE_LABELS: Record<CardType, string> = {
  visa: 'VISA',
  mastercard: 'MC',
  amex: 'AMEX',
  unknown: '💳',
};

// ── Sub-components ─────────────────────────────────────────────────────────

function SectionTitle({
  title,
  theme,
}: {
  title: string;
  theme: typeof Colors.light;
}) {
  return <Text style={[sc.sectionTitle, { color: theme.text }]}>{title}</Text>;
}

function RadioCard({
  selected,
  onPress,
  theme,
  children,
}: {
  selected: boolean;
  onPress: () => void;
  theme: typeof Colors.light;
  children: React.ReactNode;
}) {
  return (
    <TouchableOpacity
      style={[
        sc.radioCard,
        {
          backgroundColor: theme.surface,
          borderColor: selected ? theme.primary : theme.border,
          borderWidth: selected ? 2 : 1,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View
        style={[
          sc.radioOuter,
          { borderColor: selected ? theme.primary : theme.border },
        ]}
      >
        {selected && (
          <View style={[sc.radioInner, { backgroundColor: theme.primary }]} />
        )}
      </View>
      <View style={{ flex: 1 }}>{children}</View>
    </TouchableOpacity>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────

export default function CheckoutScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  // Product lookup
  const product = mockProducts.find((p) => p.id === id) ?? mockProducts[0];
  const isAuction = product.listingType === 'auction';

  // State
  const [quantity, setQuantity] = useState(1);
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('h2h');
  const [selectedCardId, setSelectedCardId] = useState<string>('c1');
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [cardForm, setCardForm] = useState<CardFormState>({
    number: '',
    expiry: '',
    cvv: '',
    saveCard: false,
  });
  const [addressForm, setAddressForm] = useState<AddressFormState>({
    street: '',
    postalCode: '',
    city: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const placeOrder = useCartStore((s) => s.placeOrder);
  const expiryRef = useRef<TextInput>(null);
  const cvvRef = useRef<TextInput>(null);

  // Pricing
  const itemPrice = product.price * quantity;
  const deliveryFee = DELIVERY_FEES[deliveryMethod];
  const { serviceFee, total } = calculatePricing(itemPrice, deliveryFee);

  // Card validation
  const rawDigits = cardForm.number.replace(/\D/g, '');
  const cardType = detectCardType(rawDigits);
  const isCardValid =
    luhnCheck(rawDigits) &&
    rawDigits.length === cardMaxLength(cardType) &&
    validateExpiry(cardForm.expiry) &&
    validateCVV(cardForm.cvv, cardType);

  // Pay button enabled
  const hasPayment = isAddingCard ? isCardValid : selectedCardId !== '';
  const hasDelivery =
    deliveryMethod !== 'postal' ||
    (addressForm.street.trim() !== '' &&
      addressForm.postalCode.trim() !== '' &&
      addressForm.city.trim() !== '');
  const canPay = hasPayment && hasDelivery && !isLoading;

  const handleCardNumberChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '');
    const type = detectCardType(digits);
    const max = type === 'amex' ? 15 : 16;
    const trimmed = digits.slice(0, max);
    const formatted = formatCardNumber(trimmed, type);
    setCardForm((f) => ({ ...f, number: formatted }));
    // Auto-advance to expiry
    if (trimmed.length === max && expiryRef.current) {
      expiryRef.current.focus();
    }
  };

  const handleExpiryChange = (raw: string) => {
    let digits = raw.replace(/\D/g, '');
    if (digits.length > 4) digits = digits.slice(0, 4);
    let formatted = digits;
    if (digits.length >= 3) {
      formatted = digits.slice(0, 2) + '/' + digits.slice(2);
    }
    setCardForm((f) => ({ ...f, expiry: formatted }));
    if (digits.length === 4 && cvvRef.current) {
      cvvRef.current.focus();
    }
  };

  const handlePay = async () => {
    if (!canPay) return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    setIsLoading(true);
    // Simulate payment processing
    await new Promise((r) => setTimeout(r, 2000));
    const orderId = `ord-${Date.now()}`;
    const orderNumber = `HTH-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    placeOrder(orderId, orderNumber);
    setIsLoading(false);
    router.replace('/checkout/success');
  };

  const originHub = mockHubs[0];
  const destHub = mockHubs[1];
  const conditionMeta = CONDITION_META[product.condition] ?? CONDITION_META.good;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.surface,
            borderBottomColor: theme.border,
            paddingTop: insets.top + 8,
          },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Paiement</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Order summary ──────────────────────────────────────────── */}
        <SectionTitle title="Récapitulatif" theme={theme} />
        <View
          style={[
            styles.summaryCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Image
            source={{ uri: product.images[0]?.url ?? product.images[0]?.thumbnail }}
            style={styles.productThumb}
            contentFit="cover"
          />
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={[styles.productTitle, { color: theme.text }]} numberOfLines={2}>
              {product.title}
            </Text>
            <View style={styles.badgeRow}>
              <View style={[styles.conditionBadge, { backgroundColor: `${conditionMeta.color}18` }]}>
                <Text style={[styles.conditionText, { color: conditionMeta.color }]}>
                  {conditionMeta.label}
                </Text>
              </View>
            </View>
            {isAuction ? (
              <Text style={[styles.auctionPrice, { color: theme.primary }]}>
                Prix final d'enchère : {formatPrice(product.price)}
              </Text>
            ) : (
              <Text style={[styles.productPrice, { color: theme.primary }]}>
                {formatPrice(product.price)}
              </Text>
            )}
          </View>

          {/* Quantity selector (only for stock > 1 non-auction items) */}
          {!isAuction && product.stock > 1 && (
            <View style={styles.qtyWrapper}>
              <TouchableOpacity
                style={[styles.qtyBtn, { borderColor: theme.border }]}
                onPress={() => setQuantity((q) => Math.max(1, q - 1))}
              >
                <Feather name="minus" size={14} color={theme.text} />
              </TouchableOpacity>
              <Text style={[styles.qtyValue, { color: theme.text }]}>{quantity}</Text>
              <TouchableOpacity
                style={[styles.qtyBtn, { borderColor: theme.border }]}
                onPress={() => setQuantity((q) => Math.min(product.stock, q + 1))}
              >
                <Feather name="plus" size={14} color={theme.text} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ── Delivery method ────────────────────────────────────────── */}
        <SectionTitle title="Mode de livraison" theme={theme} />

        <RadioCard
          selected={deliveryMethod === 'h2h'}
          onPress={() => setDeliveryMethod('h2h')}
          theme={theme}
        >
          <View style={styles.deliveryRow}>
            <View style={[styles.deliveryIcon, { backgroundColor: `${theme.primary}12` }]}>
              <Feather name="package" size={18} color={theme.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.deliveryLabel, { color: theme.text }]}>
                Hand to Hand Logistics
              </Text>
              <Text style={[styles.deliverySub, { color: theme.textSecondary }]}>
                Transporteur particulier · 24–72h
              </Text>
            </View>
            <Text style={[styles.deliveryPrice, { color: theme.primary }]}>2–5€</Text>
          </View>
        </RadioCard>

        <RadioCard
          selected={deliveryMethod === 'handoff'}
          onPress={() => setDeliveryMethod('handoff')}
          theme={theme}
        >
          <View style={styles.deliveryRow}>
            <View style={[styles.deliveryIcon, { backgroundColor: `${theme.success}12` }]}>
              <Feather name="user" size={18} color={theme.success} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.deliveryLabel, { color: theme.text }]}>
                Remise en main propre
              </Text>
              <Text style={[styles.deliverySub, { color: theme.textSecondary }]}>
                {product.seller.city} · À convenir avec le vendeur
              </Text>
            </View>
            <Text style={[styles.deliveryPrice, { color: theme.success }]}>Gratuit</Text>
          </View>
        </RadioCard>

        <RadioCard
          selected={deliveryMethod === 'postal'}
          onPress={() => setDeliveryMethod('postal')}
          theme={theme}
        >
          <View style={styles.deliveryRow}>
            <View style={[styles.deliveryIcon, { backgroundColor: `${theme.warning}12` }]}>
              <Feather name="send" size={18} color={theme.warning} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.deliveryLabel, { color: theme.text }]}>Envoi postal</Text>
              <Text style={[styles.deliverySub, { color: theme.textSecondary }]}>
                Colissimo · 3–7 jours ouvrés
              </Text>
            </View>
            <Text style={[styles.deliveryPrice, { color: theme.warning }]}>
              {formatPrice(DELIVERY_FEES.postal)}
            </Text>
          </View>
        </RadioCard>

        {/* ── Conditional delivery details ───────────────────────────── */}
        {deliveryMethod === 'h2h' && (
          <Animated.View entering={FadeIn} exiting={FadeOut}>
            <View
              style={[
                styles.detailCard,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <Text style={[styles.detailTitle, { color: theme.text }]}>Hubs sélectionnés</Text>
              <View style={styles.hubRow}>
                <View style={[styles.hubChip, { backgroundColor: `${theme.primary}10` }]}>
                  <Feather name="map-pin" size={12} color={theme.primary} />
                  <Text style={[styles.hubChipText, { color: theme.primary }]}>
                    Dépôt : {originHub.name}
                  </Text>
                </View>
              </View>
              <View style={styles.hubRow}>
                <View style={[styles.hubChip, { backgroundColor: `${theme.success}10` }]}>
                  <Feather name="map-pin" size={12} color={theme.success} />
                  <Text style={[styles.hubChipText, { color: theme.success }]}>
                    Retrait : {destHub.name}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.changeHubBtn, { borderColor: theme.primary }]}
                onPress={() => router.push('/logistics/select-hub')}
              >
                <Feather name="edit-2" size={12} color={theme.primary} />
                <Text style={[styles.changeHubText, { color: theme.primary }]}>
                  Modifier les hubs
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {deliveryMethod === 'handoff' && (
          <Animated.View entering={FadeIn} exiting={FadeOut}>
            <View
              style={[
                styles.detailCard,
                { backgroundColor: `${theme.success}08`, borderColor: `${theme.success}30` },
              ]}
            >
              <View style={styles.meetRow}>
                <Feather name="map-pin" size={16} color={theme.success} />
                <View>
                  <Text style={[styles.detailTitle, { color: theme.text }]}>
                    Point de rendez-vous
                  </Text>
                  <Text style={[styles.meetAddress, { color: theme.textSecondary }]}>
                    {product.seller.city} — À confirmer avec {product.seller.username}
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>
        )}

        {deliveryMethod === 'postal' && (
          <Animated.View entering={FadeIn} exiting={FadeOut}>
            <View
              style={[
                styles.detailCard,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <Text style={[styles.detailTitle, { color: theme.text }]}>
                Adresse de livraison
              </Text>
              <TextInput
                style={[styles.textInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                placeholder="Adresse"
                placeholderTextColor={theme.textSecondary}
                value={addressForm.street}
                onChangeText={(t) => setAddressForm((f) => ({ ...f, street: t }))}
              />
              <View style={styles.inputRow}>
                <TextInput
                  style={[
                    styles.textInput,
                    styles.inputHalf,
                    { color: theme.text, borderColor: theme.border, backgroundColor: theme.background },
                  ]}
                  placeholder="Code postal"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="numeric"
                  maxLength={5}
                  value={addressForm.postalCode}
                  onChangeText={(t) => setAddressForm((f) => ({ ...f, postalCode: t.replace(/\D/g, '') }))}
                />
                <TextInput
                  style={[
                    styles.textInput,
                    styles.inputFlex,
                    { color: theme.text, borderColor: theme.border, backgroundColor: theme.background },
                  ]}
                  placeholder="Ville"
                  placeholderTextColor={theme.textSecondary}
                  value={addressForm.city}
                  onChangeText={(t) => setAddressForm((f) => ({ ...f, city: t }))}
                />
              </View>
            </View>
          </Animated.View>
        )}

        {/* ── Price breakdown ────────────────────────────────────────── */}
        <View
          style={[
            styles.priceCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <View style={styles.priceRow}>
            <Text style={[styles.priceLabel, { color: theme.textSecondary }]}>
              Prix de l'article{quantity > 1 ? ` ×${quantity}` : ''}
            </Text>
            <Text style={[styles.priceValue, { color: theme.text }]}>
              {formatPrice(itemPrice)}
            </Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={[styles.priceLabel, { color: theme.textSecondary }]}>
              Frais de livraison
            </Text>
            <Text style={[styles.priceValue, { color: theme.text }]}>
              {deliveryFee === 0 ? 'Gratuit' : formatPrice(deliveryFee)}
            </Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={[styles.priceLabel, { color: theme.textSecondary }]}>
              Frais de service (5%)
            </Text>
            <Text style={[styles.priceValue, { color: theme.text }]}>
              {formatPrice(serviceFee)}
            </Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={[styles.priceLabel, { color: theme.textSecondary }]}>
              Protection acheteur
            </Text>
            <Text style={[styles.priceInclus, { color: theme.success }]}>Incluse ✓</Text>
          </View>
          <View style={[styles.priceDivider, { backgroundColor: theme.border }]} />
          <View style={styles.priceRow}>
            <Text style={[styles.totalLabel, { color: theme.text }]}>Total</Text>
            <Text style={[styles.totalValue, { color: theme.primary }]}>
              {formatPrice(total)}
            </Text>
          </View>
        </View>

        {/* ── Payment method ─────────────────────────────────────────── */}
        <SectionTitle title="Moyen de paiement" theme={theme} />

        {/* Saved cards */}
        {!isAddingCard &&
          SAVED_CARDS.map((card) => (
            <TouchableOpacity
              key={card.id}
              style={[
                styles.cardRow,
                {
                  backgroundColor: theme.surface,
                  borderColor: selectedCardId === card.id ? theme.primary : theme.border,
                  borderWidth: selectedCardId === card.id ? 2 : 1,
                },
              ]}
              onPress={() => setSelectedCardId(card.id)}
            >
              <View style={[styles.cardTypeTag, { backgroundColor: `${theme.primary}12` }]}>
                <Text style={[styles.cardTypeText, { color: theme.primary }]}>
                  {CARD_TYPE_LABELS[card.type]}
                </Text>
              </View>
              <Text style={[styles.cardLabel, { color: theme.text }]}>
                •••• {card.last4}
              </Text>
              <Text style={[styles.cardExpiry, { color: theme.textSecondary }]}>
                {card.expiry}
              </Text>
              <View
                style={[
                  styles.radioOuter,
                  { borderColor: selectedCardId === card.id ? theme.primary : theme.border },
                ]}
              >
                {selectedCardId === card.id && (
                  <View style={[styles.radioInner, { backgroundColor: theme.primary }]} />
                )}
              </View>
            </TouchableOpacity>
          ))}

        {/* Add card button */}
        {!isAddingCard ? (
          <TouchableOpacity
            style={[styles.addCardBtn, { borderColor: theme.border }]}
            onPress={() => {
              setSelectedCardId('');
              setIsAddingCard(true);
            }}
          >
            <Feather name="plus" size={16} color={theme.primary} />
            <Text style={[styles.addCardText, { color: theme.primary }]}>
              Ajouter une carte
            </Text>
          </TouchableOpacity>
        ) : (
          <Animated.View
            entering={FadeIn}
            style={[
              styles.cardFormCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <View style={styles.cardFormHeader}>
              <Text style={[styles.detailTitle, { color: theme.text }]}>
                Nouvelle carte
              </Text>
              <TouchableOpacity onPress={() => { setIsAddingCard(false); setSelectedCardId('c1'); }}>
                <Feather name="x" size={18} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Card number */}
            <View
              style={[
                styles.cardInputWrapper,
                { borderColor: theme.border, backgroundColor: theme.background },
              ]}
            >
              <TextInput
                style={[styles.cardInput, { color: theme.text }]}
                placeholder="Numéro de carte"
                placeholderTextColor={theme.textSecondary}
                keyboardType="numeric"
                value={cardForm.number}
                onChangeText={handleCardNumberChange}
                maxLength={cardType === 'amex' ? 17 : 19}
              />
              {rawDigits.length > 0 && (
                <View style={[styles.cardTypeTag, { backgroundColor: `${theme.primary}12` }]}>
                  <Text style={[styles.cardTypeText, { color: theme.primary }]}>
                    {CARD_TYPE_LABELS[cardType]}
                  </Text>
                </View>
              )}
            </View>

            {/* Expiry + CVV */}
            <View style={styles.inputRow}>
              <View
                style={[
                  styles.cardInputWrapper,
                  styles.inputHalf,
                  { borderColor: theme.border, backgroundColor: theme.background },
                ]}
              >
                <TextInput
                  ref={expiryRef}
                  style={[styles.cardInput, { color: theme.text }]}
                  placeholder="MM/AA"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="numeric"
                  value={cardForm.expiry}
                  onChangeText={handleExpiryChange}
                  maxLength={5}
                />
              </View>
              <View
                style={[
                  styles.cardInputWrapper,
                  styles.inputFlex,
                  { borderColor: theme.border, backgroundColor: theme.background },
                ]}
              >
                <TextInput
                  ref={cvvRef}
                  style={[styles.cardInput, { color: theme.text }]}
                  placeholder={cardType === 'amex' ? 'CVV (4 chiffres)' : 'CVV'}
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="numeric"
                  secureTextEntry
                  value={cardForm.cvv}
                  onChangeText={(t) =>
                    setCardForm((f) => ({
                      ...f,
                      cvv: t.replace(/\D/g, '').slice(0, cardType === 'amex' ? 4 : 3),
                    }))
                  }
                  maxLength={cardType === 'amex' ? 4 : 3}
                />
              </View>
            </View>

            {/* Card validation feedback */}
            {rawDigits.length > 6 && !luhnCheck(rawDigits) && (
              <Text style={[styles.cardError, { color: theme.error }]}>
                Numéro de carte invalide
              </Text>
            )}
            {cardForm.expiry.length === 5 && !validateExpiry(cardForm.expiry) && (
              <Text style={[styles.cardError, { color: theme.error }]}>
                Date d'expiration invalide ou dépassée
              </Text>
            )}

            {/* Save card toggle */}
            <View style={styles.saveCardRow}>
              <Text style={[styles.saveCardLabel, { color: theme.text }]}>
                Sauvegarder cette carte
              </Text>
              <Switch
                value={cardForm.saveCard}
                onValueChange={(v) => setCardForm((f) => ({ ...f, saveCard: v }))}
                trackColor={{ false: theme.border, true: `${theme.primary}60` }}
                thumbColor={cardForm.saveCard ? theme.primary : theme.textSecondary}
              />
            </View>
          </Animated.View>
        )}

        {/* Platform pay button */}
        <TouchableOpacity
          style={[styles.platformPayBtn, { borderColor: theme.border }]}
          activeOpacity={0.8}
        >
          <Feather
            name={Platform.OS === 'ios' ? 'smartphone' : 'smartphone'}
            size={18}
            color={theme.text}
          />
          <Text style={[styles.platformPayText, { color: theme.text }]}>
            {Platform.OS === 'ios' ? 'Apple Pay' : 'Google Pay'}
          </Text>
        </TouchableOpacity>

        {/* ── Buyer protection ───────────────────────────────────────── */}
        <View
          style={[
            styles.protectionCard,
            { backgroundColor: `${theme.success}10`, borderColor: `${theme.success}25` },
          ]}
        >
          <View style={styles.protectionHeader}>
            <Feather name="shield" size={20} color={theme.success} />
            <Text style={[styles.protectionTitle, { color: theme.success }]}>
              🛡️ Protection acheteur
            </Text>
          </View>
          <Text style={[styles.protectionBody, { color: theme.textSecondary }]}>
            Votre paiement est bloqué et sécurisé jusqu'à la confirmation de réception du colis.
          </Text>
          <TouchableOpacity>
            <Text style={[styles.protectionLink, { color: theme.primary }]}>En savoir plus</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Sticky pay button ──────────────────────────────────────────── */}
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
          onPress={handlePay}
          disabled={!canPay}
          style={{ opacity: canPay ? 1 : 0.55 }}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={[theme.primary, theme.primaryGradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.payBtn}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <>
                <Feather name="lock" size={16} color="#FFF" />
                <Text style={styles.payBtnText}>Payer {formatPrice(total)}</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ── Shared styles for sub-components ──────────────────────────────────────

const sc = StyleSheet.create({
  sectionTitle: { ...Typography.h3 },
  radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioInner: { width: 10, height: 10, borderRadius: 5 },
  radioCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
});

// ── Main styles ────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
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

  scrollContent: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },

  // Order summary
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  productThumb: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.sm,
    backgroundColor: '#E5E7EB',
  },
  productTitle: { ...Typography.bodyMedium, fontFamily: 'Poppins_600SemiBold' },
  badgeRow: { flexDirection: 'row' },
  conditionBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  conditionText: { ...Typography.captionMedium },
  productPrice: { ...Typography.bodyMedium, fontFamily: 'Poppins_600SemiBold' },
  auctionPrice: { ...Typography.caption, fontFamily: 'Poppins_600SemiBold' },
  qtyWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    alignSelf: 'flex-end',
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyValue: { ...Typography.bodyMedium, width: 20, textAlign: 'center' },

  // Delivery
  radioCard: sc.radioCard,
  radioOuter: sc.radioOuter,
  radioInner: sc.radioInner,

  deliveryRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  deliveryIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deliveryLabel: { ...Typography.bodyMedium, fontFamily: 'Poppins_600SemiBold' },
  deliverySub: { ...Typography.caption },
  deliveryPrice: { ...Typography.captionMedium, fontFamily: 'Poppins_600SemiBold' },

  // Detail cards
  detailCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  detailTitle: { ...Typography.bodyMedium, fontFamily: 'Poppins_600SemiBold' },
  hubRow: { flexDirection: 'row' },
  hubChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  hubChipText: { ...Typography.captionMedium },
  changeHubBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    marginTop: Spacing.xs,
  },
  changeHubText: { ...Typography.captionMedium },
  meetRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  meetAddress: { ...Typography.caption, marginTop: 2 },

  // Address form inputs
  textInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    ...Typography.body,
  },
  inputRow: { flexDirection: 'row', gap: Spacing.sm },
  inputHalf: { width: 120 },
  inputFlex: { flex: 1 },

  // Price breakdown
  priceCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceLabel: { ...Typography.body },
  priceValue: { ...Typography.bodyMedium },
  priceInclus: { ...Typography.bodyMedium, fontFamily: 'Poppins_600SemiBold' },
  priceDivider: { height: 1, marginVertical: Spacing.xs },
  totalLabel: { ...Typography.bodyMedium, fontFamily: 'Poppins_700Bold', fontSize: 16 },
  totalValue: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    lineHeight: 26,
  },

  // Payment cards
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  cardTypeTag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  cardTypeText: { ...Typography.captionMedium, fontFamily: 'Poppins_700Bold', fontSize: 10 },
  cardLabel: { ...Typography.bodyMedium, flex: 1 },
  cardExpiry: { ...Typography.caption },
  addCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  addCardText: { ...Typography.bodyMedium },

  // Card form
  cardFormCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.md,
  },
  cardFormHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
  },
  cardInput: {
    flex: 1,
    paddingVertical: Spacing.md,
    ...Typography.body,
  },
  cardError: { ...Typography.caption, marginTop: -Spacing.sm },
  saveCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  saveCardLabel: { ...Typography.body },

  // Platform pay
  platformPayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
  },
  platformPayText: { ...Typography.bodyMedium },

  // Buyer protection
  protectionCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  protectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  protectionTitle: { ...Typography.bodyMedium, fontFamily: 'Poppins_700Bold' },
  protectionBody: { ...Typography.body, lineHeight: 22 },
  protectionLink: { ...Typography.captionMedium, textDecorationLine: 'underline' },

  // Bottom bar
  bottomBar: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  payBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: 15,
    borderRadius: BorderRadius.md,
    minHeight: 52,
  },
  payBtnText: { ...Typography.button, color: '#FFF', fontSize: 16 },

  sectionTitle: { ...Typography.h3 },
});
