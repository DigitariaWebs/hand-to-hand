import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Dimensions,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';
import { Spacing, BorderRadius } from '@/constants/Spacing';
import {
  usePublishStore,
  PhotoItem,
  ListingType,
  AuctionDuration,
} from '@/stores/usePublishStore';

const { width: W, height: H } = Dimensions.get('window');

// ── Constants ─────────────────────────────────────────────────────────────

const CATEGORIES = [
  { key: 'Électronique', icon: '📱' },
  { key: 'Véhicules', icon: '🚗' },
  { key: 'Mode', icon: '👗' },
  { key: 'Maison', icon: '🏠' },
  { key: 'Sport', icon: '⚽' },
  { key: 'Livres', icon: '📚' },
  { key: 'Jeux', icon: '🎮' },
  { key: 'Montres', icon: '⌚' },
  { key: 'Art', icon: '🎨' },
  { key: 'Jardinage', icon: '🌿' },
  { key: 'Autre', icon: '📦' },
];

const CONDITIONS = [
  { key: 'new', label: 'Neuf' },
  { key: 'like_new', label: 'Comme neuf' },
  { key: 'good', label: 'Bon état' },
  { key: 'fair', label: 'Correct' },
  { key: 'poor', label: 'Médiocre' },
];

type FieldSpec = {
  key: string;
  label: string;
  placeholder: string;
  numeric?: boolean;
};

const CATEGORY_FIELDS: Record<string, FieldSpec[]> = {
  Électronique: [
    { key: 'storage', label: 'Stockage', placeholder: 'ex: 128 Go' },
    { key: 'color', label: 'Couleur', placeholder: 'ex: Noir Sidéral' },
    { key: 'battery', label: 'Santé batterie', placeholder: 'ex: 87%' },
    { key: 'screen', label: 'Taille écran', placeholder: 'ex: 6.1"' },
  ],
  Véhicules: [
    { key: 'mileage', label: 'Kilométrage', placeholder: 'ex: 45 000', numeric: true },
    { key: 'year', label: 'Année', placeholder: 'ex: 2020', numeric: true },
    { key: 'fuel', label: 'Carburant', placeholder: 'ex: Essence' },
    { key: 'transmission', label: 'Boîte', placeholder: 'ex: Automatique' },
  ],
  Mode: [
    { key: 'size', label: 'Taille', placeholder: 'ex: M / 38' },
    { key: 'color', label: 'Couleur', placeholder: 'ex: Bleu marine' },
    { key: 'material', label: 'Matière', placeholder: 'ex: Coton 100%' },
  ],
  Montres: [
    { key: 'model', label: 'Modèle', placeholder: 'ex: Submariner' },
    { key: 'material', label: 'Boîtier', placeholder: 'ex: Acier inoxydable' },
    { key: 'diameter', label: 'Diamètre', placeholder: 'ex: 40 mm' },
  ],
  Sport: [
    { key: 'size', label: 'Taille / Pointure', placeholder: 'ex: L / 42' },
    { key: 'color', label: 'Couleur', placeholder: 'ex: Rouge' },
  ],
};

const LISTING_TYPES: {
  key: ListingType;
  icon: string;
  title: string;
  subtitle: string;
}[] = [
  { key: 'fixed', icon: '🏷️', title: 'Prix fixe', subtitle: 'Le prix est non négociable' },
  { key: 'offer', icon: '💬', title: 'Offre libre', subtitle: 'Les acheteurs peuvent négocier' },
  { key: 'auction', icon: '🔨', title: 'Enchère', subtitle: 'Le plus offrant remporte' },
];

const AUCTION_DURATIONS: { key: AuctionDuration; label: string }[] = [
  { key: '24h', label: '24 h' },
  { key: '48h', label: '48 h' },
  { key: '72h', label: '72 h' },
  { key: '7j', label: '7 jours' },
];

const MARKET_HINTS: Record<string, { min: number; max: number }> = {
  Électronique: { min: 150, max: 800 },
  Véhicules: { min: 3000, max: 25000 },
  Mode: { min: 20, max: 200 },
  Maison: { min: 30, max: 500 },
  Sport: { min: 20, max: 300 },
  Livres: { min: 5, max: 30 },
  Jeux: { min: 10, max: 70 },
  Montres: { min: 200, max: 5000 },
  Art: { min: 100, max: 2000 },
  Jardinage: { min: 20, max: 200 },
};

const TOTAL_STEPS = 5;
const STEP_LABELS = ['Photos', 'Détails', 'Prix', 'Livraison', 'Aperçu'];

const BIG_SLOT_SIZE = W - Spacing.xxl * 2;
const SMALL_SLOT_SIZE = (BIG_SLOT_SIZE - Spacing.sm * 3) / 4;

// ── Photo Slot ────────────────────────────────────────────────────────────

function PhotoSlot({
  photo,
  size,
  isBig,
  onAdd,
  onRemove,
}: {
  photo?: PhotoItem;
  size: number;
  isBig?: boolean;
  onAdd: () => void;
  onRemove?: () => void;
}) {
  const height = isBig ? size * 1.15 : size;
  if (photo) {
    return (
      <View
        style={{
          width: size,
          height,
          borderRadius: BorderRadius.md,
          overflow: 'hidden',
        }}
      >
        <Image source={{ uri: photo.uri }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
        {onRemove && (
          <TouchableOpacity
            onPress={onRemove}
            style={ss.removeBtn}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Ionicons name="close" size={12} color="#FFF" />
          </TouchableOpacity>
        )}
        {isBig && (
          <View style={ss.mainBadge}>
            <Text style={ss.mainBadgeText}>Photo principale</Text>
          </View>
        )}
      </View>
    );
  }
  return (
    <TouchableOpacity
      onPress={onAdd}
      style={[ss.emptySlot, { width: size, height }]}
      activeOpacity={0.7}
    >
      <Ionicons name="camera-outline" size={isBig ? 34 : 22} color="#9CA3AF" />
      {isBig && <Text style={ss.addLabel}>Ajouter des photos</Text>}
    </TouchableOpacity>
  );
}

// ── Step 1: Photos ────────────────────────────────────────────────────────

function Step1({
  photos,
  setPhotos,
}: {
  photos: PhotoItem[];
  setPhotos: (p: PhotoItem[]) => void;
}) {
  const pick = useCallback(
    async (index: number) => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Accès aux photos',
          "Pour ajouter des photos, autorisez l'accès dans vos réglages.",
        );
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.85,
        allowsEditing: true,
      });
      if (!result.canceled && result.assets[0]) {
        const next = [...photos];
        next[index] = { id: `ph_${Date.now()}`, uri: result.assets[0].uri };
        setPhotos(next);
      }
    },
    [photos, setPhotos],
  );

  const remove = useCallback(
    (index: number) => {
      setPhotos(photos.filter((_, i) => i !== index));
    },
    [photos, setPhotos],
  );

  return (
    <View style={ss.step}>
      <ScrollView
        style={ss.stepScrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={ss.stepScroll}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={ss.heading}>Photos de l'article</Text>
        <Text style={ss.subheading}>Ajoutez jusqu'à 5 photos · La 1ère sera la principale</Text>

        <View style={{ alignItems: 'center', marginBottom: Spacing.sm }}>
          <PhotoSlot
            photo={photos[0]}
            size={BIG_SLOT_SIZE}
            isBig
            onAdd={() => pick(0)}
            onRemove={photos[0] ? () => remove(0) : undefined}
          />
        </View>

        <View style={ss.smallRow}>
          {[1, 2, 3, 4].map((i) => (
            <PhotoSlot
              key={i}
              photo={photos[i]}
              size={SMALL_SLOT_SIZE}
              onAdd={() => pick(i)}
              onRemove={photos[i] ? () => remove(i) : undefined}
            />
          ))}
        </View>

      </ScrollView>
    </View>
  );
}

// ── Step 2: Details ───────────────────────────────────────────────────────

function Step2({
  title, setTitle,
  description, setDescription,
  category, setCategory,
  condition, setCondition,
  brand, setBrand,
  categoryFields, setCategoryField,
  showCatSheet,
}: {
  title: string; setTitle: (v: string) => void;
  description: string; setDescription: (v: string) => void;
  category: string; setCategory: (v: string) => void;
  condition: string; setCondition: (v: string) => void;
  brand: string; setBrand: (v: string) => void;
  categoryFields: Record<string, string>;
  setCategoryField: (k: string, v: string) => void;
  showCatSheet: () => void;
}) {
  const dynFields = CATEGORY_FIELDS[category] ?? [];
  const catEntry = CATEGORIES.find((c) => c.key === category);

  return (
    <View style={ss.step}>
      <ScrollView
        style={ss.stepScrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={ss.stepScroll}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={ss.heading}>Détails de l'article</Text>

        {/* Title */}
        <View style={fs.group}>
          <Text style={fs.label}>
            Titre <Text style={fs.req}>*</Text>
          </Text>
          <TextInput
            style={fs.input}
            value={title}
            onChangeText={setTitle}
            placeholder="ex: iPhone 15 Pro Max 256 Go"
            placeholderTextColor={Colors.light.textSecondary}
            maxLength={80}
            returnKeyType="next"
          />
          <Text style={fs.counter}>{title.length}/80</Text>
        </View>

        {/* Description */}
        <View style={fs.group}>
          <Text style={fs.label}>
            Description <Text style={fs.req}>*</Text>
          </Text>
          <TextInput
            style={[fs.input, fs.multiline]}
            value={description}
            onChangeText={setDescription}
            placeholder="Décrivez votre article : état, accessoires inclus, raison de la vente…"
            placeholderTextColor={Colors.light.textSecondary}
            multiline
            numberOfLines={4}
            maxLength={1000}
            textAlignVertical="top"
          />
          <Text style={fs.counter}>{description.length}/1000</Text>
        </View>

        {/* Category */}
        <View style={fs.group}>
          <Text style={fs.label}>
            Catégorie <Text style={fs.req}>*</Text>
          </Text>
          <TouchableOpacity
            style={fs.select}
            onPress={showCatSheet}
            activeOpacity={0.75}
          >
            <Text style={category ? fs.selectVal : fs.selectPh}>
              {catEntry ? `${catEntry.icon}  ${catEntry.key}` : 'Choisir une catégorie'}
            </Text>
            <Feather name="chevron-down" size={18} color={Colors.light.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Condition */}
        <View style={fs.group}>
          <Text style={fs.label}>
            État <Text style={fs.req}>*</Text>
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginHorizontal: -Spacing.xxl }}
          >
            <View
              style={{
                flexDirection: 'row',
                gap: Spacing.sm,
                paddingHorizontal: Spacing.xxl,
              }}
            >
              {CONDITIONS.map((c) => {
                const active = condition === c.key;
                return (
                  <TouchableOpacity
                    key={c.key}
                    onPress={() => setCondition(c.key)}
                    style={[fs.chip, active && fs.chipOn]}
                  >
                    <Text style={[fs.chipText, active && fs.chipTextOn]}>
                      {c.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* Brand */}
        <View style={fs.group}>
          <Text style={fs.label}>Marque</Text>
          <TextInput
            style={fs.input}
            value={brand}
            onChangeText={setBrand}
            placeholder="ex: Apple, Nike, Samsung…"
            placeholderTextColor={Colors.light.textSecondary}
          />
        </View>

        {/* Dynamic fields */}
        {dynFields.length > 0 && (
          <>
            <Text style={ss.sectionTitle}>Caractéristiques</Text>
            {dynFields.map((f) => (
              <View key={f.key} style={fs.group}>
                <Text style={fs.label}>{f.label}</Text>
                <TextInput
                  style={fs.input}
                  value={categoryFields[f.key] ?? ''}
                  onChangeText={(v) => setCategoryField(f.key, v)}
                  placeholder={f.placeholder}
                  placeholderTextColor={Colors.light.textSecondary}
                  keyboardType={f.numeric ? 'numeric' : 'default'}
                />
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

// ── Step 3: Pricing ───────────────────────────────────────────────────────

function Step3({
  price, setPrice,
  listingType, setListingType,
  auctionDuration, setAuctionDuration,
  isNegotiable, setIsNegotiable,
  stock, setStock,
  category,
}: {
  price: string; setPrice: (v: string) => void;
  listingType: ListingType; setListingType: (v: ListingType) => void;
  auctionDuration: AuctionDuration; setAuctionDuration: (v: AuctionDuration) => void;
  isNegotiable: boolean; setIsNegotiable: (v: boolean) => void;
  stock: number; setStock: (v: number) => void;
  category: string;
}) {
  const hint = MARKET_HINTS[category];
  const num = parseFloat(price) || 0;
  const priceHint = (() => {
    if (!hint || !num) return null;
    if (num < hint.min)
      return { text: `↓ En dessous du marché (${hint.min}–${hint.max} €)`, color: Colors.light.success };
    if (num > hint.max)
      return { text: `↑ Au-dessus du marché (${hint.min}–${hint.max} €)`, color: Colors.light.error };
    return { text: `✓ Dans la fourchette du marché (${hint.min}–${hint.max} €)`, color: Colors.light.success };
  })();

  return (
    <View style={ss.step}>
      <ScrollView
        style={ss.stepScrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={ss.stepScroll}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={ss.heading}>Prix & type de vente</Text>

        {/* Big price input */}
        <View style={ss.priceWrap}>
          <TextInput
            style={ss.priceInput}
            value={price}
            onChangeText={setPrice}
            placeholder="0"
            placeholderTextColor="#D1D5DB"
            keyboardType="numeric"
            textAlign="center"
          />
          <Text style={ss.priceCurrency}>€</Text>
        </View>
        {priceHint && (
          <Text style={[ss.priceHint, { color: priceHint.color }]}>
            {priceHint.text}
          </Text>
        )}

        {/* Listing type */}
        <Text style={ss.sectionTitle}>Type de vente</Text>
        <View style={{ gap: Spacing.sm }}>
          {LISTING_TYPES.map((lt) => {
            const active = listingType === lt.key;
            return (
              <TouchableOpacity
                key={lt.key}
                onPress={() => setListingType(lt.key)}
                style={[ss.ltCard, active && ss.ltCardOn]}
                activeOpacity={0.75}
              >
                <Text style={ss.ltIcon}>{lt.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      ss.ltTitle,
                      active && { color: Colors.light.primary },
                    ]}
                  >
                    {lt.title}
                  </Text>
                  <Text style={ss.ltSub}>{lt.subtitle}</Text>
                </View>
                <View style={[ss.radio, active && ss.radioOn]}>
                  {active && <View style={ss.radioFill} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Auction duration */}
        {listingType === 'auction' && (
          <View style={{ marginTop: Spacing.md }}>
            <Text style={fs.label}>Durée de l'enchère</Text>
            <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm }}>
              {AUCTION_DURATIONS.map((d) => {
                const active = auctionDuration === d.key;
                return (
                  <TouchableOpacity
                    key={d.key}
                    onPress={() => setAuctionDuration(d.key)}
                    style={[fs.chip, active && fs.chipOn, { flex: 1, alignItems: 'center' }]}
                  >
                    <Text style={[fs.chipText, active && fs.chipTextOn]}>
                      {d.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Negotiable toggle */}
        {listingType === 'fixed' && (
          <View style={ss.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={ss.toggleLabel}>Prix négociable</Text>
              <Text style={ss.toggleSub}>
                Les acheteurs peuvent vous proposer un prix
              </Text>
            </View>
            <Switch
              value={isNegotiable}
              onValueChange={setIsNegotiable}
              trackColor={{
                false: Colors.light.border,
                true: `${Colors.light.primary}60`,
              }}
              thumbColor={isNegotiable ? Colors.light.primary : '#F3F4F6'}
            />
          </View>
        )}

        {/* Stock stepper */}
        <View style={[ss.toggleRow, { marginTop: Spacing.md }]}>
          <View style={{ flex: 1 }}>
            <Text style={ss.toggleLabel}>Quantité en stock</Text>
            <Text style={ss.toggleSub}>Pour les articles en plusieurs exemplaires</Text>
          </View>
          <View style={ss.stepper}>
            <TouchableOpacity
              onPress={() => setStock(Math.max(1, stock - 1))}
              style={ss.stepBtn}
              disabled={stock <= 1}
            >
              <Feather
                name="minus"
                size={16}
                color={stock <= 1 ? Colors.light.border : Colors.light.primary}
              />
            </TouchableOpacity>
            <Text style={ss.stepVal}>{stock}</Text>
            <TouchableOpacity onPress={() => setStock(stock + 1)} style={ss.stepBtn}>
              <Feather name="plus" size={16} color={Colors.light.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// ── Step 4: Shipping ──────────────────────────────────────────────────────

function Step4({
  handToHandLogistics, setHandToHandLogistics,
  handover, setHandover,
  handoverLocation, setHandoverLocation,
  postal, setPostal,
  postalPrice, setPostalPrice,
}: {
  handToHandLogistics: boolean; setHandToHandLogistics: (v: boolean) => void;
  handover: boolean; setHandover: (v: boolean) => void;
  handoverLocation: string; setHandoverLocation: (v: string) => void;
  postal: boolean; setPostal: (v: boolean) => void;
  postalPrice: string; setPostalPrice: (v: string) => void;
}) {
  const noShipping = !handToHandLogistics && !handover && !postal;

  return (
    <View style={ss.step}>
      <ScrollView
        style={ss.stepScrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={ss.stepScroll}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={ss.heading}>Modes de livraison</Text>
        <Text style={ss.subheading}>Sélectionnez au moins un mode</Text>

        {/* Hand to Hand Logistics */}
        <TouchableOpacity
          onPress={() => setHandToHandLogistics(!handToHandLogistics)}
          style={[ss.shipCard, handToHandLogistics && ss.shipCardOn]}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={
              handToHandLogistics
                ? [Colors.light.primary, Colors.light.primaryGradientEnd]
                : ['#EEF2FF', '#EEF2FF']
            }
            style={ss.shipIcon}
          >
            <Feather
              name="truck"
              size={22}
              color={handToHandLogistics ? '#FFF' : Colors.light.primary}
            />
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text
              style={[ss.shipTitle, handToHandLogistics && { color: Colors.light.primary }]}
            >
              Hand to Hand Logistics
            </Text>
            <Text style={ss.shipSub}>
              Livraison sécurisée · Suivi en temps réel · Couverture nationale
            </Text>
          </View>
          <View
            style={[
              ss.checkCircle,
              handToHandLogistics && {
                backgroundColor: Colors.light.primary,
                borderColor: Colors.light.primary,
              },
            ]}
          >
            {handToHandLogistics && <Ionicons name="checkmark" size={14} color="#FFF" />}
          </View>
        </TouchableOpacity>

        {/* Remise en main propre */}
        <TouchableOpacity
          onPress={() => setHandover(!handover)}
          style={[ss.shipCard, handover && ss.shipCardOn, handover && { borderColor: Colors.light.success }]}
          activeOpacity={0.8}
        >
          <View style={[ss.shipIcon, { backgroundColor: handover ? Colors.light.success : '#F0FDF4' }]}>
            <Ionicons
              name="person-outline"
              size={22}
              color={handover ? '#FFF' : Colors.light.success}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[ss.shipTitle, handover && { color: Colors.light.success }]}>
              Remise en main propre
            </Text>
            <Text style={ss.shipSub}>Rendez-vous directement avec l'acheteur</Text>
          </View>
          <View
            style={[
              ss.checkCircle,
              handover && {
                backgroundColor: Colors.light.success,
                borderColor: Colors.light.success,
              },
            ]}
          >
            {handover && <Ionicons name="checkmark" size={14} color="#FFF" />}
          </View>
        </TouchableOpacity>
        {handover && (
          <TextInput
            style={[fs.input, { marginTop: -Spacing.xs, marginBottom: Spacing.md }]}
            value={handoverLocation}
            onChangeText={setHandoverLocation}
            placeholder="Lieu de remise (ville, quartier…)"
            placeholderTextColor={Colors.light.textSecondary}
          />
        )}

        {/* Envoi postal */}
        <TouchableOpacity
          onPress={() => setPostal(!postal)}
          style={[ss.shipCard, postal && ss.shipCardOn, postal && { borderColor: '#7C3AED' }]}
          activeOpacity={0.8}
        >
          <View style={[ss.shipIcon, { backgroundColor: postal ? '#7C3AED' : '#EDE9FE' }]}>
            <Feather name="package" size={22} color={postal ? '#FFF' : '#7C3AED'} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[ss.shipTitle, postal && { color: '#7C3AED' }]}>
              Envoi postal
            </Text>
            <Text style={ss.shipSub}>Frais à la charge de l'acheteur</Text>
          </View>
          <View
            style={[
              ss.checkCircle,
              postal && { backgroundColor: '#7C3AED', borderColor: '#7C3AED' },
            ]}
          >
            {postal && <Ionicons name="checkmark" size={14} color="#FFF" />}
          </View>
        </TouchableOpacity>
        {postal && (
          <TextInput
            style={[fs.input, { marginTop: -Spacing.xs, marginBottom: Spacing.md }]}
            value={postalPrice}
            onChangeText={setPostalPrice}
            placeholder="Frais de port estimés (€ · optionnel)"
            placeholderTextColor={Colors.light.textSecondary}
            keyboardType="numeric"
          />
        )}

        {noShipping && (
          <View style={ss.shipError}>
            <Ionicons name="warning-outline" size={16} color={Colors.light.error} />
            <Text style={ss.shipErrorText}>
              Sélectionnez au moins un mode de livraison
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ── Step 5: Review ────────────────────────────────────────────────────────

function ReviewRow({
  title,
  value,
  onEdit,
}: {
  title: string;
  value: string;
  onEdit: () => void;
}) {
  return (
    <View style={ss.reviewRow}>
      <View style={{ flex: 1 }}>
        <Text style={ss.reviewLabel}>{title}</Text>
        <Text style={ss.reviewVal} numberOfLines={2}>
          {value}
        </Text>
      </View>
      <TouchableOpacity
        onPress={onEdit}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={ss.reviewEdit}>Modifier</Text>
      </TouchableOpacity>
    </View>
  );
}

function Step5({
  photos, title, description, category, condition, brand,
  price, listingType, stock,
  handToHandLogistics, handover, postal,
  onEdit,
}: {
  photos: PhotoItem[];
  title: string; description: string; category: string;
  condition: string; brand: string;
  price: string; listingType: ListingType; stock: number;
  handToHandLogistics: boolean; handover: boolean; postal: boolean;
  onEdit: (s: number) => void;
}) {
  const catEntry = CATEGORIES.find((c) => c.key === category);
  const condLabel = CONDITIONS.find((c) => c.key === condition)?.label ?? condition;
  const ltLabel = LISTING_TYPES.find((l) => l.key === listingType)?.title ?? listingType;
  const shipping = [
    handToHandLogistics && 'Hand to Hand Logistics',
    handover && 'Main propre',
    postal && 'Postal',
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <View style={ss.step}>
      <ScrollView
        style={ss.stepScrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={ss.stepScroll}
      >
        <Text style={ss.heading}>Aperçu de l'annonce</Text>
        <Text style={ss.subheading}>Vérifiez avant de publier</Text>

        {/* Mini preview card */}
        {photos[0] && (
          <View style={ss.previewCard}>
            <Image
              source={{ uri: photos[0].uri }}
              style={ss.previewImg}
              contentFit="cover"
            />
            <View style={ss.previewInfo}>
              <Text style={ss.previewTitle} numberOfLines={1}>
                {title || 'Sans titre'}
              </Text>
              <Text style={ss.previewPrice}>{price ? `${price} €` : '— €'}</Text>
            </View>
          </View>
        )}

        <ReviewRow
          title="Photos"
          value={`${photos.length} photo${photos.length > 1 ? 's' : ''}`}
          onEdit={() => onEdit(0)}
        />
        <ReviewRow
          title="Détails"
          value={[
            catEntry ? `${catEntry.icon} ${catEntry.key}` : '—',
            condLabel,
            brand || null,
          ]
            .filter(Boolean)
            .join(' · ')}
          onEdit={() => onEdit(1)}
        />
        <ReviewRow
          title="Prix"
          value={[
            price ? `${price} €` : '— €',
            ltLabel,
            stock > 1 ? `Stock: ${stock}` : null,
          ]
            .filter(Boolean)
            .join(' · ')}
          onEdit={() => onEdit(2)}
        />
        <ReviewRow
          title="Livraison"
          value={shipping || 'Aucun mode sélectionné'}
          onEdit={() => onEdit(3)}
        />

        <View style={ss.termsBox}>
          <Text style={ss.termsText}>
            En publiant, vous acceptez les Conditions d'utilisation et la Politique de Hand to Hand.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

// ── Category Sheet ────────────────────────────────────────────────────────

function CategorySheet({
  visible,
  onClose,
  onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (cat: string) => void;
}) {
  const ty = useSharedValue(H);
  const bd = useSharedValue(0);

  React.useEffect(() => {
    if (visible) {
      ty.value = withSpring(0, { damping: 20, stiffness: 200 });
      bd.value = withTiming(0.5, { duration: 250 });
    } else {
      ty.value = withSpring(H * 1.1, { damping: 20, stiffness: 200 });
      bd.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: ty.value }],
  }));
  const bgStyle = useAnimatedStyle(() => ({ opacity: bd.value }));

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <TouchableOpacity
        style={StyleSheet.absoluteFill}
        onPress={onClose}
        activeOpacity={1}
      >
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: '#000' },
            bgStyle,
          ]}
        />
      </TouchableOpacity>
      <Animated.View style={[ss.catSheet, sheetStyle]}>
        <View style={ss.catHandle} />
        <Text style={ss.catTitle}>Catégorie</Text>
        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
          <View style={ss.catGrid}>
            {CATEGORIES.map((c) => (
              <TouchableOpacity
                key={c.key}
                style={ss.catItem}
                onPress={() => {
                  onSelect(c.key);
                  onClose();
                }}
                activeOpacity={0.7}
              >
                <Text style={ss.catIcon}>{c.icon}</Text>
                <Text style={ss.catItemLabel}>{c.key}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

// ── Success Overlay ───────────────────────────────────────────────────────

function SuccessOverlay({ onDone }: { onDone: () => void }) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    opacity.value = withTiming(1, { duration: 200 });
    scale.value = withSequence(
      withSpring(1.2, { damping: 8, stiffness: 300 }),
      withSpring(1, { damping: 15 }),
    );
    const t = setTimeout(onDone, 2600);
    return () => clearTimeout(t);
  }, []);

  const overlayStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const circleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[ss.successOverlay, overlayStyle]}>
      <Animated.View style={circleStyle}>
        <LinearGradient
          colors={[Colors.light.success, '#34D399']}
          style={ss.successCircle}
        >
          <Ionicons name="checkmark" size={56} color="#FFF" />
        </LinearGradient>
      </Animated.View>
      <Text style={ss.successTitle}>Annonce publiée !</Text>
      <Text style={ss.successSub}>
        Votre annonce est maintenant visible par tous les acheteurs
      </Text>
    </Animated.View>
  );
}

// ── Step Indicator ────────────────────────────────────────────────────────

function StepIndicator({ step }: { step: number }) {
  return (
    <View style={ss.indicator}>
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <React.Fragment key={i}>
          <View
            style={[
              ss.dot,
              i < step && ss.dotDone,
              i === step && ss.dotCurrent,
            ]}
          >
            {i < step && (
              <Ionicons name="checkmark" size={10} color="#FFF" />
            )}
          </View>
          {i < TOTAL_STEPS - 1 && (
            <View style={[ss.line, i < step && ss.lineDone]} />
          )}
        </React.Fragment>
      ))}
    </View>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────

export default function PublishFlow() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [catSheet, setCatSheet] = useState(false);
  const [success, setSuccess] = useState(false);

  const slideX = useSharedValue(0);
  const store = usePublishStore();

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: slideX.value }],
  }));

  const goToStep = useCallback(
    (next: number) => {
      setStep(next);
      slideX.value = withSpring(-next * W, { damping: 22, stiffness: 220 });
    },
    [],
  );

  const canProceed = (): boolean => {
    if (step === 0) return store.photos.length > 0;
    if (step === 1)
      return (
        store.title.trim().length > 0 &&
        store.description.trim().length > 0 &&
        store.category !== ''
      );
    if (step === 2) return store.price !== '' && parseFloat(store.price) > 0;
    if (step === 3) return store.handToHandLogistics || store.handover || store.postal;
    return true;
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS - 1) {
      goToStep(step + 1);
    } else {
      setSuccess(true);
    }
  };

  const handleBack = () => {
    if (step === 0) {
      store.reset();
      router.back();
    } else {
      goToStep(step - 1);
    }
  };

  const proceed = canProceed();
  const isLast = step === TOTAL_STEPS - 1;

  return (
    <View style={[ss.root, { paddingTop: insets.top }]}>
      {/* ── Header ── */}
      <View style={ss.header}>
        <TouchableOpacity
          onPress={handleBack}
          style={ss.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={22} color={Colors.light.text} />
        </TouchableOpacity>

        <StepIndicator step={step} />

        <Text style={ss.stepLabel}>{STEP_LABELS[step]}</Text>
      </View>

      {/* ── Slides ── */}
      <View style={ss.clip}>
        <Animated.View style={[ss.slides, containerStyle]}>
          <Step1 photos={store.photos} setPhotos={store.setPhotos} />
          <Step2
            title={store.title}
            setTitle={store.setTitle}
            description={store.description}
            setDescription={store.setDescription}
            category={store.category}
            setCategory={store.setCategory}
            condition={store.condition}
            setCondition={store.setCondition}
            brand={store.brand}
            setBrand={store.setBrand}
            categoryFields={store.categoryFields}
            setCategoryField={store.setCategoryField}
            showCatSheet={() => setCatSheet(true)}
          />
          <Step3
            price={store.price}
            setPrice={store.setPrice}
            listingType={store.listingType}
            setListingType={store.setListingType}
            auctionDuration={store.auctionDuration}
            setAuctionDuration={store.setAuctionDuration}
            isNegotiable={store.isNegotiable}
            setIsNegotiable={store.setIsNegotiable}
            stock={store.stock}
            setStock={store.setStock}
            category={store.category}
          />
          <Step4
            handToHandLogistics={store.handToHandLogistics}
            setHandToHandLogistics={store.setHandToHandLogistics}
            handover={store.handover}
            setHandover={store.setHandover}
            handoverLocation={store.handoverLocation}
            setHandoverLocation={store.setHandoverLocation}
            postal={store.postal}
            setPostal={store.setPostal}
            postalPrice={store.postalPrice}
            setPostalPrice={store.setPostalPrice}
          />
          <Step5
            photos={store.photos}
            title={store.title}
            description={store.description}
            category={store.category}
            condition={store.condition}
            brand={store.brand}
            price={store.price}
            listingType={store.listingType}
            stock={store.stock}
            handToHandLogistics={store.handToHandLogistics}
            handover={store.handover}
            postal={store.postal}
            onEdit={goToStep}
          />
        </Animated.View>
      </View>

      {/* ── Bottom nav ── */}
      <View style={[ss.bottomNav, { paddingBottom: Math.max(insets.bottom, Platform.OS === 'ios' ? 20 : 0) + Spacing.md }]}>
        <TouchableOpacity
          onPress={handleNext}
          disabled={!proceed}
          activeOpacity={0.85}
          style={{ flex: 1 }}
        >
          <LinearGradient
            colors={proceed ? [Colors.light.primary, Colors.light.primaryGradientEnd] : ['#E5E7EB', '#E5E7EB']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={ss.nextBtn}
          >
            <Text
              style={[
                ss.nextBtnText,
                !proceed && { color: Colors.light.textSecondary },
              ]}
            >
              {isLast ? "Publier l'annonce" : 'Continuer'}
            </Text>
            <Ionicons
              name={isLast ? 'rocket-outline' : 'arrow-forward'}
              size={18}
              color={proceed ? '#FFF' : Colors.light.textSecondary}
            />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* ── Category bottom sheet ── */}
      <CategorySheet
        visible={catSheet}
        onClose={() => setCatSheet(false)}
        onSelect={store.setCategory}
      />

      {/* ── Success overlay ── */}
      {success && (
        <SuccessOverlay
          onDone={() => {
            store.reset();
            router.replace('/(tabs)');
          }}
        />
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────

const ss = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    backgroundColor: Colors.light.surface,
    gap: Spacing.md,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicator: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotDone: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  dotCurrent: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.surface,
  },
  line: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.light.border,
    marginHorizontal: 2,
  },
  lineDone: {
    backgroundColor: Colors.light.primary,
  },
  stepLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: Colors.light.primary,
    width: 52,
    textAlign: 'right',
  },

  // Slides
  clip: {
    flex: 1,
    overflow: 'hidden',
  },
  slides: {
    flexDirection: 'row',
    width: W * TOTAL_STEPS,
    flex: 1,
  },
  step: {
    width: W,
    flex: 1,
  },
  stepScrollView: {
    flex: 1,
  },
  stepScroll: {
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.xl,
    paddingBottom: 110,
  },

  // Typography
  heading: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 22,
    color: Colors.light.text,
    marginBottom: Spacing.xs,
  },
  subheading: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: Colors.light.textSecondary,
    lineHeight: 18,
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: Colors.light.text,
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
  },

  // Photos
  removeBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  mainBadgeText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 11,
    color: '#FFF',
  },
  emptySlot: {
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  addLabel: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  smallRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: '#FFFBEB',
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    marginTop: Spacing.xl,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  tipText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: '#92400E',
    flex: 1,
    lineHeight: 16,
  },

  // Price
  priceWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  priceInput: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 52,
    color: Colors.light.text,
    minWidth: 120,
    textAlign: 'center',
  },
  priceCurrency: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 28,
    color: Colors.light.textSecondary,
    paddingTop: 10,
  },
  priceHint: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: Spacing.md,
    lineHeight: 16,
  },

  // Listing type
  ltCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.surface,
  },
  ltCardOn: {
    borderColor: Colors.light.primary,
    backgroundColor: '#EEF2FF',
  },
  ltIcon: { fontSize: 22 },
  ltTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
  },
  ltSub: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: Colors.light.textSecondary,
    lineHeight: 16,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.light.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: { borderColor: Colors.light.primary },
  radioFill: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.light.primary,
  },

  // Toggles
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    marginTop: Spacing.md,
  },
  toggleLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
  },
  toggleSub: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: Colors.light.textSecondary,
    lineHeight: 16,
  },

  // Stepper
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
  },
  stepBtn: {
    padding: Spacing.sm,
    backgroundColor: Colors.light.background,
  },
  stepVal: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: Colors.light.text,
    minWidth: 32,
    textAlign: 'center',
  },

  // Shipping
  shipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.surface,
    marginBottom: Spacing.md,
  },
  shipCardOn: {
    borderColor: Colors.light.primary,
    backgroundColor: '#F8FAFF',
  },
  shipIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shipTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
    marginBottom: 2,
  },
  shipSub: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: Colors.light.textSecondary,
    lineHeight: 16,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.light.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shipError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    marginTop: Spacing.sm,
  },
  shipErrorText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: Colors.light.error,
  },

  // Review
  reviewRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  reviewLabel: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: Colors.light.textSecondary,
    lineHeight: 16,
    marginBottom: 2,
  },
  reviewVal: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
  },
  reviewEdit: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: Colors.light.primary,
    lineHeight: 20,
  },
  previewCard: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    backgroundColor: Colors.light.surface,
    marginBottom: Spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  previewImg: {
    width: '100%',
    height: 180,
  },
  previewInfo: {
    padding: Spacing.md,
  },
  previewTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    color: Colors.light.text,
    lineHeight: 20,
    marginBottom: 4,
  },
  previewPrice: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 20,
    color: Colors.light.primary,
  },
  termsBox: {
    marginTop: Spacing.xl,
    padding: Spacing.md,
    backgroundColor: Colors.light.background,
    borderRadius: BorderRadius.sm,
  },
  termsText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },

  // Category sheet
  catSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: H * 0.6,
    backgroundColor: Colors.light.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
  },
  catHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.light.border,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  catTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    color: Colors.light.text,
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
  },
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.lg,
    paddingBottom: 40,
    gap: Spacing.md,
  },
  catItem: {
    width: (W - Spacing.lg * 2 - Spacing.md * 2) / 3,
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.light.background,
    gap: Spacing.xs,
  },
  catIcon: { fontSize: 28 },
  catItemLabel: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 11,
    color: Colors.light.text,
    textAlign: 'center',
    lineHeight: 15,
  },

  // Success
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.97)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xl,
    paddingHorizontal: Spacing.xxxl,
  },
  successCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 26,
    color: Colors.light.text,
    textAlign: 'center',
  },
  successSub: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 15,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Bottom nav — absolutely pinned so flex chain can't push it off-screen
  bottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.md,
    backgroundColor: Colors.light.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  nextBtn: {
    height: 54,
    borderRadius: BorderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  nextBtnText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: '#FFF',
    lineHeight: 20,
  },
});

// Field styles (shared across steps)
const fs = StyleSheet.create({
  group: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: Colors.light.text,
    marginBottom: Spacing.sm,
    lineHeight: 18,
  },
  req: {
    color: Colors.light.error,
  },
  input: {
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: Colors.light.text,
    backgroundColor: Colors.light.surface,
    lineHeight: 20,
  },
  multiline: {
    minHeight: 100,
    paddingTop: Spacing.md,
  },
  counter: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: Colors.light.textSecondary,
    textAlign: 'right',
    marginTop: 4,
  },
  select: {
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.light.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectVal: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
  },
  selectPh: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: Colors.light.textSecondary,
    lineHeight: 20,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.surface,
  },
  chipOn: {
    borderColor: Colors.light.primary,
    backgroundColor: '#EEF2FF',
  },
  chipText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: Colors.light.textSecondary,
    lineHeight: 18,
  },
  chipTextOn: {
    color: Colors.light.primary,
  },
});
