export type NotificationType = 'message' | 'order' | 'auction' | 'delivery' | 'boost';

export type AppNotification = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  timestamp: string;
  isRead: boolean;
  actionRoute?: string;
};

export const mockNotifications: AppNotification[] = [
  // ── Messages ─────────────────────────────────────────────────────────────
  {
    id: 'n1',
    type: 'message',
    title: 'karim_b vous a répondu',
    body: 'D\'accord pour la remise en main propre à Nice Gare demain à 14h ?',
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    isRead: false,
    actionRoute: '/chat/karim_b',
  },
  {
    id: 'n2',
    type: 'message',
    title: 'amelie_d vous a envoyé une offre',
    body: 'Je vous propose 65€ pour la veste en cuir. Est-ce que vous acceptez ?',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    isRead: false,
    actionRoute: '/chat/amelie_d',
  },
  {
    id: 'n3',
    type: 'message',
    title: 'sophie_m a répondu à votre avis',
    body: 'Merci pour votre avis, ravie que la transaction se soit bien passée !',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    isRead: true,
    actionRoute: '/chat/sophie_m',
  },

  // ── Orders ────────────────────────────────────────────────────────────────
  {
    id: 'n4',
    type: 'order',
    title: 'Commande confirmée 🎉',
    body: 'Bonne nouvelle ! Votre commande #HTH-2024-0042 est confirmée. Le vendeur prépare votre colis avec soin.',
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    isRead: false,
    actionRoute: '/order/ord-001',
  },
  {
    id: 'n5',
    type: 'order',
    title: 'Paiement reçu',
    body: 'L\'acheteur a bien reçu sa commande. 85€ ont été transférés sur votre compte. Merci !',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    isRead: false,
    actionRoute: '/order/ord-002',
  },
  {
    id: 'n6',
    type: 'order',
    title: 'Votre article a été vendu !',
    body: 'La veste en cuir vintage a été achetée par amelie_d pour 85€.',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    isRead: true,
    actionRoute: '/order/ord-003',
  },
  {
    id: 'n7',
    type: 'order',
    // CRM: Welcome sequence
    title: 'Bienvenue sur Hand to Hand ! 🎉',
    body: 'Découvrez les offres près de chez vous et commencez à acheter ou vendre dès aujourd\'hui.',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    isRead: true,
    actionRoute: '/',
  },

  // ── Auctions ──────────────────────────────────────────────────────────────
  {
    id: 'n8',
    type: 'auction',
    title: 'Nouvelle enchère sur votre article',
    body: 'Une offre de 120€ a été placée sur la montre Casio. Vous pouvez enchérir à nouveau si vous le souhaitez.',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    isRead: false,
    actionRoute: '/auction/auc-001',
  },
  {
    id: 'n9',
    type: 'auction',
    // CRM: Auction ending sequence
    title: 'Enchère se termine bientôt ⏱️',
    body: 'L\'enchère sur le MacBook Air 2022 se termine dans 1h ! Offre actuelle : 450€.',
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    isRead: false,
    actionRoute: '/auction/auc-002',
  },
  {
    id: 'n10',
    type: 'auction',
    title: 'Vous avez remporté l\'enchère 🏆',
    body: 'Félicitations ! Vous avez remporté la Nintendo Switch pour 145€.',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    isRead: true,
    actionRoute: '/checkout/prod-007',
  },

  // ── Deliveries ────────────────────────────────────────────────────────────
  {
    id: 'n11',
    type: 'delivery',
    // CRM: New transporter match
    title: 'Un transporteur est disponible 🚗',
    body: 'Bonne nouvelle ! Un transporteur peut prendre en charge votre colis Nice → Marseille. Prenez votre temps pour confirmer.',
    timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    isRead: false,
    actionRoute: '/logistics/transporter-list',
  },
  {
    id: 'n12',
    type: 'delivery',
    title: 'Votre colis est en route',
    body: 'karim_b a récupéré votre colis au Hub Nice Centre. Arrivée prévue demain vers 15h, on vous tient au courant.',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    isRead: true,
    actionRoute: '/logistics/delivery-tracking',
  },
  {
    id: 'n13',
    type: 'delivery',
    title: 'Votre colis vous attend',
    body: 'Tout est prêt ! Votre commande est disponible au Hub Cannes Croisette jusqu\'à 20h. Prenez votre temps.',
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    isRead: true,
    actionRoute: '/logistics/buyer-handoff',
  },

  // ── Boost ─────────────────────────────────────────────────────────────────
  {
    id: 'n14',
    type: 'boost',
    title: 'Votre Boost se termine bientôt ⚡',
    body: 'Le boost de votre annonce "Veste en cuir vintage" expire dans 2h. Vous pouvez le renouveler si vous le souhaitez.',
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    isRead: false,
    actionRoute: '/boost',
  },
  {
    id: 'n15',
    type: 'boost',
    // CRM: Inactive 3-day reactivation
    title: 'De belles trouvailles près de chez vous 👀',
    body: '3 nouveaux articles viennent d\'apparaître autour de vous. Jetez-y un œil quand vous voulez.',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    isRead: true,
    actionRoute: '/',
  },
];

// ── CRM push notification templates ───────────────────────────────────────

export const CRM_TEMPLATES = {
  welcome: {
    title: 'Bienvenue sur Hand to Hand ! 🎉',
    body: 'Découvrez les offres près de chez vous.',
  },
  inactive_3days: {
    title: 'De belles trouvailles vous attendent',
    body: 'De nouvelles annonces sont apparues autour de vous. Jetez un œil quand vous voulez.',
  },
  price_drop: (product: string, price: number) => ({
    title: `Baisse de prix sur ${product}`,
    body: `Le ${product} que vous aimez est passé à ${price}€ !`,
  }),
  new_transporter: {
    title: 'Un transporteur est disponible 🚗',
    body: 'Bonne nouvelle, un transporteur peut prendre en charge votre colis !',
  },
  auction_ending: (product: string) => ({
    title: 'Enchère se termine bientôt ⏱️',
    body: `L'enchère sur ${product} se termine dans 1h !`,
  }),
} as const;
