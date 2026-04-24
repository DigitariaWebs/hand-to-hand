export type TransactionType =
  | 'sale'
  | 'purchase'
  | 'delivery_fee'
  | 'delivery_earning'
  | 'withdrawal'
  | 'refund';

export type TransactionStatus = 'completed' | 'pending' | 'failed';

export type WalletTransaction = {
  id: string;
  type: TransactionType;
  amount: number;
  label: string;
  subtitle?: string;
  productId?: string;
  missionId?: string;
  date: string;
  status: TransactionStatus;
};

export type WalletFilter = 'all' | 'sales' | 'purchases' | 'deliveries';

export type WalletState = {
  balance: number;
  pendingBalance: number;
  transactions: WalletTransaction[];
  filter: WalletFilter;
};
