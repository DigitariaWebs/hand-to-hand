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
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing, BorderRadius } from '@/constants/Spacing';

const FIELDS = [
  { label: "Prénom", value: "Sophie" },
  { label: "Nom", value: "Marchand" },
  { label: "Nom d'utilisateur", value: "@sophie_m" },
  { label: "Téléphone", value: "+33 6 00 00 00 01" },
  { label: "Email", value: "sophie@example.com" },
  { label: "Ville", value: "Nice" },
];

export default function PersonalInfoScreen() {
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
          Informations personnelles
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {FIELDS.map((field, index) => (
            <View
              key={field.label}
              style={[
                styles.fieldRow,
                index < FIELDS.length - 1 && {
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: theme.border,
                },
              ]}
            >
              <View style={styles.fieldContent}>
                <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
                  {field.label}
                </Text>
                <Text style={[styles.fieldValue, { color: theme.text }]}>
                  {field.value}
                </Text>
              </View>
              <Feather name="edit-2" size={16} color={theme.textSecondary} />
            </View>
          ))}
        </View>

        {/* Modifier button */}
        <TouchableOpacity activeOpacity={0.8} style={styles.gradientBtnWrap}>
          <LinearGradient
            colors={[Colors.light.primary, Colors.light.primaryGradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientBtn}
          >
            <Text style={styles.gradientBtnText}>Modifier</Text>
          </LinearGradient>
        </TouchableOpacity>
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
    gap: Spacing.xl,
    paddingBottom: 100,
  },

  card: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  fieldContent: {
    flex: 1,
    gap: 2,
  },
  fieldLabel: {
    ...Typography.caption,
  },
  fieldValue: {
    ...Typography.bodyMedium,
  },

  gradientBtnWrap: {
    marginTop: Spacing.sm,
  },
  gradientBtn: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradientBtnText: {
    ...Typography.button,
    color: '#FFFFFF',
  },
});
