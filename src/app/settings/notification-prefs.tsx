import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing, BorderRadius } from '@/constants/Spacing';

type PrefKey = 'messages' | 'commandes' | 'livraisons' | 'encheres' | 'promotions' | 'rappels';

const INITIAL_PREFS: Record<PrefKey, boolean> = {
  messages: true,
  commandes: true,
  livraisons: true,
  encheres: true,
  promotions: false,
  rappels: true,
};

const PREF_LABELS: { key: PrefKey; label: string; icon: keyof typeof Feather.glyphMap }[] = [
  { key: 'messages', label: 'Messages', icon: 'message-circle' },
  { key: 'commandes', label: 'Commandes', icon: 'shopping-bag' },
  { key: 'livraisons', label: 'Livraisons', icon: 'truck' },
  { key: 'encheres', label: 'Enchères', icon: 'trending-up' },
  { key: 'promotions', label: 'Promotions et offres', icon: 'tag' },
  { key: 'rappels', label: 'Rappels', icon: 'clock' },
];

export default function NotificationPrefsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [prefs, setPrefs] = useState(INITIAL_PREFS);

  const toggle = (key: PrefKey) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 8,
            backgroundColor: theme.surface,
            borderBottomColor: theme.border,
          },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Préférences de notification
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {PREF_LABELS.map((item, index) => (
            <View
              key={item.key}
              style={[
                styles.row,
                index < PREF_LABELS.length - 1 && {
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: theme.border,
                },
              ]}
            >
              <View style={[styles.rowIcon, { backgroundColor: `${theme.primary}12` }]}>
                <Feather name={item.icon} size={16} color={theme.primary} />
              </View>
              <Text style={[styles.rowLabel, { color: theme.text }]}>
                {item.label}
              </Text>
              <Switch
                value={prefs[item.key]}
                onValueChange={() => toggle(item.key)}
                trackColor={{ false: theme.border, true: `${theme.primary}60` }}
                thumbColor={prefs[item.key] ? theme.primary : '#F3F4F6'}
              />
            </View>
          ))}
        </View>

        {/* Info */}
        <Text style={[styles.infoText, { color: theme.textSecondary }]}>
          {"Vous pouvez désactiver les notifications à tout moment."}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { ...Typography.h3, flex: 1, textAlign: 'center' },

  content: {
    padding: Spacing.lg,
    gap: Spacing.lg,
    paddingBottom: 100,
  },

  card: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    ...Typography.bodyMedium,
    flex: 1,
  },

  infoText: {
    ...Typography.caption,
    textAlign: 'center',
  },
});
