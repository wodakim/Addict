import { SaveManager } from '@/game/managers/SaveManager';
import { usePlayerStore } from '@/stores/playerStore';

export interface DailyReward {
  day: number;
  coins: number;
  gems: number;
  label: string;
}

const DAILY_REWARDS: DailyReward[] = [
  { day: 1, coins: 100, gems: 0, label: 'Welcome Brew' },
  { day: 2, coins: 150, gems: 0, label: 'Warm Morning' },
  { day: 3, coins: 200, gems: 10, label: 'Gem Shot' },
  { day: 4, coins: 300, gems: 0, label: 'Rush Bonus' },
  { day: 5, coins: 450, gems: 0, label: 'Cafe Buzz' },
  { day: 6, coins: 600, gems: 15, label: 'Golden Beans' },
  { day: 7, coins: 1200, gems: 30, label: 'Mega Weekend Pack' }
];

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export class StreakManager {
  static rewards = DAILY_REWARDS;

  static evaluateLogin(now = new Date()): { changed: boolean; streak: number; broken: boolean; reward: DailyReward } {
    const state = usePlayerStore.getState();
    const today = dayKey(now);
    const yesterday = dayKey(new Date(now.getTime() - 24 * 60 * 60 * 1000));

    if (state.lastLoginDay === today) {
      return { changed: false, streak: state.streak, broken: false, reward: this.getRewardForStreak(state.streak) };
    }

    let streak = 1;
    let broken = false;

    if (state.lastLoginDay === yesterday) {
      streak = state.streak + 1;
    } else if (state.lastLoginDay !== '') {
      if (state.streakShieldCount > 0) {
        streak = state.streak;
        usePlayerStore.setState({ streakShieldCount: state.streakShieldCount - 1 });
      } else {
        broken = true;
        streak = 1;
      }
    }

    usePlayerStore.getState().setStreak(streak, today);
    const reward = this.getRewardForStreak(streak);
    usePlayerStore.getState().addCoins(reward.coins);
    if (reward.gems > 0) usePlayerStore.getState().addGems(reward.gems);

    if (streak >= 7) {
      usePlayerStore.getState().addHappiness(5);
      usePlayerStore.getState().addCoins(200);
    }

    if (streak >= 14) {
      usePlayerStore.getState().addPlaceableItem('coffee-bean-lv2', 1);
      usePlayerStore.getState().addGems(20);
    }

    usePlayerStore.getState().addBattlePassXp(25 + Math.min(30, streak));
    void SaveManager.save();
    return { changed: true, streak, broken, reward };
  }

  static getRewardForStreak(streak: number): DailyReward {
    const index = (Math.max(1, streak) - 1) % DAILY_REWARDS.length;
    return DAILY_REWARDS[index];
  }

  static getProductionBonus(): number {
    const streak = usePlayerStore.getState().streak;
    if (streak >= 14) return 0.3;
    if (streak >= 7) return 0.2;
    return Math.min(0.1, streak * 0.01);
  }
}
