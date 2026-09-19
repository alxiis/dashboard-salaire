# Salary Pulse

Suivi de salaire en temps réel + hub multi-modules, en **HTML / CSS / JavaScript vanilla** (aucun framework, aucun build).
Direction artistique « menu de jeu » : noir · rouge · blanc · jaune, diagonales, hard shadows, halftone, stickers, transitions en slash.
Inspiration graphique uniquement : aucun asset, texte ou personnage issu d'un jeu existant.

## Structure

```
dashboard-salaire/
├── index.html              redirection vers main-menu/
├── shared/
│   ├── shared.css          design system (tokens, HUD, header, transition, pages module)
│   └── shared.js           window.SP : config, storage, audio, statut, HUD, navigation
├── main-menu/              écran de sélection plein écran
│   ├── index.html · style.css · script.js
│   └── art/figure.svg      illustration originale (remplaçable)
├── dashboard-salary/       moteur salarial + UI
├── calendar/               module (en préparation)
└── gta-countdown/          module (en attente de date)
```

Chaque page module déclare `<body data-sp-page="…">` et un `<header data-sp-header="module">` : le shell
(fond, header, HUD date, transition, touche ESC) est monté par `shared.js`.

## Lancer

```bash
python -m http.server 8000
```
puis http://localhost:8000.

## Navigation

| Touche | Action |
| --- | --- |
| ↑ / ↓ (ou Z·W / S) | module précédent / suivant (cyclique) |
| Entrée / Espace | ouvrir le module sélectionné |
| Échap | retour au menu depuis un module |

Souris (survol + clic), tactile (tap) et clavier partagent le même état : `selectedModuleIndex` (0 Dashboard · 1 Calendrier · 2 GTA 6).

## Moteur salarial

- 7,89 €/h ≈ 0,1315 €/min ; le compteur avance à chaque **minute entière** travaillée.
- Plages 08h30–12h30 et 13h30–16h30, lundi–vendredi, plafond 420 min (55,23 €) par jour.
- Minutes « simulées » (bouton +1 min, démo) ajoutées au réel dans la limite du plafond.
- Constantes centralisées dans `SP.CONFIG` (`shared/shared.js`).

## Persistance

Clé unique `salary_pulse_state_v2` (minutes créditées, minutes simulées, jour, SFX, démo). Lecture validée et bornée,
minutes remises à zéro au changement de jour, écriture protégée (quota / navigation privée).

## Accessibilité & performance

Focus visible, lien d'évitement, `aria-current` / `aria-pressed`, `prefers-reduced-motion` (animations et transitions coupées),
SFX synthétisés (Web Audio) activés seulement après un geste, animations sur `transform` / `opacity`, une seule horloge 1 Hz.
