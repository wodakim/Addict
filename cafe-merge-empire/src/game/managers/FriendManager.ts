import { SaveManager } from '@/game/managers/SaveManager';
import { usePlayerStore } from '@/stores/playerStore';

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

const DEV_FRIENDS: FriendProfile[] = [
  { id: 'f1', code: 'SOPHIE', name: 'Sophie', cafeLevel: 9, streak: 12, lastLoginAt: Date.now() - 3600_000, lastHelpReceivedAt: Date.now() - 10_000, helpHistory: [] },
  { id: 'f2', code: 'LUCIEN', name: 'Lucien', cafeLevel: 7, streak: 5, lastLoginAt: Date.now() - 7200_000, lastHelpReceivedAt: Date.now() - 50_000, helpHistory: [] },
  { id: 'f3', code: 'MIAOUX', name: 'Mia', cafeLevel: 11, streak: 17, lastLoginAt: Date.now() - 300_000, lastHelpReceivedAt: Date.now() - 90_000, helpHistory: [] }
];

export class FriendManager {
  private static instance: FriendManager;
  static getInstance(): FriendManager { if (!this.instance) this.instance = new FriendManager(); return this.instance; }

  seedDevFriends(): void {
    const s = usePlayerStore.getState();
    if (s.friends.length > 0) return;
    usePlayerStore.setState({ friends: DEV_FRIENDS });
  }

  addFriendByCode(code: string): boolean {
    const s = usePlayerStore.getState();
    if (s.friends.length >= 5) return false;
    const normalized = code.toUpperCase().slice(0, 6);
    if (s.friends.some((f) => f.code === normalized)) return false;
    usePlayerStore.setState({
      friends: [...s.friends, { id: `f-${Date.now()}`, code: normalized, name: `Ami ${normalized}`, cafeLevel: 1, streak: 1, lastLoginAt: Date.now(), lastHelpReceivedAt: 0, helpHistory: [] }]
    });
    void SaveManager.save();
    return true;
  }

  sendHotCoffee(friendId: string): boolean {
    const s = usePlayerStore.getState();
    const now = Date.now();
    const dayKey = new Date().toISOString().slice(0, 10);
    if (s.social.helpDayKey !== dayKey) {
      usePlayerStore.setState({ social: { ...s.social, helpDayKey: dayKey, helpsSentToday: 0, helpRequestsToday: 0 } });
    }
    const state = usePlayerStore.getState();
    if (state.social.helpsSentToday >= 1) return false;
    if (state.social.lastHelpSentAt && now - state.social.lastHelpSentAt < 22 * 60 * 60 * 1000) return false;

    const updatedFriends = state.friends.map((f) =>
      f.id === friendId
        ? { ...f, lastHelpReceivedAt: now, helpHistory: [`${new Date(now).toLocaleTimeString()}: Café chaud reçu`, ...f.helpHistory].slice(0, 6) }
        : f
    );

    usePlayerStore.setState({
      friends: updatedFriends,
      social: { ...state.social, helpsSentToday: state.social.helpsSentToday + 1, lastHelpSentAt: now },
      coins: state.coins + 25
    });
    usePlayerStore.getState().addBattlePassXp(5);
    void SaveManager.save();
    return true;
  }

  requestHelp(): boolean {
    const s = usePlayerStore.getState();
    const dayKey = new Date().toISOString().slice(0, 10);
    if (s.social.helpDayKey !== dayKey) {
      usePlayerStore.setState({ social: { ...s.social, helpDayKey: dayKey, helpsSentToday: 0, helpRequestsToday: 0 } });
    }
    const state = usePlayerStore.getState();
    if (state.social.helpRequestsToday >= 3) return false;
    usePlayerStore.setState({ social: { ...state.social, helpRequestsToday: state.social.helpRequestsToday + 1 } });
    void SaveManager.save();
    return true;
  }
}
