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

const STEPS = [
  { label: "Pièce d'identité", verified: true },
  { label: "Selfie de confirmation", verified: true },
  { label: "Adresse confirmée", verified: true },
];

export default function KycScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const allVerified = STEPS.every((s) => s.verified);

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
          {"Vérification d'identité"}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Status card */}
        <View
          style={[
            styles.statusCard,
            {
              backgroundColor: allVerified ? `${theme.success}15` : `${theme.warning}15`,
              borderColor: allVerified ? theme.success : theme.warning,
            },
          ]}
        >
          <Feather
            name={allVerified ? 'check-circle' : 'clock'}
            size={24}
            color={allVerified ? theme.success : theme.warning}
          />
          <Text
            style={[
              styles.statusText,
              { color: allVerified ? theme.success : theme.warning },
            ]}
          >
            {allVerified ? "Identité vérifiée ✓" : "Vérification en cours"}
          </Text>
        </View>

        {/* Steps */}
        <View style={[styles.stepsCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {STEPS.map((step, index) => (
            <View
              key={step.label}
              style={[
                styles.stepRow,
                index < STEPS.length - 1 && {
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: theme.border,
                },
              ]}
            >
              <View
                style={[
                  styles.stepNumber,
                  {
                    backgroundColor: step.verified
                      ? `${theme.success}15`
                      : `${theme.textSecondary}15`,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.stepNumberText,
                    { color: step.verified ? theme.success : theme.textSecondary },
                  ]}
                >
                  {index + 1}
                </Text>
              </View>
              <Text style={[styles.stepLabel, { color: theme.text }]}>
                {step.label}
              </Text>
              {step.verified && (
                <Text style={[styles.verifiedText, { color: theme.success }]}>
                  {"Vérifié ✓"}
                </Text>
              )}
            </View>
          ))}
        </View>

        {/* Info */}
        <Text style={[styles.infoText, { color: theme.textSecondary }]}>
          {"Votre identité a été vérifiée le 15 mars 2023."}
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

  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  statusText: {
    ...Typography.bodyMedium,
    fontFamily: 'Poppins_600SemiBold',
  },

  stepsCard: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    ...Typography.captionMedium,
    fontFamily: 'Poppins_600SemiBold',
  },
  stepLabel: {
    ...Typography.bodyMedium,
    flex: 1,
  },
  verifiedText: {
    ...Typography.captionMedium,
  },

  infoText: {
    ...Typography.caption,
    textAlign: 'center',
  },
});
