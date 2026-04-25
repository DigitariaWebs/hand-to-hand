import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
  TextInput,
  Image,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import type { ClaimType } from '@/types/insurance';

// ── Claim type options ────────────────────────────────────────────────────

type ClaimOption = {
  type: ClaimType;
  emoji: string;
  label: string;
  description: string;
};

const CLAIM_OPTIONS: ClaimOption[] = [
  {
    type: 'damage',
    emoji: '📦',
    label: 'Colis endommagé',
    description: 'Le colis ou l\'article a été endommagé pendant le transport.',
  },
  {
    type: 'loss',
    emoji: '🔍',
    label: 'Colis perdu',
    description: 'Le colis n\'a jamais été livré ou a été perdu en transit.',
  },
  {
    type: 'non_conformity',
    emoji: '⚠️',
    label: 'Article non conforme',
    description: 'L\'article reçu ne correspond pas à la description de l\'annonce.',
  },
  {
    type: 'non_delivery',
    emoji: '🚫',
    label: 'Non livré',
    description: 'Le transporteur n\'a pas effectué la livraison malgré les tentatives.',
  },
];

// ── Screen ────────────────────────────────────────────────────────────────

export default function InsuranceClaimScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [selectedType, setSelectedType] = useState<ClaimType | null>(null);
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const canSubmit = selectedType !== null && description.trim().length >= 10;

  const handlePickPhoto = async () => {
    if (photos.length >= 4) {
      Alert.alert('Maximum atteint', 'Vous pouvez ajouter jusqu\'à 4 photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsMultipleSelection: false,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotos((prev) => [...prev, result.assets[0].uri]);
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
    setIsSubmitted(true);
  };

  // ── Success state ──────────────────────────────────────────────────────

  if (isSubmitted) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.headerSimple, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
            <Feather name="x" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>
        <Animated.View entering={FadeIn.duration(500)} style={styles.successContainer}>
          <View style={[styles.successIcon, { backgroundColor: `${theme.success}15` }]}>
            <Feather name="check-circle" size={48} color={theme.success} />
          </View>
          <Text style={[styles.successTitle, { color: theme.text }]}>
            Réclamation envoyée ✓
          </Text>
          <Text style={[styles.successSub, { color: theme.textSecondary }]}>
            Notre équipe analyse votre demande. Vous recevrez une réponse sous{' '}
            <Text style={{ fontFamily: 'Poppins_600SemiBold' }}>48 à 72 heures</Text>.
          </Text>

          <View
            style={[
              styles.infoCard,
              {
                backgroundColor: `${theme.primary}08`,
                borderColor: `${theme.primary}25`,
              },
            ]}
          >
            <Feather name="bell" size={14} color={theme.primary} />
            <Text style={[styles.infoText, { color: theme.textSecondary }]}>
              Vous serez notifié par notification push et par e-mail de l'avancement de votre réclamation.
            </Text>
          </View>

          <View
            style={[
              styles.timelineCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <Text style={[styles.timelineTitle, { color: theme.text }]}>
              Prochaines étapes
            </Text>
            {[
              { icon: 'file-text', label: 'Réclamation déposée', active: true },
              { icon: 'search', label: 'Analyse en cours (24-48h)', active: false },
              { icon: 'check-circle', label: 'Décision & remboursement', active: false },
            ].map((step, i) => (
              <View key={i} style={styles.timelineRow}>
                <View
                  style={[
                    styles.timelineDot,
                    {
                      backgroundColor: step.active ? theme.success : theme.border,
                    },
                  ]}
                >
                  {step.active && <Feather name="check" size={10} color="#FFF" />}
                </View>
                <Text
                  style={[
                    styles.timelineLabel,
                    { color: step.active ? theme.text : theme.textSecondary },
                  ]}
                >
                  {step.label}
                </Text>
              </View>
            ))}
          </View>

          <TouchableOpacity onPress={() => router.back()}>
            <LinearGradient
              colors={[theme.primary, theme.primaryGradientEnd]}
              style={styles.primaryBtn}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Feather name="arrow-left" size={18} color="#FFF" />
              <Text style={styles.primaryBtnText}>Retour à la commande</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  // ── Main claim form ────────────────────────────────────────────────────

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <LinearGradient
        colors={[theme.primary, theme.primaryGradientEnd]}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ouvrir une réclamation</Text>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Claim type selection ────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Type de problème
          </Text>
          <View style={styles.claimOptions}>
            {CLAIM_OPTIONS.map((option) => {
              const isSelected = selectedType === option.type;
              return (
                <TouchableOpacity
                  key={option.type}
                  style={[
                    styles.claimCard,
                    {
                      backgroundColor: isSelected ? `${theme.primary}10` : theme.surface,
                      borderColor: isSelected ? theme.primary : theme.border,
                      borderWidth: isSelected ? 2 : 1,
                    },
                  ]}
                  onPress={() => setSelectedType(option.type)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.claimEmoji}>{option.emoji}</Text>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text
                      style={[
                        styles.claimLabel,
                        { color: isSelected ? theme.primary : theme.text },
                      ]}
                    >
                      {option.label}
                    </Text>
                    <Text style={[styles.claimDesc, { color: theme.textSecondary }]}>
                      {option.description}
                    </Text>
                  </View>
                  {isSelected && (
                    <View style={[styles.checkCircle, { backgroundColor: theme.primary }]}>
                      <Feather name="check" size={12} color="#FFF" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>

        {/* ── Description ─────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Décrivez le problème
          </Text>
          <TextInput
            style={[
              styles.textArea,
              {
                color: theme.text,
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
            placeholder="Expliquez le problème en détail (minimum 10 caractères)..."
            placeholderTextColor={theme.textMuted}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            value={description}
            onChangeText={setDescription}
            maxLength={500}
          />
          <Text style={[styles.charCount, { color: theme.textMuted }]}>
            {description.length}/500
          </Text>
        </Animated.View>

        {/* ── Photos ───────────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Photos (optionnel, max 4)
          </Text>
          <View style={styles.photosGrid}>
            {photos.map((uri, i) => (
              <View key={i} style={styles.photoWrapper}>
                <Image source={{ uri }} style={styles.photoThumb} />
                <TouchableOpacity
                  style={styles.photoRemove}
                  onPress={() => setPhotos((prev) => prev.filter((_, idx) => idx !== i))}
                >
                  <Feather name="x" size={12} color="#FFF" />
                </TouchableOpacity>
              </View>
            ))}
            {photos.length < 4 && (
              <TouchableOpacity
                style={[styles.addPhotoBtn, { borderColor: theme.border, backgroundColor: theme.surface }]}
                onPress={handlePickPhoto}
              >
                <Feather name="camera" size={20} color={theme.textSecondary} />
                <Text style={[styles.addPhotoText, { color: theme.textSecondary }]}>
                  Ajouter
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>

        {/* ── Insurance coverage reminder ──────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(350).duration(400)}>
          <View
            style={[
              styles.coverageCard,
              {
                backgroundColor: `${theme.success}08`,
                borderColor: `${theme.success}25`,
              },
            ]}
          >
            <Feather name="shield" size={16} color={theme.success} />
            <Text style={[styles.coverageText, { color: theme.textSecondary }]}>
              Votre protection acheteur couvre ce type de problème.
              Le remboursement sera traité sous 48 à 72 heures après validation.
            </Text>
          </View>
        </Animated.View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Sticky submit button ──────────────────────────────────────── */}
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: theme.surface,
            borderTopColor: theme.border,
            paddingBottom: insets.bottom + 8,
          },
        ]}
      >
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={!canSubmit}
          style={{ opacity: canSubmit ? 1 : 0.5 }}
        >
          <LinearGradient
            colors={canSubmit ? [theme.primary, theme.primaryGradientEnd] : [theme.border, theme.border]}
            style={styles.primaryBtn}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Feather name="send" size={18} color="#FFF" />
            <Text style={styles.primaryBtnText}>Envoyer la réclamation</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  headerSimple: {
    paddingHorizontal: Spacing.lg,
    alignItems: 'flex-end',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { ...Typography.h3, color: '#FFF', flex: 1 },

  body: { padding: Spacing.lg, gap: Spacing.xl, paddingBottom: 60 },

  sectionTitle: { ...Typography.h3, marginBottom: Spacing.sm },

  // Claim type cards
  claimOptions: { gap: Spacing.sm },
  claimCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    position: 'relative',
  },
  claimEmoji: { fontSize: 28 },
  claimLabel: { ...Typography.bodyMedium, fontFamily: 'Poppins_600SemiBold' },
  claimDesc: { ...Typography.caption },
  checkCircle: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Text area
  textArea: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    minHeight: 100,
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    lineHeight: 20,
  },
  charCount: {
    ...Typography.caption,
    textAlign: 'right',
    marginTop: 4,
  },

  // Photos
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  photoWrapper: {
    position: 'relative',
    width: 80,
    height: 80,
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
  },
  photoThumb: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E5E7EB',
  },
  photoRemove: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoBtn: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.sm,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addPhotoText: { ...Typography.captionMedium, fontSize: 10 },

  // Coverage card
  coverageCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  coverageText: { ...Typography.caption, flex: 1 },

  // Info card
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    width: '100%',
  },
  infoText: { ...Typography.caption, flex: 1 },

  // Bottom bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
  },

  // Buttons
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md + 2,
    borderRadius: BorderRadius.md,
  },
  primaryBtnText: { ...Typography.button, color: '#FFF' },

  // Success
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  successIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: { ...Typography.h1, textAlign: 'center' },
  successSub: { ...Typography.body, textAlign: 'center', maxWidth: 280 },

  // Timeline
  timelineCard: {
    width: '100%',
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.md,
  },
  timelineTitle: { ...Typography.bodyMedium, fontFamily: 'Poppins_600SemiBold' },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  timelineDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineLabel: { ...Typography.caption },
});
