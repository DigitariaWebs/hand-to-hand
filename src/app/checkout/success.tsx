import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
  FadeIn,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { formatPrice } from '@/utils';
import { useCartStore } from '@/stores/useCartStore';
import { mockProducts } from '@/services/mock/products';

export default function CheckoutSuccessScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const recentOrderNumber = useCartStore((s) => s.recentOrderNumber);
  const recentOrderId = useCartStore((s) => s.recentOrderId);

  // Use first mock product as summary reference (real app would pull from order)
  const product = mockProducts[0];
  const orderNum = recentOrderNumber ?? 'HTH-2024-0042';

  // Spring checkmark animation
  const checkScale = useSharedValue(0);
  const checkOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);

  useEffect(() => {
    (async () => {
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
    })();
    checkOpacity.value = withTiming(1, { duration: 200 });
    checkScale.value = withSpring(1, {
      damping: 12,
      stiffness: 180,
      mass: 0.8,
    });
    contentOpacity.value = withDelay(400, withTiming(1, { duration: 500 }));
  }, []);

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
    opacity: checkOpacity.value,
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.background, paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
      ]}
    >
      {/* Checkmark */}
      <Animated.View style={[styles.checkCircleWrapper, checkStyle]}>
        <LinearGradient
          colors={['#10B981', '#059669']}
          style={styles.checkCircle}
        >
          <Feather name="check" size={52} color="#FFF" />
        </LinearGradient>
      </Animated.View>

      {/* Content */}
      <Animated.View style={[styles.content, contentStyle]}>
        <Text style={[styles.title, { color: theme.text }]}>Paiement confirmé !</Text>
        <Text style={[styles.orderRef, { color: theme.textSecondary }]}>
          Votre commande{' '}
          <Text style={[styles.orderRefBold, { color: theme.primary }]}>#{orderNum}</Text>
          {'\n'}est en cours de traitement
        </Text>

        {/* Mini order summary */}
        <View
          style={[
            styles.miniCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Image
            source={{ uri: product.images[0]?.url ?? product.images[0]?.thumbnail }}
            style={styles.miniThumb}
          />
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={[styles.miniTitle, { color: theme.text }]} numberOfLines={2}>
              {product.title}
            </Text>
            <Text style={[styles.miniSeller, { color: theme.textSecondary }]}>
              Vendeur : {product.seller.username}
            </Text>
            <Text style={[styles.miniPrice, { color: theme.primary }]}>
              {formatPrice(product.price)}
            </Text>
          </View>
        </View>

        {/* Secure payment note */}
        <View
          style={[
            styles.secureNote,
            { backgroundColor: `${theme.success}10`, borderColor: `${theme.success}25` },
          ]}
        >
          <Feather name="lock" size={14} color={theme.success} />
          <Text style={[styles.secureText, { color: theme.success }]}>
            Paiement bloqué jusqu'à confirmation de réception
          </Text>
        </View>
      </Animated.View>

      {/* Actions */}
      <Animated.View style={[styles.actions, contentStyle]}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => router.replace(`/order/${recentOrderId ?? 'ord-001'}`)}
        >
          <LinearGradient
            colors={[theme.primary, theme.primaryGradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.trackBtn}
          >
            <Feather name="truck" size={18} color="#FFF" />
            <Text style={styles.trackBtnText}>Suivre ma commande</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.homeLink}
          onPress={() => router.replace('/')}
        >
          <Text style={[styles.homeLinkText, { color: theme.textSecondary }]}>
            Retour à l'accueil
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.xl,
  },

  // Checkmark
  checkCircleWrapper: {
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  checkCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Content
  content: {
    width: '100%',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  title: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 24,
    lineHeight: 32,
    textAlign: 'center',
  },
  orderRef: {
    ...Typography.body,
    textAlign: 'center',
    lineHeight: 22,
  },
  orderRefBold: {
    fontFamily: 'Poppins_700Bold',
  },

  // Mini card
  miniCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  miniThumb: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.sm,
    backgroundColor: '#E5E7EB',
  },
  miniTitle: { ...Typography.bodyMedium, fontFamily: 'Poppins_600SemiBold' },
  miniSeller: { ...Typography.caption },
  miniPrice: { ...Typography.bodyMedium, fontFamily: 'Poppins_700Bold' },

  // Secure note
  secureNote: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  secureText: { ...Typography.caption, flex: 1 },

  // Actions
  actions: {
    width: '100%',
    gap: Spacing.md,
    alignItems: 'center',
  },
  trackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: 15,
    paddingHorizontal: Spacing.xxxl,
    borderRadius: BorderRadius.md,
    minWidth: 240,
  },
  trackBtnText: { ...Typography.button, color: '#FFF', fontSize: 16 },
  homeLink: {
    paddingVertical: Spacing.sm,
  },
  homeLinkText: { ...Typography.body, textDecorationLine: 'underline' },
});
