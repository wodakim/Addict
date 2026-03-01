# Prompts d'assets - atlases

Ce dossier contient des manifestes atlas générés automatiquement.

## Règle importante
Les fichiers `.atlas.json` ne décrivent pas directement un style visuel: ils packent les assets produits depuis les autres dossiers (`events`, `quests`, `levels`, `images/merge-items`).

## Correspondance exacte des frames
- `events.atlas.json`
  - `festival-chocolat-chaud` -> prompt dans `assets/events/ASSET_PROMPTS.md`
  - `morning-rush` -> prompt dans `assets/events/ASSET_PROMPTS.md`
  - `weekend-latte-art` -> prompt dans `assets/events/ASSET_PROMPTS.md`
  - `event-welcome` -> prompt dans `assets/events/ASSET_PROMPTS.md`

- `levels.atlas.json`
  - `level-001` -> prompt dans `assets/levels/ASSET_PROMPTS.md`

- `merge-items.atlas.json`
  - `coffee-bean-lv1` -> prompt dans `assets/images/merge-items/ASSET_PROMPTS.md`
  - `coffee-bean-lv2` -> prompt dans `assets/images/merge-items/ASSET_PROMPTS.md`

- `quests.atlas.json`
  - `daily-merge-15` -> prompt dans `assets/quests/ASSET_PROMPTS.md`
  - `daily-place-3` -> prompt dans `assets/quests/ASSET_PROMPTS.md`
  - `daily-watch-2-ads` -> prompt dans `assets/quests/ASSET_PROMPTS.md`
  - `daily-500-coins` -> prompt dans `assets/quests/ASSET_PROMPTS.md`
  - `ms-merge-100` -> prompt dans `assets/quests/ASSET_PROMPTS.md`
  - `ms-terrace-50` -> prompt dans `assets/quests/ASSET_PROMPTS.md`

## Process de régénération
1. Générer les PNG via prompts des dossiers source.
2. Injecter les nouveaux fichiers avec IDs identiques.
3. Relancer le scanner atlas.
