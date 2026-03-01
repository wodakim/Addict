import Phaser from 'phaser';
import { Howl } from 'howler';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { EnergyManager } from '@/game/managers/EnergyManager';
import { LiveOpsManager } from '@/game/managers/LiveOpsManager';
import { SaveManager } from '@/game/managers/SaveManager';
import { AudioManager } from '@/game/managers/AudioManager';
import { QuestManager } from '@/game/managers/QuestManager';
import { StreakManager } from '@/game/managers/StreakManager';
import { usePlayerStore } from '@/stores/playerStore';

export class MainMenuScene extends Phaser.Scene {
  private backgroundMusic?: Howl;
  private countdownText?: Phaser.GameObjects.Text;
  private eventTimerText?: Phaser.GameObjects.Text;

  constructor() {
    super('MainMenuScene');
  }

  create(): void {
    const { width, height } = this.cameras.main;
    EnergyManager.syncOffline();

    const gradient = this.add.rectangle(width / 2, height / 2, width, height, 0xf7d9ff).setOrigin(0.5);
    this.tweens.add({ targets: gradient, alpha: { from: 0.86, to: 1 }, yoyo: true, repeat: -1, duration: 2300 });

    this.add.particles(width / 2, height - 230, 'logo', {
      scale: { start: 0.04, end: 0 },
      alpha: { start: 0.35, end: 0 },
      speedY: { min: -95, max: -45 },
      speedX: { min: -24, max: 24 },
      lifespan: 1500,
      frequency: 160,
      blendMode: 'ADD'
    });

    const logo = this.add
      .text(width / 2, 210, 'CafeMergeEmpire', {
        fontFamily: 'Arial Black',
        fontSize: '66px',
        color: '#ffffff',
        stroke: '#b5179e',
        strokeThickness: 10,
        shadow: { color: '#ffd6ff', blur: 20, stroke: true, fill: true }
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: logo,
      y: logo.y - 12,
      scale: { from: 0.98, to: 1.06 },
      yoyo: true,
      duration: 850,
      ease: 'Elastic.easeOut',
      repeat: -1
    });

    this.createTopCounters(width);

    const playButton = this.add.rectangle(width / 2, 520, 480, 150, 0xff8fab).setStrokeStyle(8, 0xffffff).setInteractive({ useHandCursor: true });
    const playText = this.add.text(width / 2, 520, 'JOUER', { fontFamily: 'Arial Black', fontSize: '68px', color: '#ffffff' }).setOrigin(0.5);
    playButton.on('pointerdown', () => {
      this.tweens.add({ targets: [playButton, playText], scale: { from: 1, to: 0.92 }, yoyo: true, duration: 140, ease: 'Elastic.easeOut' });
      this.add.particles(width / 2, 520, 'logo', {
        scale: { start: 0.03, end: 0 },
        speed: { min: 30, max: 180 },
        lifespan: 650,
        tint: [0xffd166, 0xffffff],
        quantity: 20
      }).explode(30);
      this.sound.play('whoosh');
      void Haptics.impact({ style: ImpactStyle.Medium }).catch(() => undefined);
      void SaveManager.forceSaveWithStamp();
      this.scene.start('GameScene');
    });

    const streak = usePlayerStore.getState().streak;
    const fire = '🔥'.repeat(Math.min(5, Math.max(1, streak)));
    const dailyButton = this.add.text(120, 640, `Daily Rewards ${fire} x${streak || 1}`, {
      fontFamily: 'Arial Black', fontSize: '32px', color: '#5a189a', backgroundColor: '#ffffffaa', padding: { x: 16, y: 10 }
    }).setInteractive({ useHandCursor: true });
    dailyButton.on('pointerdown', () => this.showDailyRewardsPopup(false));

    this.eventTimerText = this.add.text(120, 720, 'Événements • Rush du Matin', {
      fontFamily: 'Arial Black', fontSize: '29px', color: '#e63946', backgroundColor: '#fff0f3', padding: { x: 14, y: 8 }
    }).setInteractive({ useHandCursor: true });
    this.eventTimerText.on('pointerdown', () => this.showEventsPopup());

    this.add.text(600, 720, '📅 Calendrier', {
      fontFamily: 'Arial Black', fontSize: '24px', color: '#fff', backgroundColor: '#3a86ff', padding: { x: 12, y: 8 }
    }).setInteractive({ useHandCursor: true }).on('pointerdown', () => this.showLiveOpsCalendar());

    this.add.text(120, 800, 'Boutique   NEW', {
      fontFamily: 'Arial Black', fontSize: '28px', color: '#6d6875', backgroundColor: '#ffe5ec', padding: { x: 14, y: 8 }
    }).setInteractive({ useHandCursor: true }).on('pointerdown', () => this.scene.launch('ShopScene'));
    this.add.text(120, 870, 'Battle Pass   NEW', {
      fontFamily: 'Arial Black', fontSize: '28px', color: '#6d6875', backgroundColor: '#ffe5ec', padding: { x: 14, y: 8 }
    }).setInteractive({ useHandCursor: true }).on('pointerdown', () => this.scene.launch('BattlePassScene'));

    const placementBonus = LiveOpsManager.getInstance().isMorningRushActive() ? 'Bonus placement: x2 vitesse aujourd'hui' : 'Bonus placement: streak actif';
    this.add.text(120, 940, placementBonus, {
      fontFamily: 'Arial Black', fontSize: '22px', color: '#2a9d8f', backgroundColor: '#e9f5db', padding: { x: 12, y: 8 }
    });


    const bp = usePlayerStore.getState().battlePass;
    const remainDays = Math.max(1, Math.ceil((bp.seasonEndsAt - Date.now()) / (24 * 60 * 60 * 1000)));
    this.add.text(120, 1010, `Saison BP: ${remainDays}j`, {
      fontFamily: 'Arial Black', fontSize: '22px', color: '#fff', backgroundColor: '#8338ec', padding: { x: 12, y: 8 }
    }).setInteractive({ useHandCursor: true }).on('pointerdown', () => this.scene.launch('BattlePassScene'));

    const pending = QuestManager.getInstance().getPendingCount();
    this.add.text(120, 1060, `Quêtes ${pending > 0 ? `(${pending})` : ''}`, {
      fontFamily: 'Arial Black', fontSize: '22px', color: '#fff', backgroundColor: '#ff006e', padding: { x: 12, y: 8 }
    }).setInteractive({ useHandCursor: true }).on('pointerdown', () => this.scene.start('GameScene'));

    this.add.text(120, 1115, 'Astuce du jour: merge 3x puis place un meuble ✨', {
      fontFamily: 'Arial', fontSize: '20px', color: '#5a189a', backgroundColor: '#fff0f6', padding: { x: 10, y: 8 }
    });

    this.createCafeTeaser(width, height);
    this.showDailyRewardsPopup(true);
    this.startMenuTimers();
    this.add.text(120, 1165, 'Settings', { fontFamily: 'Arial Black', fontSize: '22px', color: '#fff', backgroundColor: '#6a4c93', padding: { x: 10, y: 8 } }).setInteractive({ useHandCursor: true }).on('pointerdown', () => this.scene.launch('SettingsScene'));
    this.add.text(300, 1165, '🔥 Social', { fontFamily: 'Arial Black', fontSize: '22px', color: '#fff', backgroundColor: '#ff006e', padding: { x: 10, y: 8 } }).setInteractive({ useHandCursor: true }).on('pointerdown', () => this.scene.launch('SocialScene'));
    this.startBackgroundMusic();
  }

  private createTopCounters(width: number): void {
    this.add.rectangle(width / 2, 80, width - 60, 90, 0xffffff, 0.7).setStrokeStyle(3, 0xe0aaff);
    const coinText = this.add.text(90, 58, `🪙 ${usePlayerStore.getState().coins}`, { fontFamily: 'Arial Black', fontSize: '34px', color: '#774936' });
    const gemText = this.add.text(width - 300, 58, `💎 ${usePlayerStore.getState().gems}`, { fontFamily: 'Arial Black', fontSize: '34px', color: '#3a0ca3' });
    this.countdownText = this.add.text(width / 2 - 110, 58, '', { fontFamily: 'Arial Black', fontSize: '28px', color: '#ff8500' });

    this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        coinText.setText(`🪙 ${usePlayerStore.getState().coins}`);
        gemText.setText(`💎 ${usePlayerStore.getState().gems}`);
        this.tweens.add({ targets: [coinText, gemText], scale: { from: 1.06, to: 1 }, duration: 240, ease: 'Back.easeOut' });

        const s = usePlayerStore.getState();
        if (s.energy >= s.energyMax) {
          this.countdownText?.setText(`⚡ ${s.energy}/${s.energyMax} FULL`);
        } else {
          const ms = EnergyManager.getCountdownMs();
          const totalSec = Math.ceil(ms / 1000);
          const m = Math.floor(totalSec / 60);
          const sec = `${totalSec % 60}`.padStart(2, '0');
          this.countdownText?.setText(`⚡ ${s.energy}/${s.energyMax} • ${m}m ${sec}s`);
        }
      }
    });
  }

  private createCafeTeaser(width: number, height: number): void {
    this.add.rectangle(width / 2, height - 280, width - 120, 220, 0xffffff, 0.45).setStrokeStyle(3, 0xf28482);
    this.add.text(width / 2, height - 335, 'Aperçu de ton café', { fontFamily: 'Arial', fontSize: '28px', color: '#6d597a' }).setOrigin(0.5);
    const table = this.add.rectangle(width / 2 - 120, height - 250, 80, 36, 0xbc6c25).setOrigin(0.5);
    const plant = this.add.circle(width / 2 + 40, height - 248, 24, 0x52b788).setOrigin(0.5);
    this.tweens.add({ targets: [table, plant], y: '+=5', yoyo: true, duration: 880, repeat: -1 });
  }

  private showDailyRewardsPopup(onStart: boolean): void {
    const login = StreakManager.evaluateLogin();
    if (onStart && !login.changed) return;

    const { width, height } = this.cameras.main;
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.45).setDepth(3000);
    const card = this.add.rectangle(width / 2, height / 2, width - 120, 580, 0xfff7ff, 0.98).setStrokeStyle(4, 0xc77dff).setDepth(3001);
    const title = this.add.text(width / 2, height / 2 - 230, 'Daily Rewards', { fontFamily: 'Arial Black', fontSize: '48px', color: '#7b2cbf' }).setOrigin(0.5).setDepth(3002);

    for (const reward of StreakManager.rewards) {
      const x = 140 + ((reward.day - 1) % 4) * 220;
      const y = height / 2 - 120 + Math.floor((reward.day - 1) / 4) * 160;
      const active = reward.day === ((login.streak - 1) % 7) + 1;
      this.add.rectangle(x, y, 180, 120, active ? 0xffd6ff : 0xffffff, 0.95).setDepth(3002).setStrokeStyle(3, 0xe0aaff);
      this.add.text(x, y - 26, `Jour ${reward.day}`, { fontFamily: 'Arial Black', fontSize: '24px', color: '#5a189a' }).setDepth(3003).setOrigin(0.5);
      this.add.text(x, y + 6, `🪙${reward.coins} 💎${reward.gems}`, { fontFamily: 'Arial', fontSize: '20px', color: '#6d597a' }).setDepth(3003).setOrigin(0.5);
    }

    const msg = login.broken ? 'Reviens demain pour ne pas perdre ton feu !' : `Streak x${login.streak} maintenu !`;
    this.add.text(width / 2, height / 2 + 165, msg, { fontFamily: 'Arial Black', fontSize: '28px', color: '#e63946' }).setOrigin(0.5).setDepth(3002);

    const close = this.add.text(width / 2, height / 2 + 235, 'Claim', {
      fontFamily: 'Arial Black', fontSize: '34px', color: '#ffffff', backgroundColor: '#ff8fab', padding: { x: 24, y: 12 }
    }).setDepth(3002).setOrigin(0.5).setInteractive({ useHandCursor: true });

    close.on('pointerdown', () => {
      [overlay, card, title, close].forEach((v) => v.destroy());
      this.children.list.filter((go) => go.depth >= 3002).forEach((go) => go.destroy());
      void SaveManager.save();
    });
  }

  private showEventsPopup(): void {
    const { width, height } = this.cameras.main;
    const liveOps = LiveOpsManager.getInstance();
    const ev = liveOps.getMorningRush();

    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.4).setDepth(3200);
    const card = this.add.rectangle(width / 2, height / 2, width - 150, 420, 0xfff7ff, 0.98).setStrokeStyle(4, 0xff4d6d).setDepth(3201);
    const text = this.add.text(width / 2, height / 2 - 60, `${ev.name}\n${ev.description}`, {
      fontFamily: 'Arial Black', fontSize: '30px', color: '#7b2cbf', align: 'center'
    }).setOrigin(0.5).setDepth(3202);

    const close = this.add.text(width / 2, height / 2 + 130, 'Fermer', {
      fontFamily: 'Arial Black', fontSize: '32px', color: '#fff', backgroundColor: '#ff758f', padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setDepth(3202).setInteractive({ useHandCursor: true });

    close.on('pointerdown', () => {
      overlay.destroy();
      card.destroy();
      text.destroy();
      join.destroy();
      close.destroy();
    });
  }



  private showLiveOpsCalendar(): void {
    const { width, height } = this.cameras.main;
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.45).setDepth(3300);
    const card = this.add.rectangle(width / 2, height / 2, width - 120, 560, 0xfff7ff, 1).setStrokeStyle(4, 0x3a86ff).setDepth(3301);
    this.add.text(width / 2, 270, 'Calendrier Live-Ops', { fontFamily: 'Arial Black', fontSize: '40px', color: '#3a0ca3' }).setOrigin(0.5).setDepth(3302);

    const active = LiveOpsManager.getInstance().getActiveEvents();
    const upcoming = LiveOpsManager.getInstance().getUpcomingEvents(Date.now(), 3);
    let y = 340;
    [...active, ...upcoming].slice(0, 6).forEach((ev, i) => {
      this.add.rectangle(width / 2, y + i * 62, width - 190, 52, 0xffffff, 0.95).setDepth(3302).setStrokeStyle(2, 0xbdb2ff);
      this.add.text(120, y - 16 + i * 62, `${ev.name} ${active.includes(ev) ? '🔥' : '⏳'}`, { fontFamily: 'Arial', fontSize: '22px', color: '#5a189a' }).setDepth(3303);
    });

    const close = this.add.text(width / 2, height - 230, 'Fermer', {
      fontFamily: 'Arial Black', fontSize: '30px', color: '#fff', backgroundColor: '#6a4c93', padding: { x: 12, y: 8 }
    }).setOrigin(0.5).setDepth(3303).setInteractive({ useHandCursor: true });
    close.on('pointerdown', () => {
      this.children.list.filter((o) => o.depth >= 3300).forEach((o) => o.destroy());
    });
  }

  private startMenuTimers(): void {
    this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        EnergyManager.tick();
        const liveOps = LiveOpsManager.getInstance();
        const remaining = liveOps.getMorningRushCountdown();
        const sec = Math.ceil(remaining / 1000);
        const h = Math.floor(sec / 3600);
        const m = `${Math.floor((sec % 3600) / 60)}`.padStart(2, '0');
        const s = `${sec % 60}`.padStart(2, '0');
        const active = liveOps.isMorningRushActive();
        this.eventTimerText?.setText(active ? `🔴 Rush du Matin actif • ${m}:${s}` : `Événements • Prochain ${h}h ${m}m`);
        if (active) {
          this.tweens.add({ targets: this.eventTimerText, alpha: { from: 1, to: 0.5 }, yoyo: true, duration: 330 });
        }
      }
    });
  }

  private startBackgroundMusic(): void {
    AudioManager.getInstance().preload();
    AudioManager.getInstance().startAmbience('cafe-jazz');
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.backgroundMusic?.stop();
    });
  }
}
