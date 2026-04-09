import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import {
  mockLiveSessions,
  type LiveSession,
} from '@/services/mock/live';

const { width: SW } = Dimensions.get('window');
const CARD_W = SW - Spacing.lg * 2;

// ── Helpers ────────────────────────────────────────────────────────────────

function formatScheduled(iso: string): string {
  const date = new Date(iso);
  const now = Date.now();
  const diff = date.getTime() - now;
  const hours = Math.floor(diff / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return `Dans ${days} jour${days > 1 ? 's' : ''}`;
  }
  if (hours > 0) return `Dans ${hours}h${minutes > 0 ? ` ${minutes}m` : ''}`;
  if (minutes > 0) return `Dans ${minutes} min`;
  return 'Bientôt';
}

// ── Live session card ──────────────────────────────────────────────────────

function LiveCard({
  session,
  onPress,
  theme,
}: {
  session: LiveSession;
  onPress: () => void;
  theme: typeof Colors.light;
}) {
  const isLive = session.status === 'live';

  return (
    <TouchableOpacity
      style={[styles.card, { borderColor: theme.border }]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      {/* Thumbnail */}
      <View style={styles.thumb}>
        <Image
          source={{ uri: session.thumbnail }}
          style={StyleSheet.absoluteFillObject}
          contentFit="cover"
          transition={{ effect: 'cross-dissolve', duration: 250 }}
        />

        {/* Gradient overlay */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.6)']}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Status badge */}
        {isLive ? (
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveBadgeText}>EN DIRECT</Text>
          </View>
        ) : (
          <View style={[styles.upcomingBadge, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
            <Feather name="clock" size={10} color="#FFF" />
            <Text style={styles.upcomingText}>
              {session.scheduledAt ? formatScheduled(session.scheduledAt) : 'Prochainement'}
            </Text>
          </View>
        )}

        {/* Viewer count (live only) */}
        {isLive && (
          <View style={styles.viewerBadge}>
            <Feather name="eye" size={11} color="#FFF" />
            <Text style={styles.viewerText}>{session.viewerCount}</Text>
          </View>
        )}

        {/* Bottom bar within thumb */}
        <View style={styles.thumbBottom}>
          <Image
            source={{ uri: session.hostAvatar }}
            style={styles.hostAvatar}
          />
          <Text style={styles.hostName} numberOfLines={1}>
            {session.hostName}
          </Text>
        </View>
      </View>

      {/* Info row */}
      <View style={[styles.info, { backgroundColor: theme.surface }]}>
        <View style={{ flex: 1 }}>
          <Text
            style={[styles.sessionTitle, { color: theme.text }]}
            numberOfLines={2}
          >
            {session.title}
          </Text>
          <View style={styles.metaRow}>
            <Feather name="package" size={12} color={theme.textSecondary} />
            <Text style={[styles.metaText, { color: theme.textSecondary }]}>
              {session.productCount} produits
            </Text>
            {isLive && (
              <>
                <Text style={[styles.metaDot, { color: theme.border }]}>·</Text>
                <Feather name="eye" size={12} color={theme.textSecondary} />
                <Text style={[styles.metaText, { color: theme.textSecondary }]}>
                  {session.viewerCount} spectateurs
                </Text>
              </>
            )}
          </View>
        </View>

        {isLive ? (
          <TouchableOpacity
            style={[styles.joinBtn, { backgroundColor: '#EF4444' }]}
            onPress={onPress}
            activeOpacity={0.85}
          >
            <Text style={styles.joinBtnText}>Rejoindre</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.remindBtn,
              { borderColor: theme.primary },
            ]}
            activeOpacity={0.85}
          >
            <Feather name="bell" size={13} color={theme.primary} />
            <Text style={[styles.remindBtnText, { color: theme.primary }]}>
              Rappel
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────

export default function LiveListScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const liveSessions = mockLiveSessions.filter((s) => s.status === 'live');
  const upcomingSessions = mockLiveSessions.filter((s) => s.status === 'upcoming');

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
          Live Shopping
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 32 },
        ]}
      >
        {/* Live now */}
        {liveSessions.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionDot} />
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                En direct maintenant
              </Text>
              <View style={[styles.livePill, { backgroundColor: '#EF4444' }]}>
                <Text style={styles.livePillText}>{liveSessions.length}</Text>
              </View>
            </View>

            {liveSessions.map((session) => (
              <LiveCard
                key={session.id}
                session={session}
                onPress={() => router.push(`/live/${session.id}` as any)}
                theme={theme}
              />
            ))}
          </>
        )}

        {/* Upcoming */}
        {upcomingSessions.length > 0 && (
          <>
            <View style={[styles.sectionHeader, { marginTop: Spacing.lg }]}>
              <Feather name="clock" size={16} color={theme.primary} />
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                À venir
              </Text>
            </View>

            {upcomingSessions.map((session) => (
              <LiveCard
                key={session.id}
                session={session}
                onPress={() => {}}
                theme={theme}
              />
            ))}
          </>
        )}

        {/* Empty state */}
        {mockLiveSessions.length === 0 && (
          <View style={styles.emptyState}>
            <Feather name="video-off" size={48} color={theme.border} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              Aucun live en cours
            </Text>
            <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
              Revenez plus tard pour découvrir les prochaines sessions.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
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

  scrollContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  sectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  sectionTitle: { ...Typography.h3 },
  livePill: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  livePillText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 10,
    color: '#FFF',
    lineHeight: 13,
  },

  // Card
  card: {
    width: CARD_W,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
  },
  thumb: {
    width: CARD_W,
    height: CARD_W * 0.5625, // 16:9
    backgroundColor: '#333',
    position: 'relative',
  },
  liveBadge: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFF',
  },
  liveBadgeText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 10,
    color: '#FFF',
    letterSpacing: 0.5,
    lineHeight: 13,
  },
  upcomingBadge: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  upcomingText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 10,
    color: '#FFF',
    lineHeight: 13,
  },
  viewerBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  viewerText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 11,
    color: '#FFF',
    lineHeight: 15,
  },
  thumbBottom: {
    position: 'absolute',
    bottom: Spacing.sm,
    left: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  hostAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: '#FFF',
    backgroundColor: '#444',
  },
  hostName: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: '#FFF',
    lineHeight: 16,
  },

  // Info row
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
  },
  sessionTitle: {
    ...Typography.bodyMedium,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  metaText: { ...Typography.caption },
  metaDot: { ...Typography.caption },

  joinBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    flexShrink: 0,
  },
  joinBtnText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: '#FFF',
    lineHeight: 16,
  },
  remindBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    flexShrink: 0,
  },
  remindBtnText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    lineHeight: 16,
  },

  // Empty
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: Spacing.md,
  },
  emptyTitle: { ...Typography.h3 },
  emptySub: { ...Typography.body, textAlign: 'center', maxWidth: 240 },
});
