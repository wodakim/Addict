import Phaser from 'phaser';
import { AnalyticsManager } from '@/game/managers/AnalyticsManager';
import { AudioManager } from '@/game/managers/AudioManager';
import { HapticManager } from '@/game/managers/HapticManager';
import { SaveManager } from '@/game/managers/SaveManager';
import { usePlayerStore } from '@/stores/playerStore';

interface ShopPack {
  id: string;
  tab: 'Coins' | 'Gems' | 'Packs' | 'Boosters';
  name: string;
  priceLabel: string;
  bonus?: string;
  coins?: number;
  gems?: number;
  vipDays?: number;
  energyInfiniteHours?: number;
  skin?: string;
}

const PACKS: ShopPack[] = [
  { id: 'starter_pack', tab: 'Packs', name: 'Starter Pack', priceLabel: '2,99 €', bonus: 'Best value', coins: 3000, gems: 240 },
  { id: 'gems_100', tab: 'Gems', name: 'Gemmes x100', priceLabel: '1,99 €', gems: 100 },
  { id: 'gems_500', tab: 'Gems', name: 'Gemmes x500', priceLabel: '4,99 €', gems: 500, bonus: 'Best value' },
  { id: 'gems_2000', tab: 'Gems', name: 'Gemmes x2000', priceLabel: '14,99 €', gems: 2000 },
  { id: 'coins_5000', tab: 'Coins', name: 'Coins x5000', priceLabel: '2,99 €', coins: 5000 },
  { id: 'energy_infinite_24h', tab: 'Boosters', name: 'Énergie infinie 24h', priceLabel: '4,99 €', bonus: 'POPULAR', gems: 100 },
  { id: 'cafe_vip_7d', tab: 'Boosters', name: 'Café VIP x2 prod 7j', priceLabel: '6,99 €', bonus: 'VIP', coins: 2500 },
  { id: 'legendary_skin', tab: 'Packs', name: 'Skin légendaire', priceLabel: '3,99 €', skin: 'terrasse-legend', bonus: 'NEW' }
];

export class ShopScene extends Phaser.Scene {
  private currentTab: ShopPack['tab'] = 'Coins';

  constructor() { super('ShopScene'); }

  create(): void {
    const { width, height } = this.cameras.main;
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.56);
    this.add.rectangle(width / 2, height / 2, width - 80, height - 160, 0xfff7ff, 1).setStrokeStyle(4, 0xc77dff);
    this.add.text(width / 2, 160, 'Boutique Premium', { fontFamily: 'Arial Black', fontSize: '52px', color: '#7b2cbf' }).setOrigin(0.5);

    const tabs: ShopPack['tab'][] = ['Coins', 'Gems', 'Packs', 'Boosters'];
    tabs.forEach((tab, index) => {
      this.add.text(120 + index * 230, 235, tab, { fontFamily: 'Arial Black', fontSize: '22px', color: '#fff', backgroundColor: tab === this.currentTab ? '#ff758f' : '#6a4c93', padding: { x: 10, y: 8 } })
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => { this.currentTab = tab; this.scene.restart(); });
    });

    const entries = PACKS.filter((p) => p.tab === this.currentTab);
    entries.forEach((pack, i) => {
      const y = 330 + i * 125;
      const card = this.add.rectangle(width / 2, y, width - 170, 102, 0xffffff, 0.98).setStrokeStyle(3, 0xffafcc).setInteractive({ useHandCursor: true });
      this.add.text(120, y - 23, pack.name, { fontFamily: 'Arial Black', fontSize: '27px', color: '#5a189a' });
      this.add.text(width - 290, y - 16, pack.priceLabel, { fontFamily: 'Arial Black', fontSize: '30px', color: '#e63946' });
      if (pack.bonus) {
        const b = this.add.text(width - 470, y - 16, `${pack.bonus}`, { fontFamily: 'Arial Black', fontSize: '20px', color: '#fff', backgroundColor: '#ff006e', padding: { x: 8, y: 4 } });
        this.tweens.add({ targets: b, alpha: { from: 1, to: 0.45 }, yoyo: true, repeat: -1, duration: 380 });
      }
      card.on('pointerdown', () => this.buyPack(pack));
    });

    this.add.text(width / 2, height - 95, 'Fermer', { fontFamily: 'Arial Black', fontSize: '32px', color: '#fff', backgroundColor: '#6a4c93', padding: { x: 16, y: 10 } })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.scene.stop());
  }

  private buyPack(pack: ShopPack): void {
    const s = usePlayerStore.getState();
    if (pack.coins) s.addCoins(pack.coins);
    if (pack.gems) s.addGems(pack.gems);
    if (pack.skin) s.addPlaceableItem('coffee-bean-lv2', 1);
    s.registerPurchase(pack.id, pack.priceLabel);
    AnalyticsManager.track('iap_purchased', { packId: pack.id, price: pack.priceLabel });

    const { width } = this.cameras.main;
    this.add.particles(width / 2, 350, 'logo', { speed: { min: 30, max: 240 }, scale: { start: 0.05, end: 0 }, lifespan: 780, quantity: 24, tint: [0xffd166, 0xffffff] }).explode(38);
    this.add.text(width / 2, 275, 'Achat réussi ! +20% bonus', { fontFamily: 'Arial Black', fontSize: '38px', color: '#2a9d8f' }).setOrigin(0.5);
    AudioManager.getInstance().play('jackpot');
    void HapticManager.rewardBig();
    void SaveManager.save();
  }
}
