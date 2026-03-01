import fs from 'node:fs';
import path from 'node:path';

const requiredAssets = [
  'assets/images/ui/logo.png',
  'assets/images/backgrounds/boot-bg.png',
  'assets/images/decorations/plant.png',
  'assets/images/merge-items/coffee-bean-lv1.png',
  'assets/images/merge-items/coffee-bean-lv2.png',
  'assets/sounds/cafe-jazz.wav',
  'assets/sounds/cafe-jazz-2.wav',
  'assets/sounds/cafe-jazz-3.wav',
  'assets/sounds/whoosh.wav',
  'assets/sounds/jackpot.wav',
  'assets/sounds/plop.wav',
  'assets/sounds/wood.wav',
  'assets/sounds/fabric.wav',
  'assets/sounds/metal.wav',
  'assets/sounds/clients-ahhh.wav',
  'assets/sounds/clients-applause.wav',
  'assets/sounds/clients-mmm.wav',
  'assets/sounds/clients-murmur.wav',
  'assets/sounds/ding.wav',
  'assets/sounds/ding-2.wav',
  'assets/sounds/yay.wav',
  'assets/sounds/energy-refill.wav',
  'assets/sounds/level-up.wav',
  'assets/sounds/tick.wav',
  'assets/sounds/steam.wav',
  'assets/sounds/rain.wav',
  'assets/sounds/birds.wav',
  ...Array.from({ length: 8 }, (_, i) => `assets/sounds/merge-pop-${i + 1}.wav`)
];

const missing = requiredAssets.filter((assetPath) => !fs.existsSync(path.resolve(assetPath)));

if (missing.length > 0) {
  console.error('❌ Assets manquants :');
  missing.forEach((assetPath) => console.error(`- ${assetPath}`));
  process.exit(1);
}

console.log('✅ Tous les assets requis sont présents.');
