import { Auction } from '@/types/product';
import { mockProducts } from './products';

export const mockAuctions: Auction[] = [
  {
    id: 'a1',
    product: mockProducts.find((p) => p.id === 'p17')!,
    startPrice: 2500,
    currentPrice: 3200,
    minBidIncrement: 100,
    reservePrice: 3000,
    bids: [
      { id: 'b1', bidderId: 'u3', bidderUsername: 'amelie_d', amount: 2600, createdAt: '2025-03-28T09:00:00Z' },
      { id: 'b2', bidderId: 'u4', bidderUsername: 'marc_l', amount: 2900, createdAt: '2025-03-28T11:30:00Z' },
      { id: 'b3', bidderId: 'u3', bidderUsername: 'amelie_d', amount: 3100, createdAt: '2025-03-29T14:00:00Z' },
      { id: 'b4', bidderId: 'u5', bidderUsername: 'fatima_o', amount: 3200, createdAt: '2025-03-30T08:45:00Z' },
    ],
    endsAt: '2026-04-10T18:00:00Z',
  },
  {
    id: 'a2',
    product: mockProducts.find((p) => p.id === 'p7')!,
    startPrice: 10000,
    currentPrice: 11800,
    minBidIncrement: 200,
    reservePrice: 12000,
    bids: [
      { id: 'b5', bidderId: 'u1', bidderUsername: 'sophie_m', amount: 10200, createdAt: '2026-03-26T10:00:00Z' },
      { id: 'b6', bidderId: 'u3', bidderUsername: 'amelie_d', amount: 11000, createdAt: '2026-03-27T16:00:00Z' },
      { id: 'b7', bidderId: 'u1', bidderUsername: 'sophie_m', amount: 11800, createdAt: '2026-03-29T20:00:00Z' },
    ],
    endsAt: '2026-04-08T20:00:00Z',
  },
  {
    id: 'a3',
    product: mockProducts.find((p) => p.id === 'p3')!,
    startPrice: 300,
    currentPrice: 420,
    minBidIncrement: 20,
    bids: [
      { id: 'b8', bidderId: 'u2', bidderUsername: 'karim_b', amount: 320, createdAt: '2026-03-30T07:00:00Z' },
      { id: 'b9', bidderId: 'u4', bidderUsername: 'marc_l', amount: 360, createdAt: '2026-03-30T09:00:00Z' },
      { id: 'b10', bidderId: 'u2', bidderUsername: 'karim_b', amount: 420, createdAt: '2026-03-30T11:00:00Z' },
    ],
    endsAt: '2026-04-06T22:00:00Z',
  },
];
