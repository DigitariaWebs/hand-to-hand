const fr = {
  // Navigation tabs
  tabs: {
    home: 'Accueil',
    search: 'Rechercher',
    sell: 'Vendre',
    messages: 'Messages',
    profile: 'Profil',
  },

  // Auth
  auth: {
    login: 'Se connecter',
    signup: "S'inscrire",
    logout: 'Se déconnecter',
    phone: 'Numéro de téléphone',
    password: 'Mot de passe',
    confirmPassword: 'Confirmer le mot de passe',
    forgotPassword: 'Mot de passe oublié ?',
    noAccount: "Pas de compte ?",
    hasAccount: 'Déjà un compte ?',
    otpTitle: 'Code de vérification',
    otpSubtitle: 'Entrez le code envoyé au',
    otpResend: 'Renvoyer le code',
    kycTitle: 'Vérification identité',
    kycSubtitle: 'Pour sécuriser votre compte',
    firstName: 'Prénom',
    lastName: 'Nom',
    email: 'Email (optionnel)',
    username: 'Nom d\'utilisateur',
    continue: 'Continuer',
    verify: 'Vérifier',
  },

  // Onboarding
  onboarding: {
    skip: 'Passer',
    next: 'Suivant',
    start: 'Commencer',
    slide1Title: 'Achetez et vendez localement',
    slide1Subtitle: 'Trouvez des bonnes affaires près de chez vous en Côte d\'Azur',
    slide2Title: 'Livraison entre particuliers',
    slide2Subtitle: 'Faites livrer vos achats par des transporteurs locaux vérifiés',
    slide3Title: 'Paiement sécurisé',
    slide3Subtitle: 'Vos paiements sont protégés jusqu\'à réception de votre commande',
  },

  // Home
  home: {
    greeting: 'Bonjour',
    searchPlaceholder: 'Rechercher des articles...',
    featured: 'À la une',
    recentlyAdded: 'Récemment ajoutés',
    nearYou: 'Près de vous',
    topDeals: 'Meilleures offres',
    seeAll: 'Voir tout',
    categories: 'Catégories',
    auctions: 'Enchères en cours',
    endsSoon: 'Se termine bientôt',
  },

  // Product
  product: {
    condition: 'État',
    conditions: {
      new: 'Neuf',
      like_new: 'Comme neuf',
      good: 'Bon état',
      fair: 'État correct',
      poor: 'État médiocre',
    },
    description: 'Description',
    seller: 'Vendeur',
    location: 'Localisation',
    views: 'vues',
    likes: 'j\'aime',
    addToCart: 'Ajouter au panier',
    buyNow: 'Acheter maintenant',
    makeOffer: 'Faire une offre',
    share: 'Partager',
    save: 'Sauvegarder',
    report: 'Signaler',
    stock: 'En stock',
    outOfStock: 'Rupture de stock',
    dealScore: 'Score offre',
    boosted: 'Mis en avant',
    batteryTooltip:
      "Ceci est une mesure de la capacité de la batterie comparée à ce qu'elle était neuve. Une capacité plus faible peut réduire le nombre d'heures d'utilisation possible entre les recharges.",
  },

  // Auction
  auction: {
    currentBid: 'Enchère actuelle',
    yourBid: 'Votre enchère',
    placeBid: 'Enchérir',
    timeLeft: 'Temps restant',
    bids: 'enchères',
    noBids: 'Soyez le premier à enchérir',
    minBid: 'Enchère minimum',
    reserveNotMet: 'Prix de réserve non atteint',
    won: 'Enchère gagnée !',
    outbid: 'Surenchéri',
    watchlist: 'Ma liste de surveillance',
  },

  // Cart & Checkout
  cart: {
    title: 'Mon panier',
    empty: 'Votre panier est vide',
    subtotal: 'Sous-total',
    delivery: 'Livraison',
    fees: 'Frais de service',
    total: 'Total',
    checkout: 'Procéder au paiement',
    remove: 'Supprimer',
    quantity: 'Quantité',
  },

  // Search
  search: {
    placeholder: 'Rechercher...',
    filters: 'Filtres',
    sortBy: 'Trier par',
    noResults: 'Aucun résultat',
    results: 'résultats',
    priceRange: 'Fourchette de prix',
    category: 'Catégorie',
    condition: 'État',
    location: 'Localisation',
    distance: 'Distance',
    recent: 'Recherches récentes',
    popular: 'Recherches populaires',
  },

  // Messages
  messages: {
    title: 'Messages',
    noMessages: 'Aucun message',
    typeMessage: 'Écrire un message...',
    send: 'Envoyer',
    online: 'En ligne',
    offline: 'Hors ligne',
    offer: 'Offre',
    makeOffer: 'Faire une offre',
  },

  // Profile
  profile: {
    myListings: 'Mes annonces',
    myOrders: 'Mes commandes',
    myPurchases: 'Mes achats',
    myReviews: 'Mes avis',
    savedItems: 'Articles sauvegardés',
    wallet: 'Mon portefeuille',
    settings: 'Paramètres',
    editProfile: 'Modifier le profil',
    sales: 'ventes',
    rating: 'Note',
    reviews: 'avis',
    joined: 'Membre depuis',
    verified: 'Vérifié',
  },

  // Logistics
  logistics: {
    title: 'Logistique',
    publishRoute: 'Publier un trajet',
    selectHub: 'Choisir un hub',
    transporters: 'Transporteurs',
    tracking: 'Suivi',
    myRoutes: 'Mes trajets',
    myShipments: 'Mes colis',
    origin: 'Départ',
    destination: 'Arrivée',
    departure: 'Départ le',
    arrival: 'Arrivée estimée',
    capacity: 'Capacité disponible',
    pricePerKg: '€/kg',
    vehicleType: 'Type de véhicule',
    vehicles: {
      moto: 'Moto',
      voiture: 'Voiture',
      camionnette: 'Camionnette',
      camion: 'Camion',
    },
    hubNearYou: 'Hubs près de vous',
    dropOff: 'Déposer',
    pickup: 'Récupérer',
    qrCode: 'Code QR du colis',
    scan: 'Scanner',
  },

  // Common
  common: {
    cancel: 'Annuler',
    confirm: 'Confirmer',
    save: 'Enregistrer',
    edit: 'Modifier',
    delete: 'Supprimer',
    back: 'Retour',
    close: 'Fermer',
    loading: 'Chargement...',
    error: 'Une erreur est survenue',
    retry: 'Réessayer',
    success: 'Succès',
    by: 'par',
    from: 'de',
    to: 'à',
    and: 'et',
    or: 'ou',
    free: 'Gratuit',
    perDay: 'par jour',
    new: 'Nouveau',
    popular: 'Populaire',
    soldOut: 'Épuisé',
    km: 'km',
    euro: '€',
  },

  // Errors
  errors: {
    network: 'Erreur réseau. Vérifiez votre connexion.',
    auth: 'Erreur d\'authentification.',
    notFound: 'Contenu introuvable.',
    forbidden: 'Accès refusé.',
    generic: 'Quelque chose a mal tourné.',
  },
} as const;

export type TranslationKeys = typeof fr;
export default fr;
