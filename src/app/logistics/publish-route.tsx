import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  FlatList,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeOut, SlideInRight, SlideOutLeft } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { Colors, ThemeColors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import { useLogisticsStore, PublishDraft } from '@/stores/useLogisticsStore';
import { mockHubs } from '@/services/mock/hubs';
import { Hub, RouteType, TransportMode, PackageSize, WeekDay } from '@/types/logistics';
import { StatusToggle } from '@/components/logistics/StatusToggle';

const { width: W } = Dimensions.get('window');
const TOTAL_STEPS = 9;

// ── Constants ─────────────────────────────────────────────────────────────

const CITIES = [
  'Nice', 'Cannes', 'Marseille', 'Toulon', 'Antibes',
  'Fréjus', 'Monaco', 'Menton', 'Grasse', 'Hyères',
  'Saint-Raphaël', 'La Seyne-sur-Mer', 'Draguignan', 'Mandelieu',
];

const TRANSPORT_MODES: { id: TransportMode; emoji: string; label: string }[] = [
  { id: 'foot', emoji: '🚶', label: 'À pied' },
  { id: 'bike', emoji: '🚴', label: 'Vélo' },
  { id: 'scooter', emoji: '🛵', label: 'Scooter' },
  { id: 'car', emoji: '🚗', label: 'Voiture' },
  { id: 'bus', emoji: '🚌', label: 'Bus' },
  { id: 'train', emoji: '🚆', label: 'Train' },
];

const SIZE_OPTIONS: { key: PackageSize; desc: string }[] = [
  { key: 'XS', desc: 'Enveloppe' },
  { key: 'S', desc: 'Boîte à chaussures' },
  { key: 'M', desc: 'Carton moyen' },
  { key: 'L', desc: 'Grand carton' },
  { key: 'XL', desc: 'Très volumineux' },
];

const DAYS: WeekDay[] = ['L', 'Ma', 'Me', 'J', 'V', 'S', 'D'];

// ── Helpers ───────────────────────────────────────────────────────────────

function toleranceWindow(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const totalMin = h * 60 + m;
  const from = totalMin - 10;
  const to = totalMin + 10;
  const fmt = (mins: number) => {
    const hh = Math.floor(((mins % 1440) + 1440) % 1440 / 60);
    const mm = ((mins % 1440) + 1440) % 1440 % 60;
    return `${hh}h${mm.toString().padStart(2, '0')}`;
  };
  return `${fmt(from)} – ${fmt(to)}`;
}

function stepLabel(step: number): string {
  const labels = [
    'Type de trajet',
    'Villes',
    'Hub départ',
    'Hubs arrivée',
    'Horaires',
    'Transport',
    'Capacité',
    'Option hors hub',
    'Récapitulatif',
  ];
  return labels[step] ?? '';
}

// ── Screen ────────────────────────────────────────────────────────────────

export default function PublishRouteScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { draft, updateDraft, resetDraft, isHubLocked, lockedHubId, transporterStatus } = useLogisticsStore();
  const [step, setStep] = useState(0);
  const [published, setPublished] = useState(false);
  const lockedHub = isHubLocked ? mockHubs.find((h) => h.id === lockedHubId) : null;

  const canNext = useMemo(() => {
    switch (step) {
      case 0: return draft.routeType !== null;
      case 1: return draft.departureCity !== '' && draft.arrivalCity !== '' && draft.departureCity !== draft.arrivalCity;
      case 2: return draft.departureHubId !== null;
      case 3: return draft.deliveryHubIds.length > 0;
      case 4: return draft.departureTime !== '' && draft.arrivalTime !== '';
      case 5: return draft.transportMode !== null;
      case 6: return draft.maxPackages > 0 && draft.maxWeight > 0;
      case 7: return true;
      case 8: return true;
      default: return false;
    }
  }, [step, draft]);

  const next = useCallback(() => {
    if (step < TOTAL_STEPS - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      setStep(step + 1);
    }
  }, [step]);

  const prev = useCallback(() => {
    if (step > 0) setStep(step - 1);
    else router.back();
  }, [step, router]);

  const jumpTo = useCallback((s: number) => setStep(s), []);

  const handlePublish = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setPublished(true);
  }, []);

  const handleDone = useCallback(() => {
    resetDraft();
    router.back();
  }, [resetDraft, router]);

  // ── Published success ───────────────────────────────────────────────
  if (published) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.successWrap, { paddingTop: insets.top + 60 }]}>
          <Animated.View entering={FadeIn.duration(400)} style={styles.successContent}>
            <View style={[styles.successIcon, { backgroundColor: `${theme.success}15` }]}>
              <Feather name="check-circle" size={56} color={theme.success} />
            </View>
            <Text style={[styles.successTitle, { color: theme.text }]}>Trajet publié !</Text>
            <Text style={[styles.successSub, { color: theme.textSecondary }]}>
              Vous serez notifié dès qu'un colis correspond à votre route. Merci pour votre
              participation !
            </Text>
            <TouchableOpacity onPress={handleDone} style={{ marginTop: Spacing.xxl }}>
              <LinearGradient
                colors={[theme.primary, theme.primaryGradientEnd]}
                style={styles.primaryBtn}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Feather name="home" size={18} color="#FFF" />
                <Text style={styles.primaryBtnText}>Retour</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    );
  }

  // ── Main flow ───────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <LinearGradient
        colors={[theme.primary, theme.primaryGradientEnd]}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <TouchableOpacity onPress={prev} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color="#FFF" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Publier un trajet</Text>
          <Text style={styles.headerSub}>{stepLabel(step)}</Text>
        </View>
        <Text style={styles.stepCounter}>{step + 1}/{TOTAL_STEPS}</Text>
      </LinearGradient>

      {/* Status toggle (transporter active/offline) */}
      <View style={{ paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm }}>
        <StatusToggle />
      </View>

      {/* Progress bar */}
      <View style={[styles.progressTrack, { backgroundColor: theme.border }]}>
        <Animated.View
          style={[
            styles.progressFill,
            { width: `${((step + 1) / TOTAL_STEPS) * 100}%`, backgroundColor: theme.primary },
          ]}
        />
      </View>

      {/* Active mission / locked hub banner */}
      {isHubLocked && lockedHub && (
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, backgroundColor: `${theme.warning}08`, borderBottomWidth: 1, borderBottomColor: `${theme.warning}20` }}>
          <Feather name="lock" size={14} color={theme.warning} />
          <Text style={[Typography.caption, { color: theme.warning, flex: 1 }]}>
            Vous avez une mission en cours. Les nouvelles missions seront proposées sur votre hub actif ({lockedHub.name}).
          </Text>
        </View>
      )}

      {/* Offline banner */}
      {transporterStatus === 'offline' && (
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, backgroundColor: `${theme.textSecondary}08`, borderBottomWidth: 1, borderBottomColor: `${theme.textSecondary}15` }}>
          <Feather name="wifi-off" size={14} color={theme.textSecondary} />
          <Text style={[Typography.caption, { color: theme.textSecondary, flex: 1 }]}>
            Vous êtes hors ligne. Vos trajets ne sont pas visibles pour le moment.
          </Text>
        </View>
      )}

      {/* Steps */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {step === 0 && <Step0RouteType draft={draft} updateDraft={updateDraft} theme={theme} />}
        {step === 1 && <Step1Cities draft={draft} updateDraft={updateDraft} theme={theme} />}
        {step === 2 && <Step2DepartureHub draft={draft} updateDraft={updateDraft} theme={theme} />}
        {step === 3 && <Step3DeliveryHubs draft={draft} updateDraft={updateDraft} theme={theme} />}
        {step === 4 && <Step4Schedule draft={draft} updateDraft={updateDraft} theme={theme} />}
        {step === 5 && <Step5Transport draft={draft} updateDraft={updateDraft} theme={theme} />}
        {step === 6 && <Step6Capacity draft={draft} updateDraft={updateDraft} theme={theme} />}
        {step === 7 && <Step7OffHub draft={draft} updateDraft={updateDraft} theme={theme} />}
        {step === 8 && <Step8Summary draft={draft} theme={theme} jumpTo={jumpTo} />}
      </ScrollView>

      {/* Bottom bar */}
      <View
        style={[
          styles.bottomBar,
          { backgroundColor: theme.surface, borderTopColor: theme.border, paddingBottom: insets.bottom + 8 },
        ]}
      >
        {step < TOTAL_STEPS - 1 ? (
          <TouchableOpacity
            onPress={next}
            disabled={!canNext}
            style={{ opacity: canNext ? 1 : 0.45 }}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[theme.primary, theme.primaryGradientEnd]}
              style={styles.primaryBtn}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.primaryBtnText}>Continuer</Text>
              <Feather name="arrow-right" size={18} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={handlePublish} activeOpacity={0.85}>
            <LinearGradient
              colors={[theme.success, '#059669']}
              style={styles.primaryBtn}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Feather name="check" size={18} color="#FFF" />
              <Text style={styles.primaryBtnText}>Publier le trajet</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STEP COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

type StepProps = { draft: PublishDraft; updateDraft: (p: Partial<PublishDraft>) => void; theme: ThemeColors };

// ── Step 0: Route type ────────────────────────────────────────────────────

function Step0RouteType({ draft, updateDraft, theme }: StepProps) {
  const options: { key: RouteType; emoji: string; title: string; subtitle: string }[] = [
    { key: 'recurring', emoji: '🔄', title: 'Trajet récurrent', subtitle: 'Domicile-travail, déplacement habituel' },
    { key: 'oneoff', emoji: '📍', title: 'Trajet ponctuel', subtitle: 'Trajet exceptionnel, unique ou occasionnel' },
  ];
  return (
    <Animated.View entering={FadeIn} style={styles.stepWrap}>
      <Text style={[styles.stepTitle, { color: theme.text }]}>Quel type de trajet proposez-vous ?</Text>
      <Text style={[styles.stepSub, { color: theme.textSecondary }]}>
        Cela nous aide à mieux vous proposer des colis correspondants.
      </Text>
      <View style={styles.cardsCol}>
        {options.map((o) => {
          const selected = draft.routeType === o.key;
          return (
            <TouchableOpacity
              key={o.key}
              style={[
                styles.bigCard,
                {
                  backgroundColor: selected ? `${theme.primary}10` : theme.surface,
                  borderColor: selected ? theme.primary : theme.border,
                },
              ]}
              onPress={() => updateDraft({ routeType: o.key })}
              activeOpacity={0.7}
            >
              <Text style={styles.bigCardEmoji}>{o.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.bigCardTitle, { color: theme.text }]}>{o.title}</Text>
                <Text style={[styles.bigCardSub, { color: theme.textSecondary }]}>{o.subtitle}</Text>
              </View>
              {selected && <Feather name="check-circle" size={22} color={theme.primary} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </Animated.View>
  );
}

// ── Step 1: Cities ────────────────────────────────────────────────────────

function Step1Cities({ draft, updateDraft, theme }: StepProps) {
  const [depSearch, setDepSearch] = useState('');
  const [arrSearch, setArrSearch] = useState('');
  const [focus, setFocus] = useState<'dep' | 'arr' | null>(null);

  const depFiltered = CITIES.filter(
    (c) => c.toLowerCase().includes(depSearch.toLowerCase()) && c !== draft.arrivalCity,
  );
  const arrFiltered = CITIES.filter(
    (c) => c.toLowerCase().includes(arrSearch.toLowerCase()) && c !== draft.departureCity,
  );

  return (
    <Animated.View entering={FadeIn} style={styles.stepWrap}>
      <Text style={[styles.stepTitle, { color: theme.text }]}>Votre corridor de trajet</Text>
      <Text style={[styles.stepSub, { color: theme.textSecondary }]}>
        Indiquez les villes de départ et d'arrivée. Votre adresse personnelle reste confidentielle.
      </Text>

      {/* Departure */}
      <Text style={[styles.fieldLabel, { color: theme.text }]}>Ville de départ</Text>
      <View style={[styles.inputRow, { backgroundColor: theme.surface, borderColor: focus === 'dep' ? theme.primary : theme.border }]}>
        <Feather name="map-pin" size={16} color={theme.success} />
        <TextInput
          style={[styles.input, { color: theme.text }]}
          placeholder="Rechercher une ville..."
          placeholderTextColor={theme.textSecondary}
          value={draft.departureCity || depSearch}
          onChangeText={(t) => { setDepSearch(t); if (draft.departureCity) updateDraft({ departureCity: '', departureHubId: null }); }}
          onFocus={() => setFocus('dep')}
          onBlur={() => setTimeout(() => setFocus(null), 150)}
        />
        {draft.departureCity !== '' && (
          <TouchableOpacity onPress={() => { updateDraft({ departureCity: '', departureHubId: null }); setDepSearch(''); }}>
            <Feather name="x" size={16} color={theme.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
      {focus === 'dep' && depSearch.length > 0 && !draft.departureCity && (
        <View style={[styles.suggestions, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {depFiltered.map((c) => (
            <TouchableOpacity
              key={c}
              style={styles.suggestionRow}
              onPress={() => { updateDraft({ departureCity: c, departureHubId: null }); setDepSearch(''); setFocus(null); }}
            >
              <Feather name="map-pin" size={14} color={theme.textSecondary} />
              <Text style={[styles.suggestionText, { color: theme.text }]}>{c}</Text>
            </TouchableOpacity>
          ))}
          {depFiltered.length === 0 && (
            <Text style={[styles.suggestionEmpty, { color: theme.textSecondary }]}>Aucune ville trouvée</Text>
          )}
        </View>
      )}

      {/* Arrow */}
      {draft.departureCity !== '' && draft.arrivalCity !== '' && (
        <View style={styles.corridorArrow}>
          <View style={[styles.corridorPill, { backgroundColor: `${theme.primary}12` }]}>
            <Text style={[styles.corridorCity, { color: theme.primary }]}>{draft.departureCity}</Text>
            <Feather name="arrow-right" size={16} color={theme.primary} />
            <Text style={[styles.corridorCity, { color: theme.primary }]}>{draft.arrivalCity}</Text>
          </View>
        </View>
      )}

      {/* Arrival */}
      <Text style={[styles.fieldLabel, { color: theme.text, marginTop: Spacing.lg }]}>Ville d'arrivée</Text>
      <View style={[styles.inputRow, { backgroundColor: theme.surface, borderColor: focus === 'arr' ? theme.primary : theme.border }]}>
        <Feather name="map-pin" size={16} color={theme.error} />
        <TextInput
          style={[styles.input, { color: theme.text }]}
          placeholder="Rechercher une ville..."
          placeholderTextColor={theme.textSecondary}
          value={draft.arrivalCity || arrSearch}
          onChangeText={(t) => { setArrSearch(t); if (draft.arrivalCity) updateDraft({ arrivalCity: '', deliveryHubIds: [] }); }}
          onFocus={() => setFocus('arr')}
          onBlur={() => setTimeout(() => setFocus(null), 150)}
        />
        {draft.arrivalCity !== '' && (
          <TouchableOpacity onPress={() => { updateDraft({ arrivalCity: '', deliveryHubIds: [] }); setArrSearch(''); }}>
            <Feather name="x" size={16} color={theme.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
      {focus === 'arr' && arrSearch.length > 0 && !draft.arrivalCity && (
        <View style={[styles.suggestions, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {arrFiltered.map((c) => (
            <TouchableOpacity
              key={c}
              style={styles.suggestionRow}
              onPress={() => { updateDraft({ arrivalCity: c, deliveryHubIds: [] }); setArrSearch(''); setFocus(null); }}
            >
              <Feather name="map-pin" size={14} color={theme.textSecondary} />
              <Text style={[styles.suggestionText, { color: theme.text }]}>{c}</Text>
            </TouchableOpacity>
          ))}
          {arrFiltered.length === 0 && (
            <Text style={[styles.suggestionEmpty, { color: theme.textSecondary }]}>Aucune ville trouvée</Text>
          )}
        </View>
      )}
    </Animated.View>
  );
}

// ── Step 2: Departure hub ─────────────────────────────────────────────────

function Step2DepartureHub({ draft, updateDraft, theme }: StepProps) {
  const cityHubs = mockHubs.filter((h) => h.city === draft.departureCity && h.status === 'active');
  const selected = cityHubs.find((h) => h.id === draft.departureHubId);

  return (
    <Animated.View entering={FadeIn} style={styles.stepWrap}>
      <Text style={[styles.stepTitle, { color: theme.text }]}>Hub de récupération</Text>
      <Text style={[styles.stepSub, { color: theme.textSecondary }]}>
        Choisissez le hub où vous récupérerez les colis à {draft.departureCity}.
      </Text>
      {cityHubs.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Feather name="map-pin" size={24} color={theme.textSecondary} />
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            Aucun hub disponible à {draft.departureCity} pour le moment.
          </Text>
        </View>
      ) : (
        <View style={styles.cardsCol}>
          {cityHubs.map((hub) => (
            <HubCard
              key={hub.id}
              hub={hub}
              selected={draft.departureHubId === hub.id}
              onPress={() => updateDraft({ departureHubId: hub.id })}
              theme={theme}
            />
          ))}
        </View>
      )}
    </Animated.View>
  );
}

// ── Step 3: Delivery hubs (multi-select, max 3) ──────────────────────────

function Step3DeliveryHubs({ draft, updateDraft, theme }: StepProps) {
  const cityHubs = mockHubs.filter((h) => h.city === draft.arrivalCity && h.status === 'active');
  const count = draft.deliveryHubIds.length;

  const toggle = (id: string) => {
    if (draft.deliveryHubIds.includes(id)) {
      updateDraft({ deliveryHubIds: draft.deliveryHubIds.filter((x) => x !== id) });
    } else if (count < 3) {
      updateDraft({ deliveryHubIds: [...draft.deliveryHubIds, id] });
    }
  };

  return (
    <Animated.View entering={FadeIn} style={styles.stepWrap}>
      <View style={styles.stepTitleRow}>
        <Text style={[styles.stepTitle, { color: theme.text, flex: 1 }]}>Hubs de livraison</Text>
        <View style={[styles.counterPill, { backgroundColor: `${theme.primary}15` }]}>
          <Text style={[styles.counterText, { color: theme.primary }]}>{count}/3</Text>
        </View>
      </View>
      <Text style={[styles.stepSub, { color: theme.textSecondary }]}>
        Sélectionnez jusqu'à 3 hubs à {draft.arrivalCity} pour augmenter vos chances de matching.
      </Text>
      {cityHubs.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Feather name="map-pin" size={24} color={theme.textSecondary} />
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            Aucun hub disponible à {draft.arrivalCity} pour le moment.
          </Text>
        </View>
      ) : (
        <View style={styles.cardsCol}>
          {cityHubs.map((hub) => (
            <HubCard
              key={hub.id}
              hub={hub}
              selected={draft.deliveryHubIds.includes(hub.id)}
              onPress={() => toggle(hub.id)}
              theme={theme}
              disabled={!draft.deliveryHubIds.includes(hub.id) && count >= 3}
            />
          ))}
        </View>
      )}
    </Animated.View>
  );
}

// ── Step 4: Schedule ──────────────────────────────────────────────────────

function Step4Schedule({ draft, updateDraft, theme }: StepProps) {
  const isRecurring = draft.routeType === 'recurring';

  const toggleDay = (d: WeekDay) => {
    if (draft.recurringDays.includes(d)) {
      updateDraft({ recurringDays: draft.recurringDays.filter((x) => x !== d) });
    } else {
      updateDraft({ recurringDays: [...draft.recurringDays, d] });
    }
  };

  return (
    <Animated.View entering={FadeIn} style={styles.stepWrap}>
      <Text style={[styles.stepTitle, { color: theme.text }]}>Horaires de passage aux hubs</Text>
      <Text style={[styles.stepSub, { color: theme.textSecondary }]}>
        Indiquez l'heure à laquelle vous serez réellement au hub. La plateforme ajoutera
        automatiquement une fenêtre de tolérance de ±10 min.
      </Text>

      {/* Departure time */}
      <Text style={[styles.fieldLabel, { color: theme.text }]}>Passage au hub vendeur</Text>
      <TimeInput
        value={draft.departureTime}
        onChange={(t) => updateDraft({ departureTime: t })}
        theme={theme}
      />
      <Text style={[styles.toleranceText, { color: theme.primary }]}>
        Fenêtre : {toleranceWindow(draft.departureTime)}
      </Text>

      {/* Arrival time */}
      <Text style={[styles.fieldLabel, { color: theme.text, marginTop: Spacing.lg }]}>Passage au hub acheteur</Text>
      <TimeInput
        value={draft.arrivalTime}
        onChange={(t) => updateDraft({ arrivalTime: t })}
        theme={theme}
      />
      <Text style={[styles.toleranceText, { color: theme.primary }]}>
        Fenêtre : {toleranceWindow(draft.arrivalTime)}
      </Text>

      {/* Recurring days */}
      {isRecurring && (
        <View style={{ marginTop: Spacing.xl }}>
          <Text style={[styles.fieldLabel, { color: theme.text }]}>Jours de récurrence</Text>
          <View style={styles.dayRow}>
            {DAYS.map((d) => {
              const active = draft.recurringDays.includes(d);
              return (
                <TouchableOpacity
                  key={d}
                  style={[
                    styles.dayChip,
                    {
                      backgroundColor: active ? theme.primary : theme.surface,
                      borderColor: active ? theme.primary : theme.border,
                    },
                  ]}
                  onPress={() => toggleDay(d)}
                >
                  <Text style={[styles.dayChipText, { color: active ? '#FFF' : theme.textSecondary }]}>
                    {d}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}
    </Animated.View>
  );
}

// ── Step 5: Transport mode ────────────────────────────────────────────────

function Step5Transport({ draft, updateDraft, theme }: StepProps) {
  return (
    <Animated.View entering={FadeIn} style={styles.stepWrap}>
      <Text style={[styles.stepTitle, { color: theme.text }]}>Moyen de transport</Text>
      <Text style={[styles.stepSub, { color: theme.textSecondary }]}>
        Votre moyen de transport détermine la taille et le poids des colis qu'on vous proposera.
      </Text>
      <View style={styles.transportGrid}>
        {TRANSPORT_MODES.map((m) => {
          const selected = draft.transportMode === m.id;
          return (
            <TouchableOpacity
              key={m.id}
              style={[
                styles.transportCard,
                {
                  backgroundColor: selected ? `${theme.primary}10` : theme.surface,
                  borderColor: selected ? theme.primary : theme.border,
                },
              ]}
              onPress={() => updateDraft({ transportMode: m.id })}
              activeOpacity={0.7}
            >
              <Text style={styles.transportEmoji}>{m.emoji}</Text>
              <Text style={[styles.transportLabel, { color: selected ? theme.primary : theme.text }]}>
                {m.label}
              </Text>
              {selected && (
                <View style={[styles.transportCheck, { backgroundColor: theme.primary }]}>
                  <Feather name="check" size={10} color="#FFF" />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </Animated.View>
  );
}

// ── Step 6: Capacity ──────────────────────────────────────────────────────

function Step6Capacity({ draft, updateDraft, theme }: StepProps) {
  return (
    <Animated.View entering={FadeIn} style={styles.stepWrap}>
      <Text style={[styles.stepTitle, { color: theme.text }]}>Capacité de transport</Text>
      <Text style={[styles.stepSub, { color: theme.textSecondary }]}>
        Ces informations servent de filtres automatiques avant de vous proposer des colis.
      </Text>

      {/* Max packages */}
      <Text style={[styles.fieldLabel, { color: theme.text }]}>Nombre maximum de colis</Text>
      <Stepper
        value={draft.maxPackages}
        min={1}
        max={10}
        onChange={(v) => updateDraft({ maxPackages: v })}
        theme={theme}
      />

      {/* Max size */}
      <Text style={[styles.fieldLabel, { color: theme.text, marginTop: Spacing.xl }]}>Taille maximum acceptée</Text>
      <View style={styles.sizeRow}>
        {SIZE_OPTIONS.map((s) => {
          const active = draft.maxSize === s.key;
          return (
            <TouchableOpacity
              key={s.key}
              style={[
                styles.sizeChip,
                {
                  backgroundColor: active ? theme.primary : theme.surface,
                  borderColor: active ? theme.primary : theme.border,
                },
              ]}
              onPress={() => updateDraft({ maxSize: s.key })}
            >
              <Text style={[styles.sizeLabel, { color: active ? '#FFF' : theme.text }]}>{s.key}</Text>
              <Text style={[styles.sizeDesc, { color: active ? 'rgba(255,255,255,0.7)' : theme.textSecondary }]}>
                {s.desc}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Max weight */}
      <Text style={[styles.fieldLabel, { color: theme.text, marginTop: Spacing.xl }]}>Poids maximum (kg)</Text>
      <Stepper
        value={draft.maxWeight}
        min={1}
        max={50}
        step={1}
        onChange={(v) => updateDraft({ maxWeight: v })}
        theme={theme}
        unit="kg"
      />
    </Animated.View>
  );
}

// ── Step 7: Off-hub ───────────────────────────────────────────────────────

function Step7OffHub({ draft, updateDraft, theme }: StepProps) {
  return (
    <Animated.View entering={FadeIn} style={styles.stepWrap}>
      <Text style={[styles.stepTitle, { color: theme.text }]}>Option hors hub</Text>
      <Text style={[styles.stepSub, { color: theme.textSecondary }]}>
        En activant cette option, vous acceptez de façon exceptionnelle d'étudier une prise en
        charge ou remise hors hub. Cette option reste sous votre contrôle total.
      </Text>

      <View style={[styles.toggleCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={[styles.toggleTitle, { color: theme.text }]}>Hors hub possible</Text>
          <Text style={[styles.toggleSub, { color: theme.textSecondary }]}>
            Vous pourrez toujours refuser au cas par cas
          </Text>
        </View>
        <Switch
          value={draft.offHubPossible}
          onValueChange={(v) => updateDraft({ offHubPossible: v })}
          trackColor={{ false: theme.border, true: `${theme.primary}60` }}
          thumbColor={draft.offHubPossible ? theme.primary : '#FFF'}
        />
      </View>

      {draft.offHubPossible && (
        <Animated.View entering={FadeIn} style={[styles.infoCard, { backgroundColor: `${theme.primary}08`, borderColor: `${theme.primary}20` }]}>
          <Feather name="info" size={16} color={theme.primary} />
          <Text style={[styles.infoText, { color: theme.primary }]}>
            Le hors hub reste exceptionnel. Vous serez toujours consulté avant chaque échange et
            pourrez refuser à tout moment.
          </Text>
        </Animated.View>
      )}
    </Animated.View>
  );
}

// ── Step 8: Summary ───────────────────────────────────────────────────────

function Step8Summary({
  draft,
  theme,
  jumpTo,
}: Omit<StepProps, 'updateDraft'> & { jumpTo: (s: number) => void }) {
  const depHub = mockHubs.find((h) => h.id === draft.departureHubId);
  const delHubs = draft.deliveryHubIds.map((id) => mockHubs.find((h) => h.id === id)).filter(Boolean) as Hub[];
  const transport = TRANSPORT_MODES.find((m) => m.id === draft.transportMode);

  return (
    <Animated.View entering={FadeIn} style={styles.stepWrap}>
      <Text style={[styles.stepTitle, { color: theme.text }]}>Récapitulatif</Text>
      <Text style={[styles.stepSub, { color: theme.textSecondary }]}>
        Vérifiez les informations avant de publier. Vous pourrez modifier chaque section.
      </Text>

      <SummaryRow label="Type de trajet" value={draft.routeType === 'recurring' ? '🔄 Récurrent' : '📍 Ponctuel'} theme={theme} onEdit={() => jumpTo(0)} />
      <SummaryRow label="Corridor" value={`${draft.departureCity} → ${draft.arrivalCity}`} theme={theme} onEdit={() => jumpTo(1)} />
      <SummaryRow label="Hub de départ" value={depHub ? `${depHub.name}\n${depHub.address}` : '—'} theme={theme} onEdit={() => jumpTo(2)} />
      <SummaryRow
        label={`Hub${delHubs.length > 1 ? 's' : ''} d'arrivée`}
        value={delHubs.map((h) => h.name).join('\n') || '—'}
        theme={theme}
        onEdit={() => jumpTo(3)}
      />
      <SummaryRow
        label="Horaires"
        value={`Départ : ${draft.departureTime} (${toleranceWindow(draft.departureTime)})\nArrivée : ${draft.arrivalTime} (${toleranceWindow(draft.arrivalTime)})${draft.recurringDays.length > 0 ? `\nJours : ${draft.recurringDays.join(', ')}` : ''}`}
        theme={theme}
        onEdit={() => jumpTo(4)}
      />
      <SummaryRow label="Transport" value={transport ? `${transport.emoji} ${transport.label}` : '—'} theme={theme} onEdit={() => jumpTo(5)} />
      <SummaryRow
        label="Capacité"
        value={`${draft.maxPackages} colis · ${draft.maxSize} max · ${draft.maxWeight} kg`}
        theme={theme}
        onEdit={() => jumpTo(6)}
      />
      <SummaryRow label="Hors hub" value={draft.offHubPossible ? 'Oui (sous contrôle)' : 'Non'} theme={theme} onEdit={() => jumpTo(7)} />
    </Animated.View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// REUSABLE SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

function HubCard({
  hub,
  selected,
  onPress,
  theme,
  disabled,
}: {
  hub: Hub;
  selected: boolean;
  onPress: () => void;
  theme: ThemeColors;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.hubCard,
        {
          backgroundColor: selected ? `${theme.primary}10` : theme.surface,
          borderColor: selected ? theme.primary : theme.border,
          opacity: disabled ? 0.4 : 1,
        },
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <View style={[styles.hubIcon, { backgroundColor: `${selected ? theme.primary : theme.textSecondary}15` }]}>
        <Feather name="map-pin" size={18} color={selected ? theme.primary : theme.textSecondary} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[styles.hubName, { color: theme.text }]}>{hub.name}</Text>
        <Text style={[styles.hubAddr, { color: theme.textSecondary }]}>{hub.address}, {hub.city}</Text>
        <Text style={[styles.hubHours, { color: theme.textSecondary }]}>{hub.operatingHours}</Text>
      </View>
      {selected && <Feather name="check-circle" size={20} color={theme.primary} />}
    </TouchableOpacity>
  );
}

function TimeInput({
  value,
  onChange,
  theme,
}: {
  value: string;
  onChange: (v: string) => void;
  theme: ThemeColors;
}) {
  const handleChange = (text: string) => {
    // Auto-format: allow digits, auto-insert colon after 2 digits
    const digits = text.replace(/[^0-9]/g, '').slice(0, 4);
    if (digits.length <= 2) {
      onChange(digits);
    } else {
      onChange(`${digits.slice(0, 2)}:${digits.slice(2)}`);
    }
  };

  return (
    <View style={[styles.inputRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <Feather name="clock" size={16} color={theme.primary} />
      <TextInput
        style={[styles.input, { color: theme.text }]}
        value={value}
        onChangeText={handleChange}
        placeholder="HH:MM"
        placeholderTextColor={theme.textSecondary}
        keyboardType="number-pad"
        maxLength={5}
      />
    </View>
  );
}

function Stepper({
  value,
  min,
  max,
  step = 1,
  onChange,
  theme,
  unit,
}: {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  theme: ThemeColors;
  unit?: string;
}) {
  return (
    <View style={[styles.stepperRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <TouchableOpacity
        onPress={() => onChange(Math.max(min, value - step))}
        style={[styles.stepperBtn, { borderRightColor: theme.border }]}
        disabled={value <= min}
      >
        <Feather name="minus" size={18} color={value <= min ? theme.border : theme.text} />
      </TouchableOpacity>
      <Text style={[styles.stepperValue, { color: theme.text }]}>
        {value}{unit ? ` ${unit}` : ''}
      </Text>
      <TouchableOpacity
        onPress={() => onChange(Math.min(max, value + step))}
        style={[styles.stepperBtn, { borderLeftColor: theme.border }]}
        disabled={value >= max}
      >
        <Feather name="plus" size={18} color={value >= max ? theme.border : theme.text} />
      </TouchableOpacity>
    </View>
  );
}

function SummaryRow({
  label,
  value,
  theme,
  onEdit,
}: {
  label: string;
  value: string;
  theme: ThemeColors;
  onEdit: () => void;
}) {
  return (
    <View style={[styles.summaryCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>{label}</Text>
        <Text style={[styles.summaryValue, { color: theme.text }]}>{value}</Text>
      </View>
      <TouchableOpacity onPress={onEdit} hitSlop={8}>
        <Text style={[styles.editLink, { color: theme.primary }]}>Modifier</Text>
      </TouchableOpacity>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  stepCounter: { ...Typography.captionMedium, color: 'rgba(255,255,255,0.8)' },

  progressTrack: { height: 3 },
  progressFill: { height: 3, borderRadius: 2 },

  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.lg, paddingBottom: 120 },

  stepWrap: { gap: Spacing.md },
  stepTitle: { ...Typography.h2 },
  stepTitleRow: { flexDirection: 'row', alignItems: 'center' },
  stepSub: { ...Typography.body },

  // Big cards (step 0)
  cardsCol: { gap: Spacing.md },
  bigCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
  },
  bigCardEmoji: { fontSize: 32 },
  bigCardTitle: { ...Typography.h3 },
  bigCardSub: { ...Typography.caption, marginTop: 2 },

  // City input
  fieldLabel: { ...Typography.captionMedium, marginTop: Spacing.sm },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  input: { ...Typography.body, flex: 1 },
  suggestions: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginTop: -4,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
  },
  suggestionText: { ...Typography.body },
  suggestionEmpty: { ...Typography.caption, padding: Spacing.md, textAlign: 'center' },
  corridorArrow: { alignItems: 'center', marginVertical: Spacing.sm },
  corridorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  corridorCity: { ...Typography.captionMedium },

  // Hub cards
  hubCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
  },
  hubIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hubName: { ...Typography.bodyMedium, fontFamily: 'Poppins_600SemiBold' },
  hubAddr: { ...Typography.caption },
  hubHours: { ...Typography.caption, fontSize: 11 },
  counterPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  counterText: { ...Typography.captionMedium },

  // Schedule
  toleranceText: { ...Typography.caption, marginTop: 4 },
  dayRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap', marginTop: Spacing.sm },
  dayChip: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  dayChipText: { ...Typography.captionMedium, fontSize: 13 },

  // Transport grid
  transportGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  transportCard: {
    width: (W - Spacing.lg * 2 - Spacing.md * 2) / 3,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    gap: Spacing.xs,
  },
  transportEmoji: { fontSize: 28 },
  transportLabel: { ...Typography.captionMedium },
  transportCheck: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Size chips
  sizeRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  sizeChip: {
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    gap: 2,
  },
  sizeLabel: { ...Typography.h3, fontSize: 15 },
  sizeDesc: { ...Typography.caption, fontSize: 10 },

  // Stepper
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  stepperBtn: {
    width: 52,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: StyleSheet.hairlineWidth,
    borderLeftWidth: StyleSheet.hairlineWidth,
  },
  stepperValue: { ...Typography.h3, flex: 1, textAlign: 'center' },

  // Toggle & info
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  toggleTitle: { ...Typography.bodyMedium, fontFamily: 'Poppins_600SemiBold' },
  toggleSub: { ...Typography.caption },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  infoText: { ...Typography.caption, flex: 1 },

  // Summary
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  summaryLabel: { ...Typography.captionMedium },
  summaryValue: { ...Typography.body },
  editLink: { ...Typography.captionMedium },

  // Empty
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    padding: Spacing.xxl,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  emptyText: { ...Typography.body, textAlign: 'center' },

  // Bottom bar
  bottomBar: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
  },
  primaryBtnText: { ...Typography.button, color: '#FFF' },

  // Success
  successWrap: { flex: 1, alignItems: 'center', justifyContent: 'flex-start', padding: Spacing.lg },
  successContent: { alignItems: 'center', gap: Spacing.lg, maxWidth: 300 },
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: { ...Typography.h1, textAlign: 'center' },
  successSub: { ...Typography.body, textAlign: 'center' },
});
