export type LiveStatus = 'live' | 'upcoming';

export type LiveSession = {
  id: string;
  hostId: string;
  hostName: string;
  hostAvatar: string;
  title: string;
  thumbnail: string;
  status: LiveStatus;
  viewerCount: number;
  scheduledAt?: string;
  productIds: string[];
  productCount: number;
  category: string;
  tags: string[];
};

export type LiveMessage = {
  id: string;
  userId: string;
  username: string;
  avatar: string;
  message: string;
};

export const mockLiveSessions: LiveSession[] = [
  {
    id: 'live1',
    hostId: 'u2',
    hostName: 'karim_b',
    hostAvatar: 'https://i.pravatar.cc/150?img=3',
    title: '🔥 Vente Flash Tech — iPhone, AirPods & plus !',
    thumbnail:
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&auto=format',
    status: 'live',
    viewerCount: 234,
    productIds: ['p1', 'p7', 'p17'],
    productCount: 8,
    category: 'electronique',
    tags: ['tech', 'apple', 'iphone'],
  },
  {
    id: 'live2',
    hostId: 'u1',
    hostName: 'sophie_m',
    hostAvatar: 'https://i.pravatar.cc/150?img=1',
    title: '👗 Mode & Luxe — Pièces uniques de Nice',
    thumbnail:
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format',
    status: 'live',
    viewerCount: 87,
    productIds: ['p3', 'p5'],
    productCount: 5,
    category: 'luxe',
    tags: ['mode', 'luxe', 'nice'],
  },
  {
    id: 'live3',
    hostId: 'u5',
    hostName: 'fatima_o',
    hostAvatar: 'https://i.pravatar.cc/150?img=9',
    title: '🛋️ Déstockage Maison — Meubles & Déco',
    thumbnail:
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&auto=format',
    status: 'upcoming',
    viewerCount: 0,
    scheduledAt: new Date(Date.now() + 86_400_000).toISOString(), // tomorrow
    productIds: ['p12', 'p14'],
    productCount: 15,
    category: 'maison',
    tags: ['maison', 'déco', 'meubles'],
  },
  {
    id: 'live4',
    hostId: 'u3',
    hostName: 'amelie_d',
    hostAvatar: 'https://i.pravatar.cc/150?img=5',
    title: '☀️ Collection Été — Vêtements complets',
    thumbnail:
      'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=800&auto=format',
    status: 'upcoming',
    viewerCount: 0,
    scheduledAt: new Date(Date.now() + 3_600_000 * 3).toISOString(), // in 3h
    productIds: ['p20', 'p22'],
    productCount: 22,
    category: 'vetements',
    tags: ['mode', 'vêtements', 'été'],
  },
];

// ── Chat helpers ───────────────────────────────────────────────────────────

const CHAT_USERS: Omit<LiveMessage, 'id' | 'message'>[] = [
  { userId: 'c1', username: 'thomas_p', avatar: 'https://i.pravatar.cc/50?img=11' },
  { userId: 'c2', username: 'lea_m', avatar: 'https://i.pravatar.cc/50?img=12' },
  { userId: 'c3', username: 'alex_j', avatar: 'https://i.pravatar.cc/50?img=13' },
  { userId: 'c4', username: 'nadia_k', avatar: 'https://i.pravatar.cc/50?img=14' },
  { userId: 'c5', username: 'remi_g', avatar: 'https://i.pravatar.cc/50?img=15' },
  { userId: 'c6', username: 'julie_b', avatar: 'https://i.pravatar.cc/50?img=16' },
  { userId: 'c7', username: 'maxime_v', avatar: 'https://i.pravatar.cc/50?img=17' },
];

const MESSAGE_POOL = [
  "C'est quoi la taille disponible ?",
  "Très beau produit ! 😍",
  "Est-ce que vous livrez à Paris ?",
  "Je suis intéressé !",
  "Quel est l'état exact ?",
  "💛💛💛",
  "On peut négocier le prix ?",
  "J'achète ! Comment faire ?",
  "Super qualité 🔥",
  "Vous acceptez les retours ?",
  "C'est du neuf ou occasion ?",
  "🔥🔥 J'adore",
  "Livraison combien de temps ?",
  "Vous êtes à Nice ?",
  "Magnifique ! 🤩",
  "Je prends ! ❤️",
  "Photo de face s'il vous plaît",
  "Top vendeur 👍",
  "Bonjour à tous ! 👋",
  "Wow super deal !",
];

export function getRandomLiveMessage(): LiveMessage {
  const user = CHAT_USERS[Math.floor(Math.random() * CHAT_USERS.length)];
  const message = MESSAGE_POOL[Math.floor(Math.random() * MESSAGE_POOL.length)];
  return {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    ...user,
    message,
  };
}

export const INITIAL_MESSAGES: LiveMessage[] = [
  {
    id: 'im1',
    userId: 'c5',
    username: 'remi_g',
    avatar: 'https://i.pravatar.cc/50?img=15',
    message: 'Bonjour à tous ! 👋',
  },
  {
    id: 'im2',
    userId: 'c1',
    username: 'thomas_p',
    avatar: 'https://i.pravatar.cc/50?img=11',
    message: "J'adore ce produit ! 🔥",
  },
  {
    id: 'im3',
    userId: 'c3',
    username: 'alex_j',
    avatar: 'https://i.pravatar.cc/50?img=13',
    message: "C'est disponible pour combien ?",
  },
  {
    id: 'im4',
    userId: 'c2',
    username: 'lea_m',
    avatar: 'https://i.pravatar.cc/50?img=12',
    message: 'Livraison en Provence possible ?',
  },
  {
    id: 'im5',
    userId: 'c4',
    username: 'nadia_k',
    avatar: 'https://i.pravatar.cc/50?img=14',
    message: 'Je viens de rejoindre 😊',
  },
];
