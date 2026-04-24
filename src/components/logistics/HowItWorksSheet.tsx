import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  useColorScheme,
  ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing, BorderRadius } from '@/constants/Spacing';

type Props = {
  visible: boolean;
  onClose: () => void;
};

const STEPS: Array<{ emoji: string; title: string; body: string }> = [
  {
    emoji: '📦',
    title: 'Le vendeur dépose le colis au hub',
    body: 'Un QR code valide la prise en charge.',
  },
  {
    emoji: '🚗',
    title: "Un transporteur l'emporte sur son trajet",
    body: 'Particulier vérifié, sur un itinéraire qu’il fait déjà.',
  },
  {
    emoji: '📱',
    title: 'Validation par QR code à chaque étape',
    body: 'Double scan à la remise : acheteur + colis.',
  },
  {
    emoji: '✅',
    title: 'Vous récupérez votre colis au hub',
    body: 'Ou en remise en main propre si disponible.',
  },
];

export function HowItWorksSheet({ visible, onClose }: Props) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: theme.background }]}>
          <View style={styles.handle} />
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={[styles.title, { color: theme.text }]}>
              Comment fonctionne la livraison Hand to Hand ?
            </Text>

            <View style={styles.stepsCol}>
              {STEPS.map((s, i) => (
                <View
                  key={i}
                  style={[styles.stepRow, { backgroundColor: theme.surface, borderColor: theme.border }]}
                >
                  <View style={[styles.stepNumber, { backgroundColor: `${theme.primary}12` }]}>
                    <Text style={[styles.stepNumberText, { color: theme.primary }]}>{i + 1}</Text>
                  </View>
                  <Text style={styles.stepEmoji}>{s.emoji}</Text>
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text style={[styles.stepTitle, { color: theme.text }]}>{s.title}</Text>
                    <Text style={[styles.stepBody, { color: theme.textSecondary }]}>{s.body}</Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={[styles.secureBanner, { backgroundColor: `${theme.success}12`, borderColor: `${theme.success}30` }]}>
              <Feather name="shield" size={16} color={theme.success} />
              <Text style={[styles.secureText, { color: theme.success }]}>
                Paiement sécurisé — libéré uniquement après scan QR
              </Text>
            </View>

            <TouchableOpacity onPress={onClose} style={{ marginTop: Spacing.lg }}>
              <LinearGradient
                colors={[theme.primary, theme.primaryGradientEnd]}
                style={styles.dismissBtn}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.dismissText}>Compris !</Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '85%',
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: '#D1D5DB',
    alignSelf: 'center', marginTop: 10,
  },
  content: { padding: Spacing.xl, paddingBottom: 40 },
  title: { ...Typography.h2, textAlign: 'center', marginBottom: Spacing.lg },
  stepsCol: { gap: Spacing.sm },
  stepRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    padding: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1,
  },
  stepNumber: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  stepNumberText: { ...Typography.captionMedium, fontFamily: 'Poppins_700Bold' },
  stepEmoji: { fontSize: 22 },
  stepTitle: { ...Typography.bodyMedium, fontFamily: 'Poppins_600SemiBold' },
  stepBody: { ...Typography.caption },
  secureBanner: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    padding: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1,
    marginTop: Spacing.lg,
  },
  secureText: { ...Typography.captionMedium, flex: 1 },
  dismissBtn: {
    paddingVertical: 14, borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  dismissText: { ...Typography.button, color: '#FFF' },
});
