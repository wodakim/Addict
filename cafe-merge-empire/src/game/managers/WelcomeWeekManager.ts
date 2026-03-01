import { SaveManager } from '@/game/managers/SaveManager';
import { usePlayerStore } from '@/stores/playerStore';

export interface WelcomeReward {
  day: number;
  label: string;
  rewards: Record<string, number>;
}

export const WELCOME_WEEK: WelcomeReward[] = [
  { day: 1, label: '500 coins + 10 gems', rewards: { coins: 500, gems: 10 } },
  { day: 2, label: 'Meuble rare gratuit', rewards: { gems: 15 } },
  { day: 3, label: 'Énergie infinie 2h', rewards: { energy: 5 } },
  { day: 4, label: 'Skin café spécial', rewards: { gems: 20 } },
  { day: 5, label: 'Pack battle pass XP', rewards: { battlePassXp: 150 } },
  { day: 6, label: 'Double production 24h', rewards: { coins: 800 } },
  { day: 7, label: 'Objet légendaire + feu permanent', rewards: { gems: 100, coins: 1500 } }
];

export class WelcomeWeekManager {
  static claimDay(day: number): boolean {
    const s = usePlayerStore.getState();
    if (s.welcomeWeekClaimed.includes(day)) return false;
    const reward = WELCOME_WEEK.find((r) => r.day === day);
    if (!reward) return false;

    if (reward.rewards.coins) s.addCoins(reward.rewards.coins);
    if (reward.rewards.gems) s.addGems(reward.rewards.gems);
    if (reward.rewards.energy) s.addEnergy(reward.rewards.energy);
    if (reward.rewards.battlePassXp) s.addBattlePassXp(reward.rewards.battlePassXp);

    usePlayerStore.setState({ welcomeWeekClaimed: [...s.welcomeWeekClaimed, day] });
    void SaveManager.save();
    return true;
  }
}
