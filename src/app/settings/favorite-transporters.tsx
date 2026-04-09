import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { useLogisticsStore } from '@/stores/useLogisticsStore';

// Mock transporter data keyed by ID
const TRANSPORTER_DATA: Record<string, { name: string; avatar: string; rating: number; lastDelivery: string }> = {
  u2: {
    name: 'karim_b',
    avatar: 'https://i.pravatar.cc/150?img=3',
    rating: 4.9,
    lastDelivery: '2 avr. 2026',
  },
  u4: {
    name: 'marc_l',
    avatar: 'https://i.pravatar.cc/150?img=8',
    rating: 4.6,
    lastDelivery: '28 mars 2026',
  },
  u5: {
    name: 'fatima_o',
    avatar: 'https://i.pravatar.cc/150?img=9',
    rating: 4.8,
    lastDelivery: '15 mars 2026',
  },
};

export default function FavoriteTransportersScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { favoriteTransporterIds, removeFavoriteTransporter } = useLogisticsStore();

  const handleRemove = (id: string, name: string) => {
    Alert.alert(
      'Retirer des favoris',
      `Retirer ${name} de vos transporteurs favoris ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Retirer',
          style: 'destructive',
          onPress: () => removeFavoriteTransporter(id),
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
        <Text style={[styles.headerTitle, { color: theme.text }]}>Mes transporteurs favoris</Text>
        <View style={{ width: 36 }} />
      </View>

      {favoriteTransporterIds.length === 0 ? (
        /* Empty state */
        <View style={styles.emptyWrap}>
          <View style={[styles.emptyIcon, { backgroundColor: `${theme.primary}10` }]}>
            <Feather name="star" size={48} color={theme.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>
            Aucun transporteur favori
          </Text>
          <Text style={[styles.emptyDesc, { color: theme.textSecondary }]}>
            Après une livraison réussie, vous pourrez ajouter des transporteurs à vos favoris. Ils recevront vos missions en priorité !
          </Text>
        </View>
      ) : (
        /* List */
        <Animated.ScrollView
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.countText, { color: theme.textSecondary }]}>
            {favoriteTransporterIds.length} transporteur{favoriteTransporterIds.length > 1 ? 's' : ''} favori{favoriteTransporterIds.length > 1 ? 's' : ''}
          </Text>

          {favoriteTransporterIds.map((id, index) => {
            const data = TRANSPORTER_DATA[id];
            if (!data) return null;

            return (
              <Animated.View
                key={id}
                entering={FadeInDown.delay(index * 80)}
                exiting={FadeOut.duration(200)}
              >
                <View
                  style={[
                    styles.card,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                  ]}
                >
                  <Image
                    source={{ uri: data.avatar }}
                    style={styles.avatar}
                    contentFit="cover"
                  />
                  <View style={styles.cardInfo}>
                    <Text style={[styles.cardName, { color: theme.text }]}>
                      {data.name}
                    </Text>
                    <View style={styles.ratingRow}>
                      <Feather name="star" size={11} color="#F59E0B" />
                      <Text style={[styles.ratingText, { color: theme.textSecondary }]}>
                        {data.rating}
                      </Text>
                    </View>
                    <Text style={[styles.lastDelivery, { color: theme.textSecondary }]}>
                      Dernière livraison : {data.lastDelivery}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleRemove(id, data.name)}
                    style={[styles.removeBtn, { borderColor: `${theme.error}40` }]}
                  >
                    <Feather name="x" size={14} color={theme.error} />
                  </TouchableOpacity>
                </View>
              </Animated.View>
            );
          })}

          <Text style={[styles.footerNote, { color: theme.textSecondary }]}>
            Les transporteurs favoris reçoivent vos missions en priorité avec une fenêtre exclusive de 5 à 10 minutes avant l'ouverture aux autres transporteurs.
          </Text>
        </Animated.ScrollView>
      )}
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

  // Empty state
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxxl,
    gap: Spacing.lg,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    ...Typography.h3,
    textAlign: 'center',
  },
  emptyDesc: {
    ...Typography.body,
    textAlign: 'center',
    lineHeight: 22,
  },

  // List
  list: {
    padding: Spacing.lg,
    gap: Spacing.md,
    paddingBottom: 100,
  },
  countText: {
    ...Typography.captionMedium,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  cardInfo: {
    flex: 1,
    gap: 2,
  },
  cardName: {
    ...Typography.bodyMedium,
    fontFamily: 'Poppins_600SemiBold',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    ...Typography.caption,
  },
  lastDelivery: {
    ...Typography.caption,
    fontSize: 11,
  },
  removeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerNote: {
    ...Typography.caption,
    textAlign: 'center',
    marginTop: Spacing.lg,
    lineHeight: 18,
  },
});
