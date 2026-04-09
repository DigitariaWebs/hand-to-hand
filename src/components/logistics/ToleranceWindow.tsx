import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import {
  getToleranceWindow,
  getToleranceStatus,
  getToleranceMessage,
  getToleranceProgress,
  formatToleranceTime,
  type ToleranceStatus,
} from '@/utils/tolerance';

type Props = {
  referenceTime: Date;
  role?: 'transporter' | 'seller' | 'buyer';
  compact?: boolean;
};

const STATUS_COLORS = (theme: typeof Colors.light) => ({
  early: theme.textSecondary,
  preparation: '#3B82F6',     // blue
  on_time: theme.success,
  tolerance: theme.warning,
  late: theme.error,
});

export function ToleranceWindow({ referenceTime, role, compact }: Props) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;

  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const window = getToleranceWindow(referenceTime);
  const status = getToleranceStatus(referenceTime, now);
  const progress = getToleranceProgress(referenceTime, now);
  const message = getToleranceMessage(status);
  const statusColors = STATUS_COLORS(theme);
  const activeColor = statusColors[status];

  // Animated dot pulse
  const pulse = useSharedValue(1);
  useEffect(() => {
    if (status === 'late' || status === 'early') return;
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.4, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
    );
  }, [status]);

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  // Role-specific hints
  const roleHint = role === 'transporter'
    ? "Merci de rester disponible jusqu'à la fin de la fenêtre (+10 min)."
    : role === 'seller'
    ? "Arriver un peu en avance, c'est idéal, mais prenez votre temps."
    : role === 'buyer'
    ? "Arriver un peu en avance, c'est idéal, mais prenez votre temps."
    : undefined;

  // Countdown to reference time
  const diffMs = referenceTime.getTime() - now.getTime();
  const absDiffMs = Math.abs(diffMs);
  const mins = Math.floor(absDiffMs / 60000);
  const secs = Math.floor((absDiffMs % 60000) / 1000);
  const countdownText = diffMs > 0
    ? `dans ${mins}:${secs.toString().padStart(2, '0')}`
    : diffMs < -600000
    ? 'fenêtre terminée'
    : `+${mins}:${secs.toString().padStart(2, '0')}`;

  if (compact) {
    return (
      <View style={[styles.compactContainer, { backgroundColor: `${activeColor}10`, borderColor: `${activeColor}30` }]}>
        <Feather name="clock" size={14} color={activeColor} />
        <Text style={[styles.compactText, { color: activeColor }]}>
          {formatToleranceTime(window.start)} – {formatToleranceTime(window.end)}
        </Text>
        <View style={[styles.compactDot, { backgroundColor: activeColor }]} />
        <Text style={[styles.compactStatus, { color: activeColor }]}>
          {status === 'preparation' ? 'Préparation' : status === 'tolerance' ? 'Tolérance' : status === 'late' ? 'Dépassée' : 'En avance'}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Feather name="clock" size={16} color={activeColor} />
        <Text style={[styles.headerLabel, { color: theme.text }]}>Fenêtre de tolérance</Text>
        <Text style={[styles.countdown, { color: activeColor }]}>{countdownText}</Text>
      </View>

      {/* Timeline bar */}
      <View style={styles.barContainer}>
        {/* Zone labels */}
        <View style={styles.zoneLabels}>
          <Text style={[styles.zoneLabel, { color: '#3B82F6' }]}>Préparation</Text>
          <Text style={[styles.zoneLabel, { color: theme.success }]}>Heure prévue</Text>
          <Text style={[styles.zoneLabel, { color: theme.warning }]}>Tolérance</Text>
        </View>

        {/* Bar */}
        <View style={styles.barTrack}>
          {/* Preparation zone (-10 to 0) = left 50% */}
          <View style={[styles.barZone, styles.barPrep, { backgroundColor: '#3B82F620' }]} />
          {/* Tolerance zone (0 to +10) = right 50% */}
          <View style={[styles.barZone, styles.barTolerance, { backgroundColor: `${theme.warning}20` }]} />
          {/* Center marker (reference time) */}
          <View style={[styles.centerMarker, { backgroundColor: theme.success }]} />

          {/* Current position indicator */}
          {status !== 'early' && status !== 'late' && (
            <Animated.View
              style={[
                styles.positionDot,
                { left: `${Math.max(0, Math.min(100, progress * 100))}%`, backgroundColor: activeColor },
                dotStyle,
              ]}
            />
          )}
        </View>

        {/* Time labels */}
        <View style={styles.timeLabels}>
          <Text style={[styles.timeLabel, { color: theme.textSecondary }]}>
            {formatToleranceTime(window.start)}
          </Text>
          <Text style={[styles.timeLabelCenter, { color: theme.success }]}>
            {formatToleranceTime(window.referenceTime)}
          </Text>
          <Text style={[styles.timeLabel, { color: theme.textSecondary }]}>
            {formatToleranceTime(window.end)}
          </Text>
        </View>
      </View>

      {/* Window text */}
      <Text style={[styles.windowText, { color: theme.textSecondary }]}>
        Fenêtre : {formatToleranceTime(window.start)} – {formatToleranceTime(window.end)}
      </Text>

      {/* Status message */}
      <View style={[styles.messageRow, { backgroundColor: `${activeColor}10` }]}>
        <View style={[styles.statusDot, { backgroundColor: activeColor }]} />
        <Text style={[styles.messageText, { color: activeColor }]}>{message}</Text>
      </View>

      {/* Role hint */}
      {roleHint && (
        <View style={styles.hintRow}>
          <Feather name="info" size={12} color={theme.textSecondary} />
          <Text style={[styles.hintText, { color: theme.textSecondary }]}>{roleHint}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.lg,
    gap: Spacing.md,
  },

  // Header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerLabel: {
    ...Typography.bodyMedium,
    fontFamily: 'Poppins_600SemiBold',
    flex: 1,
  },
  countdown: {
    ...Typography.captionMedium,
    fontFamily: 'Poppins_600SemiBold',
  },

  // Bar
  barContainer: { gap: Spacing.xs },
  zoneLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  zoneLabel: {
    ...Typography.caption,
    fontSize: 10,
  },
  barTrack: {
    height: 12,
    borderRadius: 6,
    flexDirection: 'row',
    overflow: 'visible',
    position: 'relative',
    backgroundColor: '#E5E7EB20',
  },
  barZone: {
    flex: 1,
    borderRadius: 6,
  },
  barPrep: {
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },
  barTolerance: {
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  },
  centerMarker: {
    position: 'absolute',
    left: '50%',
    top: -2,
    width: 3,
    height: 16,
    marginLeft: -1.5,
    borderRadius: 1.5,
  },
  positionDot: {
    position: 'absolute',
    top: -3,
    width: 18,
    height: 18,
    borderRadius: 9,
    marginLeft: -9,
    borderWidth: 2.5,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },

  // Time labels
  timeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeLabel: { ...Typography.caption, fontSize: 11 },
  timeLabelCenter: {
    ...Typography.captionMedium,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11,
  },

  // Window text
  windowText: { ...Typography.caption, textAlign: 'center' },

  // Status message
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  messageText: {
    ...Typography.caption,
    flex: 1,
  },

  // Hint
  hintRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
  },
  hintText: {
    ...Typography.caption,
    fontSize: 11,
    flex: 1,
  },

  // Compact
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  compactText: { ...Typography.captionMedium, flex: 1 },
  compactDot: { width: 6, height: 6, borderRadius: 3 },
  compactStatus: { ...Typography.captionMedium },
});
