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

const CARDS = [
  {
    id: '1',
    brand: 'Visa',
    last4: '4242',
    exp: '12/26',
    isDefault: true,
  },
  {
    id: '2',
    brand: 'Mastercard',
    last4: '5555',
    exp: '08/25',
    isDefault: false,
  },
];

export default function PaymentMethodsScreen() {
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
          Moyens de paiement
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {CARDS.map((card) => (
          <View
            key={card.id}
            style={[
              styles.card,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <View style={[styles.cardIcon, { backgroundColor: `${theme.primary}12` }]}>
              <Feather name="credit-card" size={20} color={theme.primary} />
            </View>
            <View style={styles.cardInfo}>
              <View style={styles.cardTopRow}>
                <Text style={[styles.cardBrand, { color: theme.text }]}>
                  {card.brand} {"•••• " + card.last4}
                </Text>
                {card.isDefault && (
                  <View style={[styles.defaultBadge, { backgroundColor: `${theme.success}15` }]}>
                    <Text style={[styles.defaultBadgeText, { color: theme.success }]}>
                      Par défaut
                    </Text>
                  </View>
                )}
              </View>
              <Text style={[styles.cardExp, { color: theme.textSecondary }]}>
                Expire {card.exp}
              </Text>
            </View>
          </View>
        ))}

        {/* Add button */}
        <TouchableOpacity
          style={[styles.outlinedButton, { borderColor: theme.primary }]}
          activeOpacity={0.7}
        >
          <Feather name="plus" size={18} color={theme.primary} />
          <Text style={[styles.outlinedButtonText, { color: theme.primary }]}>
            Ajouter une carte
          </Text>
        </TouchableOpacity>

        {/* Info */}
        <Text style={[styles.infoText, { color: theme.textSecondary }]}>
          Vos données de paiement sont sécurisées et chiffrées.
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
    gap: Spacing.md,
    paddingBottom: 100,
  },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    flex: 1,
    gap: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  cardBrand: {
    ...Typography.bodyMedium,
    fontFamily: 'Poppins_600SemiBold',
  },
  defaultBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  defaultBadgeText: {
    ...Typography.captionMedium,
    fontSize: 10,
  },
  cardExp: {
    ...Typography.caption,
  },

  outlinedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    marginTop: Spacing.sm,
  },
  outlinedButtonText: {
    ...Typography.button,
  },

  infoText: {
    ...Typography.caption,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
});
