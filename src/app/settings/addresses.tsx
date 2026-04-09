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

const ADDRESSES = [
  {
    id: '1',
    label: 'Domicile',
    address: '12 Rue de la Paix, 06000 Nice',
  },
  {
    id: '2',
    label: 'Bureau',
    address: '45 Avenue Jean Médecin, 06000 Nice',
  },
];

export default function AddressesScreen() {
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
          Adresses de livraison
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {ADDRESSES.map((addr) => (
          <View
            key={addr.id}
            style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
          >
            <View style={styles.cardTop}>
              <View style={[styles.badge, { backgroundColor: `${theme.primary}15` }]}>
                <Feather name="home" size={14} color={theme.primary} />
                <Text style={[styles.badgeText, { color: theme.primary }]}>
                  {addr.label}
                </Text>
              </View>
              <View style={styles.cardActions}>
                <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7}>
                  <Feather name="edit-2" size={16} color={theme.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7}>
                  <Feather name="trash-2" size={16} color={theme.error} />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.cardBody}>
              <Feather name="map-pin" size={14} color={theme.textSecondary} />
              <Text style={[styles.addressText, { color: theme.text }]}>
                {addr.address}
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
            Ajouter une adresse
          </Text>
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
    gap: Spacing.md,
    paddingBottom: 100,
  },

  card: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  badgeText: {
    ...Typography.captionMedium,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  addressText: {
    ...Typography.body,
    flex: 1,
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
});
