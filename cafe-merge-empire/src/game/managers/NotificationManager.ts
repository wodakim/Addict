import { LocalNotifications } from '@capacitor/local-notifications';
import { LiveOpsManager } from '@/game/managers/LiveOpsManager';
import { SaveManager } from '@/game/managers/SaveManager';
import { usePlayerStore } from '@/stores/playerStore';

const MAX_PER_DAY = 3;

export class NotificationManager {
  static async requestOptIn(): Promise<void> {
    await LocalNotifications.requestPermissions().catch(() => undefined);
  }

  static async scheduleSmartNotifications(): Promise<void> {
    const s = usePlayerStore.getState();
    const dayKey = new Date().toISOString().slice(0, 10);
    const state = s.notificationState.dayKey === dayKey ? s.notificationState : { dayKey, sentToday: 0, lastSentAt: 0 };
    if (state.sentToday >= MAX_PER_DAY) return;

    const notifs: Parameters<typeof LocalNotifications.schedule>[0]['notifications'] = [];
    let id = 9000;

    // Energy full
    notifs.push({
      id: id++,
      title: '☕ Ton café a 5 énergies prêtes !',
      body: `Niveau ${s.currentCafeLevel} t'attend`,
      schedule: { at: new Date(Date.now() + 2 * 60 * 60 * 1000) },
      extra: { deeplink: 'game://energy' }
    });

    // Offline gains
    notifs.push({
      id: id++,
      title: `Tu as gagné ${Math.max(1200, s.coins % 4000)} coins pendant ton absence !`,
      body: 'Reviens claim tes gains',
      schedule: { at: new Date(Date.now() + 4 * 60 * 60 * 1000) },
      extra: { deeplink: 'game://offline' }
    });


    if (s.streak > 0) {
      notifs.push({
        id: id++,
        title: '🔥 Ton feu streak brûle encore ! Reviens aujourd’hui',
        body: `Streak x${s.streak} en danger`,
        schedule: { at: new Date(Date.now() + 20 * 60 * 60 * 1000) },
        extra: { deeplink: 'game://streak' }
      });
    }

    const nextEvent = LiveOpsManager.getInstance().getUpcomingEvents(Date.now(), 1)[0];
    if (nextEvent) {
      notifs.push({
        id: id++,
        title: `🎉 ${nextEvent.name} commence maintenant !`,
        body: 'Rejoins l’événement limité',
        schedule: { at: new Date(nextEvent.startAt) },
        extra: { deeplink: `game://event/${nextEvent.id}` }
      });
    }

    await LocalNotifications.cancel({ notifications: notifs.map((n) => ({ id: n.id })) }).catch(() => undefined);
    await LocalNotifications.schedule({ notifications: notifs.slice(0, Math.max(0, MAX_PER_DAY - state.sentToday)) }).catch(() => undefined);

    usePlayerStore.setState({ notificationState: { dayKey, sentToday: Math.min(MAX_PER_DAY, state.sentToday + notifs.length), lastSentAt: Date.now() } });
    await SaveManager.save();
  }
}
