import Phaser from 'phaser';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { SaveManager } from '@/game/managers/SaveManager';
import { usePlayerStore } from '@/stores/playerStore';

export class SettingsScene extends Phaser.Scene {
  constructor() {
    super('SettingsScene');
  }

  create(): void {
    const { width, height } = this.cameras.main;
    const s = usePlayerStore.getState();
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.5);
    this.add.rectangle(width / 2, height / 2, width - 120, height - 240, 0xffffff, 0.98).setStrokeStyle(4, 0x9d4edd);
    this.add.text(width / 2, 220, 'Settings', { fontFamily: 'Arial Black', fontSize: '48px', color: '#5a189a' }).setOrigin(0.5);

    const rows = [
      ['Master', 'master'],
      ['SFX', 'sfx'],
      ['Music', 'music'],
      ['Voice', 'voice']
    ] as const;

    rows.forEach(([label, key], i) => {
      const y = 320 + i * 90;
      this.add.text(180, y - 18, label, { fontFamily: 'Arial Black', fontSize: '26px', color: '#6d597a' });
      const value = this.add.text(740, y - 18, `${Math.round(s.audioSettings[key] * 100)}%`, { fontFamily: 'Arial Black', fontSize: '26px', color: '#e63946' });
      const plus = this.add.text(840, y - 18, '+', { fontFamily: 'Arial Black', fontSize: '36px', color: '#fff', backgroundColor: '#6a4c93', padding: { x: 8, y: 2 } }).setInteractive({ useHandCursor: true });
      const minus = this.add.text(780, y - 18, '-', { fontFamily: 'Arial Black', fontSize: '36px', color: '#fff', backgroundColor: '#6a4c93', padding: { x: 8, y: 2 } }).setInteractive({ useHandCursor: true });

      plus.on('pointerdown', () => this.bump(key, 0.1, value));
      minus.on('pointerdown', () => this.bump(key, -0.1, value));
    });

    this.addToggle('Haptics', 710, () => {
      usePlayerStore.setState({ hapticsEnabled: !usePlayerStore.getState().hapticsEnabled });
      void SaveManager.save();
      this.scene.restart();
    }, usePlayerStore.getState().hapticsEnabled);
    this.addToggle('Particles', 790, () => {
      usePlayerStore.setState({ audioSettings: { ...usePlayerStore.getState().audioSettings, particlesEnabled: !usePlayerStore.getState().audioSettings.particlesEnabled } });
      void SaveManager.save();
      this.scene.restart();
    }, usePlayerStore.getState().audioSettings.particlesEnabled);
    this.addToggle('Music', 870, () => {
      usePlayerStore.setState({ audioSettings: { ...usePlayerStore.getState().audioSettings, musicEnabled: !usePlayerStore.getState().audioSettings.musicEnabled } });
      void SaveManager.save();
      this.scene.restart();
    }, usePlayerStore.getState().audioSettings.musicEnabled);
    this.addToggle('Mode Zen', 950, () => {
      usePlayerStore.setState({ audioSettings: { ...usePlayerStore.getState().audioSettings, zenMode: !usePlayerStore.getState().audioSettings.zenMode } });
      void SaveManager.save();
      this.scene.restart();
    }, usePlayerStore.getState().audioSettings.zenMode);
    this.addToggle('Offres contextuelles', 1030, () => {
      usePlayerStore.setState({ contextualOffers: { ...usePlayerStore.getState().contextualOffers, enabled: !usePlayerStore.getState().contextualOffers.enabled } });
      void SaveManager.save();
      this.scene.restart();
    }, usePlayerStore.getState().contextualOffers.enabled);

    this.addToggle('Social', 1110, () => {
      usePlayerStore.setState({ social: { ...usePlayerStore.getState().social, socialEnabled: !usePlayerStore.getState().social.socialEnabled } });
      void SaveManager.save();
      this.scene.restart();
    }, usePlayerStore.getState().social.socialEnabled);

    this.add.text(width / 2 - 170, height - 190, 'Exporter sauvegarde', {
      fontFamily: 'Arial Black', fontSize: '24px', color: '#fff', backgroundColor: '#3a86ff', padding: { x: 12, y: 8 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).on('pointerdown', async () => {
      const data = JSON.stringify(usePlayerStore.getState());
      await Filesystem.writeFile({ path: 'cafe-merge-empire-export.json', data, directory: Directory.Documents, encoding: Encoding.UTF8 }).catch(() => undefined);
    });

    this.add.text(width / 2 + 170, height - 190, 'Importer sauvegarde', {
      fontFamily: 'Arial Black', fontSize: '24px', color: '#fff', backgroundColor: '#ff006e', padding: { x: 12, y: 8 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).on('pointerdown', async () => {
      const file = await Filesystem.readFile({ path: 'cafe-merge-empire-export.json', directory: Directory.Documents, encoding: Encoding.UTF8 }).catch(() => null);
      if (!file?.data) return;
      usePlayerStore.setState(JSON.parse(file.data as string));
      await SaveManager.getInstance().saveGame();
      this.scene.restart();
    });

    this.add.text(width / 2, height - 120, 'Fermer', {
      fontFamily: 'Arial Black', fontSize: '34px', color: '#fff', backgroundColor: '#ff758f', padding: { x: 18, y: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).on('pointerdown', () => this.scene.stop());
  }

  private bump(key: 'master' | 'sfx' | 'music' | 'voice', delta: number, label: Phaser.GameObjects.Text): void {
    const current = usePlayerStore.getState().audioSettings;
    const next = Math.max(0, Math.min(1, current[key] + delta));
    usePlayerStore.setState({ audioSettings: { ...current, [key]: next } });
    label.setText(`${Math.round(next * 100)}%`);
    void SaveManager.save();
  }

  private addToggle(name: string, y: number, onClick: () => void, on: boolean): void {
    this.add.text(180, y - 16, name, { fontFamily: 'Arial Black', fontSize: '24px', color: '#6d597a' });
    this.add.text(780, y - 16, on ? 'ON' : 'OFF', { fontFamily: 'Arial Black', fontSize: '24px', color: '#fff', backgroundColor: on ? '#2a9d8f' : '#6c757d', padding: { x: 10, y: 6 } })
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', onClick);
  }
}
