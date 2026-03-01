import { SaveManager } from '@/game/managers/SaveManager';
import { usePlayerStore } from '@/stores/playerStore';

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

export class ClanManager {
  static createClan(name: string): void {
    const code = Math.random().toString(36).slice(2, 8).toUpperCase();
    const clan: ClanState = {
      id: `clan-${Date.now()}`,
      name,
      code,
      members: ['You', ...usePlayerStore.getState().friends.slice(0, 2).map((f) => f.name)],
      weeklyResetAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
      goals: [
        { id: 'g1', title: 'Total merges du clan : 800', target: 800, progress: 0, completed: false },
        { id: 'g2', title: 'Placer 30 meubles ensemble', target: 30, progress: 0, completed: false },
        { id: 'g3', title: 'Compléter 10 quêtes', target: 10, progress: 0, completed: false }
      ],
      rewardsClaimedWeek: false
    };
    usePlayerStore.setState({ clan });
    void SaveManager.save();
  }

  static addProgress(goalId: string, amount = 1): void {
    const clan = usePlayerStore.getState().clan;
    if (!clan) return;
    clan.goals = clan.goals.map((g) => (g.id === goalId ? { ...g, progress: Math.min(g.target, g.progress + amount), completed: g.progress + amount >= g.target } : g));
    usePlayerStore.setState({ clan: { ...clan } });
    void SaveManager.save();
  }

  static claimWeeklyRewards(): boolean {
    const s = usePlayerStore.getState();
    if (!s.clan || s.clan.rewardsClaimedWeek) return false;
    if (!s.clan.goals.every((g) => g.completed)) return false;
    usePlayerStore.setState({
      clan: { ...s.clan, rewardsClaimedWeek: true },
      gems: s.gems + 60,
      coins: s.coins + 1800
    });
    usePlayerStore.getState().addPlaceableItem('coffee-bean-lv2', 1);
    void SaveManager.save();
    return true;
  }
}
