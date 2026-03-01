import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload(): void {
    this.load.image('boot-bg', 'assets/images/backgrounds/boot-bg.png');

    const { width, height } = this.cameras.main;
    this.add.rectangle(width / 2, height / 2, width, height, 0xf7ebff, 1);

    const barBg = this.add.rectangle(width / 2, height / 2, 380, 30, 0xffffff, 0.35).setOrigin(0.5);
    const barFill = this.add.rectangle(width / 2 - 184, height / 2, 6, 20, 0xffc8dd).setOrigin(0, 0.5);
    const title = this.add
      .text(width / 2, height / 2 - 78, 'CafeMergeEmpire', {
        fontFamily: 'Arial Black',
        fontSize: '44px',
        color: '#9d4edd'
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: title,
      scale: { from: 0.98, to: 1.05 },
      yoyo: true,
      repeat: -1,
      duration: 800,
      ease: 'Sine.easeInOut'
    });

    this.load.on('progress', (value: number) => {
      barFill.width = Math.max(6, 368 * value);
    });

    this.load.on('complete', () => {
      this.tweens.add({
        targets: [barBg, barFill, title],
        alpha: 0,
        duration: 260,
        onComplete: () => this.scene.start('PreloadScene')
      });
    });
  }
}
