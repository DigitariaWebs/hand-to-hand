import { create } from 'zustand';
import { storage, StorageKeys } from '@/utils/storage';

// ─── Types ──────────────────────────────────────────────────────────────────

export type User = {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  avatar?: string;
  city?: string;
  provider: 'apple' | 'google' | 'facebook' | 'phone';
};

export type KycStatus = 'none' | 'pending' | 'verified' | 'rejected';

type AuthStore = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  isNewUser: boolean;
  kycStatus: KycStatus;
  pendingPhone: string | null;

  loginWithSocial: (provider: 'apple' | 'google' | 'facebook') => Promise<'new' | 'returning'>;
  sendOTP: (phone: string) => Promise<void>;
  verifyOTP: (code: string) => Promise<'new' | 'returning'>;
  completeProfile: (data: { firstName: string; lastName: string; city?: string; avatar?: string }) => Promise<void>;
  requestKYC: () => Promise<void>;
  logout: () => Promise<void>;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function generateToken(): string {
  return 'tok_' + Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  token: null,
  isNewUser: false,
  kycStatus: 'none',
  pendingPhone: null,

  loginWithSocial: async (provider) => {
    set({ isLoading: true });
    await delay(800);

    const isNew = Math.random() < 0.3;
    const token = generateToken();
    const user: User = {
      id: generateId(),
      firstName: isNew ? '' : 'Jean',
      lastName: isNew ? '' : 'Dupont',
      email: `user_${generateId()}@example.com`,
      provider,
    };

    await storage.set('authToken', token);
    await storage.set('authUser', JSON.stringify(user));

    set({ user, token, isAuthenticated: true, isLoading: false, isNewUser: isNew });
    return isNew ? 'new' : 'returning';
  },

  sendOTP: async (phone) => {
    set({ isLoading: true, pendingPhone: phone });
    await delay(800);
    set({ isLoading: false });
  },

  verifyOTP: async (code) => {
    set({ isLoading: true });
    await delay(800);

    if (code === '000000') {
      set({ isLoading: false });
      throw new Error('Code invalide');
    }

    const isNew = Math.random() < 0.5;
    const token = generateToken();
    const phone = get().pendingPhone ?? undefined;
    const user: User = {
      id: generateId(),
      firstName: isNew ? '' : 'Marie',
      lastName: isNew ? '' : 'Martin',
      phone,
      provider: 'phone',
    };

    await storage.set('authToken', token);
    await storage.set('authUser', JSON.stringify(user));
    await storage.set(StorageKeys.HAS_ONBOARDED, 'true');

    set({ user, token, isAuthenticated: true, isLoading: false, isNewUser: isNew, pendingPhone: null });
    return isNew ? 'new' : 'returning';
  },

  completeProfile: async ({ firstName, lastName, city, avatar }) => {
    set({ isLoading: true });
    await delay(800);

    const current = get().user;
    if (!current) {
      set({ isLoading: false });
      return;
    }

    const updated: User = { ...current, firstName, lastName, city, avatar };
    await storage.set('authUser', JSON.stringify(updated));

    set({ user: updated, isLoading: false });
  },

  requestKYC: async () => {
    set({ kycStatus: 'pending' });
  },

  logout: async () => {
    await storage.remove('authToken');
    await storage.remove('authUser');
    await storage.remove(StorageKeys.HAS_ONBOARDED);

    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      token: null,
      isNewUser: false,
      kycStatus: 'none',
      pendingPhone: null,
    });
  },
}));
