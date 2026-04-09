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
import Svg, {
  Polyline,
  Line,
  Text as SvgText,
  Path,
  Circle,
} from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing, BorderRadius } from '@/constants/Spacing';

const SW = Dimensions.get('window').width;

// ── Mock data ──────────────────────────────────────────────────────────────

const VIEWS_DATA = [12, 15, 18, 14, 28, 42, 48];
const LABELS = ['J-6', 'J-5', 'J-4', 'J-3', 'J-2', 'J-1', "Auj'"];
const BOOST_START_IDX = 4; // boost active from day index 4 onward

type MetricCard = {
  label: string;
  value: string;
  change: string;
  up: boolean;
  icon: keyof typeof Feather.glyphMap;
  iconBg: string;
  iconColor: string;
};

const METRICS: MetricCard[] = [
  {
    label: 'Vues',
    value: '336',
    change: '+120%',
    up: true,
    icon: 'eye',
    iconBg: '#EFF6FF',
    iconColor: '#3B82F6',
  },
  {
    label: 'Favoris',
    value: '47',
    change: '+85%',
    up: true,
    icon: 'heart',
    iconBg: '#FEF2F2',
    iconColor: '#EF4444',
  },
  {
    label: 'Messages',
    value: '23',
    change: '+200%',
    up: true,
    icon: 'message-circle',
    iconBg: '#F0FDFA',
    iconColor: '#14B8A6',
  },
  {
    label: 'Offres',
    value: '12',
    change: '+150%',
    up: true,
    icon: 'tag',
    iconBg: '#F5F3FF',
    iconColor: '#8B5CF6',
  },
];

// ── SVG line chart ─────────────────────────────────────────────────────────

function ViewsChart({ theme }: { theme: typeof Colors.light }) {
  const chartW = SW - Spacing.lg * 2 - 2;
  const H = 160;
  const padTop = 18;
  const padBottom = 28;
  const padLeft = 34;
  const padRight = 10;
  const plotW = chartW - padLeft - padRight;
  const plotH = H - padTop - padBottom;
  const maxVal = 56;

  const xFor = (i: number) =>
    padLeft + (i / (VIEWS_DATA.length - 1)) * plotW;
  const yFor = (v: number) =>
    padTop + plotH - (v / maxVal) * plotH;

  const prePoints = VIEWS_DATA.slice(0, BOOST_START_IDX + 1)
    .map((v, i) => `${xFor(i).toFixed(1)},${yFor(v).toFixed(1)}`)
    .join(' ');

  const postPoints = VIEWS_DATA.slice(BOOST_START_IDX)
    .map((v, i) =>
      `${xFor(BOOST_START_IDX + i).toFixed(1)},${yFor(v).toFixed(1)}`,
    )
    .join(' ');

  const x4 = xFor(BOOST_START_IDX);
  const xLast = xFor(VIEWS_DATA.length - 1);
  const yBottom = padTop + plotH;

  const postFillPath =
    `M ${x4.toFixed(1)} ${yBottom.toFixed(1)} ` +
    VIEWS_DATA.slice(BOOST_START_IDX)
      .map(
        (v, i) =>
          `L ${xFor(BOOST_START_IDX + i).toFixed(1)} ${yFor(v).toFixed(1)}`,
      )
      .join(' ') +
    ` L ${xLast.toFixed(1)} ${yBottom.toFixed(1)} Z`;

  const gridValues = [0, 14, 28, 42, 56];

  return (
    <Svg width={chartW} height={H}>
      {/* Y-axis gridlines + labels */}
      {gridValues.map((v) => (
        <React.Fragment key={`g${v}`}>
          <Line
            x1={padLeft}
            y1={yFor(v)}
            x2={padLeft + plotW}
            y2={yFor(v)}
            stroke={theme.border}
            strokeWidth={0.75}
          />
          <SvgText
            x={padLeft - 5}
            y={yFor(v) + 3.5}
            fontSize={8}
            fill={theme.textSecondary}
            textAnchor="end"
          >
            {v}
          </SvgText>
        </React.Fragment>
      ))}

      {/* Orange fill under post-boost area */}
      <Path d={postFillPath} fill="rgba(245,158,11,0.12)" />

      {/* Vertical dashed line at boost start */}
      <Line
        x1={x4}
        y1={padTop - 2}
        x2={x4}
        y2={yBottom}
        stroke="#F59E0B"
        strokeWidth={1.5}
        strokeDasharray="4,3"
      />

      {/* Pre-boost polyline */}
      <Polyline
        points={prePoints}
        fill="none"
        stroke="#9CA3AF"
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Post-boost polyline */}
      <Polyline
        points={postPoints}
        fill="none"
        stroke="#F59E0B"
        strokeWidth={2.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Data point dots */}
      {VIEWS_DATA.map((v, i) => (
        <Circle
          key={`d${i}`}
          cx={xFor(i)}
          cy={yFor(v)}
          r={3.5}
          fill={i >= BOOST_START_IDX ? '#F59E0B' : '#9CA3AF'}
          stroke="#FFF"
          strokeWidth={1.5}
        />
      ))}

      {/* X-axis labels */}
      {LABELS.map((label, i) => (
        <SvgText
          key={`l${i}`}
          x={xFor(i)}
          y={H - 4}
          fontSize={8.5}
          fill={theme.textSecondary}
          textAnchor="middle"
        >
          {label}
        </SvgText>
      ))}

      {/* "⚡ Boost" annotation */}
      <SvgText
        x={x4 + 5}
        y={padTop + 2}
        fontSize={8.5}
        fill="#F59E0B"
      >
        ⚡ Boost
      </SvgText>
    </Svg>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────

export default function StatsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

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
          Statistiques
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
        {/* Boost active banner */}
        <View
          style={[
            styles.boostBanner,
            {
              backgroundColor: `${theme.boost}15`,
              borderColor: `${theme.boost}30`,
            },
          ]}
        >
          <Feather name="zap" size={15} color={theme.boost} />
          <Text style={[styles.boostBannerText, { color: theme.boost }]}>
            ⚡ Boost Premium actif — expire dans 2 jours
          </Text>
        </View>

        {/* Period */}
        <Text style={[styles.period, { color: theme.textSecondary }]}>
          28 mars – 4 avril 2026 · 7 derniers jours
        </Text>

        {/* Metrics 2×2 grid */}
        <View style={styles.metricsGrid}>
          {METRICS.map((m) => (
            <View
              key={m.label}
              style={[
                styles.metricCard,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
            >
              <View
                style={[
                  styles.metricIcon,
                  { backgroundColor: m.iconBg },
                ]}
              >
                <Feather name={m.icon} size={16} color={m.iconColor} />
              </View>
              <Text style={[styles.metricValue, { color: theme.text }]}>
                {m.value}
              </Text>
              <Text
                style={[styles.metricLabel, { color: theme.textSecondary }]}
              >
                {m.label}
              </Text>
              <View
                style={[
                  styles.metricBadge,
                  { backgroundColor: m.up ? '#ECFDF5' : '#FEF2F2' },
                ]}
              >
                <Feather
                  name={m.up ? 'trending-up' : 'trending-down'}
                  size={10}
                  color={m.up ? '#10B981' : '#EF4444'}
                />
                <Text
                  style={[
                    styles.metricBadgeText,
                    { color: m.up ? '#10B981' : '#EF4444' },
                  ]}
                >
                  {m.change}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Chart card */}
        <View
          style={[
            styles.chartCard,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          <View style={styles.chartHeader}>
            <Text style={[styles.chartTitle, { color: theme.text }]}>
              Évolution des vues
            </Text>
          </View>
          <View style={styles.chartLegend}>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendLine, { backgroundColor: '#9CA3AF' }]}
              />
              <Text
                style={[styles.legendText, { color: theme.textSecondary }]}
              >
                Sans boost
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendLine, { backgroundColor: '#F59E0B' }]}
              />
              <Text
                style={[styles.legendText, { color: theme.textSecondary }]}
              >
                Avec boost
              </Text>
            </View>
          </View>
          <ViewsChart theme={theme} />
        </View>

        {/* Before/After comparison */}
        <View
          style={[
            styles.compCard,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          <View style={styles.compSide}>
            <Text style={[styles.compLabel, { color: theme.textSecondary }]}>
              Avant boost
            </Text>
            <Text style={[styles.compValue, { color: theme.text }]}>
              15 vues/jour
            </Text>
          </View>
          <View
            style={[
              styles.compArrow,
              { backgroundColor: `${theme.boost}15` },
            ]}
          >
            <Feather name="arrow-right" size={18} color={theme.boost} />
            <Text style={[styles.compPercent, { color: theme.boost }]}>
              +220%
            </Text>
          </View>
          <View style={styles.compSide}>
            <Text style={[styles.compLabel, { color: theme.textSecondary }]}>
              Après boost
            </Text>
            <Text style={[styles.compValue, { color: theme.boost }]}>
              48 vues/jour
            </Text>
          </View>
        </View>

        {/* Tip */}
        <View
          style={[
            styles.tipCard,
            {
              backgroundColor: `${theme.primary}08`,
              borderColor: `${theme.primary}20`,
            },
          ]}
        >
          <Feather
            name="info"
            size={15}
            color={theme.primary}
            style={{ marginTop: 1 }}
          />
          <Text style={[styles.tipText, { color: theme.textSecondary }]}>
            <Text
              style={{
                fontFamily: 'Poppins_600SemiBold',
                color: theme.text,
              }}
            >
              Conseil ·{' '}
            </Text>
            Prolongez votre boost maintenant pour maintenir votre position en
            tête des recherches.
          </Text>
        </View>

        {/* Extend boost CTA */}
        <TouchableOpacity
          style={[styles.extendBtn]}
          onPress={() => router.push(`/boost/${id}` as any)}
          activeOpacity={0.85}
        >
          <View style={styles.extendBtnInner}>
            <Feather name="zap" size={16} color="#FFF" />
            <Text style={styles.extendBtnText}>Prolonger le boost</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────

const CARD_W = (SW - Spacing.lg * 2 - Spacing.sm) / 2;

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

  // Boost banner
  boostBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  boostBannerText: { ...Typography.captionMedium, flex: 1 },

  period: { ...Typography.caption },

  // Metrics grid
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  metricCard: {
    width: CARD_W,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.xs,
    alignItems: 'flex-start',
  },
  metricIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  metricValue: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 22,
    lineHeight: 28,
  },
  metricLabel: { ...Typography.caption },
  metricBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    marginTop: 2,
  },
  metricBadgeText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 10,
    lineHeight: 13,
  },

  // Chart
  chartCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chartTitle: { ...Typography.bodyMedium, fontFamily: 'Poppins_600SemiBold' },
  chartLegend: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendLine: {
    width: 18,
    height: 2.5,
    borderRadius: 1.25,
  },
  legendText: { ...Typography.caption },

  // Before/After comparison
  compCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
  },
  compSide: {
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  compLabel: { ...Typography.caption },
  compValue: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 15,
    lineHeight: 20,
  },
  compArrow: {
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  compPercent: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 12,
    lineHeight: 16,
  },

  // Tip
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  tipText: { ...Typography.body, flex: 1, lineHeight: 21 },

  // Extend boost button
  extendBtn: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  extendBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: 14,
    backgroundColor: '#F59E0B',
  },
  extendBtnText: { ...Typography.button, color: '#FFF' },
});
