const EARTH_RADIUS_KM = 6371;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Returns distance in kilometers between two lat/lng coordinates */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export type ProximityStatus = 'at_hub' | 'nearby' | 'far';

/**
 * 0–200m  → at_hub
 * 200m–1km → nearby
 * >1km     → far
 */
export function getProximityStatus(distanceKm: number): ProximityStatus {
  if (distanceKm <= 0.2) return 'at_hub';
  if (distanceKm <= 1) return 'nearby';
  return 'far';
}
