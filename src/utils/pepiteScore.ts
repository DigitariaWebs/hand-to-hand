import type { Product, ProductCondition } from '@/types/product';

export type PepiteReason =
  | 'rare_category'
  | 'excellent_condition'
  | 'below_market'
  | 'high_demand'
  | 'verified_seller'
  | 'fast_delivery'
  | 'limited_stock';

export type PepiteScore = {
  productId: string;
  score: number;
  reasons: PepiteReason[];
};

export const PEPITE_THRESHOLD = 50;

const RARE_CATEGORIES = new Set(['luxe', 'collectibles', 'vintage', 'limited_edition']);

const EXCELLENT_CONDITIONS: ProductCondition[] = ['new', 'like_new'];

function getCategoryAverage(category: string): number {
  const averages: Record<string, number> = {
    electronique: 450,
    vetements: 60,
    chaussures: 120,
    maison: 300,
    luxe: 800,
    sport: 140,
    enfants: 45,
    beaute: 40,
    vehicules: 600,
    bricolage: 90,
    autre: 100,
  };
  return averages[category] ?? 150;
}

export function calculatePepiteScore(product: Product): PepiteScore {
  let score = 0;
  const reasons: PepiteReason[] = [];

  if (EXCELLENT_CONDITIONS.includes(product.condition)) {
    score += 25;
    reasons.push('excellent_condition');
  }

  const avg = getCategoryAverage(product.category);
  if (product.price < avg * 0.8) {
    score += 20;
    reasons.push('below_market');
  }

  if (product.seller.isVerified) {
    score += 15;
    reasons.push('verified_seller');
  }

  if (product.viewCount > 150) {
    score += 15;
    reasons.push('fast_delivery');
  }

  if (product.viewCount > 300) {
    score += 10;
    reasons.push('high_demand');
  }

  if (product.stock === 1) {
    score += 10;
    reasons.push('limited_stock');
  }

  if (RARE_CATEGORIES.has(product.category)) {
    score += 15;
    reasons.push('rare_category');
  }

  return { productId: product.id, score, reasons };
}

export function isPepite(product: Product): boolean {
  return calculatePepiteScore(product).score >= PEPITE_THRESHOLD;
}

export const PEPITE_REASON_LABELS: Record<PepiteReason, string> = {
  rare_category: 'Pièce rare',
  excellent_condition: 'Comme neuf',
  below_market: 'Prix attractif',
  high_demand: 'Très demandé',
  verified_seller: 'Vendeur vérifié',
  fast_delivery: 'Livraison rapide',
  limited_stock: 'Pièce unique',
};

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function shufflePepites<T extends { id: string }>(
  items: T[],
  rotationKey: string,
): T[] {
  const seed = hashString(rotationKey);
  const scored = items
    .map((item, i) => ({
      item,
      key: hashString(`${rotationKey}:${item.id}:${i}`) ^ seed,
    }))
    .sort((a, b) => a.key - b.key);
  return scored.map((x) => x.item);
}

export function getRotationKey(
  tab: 'today' | 'week' | 'month',
): string {
  const now = new Date();
  if (tab === 'today') {
    return now.toISOString().slice(0, 10);
  }
  if (tab === 'week') {
    const d = new Date(now);
    const day = d.getDay() || 7;
    d.setDate(d.getDate() - (day - 1));
    return d.toISOString().slice(0, 10);
  }
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}
