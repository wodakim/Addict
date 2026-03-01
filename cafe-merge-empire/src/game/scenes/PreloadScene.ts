import Phaser from 'phaser';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  preload(): void {
    this.load.image('logo', 'assets/images/ui/logo.png');
    this.load.audio('cafe-jazz', 'assets/sounds/cafe-jazz.wav');
    this.load.audio('whoosh', 'assets/sounds/whoosh.wav');
    this.load.audio('jackpot', 'assets/sounds/jackpot.wav');
    this.load.audio('plop', 'assets/sounds/plop.wav');
    this.load.audio('wood', 'assets/sounds/wood.wav');
    this.load.audio('fabric', 'assets/sounds/fabric.wav');
    this.load.audio('clients-ahhh', 'assets/sounds/clients-ahhh.wav');
    this.load.audio('ding', 'assets/sounds/ding.wav');
    this.load.audio('yay', 'assets/sounds/yay.wav');
    for (let i = 1; i <= 5; i += 1) {
      this.load.audio(`merge-pop-${i}`, `assets/sounds/merge-pop-${i}.wav`);
    }
    this.load.audio('level-up', 'assets/sounds/level-up.wav');
    this.load.audio('energy-refill', 'assets/sounds/energy-refill.wav');
    this.load.audio('merge-pop-6', 'assets/sounds/merge-pop-6.wav');
    this.load.audio('merge-pop-7', 'assets/sounds/merge-pop-7.wav');
    this.load.audio('merge-pop-8', 'assets/sounds/merge-pop-8.wav');
    this.load.audio('metal', 'assets/sounds/metal.wav');
    this.load.audio('clients-murmur', 'assets/sounds/clients-murmur.wav');
    this.load.audio('clients-mmm', 'assets/sounds/clients-mmm.wav');
    this.load.audio('clients-applause', 'assets/sounds/clients-applause.wav');
    this.load.audio('cafe-jazz-2', 'assets/sounds/cafe-jazz-2.wav');
    this.load.audio('cafe-jazz-3', 'assets/sounds/cafe-jazz-3.wav');
    this.load.audio('steam', 'assets/sounds/steam.wav');
    this.load.audio('rain', 'assets/sounds/rain.wav');
    this.load.audio('birds', 'assets/sounds/birds.wav');
    this.load.audio('tick', 'assets/sounds/tick.wav');

  }

  create(): void {
    this.scene.start('MainMenuScene');
  }
}
