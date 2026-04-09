import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing, BorderRadius } from '@/constants/Spacing';

const LINKS = [
  { label: "Site web", icon: 'globe' as const },
  { label: "Instagram", icon: 'instagram' as const },
  { label: "Politique de confidentialité", icon: 'shield' as const },
];

export default function AboutScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const router = useRouter();

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
          {"À propos"}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo placeholder */}
        <View style={styles.logoSection}>
          <View style={[styles.logo, { backgroundColor: theme.primary }]}>
            <Text style={styles.logoText}>H2H</Text>
          </View>
          <Text style={[styles.appName, { color: theme.text }]}>
            Hand to Hand
          </Text>
          <Text style={[styles.version, { color: theme.textSecondary }]}>
            Version 1.0.0
          </Text>
        </View>

        {/* Description */}
        <Text style={[styles.description, { color: theme.textSecondary }]}>
          {"Hand to Hand est une plateforme de livraison collaborative entre particuliers sur la Côte d'Azur."}
        </Text>

        {/* Links */}
        <View style={[styles.linksCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {LINKS.map((link, index) => (
            <TouchableOpacity
              key={link.label}
              style={[
                styles.linkRow,
                index < LINKS.length - 1 && {
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: theme.border,
                },
              ]}
              activeOpacity={0.7}
            >
              <Feather name={link.icon} size={18} color={theme.primary} />
              <Text style={[styles.linkLabel, { color: theme.text }]}>
                {link.label}
              </Text>
              <Feather name="external-link" size={14} color={theme.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Footer */}
        <Text style={[styles.footer, { color: theme.textSecondary }]}>
          {"Fait avec ❤️ à Nice"}
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
    alignItems: 'center',
    gap: Spacing.xl,
    paddingBottom: 100,
  },

  logoSection: {
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xxl,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 24,
    color: '#FFFFFF',
  },
  appName: {
    ...Typography.h1,
  },
  version: {
    ...Typography.caption,
  },

  description: {
    ...Typography.body,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: Spacing.lg,
  },

  linksCard: {
    width: '100%',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  linkLabel: {
    ...Typography.bodyMedium,
    flex: 1,
  },

  footer: {
    ...Typography.caption,
    textAlign: 'center',
    marginTop: Spacing.xxl,
  },
});
