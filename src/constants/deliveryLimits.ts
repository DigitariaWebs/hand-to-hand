/**
 * Delivery limits & insurance configuration for the Hand to Hand platform.
 * Centralises all thresholds used across checkout, delivery flows, and insurance logic.
 */
export const DELIVERY_LIMITS = {
  /** Maximum product value (€) eligible for Hand to Hand Logistics delivery */
  H2H_MAX_VALUE: 500,

  /** Threshold (€) at which we start recommending Premium insurance */
  PREMIUM_RECOMMEND_THRESHOLD: 200,

  /** Base insurance coverage included free (€) */
  BASE_INSURANCE_COVERAGE: 200,

  /** Premium insurance rate (percentage of product price) */
  PREMIUM_INSURANCE_RATE: 0.02, // 2%

  /** Maximum delivery attempts (initial + re-deliveries) */
  MAX_DELIVERY_ATTEMPTS: 2,

  /** Re-delivery fee when buyer is at fault — i.e. no-show (€) */
  REDELIVERY_FEE_BUYER_FAULT: 3.5,

  /** Hours within which a re-delivery must be scheduled */
  REDELIVERY_WINDOW_HOURS: 48,

  /** Days after delivery during which an insurance claim can be filed */
  CLAIM_WINDOW_DAYS: 7,
} as const;
