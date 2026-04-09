import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing, BorderRadius } from '@/constants/Spacing';

// ── Types ──────────────────────────────────────────────────────────────────

type EmptyStateProps = {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
  iconColor?: string;
  compact?: boolean;
};

// ── Pre-built configs ──────────────────────────────────────────────────────

export const EMPTY_STATES = {
  no_products: {
    icon: 'package' as const,
    title: 'Rien ici pour le moment',
    subtitle: 'C\'est le moment idéal pour publier votre première annonce.',
    actionLabel: 'Vendre un article',
  },
  no_messages: {
    icon: 'message-circle' as const,
    title: 'Pas encore de messages',
    subtitle: 'Vos conversations avec vendeurs et acheteurs apparaîtront ici.',
  },
  no_notifications: {
    icon: 'bell-off' as const,
    title: 'Tout est calme',
    subtitle: 'Aucune notification pour le moment, profitez-en !',
  },
  no_results: {
    icon: 'search' as const,
    title: 'Aucun résultat trouvé',
    subtitle: 'Essayez d\'autres mots-clés, on cherche avec vous.',
  },
  no_transporters: {
    icon: 'truck' as const,
    title: 'Pas encore de transporteur',
    subtitle: 'Aucun transporteur ne couvre ce trajet pour l\'instant. Un léger décalage peut arriver, merci pour votre patience.',
    actionLabel: 'Réessayer',
  },
  no_orders: {
    icon: 'shopping-bag' as const,
    title: 'Pas encore de commande',
    subtitle: 'Vos achats et ventes apparaîtront ici dès votre première transaction.',
    actionLabel: 'Découvrir des produits',
  },
  no_favorites: {
    icon: 'heart' as const,
    title: 'Aucun favori pour l\'instant',
    subtitle: 'Sauvegardez vos coups de cœur pour les retrouver facilement.',
    actionLabel: 'Explorer',
  },
  offline: {
    icon: 'wifi-off' as const,
    title: 'Connexion perdue',
    subtitle: 'Pas de souci, vérifiez votre connexion et réessayez tranquillement.',
    actionLabel: 'Réessayer',
  },
  no_bids: {
    icon: 'clock' as const,
    title: 'Aucune enchère pour le moment',
    subtitle: 'Soyez le premier à tenter votre chance sur ce produit.',
  },
  auction_ended: {
    icon: 'flag' as const,
    title: 'Enchère terminée',
    subtitle: 'Cette enchère est désormais clôturée. Merci pour votre participation !',
  },
} satisfies Record<string, Omit<EmptyStateProps, 'onAction'>>;

// ── Component ──────────────────────────────────────────────────────────────

export function EmptyState({
  icon,
  title,
  subtitle,
  actionLabel,
  onAction,
  iconColor,
  compact = false,
}: EmptyStateProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;

  const effectiveIconColor = iconColor ?? theme.border;

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      {/* Icon circle */}
      <View
        style={[
          styles.iconCircle,
          { backgroundColor: `${effectiveIconColor}18` },
        ]}
      >
        <Feather name={icon} size={compact ? 28 : 36} color={effectiveIconColor} />
      </View>

      {/* Text */}
      <Text style={[styles.title, { color: theme.text }, compact && styles.titleCompact]}>
        {title}
      </Text>
      <Text
        style={[
          styles.subtitle,
          { color: theme.textSecondary },
          compact && styles.subtitleCompact,
        ]}
      >
        {subtitle}
      </Text>

      {/* Optional action button */}
      {actionLabel && onAction && (
        <TouchableOpacity
          style={[styles.actionBtn, { borderColor: theme.primary }]}
          onPress={onAction}
          activeOpacity={0.75}
        >
          <Text style={[styles.actionText, { color: theme.primary }]}>
            {actionLabel}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: Spacing.xxxl,
    gap: Spacing.md,
  },
  containerCompact: {
    paddingVertical: Spacing.xxl,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  title: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
  },
  titleCompact: {
    fontSize: 14,
    lineHeight: 20,
  },
  subtitle: {
    ...Typography.body,
    textAlign: 'center',
    lineHeight: 21,
    maxWidth: 260,
  },
  subtitleCompact: {
    fontSize: 12,
    lineHeight: 17,
  },
  actionBtn: {
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical: 10,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
  },
  actionText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    lineHeight: 18,
  },
});
