import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  TextInput,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
} from 'react-native-reanimated';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { CountryPicker, Country } from '@/components/ui/CountryPicker';
import { Colors } from '@/constants/Colors';
import { Spacing, BorderRadius } from '@/constants/Spacing';
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

export default function PhoneScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { sendOTP } = useAuthStore();

  const [selectedCountry, setSelectedCountry] = useState<Country>({
    code: 'FR',
    dialCode: '+33',
    flag: '🇫🇷',
    name: 'France',
  });
  const [number, setNumber] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const numberInputRef = useRef<TextInput>(null);

  const handleContinue = async () => {
    try {
      setIsLoading(true);
      const fullPhone = selectedCountry.dialCode + ' ' + number;
      await sendOTP(fullPhone);
      router.push({
        pathname: '/(auth)/otp',
        params: { phone: fullPhone },
      });
    } catch {
      setIsLoading(false);
    }
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
            <Text style={styles.title}>Entrez votre numéro</Text>
          </StaggerItem>

          <StaggerItem index={1}>
            <Text style={styles.subtitle}>
              Nous vous enverrons un code de vérification par SMS
            </Text>
          </StaggerItem>

          <StaggerItem index={2}>
            <View style={styles.phoneRow}>
              <TouchableOpacity
                style={styles.countryPill}
                onPress={() => setShowPicker(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.flagText}>{selectedCountry.flag}</Text>
                <Text style={styles.dialCodeText}>{selectedCountry.dialCode}</Text>
              </TouchableOpacity>

              <Input
                ref={numberInputRef}
                value={number}
                onChangeText={setNumber}
                keyboardType="phone-pad"
                autoFocus
                placeholder="6 00 00 00 00"
                maxLength={10}
                style={styles.numberInput}
              />
            </View>
          </StaggerItem>

          <StaggerItem index={3}>
            <Button
              label="Continuer"
              onPress={handleContinue}
              variant="primary"
              disabled={number.length < 9}
              loading={isLoading}
              style={styles.continueButton}
            />
          </StaggerItem>
        </View>

        <CountryPicker
          visible={showPicker}
          onClose={() => setShowPicker(false)}
          onSelect={(country) => {
            setSelectedCountry(country);
            setShowPicker(false);
          }}
          selectedCode={selectedCountry.code}
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
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 32,
  },
  countryPill: {
    width: 88,
    height: 52,
    backgroundColor: '#F3F4F6',
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  flagText: {
    fontSize: 20,
  },
  dialCodeText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: '#28262C',
    lineHeight: 18,
  },
  numberInput: {
    flex: 1,
  },
  continueButton: {
    marginTop: 24,
  },
});
