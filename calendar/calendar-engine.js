/**
 * CALENDRIER // moteur (window.CalendarEngine)
 * Fonctions pures : aucune lecture du DOM, aucune horloge implicite (« aujourd'hui » est un paramètre).
 * Le type de chaque jour (entreprise / école / week-end / férié) vient de window.Schedule
 * (shared/schedule-engine.js, alimenté par shared/scheduleConfig.js).
 */
(function () {
    'use strict';

    const S = window.Schedule;
    const JOURS = ['DIMANCHE', 'LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI'];
    const MOIS = ['JANVIER', 'FÉVRIER', 'MARS', 'AVRIL', 'MAI', 'JUIN', 'JUILLET', 'AOÛT', 'SEPTEMBRE', 'OCTOBRE', 'NOVEMBRE', 'DÉCEMBRE'];
    const MOIS_COURTS = ['JAN', 'FÉV', 'MAR', 'AVR', 'MAI', 'JUIN', 'JUIL', 'AOÛ', 'SEP', 'OCT', 'NOV', 'DÉC'];

    const cle = S.cle;
    const memeJour = (a, b) => cle(a) === cle(b);

    /** Décale (année, mois) de `delta` mois. */
    function shiftMonth(year, month, delta) {
        const d = new Date(year, month + delta, 1);
        return { year: d.getFullYear(), month: d.getMonth() };
    }

    /** Une case de calendrier. */
    function cellFor(date, month, today) {
        const type = S.dayType(date);
        return {
            date,
            key: cle(date),
            day: date.getDate(),
            inMonth: date.getMonth() === month,
            isToday: memeJour(date, today),
            type, // 'company' | 'school' | 'weekend' | 'holiday' | 'outside'
            isPaid: S.isPaidDay(date),
            holiday: S.holidayName(date)
        };
    }

    /** Grille d'un mois : toujours 6 semaines × 7 jours (lundi → dimanche). */
    function buildMonthGrid(year, month, today) {
        const decalage = (new Date(year, month, 1).getDay() + 6) % 7; // lundi = 0
        const cells = [];
        for (let i = 0; i < 42; i++) cells.push(cellFor(new Date(year, month, 1 - decalage + i), month, today));
        const weeks = [];
        for (let w = 0; w < 6; w++) weeks.push(cells.slice(w * 7, w * 7 + 7));
        return { year, month, weeks, cells };
    }

    /** Mois couverts par l'alternance (pour la vue « Année »). */
    function alternanceMonths() {
        const mois = [];
        for (let d = new Date(S.START.getFullYear(), S.START.getMonth(), 1); d <= S.END; d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) {
            mois.push({ year: d.getFullYear(), month: d.getMonth() });
        }
        return mois;
    }

    /** Décompte d'un mois : jours par type, jours payés et salaire acquis sur le mois. */
    function summarizeMonth(grid) {
        const count = { company: 0, school: 0, weekend: 0, holiday: 0, outside: 0 };
        grid.cells.forEach((c) => { if (c.inMonth) count[c.type]++; });
        const paid = S.paidDaysInMonth(grid.year, grid.month).length;
        return { count, paid, amount: paid * S.dailyRate(grid.year, grid.month), daily: S.dailyRate(grid.year, grid.month) };
    }

    const LIBELLES = {
        company: { label: 'JOUR ENTREPRISE // SAS NOOUS', short: 'ENTREPRISE' },
        school: { label: 'JOUR ÉCOLE // IGENSIA', short: 'ÉCOLE' },
        weekend: { label: 'WEEK-END // AUCUN SALAIRE', short: 'WEEK-END' },
        holiday: { label: 'JOUR FÉRIÉ', short: 'FÉRIÉ' },
        outside: { label: 'HORS ALTERNANCE', short: 'HORS PÉRIODE' }
    };

    /** Description d'un jour pour le panneau de détail. */
    function describeDay(cell) {
        const l = LIBELLES[cell.type];
        const label = cell.type === 'holiday' && cell.holiday ? `JOUR FÉRIÉ // ${cell.holiday.toUpperCase()}` : l.label;
        return { kind: cell.type, label, short: l.short, paid: cell.isPaid };
    }

    function formatLong(date) {
        return `${JOURS[date.getDay()]} ${date.getDate()} ${MOIS[date.getMonth()]} ${date.getFullYear()}`;
    }

    window.CalendarEngine = {
        JOURS, MOIS, MOIS_COURTS, LIBELLES,
        buildMonthGrid, alternanceMonths, summarizeMonth, describeDay, shiftMonth, formatLong, cle
    };
})();
