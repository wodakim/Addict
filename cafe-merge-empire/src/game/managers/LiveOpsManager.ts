import { eventDefinitions } from '@/game/data/events';
import { SaveManager } from '@/game/managers/SaveManager';
import { usePlayerStore } from '@/stores/playerStore';

export type LiveOpsEventType = 'daily_recurring' | 'limited_3_4_days';

export interface LiveOpsEvent {
  id: string;
  name: string;
  description: string;
  type: LiveOpsEventType;
  startAt: number;
  endAt: number;
  multiplier: number;
  rewards: { coins?: number; gems?: number; battlePassXp?: number; rareItem?: string; skin?: string };
}

const DAY = 24 * 60 * 60 * 1000;

export class LiveOpsManager {
  private static instance: LiveOpsManager;

  static getInstance(): LiveOpsManager {
    if (!this.instance) this.instance = new LiveOpsManager();
    return this.instance;
  }

  private templates(now = Date.now()): LiveOpsEvent[] {
    const d = new Date(now);
    const start = new Date(d); start.setHours(9,0,0,0);
    const morningStart = start.getTime() <= now ? start.getTime() : start.getTime() - DAY;
    const list: LiveOpsEvent[] = [
      {
        id: 'rush-matin',
        name: 'Rush du Matin',
        description: 'Production x2 de 9h à 11h',
        type: 'daily_recurring',
        startAt: morningStart,
        endAt: morningStart + 2 * 60 * 60 * 1000,
        multiplier: 2,
        rewards: { coins: 350, battlePassXp: 40 }
      },
      {
        id: 'festival-chocolat-chaud',
        name: 'Festival du Chocolat Chaud',
        description: 'Event limité 4 jours avec rewards exclusives',
        type: 'limited_3_4_days',
        startAt: now - (now % DAY),
        endAt: now - (now % DAY) + 4 * DAY,
        multiplier: 1.5,
        rewards: { coins: 1200, gems: 40, battlePassXp: 140, rareItem: 'hot-choco-machine' }
      },
      {
        id: 'weekend-latte-art',
        name: 'Week-end Latte Art',
        description: 'Skill challenge + skin café',
        type: 'limited_3_4_days',
        startAt: now - (now % DAY) + DAY,
        endAt: now - (now % DAY) + 4 * DAY,
        multiplier: 1.35,
        rewards: { coins: 900, gems: 25, skin: 'latte-gold' }
      }
    ];
    void eventDefinitions;
    return list;
  }


  getMorningRush(now = Date.now()): LiveOpsEvent {
    return this.templates(now).find((e) => e.id === 'rush-matin') ?? this.templates(now)[0];
  }

  getActiveEvents(now = Date.now()): LiveOpsEvent[] {
    return this.templates(now).filter((e) => now >= e.startAt && now <= e.endAt);
  }

  getUpcomingEvents(now = Date.now(), days = 3): LiveOpsEvent[] {
    const max = now + days * DAY;
    return this.templates(now).filter((e) => e.startAt > now && e.startAt <= max);
  }

  getEventCountdown(eventId: string, now = Date.now()): number {
    const e = this.templates(now).find((x) => x.id === eventId);
    if (!e) return 0;
    if (now < e.startAt) return e.startAt - now;
    if (now <= e.endAt) return e.endAt - now;
    return 0;
  }

  isMorningRushActive(now = Date.now()): boolean {
    return this.getActiveEvents(now).some((e) => e.id === 'rush-matin');
  }

  getMorningRushCountdown(now = Date.now()): number {
    const rush = this.templates(now).find((e) => e.id === 'rush-matin');
    if (!rush) return 0;
    return this.getEventCountdown(rush.id, now);
  }

  joinEvent(eventId: string): void {
    const state = usePlayerStore.getState();
    const joined = state.liveOpsState.joinedEventIds.includes(eventId)
      ? state.liveOpsState.joinedEventIds
      : [...state.liveOpsState.joinedEventIds, eventId];
    usePlayerStore.setState({ liveOpsState: { ...state.liveOpsState, joinedEventIds: joined, lastEventCheckAt: Date.now() } });
    void SaveManager.save();
  }

  grantEventReward(eventId: string): void {
    const event = this.templates().find((e) => e.id === eventId);
    if (!event) return;
    const s = usePlayerStore.getState();
    if (event.rewards.coins) s.addCoins(event.rewards.coins);
    if (event.rewards.gems) s.addGems(event.rewards.gems);
    if (event.rewards.battlePassXp) s.addBattlePassXp(event.rewards.battlePassXp);
    s.addEventReward(eventId, 1);
    void SaveManager.save();
  }
}
