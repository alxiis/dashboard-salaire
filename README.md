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
├── main-menu/              écran de sélection plein écran (art/figure.svg : personnage maison, pose « le vent », remplaçable)
├── dashboard-salary/       script.js (moteur) · salary-ui.js (affichage) · style.css
├── calendar/               calendar-engine.js (pur) · calendar-ui.js · calendar.css
├── gta-countdown/          config.js (date de sortie) · countdown-engine.js · gta-ui.js · gta.css
├── sites/                  sites-config.js (liste des sites) · sites-ui.js · sites.css
└── rncp/                   rncp-data.js (référentiel, fixe) · rncp-progress.js (suivi, chaque semaine) · rncp-ui.js · rncp.css
```

Chaque page module déclare `<body data-sp-page="…">` et un `<header data-sp-header="module">` : le shell
(fond, header, HUD date, transition, touche ESC) est monté par `shared.js`. Les pages chargent
`scheduleConfig.js` puis `schedule-engine.js` avant `shared.js`.

## Déploiement (GitHub Pages)

Pages sert les fichiers avec `Cache-Control: max-age=600`. Tous les scripts et feuilles de style portent donc un `?v=VERSION`
(dans chaque `index.html`, version actuelle `20261116b`) : **changer cette version à chaque mise en ligne** pour qu'aucun navigateur ne mélange d'anciens et de nouveaux fichiers.
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

Souris, tactile et clavier partagent le même état : `selectedModuleIndex` (0 Dashboard · 1 Calendrier · 2 GTA 6 · 3 Mes sites · 4 Grille RNCP).

## Planning et calcul du salaire

Tout se règle dans **`shared/scheduleConfig.js`** ; les calculs sont dans `shared/schedule-engine.js`.

- **Salaire** : `MONTHLY_NET` (1 130 €) réparti sur les **jours payés** du mois → `taux journalier = 1 130 / nombre de jours payés`.
- **Jours payés** : `PAID_DAY_TYPES` (par défaut entreprise, école et fériés ; **jamais le week-end**). Retirer `'school'` pour geler le salaire les jours d'école.
- **Horaires** : `WORK_HOURS` (08:30 → 16:30). Le compteur monte à la **minute entière** pendant ces heures.
- **Montants réels** : `ACTUAL_MONTHLY_NET` (ex. septembre 2026 = 712,44 €) remplace le calcul pour un mois déjà payé ; le taux journalier de ce mois devient montant réel ÷ jours payés.
- **Week-end / jour non payé** : cumul figé, bandeau « ACQUISITION EN PAUSE ».
- **Premier mois** (`PRORATE_FIRST_MONTH`) : taux calculé sur le mois complet, seuls les jours à partir du 14/09/2026 comptent (septembre 2026 ≈ 691 €).
- **Jours d'école** : 71 jours (24/09/2026 → 15/09/2027), extraits du planning ASRS 2026-2027 et listés par mois.
- Tous les autres jours de semaine sont des **jours d'entreprise** (SAS NOOUS).

## Calendrier et GTA 6

- **Calendrier** : vues **Mois** et **Année** (bascule en haut), jours colorés par type (entreprise = rouge, école = noir hachuré, week-end / férié = blanc cassé / hachuré), trois barres de progression (entreprise, école, alternance totale), navigation ‹ › / PageUp-PageDown / flèches, jour actuel monumental, intro « changement de jour » (ignorée avec `prefers-reduced-motion`).
- **GTA 6** : compte à rebours vers `RELEASE_DATE`. **Pour changer la date, modifier uniquement `gta-countdown/config.js`** (19 novembre 2026, sortie France). Flash rouge et tremblement à chaque seconde (coupés en reduced-motion).

## Mes sites

Le module « MES SITES » liste les autres sites (portfolio, suivi d'alternance…). **Pour en ajouter un, copier un bloc dans `sites/sites-config.js`** (titre, url, description, tags) : aucun autre fichier à modifier. Les liens s'ouvrent dans un nouvel onglet.

## Grille RNCP (mémoire)

Le module « GRILLE RNCP » suit les **63 compétences** du titre (RNCP 41996, source : *Fiche missions ASRS*, 4 blocs, 27 types de missions) :
ce qui reste à faire, ce qui est en cours, ce qui est validé. Un clic sur une compétence ouvre sa fiche : texte du référentiel, mission type, et **ce qui a été fait** (preuves datées, avec la conversation d'origine).

- **Statuts** : `À FAIRE` (aucune preuve) · `EN COURS` (au moins une preuve) · `VALIDÉE` (posée à la main : `statut: 'validee'`).
- **Fichiers** : `rncp/rncp-data.js` = référentiel (ne bouge pas) ; **`rncp/rncp-progress.js` = le seul fichier à mettre à jour chaque semaine**.
- **Mise à jour hebdo** (section 03 de la page) : la page génère un prompt à coller dans Claude Chat (projet de l'entreprise). Claude Chat renvoie un JSON ; on le colle dans la page (**IMPORTER**) : il est fusionné et gardé dans le navigateur. Pour publier, **COPIER LE JSON FUSIONNÉ** puis remplacer le bloc `window.RNCP_PROGRESS` de `rncp-progress.js`.
- **Sécurité des données** : tout est affiché en `textContent`, les identifiants inconnus sont ignorés, rien ne quitte le navigateur. Le JSON importé est dédoublonné (date + titre).
- **Retard** : la page signale en rouge une dernière mise à jour de plus de 7 jours. **Impression** : `Ctrl+P` produit une grille noir et blanc exploitable comme annexe du mémoire.
- Lien direct vers une compétence : `rncp/#BC01-02`.

## Persistance

Clé `salary_pulse_state_v2` pour le salaire (la grille RNCP a la sienne : `salary_pulse_rncp_local_v1`) (minutes du jour, minutes simulées, jour, SFX, démo). Lecture validée et bornée,
remise à zéro au changement de jour, écriture protégée (quota / navigation privée).

## Accessibilité & performance

Focus visible, lien d'évitement, `aria-current` / `aria-pressed`, `prefers-reduced-motion`, SFX synthétisés (Web Audio)
activés seulement après un geste, animations sur `transform` / `opacity`, une seule horloge 1 Hz.
