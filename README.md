# Dashboard Salaire

Description
-----------

Ce projet est un petit tableau de bord de salaire (front-end) destiné à afficher des informations salariales et des visualisations simples. Il s'agit d'une application statique composée d'une page HTML, d'un fichier JavaScript pour la logique et d'un fichier CSS pour le style.

Technologies
------------

- HTML
- CSS
- JavaScript (vanilla)

Structure du projet
-------------------

- [index.html](index.html) : page principale du tableau de bord.
- [script.js](script.js) : logique JavaScript (chargement et affichage des données, interactions).
- [styles.css](styles.css) : styles du tableau de bord.

Installation et exécution
------------------------

Le projet est statique — il suffit d'ouvrir [index.html](index.html) dans un navigateur. Pour un environnement de développement local plus fiable (notamment pour contourner les restrictions CORS), démarrez un serveur HTTP simple :

Windows (PowerShell) :

```powershell
python -m http.server 8000
```

Puis ouvrez `http://localhost:8000` dans votre navigateur.

Fonctionnalités
---------------

- Affichage des informations de salaire (exemples/fixtures ou données réelles si connectées).
- Graphiques simples et tableaux (à implémenter/adapter dans `script.js`).
- Mise en forme responsive basique via `styles.css`.

Personnalisation
----------------

- Pour adapter les données : modifier ou remplacer la source dans `script.js`.
- Pour changer le style : éditer `styles.css`.
- Pour ajouter des composants ou bibliothèques (ex. Chart.js), inclure les scripts nécessaires dans `index.html` et ajuster `script.js`.

Contribution
------------

Contributions bienvenues : ouvrez une issue ou proposez une pull request en expliquant la modification (nouvelle fonctionnalité, correction de bug, amélioration visuelle).

Contact
-------

Pour toute question ou demande de fonctionnalité, contactez le responsable du projet.

Licence
-------

Indiquez ici la licence souhaitée (ex. MIT) si vous voulez en ajouter une.

Notes
-----

Ce README est un point de départ. Dites-moi ce que vous souhaitez ajouter ou changer (exemples de données, captures d'écran, instructions de déploiement). 