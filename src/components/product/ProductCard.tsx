import React, { memo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, useColorScheme } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { Colors, ThemeColors } from '@/constants/Colors';
import { Product } from '@/types/product';
import { formatPrice, formatRelativeTime } from '@/utils';

// ─── Deal badge config ──────────────────────────────────────────────────────────

type DealConfig = { label: string; bg: string; color: string };

function getDeal(score: number): DealConfig {
  if (score >= 85) return { label: 'Excellente affaire', bg: '#10B981', color: '#FFF'     };
  if (score >= 70) return { label: 'Bonne affaire',      bg: '#D1FAE5', color: '#065F46'  };
  if (score >= 55) return { label: 'Prix juste',         bg: '#FEF3C7', color: '#92400E'  };
  return               { label: 'Au-dessus du marché',   bg: '#FEE2E2', color: '#991B1B'  };
}

// ─── Component ─────────────────────────────────────────────────────────────────

type Props = {
  product: Product;
  onPress?: () => void;
};

function ProductCardInner({ product, onPress }: Props) {
  const colorScheme = useColorScheme();
  const t = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const styles = createStyles(t);
  const [liked, setLiked] = useState(false);
  const heartScale = useSharedValue(1);

  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  const handleLike = () => {
    setLiked((v) => !v);
    heartScale.value = withSequence(
      withSpring(1.5, { damping: 4, stiffness: 400 }),
      withSpring(1,   { damping: 12 }),
    );
  };

  const deal = getDeal(product.dealScore);
  const img  = product.images[0]?.url ?? '';

  return (
    <TouchableOpacity
      style={[styles.card, product.isBoosted && styles.cardBoosted]}
      onPress={onPress}
      activeOpacity={0.95}
    >

      {/* ── Image area ── */}
      <View style={styles.imgWrap}>
        <Image
          source={{ uri: img }}
          style={styles.img}
          contentFit="cover"
          transition={{ effect: 'cross-dissolve', duration: 250 }}
          placeholder={{ color: '#F3F4F6' }}
        />

        {/* Deal badge — top left */}
        <View style={[styles.dealBadge, { backgroundColor: deal.bg }]}>
          <Text style={[styles.dealText, { color: deal.color }]}>{deal.label}</Text>
        </View>

        {/* Boost badge — top right */}
        {product.isBoosted && (
          <View style={styles.boostBadge}>
            <Text style={styles.boostText}>⚡ Boost</Text>
          </View>
        )}

        {/* Heart — bottom right */}
        <Animated.View style={[styles.heartWrap, heartStyle]}>
          <TouchableOpacity
            onPress={handleLike}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.8}
          >
            <Ionicons
              name={liked ? 'heart' : 'heart-outline'}
              size={16}
              color={liked ? '#EF4444' : '#FFF'}
            />
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* ── Info area ── */}
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{product.title}</Text>
        <Text style={styles.price}>{formatPrice(product.price)}</Text>
        <Text style={styles.meta}>
          {product.location.city} · {formatRelativeTime(product.createdAt)}
        </Text>
        {product.stock > 1 && (
          <Text style={styles.stock}>{product.stock} en stock</Text>
        )}
      </View>

    </TouchableOpacity>
  );
}

export const ProductCard = memo(ProductCardInner);

// ─── Styles ────────────────────────────────────────────────────────────────────

const createStyles = (t: ThemeColors) => StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: t.surface,
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

  // Image
  imgWrap: {
    aspectRatio: 1,
    backgroundColor: '#F3F4F6',
    position: 'relative',
  },
  img: {
    width: '100%',
    height: '100%',
  },
  dealBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  dealText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 9,
    lineHeight: 13,
  },
  cardBoosted: {
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  boostBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#F59E0B',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  boostText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 9,
    color: '#FFF',
    lineHeight: 13,
  },
  heartWrap: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Info
  info: {
    padding: 8,
    gap: 2,
  },
  title: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: t.text,
    lineHeight: 18,
  },
  price: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    color: t.primary,
    lineHeight: 20,
  },
  meta: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: t.textSecondary,
    lineHeight: 15,
  },
  stock: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 10,
    color: t.textSecondary,
    lineHeight: 14,
  },
});
