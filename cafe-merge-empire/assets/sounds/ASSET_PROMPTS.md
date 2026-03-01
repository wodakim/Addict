# Prompts d'assets - sounds

Objectif: définir le prompt exact pour générer chaque fichier audio requis par le jeu.

## Contraintes techniques communes
- Format: WAV PCM 16-bit, 44.1kHz, mono pour SFX / stéréo pour musiques et ambiances.
- Niveau de sortie cible: -14 LUFS intégré (SFX courts tolérance -12 à -16).
- Aucun clipping, pas de souffle permanent.
- Durées: SFX 0.15s à 2s, ambiances 20s+ loopables, musiques 45s+ loopables.

## Prompts par fichier

### cafe-jazz.wav
"Lo-fi cozy cafe jazz background music, brushed drums, upright bass, soft piano chords, warm analog texture, relaxed tempo 82 BPM, seamless loop, no vocals"

### cafe-jazz-2.wav
"Cozy bossa-jazz cafe background track, light nylon guitar, soft shaker, mellow keys, Sunday afternoon vibe, seamless loop, no vocals"

### cafe-jazz-3.wav
"Night cozy cafe jazz music, gentle piano lead, upright bass, subtle vinyl texture, calm and premium, seamless loop, no vocals"

### whoosh.wav
"Short UI transition whoosh, soft airy sweep, clean high-frequency tail, 0.35 seconds"

### jackpot.wav
"Reward jackpot SFX for mobile game, bright coin burst, magical sparkle, triumphant but soft, 0.9 seconds"

### plop.wav
"Cute plop sound for object placement, rounded watery pop, short and satisfying, 0.2 seconds"

### wood.wav
"Short wooden tap impact, cafe furniture contact, warm resonance, 0.25 seconds"

### fabric.wav
"Soft cloth rustle tap, cushion placement sound, subtle and cozy, 0.25 seconds"

### metal.wav
"Small polished metal click, espresso machine button press style, 0.2 seconds"

### ding.wav
"Clean reward ding bell, bright but gentle, 0.4 seconds"

### yay.wav
"Cute celebratory crowd 'yay' style stinger, short joyful tone cluster, 0.8 seconds"

### level-up.wav
"Mobile game level up SFX, rising arpeggio with soft sparkle finish, motivational and premium, 1.2 seconds"

### energy-refill.wav
"Energy refill sound effect, liquid fill + magical pulse, refreshing and positive, 0.9 seconds"

### steam.wav
"Close-up espresso steam hiss ambience, warm and soft, loopable, 8 seconds"

### rain.wav
"Gentle rain outside cafe window ambience, cozy and distant, loopable, 20 seconds"

### birds.wav
"Morning birds ambience outside street cafe, light and cheerful, loopable, 15 seconds"

### tick.wav
"Soft UI timer tick, subtle wooden click, 0.15 seconds"

### clients-ahhh.wav
"Small satisfied customer reaction 'ahhh', soft and pleasant, crowd texture, 1 second"

### clients-murmur.wav
"Low cafe customer murmur ambience, unintelligible chatter, cozy indoor tone, loopable, 15 seconds"

### clients-mmm.wav
"Short customer appreciation 'mmm' reaction, warm and delicious feeling, 0.7 seconds"

### clients-applause.wav
"Small friendly applause burst from cafe customers, positive and light, 1.3 seconds"

### merge-pop-1.wav
"Merge pop SFX level 1, tiny soft bubble pop, 0.12 seconds"

### merge-pop-2.wav
"Merge pop SFX level 2, slightly brighter bubble pop, 0.12 seconds"

### merge-pop-3.wav
"Merge pop SFX level 3, medium pop with subtle sparkle tail, 0.14 seconds"

### merge-pop-4.wav
"Merge pop SFX level 4, richer pop, satisfying transient, 0.16 seconds"

### merge-pop-5.wav
"Merge pop SFX level 5, premium pop with tiny chime, 0.18 seconds"

### merge-pop-6.wav
"Merge pop SFX level 6, rare merge pop, deeper low-end and sparkle, 0.2 seconds"

### merge-pop-7.wav
"Merge pop SFX level 7, epic merge pop, harmonic bloom, 0.22 seconds"

### merge-pop-8.wav
"Merge pop SFX level 8, legendary merge pop, crystal shimmer finish, 0.25 seconds"

## Negative prompt audio commun
"distortion, clipping, harsh transients, hiss noise, voice speech, copyrighted melody, abrupt loop clicks"
