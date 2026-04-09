import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  clamp,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BorderRadius, Spacing } from '@/constants/Spacing';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

type ToastProps = {
  visible: boolean;
  message: string;
  type?: ToastType;
  duration?: number;
  onHide?: () => void;
};

const TYPE_COLORS: Record<ToastType, string> = {
  success: '#10B981',
  error:   '#EF4444',
  info:    '#14248A',
  warning: '#F59E0B',
};

const TYPE_ICONS: Record<ToastType, keyof typeof Feather.glyphMap> = {
  success: 'check-circle',
  error:   'x-circle',
  info:    'info',
  warning: 'alert-triangle',
};

export function Toast({
  visible,
  message,
  type = 'info',
  duration = 3000,
  onHide,
}: ToastProps) {
  const insets = useSafeAreaInsets();

  const translateY = useSharedValue(-80);
  const opacity    = useSharedValue(0);
  const dragY      = useSharedValue(0);

  const callOnHide = () => { onHide?.(); };

  const hide = () => {
    'worklet';
    translateY.value = withSpring(-100, { damping: 20, stiffness: 200 });
    opacity.value    = withTiming(0, { duration: 200 }, () => {
      runOnJS(callOnHide)();
    });
  };

  useEffect(() => {
    if (visible) {
      dragY.value    = 0;
      translateY.value = withSpring(0, { damping: 18, stiffness: 180 });
      opacity.value    = withTiming(1, { duration: 200 });

      const timer = setTimeout(() => { hide(); }, duration);
      return () => clearTimeout(timer);
    }
  }, [visible, duration]);

  // Swipe-up gesture to dismiss
  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      // Only allow upward swipes
      dragY.value = clamp(e.translationY, -100, 10);
      translateY.value = dragY.value;
    })
    .onEnd((e) => {
      if (e.translationY < -28) {
        hide();
      } else {
        translateY.value = withSpring(0, { damping: 18, stiffness: 180 });
        dragY.value = 0;
      }
    });

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const bgColor = TYPE_COLORS[type];

  return (
    // Outer view: fills width but passes touches through the empty area
    <View
      style={[styles.outerWrapper, { top: insets.top + 10 }]}
      pointerEvents="box-none"
    >
      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[
            styles.container,
            { backgroundColor: bgColor },
            animStyle,
            Platform.OS === 'ios' && styles.shadow,
          ]}
        >
          <Feather name={TYPE_ICONS[type]} size={16} color="#FFFFFF" />
          <Text style={styles.message}>{message}</Text>
          {/* Swipe indicator */}
          <View style={styles.dismissBar} />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  outerWrapper: {
    position: 'absolute',
    left: Spacing.lg,
    right: Spacing.lg,
    zIndex: 999,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 13,
    borderRadius: BorderRadius.md,
    position: 'relative',
    overflow: 'hidden',
  },
  message: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: '#FFFFFF',
    flex: 1,
    lineHeight: 18,
  },
  dismissBar: {
    position: 'absolute',
    bottom: 5,
    left: '40%',
    right: '40%',
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
});
