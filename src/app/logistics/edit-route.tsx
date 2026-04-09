import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { useLogisticsStore } from '@/stores/useLogisticsStore';
import { mockHubs } from '@/services/mock/hubs';
import { mockRoutes } from '@/services/mock/routes';
import { RouteType, TransportMode, PackageSize, WeekDay } from '@/types/logistics';

const TRANSPORT_MODES: { id: TransportMode; emoji: string; label: string }[] = [
  { id: 'foot', emoji: '🚶', label: 'À pied' },
  { id: 'bike', emoji: '🚴', label: 'Vélo' },
  { id: 'scooter', emoji: '🛵', label: 'Scooter' },
  { id: 'car', emoji: '🚗', label: 'Voiture' },
  { id: 'bus', emoji: '🚌', label: 'Bus' },
  { id: 'train', emoji: '🚆', label: 'Train' },
];

const SIZE_OPTIONS: PackageSize[] = ['XS', 'S', 'M', 'L', 'XL'];
const DAYS: WeekDay[] = ['L', 'Ma', 'Me', 'J', 'V', 'S', 'D'];

export default function EditRouteScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();

  const { mission, isHubLocked } = useLogisticsStore();
  const route = mockRoutes.find((r) => r.id === (params.id ?? 'r1')) ?? mockRoutes[0];

  // Determine if route has active mission
  const hasActiveMission = mission != null
    && mission.status !== 'completed'
    && mission.status !== 'cancelled'
    && mission.status !== 'idle'
    && mission.handoff.routeId === route.id;

  // Editable state pre-filled from route
  const [routeType, setRouteType] = useState<RouteType>(route.routeType);
  const [transportMode, setTransportMode] = useState<TransportMode>(route.transportMode);
  const [maxPackages, setMaxPackages] = useState(route.maxPackages);
  const [maxSize, setMaxSize] = useState<PackageSize>(route.maxSize);
  const [maxWeight, setMaxWeight] = useState(route.maxWeight);
  const [offHubPossible, setOffHubPossible] = useState(route.offHubPossible);
  const [recurringDays, setRecurringDays] = useState<WeekDay[]>(route.recurringDays);
  const [saved, setSaved] = useState(false);

  const departureHub = mockHubs.find((h) => h.id === route.departureHubId);
  const deliveryHubs = route.deliveryHubIds.map((id) => mockHubs.find((h) => h.id === id)).filter(Boolean);

  const toggleDay = useCallback((day: WeekDay) => {
    if (hasActiveMission) return;
    setRecurringDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  }, [hasActiveMission]);

  const handleSave = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setSaved(true);
  };

  if (saved) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.successWrap, { paddingTop: insets.top + 80 }]}>
          <Animated.View entering={FadeIn.duration(400)} style={styles.successContent}>
            <View style={[styles.successIcon, { backgroundColor: `${theme.success}15` }]}>
              <Feather name="check-circle" size={56} color={theme.success} />
            </View>
            <Text style={[styles.successTitle, { color: theme.text }]}>Trajet mis à jour !</Text>
            <Text style={[styles.successSub, { color: theme.textSecondary }]}>
              Vos modifications ont été enregistrées.
            </Text>
            <TouchableOpacity onPress={() => router.back()} style={{ marginTop: Spacing.xxl }}>
              <LinearGradient
                colors={[theme.primary, theme.primaryGradientEnd]}
                style={styles.primaryBtn}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Feather name="arrow-left" size={18} color="#FFF" />
                <Text style={styles.primaryBtnText}>Retour</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    );
  }

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
        <Text style={styles.headerTitle}>Modifier le trajet</Text>
      </LinearGradient>

      {/* Active mission warning */}
      {hasActiveMission && (
        <View style={[styles.warningBanner, { backgroundColor: `${theme.warning}10`, borderBottomColor: `${theme.warning}25` }]}>
          <Feather name="alert-triangle" size={16} color={theme.warning} />
          <Text style={[styles.warningText, { color: theme.warning }]}>
            Ce trajet a une mission en cours. Certaines modifications sont limitées.
          </Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* Route type */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Type de trajet</Text>
        <View style={styles.chipRow}>
          {(['recurring', 'oneoff'] as RouteType[]).map((type) => {
            const selected = routeType === type;
            const locked = hasActiveMission;
            return (
              <TouchableOpacity
                key={type}
                disabled={locked}
                onPress={() => setRouteType(type)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: selected ? `${theme.primary}15` : theme.surface,
                    borderColor: selected ? theme.primary : theme.border,
                    opacity: locked ? 0.5 : 1,
                  },
                ]}
              >
                <Text style={[styles.chipText, { color: selected ? theme.primary : theme.text }]}>
                  {type === 'recurring' ? 'Récurrent' : 'Ponctuel'}
                </Text>
                {locked && <Feather name="lock" size={12} color={theme.textSecondary} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Corridor (read-only if active mission) */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Corridor</Text>
        <View style={[styles.infoCard, { backgroundColor: theme.surface, borderColor: theme.border, opacity: hasActiveMission ? 0.6 : 1 }]}>
          <View style={styles.corridorRow}>
            <Feather name="map-pin" size={14} color={theme.success} />
            <Text style={[styles.corridorCity, { color: theme.text }]}>{route.origin.city}</Text>
            <Feather name="arrow-right" size={14} color={theme.textSecondary} />
            <Feather name="map-pin" size={14} color={theme.error} />
            <Text style={[styles.corridorCity, { color: theme.text }]}>{route.destination.city}</Text>
          </View>
          {hasActiveMission && (
            <View style={styles.lockedRow}>
              <Feather name="lock" size={11} color={theme.textSecondary} />
              <Text style={[styles.lockedText, { color: theme.textSecondary }]}>Verrouillé pendant la mission</Text>
            </View>
          )}
        </View>

        {/* Hubs (locked if active mission) */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Hubs</Text>
        <View style={[styles.infoCard, { backgroundColor: theme.surface, borderColor: theme.border, opacity: hasActiveMission ? 0.6 : 1 }]}>
          <View style={{ gap: Spacing.sm }}>
            <View style={styles.hubRow}>
              <View style={[styles.hubDot, { backgroundColor: theme.success }]} />
              <Text style={[styles.hubText, { color: theme.text }]}>Départ : {departureHub?.name ?? '—'}</Text>
            </View>
            {deliveryHubs.map((hub) => (
              <View key={hub!.id} style={styles.hubRow}>
                <View style={[styles.hubDot, { backgroundColor: theme.error }]} />
                <Text style={[styles.hubText, { color: theme.text }]}>Arrivée : {hub!.name}</Text>
              </View>
            ))}
          </View>
          {hasActiveMission && (
            <View style={styles.lockedRow}>
              <Feather name="lock" size={11} color={theme.textSecondary} />
              <Text style={[styles.lockedText, { color: theme.textSecondary }]}>Verrouillé pendant la mission</Text>
            </View>
          )}
        </View>

        {/* Schedule (locked if active mission) */}
        {routeType === 'recurring' && (
          <>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Jours de passage</Text>
            <View style={[styles.chipRow, { opacity: hasActiveMission ? 0.5 : 1 }]}>
              {DAYS.map((day) => {
                const selected = recurringDays.includes(day);
                return (
                  <TouchableOpacity
                    key={day}
                    disabled={hasActiveMission}
                    onPress={() => toggleDay(day)}
                    style={[
                      styles.dayChip,
                      {
                        backgroundColor: selected ? theme.primary : theme.surface,
                        borderColor: selected ? theme.primary : theme.border,
                      },
                    ]}
                  >
                    <Text style={[styles.dayText, { color: selected ? '#FFF' : theme.text }]}>
                      {day}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {/* Transport mode (editable) */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Mode de transport</Text>
        <View style={styles.chipRow}>
          {TRANSPORT_MODES.map((mode) => {
            const selected = transportMode === mode.id;
            return (
              <TouchableOpacity
                key={mode.id}
                onPress={() => setTransportMode(mode.id)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: selected ? `${theme.primary}15` : theme.surface,
                    borderColor: selected ? theme.primary : theme.border,
                  },
                ]}
              >
                <Text style={styles.modeEmoji}>{mode.emoji}</Text>
                <Text style={[styles.chipText, { color: selected ? theme.primary : theme.text }]}>
                  {mode.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Capacity (editable) */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Capacité</Text>
        <View style={[styles.infoCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.capacityRow}>
            <Text style={[styles.capacityLabel, { color: theme.textSecondary }]}>Colis max</Text>
            <View style={styles.stepper}>
              <TouchableOpacity onPress={() => setMaxPackages(Math.max(1, maxPackages - 1))} style={[styles.stepperBtn, { borderColor: theme.border }]}>
                <Feather name="minus" size={14} color={theme.text} />
              </TouchableOpacity>
              <Text style={[styles.stepperValue, { color: theme.text }]}>{maxPackages}</Text>
              <TouchableOpacity onPress={() => setMaxPackages(maxPackages + 1)} style={[styles.stepperBtn, { borderColor: theme.border }]}>
                <Feather name="plus" size={14} color={theme.text} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.capacityRow}>
            <Text style={[styles.capacityLabel, { color: theme.textSecondary }]}>Taille max</Text>
            <View style={styles.sizeRow}>
              {SIZE_OPTIONS.map((size) => (
                <TouchableOpacity
                  key={size}
                  onPress={() => setMaxSize(size)}
                  style={[
                    styles.sizeChip,
                    {
                      backgroundColor: maxSize === size ? theme.primary : theme.surface,
                      borderColor: maxSize === size ? theme.primary : theme.border,
                    },
                  ]}
                >
                  <Text style={[styles.sizeText, { color: maxSize === size ? '#FFF' : theme.text }]}>
                    {size}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.capacityRow}>
            <Text style={[styles.capacityLabel, { color: theme.textSecondary }]}>Poids max (kg)</Text>
            <View style={styles.stepper}>
              <TouchableOpacity onPress={() => setMaxWeight(Math.max(1, maxWeight - 1))} style={[styles.stepperBtn, { borderColor: theme.border }]}>
                <Feather name="minus" size={14} color={theme.text} />
              </TouchableOpacity>
              <Text style={[styles.stepperValue, { color: theme.text }]}>{maxWeight}</Text>
              <TouchableOpacity onPress={() => setMaxWeight(maxWeight + 1)} style={[styles.stepperBtn, { borderColor: theme.border }]}>
                <Feather name="plus" size={14} color={theme.text} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Off-hub option (editable) */}
        <View style={[styles.switchRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[styles.switchLabel, { color: theme.text }]}>Livraison hors hub possible</Text>
            <Text style={[styles.switchHint, { color: theme.textSecondary }]}>
              Permettre au destinataire de récupérer le colis en dehors d'un hub
            </Text>
          </View>
          <Switch
            value={offHubPossible}
            onValueChange={setOffHubPossible}
            trackColor={{ false: theme.border, true: `${theme.primary}60` }}
            thumbColor={offHubPossible ? theme.primary : '#F3F4F6'}
          />
        </View>

        {/* Save button */}
        <TouchableOpacity onPress={handleSave} style={{ marginTop: Spacing.lg }}>
          <LinearGradient
            colors={[theme.primary, theme.primaryGradientEnd]}
            style={styles.primaryBtn}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Feather name="save" size={18} color="#FFF" />
            <Text style={styles.primaryBtnText}>Enregistrer les modifications</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { ...Typography.h3, color: '#FFF', flex: 1 },
  body: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: 100 },

  // Warning banner
  warningBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  warningText: { ...Typography.caption, flex: 1 },

  // Section
  sectionTitle: { ...Typography.bodyMedium, fontFamily: 'Poppins_600SemiBold', marginTop: Spacing.sm },

  // Chips
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full, borderWidth: 1,
  },
  chipText: { ...Typography.captionMedium },
  modeEmoji: { fontSize: 16 },

  // Info card
  infoCard: {
    padding: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1, gap: Spacing.sm,
  },
  corridorRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
  },
  corridorCity: { ...Typography.bodyMedium },
  hubRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  hubDot: { width: 8, height: 8, borderRadius: 4 },
  hubText: { ...Typography.body },
  lockedRow: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: Spacing.xs,
  },
  lockedText: { ...Typography.caption, fontSize: 11 },

  // Days
  dayChip: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },
  dayText: { ...Typography.captionMedium, fontSize: 12 },

  // Capacity
  capacityRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  capacityLabel: { ...Typography.body },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  stepperBtn: {
    width: 30, height: 30, borderRadius: 15, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  stepperValue: { ...Typography.h3, minWidth: 24, textAlign: 'center' },
  sizeRow: { flexDirection: 'row', gap: Spacing.xs },
  sizeChip: {
    paddingHorizontal: Spacing.sm, paddingVertical: 4,
    borderRadius: BorderRadius.sm, borderWidth: 1,
  },
  sizeText: { ...Typography.captionMedium, fontSize: 12 },

  // Switch row
  switchRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    padding: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1,
  },
  switchLabel: { ...Typography.bodyMedium },
  switchHint: { ...Typography.caption, fontSize: 11 },

  // Button
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, paddingVertical: 14, borderRadius: BorderRadius.md,
  },
  primaryBtnText: { ...Typography.button, color: '#FFF' },

  // Success
  successWrap: { flex: 1, alignItems: 'center' },
  successContent: { alignItems: 'center', gap: Spacing.lg, maxWidth: 300 },
  successIcon: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center' },
  successTitle: { ...Typography.h1, textAlign: 'center' },
  successSub: { ...Typography.body, textAlign: 'center' },
});
