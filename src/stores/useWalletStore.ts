import { create } from 'zustand';
import type { WalletFilter, WalletTransaction } from '@/types/wallet';
import {
  mockWalletBalance,
  mockWalletPending,
  mockWalletTransactions,
} from '@/services/mock/wallet';

type WalletStore = {
  balance: number;
  pendingBalance: number;
  transactions: WalletTransaction[];
  filter: WalletFilter;
  lastUpdate: number;
  setFilter: (filter: WalletFilter) => void;
  addTransaction: (tx: WalletTransaction) => void;
};

export const useWalletStore = create<WalletStore>((set) => ({
  balance: mockWalletBalance,
  pendingBalance: mockWalletPending,
  transactions: mockWalletTransactions,
  filter: 'all',
  lastUpdate: Date.now(),
  setFilter: (filter) => set({ filter }),
  addTransaction: (tx) =>
    set((state) => ({
      transactions: [tx, ...state.transactions],
      balance: state.balance + tx.amount,
      lastUpdate: Date.now(),
    })),
}));
