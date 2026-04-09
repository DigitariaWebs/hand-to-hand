import { Stack } from 'expo-router';
import { Colors } from '@/constants/Colors';

const OPAQUE = { backgroundColor: Colors.light.surface };

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* index is the transparent modal — no background so onboarding shows through */}
      <Stack.Screen name="index" options={{ contentStyle: { backgroundColor: 'transparent' } }} />
      <Stack.Screen name="phone" options={{ animation: 'slide_from_right', contentStyle: OPAQUE }} />
      <Stack.Screen name="otp" options={{ animation: 'slide_from_right', contentStyle: OPAQUE }} />
      <Stack.Screen name="complete-profile" options={{ animation: 'slide_from_right', contentStyle: OPAQUE }} />
      <Stack.Screen name="kyc" options={{ animation: 'slide_from_right', contentStyle: OPAQUE }} />
    </Stack>
  );
}
