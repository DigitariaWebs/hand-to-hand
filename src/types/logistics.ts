export type HubStatus = 'active' | 'inactive' | 'full';
export type HubType = 'train' | 'bus' | 'highway' | 'mall' | 'ecommerce';

export type Hub = {
  id: string;
  name: string;
  address: string;
  city: string;
  region: string;
  coordinates: { lat: number; lng: number };
  operatingHours: string;
  capacity: number;
  currentLoad: number;
  status: HubStatus;
  hubType: HubType;
  isPartner?: boolean;
  availablePackages?: number;
  priorityLevel?: 'normal' | 'high' | 'urgent';
  managerId: string;
  phone: string;
  photos: string[];
};

export type RouteStatus = 'scheduled' | 'active' | 'completed' | 'cancelled';

// ─── Delivery Method (for checkout / product selection) ──────────────────
// handtohand_hub: standard hub-to-hub via transporter (all sellers)
// handtohand_pickup: transporter picks up from store (verified e-commerce only)
// hand_delivery: in-person handover between buyer and seller
// postal: classic postal shipping
export type DeliveryMethod = 'handtohand_hub' | 'handtohand_pickup' | 'hand_delivery' | 'postal';

export type RouteType = 'recurring' | 'oneoff';
export type TransportMode = 'foot' | 'bike' | 'scooter' | 'car' | 'bus' | 'train';
export type PackageSize = 'XS' | 'S' | 'M' | 'L' | 'XL';
export type WeekDay = 'L' | 'Ma' | 'Me' | 'J' | 'V' | 'S' | 'D';

export type Route = {
  id: string;
  transporterId: string;
  transporterName: string;
  transporterAvatar: string;
  transporterRating: number;
  routeType: RouteType;
  origin: { city: string; coordinates: { lat: number; lng: number } };
  destination: { city: string; coordinates: { lat: number; lng: number } };
  departureHubId: string;
  deliveryHubIds: string[];
  stops: Array<{ city: string; hubId?: string; coordinates: { lat: number; lng: number } }>;
  departureTime: string;
  estimatedArrival: string;
  transportMode: TransportMode;
  maxPackages: number;
  maxSize: PackageSize;
  maxWeight: number; // kg
  offHubPossible: boolean;
  recurringDays: WeekDay[];
  // Legacy compat
  vehicleType: 'moto' | 'voiture' | 'camionnette' | 'camion';
  availableCapacity: number;
  totalCapacity: number;
  pricePerKg: number;
  pricePerItem: number;
  status: RouteStatus;
  distance: number; // km
};

export type Transporter = {
  id: string;
  userId: string;
  username: string;
  avatar: string;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  vehicleType: Route['vehicleType'];
  vehiclePlate: string;
  totalDeliveries: number;
  activeRoutes: Route[];
  city: string;
  phone: string;
};

// ─── Delivery Failure & Re-delivery ───────────────────────────────────────

export type DeliveryFailureReason =
  | 'buyer_no_show'        // Acheteur absent au hub
  | 'transporter_no_show'  // Transporteur absent
  | 'package_damaged'      // Colis endommagé en route
  | 'wrong_hub'            // Mauvais hub
  | 'other';               // Autre raison

export type DeliveryAttempt = {
  attemptNumber: number;       // 1 = première livraison, 2 = re-livraison
  scheduledAt: string;         // ISO date
  hubId: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'failed';
  failureReason?: DeliveryFailureReason;
  failureNote?: string;
  completedAt?: string;
  transporterId?: string;
};

// ─── QR / Handoff Types ────────────────────────────────────────────────────

export type HandoffRole = 'seller' | 'buyer' | 'transporter_pickup' | 'transporter_delivery';

export type QRPayload = {
  transactionId: string;
  role: HandoffRole;
  hubId: string;
  timestamp: number;
  orderId: string;
  code?: string;
};

export type BuyerQRPayload = {
  type: 'buyer';
  code: string;
  missionId: string;
};

export type HandoffStatus =
  | 'pending'
  | 'seller_at_hub'
  | 'picked_up'
  | 'in_transit'
  | 'buyer_at_hub'
  | 'delivered'
  | 'completed'
  | 'delivery_failed'
  | 'redelivery_pending'
  | 'redelivery_in_progress'
  | 'disputed';

export type HandoffTransaction = {
  id: string;
  orderId: string;
  routeId: string;
  sellerId: string;
  sellerName: string;
  sellerAvatar: string;
  buyerId: string;
  buyerName: string;
  buyerAvatar: string;
  transporterId: string;
  transporterName: string;
  transporterAvatar: string;
  transporterVehicle: string;
  originHubId: string;
  destinationHubId: string;
  pickupWindowStart: string;
  pickupWindowEnd: string;
  status: HandoffStatus;
  productName: string;
  productImage: string;
  price: number;
  deliveryFee: number;
  // Validation codes
  sellerQRCode: string;
  buyerQRCode: string;
  /** @deprecated Replaced by buyerQRCode (QR scan) since V3. Kept for back-compat fallback. */
  buyerOTPCode?: string;
  // Package tracking code (printed on bon d'envoi, scanned by transporter)
  packageTrackingNumber: string;
  bonEnvoiGenerated?: boolean;
  // Validation timestamps
  pickupValidatedAt?: string;
  deliveryValidatedAt?: string;
  // ─── Delivery attempts & insurance ────────────────────────────────
  deliveryAttempts: DeliveryAttempt[];
  maxAttempts: number; // default 2
  currentAttempt: number;
  insuranceTier?: 'basic' | 'premium';
  insurancePremium?: number; // € paid for premium insurance (0 if basic)
};

// ─── Delivery History ──────────────────────────────────���──────────────────

export type DeliveryHistoryStatus = 'completed' | 'cancelled' | 'disputed';

export type DeliveryHistory = {
  id: string;
  date: string; // ISO date
  routeOriginCity: string;
  routeDestinationCity: string;
  originHubName: string;
  destinationHubName: string;
  status: DeliveryHistoryStatus;
  earnings: number;
  rating: number; // 1-5
  productName: string;
  sellerName: string;
  buyerName: string;
};

// ───────────────────────────────────────────────────────────────────────────

export type LogisticsShipment = {
  id: string;
  orderId: string;
  routeId?: string;
  transporterId?: string;
  originHubId?: string;
  destinationHubId?: string;
  qrCode: string;
  weight?: number;
  dimensions?: { width: number; height: number; depth: number };
  status: 'waiting' | 'picked_up' | 'at_origin_hub' | 'in_transit' | 'at_destination_hub' | 'delivered';
  trackingEvents: Array<{
    status: string;
    message: string;
    location: string;
    timestamp: string;
  }>;
};
