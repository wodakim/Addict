import Phaser from 'phaser';
import { LocalNotifications } from '@capacitor/local-notifications';
import { App } from '@capacitor/app';
import { EnergyManager } from '@/game/managers/EnergyManager';
import { NotificationManager } from '@/game/managers/NotificationManager';
import { AnalyticsManager } from '@/game/managers/AnalyticsManager';
import { SaveManager } from '@/game/managers/SaveManager';
import { BattlePassScene } from '@/game/scenes/BattlePassScene';
import { BootScene } from '@/game/scenes/BootScene';
import { GameScene } from '@/game/scenes/GameScene';
import { MainMenuScene } from '@/game/scenes/MainMenuScene';
import { PreloadScene } from '@/game/scenes/PreloadScene';
import { ShopScene } from '@/game/scenes/ShopScene';
import { SettingsScene } from '@/game/scenes/SettingsScene';
import { SocialScene } from '@/game/scenes/SocialScene';
import { usePlayerStore } from '@/stores/playerStore';

async function scheduleEnergyReadyNotification(): Promise<void> {
  const state = usePlayerStore.getState();
  if (!state.notificationsEnabled) return;
  await LocalNotifications.requestPermissions().catch(() => ({ display: 'denied' }));
  const countdown = EnergyManager.getCountdownMs();
  const triggerAt = new Date(Date.now() + Math.max(countdown, 10 * 1000));

  await LocalNotifications.cancel({ notifications: [{ id: 5001 }] }).catch(() => undefined);
  await LocalNotifications.schedule({
    notifications: [{ id: 5001, title: 'Ton café t’attend ☕', body: '5 énergies prêtes, reviens fusionner !', schedule: { at: triggerAt } }]
  }).catch(() => undefined);
}

async function bootstrap(): Promise<void> {
  await SaveManager.getInstance().loadGame();
  AnalyticsManager.track('session_start');
  await NotificationManager.requestOptIn();
  usePlayerStore.setState({ contextualOffers: { ...usePlayerStore.getState().contextualOffers, seenThisSession: false } });

  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: 'app',
    width: 1080,
    height: 1920,
    backgroundColor: '#f7ebff',
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: [BootScene, PreloadScene, MainMenuScene, GameScene, ShopScene, BattlePassScene, SettingsScene, SocialScene]
  };

  const game = new Phaser.Game(config);

  const saveAndStamp = async (): Promise<void> => {
    await SaveManager.forceSaveWithStamp();
    await scheduleEnergyReadyNotification();
    await NotificationManager.scheduleSmartNotifications();
  };

  window.addEventListener('beforeunload', () => void saveAndStamp());
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') void saveAndStamp();
  });
  game.events.on(Phaser.Core.Events.BLUR, () => void saveAndStamp());
  game.events.on(Phaser.Core.Events.HIDDEN, () => void saveAndStamp());
  App.addListener('appStateChange', ({ isActive }) => {
    if (!isActive) void saveAndStamp();
  });
}

void bootstrap();
