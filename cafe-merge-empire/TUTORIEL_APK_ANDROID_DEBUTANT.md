# Tutoriel complet (débutant) : transformer CafeMergeEmpire en APK Android utilisable

Ce guide part de **zéro connaissance** et te mène jusqu'à un **APK/AAB installable**.

## 1) Ce qu'il faut installer

### Windows
1. **Node.js LTS** (18+ recommandé)
2. **Git**
3. **Android Studio** (avec Android SDK, Platform Tools, Build Tools)
4. **Java JDK 17** (souvent inclus via Android Studio)

### Vérifier dans un terminal
```bash
node -v
npm -v
git --version
```

---

## 2) Récupérer le projet

```bash
git clone <URL_DU_REPO>
cd Addict/cafe-merge-empire
```

---

## 3) Préparer les assets (étape obligatoire)

Le repo ne contient plus les binaires image/son. Tu dois les fournir avant de lancer le jeu.

### Où mettre les fichiers
- Images:
  - `assets/images/ui/logo.png`
  - `assets/images/backgrounds/boot-bg.png`
  - `assets/images/decorations/plant.png`
  - `assets/images/merge-items/coffee-bean-lv1.png`
  - `assets/images/merge-items/coffee-bean-lv2.png`
- Sons `.wav` dans `assets/sounds/`:
  - `cafe-jazz.wav`, `cafe-jazz-2.wav`, `cafe-jazz-3.wav`
  - `whoosh.wav`, `jackpot.wav`, `ding.wav`, `ding-2.wav`, `yay.wav`
  - `plop.wav`, `wood.wav`, `fabric.wav`, `metal.wav`
  - `clients-ahhh.wav`, `clients-applause.wav`, `clients-mmm.wav`, `clients-murmur.wav`
  - `energy-refill.wav`, `level-up.wav`, `tick.wav`, `steam.wav`, `rain.wav`, `birds.wav`
  - `merge-pop-1.wav` à `merge-pop-8.wav`

### Vérifier que tout est bien présent
```bash
npm run check:assets
```

---

## 4) Installer les dépendances

```bash
npm install
```

---

## 5) Générer les données runtime depuis les JSON

```bash
npm run scan:all
```

Cette commande lit les JSON (`assets/events`, `assets/levels`, `assets/quests`, metadata items) et met à jour:
- `src/game/data/*.ts`
- `assets/atlases/*.atlas.json`

---

## 6) Lancer le jeu en local (web)

```bash
npm run dev
```

Ouvre l'URL affichée (souvent `http://localhost:5173`).

---

## 7) Préparer Android (Capacitor)

### Première fois uniquement
```bash
npx cap add android
```

### À chaque changement web
```bash
npm run build
npx cap sync android
```

### Ouvrir dans Android Studio
```bash
npx cap open android
```

---

## 8) Générer un APK debug (test rapide)

Dans Android Studio:
- Build > Build Bundle(s) / APK(s) > Build APK(s)
- récupérer le fichier APK généré

Ou en CLI depuis `android/`:
```bash
./gradlew assembleDebug
```

---

## 9) Générer une release signée (Play Store)

### 9.1 Créer un keystore (une seule fois)
```bash
keytool -genkey -v -keystore cafe-merge-empire.keystore -alias cafe-merge -keyalg RSA -keysize 2048 -validity 10000
```

### 9.2 Configurer la signature dans Android Studio/Gradle
- Renseigner chemin keystore, alias, mot de passe

### 9.3 Générer l'AAB (Play Store)
- Build > Generate Signed Bundle / APK
- Choisir **Android App Bundle (AAB)**

---

## 10) Checklist avant publication

1. `npm run check:assets`
2. `npm run scan:all`
3. `npm run build`
4. `npm run simulate-event -- rush-matin`
5. `npm run simulate-help`
6. `npm run simulate-clan-reward`
7. `npm run simulate-iap`
8. `npm run simulate-rewarded`

Puis test manuel sur mobile réel:
- ouverture/fermeture app
- save/load
- social
- live-ops
- quêtes
- shop / battle pass

---

## 11) Où et quand faire les assets ?

### Quand
- **Avant tout test jouable** (`npm run dev`) → au minimum les assets obligatoires listés section 3.
- **Avant build Android** → tous les assets finaux optimisés (compression PNG + WAV propres).

### Où
- Dans `assets/images/...` et `assets/sounds/...` exactement avec les noms attendus.
- Les données gameplay restent en JSON dans:
  - `assets/events/`
  - `assets/levels/`
  - `assets/quests/`
  - `assets/images/merge-items/*.json`

---

## 12) Commandes finales utiles

```bash
npm run check:assets
npm run scan:all
npm run dev
npm run build
npm run build-android
```

Si `npm run build-android` échoue, fais le flow manuel:
```bash
npm run build
npx cap sync android
npx cap open android
```
