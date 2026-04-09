import { create } from 'zustand';

// ── Types ─────────────────────────────────────────────────────────────────

export type MessageType = 'text' | 'offer' | 'system';
export type OfferStatus = 'pending' | 'accepted' | 'rejected';
export type ConversationTab = 'buy' | 'sell';

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: 'me' | string;
  type: MessageType;
  text?: string;
  offerAmount?: number;
  offerStatus?: OfferStatus;
  imageUri?: string;
  createdAt: string;
  read: boolean;
  delivered: boolean;
}

export interface ConversationParticipant {
  id: string;
  username: string;
  avatar: string;
  isVerified: boolean;
  isOnline: boolean;
  lastSeen?: string;
}

export interface ConversationProduct {
  id: string;
  title: string;
  price: number;
  image: string;
}

export interface Conversation {
  id: string;
  tab: ConversationTab;
  participant: ConversationParticipant;
  product: ConversationProduct;
  unreadCount: number;
  isTyping: boolean;
}

interface MessagesState {
  conversations: Conversation[];
  messages: Record<string, ChatMessage[]>;
  sendMessage: (conversationId: string, text: string) => void;
  sendOffer: (conversationId: string, amount: number) => void;
  respondOffer: (conversationId: string, messageId: string, status: 'accepted' | 'rejected') => void;
  markAsRead: (conversationId: string) => void;
  deleteConversation: (conversationId: string) => void;
  setTyping: (conversationId: string, typing: boolean) => void;
}

// ── Mock data ─────────────────────────────────────────────────────────────

function msg(
  id: string,
  conversationId: string,
  senderId: 'me' | string,
  type: MessageType,
  createdAt: string,
  opts: Partial<ChatMessage> = {},
): ChatMessage {
  return {
    id,
    conversationId,
    senderId,
    type,
    createdAt,
    read: true,
    delivered: true,
    ...opts,
  };
}

// Helper: day offsets from now (ISO string)
function daysAgo(days: number, h = 10, m = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

const MOCK_MESSAGES: Record<string, ChatMessage[]> = {
  // ── c1: Achats — iPhone 14 Pro (karim_b) ─────────────────────────────
  c1: [
    msg('m1', 'c1', 'u2', 'text', daysAgo(3, 9, 5), {
      text: 'Bonjour ! Votre iPhone 14 Pro est-il toujours disponible ?',
    }),
    msg('m2', 'c1', 'me', 'text', daysAgo(3, 9, 12), {
      text: 'Bonjour ! Oui, toujours disponible 😊',
    }),
    msg('m3', 'c1', 'u2', 'text', daysAgo(3, 9, 20), {
      text: 'Il est dans quel état exactement ? Il y a des rayures ?',
    }),
    msg('m4', 'c1', 'me', 'text', daysAgo(3, 9, 30), {
      text: 'Comme neuf, jamais tombé, toujours avec sa coque. Batterie à 94%.',
    }),
    msg('m5', 'c1', 'u2', 'text', daysAgo(2, 14, 0), {
      text: 'Super ! Vous pouvez faire 800€ ?',
    }),
    msg('m6', 'c1', 'u2', 'offer', daysAgo(2, 14, 2), {
      offerAmount: 800,
      offerStatus: 'rejected',
    }),
    msg('m7', 'c1', 'me', 'text', daysAgo(2, 14, 15), {
      text: 'Mon prix est ferme à 849€, il est vraiment en excellent état.',
    }),
    msg('m8', 'c1', 'u2', 'text', daysAgo(1, 18, 28), {
      text: "D'accord pour 849€ ! Je peux venir récupérer demain ?",
      read: false,
    }),
    msg('m9', 'c1', 'u2', 'text', daysAgo(1, 18, 31), {
      text: 'Je suis disponible entre 14h et 18h.',
      read: false,
    }),
  ],

  // ── c2: Achats — Trek Émonda (amelie_d) ──────────────────────────────
  c2: [
    msg('m10', 'c2', 'me', 'text', daysAgo(5, 10, 0), {
      text: 'Bonjour ! Votre vélo est-il toujours disponible ?',
    }),
    msg('m11', 'c2', 'u3', 'text', daysAgo(5, 10, 20), {
      text: 'Oui ! Il est en parfait état, utilisé seulement 3 fois.',
    }),
    msg('m12', 'c2', 'me', 'text', daysAgo(4, 11, 0), {
      text: "C'est super. Vous pouvez faire 1 100€ ?",
    }),
    msg('m13', 'c2', 'me', 'offer', daysAgo(4, 11, 1), {
      offerAmount: 1100,
      offerStatus: 'accepted',
    }),
    msg('m14', 'c2', 'u3', 'text', daysAgo(4, 11, 30), {
      text: "Offre acceptée ! On se retrouve quand pour l'échange ?",
    }),
    msg('m15', 'c2', 'me', 'text', daysAgo(4, 12, 0), {
      text: 'Samedi matin à Antibes, ça vous convient ?',
    }),
    msg('m16', 'c2', 'u3', 'text', daysAgo(4, 12, 15), {
      text: 'Parfait pour samedi ! À quelle heure ?',
    }),
    msg('m17', 'c2', 'me', 'text', daysAgo(3, 9, 0), {
      text: '10h devant la gare d\'Antibes, ça vous va ?',
    }),
    msg('m18', 'c2', 'u3', 'text', daysAgo(3, 9, 10), {
      text: 'Parfait, à samedi 🤝',
    }),
  ],

  // ── c3: Achats — PS5 (fatima_o) ──────────────────────────────────────
  c3: [
    msg('m19', 'c3', 'u5', 'text', daysAgo(1, 10, 0), {
      text: 'Bonjour ! La PS5 est encore disponible ?',
    }),
    msg('m20', 'c3', 'me', 'text', daysAgo(1, 10, 10), {
      text: 'Oui, toujours dispo !',
    }),
    msg('m21', 'c3', 'u5', 'text', daysAgo(1, 10, 15), {
      text: "Elle vient avec des manettes et des jeux ?",
    }),
    msg('m22', 'c3', 'me', 'text', daysAgo(1, 10, 22), {
      text: '2 manettes DualSense + 3 jeux (FIFA 24, Spider-Man 2, Astro Bot)',
    }),
    msg('m23', 'c3', 'u5', 'offer', daysAgo(0, 22, 10), {
      offerAmount: 430,
      offerStatus: 'pending',
      read: false,
    }),
  ],

  // ── c4: Ventes — MacBook Air (marc_l buying) ─────────────────────────
  c4: [
    msg('m24', 'c4', 'u4', 'text', daysAgo(7, 14, 0), {
      text: 'Salut ! Le MacBook Air fonctionne bien ? Il est sous garantie ?',
    }),
    msg('m25', 'c4', 'me', 'text', daysAgo(7, 14, 20), {
      text: "Oui parfaitement ! Fraîchement réinstallé macOS Sonoma. Plus sous garantie mais impeccable.",
    }),
    msg('m26', 'c4', 'u4', 'text', daysAgo(6, 9, 0), {
      text: "Je le prends pour 850€. Comment on procède ?",
    }),
    msg('m27', 'c4', 'me', 'text', daysAgo(6, 9, 30), {
      text: "Via Hand to Hand Logistics, je l'envoie dès réception du paiement.",
    }),
    msg('m28', 'c4', 'u4', 'text', daysAgo(6, 10, 0), {
      text: "Paiement effectué 👍",
    }),
    msg('m29', 'c4', 'me', 'text', daysAgo(5, 11, 0), {
      text: "Colis envoyé ! Numéro de suivi : HTH2394857",
    }),
    msg('m30', 'c4', 'me', 'system', daysAgo(4, 16, 0), {
      text: '✓ Transaction complétée — Paiement reçu et livraison confirmée',
    }),
    msg('m31', 'c4', 'u4', 'text', daysAgo(4, 17, 0), {
      text: "Reçu en parfait état, merci beaucoup ! Je laisse un avis 5 étoiles ⭐",
    }),
  ],

  // ── c5: Ventes — Nike Air Max (sophie_m buying) ──────────────────────
  c5: [
    msg('m32', 'c5', 'u1', 'text', daysAgo(0, 9, 0), {
      text: "Bonjour ! Les Nike Air Max sont en quelle pointure ?",
    }),
    msg('m33', 'c5', 'me', 'text', daysAgo(0, 9, 15), {
      text: "Taille 42 EU / US 9",
    }),
    msg('m34', 'c5', 'u1', 'text', daysAgo(0, 9, 20), {
      text: "Super, c'est ma taille ! Elles ont été peu portées ?",
    }),
    msg('m35', 'c5', 'me', 'text', daysAgo(0, 9, 30), {
      text: "3-4 fois maximum, comme neuves.",
    }),
    msg('m36', 'c5', 'u1', 'text', daysAgo(0, 14, 0), {
      text: "Je les prends ! Je peux passer ce soir ?",
      read: false,
    }),
    msg('m37', 'c5', 'u1', 'text', daysAgo(0, 14, 5), {
      text: 'Disponible à partir de 18h ?',
      read: false,
    }),
  ],
};

const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: 'c1',
    tab: 'buy',
    participant: {
      id: 'u2',
      username: 'karim_b',
      avatar: 'https://i.pravatar.cc/150?img=3',
      isVerified: true,
      isOnline: true,
    },
    product: {
      id: 'p1',
      title: 'iPhone 14 Pro Max 256 Go',
      price: 849,
      image: 'https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?w=200&q=80',
    },
    unreadCount: 2,
    isTyping: false,
  },
  {
    id: 'c2',
    tab: 'buy',
    participant: {
      id: 'u3',
      username: 'amelie_d',
      avatar: 'https://i.pravatar.cc/150?img=5',
      isVerified: true,
      isOnline: false,
      lastSeen: daysAgo(0, 11, 30),
    },
    product: {
      id: 'p2',
      title: 'Trek Émonda SL5',
      price: 1100,
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&q=80',
    },
    unreadCount: 0,
    isTyping: false,
  },
  {
    id: 'c3',
    tab: 'buy',
    participant: {
      id: 'u5',
      username: 'fatima_o',
      avatar: 'https://i.pravatar.cc/150?img=9',
      isVerified: true,
      isOnline: true,
    },
    product: {
      id: 'p3',
      title: 'PS5 + 2 manettes + 3 jeux',
      price: 449,
      image: 'https://images.unsplash.com/photo-1607853202273-797f1c22a38e?w=200&q=80',
    },
    unreadCount: 1,
    isTyping: false,
  },
  {
    id: 'c4',
    tab: 'sell',
    participant: {
      id: 'u4',
      username: 'marc_l',
      avatar: 'https://i.pravatar.cc/150?img=8',
      isVerified: false,
      isOnline: false,
      lastSeen: daysAgo(1, 17, 0),
    },
    product: {
      id: 'p4',
      title: 'MacBook Air M2 512 Go',
      price: 850,
      image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=200&q=80',
    },
    unreadCount: 0,
    isTyping: false,
  },
  {
    id: 'c5',
    tab: 'sell',
    participant: {
      id: 'u1',
      username: 'sophie_m',
      avatar: 'https://i.pravatar.cc/150?img=1',
      isVerified: true,
      isOnline: true,
    },
    product: {
      id: 'p5',
      title: 'Nike Air Max 90 Taille 42',
      price: 75,
      image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&q=80',
    },
    unreadCount: 2,
    isTyping: true,
  },
];

// ── Store ─────────────────────────────────────────────────────────────────

let msgCounter = 100;

export const useMessagesStore = create<MessagesState>()((set) => ({
  conversations: MOCK_CONVERSATIONS,
  messages: MOCK_MESSAGES,

  sendMessage: (conversationId, text) => {
    const id = `m${++msgCounter}`;
    const newMsg: ChatMessage = {
      id,
      conversationId,
      senderId: 'me',
      type: 'text',
      text,
      createdAt: new Date().toISOString(),
      read: true,
      delivered: true,
    };
    set((s) => ({
      messages: {
        ...s.messages,
        [conversationId]: [...(s.messages[conversationId] ?? []), newMsg],
      },
    }));
  },

  sendOffer: (conversationId, amount) => {
    const id = `m${++msgCounter}`;
    const offerMsg: ChatMessage = {
      id,
      conversationId,
      senderId: 'me',
      type: 'offer',
      offerAmount: amount,
      offerStatus: 'pending',
      createdAt: new Date().toISOString(),
      read: true,
      delivered: true,
    };
    set((s) => ({
      messages: {
        ...s.messages,
        [conversationId]: [...(s.messages[conversationId] ?? []), offerMsg],
      },
    }));
  },

  respondOffer: (conversationId, messageId, status) => {
    set((s) => ({
      messages: {
        ...s.messages,
        [conversationId]: (s.messages[conversationId] ?? []).map((m) =>
          m.id === messageId ? { ...m, offerStatus: status } : m,
        ),
      },
    }));
  },

  markAsRead: (conversationId) => {
    set((s) => ({
      conversations: s.conversations.map((c) =>
        c.id === conversationId ? { ...c, unreadCount: 0 } : c,
      ),
      messages: {
        ...s.messages,
        [conversationId]: (s.messages[conversationId] ?? []).map((m) => ({
          ...m,
          read: true,
        })),
      },
    }));
  },

  deleteConversation: (conversationId) => {
    set((s) => {
      const msgs = { ...s.messages };
      delete msgs[conversationId];
      return {
        conversations: s.conversations.filter((c) => c.id !== conversationId),
        messages: msgs,
      };
    });
  },

  setTyping: (conversationId, typing) => {
    set((s) => ({
      conversations: s.conversations.map((c) =>
        c.id === conversationId ? { ...c, isTyping: typing } : c,
      ),
    }));
  },
}));
