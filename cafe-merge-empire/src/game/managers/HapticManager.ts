import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { usePlayerStore } from '@/stores/playerStore';

function fallback(ms: number): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(ms);
}

export class HapticManager {
  private static enabled(): boolean {
    return usePlayerStore.getState().hapticsEnabled;
  }

  static async mergeLight(): Promise<void> {
    if (!this.enabled()) return;
    await Haptics.impact({ style: ImpactStyle.Light }).catch(() => fallback(18));
  }

  static async mergeMedium(): Promise<void> {
    if (!this.enabled()) return;
    await Haptics.impact({ style: ImpactStyle.Medium }).catch(() => fallback(28));
  }

  static async mergeEpic(): Promise<void> {
    if (!this.enabled()) return;
    await Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => fallback(40));
  }

  static async placeFurniture(): Promise<void> {
    if (!this.enabled()) return;
    await Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => fallback(50));
  }

  static async rewardBig(): Promise<void> {
    if (!this.enabled()) return;
    fallback([20, 30, 20, 30, 20, 90] as unknown as number);
  }

  static async energyRefill(): Promise<void> {
    if (!this.enabled()) return;
    fallback([12, 20, 25, 30] as unknown as number);
  }

  static async questComplete(): Promise<void> {
    if (!this.enabled()) return;
    fallback([15, 20, 35] as unknown as number);
  }
}
