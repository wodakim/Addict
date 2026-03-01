import Phaser from 'phaser';
import { AudioManager } from '@/game/managers/AudioManager';
import { ClanManager } from '@/game/managers/ClanManager';
import { FriendManager } from '@/game/managers/FriendManager';
import { HapticManager } from '@/game/managers/HapticManager';
import { NotificationManager } from '@/game/managers/NotificationManager';
import { SaveManager } from '@/game/managers/SaveManager';
import { usePlayerStore } from '@/stores/playerStore';

export class SocialScene extends Phaser.Scene {
  constructor() { super('SocialScene'); }

  create(): void {
    const { width, height } = this.cameras.main;
    FriendManager.getInstance().seedDevFriends();

    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.5);
    this.add.rectangle(width / 2, height / 2, width - 90, height - 170, 0xfff7ff, 0.98).setStrokeStyle(4, 0x9d4edd);
    this.add.text(width / 2, 170, 'Social Cosy', { fontFamily: 'Arial Black', fontSize: '50px', color: '#5a189a' }).setOrigin(0.5);

    const s = usePlayerStore.getState();
    this.add.text(90, 240, 'Amis (max 5)', { fontFamily: 'Arial Black', fontSize: '28px', color: '#6d597a' });

    s.friends.slice(0, 5).forEach((f, i) => {
      const y = 300 + i * 95;
      this.add.rectangle(width / 2, y, width - 170, 80, 0xffffff, 0.95).setStrokeStyle(2, 0xe0aaff);
      this.add.text(100, y - 24, `${f.name} • lvl ${f.cafeLevel} • 🔥${f.streak}`, { fontFamily: 'Arial Black', fontSize: '20px', color: '#4a4e69' });
      this.add.text(100, y + 5, `Dernière aide: ${f.lastHelpReceivedAt ? new Date(f.lastHelpReceivedAt).toLocaleTimeString() : '—'}`, { fontFamily: 'Arial', fontSize: '16px', color: '#6d597a' });
      this.add.text(width - 260, y - 18, '☕ Envoyer', { fontFamily: 'Arial Black', fontSize: '18px', color: '#fff', backgroundColor: '#2a9d8f', padding: { x: 8, y: 4 } })
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', async () => {
          if (!usePlayerStore.getState().social.socialEnabled) return;
          const ok = FriendManager.getInstance().sendHotCoffee(f.id);
          if (!ok) return;
          usePlayerStore.getState().addBattlePassXp(5);
          ClanManager.addProgress('g3', 1);
          this.playHelpDeliveryFx(width / 2, y);
          await NotificationManager.scheduleSmartNotifications();
        });
    });

    this.add.text(90, 800, 'Ajouter un ami (code 6 caractères)', { fontFamily: 'Arial', fontSize: '18px', color: '#5a189a' });
    this.add.text(90, 835, 'Ajouter QR (preview)', { fontFamily: 'Arial', fontSize: '16px', color: '#6d597a', backgroundColor: '#f1f3f5', padding: { x: 8, y: 4 } });
    this.add.text(350, 825, 'Ajouter SOPHIE', { fontFamily: 'Arial Black', fontSize: '20px', color: '#fff', backgroundColor: '#4361ee', padding: { x: 10, y: 6 } })
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => { FriendManager.getInstance().addFriendByCode('SOPHIE'); this.scene.restart(); });

    this.add.text(90, 900, 'Demander de l’aide (3/jour)', { fontFamily: 'Arial Black', fontSize: '20px', color: '#fff', backgroundColor: '#f72585', padding: { x: 10, y: 6 } })
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', async () => {
        if (!FriendManager.getInstance().requestHelp()) return;
        await NotificationManager.scheduleSmartNotifications();
        this.floating(width / 2, 940, 'Demande envoyée !');
      });

    if (!s.clan) {
      this.add.text(width - 380, 900, 'Créer clan', { fontFamily: 'Arial Black', fontSize: '20px', color: '#fff', backgroundColor: '#ff9f1c', padding: { x: 10, y: 6 } })
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => { ClanManager.createClan('Campfire Beans'); this.scene.restart(); });
    } else {
      const clan = s.clan;
      this.add.text(width - 400, 880, `🔥 Clan: ${clan.name}`, { fontFamily: 'Arial Black', fontSize: '22px', color: '#5a189a' });
      clan.goals.forEach((g, i) => {
        const y = 920 + i * 45;
        this.add.text(width - 420, y, `${g.title} ${g.progress}/${g.target}`, { fontFamily: 'Arial', fontSize: '16px', color: '#495057' });
      });
      this.add.text(width - 280, 1060, 'Claim clan reward', { fontFamily: 'Arial Black', fontSize: '18px', color: '#fff', backgroundColor: '#2a9d8f', padding: { x: 8, y: 4 } })
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
          if (ClanManager.claimWeeklyRewards()) {
            this.floating(width - 240, 1030, '+Gems clan !');
            this.playHelpDeliveryFx(width - 240, 1030);
          }
        });
    }

    this.add.text(width / 2, height - 80, 'Fermer', { fontFamily: 'Arial Black', fontSize: '30px', color: '#fff', backgroundColor: '#6a4c93', padding: { x: 12, y: 8 } })
      .setOrigin(0.5).setInteractive({ useHandCursor: true }).on('pointerdown', async () => { await SaveManager.save(); this.scene.stop(); });
  }

  private playHelpDeliveryFx(x: number, y: number): void {
    const runner = this.add.circle(x - 180, y, 12, 0x2a9d8f);
    this.tweens.add({ targets: runner, x, duration: 480, onComplete: () => runner.destroy() });
    this.add.particles(x, y, 'logo', {
      speed: { min: 20, max: 120 }, scale: { start: 0.04, end: 0 }, lifespan: 700, quantity: 16, tint: [0xffafcc, 0xffffff]
    }).explode(20);
    this.floating(x, y - 45, 'Un café chaud !');
    AudioManager.getInstance().play('plop');
    AudioManager.getInstance().play('clients-mmm');
    void HapticManager.rewardBig();
  }

  private floating(x: number, y: number, t: string): void {
    const txt = this.add.text(x, y, t, { fontFamily: 'Arial Black', fontSize: '24px', color: '#ff006e' }).setOrigin(0.5);
    this.tweens.add({ targets: txt, y: y - 40, alpha: 0, duration: 1000, onComplete: () => txt.destroy() });
  }
}
