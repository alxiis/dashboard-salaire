/**
 * GTA 6 COUNTDOWN // moteur (window.GtaCountdown)
 * Fonction pure : le temps restant est toujours recalculé depuis (cible, maintenant),
 * donc aucune dérive même si l'onglet est mis en veille.
 */
(function () {
    'use strict';

    const SECONDE = 1000;
    const MINUTE = 60 * SECONDE;
    const HEURE = 60 * MINUTE;
    const JOUR = 24 * HEURE;

    /** @returns {{done:boolean, total:number, days:number, hours:number, minutes:number, seconds:number}} */
    function compute(cible, maintenant) {
        const reste = cible.getTime() - maintenant.getTime();
        if (!(reste > 0)) return { done: true, total: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
        return {
            done: false,
            total: reste,
            days: Math.floor(reste / JOUR),
            hours: Math.floor((reste % JOUR) / HEURE),
            minutes: Math.floor((reste % HEURE) / MINUTE),
            seconds: Math.floor((reste % MINUTE) / SECONDE)
        };
    }

    window.GtaCountdown = { compute };
})();
