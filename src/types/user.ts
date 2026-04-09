export type UserRole = 'buyer' | 'seller' | 'transporter' | 'admin';

export type VerificationStatus = 'pending' | 'verified' | 'rejected';

export type AccountType = 'individual' | 'ecommerce';

export type User = {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  avatar: string;
  phone: string;
  email?: string;
  role: UserRole[];
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  kycStatus: VerificationStatus;
  accountType: AccountType;
  isVerifiedEcommerce: boolean;
  storeAddress?: string;
  storeHours?: { open: string; close: string };
  location: {
    city: string;
    region: string;
    coordinates?: { lat: number; lng: number };
  };
  joinedAt: string;
  totalSales: number;
  totalPurchases: number;
  bio?: string;
};

export type AuthState = {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isOnboarded: boolean;
};
