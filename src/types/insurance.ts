// ── Insurance types for buyer protection ────────────────────────────────────

export type InsuranceTier = 'basic' | 'premium';

export type InsuranceCoverage = {
  tier: InsuranceTier;
  /** Maximum coverage amount in € */
  coverageAmount: number;
  /** Premium (fee) in €. 0 for basic (included free). */
  premium: number;
  /** Whether this tier is included free in the service fee */
  included: boolean;
};

export type ClaimType = 'damage' | 'loss' | 'non_conformity' | 'non_delivery';

export type ClaimStatus =
  | 'pending'
  | 'under_review'
  | 'approved'
  | 'rejected';

export type InsuranceClaim = {
  id: string;
  orderId: string;
  handoffId: string;
  claimType: ClaimType;
  description: string;
  photos: string[];
  status: ClaimStatus;
  /** The insurance tier active at time of purchase */
  insuranceTier: InsuranceTier;
  /** Maximum covered by the insurance */
  coverageAmount: number;
  /** Amount refunded (set when approved) */
  refundAmount?: number;
  createdAt: string;
  resolvedAt?: string;
};

/**
 * What each tier covers — used to render the detail card in checkout.
 */
export type CoverageDetail = {
  key: string;
  label: string;
  coveredByBasic: boolean;
  coveredByPremium: boolean;
};

export const COVERAGE_DETAILS: CoverageDetail[] = [
  { key: 'damage',        label: 'Colis endommagé pendant le transport',          coveredByBasic: true,  coveredByPremium: true },
  { key: 'loss',           label: 'Colis perdu ou non livré',                      coveredByBasic: true,  coveredByPremium: true },
  { key: 'non_conformity', label: 'Article non conforme à la description',         coveredByBasic: false, coveredByPremium: true },
  { key: 'delay',          label: 'Retard de livraison (compensation)',            coveredByBasic: false, coveredByPremium: true },
  { key: 'full_refund',    label: 'Remboursement intégral garanti',                coveredByBasic: false, coveredByPremium: true },
];
