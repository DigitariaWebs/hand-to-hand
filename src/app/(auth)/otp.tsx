import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
} from 'react-native-reanimated';
import { OTPInput, OTPInputHandle } from '@/components/ui/OTPInput';
import { Button } from '@/components/ui/Button';
import { Toast } from '@/components/ui/Toast';
import { Colors } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { useAuthStore } from '@/stores/useAuthStore';

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

export default function OTPScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const { verifyOTP, sendOTP, isLoading } = useAuthStore();

  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [showToast, setShowToast] = useState(false);
  const otpRef = useRef<OTPInputHandle>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleVerify = async (enteredCode: string) => {
    try {
      const result = await verifyOTP(enteredCode);
      if (result === 'new') {
        router.push('/(auth)/complete-profile');
      } else {
        router.replace('/(tabs)');
      }
    } catch {
      otpRef.current?.shake();
      setCode('');
    }
  };

  const handleResend = async () => {
    setCountdown(60);
    if (phone) {
      await sendOTP(phone);
    }
    setShowToast(true);
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView style={styles.container}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backButton, { paddingTop: insets.top + 8 }]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather name="arrow-left" size={22} color={Colors.light.text} />
        </TouchableOpacity>

        <View style={styles.content}>
          <StaggerItem index={0}>
            <Text style={styles.title}>Code de vérification</Text>
          </StaggerItem>

          <StaggerItem index={1}>
            <Text style={styles.subtitle}>
              Code envoyé au {phone ?? ''}
            </Text>
          </StaggerItem>

          <StaggerItem index={2}>
            <OTPInput
              ref={otpRef}
              length={6}
              onComplete={(c) => {
                setCode(c);
              }}
              style={styles.otpInput}
            />
          </StaggerItem>

          <StaggerItem index={3}>
            <Button
              label="Vérifier"
              onPress={() => handleVerify(code)}
              variant="primary"
              disabled={code.length < 6}
              loading={isLoading}
              style={styles.verifyButton}
            />
          </StaggerItem>

          <StaggerItem index={4}>
            <View style={styles.resendContainer}>
              {countdown > 0 ? (
                <Text style={styles.countdownText}>
                  Renvoyer le code dans 0:{countdown.toString().padStart(2, '0')}
                </Text>
              ) : (
                <TouchableOpacity onPress={handleResend} activeOpacity={0.7}>
                  <Text style={styles.resendText}>Renvoyer le code</Text>
                </TouchableOpacity>
              )}
            </View>
          </StaggerItem>
        </View>

        <Toast
          visible={showToast}
          message="Code renvoyé ✓"
          type="success"
          duration={3000}
          onHide={() => setShowToast(false)}
        />
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: Colors.light.surface,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.light.surface,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.md,
  },
  content: {
    paddingHorizontal: Spacing.xxl,
    flex: 1,
  },
  title: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 26,
    color: Colors.light.text,
    marginTop: 24,
    lineHeight: 34,
  },
  subtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 8,
    lineHeight: 20,
  },
  otpInput: {
    marginTop: 40,
  },
  verifyButton: {
    marginTop: 24,
  },
  resendContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  countdownText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: Colors.light.textSecondary,
    lineHeight: 18,
  },
  resendText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: Colors.light.primary,
    lineHeight: 18,
    textDecorationLine: 'underline',
  },
});
