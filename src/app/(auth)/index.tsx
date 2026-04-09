import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Colors } from '@/constants/Colors';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { storage, StorageKeys } from '@/utils/storage';
import { useAuthStore } from '@/stores/useAuthStore';

const { height: H } = Dimensions.get('window');
const LOGO = require('../../../assets/images/logo.png');

type SocialProvider = 'apple' | 'google' | 'facebook';

type SocialButtonConfig = {
  provider: SocialProvider;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  bg: string;
  textColor: string;
  iconColor: string;
  bordered?: boolean;
};

const SOCIAL_BUTTONS: SocialButtonConfig[] = [
  {
    provider: 'apple',
    icon: 'logo-apple',
    label: 'Continuer avec Apple',
    bg: '#000000',
    textColor: '#FFFFFF',
    iconColor: '#FFFFFF',
  },
  {
    provider: 'google',
    icon: 'logo-google',
    label: 'Continuer avec Google',
    bg: '#FFFFFF',
    textColor: '#3C4043',
    iconColor: '#4285F4',
    bordered: true,
  },
  {
    provider: 'facebook',
    icon: 'logo-facebook',
    label: 'Continuer avec Facebook',
    bg: '#1877F2',
    textColor: '#FFFFFF',
    iconColor: '#FFFFFF',
  },
];

function StaggerItem({
  children,
  index,
}: {
  children: React.ReactNode;
  index: number;
}) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    opacity.value = withDelay(index * 50, withTiming(1, { duration: 300 }));
    translateY.value = withDelay(index * 50, withSpring(0, { damping: 20, stiffness: 200 }));
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={style}>{children}</Animated.View>;
}

export default function AuthModal() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { loginWithSocial } = useAuthStore();

  const [loadingProvider, setLoadingProvider] = React.useState<SocialProvider | null>(null);

  const translateY = useSharedValue(H);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = H;
    backdropOpacity.value = 0;
    translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
    backdropOpacity.value = withTiming(0.5, { duration: 300 });
  }, []);

  const dismiss = useCallback(() => {
    'worklet';
    translateY.value = withSpring(H * 1.2, { damping: 20, stiffness: 200 }, () => {
      runOnJS(router.back)();
    });
    backdropOpacity.value = withTiming(0, { duration: 200 });
  }, []);

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationY > 0) {
        translateY.value = e.translationY;
      }
    })
    .onEnd((e) => {
      if (e.translationY > 60 || e.velocityY > 400) {
        dismiss();
      } else {
        translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const handleSocial = async (provider: SocialProvider) => {
    try {
      setLoadingProvider(provider);
      const result = await loginWithSocial(provider);
      await storage.set(StorageKeys.HAS_ONBOARDED, 'true');
      if (result === 'new') {
        router.push('/(auth)/complete-profile');
      } else {
        router.replace('/(tabs)');
      }
    } catch {
      setLoadingProvider(null);
    }
  };

  const handlePhone = () => {
    router.push('/(auth)/phone');
  };

  return (
    <View style={styles.container}>
      <TouchableWithoutFeedback onPress={() => dismiss()}>
        <Animated.View style={[styles.backdrop, backdropStyle]} />
      </TouchableWithoutFeedback>

      <Animated.View style={[styles.sheet, { paddingBottom: insets.bottom + 24 }, sheetStyle]}>
        <GestureDetector gesture={panGesture}>
          <View style={styles.handleArea}>
            <View style={styles.handle} />
          </View>
        </GestureDetector>

        <TouchableOpacity
          onPress={() => dismiss()}
          style={styles.closeButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather name="x" size={18} color="#28262C" />
        </TouchableOpacity>

        <View style={styles.content}>
          <StaggerItem index={0}>
            <View style={styles.logoWrapper}>
              <Image source={LOGO} style={styles.logo} contentFit="contain" />
            </View>
          </StaggerItem>

          <StaggerItem index={1}>
            <Text style={styles.title}>Inscrivez-vous ou connectez-vous</Text>
          </StaggerItem>

          <StaggerItem index={2}>
            <Text style={styles.subtitle}>pour commencer à explorer</Text>
          </StaggerItem>

          <View style={styles.spacer} />

          {/* ── Social buttons (login) ── */}
          <View style={styles.socialContainer}>
            {SOCIAL_BUTTONS.map((btn, i) => (
              <StaggerItem key={btn.provider} index={3 + i}>
                <TouchableOpacity
                  style={[
                    styles.socialButton,
                    { backgroundColor: btn.bg },
                    btn.bordered && styles.socialButtonBordered,
                  ]}
                  onPress={() => handleSocial(btn.provider)}
                  activeOpacity={0.85}
                  disabled={loadingProvider !== null}
                >
                  {loadingProvider === btn.provider ? (
                    <ActivityIndicator color={btn.textColor} size="small" />
                  ) : (
                    <>
                      <View style={styles.socialIconWrap}>
                        <Ionicons name={btn.icon} size={22} color={btn.iconColor} />
                      </View>
                      <Text style={[styles.socialText, { color: btn.textColor }]}>
                        {btn.label}
                      </Text>
                      {/* spacer mirrors icon so text is visually centred */}
                      <View style={styles.socialIconWrap} />
                    </>
                  )}
                </TouchableOpacity>
              </StaggerItem>
            ))}
          </View>

          <StaggerItem index={6}>
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OU</Text>
              <View style={styles.dividerLine} />
            </View>
          </StaggerItem>

          {/* ── Phone button (signup) ── */}
          <StaggerItem index={7}>
            <TouchableOpacity
              style={[styles.phoneButton, loadingProvider !== null && { opacity: 0.5 }]}
              onPress={handlePhone}
              activeOpacity={0.85}
              disabled={loadingProvider !== null}
            >
              <Ionicons name="call-outline" size={20} color="#FFFFFF" />
              <Text style={styles.phoneText} numberOfLines={1} adjustsFontSizeToFit>
                S'inscrire par téléphone
              </Text>
            </TouchableOpacity>
          </StaggerItem>

          <StaggerItem index={8}>
            <Text style={styles.legalText}>
              En continuant, vous acceptez nos Conditions d'utilisation et notre Politique de confidentialité.
            </Text>
          </StaggerItem>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,1)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: Colors.light.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  handleArea: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.md,
  },
  logoWrapper: {
    alignItems: 'center',
    marginTop: 4,
  },
  logo: {
    width: 52,
    height: 52,
  },
  title: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 20,
    color: Colors.light.text,
    textAlign: 'center',
    marginTop: 14,
    lineHeight: 28,
  },
  subtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 20,
  },
  spacer: {
    height: 20,
  },

  // ── Social ──
  socialContainer: {
    gap: 10,
  },
  socialButton: {
    height: 54,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  socialButtonBordered: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  socialIconWrap: {
    width: 28,
    alignItems: 'center',
  },
  socialText: {
    flex: 1,
    fontFamily: 'Poppins_500Medium',
    fontSize: 15,
    lineHeight: 20,
    textAlign: 'center',
  },

  // ── Divider ──
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: Colors.light.textSecondary,
    lineHeight: 16,
  },

  // ── Phone ──
  phoneButton: {
    height: 54,
    borderRadius: 999,
    backgroundColor: '#14248A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 10,
  },
  phoneText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    color: '#FFFFFF',
    lineHeight: 20,
    flexShrink: 1,
  },

  // ── Legal ──
  legalText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginTop: 14,
    lineHeight: 16,
  },
});
