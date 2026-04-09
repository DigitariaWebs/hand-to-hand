import React, { ReactNode } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  StyleProp,
  ViewStyle,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Colors } from '@/constants/Colors';
import { BorderRadius } from '@/constants/Spacing';

type Variant = 'primary' | 'social' | 'outline' | 'ghost';

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  icon?: ReactNode;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  loading = false,
  disabled = false,
  style,
}: ButtonProps) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { stiffness: 400, damping: 20 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1.0, { stiffness: 400, damping: 20 });
  };

  const isDisabled = disabled || loading;

  if (variant === 'primary') {
    return (
      <Animated.View style={[animStyle, { opacity: isDisabled ? 0.5 : 1 }, style]}>
        <TouchableOpacity
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={isDisabled}
          activeOpacity={1}
          style={styles.primaryTouch}
        >
          <LinearGradient
            colors={['#14248A', '#2A8A6A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.primaryGradient}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <View style={styles.rowContent}>
                {icon && <View style={styles.iconLeft}>{icon}</View>}
                <Text style={styles.primaryText}>{label}</Text>
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  if (variant === 'social') {
    return (
      <Animated.View style={[animStyle, { opacity: isDisabled ? 0.5 : 1 }, style]}>
        <TouchableOpacity
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={isDisabled}
          activeOpacity={1}
          style={styles.socialButton}
        >
          {loading ? (
            <ActivityIndicator color="#28262C" size="small" />
          ) : (
            <>
              {icon && <View style={styles.socialIconLeft}>{icon}</View>}
              <View style={styles.socialLabelContainer}>
                <Text style={styles.socialText}>{label}</Text>
              </View>
            </>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  }

  if (variant === 'outline') {
    return (
      <Animated.View style={[animStyle, { opacity: isDisabled ? 0.5 : 1 }, style]}>
        <TouchableOpacity
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={isDisabled}
          activeOpacity={1}
          style={styles.outlineButton}
        >
          {loading ? (
            <ActivityIndicator color={Colors.light.primary} size="small" />
          ) : (
            <View style={styles.rowContent}>
              {icon && <View style={styles.iconLeft}>{icon}</View>}
              <Text style={styles.outlineText}>{label}</Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  }

  // ghost
  return (
    <Animated.View style={[animStyle, { opacity: isDisabled ? 0.5 : 1 }, style]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        activeOpacity={1}
        style={styles.ghostButton}
      >
        {loading ? (
          <ActivityIndicator color={Colors.light.textSecondary} size="small" />
        ) : (
          <Text style={styles.ghostText}>{label}</Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // Primary
  primaryTouch: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    height: 52,
  },
  primaryGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  primaryText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    color: '#FFFFFF',
    lineHeight: 20,
  },

  // Social
  socialButton: {
    height: 52,
    borderRadius: BorderRadius.md,
    backgroundColor: '#F3F4F6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  socialIconLeft: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialLabelContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 15,
    color: '#28262C',
    lineHeight: 20,
  },

  // Outline
  outlineButton: {
    height: 52,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  outlineText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    color: Colors.light.primary,
    lineHeight: 20,
  },

  // Ghost
  ghostButton: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  ghostText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: Colors.light.textSecondary,
    lineHeight: 18,
  },

  // Shared
  rowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconLeft: {
    marginRight: 4,
  },
});
