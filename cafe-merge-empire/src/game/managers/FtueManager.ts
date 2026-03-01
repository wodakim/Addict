import { SaveManager } from '@/game/managers/SaveManager';
import { usePlayerStore } from '@/stores/playerStore';

export class FtueManager {
  static shouldRunFtue(): boolean {
    return !usePlayerStore.getState().ftueCompleted;
  }

  static completeStep(step: number): void {
    const s = usePlayerStore.getState();
    if (step <= s.ftueStep) return;
    usePlayerStore.setState({ ftueStep: step });
  }

  static completeFtue(): void {
    usePlayerStore.setState({ ftueCompleted: true, ftueStep: 999 });
    void SaveManager.save();
  }
}
