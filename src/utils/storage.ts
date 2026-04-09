import * as SecureStore from 'expo-secure-store';

export const StorageKeys = {
  HAS_ONBOARDED: 'hasOnboarded',
} as const;

export const storage = {
  async set(key: string, value: boolean | string | number): Promise<void> {
    await SecureStore.setItemAsync(key, String(value));
  },
  async getBoolean(key: string): Promise<boolean | undefined> {
    const val = await SecureStore.getItemAsync(key);
    if (val === null || val === undefined) return undefined;
    return val === 'true';
  },
  async getString(key: string): Promise<string | undefined> {
    const val = await SecureStore.getItemAsync(key);
    return val ?? undefined;
  },
  async remove(key: string): Promise<void> {
    await SecureStore.deleteItemAsync(key);
  },
};
