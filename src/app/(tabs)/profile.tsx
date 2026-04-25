import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  FlatList,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  FadeIn,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { formatPrice, formatDate, getConditionLabel } from '@/utils';
import { currentMockUser } from '@/services/mock/users';
import { mockProducts } from '@/services/mock/products';
import { StatusToggle } from '@/components/logistics/StatusToggle';
import { useWalletStore } from '@/stores/useWalletStore';

const { width: SW } = Dimensions.get('window');
const TABS = ['En vente', 'Vendus', 'Favoris', 'Avis'] as const;
const TAB_W = SW / TABS.length;

// ── Mock reviews ────────────────────────────────────────────────────────────

const MOCK_REVIEWS = [
  {
    id: 'rv1',
    author: 'karim_b',
    avatar: 'https://i.pravatar.cc/150?img=3',
    rating: 5,
    comment: 'Excellent vendeur ! Produit exactement conforme à la description, livraison ultra rapide via Hand to Hand.',
    date: '2024-03-15',
  },
  {
    id: 'rv2',
    author: 'amelie_d',
    avatar: 'https://i.pravatar.cc/150?img=5',
    rating: 5,
    comment: 'Très bonne transaction. Article bien emballé et sophie_m est très réactive.',
    date: '2024-03-10',
  },
  {
    id: 'rv3',
    author: 'marc_l',
    avatar: 'https://i.pravatar.cc/150?img=8',
    rating: 4,
    comment: 'Bonne expérience globale. Petite attente pour la remise mais tout s\'est bien passé.',
    date: '2024-02-28',
  },
  {
    id: 'rv4',
    author: 'fatima_o',
    avatar: 'https://i.pravatar.cc/150?img=9',
    rating: 5,
    comment: 'Super vendeuse, je recommande ! La veste était comme neuve, très satisfaite.',
    date: '2024-02-20',
  },
  {
    id: 'rv5',
    author: 'karim_b',
    avatar: 'https://i.pravatar.cc/150?img=3',
    rating: 5,
    comment: '5 étoiles sans hésiter. Deuxième achat chez sophie_m et toujours aussi bien !',
    date: '2024-02-05',
  },
  {
    id: 'rv6',
    author: 'amelie_d',
    avatar: 'https://i.pravatar.cc/150?img=5',
    rating: 4,
    comment: 'Article conforme, livraison correcte. Je reviendrai acheter.',
    date: '2024-01-18',
  },
  {
    id: 'rv7',
    author: 'fatima_o',
    avatar: 'https://i.pravatar.cc/150?img=9',
    rating: 5,
    comment: 'Professionnelle et honnête. Le colis est arrivé en parfait état via le hub de Nice.',
    date: '2024-01-07',
  },
  {
    id: 'rv8',
    author: 'marc_l',
    avatar: 'https://i.pravatar.cc/150?img=8',
    rating: 3,
    comment: 'Transaction correcte mais délai un peu plus long que prévu. Dans l\'ensemble ok.',
    date: '2023-12-22',
  },
  {
    id: 'rv9',
    author: 'karim_b',
    avatar: 'https://i.pravatar.cc/150?img=3',
    rating: 5,
    comment: 'Toujours au top ! C\'est ma référence pour la mode vintage sur Hand to Hand.',
    date: '2023-12-10',
  },
  {
    id: 'rv10',
    author: 'fatima_o',
    avatar: 'https://i.pravatar.cc/150?img=9',
    rating: 5,
    comment: 'Vendeuse sérieuse, je recommande à 100%. Très belle pièce reçue.',
    date: '2023-11-30',
  },
];

// ── Quick actions config ──────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { icon: 'package', label: 'Mes commandes', route: '/order/ord-001', color: '#3B82F6' },
  { icon: 'truck', label: 'Mes livraisons', route: '/logistics/delivery-tracking', color: '#10B981' },
  { icon: 'dollar-sign', label: 'Mon portefeuille', route: '/settings/wallet', color: '#8B5CF6' },
  { icon: 'star', label: 'Transporteurs favoris', route: '/settings/favorite-transporters', color: '#F59E0B' },
  { icon: 'bar-chart-2', label: 'Statistiques', route: '/stats', color: '#6B7280' },
] as const;

// ── Stars component ────────────────────────────────────────────────────────

function Stars({ rating, size = 12 }: { rating: number; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 1 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Feather
          key={s}
          name="star"
          size={size}
          color={s <= rating ? '#F59E0B' : '#D1D5DB'}
        />
      ))}
    </View>
  );
}

// ── Product grid item ─────────────────────────────────────────────────────

function GridItem({
  product,
  overlay,
  theme,
  onPress,
}: {
  product: (typeof mockProducts)[0];
  overlay?: string;
  theme: typeof Colors.light;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.gridItem, { backgroundColor: theme.surface }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.gridImageWrap}>
        <Image
          source={{ uri: product.images[0]?.url ?? product.images[0]?.thumbnail }}
          style={styles.gridImage}
          contentFit="cover"
        />
        {overlay && (
          <View style={styles.gridOverlay}>
            <Text style={styles.gridOverlayText}>{overlay}</Text>
          </View>
        )}
        {product.stock > 1 && !overlay && (
          <View style={[styles.stockBadge, { backgroundColor: theme.primary }]}>
            <Text style={styles.stockBadgeText}>{product.stock}</Text>
          </View>
        )}
      </View>
      <View style={styles.gridInfo}>
        <Text style={[styles.gridTitle, { color: theme.text }]} numberOfLines={1}>
          {product.title}
        </Text>
        <Text style={[styles.gridPrice, { color: theme.primary }]}>
          {formatPrice(product.price)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// ── Review card ────────────────────────────────────────────────────────────

function ReviewCard({
  review,
  theme,
}: {
  review: (typeof MOCK_REVIEWS)[0];
  theme: typeof Colors.light;
}) {
  return (
    <View style={[styles.reviewCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.reviewHeader}>
        <Image source={{ uri: review.avatar }} style={styles.reviewAvatar} contentFit="cover" />
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={[styles.reviewAuthor, { color: theme.text }]}>{review.author}</Text>
          <Stars rating={review.rating} />
        </View>
        <Text style={[styles.reviewDate, { color: theme.textSecondary }]}>
          {formatDate(review.date, 'DD MMM YYYY')}
        </Text>
      </View>
      <Text style={[styles.reviewComment, { color: theme.textSecondary }]} numberOfLines={3}>
        {review.comment}
      </Text>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const user = currentMockUser;
  const walletBalance = useWalletStore((s) => s.balance);

  const [activeTab, setActiveTab] = useState(0);
  const underlineX = useSharedValue(0);
  const underlineStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: underlineX.value }],
  }));

  const handleTabChange = (index: number) => {
    setActiveTab(index);
    underlineX.value = withTiming(index * TAB_W, { duration: 200 });
  };

  // Product sets per tab
  const activeProd = mockProducts.filter((p) => p.status === 'active').slice(0, 8);
  const soldProd = mockProducts.filter((p) => p.status !== 'active').slice(0, 6).concat(mockProducts.slice(0, 3));
  const favProd = mockProducts.slice(2, 10);

  // Build grid rows (pairs)
  function gridRows<T>(items: T[]) {
    const rows: T[][] = [];
    for (let i = 0; i < items.length; i += 2) {
      rows.push(items.slice(i, i + 2));
    }
    return rows;
  }

  const renderTabContent = () => {
    if (activeTab === 3) {
      // Reviews
      return MOCK_REVIEWS.map((r) => (
        <ReviewCard key={r.id} review={r} theme={theme} />
      ));
    }

    const products = activeTab === 0 ? activeProd : activeTab === 1 ? soldProd : favProd;
    const overlay = activeTab === 1 ? 'Vendu' : undefined;
    const rows = gridRows(products);

    return rows.map((row, i) => (
      <View key={i} style={styles.gridRow}>
        {row.map((product) => (
          <GridItem
            key={product.id}
            product={product}
            overlay={overlay}
            theme={theme}
            onPress={() => router.push(`/product/${product.id}`)}
          />
        ))}
        {row.length === 1 && <View style={{ flex: 1 }} />}
      </View>
    ));
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style="light" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* ── Cover + Avatar ─────────────────────────────────────────── */}
        <LinearGradient
          colors={[theme.primary, theme.primaryGradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.cover, { paddingTop: insets.top + 20 }]}
        >
          {/* Settings shortcut */}
          <TouchableOpacity
            style={[styles.settingsBtn, { top: insets.top + 10 }]}
            onPress={() => router.push('/settings')}
          >
            <Feather name="settings" size={18} color="rgba(255,255,255,0.85)" />
          </TouchableOpacity>
        </LinearGradient>

        {/* ── Profile info ──────────────────────────────────────────── */}
        <View style={[styles.infoSection, { backgroundColor: theme.surface }]}>
          {/* Avatar row */}
          <View style={styles.avatarRow}>
            <View style={styles.avatarWrapper}>
              <Image
                source={{ uri: user.avatar }}
                style={styles.avatar}
                contentFit="cover"
              />
              {user.isVerified && (
                <View style={[styles.verifiedDot, { backgroundColor: theme.success }]}>
                  <Feather name="check" size={10} color="#FFF" />
                </View>
              )}
            </View>
          </View>

          <View style={styles.nameSection}>
            {/* Name */}
            <Text style={[styles.name, { color: theme.text }]}>
              {user.firstName} {user.lastName}
            </Text>
            <Text style={[styles.username, { color: theme.textSecondary }]}>
              @{user.username}
            </Text>

            {/* Badges row */}
            <View style={styles.badgesRow}>
              {user.isVerified && (
                <View style={[styles.badge, { backgroundColor: `${theme.success}15` }]}>
                  <Feather name="check-circle" size={11} color={theme.success} />
                  <Text style={[styles.badgeText, { color: theme.success }]}>Vérifié</Text>
                </View>
              )}
              <View style={[styles.badge, { backgroundColor: '#FEF3C715' }]}>
                <Feather name="star" size={11} color="#F59E0B" />
                <Text style={[styles.badgeText, { color: '#92400E' }]}>
                  {user.rating.toFixed(1)}
                </Text>
              </View>
              <View style={[styles.badge, { backgroundColor: `${theme.primary}12` }]}>
                <Feather name="package" size={11} color={theme.primary} />
                <Text style={[styles.badgeText, { color: theme.primary }]}>
                  {user.totalSales} ventes
                </Text>
              </View>
              <View style={[styles.badge, { backgroundColor: `${theme.border}` }]}>
                <Feather name="map-pin" size={11} color={theme.textSecondary} />
                <Text style={[styles.badgeText, { color: theme.textSecondary }]}>
                  {user.location.city}
                </Text>
              </View>
            </View>

            {/* Bio */}
            {user.bio && (
              <Text
                style={[styles.bio, { color: theme.textSecondary }]}
                numberOfLines={2}
              >
                {user.bio}
              </Text>
            )}

            {/* Edit profile button */}
            <TouchableOpacity
              style={[styles.editBtn, { borderColor: theme.primary }]}
              onPress={() => router.push('/settings')}
            >
              <Feather name="edit-2" size={14} color={theme.primary} />
              <Text style={[styles.editBtnText, { color: theme.primary }]}>
                Modifier le profil
              </Text>
            </TouchableOpacity>
          </View>

          {/* Become transporter CTA */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push('/become-transporter' as any)}
            style={styles.becomeTransporterPressable}
          >
            <LinearGradient
              colors={[theme.primaryLight, theme.accentLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.becomeTransporterCard}
            >
              <View style={[styles.becomeTransporterIconWrap, { backgroundColor: theme.surface }]}>
                <Feather name="truck" size={24} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.becomeTransporterTitle, { color: theme.text }]}>
                  Générer des revenus sur votre trajet quotidien
                </Text>
                <Text style={[styles.becomeTransporterSub, { color: theme.textSecondary }]}>
                  Livrez des colis en chemin avec H2H Logistic
                </Text>
                <Text style={[styles.becomeTransporterLink, { color: theme.primary }]}>
                  En savoir plus →
                </Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Stats strip */}
          <View style={[styles.statsStrip, { borderColor: theme.border }]}>
            {[
              { value: user.totalSales, label: 'Ventes' },
              { value: user.totalPurchases, label: 'Achats' },
              { value: user.reviewCount, label: 'Avis' },
            ].map((stat, i, arr) => (
              <React.Fragment key={stat.label}>
                <View style={styles.stat}>
                  <Text style={[styles.statValue, { color: theme.text }]}>
                    {stat.value}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                    {stat.label}
                  </Text>
                </View>
                {i < arr.length - 1 && (
                  <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
                )}
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* ── Tabs ──────────────────────────────────────────────────── */}
        <View style={[styles.tabsContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.tabsRow}>
            {TABS.map((tab, index) => (
              <TouchableOpacity
                key={tab}
                style={styles.tabBtn}
                onPress={() => handleTabChange(index)}
              >
                <Text
                  style={[
                    styles.tabLabel,
                    {
                      color: activeTab === index ? theme.primary : theme.textSecondary,
                      fontFamily: activeTab === index ? 'Poppins_600SemiBold' : 'Poppins_400Regular',
                    },
                  ]}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {/* Animated underline */}
          <View style={[styles.underlineTrack, { backgroundColor: theme.border }]}>
            <Animated.View
              style={[
                styles.underline,
                { backgroundColor: theme.primary, width: TAB_W },
                underlineStyle,
              ]}
            />
          </View>
        </View>

        {/* ── Tab content ───────────────────────────────────────────── */}
        <Animated.View
          key={activeTab}
          entering={FadeIn.duration(200)}
          style={styles.tabContent}
        >
          {renderTabContent()}
        </Animated.View>

        {/* ── Transporter status ─────────────────────────────────────── */}
        <View style={styles.quickActionsSection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Statut transporteur</Text>
          <StatusToggle />
        </View>

        {/* ── Quick actions 2×2 grid ────────────────────────────────── */}
        <View style={styles.quickActionsSection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Accès rapide</Text>
          <View style={styles.quickActionsGrid}>
            {QUICK_ACTIONS.map((action) => {
              const isWallet = action.label === 'Mon portefeuille';
              return (
                <TouchableOpacity
                  key={action.label}
                  style={[
                    styles.quickActionCard,
                    { backgroundColor: theme.surface, shadowColor: theme.text },
                  ]}
                  onPress={() => router.push(action.route as any)}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.quickActionIcon,
                      { backgroundColor: `${action.color}15` },
                    ]}
                  >
                    <Feather name={action.icon as any} size={22} color={action.color} />
                  </View>
                  <View style={{ width: '100%', gap: 2 }}>
                    <Text style={[styles.quickActionLabel, { color: theme.text }]} numberOfLines={2}>
                      {action.label}
                    </Text>
                    {isWallet && (
                      <Text style={styles.walletBalanceText}>
                        {walletBalance.toFixed(2).replace('.', ',')} €
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Cover
  cover: {
    height: 130,
    position: 'relative',
  },
  settingsBtn: {
    position: 'absolute',
    right: Spacing.lg,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Info section
  infoSection: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },

  // Avatar
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: -40,
    marginBottom: Spacing.sm,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    backgroundColor: '#E5E7EB',
  },
  verifiedDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.light.success,
    borderWidth: 2,
    borderColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Name / bio
  nameSection: { gap: Spacing.sm },
  name: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 18,
    lineHeight: 26,
  },
  username: { ...Typography.body },

  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  badgeText: { ...Typography.captionMedium },

  bio: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    lineHeight: 19,
  },

  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    height: 36,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
  },
  editBtnText: { ...Typography.button, fontSize: 13 },

  // Become transporter CTA
  becomeTransporterPressable: {
    marginTop: Spacing.md,
  },
  becomeTransporterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: 16,
  },
  becomeTransporterIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  becomeTransporterTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    lineHeight: 19,
  },
  becomeTransporterSub: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  becomeTransporterLink: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    lineHeight: 16,
    marginTop: 4,
  },

  // Stats strip
  statsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: Spacing.md,
    marginTop: Spacing.sm,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  stat: { alignItems: 'center', gap: 2 },
  statValue: { ...Typography.h3 },
  statLabel: { ...Typography.captionMedium },
  statDivider: { width: 1, height: 32 },

  // Tabs
  tabsContainer: {
    borderBottomWidth: 1,
    marginTop: Spacing.md,
  },
  tabsRow: { flexDirection: 'row' },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  tabLabel: {
    fontSize: 13,
    lineHeight: 18,
  },
  underlineTrack: {
    height: 2,
    position: 'relative',
  },
  underline: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 2,
    borderRadius: 1,
  },

  // Tab content
  tabContent: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  gridRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  gridItem: {
    flex: 1,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
    elevation: 1,
  },
  gridImageWrap: {
    aspectRatio: 1,
    backgroundColor: '#F3F4F6',
    position: 'relative',
  },
  gridImage: { width: '100%', height: '100%' },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridOverlayText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
    color: '#FFF',
    letterSpacing: 1,
  },
  stockBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  stockBadgeText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 10,
    color: '#FFF',
    lineHeight: 13,
  },
  gridInfo: { padding: 7, gap: 2 },
  gridTitle: { ...Typography.caption, fontFamily: 'Poppins_500Medium' },
  gridPrice: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, lineHeight: 18 },

  // Reviews
  reviewCard: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  reviewAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E5E7EB',
  },
  reviewAuthor: { ...Typography.captionMedium, fontFamily: 'Poppins_600SemiBold' },
  reviewDate: { ...Typography.caption },
  reviewComment: { ...Typography.caption, lineHeight: 17 },

  // Quick actions
  quickActionsSection: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  sectionTitle: { ...Typography.h3 },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  quickActionCard: {
    width: (SW - Spacing.lg * 2 - Spacing.md) / 2,
    height: 116,
    borderRadius: 16,
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: Spacing.md,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: {
    ...Typography.captionMedium,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    lineHeight: 18,
  },
  walletBalanceText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
    color: Colors.light.primary,
  },
});
