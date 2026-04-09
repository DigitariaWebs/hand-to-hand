import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ListRenderItemInfo,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { BottomSheet } from './BottomSheet';
import { Colors } from '@/constants/Colors';
import { Spacing, BorderRadius } from '@/constants/Spacing';

export type Country = {
  code: string;
  dialCode: string;
  flag: string;
  name: string;
};

const COUNTRIES: Country[] = [
  { code: 'FR', dialCode: '+33', flag: '🇫🇷', name: 'France' },
  { code: 'MC', dialCode: '+377', flag: '🇲🇨', name: 'Monaco' },
  { code: 'IT', dialCode: '+39', flag: '🇮🇹', name: 'Italie' },
  { code: 'ES', dialCode: '+34', flag: '🇪🇸', name: 'Espagne' },
  { code: 'GB', dialCode: '+44', flag: '🇬🇧', name: 'Royaume-Uni' },
  { code: 'DE', dialCode: '+49', flag: '🇩🇪', name: 'Allemagne' },
  { code: 'BE', dialCode: '+32', flag: '🇧🇪', name: 'Belgique' },
  { code: 'CH', dialCode: '+41', flag: '🇨🇭', name: 'Suisse' },
  { code: 'NL', dialCode: '+31', flag: '🇳🇱', name: 'Pays-Bas' },
  { code: 'PT', dialCode: '+351', flag: '🇵🇹', name: 'Portugal' },
  { code: 'US', dialCode: '+1', flag: '🇺🇸', name: 'États-Unis' },
];

type CountryPickerProps = {
  visible: boolean;
  onClose: () => void;
  onSelect: (country: Country) => void;
  selectedCode?: string;
};

export function CountryPicker({
  visible,
  onClose,
  onSelect,
  selectedCode,
}: CountryPickerProps) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return COUNTRIES;
    const q = search.toLowerCase();
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.dialCode.includes(q),
    );
  }, [search]);

  const handleSelect = (country: Country) => {
    onSelect(country);
    setSearch('');
    onClose();
  };

  const renderItem = ({ item }: ListRenderItemInfo<Country>) => {
    const isSelected = item.code === selectedCode;
    return (
      <TouchableOpacity
        onPress={() => handleSelect(item)}
        style={styles.row}
        activeOpacity={0.7}
      >
        <Text style={styles.flag}>{item.flag}</Text>
        <Text
          style={[
            styles.countryName,
            isSelected && { color: Colors.light.primary },
          ]}
        >
          {item.name}
        </Text>
        <Text style={styles.dialCode}>{item.dialCode}</Text>
        {isSelected && (
          <Feather
            name="check"
            size={16}
            color={Colors.light.primary}
            style={styles.checkIcon}
          />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} snapHeight={0.6}>
      <View style={styles.container}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Rechercher..."
          placeholderTextColor="#9CA3AF"
          style={styles.searchInput}
        />
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.code}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.md,
  },
  searchInput: {
    height: 44,
    backgroundColor: '#F3F4F6',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: '#28262C',
    marginBottom: Spacing.md,
  },
  row: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  flag: {
    fontSize: 22,
    width: 30,
  },
  countryName: {
    flex: 1,
    fontFamily: 'Poppins_400Regular',
    fontSize: 15,
    color: '#28262C',
    lineHeight: 20,
  },
  dialCode: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: Colors.light.textSecondary,
    lineHeight: 18,
  },
  checkIcon: {
    marginLeft: Spacing.sm,
  },
});
