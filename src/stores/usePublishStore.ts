import { create } from 'zustand';

export type PhotoItem = { id: string; uri: string };
export type ListingType = 'fixed' | 'auction' | 'offer';
export type AuctionDuration = '24h' | '48h' | '72h' | '7j';

interface PublishState {
  // Step 1
  photos: PhotoItem[];
  // Step 2
  title: string;
  description: string;
  category: string;
  condition: string;
  brand: string;
  categoryFields: Record<string, string>;
  // Step 3
  price: string;
  listingType: ListingType;
  auctionDuration: AuctionDuration;
  isNegotiable: boolean;
  stock: number;
  // Step 4
  handToHandLogistics: boolean;
  handover: boolean;
  handoverLocation: string;
  postal: boolean;
  postalPrice: string;

  // Actions
  setPhotos: (p: PhotoItem[]) => void;
  setTitle: (v: string) => void;
  setDescription: (v: string) => void;
  setCategory: (v: string) => void;
  setCondition: (v: string) => void;
  setBrand: (v: string) => void;
  setCategoryField: (key: string, value: string) => void;
  setPrice: (v: string) => void;
  setListingType: (v: ListingType) => void;
  setAuctionDuration: (v: AuctionDuration) => void;
  setIsNegotiable: (v: boolean) => void;
  setStock: (v: number) => void;
  setHandToHandLogistics: (v: boolean) => void;
  setHandover: (v: boolean) => void;
  setHandoverLocation: (v: string) => void;
  setPostal: (v: boolean) => void;
  setPostalPrice: (v: string) => void;
  reset: () => void;
}

const DEFAULT: Omit<PublishState, keyof { [K in keyof PublishState as PublishState[K] extends Function ? K : never]: true }> = {
  photos: [],
  title: '',
  description: '',
  category: '',
  condition: 'like_new',
  brand: '',
  categoryFields: {},
  price: '',
  listingType: 'fixed',
  auctionDuration: '7j',
  isNegotiable: false,
  stock: 1,
  handToHandLogistics: true,
  handover: false,
  handoverLocation: '',
  postal: false,
  postalPrice: '',
};

export const usePublishStore = create<PublishState>()((set) => ({
  ...DEFAULT,
  setPhotos: (photos) => set({ photos }),
  setTitle: (title) => set({ title }),
  setDescription: (description) => set({ description }),
  setCategory: (category) => set({ category, categoryFields: {} }),
  setCondition: (condition) => set({ condition }),
  setBrand: (brand) => set({ brand }),
  setCategoryField: (key, value) =>
    set((s) => ({ categoryFields: { ...s.categoryFields, [key]: value } })),
  setPrice: (price) => set({ price }),
  setListingType: (listingType) => set({ listingType }),
  setAuctionDuration: (auctionDuration) => set({ auctionDuration }),
  setIsNegotiable: (isNegotiable) => set({ isNegotiable }),
  setStock: (stock) => set({ stock }),
  setHandToHandLogistics: (handToHandLogistics) => set({ handToHandLogistics }),
  setHandover: (handover) => set({ handover }),
  setHandoverLocation: (handoverLocation) => set({ handoverLocation }),
  setPostal: (postal) => set({ postal }),
  setPostalPrice: (postalPrice) => set({ postalPrice }),
  reset: () => set(DEFAULT as Partial<PublishState>),
}));
