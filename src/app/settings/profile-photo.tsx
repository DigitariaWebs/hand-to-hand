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
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing, BorderRadius } from '@/constants/Spacing';

export default function ProfilePhotoScreen() {
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
        <Text style={[styles.headerTitle, { color: theme.text }]}>Photo de profil</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <Image
            source={{ uri: 'https://i.pravatar.cc/300?img=5' }}
            style={styles.avatar}
            contentFit="cover"
          />
        </View>

        {/* Actions */}
        <TouchableOpacity
          style={[
            styles.outlinedButton,
            { borderColor: theme.primary },
          ]}
          activeOpacity={0.7}
        >
          <Feather name="camera" size={18} color={theme.primary} />
          <Text style={[styles.outlinedButtonText, { color: theme.primary }]}>
            Modifier la photo
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.outlinedButton,
            { borderColor: theme.error },
          ]}
          activeOpacity={0.7}
        >
          <Feather name="trash-2" size={18} color={theme.error} />
          <Text style={[styles.outlinedButtonText, { color: theme.error }]}>
            Supprimer la photo
          </Text>
        </TouchableOpacity>

        {/* Info */}
        <Text style={[styles.infoText, { color: theme.textSecondary }]}>
          Votre photo est visible par les autres utilisateurs.
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
    gap: Spacing.lg,
    paddingBottom: 100,
  },

  avatarSection: {
    marginTop: Spacing.xxl,
    marginBottom: Spacing.lg,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },

  outlinedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    width: '100%',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
  },
  outlinedButtonText: {
    ...Typography.button,
  },

  infoText: {
    ...Typography.caption,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
});
