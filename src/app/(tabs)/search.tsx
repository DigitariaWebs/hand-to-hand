import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Switch,
  Platform,
  LayoutChangeEvent,
  Keyboard,
  useColorScheme,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, runOnJS } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Colors, ThemeColors } from '@/constants/Colors';
import { BorderRadius } from '@/constants/Spacing';
import { Categories } from '@/constants/Categories';
import { mockProducts } from '@/services/mock/products';
import { storage } from '@/utils/storage';
import { Product, ProductCondition } from '@/types/product';
import { ProductCard } from '@/components/product/ProductCard';
import { BottomSheet } from '@/components/ui/BottomSheet';

// ─── Constants ────────────────────────────────────────────────────────────────

const PRICE_MAX = 5000;
const PRICE_STEP = 50;
const RECENT_KEY = 'h2h_recent_searches';
const MAX_RECENT = 5;
const H_SIZE = 22;

type SortKey = 'relevance' | 'price_asc' | 'price_desc' | 'newest' | 'best_deal';
type DealKey = 'excellent' | 'good' | 'fair' | 'above';

type FilterState = {
  category: string;
  priceMin: number;
  priceMax: number;
  conditions: ProductCondition[];
  dealScores: DealKey[];
  location: string;
  distanceIdx: number;
  verifiedOnly: boolean;
};

const DEFAULT_FILTERS: FilterState = {
  category: '',
  priceMin: 0,
  priceMax: PRICE_MAX,
  conditions: [],
  dealScores: [],
  location: '',
  distanceIdx: 5,
  verifiedOnly: false,
};

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'relevance', label: 'Pertinence' },
  { key: 'price_asc', label: 'Prix croissant' },
  { key: 'price_desc', label: 'Prix décroissant' },
  { key: 'newest', label: 'Plus récent' },
  { key: 'best_deal', label: 'Meilleures affaires' },
];

const CONDITIONS: { key: ProductCondition; label: string }[] = [
  { key: 'new', label: 'Neuf' },
  { key: 'like_new', label: 'Très bon' },
  { key: 'good', label: 'Bon' },
  { key: 'fair', label: 'Satisfaisant' },
];

const DEAL_TIERS: { key: DealKey; label: string }[] = [
  { key: 'excellent', label: 'Excellente affaire' },
  { key: 'good', label: 'Bonne affaire' },
  { key: 'fair', label: 'Prix juste' },
  { key: 'above', label: 'Au-dessus du marché' },
];

const DIST_LABELS = ['5 km', '10 km', '20 km', '50 km', '100 km', 'France entière'];

const CAT_ICONS: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  shirt: 'shirt-outline',
  footprints: 'footsteps-outline',
  car: 'car-outline',
  smartphone: 'phone-portrait-outline',
  home: 'home-outline',
  dumbbell: 'barbell-outline',
  gem: 'diamond-outline',
  baby: 'happy-outline',
  sparkles: 'sparkles-outline',
  wrench: 'construct-outline',
  grid: 'grid-outline',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getDealTier(score: number): DealKey {
  if (score >= 85) return 'excellent';
  if (score >= 70) return 'good';
  if (score >= 55) return 'fair';
  return 'above';
}

function countActiveFilters(f: FilterState): number {
  let n = 0;
  if (f.category) n++;
  if (f.priceMin > 0 || f.priceMax < PRICE_MAX) n++;
  if (f.conditions.length) n++;
  if (f.dealScores.length) n++;
  if (f.location.trim()) n++;
  if (f.distanceIdx < 5) n++;
  if (f.verifiedOnly) n++;
  return n;
}

function applyFiltersAndSort(
  products: Product[],
  query: string,
  filters: FilterState,
  sort: SortKey,
): Product[] {
  let result = [...products];

  if (query.trim()) {
    const q = query.toLowerCase();
    result = result.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q)),
    );
  }

  if (filters.category) result = result.filter((p) => p.category === filters.category);
  result = result.filter((p) => p.price >= filters.priceMin && p.price <= filters.priceMax);
  if (filters.conditions.length) result = result.filter((p) => filters.conditions.includes(p.condition));
  if (filters.dealScores.length) result = result.filter((p) => filters.dealScores.includes(getDealTier(p.dealScore)));
  if (filters.verifiedOnly) result = result.filter((p) => p.seller.isVerified);

  switch (sort) {
    case 'price_asc':
      result.sort((a, b) => a.price - b.price);
      break;
    case 'price_desc':
      result.sort((a, b) => b.price - a.price);
      break;
    case 'newest':
      result.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
      break;
    case 'best_deal':
      result.sort((a, b) => b.dealScore - a.dealScore);
      break;
    default:
      result.sort((a, b) => (b.isBoosted ? 1 : 0) - (a.isBoosted ? 1 : 0));
  }

  return result;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ─── RangeSlider ──────────────────────────────────────────────────────────────

const RS_H = 36;
const RS_TRACK_TOP = (RS_H - 4) / 2;
const RS_HANDLE_TOP = (RS_H - H_SIZE) / 2;

type RangeSliderProps = {
  min: number;
  max: number;
  step?: number;
  value: [number, number];
  onChange: (v: [number, number]) => void;
};

function RangeSlider({ min, max, step = 50, value, onChange }: RangeSliderProps) {
  const colorScheme = useColorScheme();
  const t = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const rsStyles = createRsStyles(t);
  const tw = useSharedValue(0);
  const lx = useSharedValue(0);
  const rx = useSharedValue(0);
  const ls = useSharedValue(0);
  const rs = useSharedValue(0);

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const fireChange = useCallback((vMin: number, vMax: number) => {
    onChangeRef.current([vMin, vMax]);
  }, []);

  useEffect(() => {
    if (tw.value === 0) return;
    lx.value = ((value[0] - min) / (max - min)) * tw.value;
    rx.value = ((value[1] - min) / (max - min)) * tw.value;
  }, [value[0], value[1]]);

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    tw.value = w;
    lx.value = ((value[0] - min) / (max - min)) * w;
    rx.value = ((value[1] - min) / (max - min)) * w;
  };

  const pxToVal = (px: number) => {
    'worklet';
    const w = tw.value;
    if (w === 0) return min;
    const raw = (px / w) * (max - min) + min;
    return Math.round(Math.max(min, Math.min(max, raw)) / step) * step;
  };

  const lGesture = Gesture.Pan()
    .activeOffsetX([-3, 3])
    .onBegin(() => {
      ls.value = lx.value;
    })
    .onUpdate((e) => {
      lx.value = Math.max(0, Math.min(ls.value + e.translationX, rx.value - H_SIZE));
    })
    .onFinalize(() => {
      runOnJS(fireChange)(pxToVal(lx.value), pxToVal(rx.value));
    });

  const rGesture = Gesture.Pan()
    .activeOffsetX([-3, 3])
    .onBegin(() => {
      rs.value = rx.value;
    })
    .onUpdate((e) => {
      rx.value = Math.min(tw.value, Math.max(rs.value + e.translationX, lx.value + H_SIZE));
    })
    .onFinalize(() => {
      runOnJS(fireChange)(pxToVal(lx.value), pxToVal(rx.value));
    });

  const leftStyle = useAnimatedStyle(() => ({ left: lx.value - H_SIZE / 2 }));
  const rightStyle = useAnimatedStyle(() => ({ left: rx.value - H_SIZE / 2 }));
  const fillStyle = useAnimatedStyle(() => ({
    left: lx.value,
    width: Math.max(0, rx.value - lx.value),
  }));

  return (
    <View style={{ height: RS_H }}>
      <View style={[rsStyles.track, { top: RS_TRACK_TOP }]} onLayout={onLayout} />
      <Animated.View style={[rsStyles.fill, { top: RS_TRACK_TOP }, fillStyle]} />
      <GestureDetector gesture={lGesture}>
        <Animated.View style={[rsStyles.handle, { top: RS_HANDLE_TOP }, leftStyle]} />
      </GestureDetector>
      <GestureDetector gesture={rGesture}>
        <Animated.View style={[rsStyles.handle, { top: RS_HANDLE_TOP }, rightStyle]} />
      </GestureDetector>
    </View>
  );
}

const createRsStyles = (t: ThemeColors) => StyleSheet.create({
  track: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: t.border,
    borderRadius: 2,
  },
  fill: {
    position: 'absolute',
    height: 4,
    backgroundColor: t.primary,
    borderRadius: 2,
  },
  handle: {
    position: 'absolute',
    width: H_SIZE,
    height: H_SIZE,
    borderRadius: H_SIZE / 2,
    backgroundColor: t.surface,
    borderWidth: 2.5,
    borderColor: t.primary,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: { elevation: 4 },
    }),
  },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const inputRef = useRef<TextInput>(null);
  const colorScheme = useColorScheme();
  const t = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const styles = createStyles(t);

  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>('relevance');
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [draftFilters, setDraftFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [showSort, setShowSort] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const debouncedQuery = useDebounce(query, 300);
  const filterCount = countActiveFilters(filters);
  const isIdle = debouncedQuery.length === 0 && filterCount === 0;

  const results = useMemo(
    () => applyFiltersAndSort(mockProducts, debouncedQuery, filters, sortKey),
    [debouncedQuery, filters, sortKey],
  );

  // ── Recent searches ──
  useEffect(() => {
    storage.getString(RECENT_KEY).then((raw) => {
      if (!raw) return;
      try {
        setRecentSearches(JSON.parse(raw));
      } catch {}
    });
  }, []);

  const saveRecent = useCallback(
    async (term: string) => {
      const updated = [term, ...recentSearches.filter((t) => t !== term)].slice(0, MAX_RECENT);
      setRecentSearches(updated);
      await storage.set(RECENT_KEY, JSON.stringify(updated));
    },
    [recentSearches],
  );

  const clearRecent = useCallback(async () => {
    setRecentSearches([]);
    await storage.remove(RECENT_KEY);
  }, []);

  const handleSubmit = () => {
    if (query.trim()) {
      saveRecent(query.trim());
      Keyboard.dismiss();
    }
  };

  // ── Filters ──
  const handleOpenFilters = () => {
    setDraftFilters({ ...filters });
    setShowFilters(true);
  };

  const handleApplyFilters = () => {
    setFilters(draftFilters);
    setShowFilters(false);
  };

  const draftCount = countActiveFilters(draftFilters);
  const sortLabel = SORT_OPTIONS.find((o) => o.key === sortKey)?.label ?? 'Pertinence';

  return (
    <View style={[styles.container, { backgroundColor: t.background }]}>

      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.searchRow}>
          <Ionicons name="search-outline" size={18} color={t.textSecondary} style={{ marginLeft: 12 }} />
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Rechercher..."
            placeholderTextColor={t.textSecondary}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSubmit}
            returnKeyType="search"
            autoFocus
            autoCorrect={false}
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <TouchableOpacity
              onPress={() => setQuery('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={{ marginRight: 10 }}
            >
              <Ionicons name="close-circle" size={18} color={t.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => setShowSort(true)}
            style={styles.actionBtn}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Ionicons name="swap-vertical-outline" size={22} color={t.text} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleOpenFilters}
            style={[styles.actionBtn, filterCount > 0 && styles.actionBtnActive]}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Ionicons name="options-outline" size={22} color={filterCount > 0 ? t.primary : t.text} />
            {filterCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{filterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Content ── */}
      {isIdle ? (
        /* Idle state */
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {recentSearches.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recherches récentes</Text>
                <TouchableOpacity onPress={clearRecent}>
                  <Text style={styles.clearText}>Effacer</Text>
                </TouchableOpacity>
              </View>
              {recentSearches.map((term, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.recentItem}
                  onPress={() => {
                    setQuery(term);
                    inputRef.current?.focus();
                  }}
                >
                  <Ionicons name="time-outline" size={16} color={t.textSecondary} />
                  <Text style={styles.recentText}>{term}</Text>
                  <Ionicons name="arrow-up-outline" size={14} color={t.textSecondary} style={{ transform: [{ rotate: '45deg' }] }} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Catégories populaires</Text>
            <View style={styles.catGrid}>
              {Categories.slice(0, 8).map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={styles.catTile}
                  onPress={() => setFilters((f) => ({ ...f, category: cat.id }))}
                  activeOpacity={0.75}
                >
                  <View style={styles.catIconWrap}>
                    <Ionicons
                      name={CAT_ICONS[cat.icon] ?? 'grid-outline'}
                      size={24}
                      color={t.primary}
                    />
                  </View>
                  <Text style={styles.catLabel} numberOfLines={1}>
                    {cat.labelFr}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      ) : (
        /* Results state */
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onScrollBeginDrag={() => Keyboard.dismiss()}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsCount}>
                {results.length} résultat{results.length !== 1 ? 's' : ''}
              </Text>
              <TouchableOpacity onPress={() => setShowSort(true)} style={styles.sortBtn}>
                <Ionicons name="swap-vertical-outline" size={13} color={t.textSecondary} />
                <Text style={styles.sortBtnText}>{sortLabel}</Text>
              </TouchableOpacity>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={60} color={t.border} />
              <Text style={styles.emptyTitle}>Aucun résultat trouvé</Text>
              <Text style={styles.emptySubtitle}>
                Essayez d'autres mots-clés, on cherche avec vous.
              </Text>
              {filterCount > 0 && (
                <TouchableOpacity
                  style={styles.resetFiltersBtn}
                  onPress={() => setFilters(DEFAULT_FILTERS)}
                >
                  <Text style={styles.resetFiltersBtnText}>Réinitialiser les filtres</Text>
                </TouchableOpacity>
              )}
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.cardWrapper}>
              <ProductCard product={item} onPress={() => router.push(`/product/${item.id}`)} />
            </View>
          )}
        />
      )}

      {/* ── Sort Sheet ── */}
      <BottomSheet visible={showSort} onClose={() => setShowSort(false)} snapHeight={0.44}>
        <View style={styles.sheetInner}>
          <Text style={styles.sheetTitle}>Trier par</Text>
          {SORT_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={styles.sortOption}
              onPress={() => {
                setSortKey(opt.key);
                setShowSort(false);
              }}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.sortOptionText,
                  sortKey === opt.key && { color: t.primary, fontFamily: 'Poppins_600SemiBold' },
                ]}
              >
                {opt.label}
              </Text>
              {sortKey === opt.key && (
                <Ionicons name="checkmark" size={18} color={t.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </BottomSheet>

      {/* ── Filter Sheet ── */}
      <BottomSheet visible={showFilters} onClose={() => setShowFilters(false)} snapHeight={0.78}>
        <View style={{ flex: 1 }}>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={[styles.filterContent, { paddingBottom: insets.bottom + 96 }]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Catégorie */}
            <Text style={styles.filterTitle}>Catégorie</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingBottom: 4 }}
            >
              {[{ id: '', labelFr: 'Toutes' }, ...Categories].map((cat) => {
                const active = draftFilters.category === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => setDraftFilters((f) => ({ ...f, category: cat.id }))}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {cat.labelFr}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Prix */}
            <Text style={[styles.filterTitle, { marginTop: 22 }]}>Prix</Text>
            <View style={styles.priceRow}>
              <View style={styles.priceField}>
                <Text style={styles.priceLabel}>Min</Text>
                <TextInput
                  style={styles.priceInput}
                  value={String(draftFilters.priceMin)}
                  onChangeText={(v) => {
                    const n = parseInt(v) || 0;
                    setDraftFilters((f) => ({ ...f, priceMin: Math.min(n, f.priceMax - PRICE_STEP) }));
                  }}
                  keyboardType="numeric"
                />
                <Text style={styles.priceCurrency}>€</Text>
              </View>
              <View style={styles.priceDivider} />
              <View style={styles.priceField}>
                <Text style={styles.priceLabel}>Max</Text>
                <TextInput
                  style={styles.priceInput}
                  value={String(draftFilters.priceMax)}
                  onChangeText={(v) => {
                    const n = parseInt(v) || PRICE_MAX;
                    setDraftFilters((f) => ({ ...f, priceMax: Math.max(n, f.priceMin + PRICE_STEP) }));
                  }}
                  keyboardType="numeric"
                />
                <Text style={styles.priceCurrency}>€</Text>
              </View>
            </View>
            <RangeSlider
              min={0}
              max={PRICE_MAX}
              step={PRICE_STEP}
              value={[draftFilters.priceMin, draftFilters.priceMax]}
              onChange={([vMin, vMax]) =>
                setDraftFilters((f) => ({ ...f, priceMin: vMin, priceMax: vMax }))
              }
            />
            <View style={styles.priceAxisLabels}>
              <Text style={styles.priceAxisText}>0 €</Text>
              <Text style={styles.priceAxisText}>{PRICE_MAX} €+</Text>
            </View>

            {/* État */}
            <Text style={[styles.filterTitle, { marginTop: 22 }]}>État</Text>
            <View style={styles.chipWrap}>
              {CONDITIONS.map((c) => {
                const active = draftFilters.conditions.includes(c.key);
                return (
                  <TouchableOpacity
                    key={c.key}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() =>
                      setDraftFilters((f) => ({
                        ...f,
                        conditions: active
                          ? f.conditions.filter((k) => k !== c.key)
                          : [...f.conditions, c.key],
                      }))
                    }
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{c.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Indice d'affaire */}
            <Text style={[styles.filterTitle, { marginTop: 22 }]}>Indice d'affaire</Text>
            <View style={styles.chipWrap}>
              {DEAL_TIERS.map((d) => {
                const active = draftFilters.dealScores.includes(d.key);
                return (
                  <TouchableOpacity
                    key={d.key}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() =>
                      setDraftFilters((f) => ({
                        ...f,
                        dealScores: active
                          ? f.dealScores.filter((k) => k !== d.key)
                          : [...f.dealScores, d.key],
                      }))
                    }
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{d.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Localisation */}
            <Text style={[styles.filterTitle, { marginTop: 22 }]}>Localisation</Text>
            <View style={styles.locationWrap}>
              <Ionicons name="location-outline" size={16} color={t.textSecondary} />
              <TextInput
                style={styles.locationInput}
                placeholder="Ville, région..."
                placeholderTextColor={t.textSecondary}
                value={draftFilters.location}
                onChangeText={(v) => setDraftFilters((f) => ({ ...f, location: v }))}
              />
              {draftFilters.location.length > 0 && (
                <TouchableOpacity onPress={() => setDraftFilters((f) => ({ ...f, location: '' }))}>
                  <Ionicons name="close-circle" size={16} color={t.textSecondary} />
                </TouchableOpacity>
              )}
            </View>

            {/* Distance */}
            <Text style={[styles.filterTitle, { marginTop: 22 }]}>Distance</Text>
            <View style={styles.chipWrap}>
              {DIST_LABELS.map((label, i) => {
                const active = draftFilters.distanceIdx === i;
                return (
                  <TouchableOpacity
                    key={i}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => setDraftFilters((f) => ({ ...f, distanceIdx: i }))}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Vendeur vérifié */}
            <View style={styles.toggleRow}>
              <View>
                <Text style={styles.toggleLabel}>Vendeur vérifié</Text>
                <Text style={styles.toggleSub}>Uniquement les vendeurs certifiés</Text>
              </View>
              <Switch
                value={draftFilters.verifiedOnly}
                onValueChange={(v) => setDraftFilters((f) => ({ ...f, verifiedOnly: v }))}
                trackColor={{ false: t.border, true: `${t.primary}80` }}
                thumbColor={draftFilters.verifiedOnly ? t.primary : '#FFF'}
              />
            </View>
          </ScrollView>

          {/* Sticky footer */}
          <View style={[styles.filterFooter, { paddingBottom: insets.bottom + 12 }]}>
            <TouchableOpacity
              style={styles.resetBtn}
              onPress={() => setDraftFilters(DEFAULT_FILTERS)}
            >
              <Text style={styles.resetText}>Réinitialiser</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ flex: 1 }} onPress={handleApplyFilters} activeOpacity={0.85}>
              <LinearGradient
                colors={[t.primary, t.primaryGradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.applyBtn}
              >
                <Text style={styles.applyText}>
                  Appliquer{draftCount > 0 ? ` (${draftCount})` : ''}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </BottomSheet>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const createStyles = (t: ThemeColors) => StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: {
    backgroundColor: t.surface,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: t.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 3,
      },
      android: { elevation: 2 },
    }),
  },
  searchRow: {
    flex: 1,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: t.background,
    borderRadius: 12,
    gap: 8,
  },
  input: {
    flex: 1,
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: t.text,
    paddingVertical: 0,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 4,
  },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnActive: {
    backgroundColor: `${t.primary}14`,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: t.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 9,
    color: '#FFF',
    lineHeight: 13,
  },

  // Results list
  columnWrapper: {
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 12,
  },
  listContent: {
    paddingTop: 4,
    paddingBottom: 40,
  },
  cardWrapper: {
    flex: 1,
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  resultsCount: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: t.textSecondary,
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sortBtnText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: t.textSecondary,
  },

  // Idle state
  section: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: t.text,
  },
  clearText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: t.primary,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: t.border,
  },
  recentText: {
    flex: 1,
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: t.text,
  },
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  catTile: {
    width: '22%',
    alignItems: 'center',
    gap: 6,
  },
  catIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: `${t.primary}10`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 10,
    color: t.text,
    textAlign: 'center',
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
    gap: 10,
  },
  emptyTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: t.text,
  },
  emptySubtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: t.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  resetFiltersBtn: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: t.primary,
  },
  resetFiltersBtnText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: t.primary,
  },

  // Sort sheet
  sheetInner: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  sheetTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: t.text,
    marginBottom: 8,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: t.border,
  },
  sortOptionText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: t.text,
  },

  // Filter sheet
  filterContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  filterTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: t.text,
    marginBottom: 12,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: t.border,
    backgroundColor: t.surface,
  },
  chipActive: {
    borderColor: t.primary,
    backgroundColor: `${t.primary}10`,
  },
  chipText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: t.textSecondary,
  },
  chipTextActive: {
    fontFamily: 'Poppins_500Medium',
    color: t.primary,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  // Price range
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  priceField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 42,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: t.border,
    paddingHorizontal: 12,
    gap: 6,
  },
  priceLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: t.textSecondary,
  },
  priceInput: {
    flex: 1,
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: t.text,
    paddingVertical: 0,
  },
  priceCurrency: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: t.textSecondary,
  },
  priceDivider: {
    width: 16,
    height: 1.5,
    backgroundColor: t.border,
  },
  priceAxisLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  priceAxisText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: t.textSecondary,
  },

  // Location
  locationWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: t.border,
    paddingHorizontal: 12,
    gap: 8,
    backgroundColor: t.surface,
  },
  locationInput: {
    flex: 1,
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: t.text,
    paddingVertical: 0,
  },

  // Toggle
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 22,
    paddingVertical: 4,
  },
  toggleLabel: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: t.text,
  },
  toggleSub: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: t.textSecondary,
    marginTop: 2,
  },

  // Filter footer
  filterFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: t.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: t.border,
  },
  resetBtn: {
    height: 50,
    paddingHorizontal: 20,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: t.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: t.text,
  },
  applyBtn: {
    height: 50,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: '#FFF',
  },
  });
