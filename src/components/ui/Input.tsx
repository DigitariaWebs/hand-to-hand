import React, { forwardRef, useState } from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  TextInputProps,
  StyleProp,
  ViewStyle,
  KeyboardTypeOptions,
  ReturnKeyTypeOptions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { BorderRadius } from '@/constants/Spacing';

type InputProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  keyboardType?: KeyboardTypeOptions;
  autoFocus?: boolean;
  maxLength?: number;
  secureTextEntry?: boolean;
  style?: StyleProp<ViewStyle>;
  returnKeyType?: ReturnKeyTypeOptions;
  onSubmitEditing?: () => void;
};

export const Input = forwardRef<TextInput, InputProps>(
  (
    {
      value,
      onChangeText,
      placeholder,
      label,
      keyboardType,
      autoFocus,
      maxLength,
      secureTextEntry,
      style,
      returnKeyType,
      onSubmitEditing,
    },
    ref,
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const borderColor = useSharedValue('transparent');
    const borderWidth = useSharedValue(0);

    const handleFocus = () => {
      setIsFocused(true);
      borderColor.value = withTiming('#14248A', { duration: 200 });
      borderWidth.value = withTiming(2, { duration: 200 });
    };

    const handleBlur = () => {
      setIsFocused(false);
      borderColor.value = withTiming('transparent', { duration: 200 });
      borderWidth.value = withTiming(0, { duration: 200 });
    };

    const animatedBorder = useAnimatedStyle(() => ({
      borderColor: borderColor.value,
      borderWidth: borderWidth.value,
    }));

    return (
      <View style={[styles.container, style]}>
        {label ? <Text style={styles.label}>{label}</Text> : null}
        <Animated.View style={[styles.inputWrapper, animatedBorder]}>
          <TextInput
            ref={ref}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor="#9CA3AF"
            keyboardType={keyboardType}
            autoFocus={autoFocus}
            maxLength={maxLength}
            secureTextEntry={secureTextEntry}
            returnKeyType={returnKeyType}
            onSubmitEditing={onSubmitEditing}
            onFocus={handleFocus}
            onBlur={handleBlur}
            style={styles.input}
          />
        </Animated.View>
      </View>
    );
  },
);

Input.displayName = 'Input';

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 6,
    lineHeight: 18,
  },
  inputWrapper: {
    height: 52,
    backgroundColor: '#F3F4F6',
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  input: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 15,
    color: '#28262C',
    height: '100%',
    padding: 0,
    margin: 0,
  },
});
