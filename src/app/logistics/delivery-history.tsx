import React, { useEffect } from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing } from '@/constants/Spacing';

// Delivery history has been removed from the marketplace app.
// Delivery tracking happens in-context on the order detail; full history
// lives in the H2H Logistic transporter app. Any deep-link redirects to profile.
export default function DeliveryHistoryRedirect() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;

  useEffect(() => {
    const t = setTimeout(() => router.replace('/(tabs)/profile' as never), 800);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[Typography.body, { color: theme.textSecondary, textAlign: 'center', padding: Spacing.xl }]}>
        Cette section a déménagé.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
