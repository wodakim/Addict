import Phaser from 'phaser';
import { AdManager } from '@/game/managers/AdManager';
import { AnalyticsManager } from '@/game/managers/AnalyticsManager'; from '@/game/managers/AdManager';
import { SaveManager } from '@/game/managers/SaveManager';
import { usePlayerStore } from '@/stores/playerStore';

export class BattlePassScene extends Phaser.Scene {
  constructor() { super('BattlePassScene'); }

  create(): void {
    const { width, height } = this.cameras.main;
    const bp = usePlayerStore.getState().battlePass;
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.5);
    this.add.rectangle(width / 2, height / 2, width - 70, height - 140, 0xf8f9fa, 0.98).setStrokeStyle(4, 0x9d4edd);
    this.add.text(width / 2, 150, 'Battle Pass Saisonnier', { fontFamily: 'Arial Black', fontSize: '44px', color: '#560bad' }).setOrigin(0.5);

    const remain = Math.max(0, bp.seasonEndsAt - Date.now());
    const d = Math.ceil(remain / (24 * 60 * 60 * 1000));
    this.add.text(width / 2, 198, `Seulement ${d} jours restants !`, { fontFamily: 'Arial Black', fontSize: '26px', color: '#e63946' }).setOrigin(0.5);

    this.add.rectangle(width / 2, 245, width - 180, 28, 0xffffff).setStrokeStyle(2, 0xffafcc);
    const fill = this.add.rectangle(90, 245, Math.min(width - 184, ((width - 184) * (bp.xp % 100)) / 100), 22, 0xff8fab).setOrigin(0, 0.5);
    this.tweens.add({ targets: fill, alpha: { from: 0.7, to: 1 }, yoyo: true, duration: 300, repeat: -1 });
    this.add.text(width / 2, 282, `Niveau ${bp.level}/40 • XP ${bp.xp}`, { fontFamily: 'Arial Black', fontSize: '24px', color: '#6d597a' }).setOrigin(0.5);

    for (let lvl = 1; lvl <= 40; lvl += 2) {
      const y = 320 + ((lvl - 1) / 2) * 36;
      if (y > height - 210) break;
      this.add.rectangle(width / 2, y, width - 170, 32, 0xffffff, 0.95).setStrokeStyle(1, 0xe0aaff);
      this.add.text(90, y - 9, `Niv ${lvl}`, { fontFamily: 'Arial Black', fontSize: '16px', color: '#5a189a' });
      this.add.text(190, y - 9, 'Free: coins/gems/energy', { fontFamily: 'Arial', fontSize: '14px', color: '#495057' });
      this.add.text(505, y - 9, 'Premium: skin/rare', { fontFamily: 'Arial', fontSize: '14px', color: '#495057' });
      this.add.text(width - 150, y - 9, 'Claim', { fontFamily: 'Arial Black', fontSize: '14px', color: '#fff', backgroundColor: '#ff758f', padding: { x: 6, y: 3 } })
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.claimReward(lvl));
    }

    this.add.text(120, height - 165, bp.premiumUnlocked ? 'Premium actif ✅' : 'Pass Premium 4,99 €', {
      fontFamily: 'Arial Black', fontSize: '24px', color: '#fff', backgroundColor: '#6a4c93', padding: { x: 10, y: 8 }
    }).setInteractive({ useHandCursor: true }).on('pointerdown', () => {
      usePlayerStore.getState().unlockBattlePassPremium();
      usePlayerStore.getState().registerPurchase('battlepass_premium', '4,99 €');
      AnalyticsManager.track('iap_purchased', { packId: 'battlepass_premium' });
      this.scene.restart();
    });

    this.add.text(430, height - 165, 'Upgrade +20 niveaux', {
      fontFamily: 'Arial Black', fontSize: '22px', color: '#fff', backgroundColor: '#ff006e', padding: { x: 10, y: 8 }
    }).setInteractive({ useHandCursor: true }).on('pointerdown', () => {
      usePlayerStore.getState().registerPurchase('bp_upgrade_20', '3,99 €');
      AnalyticsManager.track('iap_purchased', { packId: 'bp_upgrade_20' });
      usePlayerStore.getState().addBattlePassXp(2000);
      this.scene.restart();
    });

    this.add.text(730, height - 165, 'Pub → XP', {
      fontFamily: 'Arial Black', fontSize: '22px', color: '#fff', backgroundColor: '#ff758f', padding: { x: 10, y: 8 }
    }).setInteractive({ useHandCursor: true }).on('pointerdown', async () => {
      await AdManager.showRewarded('battlepass_xp');
      this.scene.restart();
    });

    this.add.text(width / 2, height - 86, 'Fermer', { fontFamily: 'Arial Black', fontSize: '32px', color: '#fff', backgroundColor: '#6a4c93', padding: { x: 18, y: 10 } })
      .setOrigin(0.5).setInteractive({ useHandCursor: true }).on('pointerdown', () => this.scene.stop());
  }

  private claimReward(level: number): void {
    const s = usePlayerStore.getState();
    if (s.battlePass.level < level) return;
    s.claimBattlePassReward(level, false);
    s.addCoins(130 + level * 8);
    if (level % 3 === 0) s.addEnergy(1);
    if (s.battlePass.premiumUnlocked) {
      s.claimBattlePassReward(level, true);
      s.addGems(15 + Math.floor(level / 4));
    }
    void SaveManager.save();
  }
}
