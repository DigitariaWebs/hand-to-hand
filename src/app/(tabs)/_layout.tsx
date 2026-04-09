import { Tabs } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/Colors';
import { useMessagesStore } from '@/stores/useMessagesStore';

// ─── Tab config ──────────────────────────────────────────────────────────────

const TAB_CONFIG = [
  { name: 'index',    icon: 'home',           label: 'Accueil'    },
  { name: 'search',   icon: 'search',         label: 'Rechercher' },
  { name: 'sell',     icon: 'plus',           label: 'Vendre',    isSell: true },
  { name: 'messages', icon: 'message-circle', label: 'Messages'   },
  { name: 'profile',  icon: 'user',           label: 'Profil'     },
] as const;

const TAB_BAR_HEIGHT = 60; // visible bar height, excluding safe area

// ─── Individual tab item ─────────────────────────────────────────────────────

function TabItem({
  config,
  focused,
  onPress,
  theme,
  badge,
}: {
  config: typeof TAB_CONFIG[number];
  focused: boolean;
  onPress: () => void;
  theme: typeof Colors.light;
  badge?: number;
}) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSpring(0.88, { damping: 12 }, () => {
      scale.value = withSpring(1, { damping: 12 });
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  // ── Sell button (center) ──
  if ('isSell' in config && config.isSell) {
    return (
      <TouchableOpacity
        style={styles.sellTab}
        onPress={handlePress}
        activeOpacity={1}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        accessibilityRole="button"
        accessibilityLabel="Vendre un article"
      >
        <Animated.View
          style={[
            styles.sellButtonWrapper,
            { borderColor: theme.surface },
            animStyle,
          ]}
        >
          <LinearGradient
            colors={[theme.primary, theme.primaryGradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.sellButton}
          >
            <Feather name="plus" size={26} color="#FFFFFF" />
          </LinearGradient>
        </Animated.View>
        <Text style={[styles.sellLabel, { color: theme.primary }]} numberOfLines={1}>
          Vendre
        </Text>
      </TouchableOpacity>
    );
  }

  // ── Regular tab ──
  return (
    <TouchableOpacity
      style={styles.tabItem}
      onPress={handlePress}
      activeOpacity={1}
      hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
      accessibilityRole="button"
      accessibilityLabel={config.label}
    >
      <Animated.View style={[styles.tabInner, animStyle]}>
        {/* Active indicator dot */}
        <View style={styles.iconWrapper}>
          <Feather
            name={config.icon as any}
            size={22}
            color={focused ? theme.primary : '#9CA3AF'}
          />
          {focused && (
            <Animated.View
              style={[styles.activeDot, { backgroundColor: theme.primary }]}
            />
          )}
          {/* Badge */}
          {!!badge && badge > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {badge > 9 ? '9+' : badge}
              </Text>
            </View>
          )}
        </View>
        <Text
          style={[
            styles.tabLabel,
            { color: focused ? theme.primary : '#9CA3AF' },
            focused && styles.tabLabelActive,
          ]}
          numberOfLines={1}
        >
          {config.label}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

// ─── Custom tab bar ───────────────────────────────────────────────────────────

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();

  const totalUnread = useMessagesStore(
    (s) => s.conversations.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0),
  );

  return (
    <View
      style={[
        styles.tabBar,
        {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
          paddingBottom: insets.bottom,
          height: TAB_BAR_HEIGHT + insets.bottom,
        },
      ]}
    >
      {TAB_CONFIG.map((config, index) => {
        const route = state.routes[index];
        const focused = state.index === index;
        const badge = config.name === 'messages' ? totalUnread : undefined;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route?.key ?? config.name,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(config.name);
          }
        };

        return (
          <TabItem
            key={config.name}
            config={config}
            focused={focused}
            onPress={onPress}
            theme={theme}
            badge={badge}
          />
        );
      })}
    </View>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="search" />
      <Tabs.Screen name="sell" />
      <Tabs.Screen name="messages" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    // Subtle top shadow
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },

  // ── Regular tab ──
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabInner: {
    alignItems: 'center',
    gap: 3,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
  },
  activeDot: {
    position: 'absolute',
    bottom: -4,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  tabLabel: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 10,
    lineHeight: 14,
    textAlign: 'center',
  },
  tabLabelActive: {
    fontFamily: 'Poppins_600SemiBold',
  },

  // ── Sell tab ──
  sellTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 8,
  },
  sellButtonWrapper: {
    // Elevate the circle above the tab bar
    marginTop: -28,
    marginBottom: 4,
    borderRadius: 30,
    // White ring separating the button from the bar
    borderWidth: 3,
    borderColor: 'transparent',
    ...Platform.select({
      ios: {
        shadowColor: '#14248A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  sellButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sellLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 10,
    lineHeight: 14,
    textAlign: 'center',
  },

  // ── Badge ──
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  badgeText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 9,
    color: '#FFF',
    lineHeight: 13,
  },
});
