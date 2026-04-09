export const SERVICE_FEE_RATE = 0.05; // 5%

export type PriceBreakdown = {
  itemPrice: number;
  deliveryFee: number;
  serviceFee: number;
  total: number;
};

export function calculatePricing(itemPrice: number, deliveryFee: number): PriceBreakdown {
  const serviceFee = Math.round(itemPrice * SERVICE_FEE_RATE * 100) / 100;
  const total = Math.round((itemPrice + deliveryFee + serviceFee) * 100) / 100;
  return { itemPrice, deliveryFee, serviceFee, total };
}

// ── Card utilities ────────────────────────────────────────────────────────

export type CardType = 'visa' | 'mastercard' | 'amex' | 'unknown';

export function detectCardType(raw: string): CardType {
  const n = raw.replace(/\D/g, '');
  if (/^4/.test(n)) return 'visa';
  if (/^5[1-5]/.test(n) || /^2[2-7]\d{2}/.test(n)) return 'mastercard';
  if (/^3[47]/.test(n)) return 'amex';
  return 'unknown';
}

/** Luhn algorithm — returns true if card number passes checksum */
export function luhnCheck(raw: string): boolean {
  const n = raw.replace(/\D/g, '');
  if (!/^\d{13,19}$/.test(n)) return false;
  let sum = 0;
  let alternate = false;
  for (let i = n.length - 1; i >= 0; i--) {
    let digit = parseInt(n[i], 10);
    if (alternate) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    alternate = !alternate;
  }
  return sum % 10 === 0;
}

/** Returns true if expiry (MM/YY) is a future or current month */
export function validateExpiry(expiry: string): boolean {
  const m = expiry.match(/^(\d{2})\/(\d{2})$/);
  if (!m) return false;
  const month = parseInt(m[1], 10);
  const year = parseInt(m[2], 10) + 2000;
  if (month < 1 || month > 12) return false;
  const now = new Date();
  return new Date(year, month - 1) >= new Date(now.getFullYear(), now.getMonth());
}

/** CVV is 3 digits for most cards, 4 for Amex */
export function validateCVV(cvv: string, cardType: CardType): boolean {
  return cardType === 'amex' ? /^\d{4}$/.test(cvv) : /^\d{3}$/.test(cvv);
}

/** Format raw digits with spaces: Amex = 4-6-5, others = 4-4-4-4 */
export function formatCardNumber(raw: string, cardType: CardType): string {
  const digits = raw.replace(/\D/g, '');
  if (cardType === 'amex') {
    const a = digits.slice(0, 4);
    const b = digits.slice(4, 10);
    const c = digits.slice(10, 15);
    return [a, b, c].filter(Boolean).join(' ');
  }
  const chunks = [];
  for (let i = 0; i < Math.min(digits.length, 16); i += 4) {
    chunks.push(digits.slice(i, i + 4));
  }
  return chunks.join(' ');
}

/** Expected card length (digits only) */
export function cardMaxLength(cardType: CardType): number {
  return cardType === 'amex' ? 15 : 16;
}
