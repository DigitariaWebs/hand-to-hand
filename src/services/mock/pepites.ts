import type { Product } from '@/types/product';
import { mockProducts } from './products';
import { calculatePepiteScore, PEPITE_THRESHOLD } from '@/utils/pepiteScore';

function pickTop(n: number): Product[] {
  const scored = mockProducts
    .map((p) => ({ product: p, score: calculatePepiteScore(p).score }))
    .filter((x) => x.score >= PEPITE_THRESHOLD)
    .sort((a, b) => b.score - a.score);

  if (scored.length >= n) {
    return scored.slice(0, n).map((x) => x.product);
  }

  const rest = mockProducts
    .filter((p) => !scored.find((s) => s.product.id === p.id))
    .sort((a, b) => (b.dealScore ?? 0) - (a.dealScore ?? 0))
    .slice(0, n - scored.length);

  return [...scored.map((x) => x.product), ...rest];
}

export const mockPepites: Product[] = pickTop(8);
