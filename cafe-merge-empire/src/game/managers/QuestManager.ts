import { questDefinitions } from '@/game/data/quests';
import { SaveManager } from '@/game/managers/SaveManager';
import { usePlayerStore } from '@/stores/playerStore';

export type QuestType = 'daily' | 'milestone' | 'special';

export interface QuestState {
  id: string;
  type: QuestType;
  title: string;
  target: number;
  metric: string;
  progress: number;
  completed: boolean;
  claimed: boolean;
  rewards: Record<string, number>;
}

export class QuestManager {
  private static instance: QuestManager;

  static getInstance(): QuestManager {
    if (!this.instance) this.instance = new QuestManager();
    return this.instance;
  }

  private ensureSeeded(): void {
    const s = usePlayerStore.getState();
    if (s.quests.length > 0) return;
    usePlayerStore.setState({
      quests: questDefinitions.map((q) => ({
        id: q.id,
        type: q.type as QuestType,
        title: q.title,
        target: q.target,
        metric: q.metric,
        progress: 0,
        completed: false,
        claimed: false,
        rewards: q.rewards
      })),
      questsLastResetDay: new Date().toISOString().slice(0, 10)
    });
  }

  resetDailiesIfNeeded(): void {
    this.ensureSeeded();
    const today = new Date().toISOString().slice(0, 10);
    const s = usePlayerStore.getState();
    if (s.questsLastResetDay === today) return;

    usePlayerStore.setState({
      questsLastResetDay: today,
      quests: s.quests.map((q) => (q.type === 'daily' ? { ...q, progress: 0, completed: false, claimed: false } : q))
    });
  }

  addProgress(metric: string, amount = 1): QuestState[] {
    this.ensureSeeded();
    const s = usePlayerStore.getState();
    const updated = s.quests.map((q) => {
      if (q.metric !== metric || q.claimed) return q;
      const progress = Math.min(q.target, q.progress + amount);
      const completed = progress >= q.target;
      return { ...q, progress, completed };
    });
    usePlayerStore.setState({ quests: updated });
    void SaveManager.save();
    return updated.filter((q) => q.completed && !q.claimed);
  }

  claimQuest(id: string): boolean {
    const s = usePlayerStore.getState();
    const quest = s.quests.find((q) => q.id === id);
    if (!quest || !quest.completed || quest.claimed) return false;

    if (quest.rewards.coins) s.addCoins(quest.rewards.coins);
    if (quest.rewards.gems) s.addGems(quest.rewards.gems);
    if (quest.rewards.energy) s.addEnergy(quest.rewards.energy);
    if (quest.rewards.battlePassXp) s.addBattlePassXp(quest.rewards.battlePassXp);

    usePlayerStore.setState({ quests: s.quests.map((q) => (q.id === id ? { ...q, claimed: true } : q)) });
    void SaveManager.save();
    return true;
  }

  getPendingCount(): number {
    this.ensureSeeded();
    return usePlayerStore.getState().quests.filter((q) => q.completed && !q.claimed).length;
  }
}
