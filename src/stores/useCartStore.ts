import { create } from 'zustand';
import { Product } from '@/types/product';
import { CartItem } from '@/types/order';

type CartStore = {
  items: CartItem[];
  recentOrderId: string | null;
  recentOrderNumber: string | null;

  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: () => number;
  subtotal: () => number;
  placeOrder: (orderId: string, orderNumber: string) => void;
};

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  recentOrderId: null,
  recentOrderNumber: null,

  addItem: (product, quantity = 1) =>
    set((state) => {
      const existing = state.items.find((i) => i.product.id === product.id);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.product.id === product.id
              ? { ...i, quantity: Math.min(i.quantity + quantity, product.stock) }
              : i
          ),
        };
      }
      return { items: [...state.items, { product, quantity }] };
    }),

  removeItem: (productId) =>
    set((state) => ({
      items: state.items.filter((i) => i.product.id !== productId),
    })),

  updateQuantity: (productId, quantity) =>
    set((state) => {
      if (quantity <= 0) {
        return { items: state.items.filter((i) => i.product.id !== productId) };
      }
      return {
        items: state.items.map((i) =>
          i.product.id === productId ? { ...i, quantity } : i
        ),
      };
    }),

  clearCart: () => set({ items: [] }),

  placeOrder: (orderId, orderNumber) =>
    set({ recentOrderId: orderId, recentOrderNumber: orderNumber, items: [] }),

  totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

  subtotal: () =>
    get().items.reduce((sum, i) => sum + i.product.price * i.quantity, 0),
}));
