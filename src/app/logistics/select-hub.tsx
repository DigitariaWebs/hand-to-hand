import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  SectionList,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useQuery } from '@tanstack/react-query';
import { Colors, ThemeColors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { HubsAPI } from '@/services/api';
import { Hub, HubType } from '@/types/logistics';
import { useLogisticsStore } from '@/stores/useLogisticsStore';

// ── Constants ─────────────────────────────────────────────────────────────

const HUB_TYPE_META: Record<HubType, { emoji: string; label: string }> = {
  train: { emoji: '🚂', label: 'Gare' },
  bus: { emoji: '🚌', label: 'Gare routière' },
  highway: { emoji: '🛣️', label: 'Sortie autoroute' },
  mall: { emoji: '🛒', label: 'Centre commercial' },
  ecommerce: { emoji: '🏪', label: 'E-commerce partenaire' },
};

const PRIORITY_COLORS: Record<string, string> = {
  normal: '#10B981',
  high: '#F59E0B',
  urgent: '#EF4444',
};

// ── Screen ────────────────────────────────────────────────────────────────

export default function SelectHubScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{
    mode?: string;
    cityFilter?: string;
    maxSelections?: string;
    showEcommerce?: string;
  }>();

  const mode = (params.mode ?? 'single') as 'single' | 'multi';
  const cityFilter = params.cityFilter ?? '';
  const maxSelections = parseInt(params.maxSelections ?? '3', 10);
  const showEcommerce = params.showEcommerce === 'true';

  const { draft, updateDraft } = useLogisticsStore();

  // Selection state for multi mode
  const [selected, setSelected] = useState<string[]>(
    mode === 'multi' ? draft.deliveryHubIds : draft.departureHubId ? [draft.departureHubId] : [],
  );

  const { data: allHubs } = useQuery({
    queryKey: ['hubs'],
    queryFn: () => HubsAPI.list(),
  });

  // Filter hubs: apply city filter, hide ecommerce for non-transporter views
  const filteredHubs = useMemo(() => {
    if (!allHubs) return [];
    return allHubs.filter((h) => {
      if (h.status !== 'active') return false;
      if (cityFilter && h.city !== cityFilter) return false;
      if (h.hubType === 'ecommerce' && !showEcommerce) return false;
      return true;
    });
  }, [allHubs, cityFilter, showEcommerce]);

  // Group by city for section list
  const sections = useMemo(() => {
    const map = new Map<string, Hub[]>();
    for (const hub of filteredHubs) {
      const list = map.get(hub.city) ?? [];
      list.push(hub);
      map.set(hub.city, list);
    }
    return Array.from(map.entries()).map(([city, data]) => ({ title: city, data }));
  }, [filteredHubs]);

  const toggle = useCallback(
    (hubId: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

      if (mode === 'single') {
        setSelected([hubId]);
        updateDraft({ departureHubId: hubId });
        router.back();
        return;
      }

      // Multi mode
      setSelected((prev) => {
        if (prev.includes(hubId)) {
          return prev.filter((id) => id !== hubId);
        }
        if (prev.length >= maxSelections) return prev;
        return [...prev, hubId];
      });
    },
    [mode, maxSelections, updateDraft, router],
  );

  const handleConfirm = useCallback(() => {
    updateDraft({ deliveryHubIds: selected });
    router.back();
  }, [selected, updateDraft, router]);

  const loadPercent = (hub: Hub) => Math.round((hub.currentLoad / hub.capacity) * 100);

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
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>
            {mode === 'multi' ? 'Choisir des hubs' : 'Choisir un hub'}
          </Text>
          {cityFilter !== '' && (
            <Text style={styles.headerSub}>{cityFilter}</Text>
          )}
        </View>
        {mode === 'multi' && (
          <View style={styles.counterBadge}>
            <Text style={styles.counterText}>
              {selected.length}/{maxSelections}
            </Text>
          </View>
        )}
      </LinearGradient>

      {/* Hub list */}
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={{
          padding: Spacing.lg,
          paddingBottom: mode === 'multi' ? 120 : 100,
        }}
        renderSectionHeader={({ section }) =>
          sections.length > 1 ? (
            <Text style={[styles.sectionHeader, { color: theme.textSecondary }]}>
              {section.title}
            </Text>
          ) : null
        }
        renderItem={({ item, index }) => {
          const isSelected = selected.includes(item.id);
          const isDimmed =
            mode === 'multi' && !isSelected && selected.length >= maxSelections;
          const typeMeta = HUB_TYPE_META[item.hubType];

          return (
            <Animated.View
              entering={FadeInDown.delay(index * 50).springify()}
              style={{ marginBottom: Spacing.md }}
            >
              <TouchableOpacity
                style={[
                  styles.hubCard,
                  {
                    backgroundColor: isSelected
                      ? `${theme.primary}08`
                      : theme.surface,
                    borderColor: isSelected ? theme.primary : theme.border,
                    opacity: isDimmed ? 0.45 : 1,
                  },
                ]}
                activeOpacity={0.75}
                onPress={() => toggle(item.id)}
                disabled={isDimmed}
              >
                {/* Photo */}
                {item.photos[0] && (
                  <Image
                    source={{ uri: item.photos[0] }}
                    style={styles.hubPhoto}
                    contentFit="cover"
                  />
                )}

                {/* Info */}
                <View style={styles.hubInfo}>
                  {/* Name + type badge row */}
                  <View style={styles.nameRow}>
                    <Text style={[styles.hubName, { color: theme.text, flex: 1 }]}>
                      {item.name}
                    </Text>
                  </View>

                  {/* Type chip */}
                  <View style={styles.chipRow}>
                    <View
                      style={[
                        styles.typeChip,
                        { backgroundColor: `${theme.textSecondary}12` },
                      ]}
                    >
                      <Text style={styles.typeEmoji}>{typeMeta.emoji}</Text>
                      <Text
                        style={[styles.typeLabel, { color: theme.textSecondary }]}
                      >
                        {typeMeta.label}
                      </Text>
                    </View>

                    {item.isPartner && (
                      <View
                        style={[
                          styles.partnerBadge,
                          { backgroundColor: `${theme.primary}12` },
                        ]}
                      >
                        <Text
                          style={[
                            styles.partnerText,
                            { color: theme.primary },
                          ]}
                        >
                          Partenaire
                        </Text>
                      </View>
                    )}
                  </View>

                  <Text style={[styles.hubAddress, { color: theme.textSecondary }]}>
                    {item.address}, {item.city}
                  </Text>
                  <Text style={[styles.hubHours, { color: theme.textSecondary }]}>
                    <Feather name="clock" size={10} /> {item.operatingHours}
                  </Text>

                  {/* E-commerce extras */}
                  {item.hubType === 'ecommerce' &&
                    item.availablePackages != null && (
                      <View style={styles.ecomRow}>
                        <Feather name="package" size={12} color={theme.textSecondary} />
                        <Text
                          style={[
                            styles.ecomText,
                            { color: theme.textSecondary },
                          ]}
                        >
                          {item.availablePackages} colis disponibles
                        </Text>
                        {item.priorityLevel && item.priorityLevel !== 'normal' && (
                          <View
                            style={[
                              styles.priorityDot,
                              {
                                backgroundColor:
                                  PRIORITY_COLORS[item.priorityLevel] ??
                                  theme.textSecondary,
                              },
                            ]}
                          />
                        )}
                      </View>
                    )}

                  {/* Capacity bar */}
                  <View style={styles.capacityRow}>
                    <View
                      style={[styles.capacityBar, { backgroundColor: theme.border }]}
                    >
                      <View
                        style={[
                          styles.capacityFill,
                          {
                            width: `${loadPercent(item)}%` as any,
                            backgroundColor:
                              loadPercent(item) > 80
                                ? theme.error
                                : loadPercent(item) > 60
                                  ? theme.warning
                                  : theme.success,
                          },
                        ]}
                      />
                    </View>
                    <Text
                      style={[styles.capacityText, { color: theme.textSecondary }]}
                    >
                      {loadPercent(item)}% occupé
                    </Text>
                  </View>
                </View>

                {/* Selection indicator */}
                {mode === 'multi' ? (
                  <View
                    style={[
                      styles.checkbox,
                      {
                        backgroundColor: isSelected ? theme.primary : 'transparent',
                        borderColor: isSelected ? theme.primary : theme.border,
                      },
                    ]}
                  >
                    {isSelected && (
                      <Feather name="check" size={12} color="#FFF" />
                    )}
                  </View>
                ) : (
                  <Feather
                    name={isSelected ? 'check-circle' : 'chevron-right'}
                    size={16}
                    color={isSelected ? theme.primary : theme.border}
                  />
                )}
              </TouchableOpacity>
            </Animated.View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Feather name="map-pin" size={36} color={theme.border} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              Aucun hub disponible
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
              {cityFilter
                ? `Pas de hub actif à ${cityFilter} pour le moment.`
                : 'Aucun hub actif pour le moment.'}
            </Text>
          </View>
        }
      />

      {/* Multi-select confirm button */}
      {mode === 'multi' && (
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
            onPress={handleConfirm}
            disabled={selected.length === 0}
            style={{ opacity: selected.length === 0 ? 0.45 : 1 }}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[theme.primary, theme.primaryGradientEnd]}
              style={styles.confirmBtn}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Feather name="check" size={18} color="#FFF" />
              <Text style={styles.confirmText}>
                Confirmer{selected.length > 0 ? ` (${selected.length} hub${selected.length > 1 ? 's' : ''})` : ''}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  headerTitle: { ...Typography.h3, color: '#FFF' },
  headerSub: { ...Typography.caption, color: 'rgba(255,255,255,0.7)' },
  counterBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  counterText: { ...Typography.captionMedium, color: '#FFF' },

  // Section
  sectionHeader: {
    ...Typography.captionMedium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },

  // Hub card
  hubCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  hubPhoto: { width: 64, height: 64, borderRadius: BorderRadius.sm },
  hubInfo: { flex: 1, gap: 3 },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  hubName: { ...Typography.bodyMedium, fontFamily: 'Poppins_600SemiBold' },
  chipRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, flexWrap: 'wrap' },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  typeEmoji: { fontSize: 11 },
  typeLabel: { ...Typography.caption, fontSize: 10 },
  partnerBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  partnerText: { ...Typography.caption, fontSize: 10, fontFamily: 'Poppins_600SemiBold' },
  hubAddress: { ...Typography.caption },
  hubHours: { ...Typography.caption, fontSize: 10 },

  // E-commerce
  ecomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: 2,
  },
  ecomText: { ...Typography.caption, fontSize: 10 },
  priorityDot: { width: 6, height: 6, borderRadius: 3 },

  // Capacity
  capacityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: 4,
  },
  capacityBar: { flex: 1, height: 4, borderRadius: 2, overflow: 'hidden' },
  capacityFill: { height: '100%', borderRadius: 2 },
  capacityText: { ...Typography.caption, fontSize: 10 },

  // Selection
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Empty
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: Spacing.md,
  },
  emptyTitle: { ...Typography.h3 },
  emptySubtitle: { ...Typography.body, textAlign: 'center', maxWidth: 260 },

  // Bottom bar
  bottomBar: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
  },
  confirmText: { ...Typography.button, color: '#FFF' },
});
