import Phaser from 'phaser';
import { usePlayerStore } from '@/stores/playerStore';

export class PerformanceManager {
  static isLowEndDevice(): boolean {
    const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
    const cores = navigator.hardwareConcurrency ?? 4;
    return mem <= 3 || cores <= 4;
  }

  static applyRuntimeBudget(scene: Phaser.Scene): void {
    if (!this.isLowEndDevice()) return;
    const s = usePlayerStore.getState();
    usePlayerStore.setState({
      hapticsEnabled: false,
      audioSettings: {
        ...s.audioSettings,
        particlesEnabled: false,
        musicEnabled: false
      }
    });

    scene.time.timeScale = 1;
    scene.game.loop.targetFps = 60;
  }

  static beginFrameProfiler(scene: Phaser.Scene): void {
    let acc = 0;
    let count = 0;
    scene.events.on(Phaser.Scenes.Events.UPDATE, (_t: number, delta: number) => {
      acc += delta;
      count += 1;
      if (count >= 120) {
        const avg = acc / count;
        if (avg > 8) {
          // eslint-disable-next-line no-console
          console.warn(`[PerfBudget] avg update ${avg.toFixed(2)}ms (>8ms)`);
        }
        acc = 0;
        count = 0;
      }
    });
  }
}
