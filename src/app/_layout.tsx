import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme, Appearance } from 'react-native';
import { useAppStore } from '@/stores/useAppStore';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { isDarkMode } = useAppStore();

  // Sync store toggle with system Appearance so all useColorScheme() calls react
  useEffect(() => {
    Appearance.setColorScheme(isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const [fontsLoaded, fontError] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <StatusBar style={isDarkMode ? 'light' : 'dark'} />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="explore" />
            <Stack.Screen name="(auth)" options={{ headerShown: false, presentation: 'transparentModal', animation: 'none' }} />
            <Stack.Screen name="(onboarding)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="product/[id]"
              options={{ headerShown: false, presentation: 'card' }}
            />
            <Stack.Screen
              name="auction"
              options={{ headerShown: false, presentation: 'card' }}
            />
            <Stack.Screen
              name="checkout"
              options={{ headerShown: false, presentation: 'modal' }}
            />
            <Stack.Screen
              name="order/[id]"
              options={{ headerShown: false, presentation: 'card' }}
            />
            <Stack.Screen name="logistics" />
            <Stack.Screen
              name="boost"
              options={{ headerShown: false, presentation: 'modal' }}
            />
            <Stack.Screen name="settings" />
            <Stack.Screen
              name="chat/[id]"
              options={{ headerShown: false, presentation: 'card' }}
            />
            <Stack.Screen
              name="sell/index"
              options={{ headerShown: false, presentation: 'modal' }}
            />
            <Stack.Screen
              name="sell/my-listings"
              options={{ headerShown: false, presentation: 'card' }}
            />
            <Stack.Screen
              name="live"
              options={{ headerShown: false, presentation: 'card' }}
            />
            <Stack.Screen
              name="stats"
              options={{ headerShown: false, presentation: 'card' }}
            />
            <Stack.Screen
              name="notifications"
              options={{ headerShown: false, presentation: 'card' }}
            />
          </Stack>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
