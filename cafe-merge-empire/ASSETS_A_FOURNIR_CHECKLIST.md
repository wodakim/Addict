# Checklist complète des assets à fournir

## Images PNG

- `assets/images/ui/logo.png`
- `assets/images/backgrounds/boot-bg.png`
- `assets/images/decorations/plant.png`
- `assets/images/merge-items/coffee-bean-lv1.png`
- `assets/images/merge-items/coffee-bean-lv2.png`

## Sons WAV

### UI / Reward
- `assets/sounds/whoosh.wav`
- `assets/sounds/ding.wav`
- `assets/sounds/ding-2.wav`
- `assets/sounds/jackpot.wav`
- `assets/sounds/yay.wav`

### Merge
- `assets/sounds/merge-pop-1.wav`
- `assets/sounds/merge-pop-2.wav`
- `assets/sounds/merge-pop-3.wav`
- `assets/sounds/merge-pop-4.wav`
- `assets/sounds/merge-pop-5.wav`
- `assets/sounds/merge-pop-6.wav`
- `assets/sounds/merge-pop-7.wav`
- `assets/sounds/merge-pop-8.wav`

### Placement / objets
- `assets/sounds/plop.wav`
- `assets/sounds/wood.wav`
- `assets/sounds/fabric.wav`
- `assets/sounds/metal.wav`

### Clients
- `assets/sounds/clients-ahhh.wav`
- `assets/sounds/clients-murmur.wav`
- `assets/sounds/clients-mmm.wav`
- `assets/sounds/clients-applause.wav`

### Ambiance
- `assets/sounds/cafe-jazz.wav`
- `assets/sounds/cafe-jazz-2.wav`
- `assets/sounds/cafe-jazz-3.wav`
- `assets/sounds/steam.wav`
- `assets/sounds/rain.wav`
- `assets/sounds/birds.wav`

### Events / énergie
- `assets/sounds/tick.wav`
- `assets/sounds/energy-refill.wav`
- `assets/sounds/level-up.wav`

## Données JSON (déjà présentes mais à maintenir)

- `assets/images/merge-items/*.json`
- `assets/events/*.json`
- `assets/levels/*.json`
- `assets/quests/*.json`

## Après ajout des assets

Lancer :

```bash
npm run scan:all
```

Puis :

```bash
npm run dev
```

