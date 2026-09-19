/**
 * CALENDRIER // moteur (window.CalendarEngine)
 * Fonctions pures : aucune lecture du DOM, aucune horloge implicite (la date « aujourd'hui »
 * est toujours passée en paramètre) — donc testable et indépendant de l'affichage.
 */
(function () {
    'use strict';

    const JOURS = ['DIMANCHE', 'LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI'];
    const MOIS = ['JANVIER', 'FÉVRIER', 'MARS', 'AVRIL', 'MAI', 'JUIN', 'JUILLET', 'AOÛT', 'SEPTEMBRE', 'OCTOBRE', 'NOVEMBRE', 'DÉCEMBRE'];
    // En-têtes de colonnes : la semaine commence le lundi
    const JOURS_COURTS = ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM'];

    const pad2 = (n) => String(n).padStart(2, '0');
    const cle = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
    const minuitLocal = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const memeJour = (a, b) => cle(a) === cle(b);
    const estWeekend = (d) => d.getDay() === 0 || d.getDay() === 6;

    /** Décale (année, mois) de `delta` mois. */
    function shiftMonth(year, month, delta) {
        const d = new Date(year, month + delta, 1);
        return { year: d.getFullYear(), month: d.getMonth() };
    }

    /**
     * Grille d'un mois : toujours 6 semaines × 7 jours (lundi → dimanche).
     * contrat = { debut: Date } — les jours avant la prise d'effet ne sont pas travaillés.
     */
    function buildMonthGrid(year, month, today, contrat) {
        const premier = new Date(year, month, 1);
        const decalage = (premier.getDay() + 6) % 7; // lundi = 0
        const debutContrat = contrat && contrat.debut ? minuitLocal(contrat.debut) : null;
        const cells = [];

        for (let i = 0; i < 42; i++) {
            const date = new Date(year, month, 1 - decalage + i);
            const avantContrat = Boolean(debutContrat) && date < debutContrat;
            cells.push({
                date,
                key: cle(date),
                day: date.getDate(),
                inMonth: date.getMonth() === month,
                isToday: memeJour(date, today),
                isWeekend: estWeekend(date),
                beforeContract: avantContrat,
                isContractStart: Boolean(debutContrat) && memeJour(date, debutContrat),
                isWorkday: !estWeekend(date) && !avantContrat
            });
        }
        const weeks = [];
        for (let w = 0; w < 6; w++) weeks.push(cells.slice(w * 7, w * 7 + 7));
        return { year, month, weeks, cells };
    }

    /** Jours ouvrés du mois affiché et rémunération maximale correspondante. */
    function summarizeMonth(grid, tauxHoraire, heuresParJour) {
        const workdays = grid.cells.filter((c) => c.inMonth && c.isWorkday).length;
        return { workdays, hours: workdays * heuresParJour, amount: workdays * heuresParJour * tauxHoraire };
    }

    /** Nature d'un jour : sert à l'affichage du détail et de l'état sous le jour actuel. */
    function describeDay(cell) {
        if (cell.isContractStart) return { kind: 'start', label: 'PRISE D\'EFFET DU CONTRAT', worked: true };
        if (cell.isWorkday) return { kind: 'work', label: 'JOUR OUVRÉ', worked: true };
        if (cell.beforeContract && !cell.isWeekend) return { kind: 'before', label: 'AVANT LE CONTRAT', worked: false };
        return { kind: 'rest', label: cell.isWeekend ? 'REPOS // WEEK-END' : 'REPOS', worked: false };
    }

    function formatLong(date) {
        return `${JOURS[date.getDay()]} ${date.getDate()} ${MOIS[date.getMonth()]} ${date.getFullYear()}`;
    }

    window.CalendarEngine = {
        JOURS, MOIS, JOURS_COURTS,
        buildMonthGrid, summarizeMonth, describeDay, shiftMonth, formatLong, cle, minuitLocal
    };
})();
