import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Share,
  Platform,
  Dimensions,
  Linking,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  withSequence,
  withSpring,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { Colors } from '@/constants/Colors';
import { mockProducts } from '@/services/mock/products';
import { formatPrice, formatRelativeTime } from '@/utils';
import { Product, ProductCondition } from '@/types/product';
import { HowItWorksSheet } from '@/components/logistics/HowItWorksSheet';
import { useAuthStore } from '@/stores/useAuthStore';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { useAppStore } from '@/stores/useAppStore';
import fr from '@/i18n/fr';
import en from '@/i18n/en';

const { width: W, height: H } = Dimensions.get('window');
const GALLERY_H = H * 0.52;
const PRIMARY = '#14248A';
const PRIMARY_END = '#2A8A6A';

// ─── Types ────────────────────────────────────────────────────────────────────

type DeliveryKey = 'logistics_hub' | 'logistics_pickup' | 'handover' | 'postal';

// ─── Constants ────────────────────────────────────────────────────────────────

const CONDITION_CONFIG: Record<ProductCondition, { label: string; color: string; bg: string }> = {
  new: { label: 'Neuf', color: '#065F46', bg: '#D1FAE5' },
  like_new: { label: 'Très bon état', color: '#1E40AF', bg: '#DBEAFE' },
  good: { label: 'Bon état', color: '#92400E', bg: '#FEF3C7' },
  fair: { label: 'Satisfaisant', color: '#9A3412', bg: '#FED7AA' },
  poor: { label: 'Mauvais état', color: '#991B1B', bg: '#FEE2E2' },
};

const BATTERY: Record<ProductCondition, string> = {
  new: '100%',
  like_new: '91%',
  good: '84%',
  fair: '76%',
  poor: '63%',
};

type DeliveryOption = {
  key: DeliveryKey;
  emoji: string;
  title: string;
  subtitle: string;
  price: string;
  tag: string | null;
  detail?: string;
  ecommerceBadge?: boolean;
};

function buildDeliveryOptions(seller: { isVerifiedEcommerce?: boolean; storeAddress?: string; storeHours?: { open: string; close: string } }): DeliveryOption[] {
  const isEcom = seller.isVerifiedEcommerce === true;
  const options: DeliveryOption[] = [];

  if (isEcom) {
    // E-commerce verified: pickup direct + hub
    options.push({
      key: 'logistics_pickup',
      emoji: '🚗',
      title: 'Hand to Hand — Pickup boutique',
      subtitle: `Le transporteur récupère chez le vendeur • 24-48h`,
      price: '2–5 €',
      tag: 'Recommandé',
      detail: seller.storeAddress
        ? `Adresse boutique : ${seller.storeAddress}`
        : undefined,
      ecommerceBadge: true,
    });
    options.push({
      key: 'logistics_hub',
      emoji: '🚗',
      title: 'Hand to Hand — Via hub',
      subtitle: 'Livraison via hub de dépôt • 24-72h',
      price: '2–5 €',
      tag: null,
      detail: "Sous réserve de disponibilité d'un transporteur sur votre route",
    });
  } else {
    // Individual: hub only
    options.push({
      key: 'logistics_hub',
      emoji: '🚗',
      title: 'Hand to Hand Logistics',
      subtitle: 'Livraison via transporteur particulier • 24-72h',
      price: '2–5 €',
      tag: 'Recommandé',
      detail: "Sous réserve de disponibilité d'un transporteur sur votre route",
    });
  }

  options.push(
    {
      key: 'handover',
      emoji: '🤝',
      title: 'Remise en main propre',
      subtitle: 'Rencontrez le vendeur directement',
      price: 'Gratuit',
      tag: null,
    },
    {
      key: 'postal',
      emoji: '📦',
      title: 'Envoi postal',
      subtitle: 'Expédition classique par le vendeur',
      price: '4.50 €',
      tag: null,
    },
  );

  return options;
}

const MEMBER_SINCE: Record<string, string> = {
  u1: 'juin 2023',
  u2: 'janvier 2022',
  u3: 'mars 2024',
  u4: 'novembre 2023',
  u5: 'août 2023',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getDealInfo(score: number, price: number, originalPrice?: number) {
  const pct = originalPrice ? Math.round((1 - price / originalPrice) * 100) : 0;
  if (score >= 85)
    return {
      label: `🟢 Excellente affaire${pct ? ` — ${pct}% sous le marché` : ''}`,
      bg: '#059669',
      color: '#FFF',
      useGradient: true,
      gradient: ['#059669', '#10B981'] as [string, string],
    };
  if (score >= 70)
    return {
      label: `🟢 Bonne affaire${pct ? ` — ${pct}% sous le marché` : ''}`,
      bg: '#D1FAE5',
      color: '#065F46',
      useGradient: false,
      gradient: null,
    };
  if (score >= 55)
    return {
      label: '🟡 Prix juste — Prix du marché',
      bg: '#FEF3C7',
      color: '#92400E',
      useGradient: false,
      gradient: null,
    };
  if (score >= 40)
    return {
      label: '🟠 Légèrement au-dessus du marché',
      bg: '#FED7AA',
      color: '#9A3412',
      useGradient: false,
      gradient: null,
    };
  return {
    label: '🔴 Au-dessus du marché',
    bg: '#FEE2E2',
    color: '#991B1B',
    useGradient: false,
    gradient: null,
  };
}

function capitalize(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
}

type Spec = { label: string; value: string; tooltip?: string };

function getProductSpecs(product: Product, tooltips: { batteryTooltip: string }): Spec[] {
  const cond = CONDITION_CONFIG[product.condition].label;
  const brand = capitalize(product.tags[1] ?? product.tags[0] ?? 'Non précisé');

  switch (product.category) {
    case 'electronique':
      return [
        { label: 'État', value: cond },
        { label: 'Marque', value: brand },
        {
          label: 'État batterie',
          value: BATTERY[product.condition],
          tooltip: tooltips.batteryTooltip,
        },
        { label: 'Couleur', value: 'Noir Spatial' },
        { label: 'Connectivité', value: '5G / Wi-Fi 6' },
      ];
    case 'vehicules':
      return [
        { label: 'Kilométrage', value: '45 000 km' },
        { label: 'Année', value: '2019' },
        { label: 'Carburant', value: 'Essence' },
        { label: 'Boîte', value: 'Automatique' },
        { label: 'État', value: cond },
      ];
    case 'vetements':
    case 'chaussures':
      return [
        { label: 'État', value: cond },
        { label: 'Taille', value: 'L / 42' },
        { label: 'Marque', value: brand },
        { label: 'Matière', value: 'Coton 100%' },
        { label: 'Couleur', value: 'Blanc cassé' },
      ];
    case 'luxe':
      return [
        { label: 'État', value: cond },
        { label: 'Taille', value: 'L' },
        { label: 'Marque', value: brand },
        { label: 'Matière', value: "Duvet d'oie 90/10" },
        { label: 'Couleur', value: 'Bleu marine' },
      ];
    case 'maison':
      return [
        { label: 'État', value: cond },
        { label: 'Marque', value: brand },
        { label: 'Dimensions', value: '120 × 80 cm' },
        { label: 'Matière', value: 'Bois massif' },
        { label: 'Couleur', value: 'Chêne naturel' },
      ];
    case 'sport':
      return [
        { label: 'État', value: cond },
        { label: 'Marque', value: brand },
        { label: 'Taille', value: 'M (54 cm)' },
        { label: 'Matériau', value: 'Carbone' },
        { label: 'Couleur', value: 'Blanc / Noir' },
      ];
    default:
      return [
        { label: 'État', value: cond },
        { label: 'Marque', value: brand },
        { label: 'Couleur', value: capitalize(product.tags[1] ?? 'Non précisé') },
      ];
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StarRating({ rating, size = 13 }: { rating: number; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 1 }}>
      {[1, 2, 3, 4, 5].map((i) => {
        const full = i <= Math.floor(rating);
        const half = !full && i === Math.ceil(rating) && rating % 1 >= 0.5;
        return (
          <Ionicons
            key={i}
            name={full ? 'star' : half ? 'star-half' : 'star-outline'}
            size={size}
            color={full || half ? '#F59E0B' : '#D1D5DB'}
          />
        );
      })}
    </View>
  );
}

function CompactCard({ product, onPress }: { product: Product; onPress: () => void }) {
  return (
    <TouchableOpacity style={compact.card} onPress={onPress} activeOpacity={0.88}>
      <Image
        source={{ uri: product.images[0]?.url ?? '' }}
        style={compact.img}
        contentFit="cover"
        transition={{ effect: 'cross-dissolve', duration: 200 }}
      />
      <View style={compact.info}>
        <Text style={compact.title} numberOfLines={2}>
          {product.title}
        </Text>
        <Text style={compact.price}>{formatPrice(product.price)}</Text>
      </View>
    </TouchableOpacity>
  );
}

const compact = StyleSheet.create({
  card: {
    width: 140,
    backgroundColor: '#FFF',
    borderRadius: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
      },
      android: { elevation: 2 },
    }),
  },
  img: { width: 140, height: 120 },
  info: { padding: 8, gap: 3 },
  title: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: Colors.light.text,
    lineHeight: 15,
  },
  price: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: PRIMARY },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const product = mockProducts.find((p) => p.id === id);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [liked, setLiked] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const deliveryOptions = product ? buildDeliveryOptions(product.seller) : [];
  const defaultDeliveryKey = product?.seller.isVerifiedEcommerce ? 'logistics_pickup' : 'logistics_hub';
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryKey>(defaultDeliveryKey);
  const [howItWorksVisible, setHowItWorksVisible] = useState(false);

  const authUser = useAuthStore((s) => s.user);
  const isOwnListing = !!product && !!authUser && authUser.id === product?.seller.username;
  const sellerShowsPhone = product?.seller?.showPhoneOnListings === true;
  const sellerPhone = product?.seller?.phone;

  const heartScale = useSharedValue(1);
  const scrollY = useSharedValue(0);

  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  // Header overlay fades in as user scrolls past the gallery
  const overlayBg = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [GALLERY_H - 100, GALLERY_H], [0, 1], Extrapolation.CLAMP),
  }));

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollY.value = e.contentOffset.y;
    },
  });

  const handleLike = () => {
    setLiked((v) => !v);
    heartScale.value = withSequence(
      withSpring(1.45, { damping: 4, stiffness: 400 }),
      withSpring(1, { damping: 12 }),
    );
  };

  const handleShare = useCallback(async () => {
    if (!product) return;
    try {
      await Share.share({
        message: `Regarde ce produit sur Hand to Hand : ${product.title} — ${formatPrice(product.price)}`,
        title: product.title,
      });
    } catch {}
  }, [product]);

  const similar = useMemo(() => {
    if (!product) return [];
    const sameCat = mockProducts.filter(
      (p) => p.id !== product.id && p.category === product.category,
    );
    if (sameCat.length >= 3) return sameCat.slice(0, 5);
    const others = mockProducts.filter(
      (p) => p.id !== product.id && p.category !== product.category,
    );
    return [...sameCat, ...others].slice(0, 5);
  }, [product]);

  // ── Not found ──
  if (!product) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: Colors.light.background,
        }}
      >
        <Ionicons name="alert-circle-outline" size={56} color="#E5E7EB" />
        <Text
          style={{
            fontFamily: 'Poppins_500Medium',
            fontSize: 15,
            color: Colors.light.textSecondary,
            marginTop: 12,
          }}
        >
          Produit introuvable
        </Text>
        <TouchableOpacity
          style={{
            marginTop: 20,
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 999,
            borderWidth: 1.5,
            borderColor: PRIMARY,
          }}
          onPress={() => router.back()}
        >
          <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 13, color: PRIMARY }}>
            Retour
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const deal = getDealInfo(product.dealScore, product.price, product.originalPrice);
  const condConfig = CONDITION_CONFIG[product.condition];
  const { language } = useAppStore();
  const t = language === 'en' ? en : fr;
  const specs = getProductSpecs(product, {
    batteryTooltip: t.product.batteryTooltip,
  });
  const memberSince = MEMBER_SINCE[product.seller.id] ?? 'récemment';
  const discountPct = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* ── Main scroll ── */}
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >

        {/* ── Image gallery ── */}
        <View style={{ height: GALLERY_H, backgroundColor: '#F3F4F6' }}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            onMomentumScrollEnd={(e) => {
              setCurrentIndex(Math.round(e.nativeEvent.contentOffset.x / W));
            }}
            scrollEventThrottle={32}
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

          {/* Pagination dots */}
          {product.images.length > 1 && (
            <View style={styles.dotsRow}>
              {product.images.map((_, i) => (
                <View
                  key={i}
                  style={[styles.dot, i === currentIndex && styles.dotActive]}
                />
              ))}
            </View>
          )}

          {/* Image count pill */}
          <View style={styles.imgCount}>
            <Text style={styles.imgCountText}>
              {currentIndex + 1}/{product.images.length}
            </Text>
          </View>
        </View>

        {/* ── Deal score banner ── */}
        {deal.useGradient && deal.gradient ? (
          <LinearGradient
            colors={deal.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.dealBanner}
          >
            <Text style={[styles.dealText, { color: deal.color }]}>{deal.label}</Text>
          </LinearGradient>
        ) : (
          <View style={[styles.dealBanner, { backgroundColor: deal.bg }]}>
            <Text style={[styles.dealText, { color: deal.color }]}>{deal.label}</Text>
          </View>
        )}

        {/* ── Product info ── */}
        <View style={styles.section}>
          <Text style={styles.productTitle}>{product.title}</Text>

          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatPrice(product.price)}</Text>
            {product.originalPrice && (
              <Text style={styles.originalPrice}>{formatPrice(product.originalPrice)}</Text>
            )}
            {discountPct > 0 && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>-{discountPct}%</Text>
              </View>
            )}
          </View>

          <View style={styles.metaRow}>
            <View style={[styles.conditionBadge, { backgroundColor: condConfig.bg }]}>
              <Text style={[styles.conditionText, { color: condConfig.color }]}>
                {condConfig.label}
              </Text>
            </View>
            {product.stock === 1 ? (
              <View style={styles.stockRow}>
                <View style={[styles.stockDot, { backgroundColor: '#EF4444' }]} />
                <Text style={[styles.stockText, { color: '#EF4444' }]}>Dernier article</Text>
              </View>
            ) : (
              <View style={styles.stockRow}>
                <View style={[styles.stockDot, { backgroundColor: '#10B981' }]} />
                <Text style={[styles.stockText, { color: '#10B981' }]}>
                  {product.stock} en stock
                </Text>
              </View>
            )}
          </View>

          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color={Colors.light.textSecondary} />
            <Text style={styles.locationText}>
              {product.location.city}, {product.location.region}
            </Text>
            <Text style={styles.sep}>·</Text>
            <Text style={styles.locationText}>
              Publié {formatRelativeTime(product.createdAt)}
            </Text>
          </View>

          <View style={styles.statsRow}>
            <Ionicons name="eye-outline" size={13} color={Colors.light.textSecondary} />
            <Text style={styles.statText}>{product.viewCount} vues</Text>
            <Text style={styles.sep}>·</Text>
            <Ionicons name="heart-outline" size={13} color={Colors.light.textSecondary} />
            <Text style={styles.statText}>{product.likeCount} favoris</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* ── Specs ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Caractéristiques</Text>
          {specs.map((spec, i) => (
            <React.Fragment key={spec.label}>
              <View style={styles.specRow}>
                <Text style={styles.specLabel}>{spec.label}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.specValue}>{spec.value}</Text>
                  {spec.tooltip && <InfoTooltip text={spec.tooltip} iconSize={18} />}
                </View>
              </View>
              {i < specs.length - 1 && <View style={styles.specDivider} />}
            </React.Fragment>
          ))}
        </View>

        <View style={styles.divider} />

        {/* ── Description ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text
            style={styles.description}
            numberOfLines={descExpanded ? undefined : 4}
          >
            {product.description}
          </Text>
          <TouchableOpacity onPress={() => setDescExpanded((v) => !v)} style={{ marginTop: 8 }}>
            <Text style={styles.seeMore}>{descExpanded ? 'Voir moins' : 'Voir plus'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        {/* ── Seller ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vendeur</Text>

          <View style={styles.sellerCard}>
            <View style={{ position: 'relative' }}>
              <Image
                source={{ uri: product.seller.avatar }}
                style={styles.sellerAvatar}
                contentFit="cover"
              />
              {product.seller.isVerified && (
                <View style={styles.verifiedDot}>
                  <Ionicons name="checkmark-circle" size={17} color={PRIMARY} />
                </View>
              )}
            </View>

            <View style={styles.sellerInfo}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.sellerName}>{product.seller.username}</Text>
                {product.seller.isVerified && (
                  <View style={styles.verifiedPill}>
                    <Text style={styles.verifiedPillText}>Vérifié</Text>
                  </View>
                )}
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <StarRating rating={product.seller.rating} />
                <Text style={styles.sellerRatingText}>
                  {product.seller.rating} ({product.seller.reviewCount})
                </Text>
              </View>
              <Text style={styles.sellerMeta}>
                Membre depuis {memberSince} · {product.seller.city}
              </Text>
            </View>

            <TouchableOpacity style={styles.profileBtn}>
              <Text style={styles.profileBtnText}>Profil</Text>
              <Ionicons name="chevron-forward" size={13} color={PRIMARY} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.contactBtn}>
            <Ionicons name="chatbubble-outline" size={16} color={PRIMARY} />
            <Text style={styles.contactBtnText}>Contacter le vendeur</Text>
          </TouchableOpacity>

          {sellerShowsPhone && sellerPhone && !isOwnListing && (
            <>
              <TouchableOpacity
                style={[styles.contactBtn, { marginTop: 8, borderColor: PRIMARY_END }]}
                onPress={() => Linking.openURL(`tel:${sellerPhone}`)}
              >
                <Ionicons name="call-outline" size={16} color={PRIMARY_END} />
                <Text style={[styles.contactBtnText, { color: PRIMARY_END }]}>
                  Appeler le vendeur
                </Text>
              </TouchableOpacity>
              <Text style={{ fontSize: 11, color: '#6B7280', textAlign: 'center', marginTop: 4 }}>
                Le vendeur a choisi de partager son numéro
              </Text>
            </>
          )}
        </View>

        <View style={styles.divider} />

        {/* ── Delivery ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Livraison</Text>

          {/* H2H info card — visible to both buyers and sellers */}
          <View style={styles.h2hCard}>
            <View style={styles.h2hBorder} />
            <View style={{ flex: 1, gap: 6, padding: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 18 }}>🚗</Text>
                <Text style={styles.h2hTitle}>Livraison Hand to Hand disponible</Text>
              </View>
              <Text style={styles.h2hBody}>
                {isOwnListing
                  ? "Proposez ce colis à un transporteur qui fait déjà le trajet entre hubs. Économique, écologique, sécurisé."
                  : "Un transporteur particulier livre cet article entre hubs sur son trajet quotidien. Économique • Écologique • Sécurisé"}
              </Text>
              <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', marginTop: 4, flexWrap: 'wrap' }}>
                <TouchableOpacity
                  style={styles.h2hCta}
                  onPress={() =>
                    router.push(
                      isOwnListing
                        ? ('/become-transporter' as any)
                        : '/logistics/transporter-list',
                    )
                  }
                >
                  <Text style={styles.h2hCtaText}>
                    {isOwnListing ? 'Proposer un trajet' : 'Voir les transporteurs disponibles'}
                  </Text>
                  <Ionicons name="arrow-forward" size={14} color="#FFF" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setHowItWorksVisible(true)}>
                  <Text style={styles.h2hHowLink}>Comment ça marche ?</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Preparation hours info */}
          {product.seller.storeHours && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8, marginTop: 10, paddingHorizontal: 4 }}>
              <Ionicons name="time-outline" size={13} color="#6B7280" />
              <Text style={[styles.deliverySub, { fontSize: 11 }]}>
                Livraison Hand to Hand disponible pendant les horaires de préparation du vendeur ({product.seller.storeHours.open}–{product.seller.storeHours.close})
              </Text>
            </View>
          )}

          <View style={{ gap: 10 }}>
            {deliveryOptions.map((opt) => {
              const active = selectedDelivery === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.deliveryCard, active && styles.deliveryCardActive]}
                  onPress={() => setSelectedDelivery(opt.key)}
                  activeOpacity={0.85}
                >
                  <View style={[styles.radio, active && styles.radioActive]}>
                    {active && <View style={styles.radioFill} />}
                  </View>

                  <Text style={styles.deliveryEmoji}>{opt.emoji}</Text>

                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <Text style={styles.deliveryTitle}>{opt.title}</Text>
                      {opt.tag && (
                        <View style={styles.deliveryTagWrap}>
                          <Text style={styles.deliveryTagText}>{opt.tag}</Text>
                        </View>
                      )}
                      {opt.ecommerceBadge && (
                        <View style={[styles.deliveryTagWrap, { backgroundColor: '#8B5CF615' }]}>
                          <Text style={[styles.deliveryTagText, { color: '#8B5CF6' }]}>E-commerce</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.deliverySub}>{opt.subtitle}</Text>
                    {opt.detail && (
                      <Text style={[styles.deliverySub, { fontSize: 10, marginTop: 2, fontStyle: 'italic' }]}>{opt.detail}</Text>
                    )}
                    {(opt.key === 'logistics_hub' || opt.key === 'logistics_pickup') && (
                      <TouchableOpacity style={{ marginTop: 4 }} onPress={() => router.push('/logistics/transporter-list')}>
                        <Text style={styles.logisticsLink}>Trouver un transporteur →</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  <Text style={[styles.deliveryPrice, active && { color: PRIMARY }]}>
                    {opt.price}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.divider} />

        {/* ── Similar products ── */}
        {similar.length > 0 && (
          <View>
            <View style={[styles.section, { paddingBottom: 4 }]}>
              <Text style={styles.sectionTitle}>Produits similaires</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 18, gap: 12 }}
            >
              {similar.map((p) => (
                <CompactCard
                  key={p.id}
                  product={p}
                  onPress={() => router.push(`/product/${p.id}`)}
                />
              ))}
            </ScrollView>
          </View>
        )}
      </Animated.ScrollView>

      {/* ── Scroll-based white header fade ── */}
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          { height: insets.top + 60, backgroundColor: '#FFFFFF' },
          overlayBg,
        ]}
      />

      {/* ── Fixed overlay buttons ── */}
      <View style={[styles.topOverlay, { top: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.circleBtn}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Ionicons name="chevron-back" size={22} color={Colors.light.text} />
        </TouchableOpacity>

        <View style={styles.rightBtns}>
          <TouchableOpacity style={styles.circleBtn} onPress={handleShare}>
            <Ionicons name="share-outline" size={20} color={Colors.light.text} />
          </TouchableOpacity>
          <Animated.View style={heartStyle}>
            <TouchableOpacity style={styles.circleBtn} onPress={handleLike}>
              <Ionicons
                name={liked ? 'heart' : 'heart-outline'}
                size={20}
                color={liked ? '#EF4444' : Colors.light.text}
              />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>

      {/* ── Bottom action bar ── */}
      <BlurView
        intensity={90}
        tint="light"
        style={[styles.bottomBar, { paddingBottom: insets.bottom + 8 }]}
      >
        <TouchableOpacity style={styles.msgBtn}>
          <Ionicons name="chatbubble-outline" size={16} color={PRIMARY} />
          <Text style={styles.msgBtnText}>Message</Text>
        </TouchableOpacity>

        {product.listingType === 'offer' && (
          <TouchableOpacity style={styles.offerBtn}>
            <Text style={styles.offerBtnText}>Faire une offre</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={{ flex: 1 }}
          onPress={() => router.push(`/checkout/${product.id}`)}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={[PRIMARY, PRIMARY_END]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.buyBtn}
          >
            <Text style={styles.buyBtnText}>Acheter · {formatPrice(product.price)}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </BlurView>

      <HowItWorksSheet
        visible={howItWorksVisible}
        onClose={() => setHowItWorksVisible(false)}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },

  // Gallery
  dotsRow: {
    position: 'absolute',
    bottom: 14,
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
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  dotActive: {
    width: 20,
    backgroundColor: '#FFF',
  },
  imgCount: {
    position: 'absolute',
    bottom: 14,
    right: 14,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  imgCountText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 11,
    color: '#FFF',
  },

  // Deal banner
  dealBanner: {
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  dealText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    lineHeight: 16,
  },

  // Layout
  section: {
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  divider: {
    height: 8,
    backgroundColor: Colors.light.background,
  },
  sectionTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: Colors.light.text,
    marginBottom: 14,
  },

  // Product info
  productTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 18,
    color: Colors.light.text,
    lineHeight: 26,
    marginBottom: 10,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  price: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 26,
    color: PRIMARY,
    lineHeight: 32,
  },
  originalPrice: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 16,
    color: Colors.light.textSecondary,
    textDecorationLine: 'line-through',
  },
  discountBadge: {
    backgroundColor: '#FEE2E2',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  discountText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: '#EF4444',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  conditionBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  conditionText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    lineHeight: 16,
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  stockDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  stockText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  locationText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  sep: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: Colors.light.textSecondary,
  },

  // Specs
  specRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
  },
  specLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  specValue: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: Colors.light.text,
  },
  specDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#F3F4F6',
  },

  // Description
  description: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 22,
  },
  seeMore: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: PRIMARY,
  },

  // Seller
  sellerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
  },
  sellerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  verifiedDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#FFF',
    borderRadius: 10,
  },
  sellerInfo: { flex: 1, gap: 3 },
  sellerName: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: Colors.light.text,
  },
  verifiedPill: {
    backgroundColor: `${PRIMARY}14`,
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 1,
  },
  verifiedPillText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 10,
    color: PRIMARY,
  },
  sellerRatingText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: Colors.light.textSecondary,
  },
  sellerMeta: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: Colors.light.textSecondary,
  },
  profileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingLeft: 6,
    paddingTop: 2,
  },
  profileBtnText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: PRIMARY,
  },
  contactBtn: {
    height: 46,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: PRIMARY,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  contactBtnText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: PRIMARY,
  },

  // Delivery
  deliveryCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFF',
    gap: 10,
  },
  deliveryCardActive: {
    borderColor: PRIMARY,
    backgroundColor: `${PRIMARY}06`,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  radioActive: { borderColor: PRIMARY },
  radioFill: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: PRIMARY,
  },
  deliveryEmoji: { fontSize: 20 },
  deliveryTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: Colors.light.text,
  },
  deliverySub: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: Colors.light.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  deliveryTagWrap: {
    backgroundColor: '#D1FAE5',
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 1,
  },
  deliveryTagText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 9,
    color: '#065F46',
  },
  deliveryPrice: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: Colors.light.text,
    marginLeft: 4,
  },
  logisticsLink: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 11,
    color: PRIMARY,
  },

  // H2H eco card on product detail
  h2hCard: {
    flexDirection: 'row',
    backgroundColor: '#F0F1FA',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  h2hBorder: {
    width: 3,
    backgroundColor: PRIMARY,
  },
  h2hTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: PRIMARY,
  },
  h2hBody: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11.5,
    color: '#4B5563',
    lineHeight: 16,
  },
  h2hCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: PRIMARY,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  h2hCtaText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11,
    color: '#FFF',
  },
  h2hHowLink: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 11,
    color: PRIMARY,
    textDecorationLine: 'underline',
  },

  // Fixed overlays
  topOverlay: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    zIndex: 10,
  },
  rightBtns: { flexDirection: 'column', gap: 8 },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.14,
        shadowRadius: 4,
      },
      android: { elevation: 3 },
    }),
  },

  // Bottom bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
  },
  msgBtn: {
    height: 50,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: PRIMARY,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  msgBtnText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: PRIMARY,
  },
  offerBtn: {
    height: 50,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  offerBtnText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: Colors.light.text,
  },
  buyBtn: {
    height: 50,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  buyBtnText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: '#FFF',
  },
});
