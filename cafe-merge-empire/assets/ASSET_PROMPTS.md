# Asset prompts - CafeMergeEmpire (global guide)

Ce document fixe les contraintes globales pour tous les prompts d'assets visuels/audio du projet.

## Direction artistique commune
- Style: mobile game 2.5D cosy, lisible en portrait, couleurs pastel premium.
- Univers: café chaleureux, matin lumineux, matériaux bois clair, laiton doux, céramique, vapeur subtile.
- Niveau de détail: medium-high, formes simples et silhouettes lisibles sur petit écran.
- Lumière: soft global illumination, ombres diffuses, aucun contraste agressif.

## Contraintes techniques image (pour tous les assets visuels)
- Format final: PNG 32-bit avec fond transparent.
- Résolution source recommandée: 1024x1024 (ou 2048x2048 pour key art), puis déclinaison en 512x512 et 256x256.
- Cadrage: sujet centré, marges de sécurité 8-12% pour éviter le clipping UI.
- Lisibilité: contour/valeur tonale suffisante pour distinguer l'asset sur fond clair et sombre.
- Interdits: texte intégré, watermark, logo tiers, artefacts JPEG, bruit excessif.

## Négative prompt global recommandé
"blurry, low resolution, noisy, overexposed, underexposed, hard shadows, photorealistic human faces, text, watermark, logo, compression artifacts, deformed geometry, inconsistent perspective"

## Convention de nommage
- Garder exactement les IDs existants dans les JSON d'assets.
- Utiliser kebab-case.

## Pipeline recommandé
1. Générer un master PNG par asset avec le prompt du dossier cible.
2. Vérifier la cohérence visuelle en grille (valeurs, saturation, échelle perçue).
3. Exporter en tailles runtime (512 puis 256).
4. Lancer le scanner d'assets pour mise à jour atlas/data.
