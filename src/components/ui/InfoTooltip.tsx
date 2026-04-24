import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  View,
  Text,
  useColorScheme,
  TouchableOpacity,
  Platform,
} from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

type InfoTooltipProps = {
  text: string;
  iconSize?: number;
  iconColor?: string;
  autoDismissMs?: number;
};

export function InfoTooltip({
  text,
  iconSize = 18,
  iconColor,
  autoDismissMs = 5000,
}: InfoTooltipProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!visible || autoDismissMs <= 0) return;
    const id = setTimeout(() => setVisible(false), autoDismissMs);
    return () => clearTimeout(id);
  }, [visible, autoDismissMs]);

  return (
    <>
      <TouchableOpacity
        onPress={() => setVisible(true)}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        accessibilityRole="button"
        accessibilityLabel="Plus d'informations"
      >
        <Ionicons
          name="information-circle-outline"
          size={iconSize}
          color={iconColor ?? theme.textMuted}
        />
      </TouchableOpacity>
      <Modal
        transparent
        visible={visible}
        animationType="none"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable
          style={styles.overlay}
          onPress={() => setVisible(false)}
        >
          <Animated.View
            entering={FadeIn.duration(180)}
            exiting={FadeOut.duration(120)}
            style={[
              styles.card,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            <View
              style={[
                styles.header,
                { borderBottomColor: theme.border },
              ]}
            >
              <Ionicons
                name="information-circle"
                size={18}
                color={theme.primary}
              />
              <Text style={[styles.title, { color: theme.text }]}>
                Information
              </Text>
            </View>
            <Text style={[styles.body, { color: theme.textSecondary }]}>
              {text}
            </Text>
            <TouchableOpacity
              style={[styles.closeBtn, { backgroundColor: `${theme.primary}12` }]}
              onPress={() => setVisible(false)}
            >
              <Text style={[styles.closeText, { color: theme.primary }]}>
                Compris
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 14,
      },
      android: { elevation: 8 },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
  },
  body: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    lineHeight: 19,
  },
  closeBtn: {
    alignSelf: 'flex-end',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 4,
  },
  closeText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
  },
});
