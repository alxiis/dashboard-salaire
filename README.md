# Salary Pulse // Persona 5 Royal Royale Hub

Application de suivi de salaire en temps réel et hub multi-modules, développée en **HTML / CSS / JavaScript vanilla** avec une direction artistique fortement inspirée de l'esthétique JRPG de **Persona 5 Royal** (typographies géantes asymétriques, hard drop shadows, sticker collage Date HUD, calques halftones, sons Web Audio API et transitions Wipe Slash).

---

## 📁 Structure du Projet

Le projet est organisé en dossiers modulaires autonomes :

```
dashboard-salaire/
│
├── index.html                 # Passerelle d'entrée racine (redirection automatique vers main-menu/)
├── README.md                  # Documentation du projet
│
├── shared/                    # Ressources et logique communes partagées
│   ├── shared.css             # Charte chromatique P5R, reset, Date HUD sticker, Header, Wipe Slash
│   └── shared.js              # Synthétiseur SFX Web Audio API, horloge Date HUD, persistance d'état
│
├── main-menu/                 # Module 1 : Menu Principal / Command Screen P5R
│   ├── index.html             # Écran de commandes plein écran avec silhouette Phantom Thief
│   ├── style.css              # Styles spécifiques au Game Stage, silhouette et sélection calibrée
│   └── script.js              # Contrôleur de navigation JRPG (clavier ↑/↓/W/S/Enter/Space, pointeur)
│
├── dashboard-salary/          # Module 2 : Dashboard Salary Pulse
│   ├── index.html             # Tableau de bord complet (hero card, onglets, graphique SVG, créneaux)
│   ├── style.css              # Styles des cartes, animations de gain, jauges et graphiques
│   └── script.js              # Moteur salarial discret (+0.1315 €/min), simulateur et démo live
│
├── calendar/                  # Module 3 : Calendrier (vue d'attente stylisée)
│   └── index.html             # Cycles de paie, planning 35h, congés et bouton retour
│
└── gta-countdown/             # Module 4 : GTA 6 Countdown (vue d'attente Vice City)
    └── index.html             # Horloge de compte à rebours néon et bouton retour
```

---

## ⚡ Démarrage Rapide

### Option 1 : Serveur Local HTTP (Recommandé)
Démarrez un serveur HTTP simple depuis le dossier racine :

```powershell
python -m http.server 8000
```
Puis ouvrez `http://localhost:8000` dans votre navigateur.

### Option 2 : Ouverture Directe
Double-cliquez directement sur `index.html` à la racine ou sur `main-menu/index.html` dans l'explorateur de fichiers.

---

## 🎮 Navigation & Raccourcis

- **Menu Principal** :
  - `↑` / `↓` ou `W` / `S` : faire défiler la sélection des commandes.
  - `Entrée` ou `Espace` : valider et lancer le module avec animation d'impact et Wipe Slash.
  - `Survol souris` / `Clic` : alignement automatique du pointeur et accès direct.
- **Dans les sous-modules (Dashboard, Calendrier, GTA 6)** :
  - Touche `Échap` (`ESC`) : retour immédiat au Menu Principal.
  - Bouton `◀ MENU PRINCIPAL [ESC]` dans le header ou en bas de page.

---

## 💰 Moteur Salarial du Dashboard

- **Taux horaire net** : `7.89 € / h` (soit `≈ 0.1315 € / min`).
- **Cadence discrète** : le compteur se met à jour uniquement lorsqu'une **minute entière de travail** est complétée.
- **Horaires officiels de 7h** :
  - Matin : `08h30` à `12h30` (4h = 31.56 € net max).
  - Pause déjeuner : `12h30` à `13h30`.
  - Après-midi : `13h30` à `16h30` (3h = 23.67 € net max).
- **Plafond journalier** : `55.23 € net` (420 minutes).
- **Persistance LocalStorage** : les minutes cumulées et les préférences audio sont conservées entre les changements de pages.