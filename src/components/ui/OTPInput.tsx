import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

type OTPInputProps = {
  length?: number;
  onComplete: (code: string) => void;
  style?: StyleProp<ViewStyle>;
};

export type OTPInputHandle = {
  shake: () => void;
};

function OTPBox({
  digit,
  isActive,
  isFilled,
  flashRed,
  onPress,
}: {
  digit: string;
  isActive: boolean;
  isFilled: boolean;
  flashRed: boolean;
  onPress: () => void;
}) {
  let borderColor = 'transparent';
  let borderWidth = 0;
  let backgroundColor = '#F3F4F6';

  if (flashRed && (isFilled || isActive)) {
    borderColor = '#EF4444';
    borderWidth = 2;
    backgroundColor = '#FFFFFF';
  } else if (isActive) {
    borderColor = '#14248A';
    borderWidth = 2;
    backgroundColor = '#FFFFFF';
  } else if (isFilled) {
    borderColor = '#E5E7EB';
    borderWidth = 1;
    backgroundColor = '#FFFFFF';
  }

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={1}>
      <View
        style={[
          styles.box,
          {
            borderColor,
            borderWidth,
            backgroundColor,
            transform: isActive ? [{ scale: 1.05 }] : [{ scale: 1 }],
          },
        ]}
      >
        <Text style={styles.digit}>{digit}</Text>
      </View>
    </TouchableOpacity>
  );
}

export const OTPInput = forwardRef<OTPInputHandle, OTPInputProps>(
  ({ length = 6, onComplete, style }, ref) => {
    const [value, setValue] = useState('');
    const [flashRed, setFlashRed] = useState(false);
    const inputRef = useRef<TextInput>(null);

    const translateX = useSharedValue(0);

    const containerAnimStyle = useAnimatedStyle(() => ({
      transform: [{ translateX: translateX.value }],
    }));

    useImperativeHandle(ref, () => ({
      shake: () => {
        translateX.value = withSequence(
          withTiming(-10, { duration: 60 }),
          withTiming(10, { duration: 60 }),
          withTiming(-10, { duration: 60 }),
          withTiming(10, { duration: 60 }),
          withTiming(-10, { duration: 60 }),
          withTiming(10, { duration: 60 }),
          withTiming(0, { duration: 60 }),
        );
        setFlashRed(true);
        setTimeout(() => setFlashRed(false), 600);
      },
    }));

    const handleChange = (text: string) => {
      const digits = text.replace(/\D/g, '').slice(0, length);
      setValue(digits);
      if (digits.length === length) {
        onComplete(digits);
      }
    };

    const focus = () => {
      inputRef.current?.focus();
    };

    return (
      <Animated.View style={[styles.wrapper, containerAnimStyle, style]}>
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={handleChange}
          keyboardType="number-pad"
          maxLength={length}
          autoFocus
          style={styles.hiddenInput}
          caretHidden
        />
        <View style={styles.boxesRow}>
          {Array.from({ length }).map((_, i) => (
            <OTPBox
              key={i}
              digit={value[i] ?? ''}
              isFilled={i < value.length}
              isActive={i === value.length}
              flashRed={flashRed}
              onPress={focus}
            />
          ))}
        </View>
      </Animated.View>
    );
  },
);

OTPInput.displayName = 'OTPInput';

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    zIndex: -1,
    width: 1,
    height: 1,
  },
  boxesRow: {
    flexDirection: 'row',
    gap: 10,
  },
  box: {
    width: 48,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  digit: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 22,
    color: '#28262C',
    lineHeight: 28,
  },
});
