import { SaveManager } from '@/game/managers/SaveManager';
import { usePlayerStore } from '@/stores/playerStore';

export type AnalyticsEvent =
  | 'session_start'
  | 'merge_count'
  | 'placement_count'
  | 'ad_watched'
  | 'iap_purchased'
  | 'streak_day'
  | 'retention_day1'
  | 'retention_day7'
  | 'event_join';

export class AnalyticsManager {
  static track(event: AnalyticsEvent, payload: Record<string, unknown> = {}): void {
    const s = usePlayerStore.getState();
    const item = { event, payload, ts: Date.now() };
    usePlayerStore.setState({ analyticsEvents: [...s.analyticsEvents.slice(-199), item] });
    if (event === 'ad_watched') s.bumpAnalytics('rewardedViewed', 1);
    if (event === 'iap_purchased') s.bumpAnalytics('iapPurchases', 1);
    void SaveManager.save();
  }
}
