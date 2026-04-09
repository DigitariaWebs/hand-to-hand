import { create } from 'zustand';
import { Hub, Route, HandoffTransaction, RouteType, TransportMode, PackageSize, WeekDay } from '@/types/logistics';
import {
  getToleranceStatus,
  getToleranceWindow,
  buildToleranceNotifications,
  type ToleranceStatus,
  type ToleranceNotification,
} from '@/utils/tolerance';

// ── Publish draft ─────────────────────────────────────────────────────────

export type PublishDraft = {
  routeType: RouteType | null;
  departureCity: string;
  arrivalCity: string;
  departureHubId: string | null;
  deliveryHubIds: string[];
  departureTime: string; // HH:mm
  arrivalTime: string;   // HH:mm
  recurringDays: WeekDay[];
  transportMode: TransportMode | null;
  maxPackages: number;
  maxSize: PackageSize;
  maxWeight: number;
  offHubPossible: boolean;
};

const EMPTY_DRAFT: PublishDraft = {
  routeType: null,
  departureCity: '',
  arrivalCity: '',
  departureHubId: null,
  deliveryHubIds: [],
  departureTime: '08:00',
  arrivalTime: '10:00',
  recurringDays: [],
  transportMode: null,
  maxPackages: 1,
  maxSize: 'M',
  maxWeight: 5,
  offHubPossible: false,
};

// ── Mission state ─────────────────────────────────────────────────────────

export type MissionStatus =
  | 'idle'
  | 'pending_transporter'
  | 'pending_seller'
  | 'seller_timer'
  | 'group_created'
  | 'pickup_pending'
  | 'picked_up'
  | 'in_transit'
  | 'delivery_pending'
  | 'completed'
  | 'cancelled';

export type GroupMember = {
  role: 'seller' | 'transporter' | 'buyer';
  userId: string;
  name: string;
  avatar: string;
  rating: number;
};

export type Mission = {
  id: string;
  status: MissionStatus;
  handoff: HandoffTransaction;
  sellerTimerEnd: number | null; // timestamp ms
  groupMembers: GroupMember[];
};

// ── Store ──────────────────────────────────────────────────────────────────

type LogisticsStore = {
  hubs: Hub[];
  routes: Route[];
  selectedHub: Hub | null;
  selectedRoute: Route | null;
  nearbyHubs: Hub[];
  activeHandoff: HandoffTransaction | null;
  handoffStep: number;
  scanSuccess: boolean;

  draft: PublishDraft;
  mission: Mission | null;

  // ── Hub locking ──────────────────────────────────────────────────────
  lockedHubId: string | null;
  isHubLocked: boolean;

  // ── Transporter status ───────────────────────────────────────────────
  transporterStatus: 'active' | 'offline';

  // ── Favorite transporters ────────────────────────────────────────────
  favoriteTransporterIds: string[];

  // ── Tolerance ────────────────────────────────────────────────────────
  toleranceNotifications: ToleranceNotification[];

  setHubs: (hubs: Hub[]) => void;
  setRoutes: (routes: Route[]) => void;
  selectHub: (hub: Hub | null) => void;
  selectRoute: (route: Route | null) => void;
  setNearbyHubs: (hubs: Hub[]) => void;
  setActiveHandoff: (handoff: HandoffTransaction | null) => void;
  setHandoffStep: (step: number) => void;
  setScanSuccess: (success: boolean) => void;
  advanceHandoffStep: () => void;

  updateDraft: (patch: Partial<PublishDraft>) => void;
  resetDraft: () => void;

  // Mission actions
  startMission: (handoff: HandoffTransaction) => void;
  setMissionStatus: (status: MissionStatus) => void;
  acceptMission: () => void;
  startSellerTimer: () => void;
  sellerAccept: () => void;
  cancelMission: () => void;
  completeMission: () => void;

  // Hub locking actions
  lockHub: (hubId: string) => void;
  unlockHub: () => void;

  // Transporter status actions
  setTransporterStatus: (status: 'active' | 'offline') => void;

  // Favorite transporter actions
  addFavoriteTransporter: (id: string) => void;
  removeFavoriteTransporter: (id: string) => void;
  isFavoriteTransporter: (id: string) => boolean;

  // Tolerance actions
  getToleranceStatusForStep: (referenceTime: Date) => ToleranceStatus;
  initToleranceNotifications: (referenceTime: Date, hubName: string) => void;
  fireToleranceNotification: (id: string) => void;
};

const SELLER_TIMER_DURATION_MS = 20 * 60 * 1000; // 20 minutes

// Pre-set 2 favorite transporter IDs for demo
const INITIAL_FAVORITE_IDS = ['u2', 'u4'];

export const useLogisticsStore = create<LogisticsStore>((set, get) => ({
  hubs: [],
  routes: [],
  selectedHub: null,
  selectedRoute: null,
  nearbyHubs: [],
  activeHandoff: null,
  handoffStep: 0,
  scanSuccess: false,

  draft: { ...EMPTY_DRAFT },
  mission: null,

  // Hub locking
  lockedHubId: null,
  isHubLocked: false,

  // Transporter status
  transporterStatus: 'active',

  // Favorite transporters (pre-seeded for demo)
  favoriteTransporterIds: [...INITIAL_FAVORITE_IDS],

  // Tolerance
  toleranceNotifications: [],

  setHubs: (hubs) => set({ hubs }),
  setRoutes: (routes) => set({ routes }),
  selectHub: (hub) => set({ selectedHub: hub }),
  selectRoute: (route) => set({ selectedRoute: route }),
  setNearbyHubs: (hubs) => set({ nearbyHubs: hubs }),
  setActiveHandoff: (handoff) => set({ activeHandoff: handoff }),
  setHandoffStep: (step) => set({ handoffStep: step }),
  setScanSuccess: (success) => set({ scanSuccess: success }),
  advanceHandoffStep: () => set({ handoffStep: get().handoffStep + 1 }),

  updateDraft: (patch) => set({ draft: { ...get().draft, ...patch } }),
  resetDraft: () => set({ draft: { ...EMPTY_DRAFT } }),

  // Mission lifecycle
  startMission: (handoff) =>
    set({
      mission: {
        id: `m-${Date.now()}`,
        status: 'pending_transporter',
        handoff,
        sellerTimerEnd: null,
        groupMembers: [
          { role: 'seller', userId: handoff.sellerId, name: handoff.sellerName, avatar: handoff.sellerAvatar, rating: 4.8 },
          { role: 'transporter', userId: handoff.transporterId, name: handoff.transporterName, avatar: handoff.transporterAvatar, rating: 4.9 },
          { role: 'buyer', userId: handoff.buyerId, name: handoff.buyerName, avatar: handoff.buyerAvatar, rating: 4.7 },
        ],
      },
    }),

  setMissionStatus: (status) => {
    const m = get().mission;
    if (m) set({ mission: { ...m, status } });
  },

  acceptMission: () => {
    const m = get().mission;
    if (m) {
      // Lock hub when transporter accepts
      set({
        mission: { ...m, status: 'pending_seller' },
        lockedHubId: m.handoff.destinationHubId,
        isHubLocked: true,
      });
    }
  },

  startSellerTimer: () => {
    const m = get().mission;
    if (m)
      set({
        mission: {
          ...m,
          status: 'seller_timer',
          sellerTimerEnd: Date.now() + SELLER_TIMER_DURATION_MS,
        },
      });
  },

  sellerAccept: () => {
    const m = get().mission;
    if (m) set({ mission: { ...m, status: 'group_created', sellerTimerEnd: null } });
  },

  cancelMission: () => {
    const m = get().mission;
    if (m) set({
      mission: { ...m, status: 'cancelled', sellerTimerEnd: null },
      lockedHubId: null,
      isHubLocked: false,
    });
  },

  completeMission: () => {
    const m = get().mission;
    if (m) set({
      mission: { ...m, status: 'completed' },
      lockedHubId: null,
      isHubLocked: false,
    });
  },

  // Hub locking
  lockHub: (hubId) => set({ lockedHubId: hubId, isHubLocked: true }),
  unlockHub: () => set({ lockedHubId: null, isHubLocked: false }),

  // Transporter status
  setTransporterStatus: (status) => set({ transporterStatus: status }),

  // Favorite transporters
  addFavoriteTransporter: (id) => {
    const ids = get().favoriteTransporterIds;
    if (!ids.includes(id)) set({ favoriteTransporterIds: [...ids, id] });
  },
  removeFavoriteTransporter: (id) => {
    set({ favoriteTransporterIds: get().favoriteTransporterIds.filter((fid) => fid !== id) });
  },
  isFavoriteTransporter: (id) => get().favoriteTransporterIds.includes(id),

  // Tolerance
  getToleranceStatusForStep: (referenceTime) => getToleranceStatus(referenceTime),

  initToleranceNotifications: (referenceTime, hubName) => {
    set({ toleranceNotifications: buildToleranceNotifications(referenceTime, hubName) });
  },

  fireToleranceNotification: (id) => {
    const notifs = get().toleranceNotifications.map((n) =>
      n.id === id ? { ...n, fired: true } : n,
    );
    set({ toleranceNotifications: notifs });
  },
}));
