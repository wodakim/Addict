# Tutoriel complet (débutant) : de zéro à un APK Android utilisable

Ce guide te prend **étape par étape** pour lancer le jeu, ajouter les assets, tester sur mobile, puis générer un APK/AAB.

---

## 0) Ce qu’il faut savoir avant de commencer

Le code du jeu est prêt, **mais les assets binaires (images/sons)** ont été retirés du dépôt.

👉 Tu dois d’abord fournir les assets listés dans `ASSETS_A_FOURNIR_CHECKLIST.md`.

---

## 1) Installer les outils nécessaires

## Windows / macOS / Linux

1. **Node.js 22 LTS**
   - Installe depuis : https://nodejs.org/
   - Vérifie :
     - `node -v`
     - `npm -v`

2. **Git**
   - Installe depuis : https://git-scm.com/
   - Vérifie : `git --version`

3. **Java JDK 17** (obligatoire Android)
   - Vérifie : `java -version`

4. **Android Studio**
   - Installer Android SDK + Platform Tools + Build Tools
   - Installe au moins une image d’émulateur Android (API 30+ recommandé)

5. Variables d’environnement (important)
   - `ANDROID_HOME` ou `ANDROID_SDK_ROOT`
   - Ajoute `platform-tools` au PATH (pour `adb`)

---

## 2) Récupérer et préparer le projet

Depuis un terminal :

```bash
git clone <TON_REPO_URL>
cd Addict/cafe-merge-empire
npm install
```

Si `npm install` échoue (proxy/réseau), corrige d’abord ton accès npm.

---

## 3) Ajouter les assets (étape obligatoire)

Lis **`ASSETS_A_FOURNIR_CHECKLIST.md`** et place tous les fichiers aux emplacements exacts.

Arborescence clé :

- `assets/images/ui/`
- `assets/images/backgrounds/`
- `assets/images/decorations/`
- `assets/images/merge-items/`
- `assets/sounds/`

Ensuite, génère les manifests/data :

```bash
npm run scan:all
```

Tu dois voir un résumé avec `Items scanned`, `Levels scanned`, `Events scanned`, `Quests scanned`.

---

## 4) Lancer le jeu en local (web)

```bash
npm run dev
```

Ouvre l’URL affichée (souvent `http://localhost:5173`).

Checklist rapide :
- Boot / preload OK
- Menu principal visible
- GameScene charge
- Aucun asset manquant en console

---

## 5) Build web de production

```bash
npm run build
```

Le dossier `dist/` doit être généré.

---

## 6) Initialiser Android avec Capacitor

La première fois :

```bash
npx cap add android
```

Puis à chaque update web :

```bash
npx cap sync android
```

Ouvrir Android Studio :

```bash
npx cap open android
```

---

## 7) Tester sur téléphone Android réel

1. Active le mode développeur + USB debugging sur ton téléphone
2. Branche en USB
3. Vérifie :

```bash
adb devices
```

4. Lance depuis Android Studio (Run)

---

## 8) Générer un APK debug (test rapide)

Dans Android Studio :
- Build > Build Bundle(s) / APK(s) > Build APK(s)

APK de debug utilisable pour test local.

---

## 9) Générer un build signé (release)

### 9.1 Créer un keystore (une seule fois)

Exemple :

```bash
keytool -genkeypair -v -keystore cafe-merge-empire-release.jks -keyalg RSA -keysize 2048 -validity 10000 -alias cafe_merge_empire
```

Garde ce fichier + mots de passe en sécurité.

### 9.2 Configurer signing dans Android Studio

- Build > Generate Signed Bundle / APK
- Choisir **Android App Bundle (AAB)** pour Play Store
- Renseigner keystore / alias / passwords

Résultat recommandé : `.aab`

---

## 10) Préparer la publication Play Store

Tu devras fournir :

- Icône 512x512
- Feature graphic 1024x500
- 4 à 8 screenshots (phone)
- Description courte + longue
- Catégorie / contenu / politique confidentialité
- AAB signé

---

## 11) Quand créer/ajouter les assets exactement ?

Ordre recommandé :

1. **Avant `npm run dev`** : fournir au minimum logo + sons essentiels + 2 items merge
2. **Avant `npm run build`** : compléter tous les assets référencés
3. **Avant Android release** : remplacer les placeholders par assets finaux optimisés

---

## 12) Commandes utiles (résumé)

```bash
npm install
npm run scan:all
npm run dev
npm run build
npx cap sync android
npx cap open android
npm run build-android
```

Debug simulation :

```bash
npm run simulate-event -- rush-matin
npm run simulate-help
npm run simulate-clan-reward
npm run simulate-iap
npm run simulate-rewarded
```

---

## 13) Problèmes fréquents

- **`vite: not found`** : relancer `npm install`
- **Assets manquants** : vérifier les chemins exacts + lancer `npm run scan:all`
- **`adb` introuvable** : PATH Android SDK mal configuré
- **Build Android échoue** : vérifier JDK 17 + SDK Android + Gradle sync

---

## 14) Objectif final

Quand tout est en place :
- le jeu tourne en local,
- tourne sur téléphone,
- build APK/AAB signé,
- prêt à soumission Play Store.

