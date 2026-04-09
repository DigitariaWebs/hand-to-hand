import React, { useState } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing, BorderRadius } from '@/constants/Spacing';

const FAQ_ITEMS = [
  {
    question: "Comment fonctionne Hand to Hand Logistics ?",
    answer:
      "Hand to Hand est une plateforme de livraison collaborative. Les particuliers peuvent transporter des colis lors de leurs trajets quotidiens entre villes de la Côte d'Azur. Déposez votre colis dans un hub, un transporteur le récupère et le livre au hub de destination.",
  },
  {
    question: "Comment suivre ma livraison ?",
    answer:
      "Une fois votre colis confié à un transporteur, vous pouvez suivre sa progression en temps réel depuis l'onglet Livraisons. Vous recevrez des notifications à chaque étape : prise en charge, en transit et livré.",
  },
  {
    question: "Comment devenir transporteur ?",
    answer:
      "Pour devenir transporteur, activez le mode transporteur dans vos paramètres de livraison. Vous devrez compléter la vérification d'identité (KYC) et accepter les conditions générales du service de transport.",
  },
  {
    question: "Que faire en cas de litige ?",
    answer:
      "En cas de litige, contactez notre support via le bouton ci-dessous. Nous disposons d'un système de médiation et d'une assurance couvrant les colis jusqu'à 500 €. Chaque litige est traité sous 48 heures.",
  },
];

export default function HelpScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleExpand = (index: number) => {
    setExpandedIndex((prev) => (prev === index ? null : index));
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
          Aide et support
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* FAQ section */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Questions fréquentes
        </Text>

        <View style={[styles.faqCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {FAQ_ITEMS.map((item, index) => {
            const isExpanded = expandedIndex === index;
            return (
              <View
                key={index}
                style={[
                  styles.faqItem,
                  index < FAQ_ITEMS.length - 1 && {
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: theme.border,
                  },
                ]}
              >
                <TouchableOpacity
                  style={styles.faqQuestion}
                  onPress={() => toggleExpand(index)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.faqQuestionText, { color: theme.text }]}>
                    {item.question}
                  </Text>
                  <Feather
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={theme.textSecondary}
                  />
                </TouchableOpacity>
                {isExpanded && (
                  <Text style={[styles.faqAnswer, { color: theme.textSecondary }]}>
                    {item.answer}
                  </Text>
                )}
              </View>
            );
          })}
        </View>

        {/* Contact button */}
        <TouchableOpacity activeOpacity={0.8} style={styles.gradientBtnWrap}>
          <LinearGradient
            colors={[Colors.light.primary, Colors.light.primaryGradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientBtn}
          >
            <Feather name="message-circle" size={18} color="#FFFFFF" />
            <Text style={styles.gradientBtnText}>Contacter le support</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Contact info */}
        <Text style={[styles.contactEmail, { color: theme.textSecondary }]}>
          support@handtohand.fr
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

  sectionTitle: {
    ...Typography.h2,
  },

  faqCard: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  faqItem: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  faqQuestion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  faqQuestionText: {
    ...Typography.bodyMedium,
    flex: 1,
  },
  faqAnswer: {
    ...Typography.body,
    marginTop: Spacing.sm,
    lineHeight: 22,
  },

  gradientBtnWrap: {
    marginTop: Spacing.sm,
  },
  gradientBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  gradientBtnText: {
    ...Typography.button,
    color: '#FFFFFF',
  },

  contactEmail: {
    ...Typography.caption,
    textAlign: 'center',
  },
});
