import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  ScrollView,
  TouchableOpacity,
  Platform,
  Linking,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing, BorderRadius } from '@/constants/Spacing';

const H2H_LOGISTIC_AVAILABLE = false;
const APP_STORE_URL = 'https://apps.apple.com/app/id0000000000';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.handtohand.logistic';
const DEEP_LINK = 'h2hlogistic://';

const BENEFITS = [
  {
    emoji: '🚗',
    title: 'Utilisez vos trajets existants',
    body: 'Pas de détour. Livrez sur votre chemin habituel domicile-travail.',
  },
  {
    emoji: '💰',
    title: '80% des frais pour vous',
    body: 'La rémunération la plus généreuse du marché.',
  },
  {
    emoji: '🌿',
    title: 'Impact écologique positif',
    body: 'Moins de véhicules sur la route. Chaque livraison compte.',
  },
];

const STEPS = [
  'Publiez votre trajet quotidien',
  'Acceptez les livraisons qui vous arrangent',
  'Récupérez et remettez le colis aux hubs',
];

export default function BecomeTransporterScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleDownload = () => {
    if (!H2H_LOGISTIC_AVAILABLE) {
      Alert.alert(
        'Bientôt disponible',
        "H2H Logistic arrive très vite sur les stores. Merci de votre intérêt !",
      );
      return;
    }
    const url = Platform.OS === 'ios' ? APP_STORE_URL : PLAY_STORE_URL;
    Linking.openURL(url).catch(() => {
      Alert.alert('Impossible d\'ouvrir le store', 'Réessayez dans un instant.');
    });
  };

  const handleOpenExisting = () => {
    Linking.openURL(DEEP_LINK).catch(() => {
      if (!H2H_LOGISTIC_AVAILABLE) {
        Alert.alert(
          'Bientôt disponible',
          'Vous pourrez ouvrir H2H Logistic dès sa sortie.',
        );
        return;
      }
      handleDownload();
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View
        style={[
          styles.closeRow,
          { paddingTop: insets.top + 8 },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.closeBtn, { backgroundColor: theme.surface }]}
        >
          <Feather name="x" size={20} color={theme.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <LinearGradient
            colors={[theme.primary, theme.primaryGradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoWrap}
          >
            <MaterialCommunityIcons name="truck-delivery-outline" size={44} color="#FFF" />
          </LinearGradient>
          <Text style={[styles.brand, { color: theme.text }]}>H2H Logistic</Text>
          <Text style={[styles.tagline, { color: theme.textSecondary }]}>
            Proposez vos trajets quotidiens et gagnez de l'argent en livrant des colis sur votre route.
          </Text>
        </View>

        <View style={styles.benefits}>
          {BENEFITS.map((b) => (
            <View
              key={b.title}
              style={[
                styles.benefitCard,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <Text style={styles.benefitEmoji}>{b.emoji}</Text>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={[styles.benefitTitle, { color: theme.text }]}>
                  {b.title}
                </Text>
                <Text style={[styles.benefitBody, { color: theme.textSecondary }]}>
                  {b.body}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.how}>
          <Text style={[styles.howTitle, { color: theme.text }]}>
            Comment ça marche ?
          </Text>
          <View style={styles.stepsList}>
            {STEPS.map((step, i) => (
              <View key={step} style={styles.stepRow}>
                <View
                  style={[styles.stepCircle, { backgroundColor: theme.primary }]}
                >
                  <Text style={styles.stepNum}>{i + 1}</Text>
                </View>
                <Text style={[styles.stepText, { color: theme.text }]}>
                  {step}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            paddingBottom: insets.bottom + Spacing.md,
            backgroundColor: theme.surface,
            borderTopColor: theme.border,
          },
        ]}
      >
        <TouchableOpacity
          onPress={handleDownload}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={[theme.primary, theme.primaryGradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.cta}
          >
            <Feather name="download" size={16} color="#FFF" />
            <Text style={styles.ctaText}>Télécharger H2H Logistic</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleOpenExisting} style={styles.secondary}>
          <Text style={[styles.secondaryText, { color: theme.primary }]}>
            Déjà transporteur ? Ouvrir H2H Logistic
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  closeRow: {
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
      },
      android: { elevation: 2 },
    }),
  },

  scroll: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },

  hero: {
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.xl,
  },
  logoWrap: {
    width: 88,
    height: 88,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 28,
    lineHeight: 36,
  },
  tagline: {
    ...Typography.body,
    textAlign: 'center',
    paddingHorizontal: Spacing.md,
  },

  benefits: {
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  benefitCard: {
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  benefitEmoji: {
    fontSize: 28,
  },
  benefitTitle: {
    ...Typography.bodyMedium,
    fontFamily: 'Poppins_600SemiBold',
  },
  benefitBody: {
    ...Typography.caption,
    lineHeight: 18,
  },

  how: {
    marginTop: Spacing.xxl,
    gap: Spacing.md,
  },
  howTitle: {
    ...Typography.h2,
  },
  stepsList: { gap: Spacing.md },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNum: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
    color: '#FFF',
  },
  stepText: {
    ...Typography.bodyMedium,
    flex: 1,
  },

  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: Spacing.sm,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: 14,
    borderRadius: BorderRadius.full,
  },
  ctaText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    color: '#FFF',
  },
  secondary: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  secondaryText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
  },
});
