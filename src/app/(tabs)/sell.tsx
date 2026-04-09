import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing, BorderRadius } from '@/constants/Spacing';

type SellOption = {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  subtitle: string;
  badge?: string;
};

const sellOptions: SellOption[] = [
  {
    icon: 'tag',
    title: 'Annonce classique',
    subtitle: 'Prix fixe · Vente directe',
    badge: 'Gratuit',
  },
  {
    icon: 'trending-up',
    title: 'Enchère',
    subtitle: 'Laissez les acheteurs surenchérir',
  },
  {
    icon: 'message-circle',
    title: 'Offre libre',
    subtitle: 'Acceptez ou négociez les offres',
  },
  {
    icon: 'zap',
    title: 'Vente flash',
    subtitle: 'Durée limitée · Prix réduit',
    badge: 'Nouveau',
  },
];

const SELL_ROUTES: Record<string, string> = {
  'Annonce classique': '/sell',
  'Enchère': '/sell',
  'Offre libre': '/sell',
  'Vente flash': '/sell',
};

export default function SellScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={[theme.primary, theme.primaryGradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <Text style={styles.headerTitle}>Vendre</Text>
        <Text style={styles.headerSubtitle}>Comment souhaitez-vous vendre ?</Text>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 100, gap: Spacing.md }}
        showsVerticalScrollIndicator={false}
      >
        {sellOptions.map((opt, index) => (
          <Animated.View
            key={opt.title}
            entering={FadeInDown.delay(index * 80).springify()}
          >
            <TouchableOpacity
              style={[styles.optionCard, { backgroundColor: theme.surface }]}
              activeOpacity={0.7}
              onPress={() => router.push(SELL_ROUTES[opt.title] as never)}
            >
              <View style={[styles.optionIcon, { backgroundColor: `${theme.primary}15` }]}>
                <Feather name={opt.icon} size={22} color={theme.primary} />
              </View>
              <View style={styles.optionContent}>
                <View style={styles.optionTitleRow}>
                  <Text style={[styles.optionTitle, { color: theme.text }]}>{opt.title}</Text>
                  {opt.badge && (
                    <View style={[styles.badge, { backgroundColor: theme.primary }]}>
                      <Text style={styles.badgeText}>{opt.badge}</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.optionSubtitle, { color: theme.textSecondary }]}>
                  {opt.subtitle}
                </Text>
              </View>
              <Feather name="chevron-right" size={18} color={theme.border} />
            </TouchableOpacity>
          </Animated.View>
        ))}

        {/* My listings */}
        <Animated.View entering={FadeInDown.delay(380).springify()}>
          <TouchableOpacity
            style={[styles.optionCard, { backgroundColor: theme.surface }]}
            activeOpacity={0.7}
            onPress={() => router.push('/sell/my-listings' as never)}
          >
            <View style={[styles.optionIcon, { backgroundColor: `${theme.primary}15` }]}>
              <Feather name="list" size={22} color={theme.primary} />
            </View>
            <View style={styles.optionContent}>
              <View style={styles.optionTitleRow}>
                <Text style={[styles.optionTitle, { color: theme.text }]}>Mes annonces</Text>
              </View>
              <Text style={[styles.optionSubtitle, { color: theme.textSecondary }]}>
                Gérer vos annonces · Stock · Stats
              </Text>
            </View>
            <Feather name="chevron-right" size={18} color={theme.border} />
          </TouchableOpacity>
        </Animated.View>

        {/* Logistics promo */}
        <Animated.View entering={FadeInDown.delay(400).springify()}>
          <TouchableOpacity
            style={[styles.logisticsCard, { borderColor: theme.primary }]}
            activeOpacity={0.8}
            onPress={() => router.push('/logistics' as never)}
          >
            <LinearGradient
              colors={[`${theme.primary}10`, `${theme.primaryGradientEnd}10`]}
              style={styles.logisticsGradient}
            >
              <Feather name="truck" size={24} color={theme.primary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.logisticsTitle, { color: theme.text }]}>
                  Proposer un trajet
                </Text>
                <Text style={[styles.logisticsSubtitle, { color: theme.textSecondary }]}>
                  Gagnez de l'argent en transportant des colis entre villes
                </Text>
              </View>
              <Feather name="arrow-right" size={18} color={theme.primary} />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  headerTitle: {
    ...Typography.h1,
    color: '#FFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    ...Typography.body,
    color: 'rgba(255,255,255,0.75)',
  },
  scroll: { flex: 1 },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionContent: { flex: 1, gap: 3 },
  optionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  optionTitle: {
    ...Typography.bodyMedium,
    fontFamily: 'Poppins_600SemiBold',
  },
  optionSubtitle: {
    ...Typography.caption,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    ...Typography.caption,
    color: '#FFF',
    fontSize: 9,
  },
  logisticsCard: {
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    overflow: 'hidden',
    marginTop: Spacing.sm,
  },
  logisticsGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
  },
  logisticsTitle: {
    ...Typography.bodyMedium,
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 2,
  },
  logisticsSubtitle: {
    ...Typography.caption,
    lineHeight: 16,
  },
});
