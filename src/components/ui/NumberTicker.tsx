import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextStyle, StyleProp } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

type NumberTickerProps = {
  value: number;
  style?: StyleProp<TextStyle>;
  decimals?: number;
  currency?: string;
  decimalSeparator?: string;
};

function formatValue(value: number, decimals: number, decimalSeparator: string): string {
  const abs = Math.abs(value);
  const fixed = abs.toFixed(decimals);
  return decimalSeparator === ',' ? fixed.replace('.', ',') : fixed;
}

type DigitProps = {
  char: string;
  style?: StyleProp<TextStyle>;
  delay: number;
};

function Digit({ char, style, delay }: DigitProps) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);
  const prevChar = useRef(char);

  useEffect(() => {
    if (prevChar.current !== char && /\d/.test(char)) {
      translateY.value = -18;
      opacity.value = 0.2;
      translateY.value = withDelay(
        delay,
        withSpring(0, { damping: 15, stiffness: 120, mass: 0.6 }),
      );
      opacity.value = withDelay(delay, withTiming(1, { duration: 300 }));
    }
    prevChar.current = char;
  }, [char, delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!/\d/.test(char)) {
    return <Text style={style}>{char}</Text>;
  }

  return (
    <Animated.View style={[styles.digit, animatedStyle]}>
      <Text style={style}>{char}</Text>
    </Animated.View>
  );
}

export function NumberTicker({
  value,
  style,
  decimals = 2,
  currency = '€',
  decimalSeparator = ',',
}: NumberTickerProps) {
  const formatted = formatValue(value, decimals, decimalSeparator);
  const chars = formatted.split('');
  const digitIndexes: number[] = [];
  chars.forEach((c, i) => {
    if (/\d/.test(c)) digitIndexes.push(i);
  });

  return (
    <View style={styles.row}>
      {chars.map((char, i) => {
        const digitOrder = digitIndexes.indexOf(i);
        const delay = digitOrder >= 0 ? digitOrder * 60 : 0;
        return (
          <Digit
            key={`${i}-${char}`}
            char={char}
            style={style}
            delay={delay}
          />
        );
      })}
      {currency ? <Text style={[style, { marginLeft: 6 }]}>{currency}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  digit: {
    overflow: 'hidden',
  },
});
