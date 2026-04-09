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

const SECTIONS = [
  {
    title: "1. Objet",
    body: "Les présentes conditions générales d'utilisation ont pour objet de définir les modalités d'accès et d'utilisation de la plateforme Hand to Hand. En utilisant l'application, vous acceptez sans réserve les présentes conditions. Hand to Hand est un service de livraison collaborative entre particuliers opérant sur la Côte d'Azur.",
  },
  {
    title: "2. Inscription et compte",
    body: "L'accès aux services de Hand to Hand nécessite la création d'un compte utilisateur. Vous vous engagez à fournir des informations exactes et à jour lors de votre inscription. Vous êtes responsable de la confidentialité de vos identifiants de connexion. Toute activité réalisée depuis votre compte est présumée effectuée par vous-même.",
  },
  {
    title: "3. Responsabilités",
    body: "Hand to Hand agit en tant qu'intermédiaire entre expéditeurs et transporteurs. La plateforme ne peut être tenue responsable des dommages causés aux colis pendant le transport, sauf en cas de faute prouvée. Chaque transporteur s'engage à manipuler les colis avec soin. Une assurance couvre les colis d'une valeur déclarée inférieure à 500 €.",
  },
  {
    title: "4. Protection des données",
    body: "Hand to Hand s'engage à protéger vos données personnelles conformément au Règlement Général sur la Protection des Données (RGPD). Vos données sont collectées uniquement dans le cadre de la fourniture du service et ne sont jamais cédées à des tiers à des fins commerciales. Vous disposez d'un droit d'accès, de rectification et de suppression de vos données.",
  },
];

export default function TermsScreen() {
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
          {"Conditions d'utilisation"}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              {section.title}
            </Text>
            <Text style={[styles.sectionBody, { color: theme.textSecondary }]}>
              {section.body}
            </Text>
          </View>
        ))}

        <Text style={[styles.lastUpdated, { color: theme.textSecondary }]}>
          {"Dernière mise à jour : 1er janvier 2026"}
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
    gap: Spacing.xxl,
    paddingBottom: 100,
  },

  section: {
    gap: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.h3,
  },
  sectionBody: {
    ...Typography.body,
    lineHeight: 22,
  },

  lastUpdated: {
    ...Typography.caption,
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
});
