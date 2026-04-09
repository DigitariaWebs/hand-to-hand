import React, { useEffect } from 'react';
import { View, StyleSheet, useColorScheme, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Spacing, BorderRadius } from '@/constants/Spacing';

const { width: SW } = Dimensions.get('window');
const SHIMMER_DURATION = 1400;
const SHIMMER_W = SW * 0.45;

// ── Base element ───────────────────────────────────────────────────────────

type SkeletonElProps = {
  width?: number | `${number}%`;
  height: number;
  borderRadius?: number;
  flex?: number;
  style?: object;
};

export function SkeletonEl({
  width,
  height,
  borderRadius = 6,
  flex,
  style,
}: SkeletonElProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const baseColor = isDark ? '#3D3654' : '#E5E7EB';
  const shimmerColors = isDark
    ? (['rgba(255,255,255,0)', 'rgba(255,255,255,0.07)', 'rgba(255,255,255,0)'] as const)
    : (['rgba(255,255,255,0)', 'rgba(255,255,255,0.65)', 'rgba(255,255,255,0)'] as const);

  const translateX = useSharedValue(-SHIMMER_W);

  useEffect(() => {
    translateX.value = withRepeat(
      withTiming(SW + SHIMMER_W, {
        duration: SHIMMER_DURATION,
        easing: Easing.linear,
      }),
      -1,
      false,
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const containerStyle = [
    {
      height,
      borderRadius,
      overflow: 'hidden' as const,
      backgroundColor: baseColor,
    },
    width !== undefined && { width },
    flex !== undefined && { flex },
    style,
  ].filter(Boolean);

  return (
    <View style={containerStyle as any}>
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 0,
            bottom: 0,
            width: SHIMMER_W,
          },
          animStyle,
        ]}
      >
        <LinearGradient
          colors={shimmerColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1 }}
        />
      </Animated.View>
    </View>
  );
}

// ── Product card skeleton ──────────────────────────────────────────────────

export function ProductCardSkeleton() {
  return (
    <View style={skeletonStyles.productCard}>
      {/* Image square */}
      <SkeletonEl height={0} style={{ aspectRatio: 1 }} borderRadius={0} />
      {/* Info */}
      <View style={skeletonStyles.productInfo}>
        <SkeletonEl height={13} flex={1} />
        <SkeletonEl height={16} width="55%" borderRadius={4} />
        <SkeletonEl height={11} width="40%" borderRadius={4} />
      </View>
    </View>
  );
}

// ── Conversation row skeleton ──────────────────────────────────────────────

export function ConversationRowSkeleton() {
  return (
    <View style={skeletonStyles.convRow}>
      {/* Avatar */}
      <SkeletonEl width={48} height={48} borderRadius={24} />
      {/* Content */}
      <View style={skeletonStyles.convContent}>
        <View style={skeletonStyles.convTop}>
          <SkeletonEl height={13} width="45%" />
          <SkeletonEl height={11} width={40} />
        </View>
        <SkeletonEl height={12} flex={1} style={{ marginTop: 5 }} />
      </View>
    </View>
  );
}

// ── Notification card skeleton ─────────────────────────────────────────────

export function NotificationCardSkeleton() {
  return (
    <View style={skeletonStyles.notifRow}>
      {/* Icon circle */}
      <SkeletonEl width={40} height={40} borderRadius={20} />
      {/* Content */}
      <View style={skeletonStyles.notifContent}>
        <View style={skeletonStyles.notifTop}>
          <SkeletonEl height={13} flex={1} />
          <SkeletonEl height={11} width={36} />
        </View>
        <SkeletonEl height={12} width="80%" style={{ marginTop: 5 }} />
      </View>
    </View>
  );
}

// ── Profile header skeleton ────────────────────────────────────────────────

export function ProfileHeaderSkeleton() {
  return (
    <View style={skeletonStyles.profileHeader}>
      {/* Cover */}
      <SkeletonEl height={100} borderRadius={0} />
      {/* Avatar overlap */}
      <View style={skeletonStyles.profileAvatarWrap}>
        <SkeletonEl width={80} height={80} borderRadius={40} />
      </View>
      {/* Text */}
      <View style={skeletonStyles.profileText}>
        <SkeletonEl height={18} width={140} />
        <SkeletonEl height={13} width={100} style={{ marginTop: 6 }} />
        {/* Badge row */}
        <View style={skeletonStyles.badgeRow}>
          {[80, 70, 80, 60].map((w, i) => (
            <SkeletonEl key={i} height={24} width={w} borderRadius={12} />
          ))}
        </View>
      </View>
    </View>
  );
}

// ── List of product card skeletons ─────────────────────────────────────────

export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  const pairs: number[][] = [];
  for (let i = 0; i < count; i += 2) pairs.push([i, i + 1]);
  return (
    <View style={skeletonStyles.grid}>
      {pairs.map((pair, pi) => (
        <View key={pi} style={skeletonStyles.gridRow}>
          <View style={{ flex: 1 }}>
            <ProductCardSkeleton />
          </View>
          {pair[1] < count && (
            <View style={{ flex: 1 }}>
              <ProductCardSkeleton />
            </View>
          )}
          {pair[1] >= count && <View style={{ flex: 1 }} />}
        </View>
      ))}
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────

const skeletonStyles = StyleSheet.create({
  productCard: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    margin: 2,
  },
  productInfo: {
    padding: 8,
    gap: 5,
  },

  convRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  convContent: { flex: 1, gap: 0 },
  convTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },

  notifRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md + 2,
  },
  notifContent: { flex: 1 },
  notifTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
  },

  profileHeader: { overflow: 'hidden' },
  profileAvatarWrap: {
    marginTop: -40,
    marginLeft: Spacing.lg,
  },
  profileText: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    gap: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: 8,
  },

  grid: { gap: Spacing.sm, paddingHorizontal: Spacing.lg },
  gridRow: { flexDirection: 'row', gap: Spacing.sm },
});
