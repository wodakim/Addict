import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type OwnedItemRecord = Record<string, number>;
export type EventRewardsRecord = Record<string, number>;
export type CafeZoneId = 'counter' | 'kitchen' | 'lounge' | 'terrace' | 'office' | 'secret-garden';
export type RewardReason = 'energy' | 'offline_double' | 'instant_merge' | 'battlepass_xp';

export interface PlacedObject {
  uid: string;
  itemId: string;
  zoneId: CafeZoneId;
  x: number;
  y: number;
  rotation: number;
}

export interface ShopPurchaseRecord {
  id: string;
  timestamp: number;
  priceLabel: string;
}

export interface BattlePassState {
  seasonId: string;
  seasonEndsAt: number;
  xp: number;
  level: number;
  premiumUnlocked: boolean;
  claimedFree: number[];
  claimedPremium: number[];
}

export interface QuestProgress {
  id: string;
  type: 'daily' | 'milestone' | 'special';
  title: string;
  target: number;
  metric: string;
  progress: number;
  completed: boolean;
  claimed: boolean;
  rewards: Record<string, number>;
}

export interface AudioSettings {
  master: number;
  sfx: number;
  music: number;
  voice: number;
  particlesEnabled: boolean;
  musicEnabled: boolean;
  zenMode: boolean;
}

export interface FriendProfile {
  id: string;
  code: string;
  name: string;
  cafeLevel: number;
  streak: number;
  lastLoginAt: number;
  lastHelpReceivedAt: number;
  helpHistory: string[];
}

export interface ClanGoal {
  id: string;
  title: string;
  target: number;
  progress: number;
  completed: boolean;
}

export interface ClanState {
  id: string;
  name: string;
  code: string;
  members: string[];
  weeklyResetAt: number;
  goals: ClanGoal[];
  rewardsClaimedWeek: boolean;
}

export interface ContextualOfferState {
  enabled: boolean;
  seenThisSession: boolean;
  totalSeen: number;
}

export interface SocialState {
  socialEnabled: boolean;
  helpDayKey: string;
  helpsSentToday: number;
  helpRequestsToday: number;
  lastHelpSentAt: number;
}

export interface LiveOpsState {
  joinedEventIds: string[];
  lastEventRotationIndex: number;
  lastEventCheckAt: number;
}

export interface NotificationState {
  dayKey: string;
  sentToday: number;
  lastSentAt: number;
}

export interface AnalyticsCounters {
  rewardedViewed: number;
  interstitialShown: number;
  iapPurchases: number;
}

export interface PlayerState {
  coins: number;
  gems: number;
  energy: number;
  energyMax: number;
  nextEnergyAt: number;
  currentCafeLevel: number;
  ownedItems: OwnedItemRecord;
  placeableItems: OwnedItemRecord;
  placedObjects: PlacedObject[];
  unlockedZones: CafeZoneId[];
  happiness: number;
  lastOfflineTime: number;
  streak: number;
  lastLoginDay: string;
  eventRewards: EventRewardsRecord;
  notificationsEnabled: boolean;
  adsWatchedToday: number;
  adWatchDay: string;
  purchases: ShopPurchaseRecord[];
  battlePass: BattlePassState;
  analytics: AnalyticsCounters;
  ftueCompleted: boolean;
  ftueStep: number;
  quests: QuestProgress[];
  questsLastResetDay: string;
  welcomeWeekClaimed: number[];
  hapticsEnabled: boolean;
  audioSettings: AudioSettings;
  saveSchemaVersion: number;
  liveOpsState: LiveOpsState;
  notificationState: NotificationState;
  streakShieldCount: number;
  friends: FriendProfile[];
  clan: ClanState | null;
  social: SocialState;
  contextualOffers: ContextualOfferState;
  analyticsEvents: Array<{ event: string; payload: Record<string, unknown>; ts: number }>;
  featureFlags: Record<string, boolean>;
  setLastOfflineTime: (timestamp: number) => void;
  addCoins: (amount: number) => void;
  addGems: (amount: number) => void;
  addEnergy: (amount: number) => void;
  consumeEnergy: (amount?: number) => boolean;
  syncEnergyTimer: (nextAt: number) => void;
  addOwnedItem: (itemId: string, amount?: number) => void;
  addPlaceableItem: (itemId: string, amount?: number) => void;
  consumePlaceableItem: (itemId: string, amount?: number) => boolean;
  placeObject: (object: PlacedObject) => void;
  rotatePlacedObject: (uid: string) => void;
  setStreak: (streak: number, day: string) => void;
  addEventReward: (eventId: string, amount: number) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  unlockZone: (zoneId: CafeZoneId) => void;
  addHappiness: (amount: number) => void;
  registerAdWatch: () => void;
  registerPurchase: (id: string, priceLabel: string) => void;
  addBattlePassXp: (amount: number) => void;
  claimBattlePassReward: (level: number, premium: boolean) => void;
  unlockBattlePassPremium: () => void;
  bumpAnalytics: (key: keyof AnalyticsCounters, amount?: number) => void;
}

const now = Date.now();
const ENERGY_REFILL_MS = 4 * 60 * 1000;

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      coins: 100,
      gems: 10,
      energy: 5,
      energyMax: 5,
      nextEnergyAt: now + ENERGY_REFILL_MS,
      currentCafeLevel: 1,
      ownedItems: {},
      placeableItems: {},
      placedObjects: [],
      unlockedZones: ['counter'],
      happiness: 0,
      lastOfflineTime: now,
      streak: 0,
      lastLoginDay: '',
      eventRewards: {},
      notificationsEnabled: true,
      adsWatchedToday: 0,
      adWatchDay: new Date().toISOString().slice(0, 10),
      purchases: [],
      battlePass: {
        seasonId: 'season-1',
        seasonEndsAt: now + 7 * 24 * 60 * 60 * 1000,
        xp: 0,
        level: 1,
        premiumUnlocked: false,
        claimedFree: [],
        claimedPremium: []
      },
      analytics: {
        rewardedViewed: 0,
        interstitialShown: 0,
        iapPurchases: 0
      },
      ftueCompleted: false,
      ftueStep: 0,
      quests: [],
      questsLastResetDay: new Date().toISOString().slice(0, 10),
      welcomeWeekClaimed: [],
      hapticsEnabled: true,
      audioSettings: { master: 1, sfx: 1, music: 0.8, voice: 0.8, particlesEnabled: true, musicEnabled: true, zenMode: false },
      saveSchemaVersion: 12,
      liveOpsState: { joinedEventIds: [], lastEventRotationIndex: 0, lastEventCheckAt: Date.now() },
      notificationState: { dayKey: new Date().toISOString().slice(0, 10), sentToday: 0, lastSentAt: 0 },
      streakShieldCount: 1,
      friends: [],
      clan: null,
      social: { socialEnabled: true, helpDayKey: new Date().toISOString().slice(0,10), helpsSentToday: 0, helpRequestsToday: 0, lastHelpSentAt: 0 },
      contextualOffers: { enabled: true, seenThisSession: false, totalSeen: 0 },
      analyticsEvents: [],
      featureFlags: { socialEnabled: true, contextualOffersEnabled: true, lowEndModeAuto: true },
      setLastOfflineTime: (timestamp) => set({ lastOfflineTime: timestamp }),
      addCoins: (amount) => set((state) => ({ coins: Math.max(0, state.coins + amount) })),
      addGems: (amount) => set((state) => ({ gems: Math.max(0, state.gems + amount) })),
      addEnergy: (amount) =>
        set((state) => {
          const next = Math.min(state.energyMax, state.energy + amount);
          return {
            energy: next,
            nextEnergyAt: next >= state.energyMax ? state.nextEnergyAt : Date.now() + ENERGY_REFILL_MS
          };
        }),
      consumeEnergy: (amount = 1) => {
        const state = get();
        if (state.energy < amount) return false;
        set({
          energy: state.energy - amount,
          nextEnergyAt: state.energy === state.energyMax ? Date.now() + ENERGY_REFILL_MS : state.nextEnergyAt
        });
        return true;
      },
      syncEnergyTimer: (nextAt) => set({ nextEnergyAt: nextAt }),
      addOwnedItem: (itemId, amount = 1) =>
        set((state) => ({ ownedItems: { ...state.ownedItems, [itemId]: (state.ownedItems[itemId] ?? 0) + amount } })),
      addPlaceableItem: (itemId, amount = 1) =>
        set((state) => ({ placeableItems: { ...state.placeableItems, [itemId]: (state.placeableItems[itemId] ?? 0) + amount } })),
      consumePlaceableItem: (itemId, amount = 1) => {
        const state = get();
        const count = state.placeableItems[itemId] ?? 0;
        if (count < amount) return false;
        set({ placeableItems: { ...state.placeableItems, [itemId]: count - amount } });
        return true;
      },
      placeObject: (object) => set((state) => ({ placedObjects: [...state.placedObjects, object] })),
      rotatePlacedObject: (uid) =>
        set((state) => ({ placedObjects: state.placedObjects.map((p) => (p.uid === uid ? { ...p, rotation: (p.rotation + 90) % 360 } : p)) })),
      setStreak: (streak, day) => set({ streak, lastLoginDay: day }),
      addEventReward: (eventId, amount) =>
        set((state) => ({ eventRewards: { ...state.eventRewards, [eventId]: (state.eventRewards[eventId] ?? 0) + amount } })),
      setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),
      unlockZone: (zoneId) => set((state) => ({ unlockedZones: state.unlockedZones.includes(zoneId) ? state.unlockedZones : [...state.unlockedZones, zoneId] })),
      addHappiness: (amount) => set((state) => ({ happiness: Math.max(0, Math.min(100, state.happiness + amount)) })),
      registerAdWatch: () => {
        const today = new Date().toISOString().slice(0, 10);
        set((state) => ({
          adWatchDay: today,
          adsWatchedToday: state.adWatchDay === today ? state.adsWatchedToday + 1 : 1
        }));
      },
      registerPurchase: (id, priceLabel) =>
        set((state) => ({ purchases: [...state.purchases, { id, timestamp: Date.now(), priceLabel }], analytics: { ...state.analytics, iapPurchases: state.analytics.iapPurchases + 1 } })),
      addBattlePassXp: (amount) =>
        set((state) => {
          const xp = Math.max(0, state.battlePass.xp + amount);
          const level = Math.min(30, Math.floor(xp / 100) + 1);
          return { battlePass: { ...state.battlePass, xp, level } };
        }),
      claimBattlePassReward: (level, premium) =>
        set((state) => ({
          battlePass: premium
            ? { ...state.battlePass, claimedPremium: state.battlePass.claimedPremium.includes(level) ? state.battlePass.claimedPremium : [...state.battlePass.claimedPremium, level] }
            : { ...state.battlePass, claimedFree: state.battlePass.claimedFree.includes(level) ? state.battlePass.claimedFree : [...state.battlePass.claimedFree, level] }
        })),
      unlockBattlePassPremium: () => set((state) => ({ battlePass: { ...state.battlePass, premiumUnlocked: true } })),
      bumpAnalytics: (key, amount = 1) => set((state) => ({ analytics: { ...state.analytics, [key]: state.analytics[key] + amount } }))
    }),
    { name: 'cafe-merge-empire-player-store', storage: createJSONStorage(() => localStorage) }
  )
);

export { ENERGY_REFILL_MS };
