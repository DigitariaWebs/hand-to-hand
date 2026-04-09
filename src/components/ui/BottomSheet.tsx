import React, { useEffect, useCallback } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Colors } from '@/constants/Colors';
import { BorderRadius } from '@/constants/Spacing';

const { height: H } = Dimensions.get('window');

type BottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  snapHeight?: number;
};

export function BottomSheet({
  visible,
  onClose,
  children,
  snapHeight = 0.65,
}: BottomSheetProps) {
  const sheetHeight = H * snapHeight;
  const translateY = useSharedValue(H);
  const backdropOpacity = useSharedValue(0);

  const dismiss = useCallback(() => {
    'worklet';
    translateY.value = withSpring(H * 1.2, { damping: 20, stiffness: 200 }, () => {
      runOnJS(onClose)();
    });
    backdropOpacity.value = withTiming(0, { duration: 200 });
  }, [onClose, translateY, backdropOpacity]);

  useEffect(() => {
    if (visible) {
      translateY.value = H;
      backdropOpacity.value = 0;
      translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
      backdropOpacity.value = withTiming(0.4, { duration: 200 });
    }
  }, [visible]);

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationY > 0) {
        translateY.value = e.translationY;
      }
    })
    .onEnd((e) => {
      if (e.translationY > 80 || e.velocityY > 500) {
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

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
      onRequestClose={() => dismiss()}
    >
      <View style={styles.container}>
        <TouchableWithoutFeedback onPress={() => dismiss()}>
          <Animated.View style={[styles.backdrop, backdropStyle]} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.sheet,
            { height: sheetHeight },
            sheetStyle,
          ]}
        >
          <GestureDetector gesture={panGesture}>
            <View style={styles.handleArea}>
              <View style={styles.handle} />
            </View>
          </GestureDetector>

          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: Colors.light.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  handleArea: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
  },
});
