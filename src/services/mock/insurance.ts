import { InsuranceClaim, InsuranceCoverage } from '@/types/insurance';
import { DELIVERY_LIMITS } from '@/constants/deliveryLimits';

// ── Pre-built coverage options for checkout ──────────────────────────────────

export function getInsuranceCoverages(productPrice: number): InsuranceCoverage[] {
  const premiumFee = Math.round(productPrice * DELIVERY_LIMITS.PREMIUM_INSURANCE_RATE * 100) / 100;

  return [
    {
      tier: 'basic',
      coverageAmount: Math.min(productPrice, DELIVERY_LIMITS.BASE_INSURANCE_COVERAGE),
      premium: 0,
      included: true,
    },
    {
      tier: 'premium',
      coverageAmount: Math.min(productPrice, DELIVERY_LIMITS.H2H_MAX_VALUE),
      premium: premiumFee,
      included: false,
    },
  ];
}

// ── Mock claims ──────────────────────────────────────────────────────────────

export const mockInsuranceClaims: InsuranceClaim[] = [
  {
    id: 'claim-001',
    orderId: 'ord-3321',
    handoffId: 'ht-2024-0031',
    claimType: 'damage',
    description: 'Le coin inférieur gauche du colis est enfoncé. L\'écran de la tablette est fissuré.',
    photos: [
      'https://images.unsplash.com/photo-1588702547919-26089e690ecc?w=300&q=80',
    ],
    status: 'approved',
    insuranceTier: 'premium',
    coverageAmount: 350,
    refundAmount: 350,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    resolvedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'claim-002',
    orderId: 'ord-5500',
    handoffId: 'ht-2024-0098',
    claimType: 'non_delivery',
    description: 'Le colis n\'a jamais été livré après deux tentatives.',
    photos: [],
    status: 'under_review',
    insuranceTier: 'basic',
    coverageAmount: 85,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
];
