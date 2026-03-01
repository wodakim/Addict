import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { AnalyticsManager } from '@/game/managers/AnalyticsManager';
import { AudioManager } from '@/game/managers/AudioManager';
import { SaveManager } from '@/game/managers/SaveManager';
import { usePlayerStore, type RewardReason } from '@/stores/playerStore';

const DAILY_REWARDED_LIMIT = 8;

export class AdManager {
  static async showRewarded(reason: RewardReason): Promise<{ ok: boolean; rewarded: boolean; noAd?: boolean }> {
    const s = usePlayerStore.getState();
    if (s.adsWatchedToday >= DAILY_REWARDED_LIMIT) {
      return { ok: false, rewarded: false, noAd: true };
    }

    await new Promise((resolve) => setTimeout(resolve, 420));

    const noAdAvailable = Math.random() < 0.05;
    if (noAdAvailable) return { ok: false, rewarded: false, noAd: true };

    s.registerAdWatch();
    AnalyticsManager.track('ad_watched', { reason });
    s.bumpAnalytics('rewardedViewed', 1);

    switch (reason) {
      case 'energy': s.addEnergy(3); break;
      case 'offline_double': s.addCoins(250); break;
      case 'instant_merge': s.addCoins(120); break;
      case 'battlepass_xp': s.addBattlePassXp(80); break;
    }

    AudioManager.getInstance().play('jackpot');
    await Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => undefined);
    await SaveManager.save();
    return { ok: true, rewarded: true };
  }

  static async showInterstitial(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 180));
    usePlayerStore.getState().bumpAnalytics('interstitialShown', 1);
    await SaveManager.save();
  }
}
