import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);
dayjs.locale('fr');

export function formatPrice(amount: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatRelativeTime(dateString: string): string {
  return dayjs(dateString).fromNow();
}

export function formatDate(dateString: string, format = 'DD MMM YYYY'): string {
  return dayjs(dateString).locale('fr').format(format);
}

export function formatCountdown(targetDate: string): string {
  const now = dayjs();
  const target = dayjs(targetDate);
  const diffSeconds = target.diff(now, 'second');

  if (diffSeconds <= 0) return 'Terminé';

  const days = Math.floor(diffSeconds / 86400);
  const hours = Math.floor((diffSeconds % 86400) / 3600);
  const minutes = Math.floor((diffSeconds % 3600) / 60);
  const seconds = diffSeconds % 60;

  if (days > 0) return `${days}j ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m ${seconds}s`;
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + '…';
}

export function getDealScoreLabel(score: number): { label: string; color: string } {
  if (score >= 80) return { label: 'Excellente offre', color: '#10B981' };
  if (score >= 60) return { label: 'Bonne offre', color: '#10B981' };
  if (score >= 40) return { label: 'Offre correcte', color: '#F59E0B' };
  return { label: 'Prix standard', color: '#6B7280' };
}

export function getConditionLabel(condition: string): string {
  const labels: Record<string, string> = {
    new: 'Neuf',
    like_new: 'Comme neuf',
    good: 'Bon état',
    fair: 'État correct',
    poor: 'État médiocre',
  };
  return labels[condition] ?? condition;
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 11);
}

export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
