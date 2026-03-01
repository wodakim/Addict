import { Howl } from 'howler';
import { SaveManager } from '@/game/managers/SaveManager';
import { usePlayerStore } from '@/stores/playerStore';

type AudioCategory = 'merge' | 'placement' | 'clients' | 'ui' | 'ambience' | 'events';

const TRACKS: Record<AudioCategory, string[]> = {
  merge: ['merge-pop-1', 'merge-pop-2', 'merge-pop-3', 'merge-pop-4', 'merge-pop-5', 'merge-pop-6', 'merge-pop-7', 'merge-pop-8'],
  placement: ['wood', 'fabric', 'metal', 'plop'],
  clients: ['clients-ahhh', 'clients-murmur', 'clients-mmm', 'clients-applause'],
  ui: ['whoosh', 'ding', 'ding-2', 'jackpot'],
  ambience: ['cafe-jazz', 'cafe-jazz-2', 'cafe-jazz-3', 'steam', 'rain', 'birds'],
  events: ['tick', 'energy-refill']
};

export class AudioManager {
  private static instance: AudioManager;
  private sounds = new Map<string, Howl>();
  private currentMusic?: string;

  static getInstance(): AudioManager {
    if (!this.instance) this.instance = new AudioManager();
    return this.instance;
  }

  preload(): void {
    Object.values(TRACKS).flat().forEach((key) => {
      if (this.sounds.has(key)) return;
      this.sounds.set(key, new Howl({ src: [`assets/sounds/${key}.wav`], preload: false, volume: 1 }));
    });
  }

  play(key: string, volumeScale = 1): void {
    const s = this.sounds.get(key);
    if (!s) return;
    const settings = usePlayerStore.getState().audioSettings;
    s.volume(settings.master * settings.sfx * volumeScale);
    s.play();
  }

  playMerge(level: number): void {
    const idx = Math.max(1, Math.min(8, level));
    this.play(`merge-pop-${idx}`);
  }

  playPlacement(kind: 'wood' | 'fabric' | 'metal' | 'plop'): void {
    this.play(kind);
  }

  startAmbience(key = 'cafe-jazz'): void {
    const settings = usePlayerStore.getState().audioSettings;
    if (!settings.musicEnabled) return;
    if (this.currentMusic === key) return;
    const next = this.sounds.get(key);
    if (!next) return;
    if (this.currentMusic) {
      const prev = this.sounds.get(this.currentMusic);
      prev?.fade(prev.volume(), 0, 350);
      setTimeout(() => prev?.stop(), 360);
    }
    next.volume(settings.master * settings.music * 0.6);
    next.loop(true);
    next.play();
    this.currentMusic = key;
  }

  async updateSettings(settings: { master: number; sfx: number; music: number; voice: number; musicEnabled: boolean }): Promise<void> {
    usePlayerStore.setState({ audioSettings: settings });
    if (!settings.musicEnabled && this.currentMusic) {
      this.sounds.get(this.currentMusic)?.stop();
    }
    await SaveManager.save();
  }
}
