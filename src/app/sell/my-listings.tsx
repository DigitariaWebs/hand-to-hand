import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Platform,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { mockProducts } from '@/services/mock/products';
import { Product } from '@/types/product';
import { formatPrice } from '@/utils';

const { width: W } = Dimensions.get('window');

const REVEAL_W = 160; // width of swipe-revealed action buttons

// Mock: seller u1's listings
const MY_LISTINGS = mockProducts
  .filter((p) => p.seller.id === 'u1')
  .slice(0, 6);

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  active:   { label: 'Active',    color: '#059669', bg: '#D1FAE5' },
  sold:     { label: 'Vendue',    color: '#6B7280', bg: '#F3F4F6' },
  reserved: { label: 'Réservée', color: '#D97706', bg: '#FEF3C7' },
  expired:  { label: 'Expirée',  color: '#EF4444', bg: '#FEE2E2' },
};

// ── Stat card ────────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View style={ss.statCard}>
      <View style={[ss.statIcon, { backgroundColor: `${color}18` }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={ss.statValue}>{value}</Text>
      <Text style={ss.statLabel}>{label}</Text>
    </View>
  );
}

// ── Listing row ───────────────────────────────────────────────────────────

function ListingRow({
  product,
  onDelete,
  onBoost,
}: {
  product: Product;
  onDelete: () => void;
  onBoost: () => void;
}) {
  const [stock, setStock] = useState(product.stock);
  const translateX = useSharedValue(0);
  const startX = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .activeOffsetX([-8, 8])
    .onBegin(() => {
      startX.value = translateX.value;
    })
    .onUpdate((e) => {
      const next = startX.value + e.translationX;
      translateX.value = Math.max(-REVEAL_W, Math.min(0, next));
    })
    .onEnd((e) => {
      if (translateX.value < -REVEAL_W / 2 || e.velocityX < -300) {
        translateX.value = withSpring(-REVEAL_W, { damping: 20, stiffness: 200 });
      } else {
        translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
      }
    });

  const rowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const close = () => {
    translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
  };

  const status = STATUS_CONFIG[product.status] ?? STATUS_CONFIG.active;
  const img = product.images[0]?.url ?? '';

  return (
    <View style={ss.rowWrap}>
      {/* Revealed actions */}
      <View style={ss.actions}>
        <TouchableOpacity
          style={[ss.actionBtn, { backgroundColor: Colors.light.warning }]}
          onPress={() => { close(); onBoost(); }}
        >
          <Ionicons name="flash" size={18} color="#FFF" />
          <Text style={ss.actionLabel}>Boost</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[ss.actionBtn, { backgroundColor: Colors.light.error }]}
          onPress={() => { close(); onDelete(); }}
        >
          <Feather name="trash-2" size={18} color="#FFF" />
          <Text style={ss.actionLabel}>Supprimer</Text>
        </TouchableOpacity>
      </View>

      {/* Row content */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[ss.row, rowStyle]}>
          <Image
            source={{ uri: img }}
            style={ss.thumb}
            contentFit="cover"
            transition={{ effect: 'cross-dissolve', duration: 200 }}
          />
          <View style={{ flex: 1, gap: 3 }}>
            <View style={ss.rowTop}>
              <Text style={ss.rowTitle} numberOfLines={1}>
                {product.title}
              </Text>
              <View style={[ss.statusBadge, { backgroundColor: status.bg }]}>
                <Text style={[ss.statusText, { color: status.color }]}>
                  {status.label}
                </Text>
              </View>
            </View>
            <Text style={ss.rowPrice}>{formatPrice(product.price)}</Text>

            <View style={ss.rowMeta}>
              <Ionicons name="eye-outline" size={12} color={Colors.light.textSecondary} />
              <Text style={ss.metaText}>{product.viewCount} vues</Text>
              <Ionicons name="heart-outline" size={12} color={Colors.light.textSecondary} />
              <Text style={ss.metaText}>{product.likeCount} favoris</Text>
            </View>

            {/* Stock stepper */}
            <View style={ss.stockRow}>
              <Text style={ss.stockLabel}>Stock :</Text>
              <View style={ss.stepper}>
                <TouchableOpacity
                  onPress={() => setStock(Math.max(0, stock - 1))}
                  style={ss.stepBtn}
                  disabled={stock <= 0}
                  hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                >
                  <Feather
                    name="minus"
                    size={13}
                    color={stock <= 0 ? Colors.light.border : Colors.light.primary}
                  />
                </TouchableOpacity>
                <Text style={ss.stepVal}>{stock}</Text>
                <TouchableOpacity
                  onPress={() => setStock(stock + 1)}
                  style={ss.stepBtn}
                  hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                >
                  <Feather name="plus" size={13} color={Colors.light.primary} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────

export default function MyListings() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [listings, setListings] = useState(MY_LISTINGS);

  const totalViews = listings.reduce((s, p) => s + p.viewCount, 0);
  const totalLikes = listings.reduce((s, p) => s + p.likeCount, 0);
  const activeCount = listings.filter((p) => p.status === 'active').length;

  const handleDelete = (id: string) => {
    Alert.alert(
      'Supprimer l\'annonce',
      'Cette annonce sera définitivement supprimée. Vous pourrez en créer une nouvelle à tout moment.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => setListings((prev) => prev.filter((p) => p.id !== id)),
        },
      ],
    );
  };

  const handleBoost = (id: string) => {
    router.push(`/boost/${id}` as never);
  };

  const ListHeader = () => (
    <>
      {/* Stats */}
      <View style={ss.statsRow}>
        <StatCard
          icon="bag-check-outline"
          label="Annonces actives"
          value={String(activeCount)}
          color={Colors.light.primary}
        />
        <StatCard
          icon="eye-outline"
          label="Vues totales"
          value={totalViews >= 1000 ? `${(totalViews / 1000).toFixed(1)}k` : String(totalViews)}
          color="#7C3AED"
        />
        <StatCard
          icon="heart-outline"
          label="Favoris"
          value={String(totalLikes)}
          color="#EF4444"
        />
      </View>

      {/* New listing CTA */}
      <TouchableOpacity
        onPress={() => router.push('/sell' as never)}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={[Colors.light.primary, Colors.light.primaryGradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={ss.newListingBtn}
        >
          <Ionicons name="add-circle-outline" size={20} color="#FFF" />
          <Text style={ss.newListingText}>Publier une nouvelle annonce</Text>
        </LinearGradient>
      </TouchableOpacity>

      <Text style={ss.sectionTitle}>Mes annonces ({listings.length})</Text>
      <Text style={ss.swipeHint}>
        <Ionicons name="swap-horizontal-outline" size={12} color={Colors.light.textSecondary} />
        {' '}Glissez vers la gauche pour les actions
      </Text>
    </>
  );

  return (
    <View style={[ss.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={ss.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={ss.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={22} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={ss.headerTitle}>Mes annonces</Text>
        <View style={{ width: 36 }} />
      </View>

      <FlatList
        data={listings}
        keyExtractor={(p) => p.id}
        ListHeaderComponent={<ListHeader />}
        renderItem={({ item }) => (
          <ListingRow
            product={item}
            onDelete={() => handleDelete(item.id)}
            onBoost={() => handleBoost(item.id)}
          />
        )}
        ListEmptyComponent={
          <View style={ss.empty}>
            <Ionicons name="bag-outline" size={52} color={Colors.light.border} />
            <Text style={ss.emptyTitle}>Pas encore d'annonce</Text>
            <Text style={ss.emptySub}>
              C'est le moment idéal pour publier votre première annonce
            </Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────

const ss = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.light.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    color: Colors.light.text,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    gap: Spacing.xs,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
    }),
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 20,
    color: Colors.light.text,
    lineHeight: 26,
  },
  statLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 10,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 14,
  },

  // New listing
  newListingBtn: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    height: 50,
    borderRadius: BorderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  newListingText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    color: '#FFF',
    lineHeight: 20,
  },

  sectionTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    color: Colors.light.text,
    paddingHorizontal: Spacing.lg,
    marginBottom: 2,
  },
  swipeHint: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: Colors.light.textSecondary,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    lineHeight: 16,
  },

  // Listing row
  rowWrap: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    position: 'relative',
  },
  actions: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: REVEAL_W,
    flexDirection: 'row',
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  actionLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11,
    color: '#FFF',
    lineHeight: 15,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.md,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
    }),
  },
  thumb: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.light.background,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  rowTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: Colors.light.text,
    flex: 1,
    lineHeight: 18,
  },
  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 10,
    lineHeight: 14,
  },
  rowPrice: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 15,
    color: Colors.light.primary,
    lineHeight: 20,
  },
  rowMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: Colors.light.textSecondary,
    marginRight: 8,
    lineHeight: 16,
  },

  // Stock stepper
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: 2,
  },
  stockLabel: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 11,
    color: Colors.light.textSecondary,
    lineHeight: 16,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
  },
  stepBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: Colors.light.background,
  },
  stepVal: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: Colors.light.text,
    minWidth: 28,
    textAlign: 'center',
  },

  // Empty state
  empty: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: Spacing.xxxl,
    gap: Spacing.md,
  },
  emptyTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    color: Colors.light.text,
  },
  emptySub: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
