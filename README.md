# Salary Pulse

Suivi de salaire en temps réel + hub multi-modules, en **HTML / CSS / JavaScript vanilla** (aucun framework, aucun build).
Direction artistique « menu de jeu » : noir · rouge · blanc, dalles découpées (`clip-path`), lettres « anonymes », halftone, hard shadows, glitch, transitions en slash.
Inspiration graphique uniquement : aucun asset, texte ou personnage issu d'un jeu existant.

## Structure

```
dashboard-salaire/
├── index.html              redirection vers main-menu/
├── .nojekyll               GitHub Pages sans Jekyll
├── shared/
│   ├── shared.css          design system (tokens, HUD, header, transition, dalles, barres HP)
│   ├── shared.js           window.SP : config, storage, audio, statut, HUD, navigation
│   ├── scheduleConfig.js   ← planning, salaire, horaires, jours d'école (À MODIFIER ICI)
│   └── schedule-engine.js  window.Schedule : types de jour, taux journalier, progression
├── main-menu/              écran de sélection plein écran (art/figure.svg remplaçable)
├── dashboard-salary/       script.js (moteur) · salary-ui.js (affichage) · style.css
├── calendar/               calendar-engine.js (pur) · calendar-ui.js · calendar.css
├── gta-countdown/          config.js (date de sortie) · countdown-engine.js · gta-ui.js · gta.css
└── sites/                  sites-config.js (liste des sites) · sites-ui.js · sites.css
```

Chaque page module déclare `<body data-sp-page="…">` et un `<header data-sp-header="module">` : le shell
(fond, header, HUD date, transition, touche ESC) est monté par `shared.js`. Les pages chargent
`scheduleConfig.js` puis `schedule-engine.js` avant `shared.js`.

## Déploiement (GitHub Pages)

Pages sert les fichiers avec `Cache-Control: max-age=600`. Tous les scripts et feuilles de style portent donc un `?v=VERSION`
(dans chaque `index.html`) : **changer cette version à chaque mise en ligne** pour qu'aucun navigateur ne mélange d'anciens et de nouveaux fichiers.
En cas d'affichage incomplet (« -- », « undefined »), recharger avec Ctrl+F5.

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

Souris, tactile et clavier partagent le même état : `selectedModuleIndex` (0 Dashboard · 1 Calendrier · 2 GTA 6 · 3 Mes sites).

## Planning et calcul du salaire

Tout se règle dans **`shared/scheduleConfig.js`** ; les calculs sont dans `shared/schedule-engine.js`.

- **Salaire** : `MONTHLY_NET` (1 170 €) réparti sur les **jours payés** du mois → `taux journalier = 1 170 / nombre de jours payés`.
- **Jours payés** : `PAID_DAY_TYPES` (par défaut entreprise, école et fériés ; **jamais le week-end**). Retirer `'school'` pour geler le salaire les jours d'école.
- **Horaires** : `WORK_HOURS` (08:30 → 16:30). Le compteur monte à la **minute entière** pendant ces heures.
- **Week-end / jour non payé** : cumul figé, bandeau « ACQUISITION EN PAUSE ».
- **Premier mois** (`PRORATE_FIRST_MONTH`) : taux calculé sur le mois complet, seuls les jours à partir du 14/09/2026 comptent (septembre 2026 ≈ 691 €).
- **Jours d'école** : 71 jours (24/09/2026 → 15/09/2027), extraits du planning ASRS 2026-2027 et listés par mois.
- Tous les autres jours de semaine sont des **jours d'entreprise** (SAS NOOUS).

## Calendrier et GTA 6

- **Calendrier** : vues **Mois** et **Année** (bascule en haut), jours colorés par type (entreprise = rouge, école = noir hachuré, week-end / férié = blanc cassé / hachuré), trois barres de progression (entreprise, école, alternance totale), navigation ‹ › / PageUp-PageDown / flèches, jour actuel monumental, intro « changement de jour » (ignorée avec `prefers-reduced-motion`).
- **GTA 6** : compte à rebours vers `RELEASE_DATE`. **Pour changer la date, modifier uniquement `gta-countdown/config.js`** (19 novembre 2026, sortie France). Flash rouge et tremblement à chaque seconde (coupés en reduced-motion).

## Mes sites

Le module « MES SITES » liste les autres sites (portfolio, suivi d'alternance…). **Pour en ajouter un, copier un bloc dans `sites/sites-config.js`** (titre, url, description, tags) : aucun autre fichier à modifier. Les liens s'ouvrent dans un nouvel onglet.

## Persistance

Clé unique `salary_pulse_state_v2` (minutes du jour, minutes simulées, jour, SFX, démo). Lecture validée et bornée,
remise à zéro au changement de jour, écriture protégée (quota / navigation privée).

## Accessibilité & performance

Focus visible, lien d'évitement, `aria-current` / `aria-pressed`, `prefers-reduced-motion`, SFX synthétisés (Web Audio)
activés seulement après un geste, animations sur `transform` / `opacity`, une seule horloge 1 Hz.
