/**
 * API client placeholder — all data is currently served from mock files.
 * Replace the mock implementations with real API calls when the backend is ready.
 */

import { Product } from '@/types/product';
import { User } from '@/types/user';
import { Hub, Route } from '@/types/logistics';
import { Auction } from '@/types/product';

import { mockProducts, getProductById, getProductsByCategory, getFeaturedProducts, getTopDeals, searchProducts } from './mock/products';
import { mockUsers } from './mock/users';
import { mockHubs } from './mock/hubs';
import { mockRoutes } from './mock/routes';
import { mockAuctions } from './mock/auctions';

// Simulate network delay
function delay(ms = 400): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Products ────────────────────────────────────────────────────────────────

export const ProductsAPI = {
  async list(page = 1, limit = 20): Promise<Product[]> {
    await delay();
    const start = (page - 1) * limit;
    return mockProducts.slice(start, start + limit);
  },

  async getById(id: string): Promise<Product | null> {
    await delay(200);
    return getProductById(id) ?? null;
  },

  async byCategory(category: string): Promise<Product[]> {
    await delay(300);
    return getProductsByCategory(category);
  },

  async featured(): Promise<Product[]> {
    await delay(200);
    return getFeaturedProducts();
  },

  async topDeals(): Promise<Product[]> {
    await delay(200);
    return getTopDeals();
  },

  async search(query: string): Promise<Product[]> {
    await delay(300);
    return searchProducts(query);
  },
};

// ─── Users ───────────────────────────────────────────────────────────────────

export const UsersAPI = {
  async getById(id: string): Promise<User | null> {
    await delay(200);
    return mockUsers.find((u) => u.id === id) ?? null;
  },

  async login(_phone: string, _password: string): Promise<{ user: User; token: string }> {
    await delay(600);
    // Mock: always return first user
    return { user: mockUsers[0], token: 'mock-jwt-token-abc123' };
  },

  async verifyOtp(_phone: string, _otp: string): Promise<boolean> {
    await delay(500);
    return true; // Mock: always succeeds
  },
};

// ─── Logistics ───────────────────────────────────────────────────────────────

export const HubsAPI = {
  async list(): Promise<Hub[]> {
    await delay(300);
    return mockHubs;
  },

  async getById(id: string): Promise<Hub | null> {
    await delay(200);
    return mockHubs.find((h) => h.id === id) ?? null;
  },
};

export const RoutesAPI = {
  async list(): Promise<Route[]> {
    await delay(300);
    return mockRoutes;
  },

  async search(origin: string, destination: string): Promise<Route[]> {
    await delay(400);
    const o = origin.toLowerCase();
    const d = destination.toLowerCase();
    return mockRoutes.filter(
      (r) =>
        r.origin.city.toLowerCase().includes(o) &&
        r.destination.city.toLowerCase().includes(d)
    );
  },
};

// ─── Auctions ────────────────────────────────────────────────────────────────

export const AuctionsAPI = {
  async list(): Promise<Auction[]> {
    await delay(300);
    return mockAuctions;
  },

  async getById(id: string): Promise<Auction | null> {
    await delay(200);
    return mockAuctions.find((a) => a.id === id) ?? null;
  },
};
