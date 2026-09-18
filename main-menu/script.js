/**
 * ==========================================================================
 * MAIN MENU // GAME CONTROLLER (PERSONA 5 ROYAL COMMAND SCREEN)
 * Contrôleur de commandes asymétriques, pointeur dynamique et navigation clavier
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
    let menuIndexSelectionne = 0;
    let estEnTransition = false;

    const commandItems = [
        document.getElementById('cmdDashboard'),
        document.getElementById('cmdCalendar'),
        document.getElementById('cmdGta')
    ].filter(Boolean);

    const pointer = document.getElementById('p5CommandPointer');

    /**
     * Repositionne le pointeur flottant JRPG (#p5CommandPointer)
     */
    function repositionnerPointeur() {
        if (!pointer || commandItems.length === 0) return;
        const activeCmd = commandItems[menuIndexSelectionne];
        if (!activeCmd) return;

        const topPos = activeCmd.offsetTop + 14;
        const leftPos = Math.max(-80, activeCmd.offsetLeft - 76);
        pointer.style.top = `${topPos}px`;
        pointer.style.left = `${leftPos}px`;
    }

    /**
     * Sélectionne une commande par son index (0: Dashboard, 1: Calendrier, 2: GTA 6)
     */
    function selectionnerIndexCommande(nouveauIndex, avecSon = false) {
        if (commandItems.length === 0) return;

        // Boucle cyclique : 0 -> 1 -> 2 -> 0 ou 0 -> 2 -> 1 -> 0
        menuIndexSelectionne = (nouveauIndex + commandItems.length) % commandItems.length;

        commandItems.forEach((cmd, idx) => {
            const isSel = idx === menuIndexSelectionne;
            cmd.classList.toggle('is-selected', isSel);
            cmd.classList.toggle('is-dimmed', !isSel);
            cmd.setAttribute('aria-selected', isSel ? 'true' : 'false');
        });

        repositionnerPointeur();

        if (avecSon) {
            jouerSonSurvol();
        }
    }

    /**
     * Séquence cinématographique de lancement du module sélectionné
     */
    function lancerCommande(index) {
        if (estEnTransition || commandItems.length === 0) return;
        estEnTransition = true;

        const activeCmd = commandItems[index];
        if (activeCmd) {
            activeCmd.classList.add('is-launching');
        }

        let targetUrl = '../dashboard-salary/';
        let wipeText = 'TAKE YOUR TIME';
        let wipeSub = 'SYSTEM // ACCESSING SALARY ENGINE...';

        if (index === 1) {
            targetUrl = '../calendar/';
            wipeText = 'LOOK AHEAD';
            wipeSub = 'SYSTEM // ACCESSING CALENDAR HUB...';
        } else if (index === 2) {
            targetUrl = '../gta-countdown/';
            wipeText = 'VICE CITY 2026';
            wipeSub = 'SYSTEM // SYNCING COUNTDOWN PROTOCOL...';
        }

        // Déclenchement du Wipe Slash cinématique
        setTimeout(() => {
            declencherWipe(targetUrl, 'confirm', wipeText, wipeSub);
        }, 120);
    }

    // Événements Souris & Tactile sur chaque commande
    commandItems.forEach((cmd, idx) => {
        cmd.addEventListener('mouseenter', () => {
            if (menuIndexSelectionne !== idx) {
                selectionnerIndexCommande(idx, true);
            }
        });

        cmd.addEventListener('click', () => {
            lancerCommande(idx);
        });
    });

    // Raccourcis Clavier JRPG Globaux (↑, ↓, W, S, Entrée, Espace)
    window.addEventListener('keydown', (e) => {
        if (estEnTransition) return;

        if (e.key === 'ArrowDown' || e.key === 'KeyS' || e.key === 's' || e.key === 'S') {
            e.preventDefault();
            selectionnerIndexCommande(menuIndexSelectionne + 1, true);
        } else if (e.key === 'ArrowUp' || e.key === 'KeyW' || e.key === 'w' || e.key === 'W') {
            e.preventDefault();
            selectionnerIndexCommande(menuIndexSelectionne - 1, true);
        } else if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            lancerCommande(menuIndexSelectionne);
        }
    });

    // Repositionnement réactif sur resize
    window.addEventListener('resize', repositionnerPointeur);

    // Initialisation immédiate de la sélection et du pointeur
    selectionnerIndexCommande(0, false);
    setTimeout(repositionnerPointeur, 100);

    // Boucle de rafraîchissement temps réel de l'horloge Date HUD (1 seconde)
    function rafraichirHUD() {
        const maintenant = new Date();
        const etat = chargerEtatPartage();
        const statusInfo = getWorkStatus(maintenant, etat.creditedMinutes, etat.bonusSimuleMinutes, etat.modeDemo);
        mettreAJourDateHUD(maintenant, statusInfo);
    }

    rafraichirHUD();
    setInterval(rafraichirHUD, 1000);
});

