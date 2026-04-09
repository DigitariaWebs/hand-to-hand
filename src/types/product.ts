export type ProductCondition = 'new' | 'like_new' | 'good' | 'fair' | 'poor';

export type BoostTier = 'essentiel' | 'premium' | 'ultra';

export type ListingType = 'fixed' | 'auction' | 'offer';

export type ProductStatus = 'active' | 'sold' | 'reserved' | 'expired';

export type ProductImage = {
  id: string;
  url: string;
  thumbnail: string;
};

export type ProductSeller = {
  id: string;
  username: string;
  avatar: string;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  city: string;
  accountType?: 'individual' | 'ecommerce';
  isVerifiedEcommerce?: boolean;
  storeAddress?: string;
  storeHours?: { open: string; close: string };
};

export type ProductLocation = {
  city: string;
  region: string;
  coordinates?: { lat: number; lng: number };
};

export type Product = {
  id: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  images: ProductImage[];
  category: string;
  condition: ProductCondition;
  dealScore: number; // 0-100, higher = better deal
  seller: ProductSeller;
  location: ProductLocation;
  stock: number;
  status: ProductStatus;
  listingType: ListingType;
  isBoosted: boolean;
  boost?: {
    active: boolean;
    tier: BoostTier;
    expiresAt: string;
  };
  viewCount: number;
  likeCount: number;
  tags: string[];
  createdAt: string;
  expiresAt?: string;
};

export type AuctionBid = {
  id: string;
  bidderId: string;
  bidderUsername: string;
  amount: number;
  createdAt: string;
};

export type Auction = {
  id: string;
  product: Product;
  startPrice: number;
  currentPrice: number;
  minBidIncrement: number;
  reservePrice?: number;
  bids: AuctionBid[];
  endsAt: string;
  winnerId?: string;
};
