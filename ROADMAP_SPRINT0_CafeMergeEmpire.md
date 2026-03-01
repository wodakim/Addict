# CafeMergeEmpire — Sprint 0/12
## Roadmap complète & découpage en sprints (Aucun code)

## 1) Vision produit & objectifs mesurables

| Axe | Cible | KPI / Validation |
|---|---|---|
| Rétention | Boucles courtes et fréquentes | D1 > 65 %, D7 > 35 % |
| Engagement | Sessions répétées | 8–15 sessions/jour, 45–90 min/jour |
| Progression | Idle + merge + déco | Revenus offline, timers, énergie, quêtes |
| Monétisation | Fair-play agressif | Rewarded ads, IAP packs, pass saisonnier |
| Live-ops | Contenu continu | Événements 3–4 jours + calendrier quotidien |
| Plateforme | Android portrait natif | Build Capacitor 6+ prêt Play Store |

---

## 2) Architecture macro cible (fin de roadmap)

- **Client mobile** : Phaser 3.80+ + TypeScript 5.6+ + Vite 5+
- **Conteneur natif** : Capacitor 6+ (Android, notifications push, AdMob)
- **Audio** : Howler.js
- **State management** : Zustand
- **Sauvegarde** : LocalForage + Capacitor Filesystem (persistante chiffrée)
- **Pipeline de contenu** : scans d’assets/data via scripts (`scan:items`, `scan:levels`, etc.)
- **Gameplay cible** : merge board + meta café 2.5D cosy + idle total + live-ops + social light

---

## 3) Découpage en 12 sprints

### Sprint 1 — Fondations techniques & structure projet

| Élément | Détail |
|---|---|
| **Objectif principal** | Mettre en place un socle propre, exécutable, scalable mobile portrait. |
| **Livrables** | 1) Initialisation projet Phaser + TS + Vite. 2) Intégration Capacitor Android (shell). 3) Architecture dossiers (`src/game`, `src/systems`, `src/meta`, `src/ui`, `assets`, `tools/scanners`). 4) Config lint/format/typecheck/build. 5) Scene de boot minimale + écran placeholder portrait. |
| **Dépendances** | Aucune |
| **Estimation** | 8–12 h |
| **Critères de validation** | Le jeu doit pouvoir démarrer sur web et conteneur Android en portrait, charger une scène Boot et afficher un écran stable à 60 FPS sur device de test. |

### Sprint 2 — Data model, economy core & pipeline de scan

| Élément | Détail |
|---|---|
| **Objectif principal** | Mettre en place la donnée pilotée par fichiers + économie de base versionnable. |
| **Livrables** | 1) Schémas data (items, recettes, générateurs, quêtes, niveaux café). 2) Fichiers sources de contenu (JSON/CSV). 3) Scripts `npm run scan:items`, `scan:levels`, `scan:recipes`, `scan:events` pour générer des manifests validés. 4) Versioning de données + checksum. 5) Table économie v1 (soft/hard currency, énergie, timers, drop rates). |
| **Dépendances** | Sprint 1 |
| **Estimation** | 10–14 h |
| **Critères de validation** | Le jeu doit pouvoir charger les manifests scannés sans erreur, rejeter les données invalides et exposer un catalogue d’items/levels exploitable runtime. |

### Sprint 3 — Core merge loop jouable (MVP fun)

| Élément | Détail |
|---|---|
| **Objectif principal** | Livrer le cœur addictif: drag/drop, merge, spawn, récompense visuelle. |
| **Livrables** | 1) Grille merge (slots, occupancy, collisions). 2) Drag & drop tactile optimisé mobile. 3) Règles de fusion (2->1, chaînes d’évolution). 4) Générateurs d’ingrédients avec cooldown. 5) Feedback juicy (tweens, particules, popups). 6) Objectifs de commande simples. |
| **Dépendances** | Sprints 1–2 |
| **Estimation** | 14–20 h |
| **Critères de validation** | Le jeu doit pouvoir réaliser un cycle complet: générer → fusionner → produire recette de niveau supérieur → valider commande → obtenir récompense. |

### Sprint 4 — Meta café 2.5D cosy & progression d’espace

| Élément | Détail |
|---|---|
| **Objectif principal** | Connecter merge board à la progression visuelle du café personnel. |
| **Livrables** | 1) Scène café 2.5D/isométrique légère. 2) Système d’upgrade zones (sol, murs, comptoir, coin lounge). 3) Placement/déverrouillage meubles & décorations issus du merge. 4) Camera et navigation simple entre board et café. 5) Niveaux d’ambiance visuelle (pastel cosy). |
| **Dépendances** | Sprint 3 |
| **Estimation** | 12–18 h |
| **Critères de validation** | Le jeu doit pouvoir transformer des récompenses merge en améliorations visibles du café, avec progression persistante de l’environnement. |

### Sprint 5 — Énergie, timers, économie de retour & idle offline

| Élément | Détail |
|---|---|
| **Objectif principal** | Mettre en place la boucle de retour fréquente et la progression hors-ligne. |
| **Livrables** | 1) Système énergie (consommation/régénération). 2) Timers de production et d’actions. 3) Simulation offline (calcul delta temps, caps anti-abus). 4) Écran de gains offline au retour. 5) Ajustements économie anti-rupture (sink/source). |
| **Dépendances** | Sprints 2–4 |
| **Estimation** | 10–14 h |
| **Critères de validation** | Le jeu doit pouvoir fermer/réouvrir l’app et créditer correctement la progression offline, tout en pilotant la fréquence de session via énergie/timers. |

### Sprint 6 — Système de quêtes, FTUE et onboarding rétention D1

| Élément | Détail |
|---|---|
| **Objectif principal** | Optimiser l’entrée joueur pour compréhension rapide et attachement précoce. |
| **Livrables** | 1) FTUE pas-à-pas (merge, commande, upgrade, récompense). 2) Quêtes journalières et milestones. 3) UX de guidance (focus, hints, mains animées). 4) Récompenses de progression initiale (7 premiers jours). 5) Copy/UI onboarding orientée rétention. |
| **Dépendances** | Sprints 3–5 |
| **Estimation** | 8–12 h |
| **Critères de validation** | Le jeu doit pouvoir faire compléter les 5 premières actions clés en moins de 3 minutes et donner une roadmap claire des objectifs suivants. |

### Sprint 7 — Audio, haptics, polish UX/juice

| Élément | Détail |
|---|---|
| **Objectif principal** | Ajouter la couche sensorielle premium qui renforce l’addiction positive. |
| **Livrables** | 1) Intégration Howler.js (mixage SFX/BGM). 2) Pack sons ASMR café (versement, cloche, cuisson, fusion). 3) Haptics Android (léger/moyen/fort contextuel). 4) Paramètres audio/vibration. 5) Polish animations UI et transitions. |
| **Dépendances** | Sprints 3–6 |
| **Estimation** | 6–10 h |
| **Critères de validation** | Le jeu doit pouvoir fournir des feedbacks audio/haptiques cohérents sur toutes actions clés sans baisse de performance perceptible. |

### Sprint 8 — Sauvegarde chiffrée robuste & reprise multi-session

| Élément | Détail |
|---|---|
| **Objectif principal** | Garantir la persistance fiable et la récupération d’état sans corruption. |
| **Livrables** | 1) Store global Zustand structuré (slices gameplay/meta/liveops). 2) Persistance LocalForage + Capacitor Filesystem. 3) Chiffrement local des saves + checksum d’intégrité. 4) Migrations de version de sauvegarde. 5) Auto-save intelligent (throttle + checkpoints). |
| **Dépendances** | Sprints 2–7 |
| **Estimation** | 10–14 h |
| **Critères de validation** | Le jeu doit pouvoir reprendre exactement l’état joueur après kill/restart, après changement de version mineure, et détecter/réparer une save invalide. |

### Sprint 9 — Live-ops: événements, calendrier, streaks & notifications

| Élément | Détail |
|---|---|
| **Objectif principal** | Installer la machine de réactivation continue (tous les 3–4 jours). |
| **Livrables** | 1) Framework d’événements temporaires data-driven. 2) Calendrier login rewards + streaks quotidiens. 3) Quêtes d’événement limitées dans le temps. 4) Notifications push locales/planifiées (Capacitor). 5) Outils de configuration simple des rotations live-ops. |
| **Dépendances** | Sprints 2, 5, 6, 8 |
| **Estimation** | 12–16 h |
| **Critères de validation** | Le jeu doit pouvoir lancer/terminer un événement selon planning, maintenir des streaks journaliers, et renotifier les joueurs aux moments clés de retour. |

### Sprint 10 — Social léger: amis, entraide, mini-clans

| Élément | Détail |
|---|---|
| **Objectif principal** | Ajouter des leviers sociaux simples pour améliorer D7 et fréquence de retour. |
| **Livrables** | 1) Système d’amis minimal (codes/invitations locales ou backend léger selon scope). 2) Aide quotidienne (envoi/réception ressources). 3) Mini-clans (groupes limités) avec objectif commun hebdo. 4) UI sociale non intrusive. 5) Garde-fous anti-spam/anti-exploit. |
| **Dépendances** | Sprints 5, 8, 9 |
| **Estimation** | 14–20 h |
| **Critères de validation** | Le jeu doit pouvoir permettre une boucle sociale complète: rejoindre un groupe, contribuer, recevoir aide, récupérer récompenses collectives. |

### Sprint 11 — Monétisation complète: rewarded, IAP, pass saisonnier

| Élément | Détail |
|---|---|
| **Objectif principal** | Déployer les revenus sans casser l’équilibre joueur. |
| **Livrables** | 1) Intégration AdMob rewarded ads (placements: boost timer, énergie, reroll). 2) Catalogues IAP packs (starter, value, event). 3) Battle pass saisonnier (free + premium tracks). 4) Boutiques contextuelles intelligentes (timing/segmentation simple). 5) Règles anti paywall dur et tuning fairness. |
| **Dépendances** | Sprints 5, 6, 8, 9 |
| **Estimation** | 12–18 h |
| **Critères de validation** | Le jeu doit pouvoir exécuter tout le parcours: voir offre -> achat/visionnage -> attribution fiable -> mise à jour immédiate de progression/pass. |

### Sprint 12 — Optimisation perf, QA finale & release Android store-ready

| Élément | Détail |
|---|---|
| **Objectif principal** | Stabiliser, optimiser et livrer une build Android prête publication. |
| **Livrables** | 1) Profiling CPU/GPU/mémoire (mid/low devices). 2) Optimisations assets (atlas, compression, audio streaming). 3) QA checklist complète (crash, save, économie, live-ops, monétisation). 4) Instrumentation analytics clés (funnel FTUE, D1/D7 proxies, ad/IAP events). 5) Build signing, manifest, icônes, conformité Play Store. |
| **Dépendances** | Sprints 1–11 |
| **Estimation** | 14–20 h |
| **Critères de validation** | Le jeu doit pouvoir tourner de manière stable sur panel d’appareils Android ciblés, passer la checklist critique et générer un bundle prêt soumission store. |

---

## 4) Risques & optimisations

### Risques majeurs
1. **Inflation de complexité data-driven** (items/recettes/events).  
2. **Déséquilibre économie** (énergie trop punitive ou trop généreuse).  
3. **Corruption de sauvegarde / migrations fragiles**.  
4. **Performance mobile** (surdraw, allocations, audio spikes).  
5. **Monétisation intrusive** nuisant à la rétention.  
6. **Live-ops coûteux en production de contenu**.

### Optimisations recommandées
1. **Tableurs d’équilibrage + simulateur** dès Sprint 2.  
2. **Feature flags** pour activer/désactiver mécaniques sans release complète.  
3. **Templates d’événements réutilisables** (thèmes + rewards).  
4. **Budget perf fixe** (ms/frame, mémoire max, taille APK/AAB).  
5. **Cadence analytics hebdo** pour réajuster tuning énergie/rewards/offres.  
6. **Automatisation QA smoke** sur flows critiques (merge/save/reward/ads).

---

## 5) Ordre recommandé des sprints

1. Sprint 1 — Fondations techniques  
2. Sprint 2 — Data model & scans  
3. Sprint 3 — Core merge loop  
4. Sprint 4 — Meta café  
5. Sprint 5 — Énergie/timers/idle  
6. Sprint 6 — FTUE & quêtes  
7. Sprint 7 — Audio/haptics/polish  
8. Sprint 8 — Save chiffrée robuste  
9. Sprint 9 — Live-ops + streaks + notifications  
10. Sprint 10 — Social léger  
11. Sprint 11 — Monétisation complète  
12. Sprint 12 — Optimisation + QA + release

**ROADMAP ET SPRINTS VALIDÉS – PRÊT POUR LE SUIVANT**
