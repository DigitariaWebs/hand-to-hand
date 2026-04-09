import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, useColorScheme } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { useLogisticsStore } from '@/stores/useLogisticsStore';

export function StatusToggle() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;

  const { transporterStatus, setTransporterStatus } = useLogisticsStore();
  const isActive = transporterStatus === 'active';

  const animProgress = useSharedValue(isActive ? 1 : 0);

  const containerStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      animProgress.value,
      [0, 1],
      [isDark ? '#3D365420' : '#E5E7EB40', isDark ? '#10B98120' : '#10B98115'],
    ),
  }));

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: withTiming(animProgress.value * 24, { duration: 250 }) }],
    backgroundColor: interpolateColor(
      animProgress.value,
      [0, 1],
      ['#9CA3AF', '#10B981'],
    ),
  }));

  const handleToggle = () => {
    if (isActive) {
      Alert.alert(
        'Passer hors ligne ?',
        'Vous ne recevrez plus de propositions de mission.',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Confirmer',
            onPress: () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
              setTransporterStatus('offline');
              animProgress.value = withTiming(0, { duration: 300 });
            },
          },
        ],
      );
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      setTransporterStatus('active');
      animProgress.value = withTiming(1, { duration: 300 });
    }
  };

  return (
    <TouchableOpacity onPress={handleToggle} activeOpacity={0.8}>
      <Animated.View style={[styles.container, containerStyle]}>
        {/* Track */}
        <View style={styles.track}>
          <Animated.View style={[styles.dot, dotStyle]} />
        </View>

        {/* Label */}
        <Text
          style={[
            styles.label,
            { color: isActive ? theme.success : theme.textSecondary },
          ]}
        >
          {isActive ? 'Actif' : 'Hors ligne'}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  track: {
    width: 36,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(156,163,175,0.3)',
    justifyContent: 'center',
    paddingHorizontal: 1,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  label: {
    ...Typography.captionMedium,
    fontFamily: 'Poppins_600SemiBold',
  },
});
