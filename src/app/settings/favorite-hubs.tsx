import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { mockHubs } from '@/services/mock/hubs';

const HUB_TYPE_ICONS: Record<string, keyof typeof Feather.glyphMap> = {
  train: 'navigation',
  mall: 'shopping-bag',
  bus: 'truck',
  highway: 'map',
  ecommerce: 'package',
};

export default function FavoriteHubsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Take first 3 hubs as favorites
  const [favoriteIds, setFavoriteIds] = useState(['h1', 'h2', 'h3']);
  const favoriteHubs = mockHubs.filter((h) => favoriteIds.includes(h.id));

  const handleRemove = (id: string, name: string) => {
    Alert.alert(
      "Retirer des favoris",
      `Retirer ${name} de vos hubs favoris ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Retirer",
          style: "destructive",
          onPress: () => setFavoriteIds((prev) => prev.filter((fid) => fid !== id)),
        },
      ],
    );
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
          Mes hubs favoris
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {favoriteHubs.map((hub) => {
          const iconName = HUB_TYPE_ICONS[hub.hubType] || 'map-pin';
          return (
            <View
              key={hub.id}
              style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
            >
              <View style={[styles.hubIcon, { backgroundColor: `${theme.primary}12` }]}>
                <Feather name={iconName} size={20} color={theme.primary} />
              </View>
              <View style={styles.hubInfo}>
                <Text style={[styles.hubName, { color: theme.text }]}>
                  {hub.name}
                </Text>
                <Text style={[styles.hubAddress, { color: theme.textSecondary }]}>
                  {hub.address}, {hub.city}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => handleRemove(hub.id, hub.name)}
                style={[styles.removeBtn, { borderColor: `${theme.error}40` }]}
                activeOpacity={0.7}
              >
                <Feather name="x" size={14} color={theme.error} />
              </TouchableOpacity>
            </View>
          );
        })}

        {/* Add button */}
        <TouchableOpacity
          style={[styles.outlinedButton, { borderColor: theme.primary }]}
          activeOpacity={0.7}
        >
          <Feather name="plus" size={18} color={theme.primary} />
          <Text style={[styles.outlinedButtonText, { color: theme.primary }]}>
            Ajouter un hub
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  hubIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hubInfo: {
    flex: 1,
    gap: 2,
  },
  hubName: {
    ...Typography.bodyMedium,
    fontFamily: 'Poppins_600SemiBold',
  },
  hubAddress: {
    ...Typography.caption,
  },
  removeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
