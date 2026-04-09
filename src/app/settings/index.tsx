import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  SectionList,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { useAppStore } from '@/stores/useAppStore';
import { useLogisticsStore } from '@/stores/useLogisticsStore';
import { currentMockUser } from '@/services/mock/users';

// ── Row types ──────────────────────────────────────────────────────────────

type RowType = 'nav' | 'toggle' | 'danger' | 'info';

type SettingRow = {
  key: string;
  icon: keyof typeof Feather.glyphMap;
  iconColor?: string;
  label: string;
  type: RowType;
  value?: string;
  badge?: { text: string; color: string };
  toggleKey?: 'isDarkMode';
  onPress?: () => void;
};

type Section = {
  title: string;
  data: SettingRow[];
};

// ── Language picker ────────────────────────────────────────────────────────

function LanguageModal({
  visible,
  current,
  onSelect,
  onClose,
  theme,
}: {
  visible: boolean;
  current: string;
  onSelect: (lang: 'fr' | 'en') => void;
  onClose: () => void;
  theme: typeof Colors.light;
}) {
  if (!visible) return null;
  return (
    <View style={[lm.overlay]}>
      <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={onClose} />
      <View style={[lm.sheet, { backgroundColor: theme.surface }]}>
        <Text style={[lm.title, { color: theme.text }]}>Langue</Text>
        {[
          { code: 'fr', label: 'Français 🇫🇷' },
          { code: 'en', label: 'English 🇬🇧' },
        ].map((lang) => (
          <TouchableOpacity
            key={lang.code}
            style={[lm.option, { borderColor: theme.border }]}
            onPress={() => {
              onSelect(lang.code as 'fr' | 'en');
              onClose();
            }}
          >
            <Text style={[lm.optionText, { color: theme.text }]}>{lang.label}</Text>
            {current === lang.code && (
              <Feather name="check" size={16} color={theme.primary} />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const lm = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
    zIndex: 100,
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: Spacing.xl,
    paddingBottom: 48,
    gap: Spacing.sm,
  },
  title: { ...Typography.h3, marginBottom: Spacing.sm },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  optionText: { ...Typography.bodyMedium },
});

// ── Main screen ────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const user = currentMockUser;

  const { isDarkMode, language, setDarkMode, setLanguage } = useAppStore();
  const { transporterStatus, setTransporterStatus } = useLogisticsStore();
  const [langPickerVisible, setLangPickerVisible] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Se déconnecter',
      'Vous pourrez vous reconnecter à tout moment.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Se déconnecter',
          style: 'destructive',
          onPress: () => router.replace('/(auth)/login' as any),
        },
      ],
    );
  };

  const SECTIONS: Section[] = [
    {
      title: 'COMPTE',
      data: [
        {
          key: 'photo',
          icon: 'camera',
          label: 'Photo de profil',
          type: 'nav',
          onPress: () => router.push('/settings/profile-photo' as any),
        },
        {
          key: 'personal',
          icon: 'user',
          label: 'Informations personnelles',
          type: 'nav',
          value: `${user.firstName} ${user.lastName}`,
          onPress: () => router.push('/settings/personal-info' as any),
        },
        {
          key: 'addresses',
          icon: 'map-pin',
          label: 'Adresses de livraison',
          type: 'nav',
          onPress: () => router.push('/settings/addresses' as any),
        },
        {
          key: 'kyc',
          icon: 'shield',
          label: "Vérification d'identité",
          type: 'nav',
          badge: user.kycStatus === 'verified'
            ? { text: 'Vérifié', color: Colors.light.success }
            : { text: 'En attente', color: Colors.light.warning },
          onPress: () => router.push('/settings/kyc' as any),
        },
      ],
    },
    {
      title: 'PAIEMENT',
      data: [
        {
          key: 'cards',
          icon: 'credit-card',
          label: 'Moyens de paiement',
          type: 'nav',
          onPress: () => router.push('/settings/payment-methods' as any),
        },
        {
          key: 'wallet',
          icon: 'dollar-sign',
          iconColor: '#8B5CF6',
          label: 'Mon portefeuille',
          type: 'nav',
          onPress: () => router.push('/settings/wallet' as any),
        },
        {
          key: 'transactions',
          icon: 'list',
          label: 'Historique des transactions',
          type: 'nav',
          onPress: () => router.push('/settings/transactions' as any),
        },
      ],
    },
    {
      title: 'NOTIFICATIONS',
      data: [
        {
          key: 'notif_prefs',
          icon: 'bell',
          label: 'Préférences de notification',
          type: 'nav',
          onPress: () => router.push('/settings/notification-prefs' as any),
        },
      ],
    },
    {
      title: 'LIVRAISON',
      data: [
        {
          key: 'transporter_status',
          icon: transporterStatus === 'active' ? 'zap' : 'zap-off',
          iconColor: transporterStatus === 'active' ? Colors.light.success : undefined,
          label: 'Statut transporteur',
          type: 'nav',
          badge: transporterStatus === 'active'
            ? { text: 'Actif', color: Colors.light.success }
            : { text: 'Hors ligne', color: '#9CA3AF' },
          onPress: () => {
            if (transporterStatus === 'active') {
              Alert.alert(
                'Passer hors ligne ?',
                'Vous ne recevrez plus de propositions de mission.',
                [
                  { text: 'Annuler', style: 'cancel' },
                  { text: 'Confirmer', onPress: () => setTransporterStatus('offline') },
                ],
              );
            } else {
              setTransporterStatus('active');
            }
          },
        },
        {
          key: 'fav_hubs',
          icon: 'map-pin',
          label: 'Mes hubs favoris',
          type: 'nav',
          onPress: () => router.push('/settings/favorite-hubs' as any),
        },
        {
          key: 'fav_transporters',
          icon: 'star',
          iconColor: '#F59E0B',
          label: 'Mes transporteurs favoris',
          type: 'nav',
          onPress: () => router.push('/settings/favorite-transporters' as any),
        },
        {
          key: 'delivery_history',
          icon: 'clipboard',
          iconColor: '#F59E0B',
          label: 'Historique des livraisons',
          type: 'nav',
          onPress: () => router.push('/logistics/delivery-history' as any),
        },
        {
          key: 'h2h_prefs',
          icon: 'truck',
          label: 'Paramètres de livraison',
          type: 'nav',
        },
      ],
    },
    {
      title: 'APPLICATION',
      data: [
        {
          key: 'language',
          icon: 'globe',
          label: 'Langue',
          type: 'nav',
          value: language === 'fr' ? 'Français' : 'English',
          onPress: () => setLangPickerVisible(true),
        },
        {
          key: 'darkmode',
          icon: isDarkMode ? 'moon' : 'sun',
          label: 'Mode sombre',
          type: 'toggle',
          toggleKey: 'isDarkMode',
        },
        {
          key: 'about',
          icon: 'info',
          label: 'À propos',
          type: 'nav',
          value: '1.0.0',
          onPress: () => router.push('/settings/about' as any),
        },
        {
          key: 'help',
          icon: 'help-circle',
          label: 'Aide et support',
          type: 'nav',
          onPress: () => router.push('/settings/help' as any),
        },
        {
          key: 'tos',
          icon: 'file-text',
          label: "Conditions d'utilisation",
          type: 'nav',
          onPress: () => router.push('/settings/terms' as any),
        },
        {
          key: 'logout',
          icon: 'log-out',
          label: 'Se déconnecter',
          type: 'danger',
          onPress: handleLogout,
        },
      ],
    },
  ];

  const renderItem = ({ item, index, section }: { item: SettingRow; index: number; section: Section }) => {
    const isLast = index === section.data.length - 1;
    const iconColor = item.type === 'danger' ? theme.error : (item.iconColor ?? theme.primary);

    return (
      <TouchableOpacity
        style={[
          styles.row,
          { backgroundColor: theme.surface },
          !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border },
        ]}
        onPress={
          item.type === 'danger'
            ? handleLogout
            : item.type === 'toggle'
            ? undefined
            : item.onPress ?? (() => {})
        }
        activeOpacity={item.type === 'toggle' ? 1 : 0.65}
      >
        {/* Icon */}
        <View
          style={[
            styles.rowIcon,
            {
              backgroundColor:
                item.type === 'danger' ? `${theme.error}15` : `${iconColor}12`,
            },
          ]}
        >
          <Feather name={item.icon} size={18} color={iconColor} />
        </View>

        {/* Label */}
        <Text
          style={[
            styles.rowLabel,
            { color: item.type === 'danger' ? theme.error : theme.text },
          ]}
        >
          {item.label}
        </Text>

        {/* Right side */}
        {item.type === 'toggle' ? (
          <Switch
            value={item.toggleKey === 'isDarkMode' ? isDarkMode : false}
            onValueChange={(v) => {
              if (item.toggleKey === 'isDarkMode') setDarkMode(v);
            }}
            trackColor={{ false: theme.border, true: `${theme.primary}60` }}
            thumbColor={isDarkMode ? theme.primary : '#F3F4F6'}
          />
        ) : item.badge ? (
          <View
            style={[
              styles.badge,
              { backgroundColor: `${item.badge.color}18` },
            ]}
          >
            <Text style={[styles.badgeText, { color: item.badge.color }]}>
              {item.badge.text}
            </Text>
          </View>
        ) : item.value ? (
          <Text style={[styles.rowValue, { color: theme.textSecondary }]}>
            {item.value}
          </Text>
        ) : null}

        {item.type !== 'toggle' && item.type !== 'danger' && (
          <Feather name="chevron-right" size={16} color={theme.border} />
        )}
      </TouchableOpacity>
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
        <Text style={[styles.headerTitle, { color: theme.text }]}>Paramètres</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Profile mini card */}
      <TouchableOpacity
        style={[
          styles.profileCard,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
        onPress={() => router.push('/(tabs)/profile')}
        activeOpacity={0.8}
      >
        <View style={styles.profileAvatar}>
          <Text style={styles.profileAvatarText}>
            {user.firstName[0]}{user.lastName[0]}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.profileName, { color: theme.text }]}>
            {user.firstName} {user.lastName}
          </Text>
          <Text style={[styles.profileHandle, { color: theme.textSecondary }]}>
            @{user.username} · {user.location.city}
          </Text>
        </View>
        <Feather name="chevron-right" size={16} color={theme.border} />
      </TouchableOpacity>

      <SectionList
        sections={SECTIONS}
        keyExtractor={(item) => item.key}
        renderItem={renderItem}
        renderSectionHeader={({ section }) => (
          <Text style={[styles.sectionHeader, { color: theme.textSecondary }]}>
            {section.title}
          </Text>
        )}
        renderSectionFooter={() => <View style={{ height: Spacing.sm }} />}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
      />

      {/* Language picker overlay */}
      <LanguageModal
        visible={langPickerVisible}
        current={language}
        onSelect={setLanguage}
        onClose={() => setLangPickerVisible(false)}
        theme={theme}
      />
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

  // Profile mini card
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    margin: Spacing.lg,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  profileAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    color: '#FFF',
  },
  profileName: { ...Typography.bodyMedium, fontFamily: 'Poppins_600SemiBold' },
  profileHandle: { ...Typography.caption },

  // Section list
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 80,
  },
  sectionHeader: {
    ...Typography.captionMedium,
    letterSpacing: 1,
    paddingVertical: Spacing.sm,
    paddingTop: Spacing.lg,
  },

  // Row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.md,
    height: 52,
    overflow: 'hidden',
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: { ...Typography.bodyMedium, flex: 1 },
  rowValue: { ...Typography.caption },

  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  badgeText: { ...Typography.captionMedium },
});
