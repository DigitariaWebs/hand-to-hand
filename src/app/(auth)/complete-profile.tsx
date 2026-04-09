import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  Alert,
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
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Colors } from '@/constants/Colors';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { useAuthStore } from '@/stores/useAuthStore';

const CITIES = [
  'Nice',
  'Cannes',
  'Marseille',
  'Antibes',
  'Toulon',
  'Fréjus',
  'Monaco',
  'Menton',
  'Grasse',
  'Hyères',
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

export default function CompleteProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { completeProfile, isLoading } = useAuthStore();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [showCitySheet, setShowCitySheet] = useState(false);

  const isValid = firstName.trim().length >= 2 && lastName.trim().length >= 2;

  const handleAvatarPress = () => {
    Alert.alert('Photo de profil', '', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Galerie', onPress: () => {} },
      { text: 'Caméra', onPress: () => {} },
    ]);
  };

  const handleCommencer = async () => {
    await completeProfile({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      city: selectedCity || undefined,
    });
    router.replace('/(tabs)');
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 32 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <StaggerItem index={0}>
              <Text style={styles.title}>Complétez votre profil</Text>
            </StaggerItem>

            <StaggerItem index={1}>
              <Text style={styles.subtitle}>Quelques infos pour commencer</Text>
            </StaggerItem>

            <StaggerItem index={2}>
              <View style={styles.avatarContainer}>
                <TouchableOpacity
                  style={styles.avatarCircle}
                  onPress={handleAvatarPress}
                  activeOpacity={0.7}
                >
                  <Feather name="camera" size={28} color={Colors.light.textSecondary} />
                  <Text style={styles.avatarLabel}>Photo</Text>
                </TouchableOpacity>
              </View>
            </StaggerItem>

            <StaggerItem index={3}>
              <Input
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Prénom"
                autoFocus
                style={styles.inputMargin}
              />
            </StaggerItem>

            <StaggerItem index={4}>
              <Input
                value={lastName}
                onChangeText={setLastName}
                placeholder="Nom"
                style={styles.inputSmallMargin}
              />
            </StaggerItem>

            <StaggerItem index={5}>
              <TouchableOpacity
                style={styles.citySelector}
                onPress={() => setShowCitySheet(true)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.citySelectorText,
                    selectedCity
                      ? { color: Colors.light.text }
                      : { color: Colors.light.textSecondary },
                  ]}
                >
                  {selectedCity || 'Votre ville'}
                </Text>
                <Feather
                  name="chevron-down"
                  size={18}
                  color={Colors.light.textSecondary}
                />
              </TouchableOpacity>
            </StaggerItem>

            <StaggerItem index={6}>
              <Button
                label="Commencer"
                onPress={handleCommencer}
                variant="primary"
                disabled={!isValid}
                loading={isLoading}
                style={styles.commencerButton}
              />
            </StaggerItem>

            <StaggerItem index={7}>
              <Button
                label="Plus tard"
                onPress={() => router.replace('/(tabs)')}
                variant="ghost"
                style={styles.laterButton}
              />
            </StaggerItem>
          </View>
        </ScrollView>

        <BottomSheet
          visible={showCitySheet}
          onClose={() => setShowCitySheet(false)}
          snapHeight={0.5}
        >
          <ScrollView
            style={styles.cityList}
            showsVerticalScrollIndicator={false}
          >
            {CITIES.map((city) => (
              <TouchableOpacity
                key={city}
                style={styles.cityRow}
                onPress={() => {
                  setSelectedCity(city);
                  setShowCitySheet(false);
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.cityName,
                    selectedCity === city && { color: Colors.light.primary },
                  ]}
                >
                  {city}
                </Text>
                {selectedCity === city && (
                  <Feather
                    name="check"
                    size={16}
                    color={Colors.light.primary}
                  />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </BottomSheet>
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
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    paddingHorizontal: Spacing.xxl,
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
  avatarContainer: {
    alignItems: 'center',
    marginTop: 32,
  },
  avatarCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#D4C2FC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: Colors.light.textSecondary,
    marginTop: 4,
    lineHeight: 16,
  },
  inputMargin: {
    marginTop: 24,
  },
  inputSmallMargin: {
    marginTop: 12,
  },
  citySelector: {
    height: 52,
    backgroundColor: '#F3F4F6',
    borderRadius: BorderRadius.md,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  citySelectorText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 15,
    lineHeight: 20,
  },
  commencerButton: {
    marginTop: 32,
  },
  laterButton: {
    marginTop: 8,
  },
  cityList: {
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.md,
  },
  cityRow: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cityName: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 15,
    color: Colors.light.text,
    lineHeight: 20,
  },
});
