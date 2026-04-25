import { HandoffTransaction } from '@/types/logistics';

export const mockHandoffTransaction: HandoffTransaction = {
  id: 'ht-2024-0042',
  orderId: 'ord-7891',
  routeId: 'r1',
  sellerId: 'u1',
  sellerName: 'sophie_m',
  sellerAvatar: 'https://i.pravatar.cc/150?img=1',
  buyerId: 'u3',
  buyerName: 'amelie_d',
  buyerAvatar: 'https://i.pravatar.cc/150?img=5',
  transporterId: 'u2',
  transporterName: 'karim_b',
  transporterAvatar: 'https://i.pravatar.cc/150?img=3',
  transporterVehicle: 'Renault Kangoo • AA-123-BB',
  originHubId: 'h1',
  destinationHubId: 'h3',
  pickupWindowStart: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
  pickupWindowEnd: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
  status: 'pending',
  productName: 'Veste en cuir vintage',
  productImage: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&q=80',
  price: 85.0,
  deliveryFee: 4.5,
  sellerQRCode: 'HTH-QR-2024-0042-SELLER',
  buyerQRCode: 'BUY-7E3B',
  packageTrackingNumber: 'HTH-58A2F',
  bonEnvoiGenerated: false,
  // Delivery attempts & insurance
  deliveryAttempts: [
    {
      attemptNumber: 1,
      scheduledAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      hubId: 'h3',
      status: 'scheduled',
      transporterId: 'u2',
    },
  ],
  maxAttempts: 2,
  currentAttempt: 1,
  insuranceTier: 'basic',
  insurancePremium: 0,
};

/**
 * Mock of a handoff where the first delivery FAILED and a re-delivery is pending.
 * Used for testing the delivery-failed & redelivery-schedule screens.
 */
export const mockFailedHandoffTransaction: HandoffTransaction = {
  ...mockHandoffTransaction,
  id: 'ht-2024-0098',
  orderId: 'ord-5500',
  status: 'delivery_failed',
  productName: 'MacBook Air M2 — 256Go',
  productImage: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&q=80',
  price: 420.0,
  deliveryFee: 4.5,
  insuranceTier: 'premium',
  insurancePremium: 8.4,
  currentAttempt: 1,
  deliveryAttempts: [
    {
      attemptNumber: 1,
      scheduledAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      hubId: 'h3',
      status: 'failed',
      failureReason: 'buyer_no_show',
      failureNote: 'L\'acheteur ne s\'est pas présenté au hub dans le délai imparti.',
      transporterId: 'u2',
    },
  ],
};
