import Phaser from 'phaser';
import { AdManager } from '@/game/managers/AdManager';
import { PerformanceManager } from '@/game/managers/PerformanceManager';
import { AudioManager } from '@/game/managers/AudioManager';
import { HapticManager } from '@/game/managers/HapticManager';
import { FtueManager } from '@/game/managers/FtueManager';
import { QuestManager } from '@/game/managers/QuestManager';
import { WelcomeWeekManager, WELCOME_WEEK } from '@/game/managers/WelcomeWeekManager';
import { EnergyManager } from '@/game/managers/EnergyManager';
import { LiveOpsManager } from '@/game/managers/LiveOpsManager';
import { type OfflineReport, SaveManager } from '@/game/managers/SaveManager';
import { mergeItems, type MergeItemDefinition } from '@/game/data/items';
import { type CafeZoneId, usePlayerStore } from '@/stores/playerStore';

type GridCell = { col: number; row: number; x: number; y: number };
type ItemSprite = Phaser.GameObjects.Container & { itemDef: MergeItemDefinition; cell: GridCell };

type ZoneDef = { id: CafeZoneId; label: string; unlockCoins: number; unlockGems: number; minCafeLevel: number; color: number };

const GRID_COLS = 8;
const GRID_ROWS = 8;
const CELL_SIZE = 98;
const GRID_X = 66;
const GRID_Y = 280;
const ZONES: ZoneDef[] = [
  { id: 'counter', label: 'Comptoir', unlockCoins: 0, unlockGems: 0, minCafeLevel: 1, color: 0xfff1e6 },
  { id: 'kitchen', label: 'Cuisine', unlockCoins: 600, unlockGems: 5, minCafeLevel: 3, color: 0xfefae0 },
  { id: 'lounge', label: 'Salon', unlockCoins: 1200, unlockGems: 8, minCafeLevel: 6, color: 0xe9edc9 },
  { id: 'terrace', label: 'Terrasse', unlockCoins: 1900, unlockGems: 12, minCafeLevel: 10, color: 0xd8f3dc },
  { id: 'office', label: 'Bureau', unlockCoins: 2600, unlockGems: 16, minCafeLevel: 14, color: 0xe0fbfc },
  { id: 'secret-garden', label: 'Jardin secret', unlockCoins: 3400, unlockGems: 20, minCafeLevel: 18, color: 0xcdeac0 }
];

export class GameScene extends Phaser.Scene {
  private grid: GridCell[] = [];
  private occupied = new Map<string, ItemSprite>();
  private energyText?: Phaser.GameObjects.Text;
  private energyBarFill?: Phaser.GameObjects.Rectangle;
  private energyTimerText?: Phaser.GameObjects.Text;
  private levelBarFill?: Phaser.GameObjects.Rectangle;
  private happinessFill?: Phaser.GameObjects.Rectangle;
  private offlineText?: Phaser.GameObjects.Text;
  private eventTimerText?: Phaser.GameObjects.Text;
  private cafeProgress = 0;
  private inCafeMode = false;
  private currentZone: CafeZoneId = 'counter';
  private mergeLayer?: Phaser.GameObjects.Container;
  private cafeLayer?: Phaser.GameObjects.Container;
  private miniMapContainer?: Phaser.GameObjects.Container;
  private placementPalette?: Phaser.GameObjects.Container;
  private cafeGridCells: { x: number; y: number; key: string }[] = [];
  private cafeDropZone?: Phaser.GameObjects.Rectangle;
  private mergeCountForInterstitial = 0;
  private lastActionAt = Date.now();

  constructor() {
    super('GameScene');
  }

  create(): void {
    const { width, height } = this.cameras.main;
    this.cameras.main.setBackgroundColor(0xf9f1ff);

    this.mergeLayer = this.add.container(0, 0);
    this.cafeLayer = this.add.container(0, 0).setVisible(false);

    AudioManager.getInstance().preload();
    PerformanceManager.applyRuntimeBudget(this);
    PerformanceManager.beginFrameProfiler(this);
    AudioManager.getInstance().startAmbience('cafe-jazz-2');
    this.createTopBar(width);
    this.createMergeMode(width, height);
    this.createCafeMode(width, height);

    const offline = SaveManager.applyOfflineProgress();
    this.showOfflinePopup(offline);
    QuestManager.getInstance().resetDailiesIfNeeded();
    this.showQuestsButton();
    this.showWelcomeWeekCalendar();
    if (FtueManager.shouldRunFtue()) this.startFtueSequence();
    this.maybeShowContextualOffer();
    this.setupEnergyTicker();
    this.setupAutosave();
    this.setupEventTicker();

    this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => void SaveManager.forceSaveWithStamp());
    this.input.on('pointerdown', () => { this.lastActionAt = Date.now(); });
    this.setupHelpNudge();
  }

  private createTopBar(width: number): void {
    this.add.rectangle(width / 2, 70, width - 40, 110, 0xffffff, 0.72).setStrokeStyle(3, 0xd8b4fe);
    this.add.text(40, 44, '⏸ Pause', { fontFamily: 'Arial Black', fontSize: '30px', color: '#6d597a' }).setInteractive({ useHandCursor: true }).on('pointerdown', () => {
      void SaveManager.forceSaveWithStamp();
      this.scene.start('MainMenuScene');
    });
    this.energyText = this.add.text(320, 42, '', { fontFamily: 'Arial Black', fontSize: '32px', color: '#fb8500' });
    this.energyTimerText = this.add.text(550, 47, '', { fontFamily: 'Arial', fontSize: '28px', color: '#6d597a' });
    this.eventTimerText = this.add.text(770, 47, '', { fontFamily: 'Arial Black', fontSize: '22px', color: '#e63946' });

    this.add.rectangle(120, 126, 220, 20, 0xffffff, 0.8).setStrokeStyle(2, 0xffafcc).setOrigin(0, 0.5);
    this.energyBarFill = this.add.rectangle(122, 126, 0, 14, 0xff8500).setOrigin(0, 0.5);

    this.add.rectangle(360, 126, 280, 20, 0xffffff, 0.8).setStrokeStyle(2, 0x2a9d8f).setOrigin(0, 0.5);
    this.happinessFill = this.add.rectangle(362, 126, 0, 14, 0x2a9d8f).setOrigin(0, 0.5);

    this.add.rectangle(120, 160, width - 240, 24, 0xffffff, 0.65).setStrokeStyle(2, 0xffafcc).setOrigin(0, 0.5);
    this.levelBarFill = this.add.rectangle(122, 160, 8, 16, 0xff8fab).setOrigin(0, 0.5);

    this.add.text(width - 130, 124, 'Voir mon Café', {
      fontFamily: 'Arial Black',
      fontSize: '20px',
      color: '#fff',
      backgroundColor: '#6a4c93',
      padding: { x: 12, y: 8 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).on('pointerdown', () => this.toggleMode());

    this.refreshTopUi();
  }

  private createMergeMode(width: number, height: number): void {
    for (let row = 0; row < GRID_ROWS; row += 1) {
      for (let col = 0; col < GRID_COLS; col += 1) {
        const x = GRID_X + col * CELL_SIZE;
        const y = GRID_Y + row * CELL_SIZE;
        this.grid.push({ col, row, x, y });
        this.mergeLayer?.add(this.add.rectangle(x, y, 88, 88, 0xffffff, 0.5).setStrokeStyle(2, 0xe0aaff));
      }
    }

    this.offlineText = this.add.text(40, height - 128, '+0 coins en attente', { fontFamily: 'Arial Black', fontSize: '30px', color: '#588157' });
    this.mergeLayer?.add(this.add.text(width - 300, height - 85, 'Settings', { fontFamily: 'Arial Black', fontSize: '22px', color: '#fff', backgroundColor: '#6a4c93', padding: { x: 8, y: 6 } }).setOrigin(0.5).setInteractive({ useHandCursor: true }).on('pointerdown', () => this.scene.launch('SettingsScene')));
    this.mergeLayer?.add(this.add.text(width - 470, height - 85, '🔥 Social', { fontFamily: 'Arial Black', fontSize: '20px', color: '#fff', backgroundColor: '#ff006e', padding: { x: 8, y: 6 } }).setOrigin(0.5).setInteractive({ useHandCursor: true }).on('pointerdown', () => this.scene.launch('SocialScene')));
    this.mergeLayer?.add(this.add.rectangle(width / 2, height - 80, width - 30, 130, 0xffffff, 0.75).setStrokeStyle(2, 0xffafcc));
    this.mergeLayer?.add(this.add.text(width - 120, height - 85, 'Shop', { fontFamily: 'Arial Black', fontSize: '24px', color: '#fff', backgroundColor: '#6a4c93', padding: { x: 10, y: 6 } }).setOrigin(0.5).setInteractive({ useHandCursor: true }).on('pointerdown', () => this.scene.launch('ShopScene')));
    this.mergeLayer?.add(this.offlineText);

    this.cafeDropZone = this.add.rectangle(width - 140, height - 140, 240, 170, 0xfff1e6, 0.9).setStrokeStyle(3, 0xf28482);
    this.mergeLayer?.add(this.cafeDropZone);
    this.mergeLayer?.add(this.add.text(width - 140, height - 140, 'Déposer\nau Café', { fontFamily: 'Arial Black', fontSize: '28px', color: '#9c6644', align: 'center' }).setOrigin(0.5));

    this.createInitialItems();
  }

  private createCafeMode(width: number, height: number): void {
    this.cafeLayer?.add(this.add.rectangle(width / 2, height / 2 + 70, width - 50, height - 260, 0xfff6e7, 1).setStrokeStyle(4, 0xe9c46a));
    this.cafeLayer?.add(this.add.text(width / 2, 230, 'Mode Décoration 2.5D', { fontFamily: 'Arial Black', fontSize: '44px', color: '#7b2cbf' }).setOrigin(0.5));

    this.miniMapContainer = this.add.container(width - 150, 220);
    this.cafeLayer?.add(this.miniMapContainer);

    this.placementPalette = this.add.container(130, height - 200);
    this.cafeLayer?.add(this.placementPalette);

    this.buildZoneUi();
    this.renderZone();
    this.renderPlacementPalette();
    this.restorePlacedObjectsForZone();
  }

  private buildZoneUi(): void {
    this.miniMapContainer?.removeAll(true);
    let y = 0;
    for (const zone of ZONES) {
      const unlocked = usePlayerStore.getState().unlockedZones.includes(zone.id);
      const b = this.add.rectangle(0, y, 220, 48, unlocked ? 0xffffff : 0xdddddd, 0.95).setStrokeStyle(2, 0x9d4edd).setOrigin(0.5);
      const t = this.add.text(0, y, unlocked ? zone.label : `🔒 ${zone.label}`, { fontFamily: 'Arial Black', fontSize: '18px', color: '#5a189a' }).setOrigin(0.5);
      b.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
        if (unlocked) {
          this.currentZone = zone.id;
          void AdManager.showInterstitial();
          this.renderZone();
          this.renderPlacementPalette();
          this.restorePlacedObjectsForZone();
        }
      });
      this.miniMapContainer?.add([b, t]);
      y += 54;
    }

    const upgrade = this.add.text(0, y + 14, 'Améliorer zone', {
      fontFamily: 'Arial Black', fontSize: '20px', color: '#fff', backgroundColor: '#ff758f', padding: { x: 10, y: 6 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    upgrade.on('pointerdown', () => this.unlockNextZone());
    this.miniMapContainer?.add(upgrade);
  }

  private unlockNextZone(): void {
    const s = usePlayerStore.getState();
    const next = ZONES.find((z) => !s.unlockedZones.includes(z.id));
    if (!next) return;
    if (s.currentCafeLevel < next.minCafeLevel || s.coins < next.unlockCoins || s.gems < next.unlockGems) {
      this.floatingText(this.cameras.main.width / 2, 250, 'Zone verrouillée');
      return;
    }
    s.addCoins(-next.unlockCoins);
    s.addGems(-next.unlockGems);
    s.unlockZone(next.id);
    this.buildZoneUi();
    this.floatingText(this.cameras.main.width / 2, 250, `${next.label} débloqué !`, '#2a9d8f');
    usePlayerStore.getState().addBattlePassXp(40);
    void SaveManager.save();
  }

  private renderZone(): void {
    if (!this.cafeLayer) return;
    this.cafeLayer.list.filter((o) => o.getData('zoneRender')).forEach((o) => o.destroy());
    this.cafeGridCells = [];

    const zone = ZONES.find((z) => z.id === this.currentZone) ?? ZONES[0];
    const bg = this.add.rectangle(this.cameras.main.width / 2, this.cameras.main.height / 2 + 80, 780, 980, zone.color, 0.95).setStrokeStyle(3, 0xd4a373).setData('zoneRender', true);
    this.cafeLayer.add(bg);

    const level = usePlayerStore.getState().currentCafeLevel;
    const vibe = this.add.text(160, 260, `Niveau Café ${level}`, { fontFamily: 'Arial Black', fontSize: '28px', color: '#6d597a' }).setData('zoneRender', true);
    this.cafeLayer.add(vibe);

    const wallShade = this.add.rectangle(540, 280, 740, 120, 0xffffff, Math.min(0.75, 0.25 + level * 0.01)).setData('zoneRender', true);
    this.cafeLayer.add(wallShade);

    for (let r = 0; r < 4; r += 1) {
      for (let c = 0; c < 5; c += 1) {
        const x = 280 + c * 110;
        const y = 430 + r * 115;
        this.cafeGridCells.push({ x, y, key: `${this.currentZone}-${c}-${r}` });
        const cell = this.add.rectangle(x, y, 94, 94, 0xffffff, 0.4).setStrokeStyle(2, 0xbc6c25).setData('zoneRender', true);
        this.cafeLayer.add(cell);
      }
    }

    const pnj = this.add.circle(840, 520, 20, 0x577590).setData('zoneRender', true);
    const pnj2 = this.add.circle(860, 640, 20, 0x43aa8b).setData('zoneRender', true);
    this.cafeLayer.add([pnj, pnj2]);
    this.tweens.add({ targets: [pnj, pnj2], x: '+=18', yoyo: true, repeat: -1, duration: 900 });

    this.add.particles(840, 390, 'logo', {
      speedY: { min: -40, max: -10 },
      scale: { start: 0.04, end: 0 },
      alpha: { start: 0.25, end: 0 },
      lifespan: 1200,
      frequency: 260
    }).setData('zoneRender', true);
  }

  private renderPlacementPalette(): void {
    if (!this.placementPalette) return;
    this.placementPalette.removeAll(true);
    this.placementPalette.add(this.add.text(0, -40, 'Album / Objets à placer', { fontFamily: 'Arial Black', fontSize: '22px', color: '#6d597a' }));

    const entries = Object.entries(usePlayerStore.getState().placeableItems).filter(([, qty]) => qty > 0);
    let y = 10;
    for (const [itemId, qty] of entries.slice(0, 6)) {
      const item = mergeItems.find((m) => m.id === itemId);
      if (!item) continue;
      const btn = this.add.rectangle(120, y, 250, 44, 0xffffff, 0.95).setStrokeStyle(2, 0x9d4edd).setInteractive({ useHandCursor: true });
      const txt = this.add.text(14, y - 12, `${item.name} x${qty}`, { fontFamily: 'Arial', fontSize: '18px', color: '#3c096c' });
      btn.on('pointerdown', () => this.placeFromPalette(item));
      this.placementPalette.add([btn, txt]);
      y += 54;
    }

    const achievement = this.isZoneFull(this.currentZone) ? '🏆 Décorateur 5 étoiles' : 'Remplis la zone pour un trophée';
    this.placementPalette.add(this.add.text(0, y + 10, achievement, { fontFamily: 'Arial Black', fontSize: '18px', color: '#e63946' }));
  }

  private isZoneFull(zoneId: CafeZoneId): boolean {
    const count = usePlayerStore.getState().placedObjects.filter((p) => p.zoneId === zoneId).length;
    return count >= 20;
  }

  private placeFromPalette(item: MergeItemDefinition): void {
    const cell = this.cafeGridCells.find((c) => !usePlayerStore.getState().placedObjects.some((p) => `${p.zoneId}-${Math.round(p.x)}-${Math.round(p.y)}` === `${this.currentZone}-${Math.round(c.x)}-${Math.round(c.y)}`));
    if (!cell) return;
    const consumed = usePlayerStore.getState().consumePlaceableItem(item.id, 1);
    if (!consumed) return;

    if (item.rarity === 'epic' || item.rarity === 'legendary') {
      if (!EnergyManager.consume(1)) {
        this.showOutOfEnergyOverlay();
        return;
      }
    }

    if (item.placementCost > 0) {
      usePlayerStore.getState().addCoins(-item.placementCost);
    }

    const from = this.add.circle(150, this.cameras.main.height - 210, 16, 0xffafcc);
    const obj = this.add.rectangle(cell.x, cell.y, 64, 64, item.category === 'furniture' ? 0xbc6c25 : 0x52b788).setDepth(2000);
    obj.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
      usePlayerStore.getState().rotatePlacedObject(obj.name);
      obj.angle = (obj.angle + 90) % 360;
      void SaveManager.save();
    });
    obj.name = `${item.id}-${Date.now()}`;

    this.tweens.add({
      targets: from,
      x: cell.x,
      y: cell.y,
      duration: 420,
      ease: 'Back.easeOut',
      onComplete: () => {
        from.destroy();
        AudioManager.getInstance().play('plop');
        AudioManager.getInstance().playPlacement(item.category === 'furniture' ? 'wood' : 'fabric');
        AudioManager.getInstance().play('clients-applause');
        this.floatingText(cell.x, cell.y - 70, 'Wow !', '#f77f00');
        this.add.particles(cell.x, cell.y, 'logo', {
          speed: { min: 20, max: 140 },
          scale: { start: 0.03, end: 0 },
          lifespan: 550,
          quantity: 12,
          tint: [0xffd166, 0xffffff]
        }).explode(14);
        this.cameras.main.shake(100, 0.002);
        void HapticManager.placeFurniture();
      }
    });

    usePlayerStore.getState().placeObject({ uid: obj.name, itemId: item.id, zoneId: this.currentZone, x: cell.x, y: cell.y, rotation: 0 });
    usePlayerStore.getState().addHappiness(item.rarity === 'legendary' ? 8 : item.rarity === 'epic' ? 5 : 2);
    this.refreshTopUi();
    QuestManager.getInstance().addProgress('place_count', 1);
    if (this.currentZone === 'terrace') QuestManager.getInstance().addProgress('terrace_place_count', 1);
    this.renderPlacementPalette();
    void SaveManager.save();
  }

  private restorePlacedObjectsForZone(): void {
    if (!this.cafeLayer) return;
    this.cafeLayer.list.filter((o) => o.getData('placedObj')).forEach((o) => o.destroy());
    const placed = usePlayerStore.getState().placedObjects.filter((p) => p.zoneId === this.currentZone);
    for (const p of placed) {
      const item = mergeItems.find((m) => m.id === p.itemId);
      const obj = this.add.rectangle(p.x, p.y, 64, 64, item?.category === 'furniture' ? 0xbc6c25 : 0x52b788).setAngle(p.rotation).setData('placedObj', true);
      obj.name = p.uid;
      obj.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
        usePlayerStore.getState().rotatePlacedObject(p.uid);
        obj.angle = (obj.angle + 90) % 360;
        this.floatingText(obj.x, obj.y - 50, 'Rotation 90°', '#6a4c93');
        void SaveManager.save();
      });
      this.cafeLayer.add(obj);
    }
  }

  private createInitialItems(): void {
    const baseItems = mergeItems.slice(0, 2);
    const starterCells = [0, 1, 8, 9, 10];
    for (let i = 0; i < starterCells.length; i += 1) {
      const def = baseItems[i % baseItems.length];
      const cell = this.grid[starterCells[i]];
      if (cell && def) this.spawnItem(def, cell);
    }
  }

  private spawnItem(def: MergeItemDefinition, cell: GridCell): void {
    const circle = this.add.circle(0, 0, 34, def.level > 1 ? 0xc77dff : 0xffafcc).setStrokeStyle(4, 0xffffff);
    const label = this.add.text(0, -8, `L${def.level}`, { fontFamily: 'Arial Black', fontSize: '26px', color: '#ffffff' }).setOrigin(0.5);
    const sprite = this.add.container(cell.x, cell.y, [circle, label]) as ItemSprite;
    sprite.itemDef = def;
    sprite.cell = cell;
    sprite.setSize(72, 72).setInteractive({ draggable: true, useHandCursor: true });
    this.input.setDraggable(sprite);
    this.occupied.set(`${cell.col}-${cell.row}`, sprite);
    this.mergeLayer?.add(sprite);

    sprite.on('drag', (_p: Phaser.Input.Pointer, dragX: number, dragY: number) => sprite.setPosition(dragX, dragY));
    sprite.on('dragend', () => this.handleDrop(sprite));
  }

  private getNearestCell(x: number, y: number): GridCell | undefined {
    let nearest: GridCell | undefined;
    let best = Number.POSITIVE_INFINITY;
    for (const cell of this.grid) {
      const d = Phaser.Math.Distance.Between(x, y, cell.x, cell.y);
      if (d < best) {
        best = d;
        nearest = cell;
      }
    }
    return best <= 70 ? nearest : undefined;
  }

  private handleDrop(sprite: ItemSprite): void {
    if (this.cafeDropZone && Phaser.Geom.Rectangle.ContainsPoint(this.cafeDropZone.getBounds(), new Phaser.Geom.Point(sprite.x, sprite.y))) {
      usePlayerStore.getState().addPlaceableItem(sprite.itemDef.id, 1);
      const k = `${sprite.cell.col}-${sprite.cell.row}`;
      this.occupied.delete(k);
      sprite.destroy();
      this.floatingText(this.cameras.main.width - 140, this.cameras.main.height - 220, 'Au café !', '#2a9d8f');
      AudioManager.getInstance().play('plop');
      this.renderPlacementPalette();
      void SaveManager.save();
      return;
    }

    const nearest = this.getNearestCell(sprite.x, sprite.y);
    if (!nearest) return sprite.setPosition(sprite.cell.x, sprite.cell.y);

    const fromKey = `${sprite.cell.col}-${sprite.cell.row}`;
    const targetKey = `${nearest.col}-${nearest.row}`;
    const targetSprite = this.occupied.get(targetKey);

    if (targetSprite && targetSprite !== sprite && targetSprite.itemDef.id === sprite.itemDef.id && sprite.itemDef.mergeTargetId) {
      if (!EnergyManager.consume(1)) {
        this.showOutOfEnergyOverlay();
        return sprite.setPosition(sprite.cell.x, sprite.cell.y);
      }
      this.occupied.delete(fromKey);
      this.occupied.delete(targetKey);
      sprite.destroy();
      targetSprite.destroy();
      const nextDef = mergeItems.find((item) => item.id === sprite.itemDef.mergeTargetId);
      if (nextDef) {
        this.spawnItem(nextDef, nearest);
        this.playMergeFx(nearest.x, nearest.y, nextDef.level);
        usePlayerStore.getState().addOwnedItem(nextDef.id, 1);
      }
      this.refreshTopUi();
      this.mergeCountForInterstitial += 1;
      if (this.mergeCountForInterstitial >= 8) {
        this.mergeCountForInterstitial = 0;
        void AdManager.showInterstitial();
      }
      usePlayerStore.getState().addBattlePassXp(15);
      QuestManager.getInstance().addProgress('merge_count', 1);
      void SaveManager.save();
      return;
    }

    if (!targetSprite || targetSprite === sprite) {
      this.occupied.delete(fromKey);
      this.occupied.set(targetKey, sprite);
      sprite.cell = nearest;
      sprite.setPosition(nearest.x, nearest.y);
      return;
    }

    sprite.setPosition(sprite.cell.x, sprite.cell.y);
  }

  private playMergeFx(x: number, y: number, level: number): void {
    AudioManager.getInstance().playMerge(level);
    this.add.particles(x, y, 'logo', {
      speed: { min: 40, max: 220 },
      scale: { start: 0.05, end: 0 },
      quantity: level >= 3 ? 35 : 18,
      lifespan: 650,
      tint: level >= 3 ? [0xffd166, 0xfb8500, 0xffffff] : [0xffafcc, 0xc77dff]
    }).explode(level >= 3 ? 24 : 12);
    this.floatingText(x, y - 70, '+1', '#2a9d8f');
    if (level >= 8) { this.cameras.main.shake(800, 0.002); void HapticManager.mergeEpic(); } else if (level >= 4) { void HapticManager.mergeMedium(); } else { void HapticManager.mergeLight(); }

    this.cafeProgress = Math.min(1, this.cafeProgress + 0.08);
    if (this.levelBarFill) this.levelBarFill.width = Phaser.Math.Linear(8, this.cameras.main.width - 248, this.cafeProgress);

    if (this.cafeProgress >= 1) {
      AudioManager.getInstance().play('level-up');
      usePlayerStore.setState({ currentCafeLevel: usePlayerStore.getState().currentCafeLevel + 1 });
      this.floatingText(this.cameras.main.width / 2, 220, 'Niveau Café +1', '#ff006e');
      this.cafeProgress = 0;
      if (this.levelBarFill) this.levelBarFill.width = 8;
      this.renderZone();
      this.buildZoneUi();
    }
  }

  private setupEnergyTicker(): void {
    this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        const raised = EnergyManager.tick();
        if (raised) {
          AudioManager.getInstance().play('energy-refill');
          this.floatingText(250, 180, 'Énergie +1', '#fb8500');
          void HapticManager.energyRefill();
        }
        this.refreshTopUi();
      }
    });
  }

  private setupEventTicker(): void {
    this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        const liveOps = LiveOpsManager.getInstance();
        const sec = Math.ceil(liveOps.getMorningRushCountdown() / 1000);
        const m = `${Math.floor((sec % 3600) / 60)}`.padStart(2, '0');
        const s = `${sec % 60}`.padStart(2, '0');
        const active = liveOps.isMorningRushActive();
        this.eventTimerText?.setText(active ? `🔴 RUSH ${m}:${s}` : `⏱ ${m}:${s}`);
      }
    });
  }

  private showOutOfEnergyOverlay(): void {
    const { width, height } = this.cameras.main;
    const bg = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.45).setDepth(4500);
    const card = this.add.rectangle(width / 2, height / 2, width - 180, 300, 0xfff7ff, 0.98).setStrokeStyle(4, 0xff4d6d).setDepth(4501);
    const title = this.add.text(width / 2, height / 2 - 80, 'Plus d’énergie !', { fontFamily: 'Arial Black', fontSize: '52px', color: '#d00000' }).setOrigin(0.5).setDepth(4502);
    const adBtn = this.add.text(width / 2, height / 2 - 5, 'Regarder pub → +2 énergie', {
      fontFamily: 'Arial Black', fontSize: '30px', color: '#fff', backgroundColor: '#ff758f', padding: { x: 18, y: 10 }
    }).setOrigin(0.5).setDepth(4502).setInteractive({ useHandCursor: true });
    const buyBtn = this.add.text(width / 2, height / 2 + 72, 'Acheter pack 99¢', {
      fontFamily: 'Arial Black', fontSize: '30px', color: '#fff', backgroundColor: '#6a4c93', padding: { x: 18, y: 10 }
    }).setOrigin(0.5).setDepth(4502).setInteractive({ useHandCursor: true });
    const close = () => [bg, card, title, adBtn, buyBtn].forEach((o) => o.destroy());
    adBtn.on('pointerdown', async () => {
      const r = await AdManager.showRewarded('energy');
      if (!r.ok && r.noAd) {
        this.showContextualOffer('no_ad', 'No ad available → Pack énergie 0,99 € (+20%)', () => {
          usePlayerStore.getState().registerPurchase('energy_pack_contextual', '0,99 €');
          usePlayerStore.getState().addEnergy(3);
        });
      } else {
        QuestManager.getInstance().addProgress('ads_count', 1);
      }
      this.refreshTopUi();
      this.floatingText(width / 2, height / 2 - 120, 'Énergie +3', '#fb8500');
      close();
    });
    buyBtn.on('pointerdown', close);
  }

  private showOfflinePopup(report: OfflineReport): void {
    if (report.producedCoins <= 0) {
      this.offlineText?.setText('+0 coins en attente');
      return;
    }
    this.offlineText?.setText(`+${report.producedCoins} coins en attente`);
    const { width, height } = this.cameras.main;
    const bg = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.45).setDepth(4300);
    const card = this.add.rectangle(width / 2, height / 2, width - 140, 340, 0xffffff, 0.98).setStrokeStyle(4, 0xffafcc).setDepth(4301);
    const text = this.add.text(width / 2, height / 2 - 60, `Bienvenue !\nTu as gagné ${report.producedCoins.toLocaleString('fr-FR')} coins`, {
      fontFamily: 'Arial Black', fontSize: '34px', color: '#7b2cbf', align: 'center'
    }).setOrigin(0.5).setDepth(4302);
    const claim = this.add.text(width / 2, height / 2 + 58, 'Claim All', {
      fontFamily: 'Arial Black', fontSize: '34px', color: '#fff', backgroundColor: '#ff758f', padding: { x: 20, y: 12 }
    }).setOrigin(0.5).setDepth(4302).setInteractive({ useHandCursor: true });
    const double = this.add.text(width / 2, height / 2 + 125, 'x2 avec pub', {
      fontFamily: 'Arial Black', fontSize: '30px', color: '#fff', backgroundColor: '#6a4c93', padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setDepth(4302).setInteractive({ useHandCursor: true });
    const close = () => {
      [bg, card, text, claim, double].forEach((o) => o.destroy());
      AudioManager.getInstance().play('jackpot');
      void SaveManager.save();
    };
    claim.on('pointerdown', close);
    double.on('pointerdown', () => {
      void AdManager.showRewarded('offline_double').then(() => QuestManager.getInstance().addProgress('ads_count', 1));
      usePlayerStore.getState().addCoins(report.producedCoins);
      this.floatingText(width / 2, height / 2 - 150, `+${report.producedCoins} gems offerts !`, '#f77f00');
      close();
    });
  }

  private toggleMode(): void {
    this.inCafeMode = !this.inCafeMode;
    this.mergeLayer?.setVisible(!this.inCafeMode);
    this.cafeLayer?.setVisible(this.inCafeMode);
    this.cameras.main.zoomTo(this.inCafeMode ? 1.05 : 1, 200);
  }

  private refreshTopUi(): void {
    const s = usePlayerStore.getState();
    this.energyText?.setText(`⚡ ${s.energy}/${s.energyMax}`);
    if (s.energy >= s.energyMax) {
      this.energyTimerText?.setText('FULL');
    } else {
      const sec = Math.ceil(EnergyManager.getCountdownMs() / 1000);
      const m = Math.floor(sec / 60);
      const ss = `${sec % 60}`.padStart(2, '0');
      this.energyTimerText?.setText(`${m}m ${ss}s`);
    }
    if (this.energyBarFill) this.energyBarFill.width = 216 * (s.energy / s.energyMax);
    if (this.happinessFill) this.happinessFill.width = 276 * (s.happiness / 100);
    if (s.audioSettings.zenMode) { this.eventTimerText?.setVisible(false); this.energyTimerText?.setVisible(false); }
  }

  private floatingText(x: number, y: number, label: string, color = '#e63946'): void {
    const t = this.add.text(x, y, label, { fontFamily: 'Arial Black', fontSize: '34px', color }).setOrigin(0.5).setDepth(5000).setAlpha(0);
    this.tweens.add({
      targets: t,
      y: y - 60,
      alpha: 1,
      scale: { from: 0.8, to: 1.1 },
      duration: 360,
      yoyo: true,
      ease: 'Back.easeOut',
      onComplete: () => t.destroy()
    });
  }


  private showQuestsButton(): void {
    const pending = QuestManager.getInstance().getPendingCount();
    const btn = this.add.text(this.cameras.main.width - 120, 210, `Quêtes ${pending > 0 ? `(${pending})` : ''}`, {
      fontFamily: 'Arial Black',
      fontSize: '24px',
      color: '#fff',
      backgroundColor: '#ff006e',
      padding: { x: 10, y: 6 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    this.tweens.add({ targets: btn, alpha: { from: 1, to: 0.55 }, yoyo: true, repeat: -1, duration: 380 });
    btn.on('pointerdown', () => this.showQuestOverlay());
  }

  private showQuestOverlay(): void {
    const q = usePlayerStore.getState().quests;
    const { width, height } = this.cameras.main;
    const bg = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.45).setDepth(7000);
    const card = this.add.rectangle(width / 2, height / 2, width - 120, height - 260, 0xffffff, 1).setStrokeStyle(4, 0xffafcc).setDepth(7001);
    this.add.text(width / 2, 220, 'Quêtes', { fontFamily: 'Arial Black', fontSize: '44px', color: '#7b2cbf' }).setOrigin(0.5).setDepth(7002);
    q.slice(0, 8).forEach((quest, i) => {
      const y = 300 + i * 74;
      this.add.rectangle(width / 2, y, width - 180, 60, 0xf8f9fa, 1).setDepth(7002).setStrokeStyle(2, 0xdee2e6);
      this.add.text(90, y - 16, `${quest.title} (${quest.progress}/${quest.target})`, { fontFamily: 'Arial', fontSize: '20px', color: '#495057' }).setDepth(7003);
      this.add.rectangle(90, y + 14, 420, 10, 0xffffff).setDepth(7003).setOrigin(0,0.5);
      this.add.rectangle(90, y + 14, 420 * (quest.progress / quest.target), 8, 0xff8fab).setDepth(7004).setOrigin(0,0.5);
      const claim = this.add.text(width - 220, y - 16, quest.completed && !quest.claimed ? 'Claim' : '...', { fontFamily: 'Arial Black', fontSize: '18px', color: '#fff', backgroundColor: '#6a4c93', padding: {x:8,y:4} }).setDepth(7003);
      if (quest.completed && !quest.claimed) claim.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
        if (QuestManager.getInstance().claimQuest(quest.id)) {
          AudioManager.getInstance().play('jackpot');
          this.floatingText(width / 2, y - 40, 'INCROYABLE !', '#f77f00');
          void HapticManager.questComplete();
          this.add.particles(width/2, y, 'logo', { speed: { min: 40, max: 180 }, scale: { start: 0.04, end: 0 }, lifespan: 700, quantity: 20, tint: [0xffd166,0xffffff]}).explode(30);
          this.showQuestOverlay();
          [bg, card].forEach(o=>o.destroy());
        }
      });
    });
    this.add.text(width / 2, height - 160, 'Fermer', { fontFamily: 'Arial Black', fontSize: '30px', color: '#fff', backgroundColor: '#ff758f', padding: {x:14,y:8} }).setDepth(7003).setOrigin(0.5).setInteractive({ useHandCursor: true }).on('pointerdown', () => {
      this.children.list.filter((o) => o.depth >= 7000).forEach((o) => o.destroy());
    });
  }

  private showWelcomeWeekCalendar(): void {
    if (usePlayerStore.getState().welcomeWeekClaimed.length >= 7) return;
    const day = Math.min(7, usePlayerStore.getState().streak || 1);
    const { width } = this.cameras.main;
    this.add.text(width - 120, 260, 'Welcome
Week', {
      fontFamily: 'Arial Black', fontSize: '20px', align: 'center', color: '#fff', backgroundColor: '#3a86ff', padding: { x: 8, y: 8 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).on('pointerdown', () => {
      const reward = WELCOME_WEEK[day - 1];
      if (WelcomeWeekManager.claimDay(day)) {
        this.floatingText(width / 2, 300, `J${day}: ${reward.label}`, '#2a9d8f');
        this.add.particles(width / 2, 340, 'logo', { speed: { min: 20, max: 180 }, scale: { start: 0.04, end: 0 }, lifespan: 650, quantity: 16, tint: [0x00f5d4, 0xffffff]}).explode(22);
      }
    });
  }

  private startFtueSequence(): void {
    const steps = [
      'Bienvenue dans ton café !',
      'Glisse pour fusionner !',
      'Place ton premier meuble dans le café !',
      'Regarde ton café grandir !',
      'Tu as gagné ton premier streak !'
    ];
    let idx = 0;
    const runStep = () => {
      if (idx >= steps.length) {
        FtueManager.completeFtue();
        return;
      }
      const { width, height } = this.cameras.main;
      const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.35).setDepth(8000);
      const card = this.add.rectangle(width / 2, 240, width - 150, 160, 0xffffff, 0.97).setDepth(8001).setStrokeStyle(4, 0xffafcc);
      const text = this.add.text(width / 2, 220, steps[idx], { fontFamily: 'Arial Black', fontSize: '32px', color: '#7b2cbf', align: 'center', wordWrap: { width: width - 220 } }).setOrigin(0.5).setDepth(8002);
      const skip = this.add.text(width - 120, 110, 'Skip FTUE', { fontFamily: 'Arial', fontSize: '18px', color: '#fff', backgroundColor: '#6c757d', padding: { x: 8, y: 4 } }).setDepth(8002).setInteractive({ useHandCursor: true });
      const next = this.add.text(width / 2, 292, 'Continuer', { fontFamily: 'Arial Black', fontSize: '28px', color: '#fff', backgroundColor: '#ff758f', padding: { x: 12, y: 8 } }).setOrigin(0.5).setDepth(8002).setInteractive({ useHandCursor: true });
      this.cameras.main.zoomTo(1.08, 280);
      this.add.particles(width / 2, 340, 'logo', { speed: { min: 30, max: 170 }, scale: { start: 0.04, end: 0 }, lifespan: 500, quantity: 14, tint: [0xffd166, 0xffffff] }).explode(18);
      AudioManager.getInstance().play('ding');
      AudioManager.getInstance().play('yay');
      this.floatingText(width / 2, 370, 'INCROYABLE !', '#ff006e');
      usePlayerStore.getState().addCoins(120);
      usePlayerStore.getState().addGems(4);
      usePlayerStore.getState().addBattlePassXp(30);
      FtueManager.completeStep(idx + 1);
      const close = () => { [overlay, card, text, skip, next].forEach(o => o.destroy()); idx += 1; runStep(); };
      next.on('pointerdown', close);
      skip.on('pointerdown', () => { [overlay, card, text, skip, next].forEach(o => o.destroy()); FtueManager.completeFtue(); });
    };
    runStep();
  }



  private setupHelpNudge(): void {
    this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        if (Date.now() - this.lastActionAt < 30000) return;
        this.lastActionAt = Date.now();
        const { width, height } = this.cameras.main;
        const msg = this.add.text(width / 2, height - 220, 'Besoin d’aide ? Glisse un item pour fusionner ✨', {
          fontFamily: 'Arial Black', fontSize: '24px', color: '#fff', backgroundColor: '#6a4c93', padding: { x: 12, y: 8 }
        }).setOrigin(0.5).setDepth(9000);
        this.tweens.add({ targets: msg, alpha: 0, duration: 2500, onComplete: () => msg.destroy() });
      }
    });
  }



  private maybeShowContextualOffer(): void {
    const s = usePlayerStore.getState();
    if (!s.contextualOffers.enabled || s.contextualOffers.seenThisSession) return;
    if (s.energy <= 0) {
      this.showContextualOffer('energy_0', 'Énergie 0: pub +3 ou pack 0,99€ (-30%)', () => {
        usePlayerStore.getState().registerPurchase('energy_zero_offer', '0,99 €');
        usePlayerStore.getState().addEnergy(3);
      });
      return;
    }
    if (s.happiness >= 95) {
      this.showContextualOffer('happiness_95', 'Skin terrasse légendaire 3,99€ (+20% bonus)', () => {
        usePlayerStore.getState().registerPurchase('terrace_skin_offer', '3,99 €');
        usePlayerStore.getState().addPlaceableItem('coffee-bean-lv2', 1);
      });
      return;
    }
    if (s.streak <= 1 && s.lastLoginDay !== '') {
      this.showContextualOffer('streak_fix', 'Protège ton streak: 1,99€ ou gems', () => {
        usePlayerStore.getState().registerPurchase('streak_shield_offer', '1,99 €');
        usePlayerStore.setState({ streakShieldCount: usePlayerStore.getState().streakShieldCount + 1 });
      });
      return;
    }
  }

  private showContextualOffer(id: string, text: string, onBuy: () => void): void {
    const s = usePlayerStore.getState();
    if (!s.contextualOffers.enabled || s.contextualOffers.seenThisSession) return;
    const { width, height } = this.cameras.main;
    const bg = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.4).setDepth(8800);
    const card = this.add.rectangle(width / 2, height / 2, width - 140, 260, 0xfff7ff, 0.98).setStrokeStyle(4, 0xff4d6d).setDepth(8801);
    const t = this.add.text(width / 2, height / 2 - 48, text, { fontFamily: 'Arial Black', fontSize: '28px', color: '#7b2cbf', align: 'center', wordWrap: { width: width - 220 } }).setOrigin(0.5).setDepth(8802);
    const buy = this.add.text(width / 2, height / 2 + 28, 'Prendre l’offre', { fontFamily: 'Arial Black', fontSize: '28px', color: '#fff', backgroundColor: '#ff006e', padding: { x: 14, y: 8 } }).setOrigin(0.5).setDepth(8802).setInteractive({ useHandCursor: true });
    const close = this.add.text(width / 2, height / 2 + 92, 'Plus tard', { fontFamily: 'Arial Black', fontSize: '24px', color: '#fff', backgroundColor: '#6a4c93', padding: { x: 12, y: 6 } }).setOrigin(0.5).setDepth(8802).setInteractive({ useHandCursor: true });
    const done = () => {
      usePlayerStore.setState({ contextualOffers: { ...usePlayerStore.getState().contextualOffers, seenThisSession: true, totalSeen: usePlayerStore.getState().contextualOffers.totalSeen + 1 } });
      [bg, card, t, buy, close].forEach((o) => o.destroy());
      void SaveManager.save();
    };
    buy.on('pointerdown', () => { onBuy(); done(); this.floatingText(width / 2, height / 2 - 120, '+20% bonus session', '#2a9d8f'); });
    close.on('pointerdown', done);
    void id;
  }

  private setupAutosave(): void {
    this.time.addEvent({
      delay: 30000,
      loop: true,
      callback: () => {
        const t = this.add.text(this.cameras.main.width - 140, 40, 'Sauvegarde...', { fontFamily: 'Arial', fontSize: '18px', color: '#fff', backgroundColor: '#6a4c93', padding: { x: 6, y: 3 } }).setDepth(9999);
        this.time.delayedCall(300, () => t.destroy());
        void SaveManager.forceSaveWithStamp();
      }
    });
  }
}
