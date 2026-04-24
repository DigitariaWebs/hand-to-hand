// CO₂ savings estimator for Hand to Hand Logistics
//
// Baseline assumption: a solo courier van/parcel emits ~250 g CO₂/km.
// Because Hand to Hand transporters piggyback on an existing trip
// (carpool-style), the marginal emission per package is much lower.

export type TransportType = 'car' | 'motorcycle' | 'bicycle' | 'foot' | 'scooter' | 'bus' | 'train';

const BASELINE_G_PER_KM = 250; // solo courier van

const TRANSPORT_G_PER_KM: Record<TransportType, number> = {
  car: 90,
  motorcycle: 45,
  scooter: 45,
  bicycle: 0,
  foot: 0,
  bus: 30,
  train: 15,
};

/** CO₂ saved, in kilograms. Always ≥ 0. */
export function calculateCo2Saved(distanceKm: number, transportType: TransportType): number {
  if (!distanceKm || distanceKm <= 0) return 0;
  const baseline = distanceKm * BASELINE_G_PER_KM;
  const actual = distanceKm * (TRANSPORT_G_PER_KM[transportType] ?? 90);
  const savedGrams = Math.max(0, baseline - actual);
  return savedGrams / 1000;
}

/** Friendly label: "2.3 kg CO₂" or "320 g CO₂". */
export function formatCo2(kg: number): string {
  if (kg <= 0) return '0 g CO₂';
  if (kg < 1) return `${Math.round(kg * 1000)} g CO₂`;
  return `${kg.toFixed(1)} kg CO₂`;
}

/** Quick-grasp equivalence — "≈ N km en voiture évités". */
export function co2Equivalence(kg: number): string {
  if (kg <= 0) return '';
  // 120 g/km is a fair car average
  const carKm = Math.round((kg * 1000) / 120);
  if (carKm >= 2) return `≈ ${carKm} km en voiture évités`;
  // Below 2km, surface a tree equivalence (very rough)
  const trees = Math.max(1, Math.round(kg / 25));
  return `≈ planter ${trees} arbre${trees > 1 ? 's' : ''} pendant un an`;
}
