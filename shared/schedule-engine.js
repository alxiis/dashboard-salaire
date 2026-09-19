/**
 * SALARY PULSE // MOTEUR DE PLANNING (window.Schedule)
 * Fonctions pures : la date est toujours passée en paramètre, aucune lecture du DOM.
 * Données : shared/scheduleConfig.js (window.SCHEDULE_CONFIG).
 *
 * Jour payé = type de jour listé dans PAID_DAY_TYPES (le compteur ne monte que ces jours-là).
 * Types de jour : 'company' (SAS NOOUS) · 'school' (Igensia) · 'weekend' · 'holiday' · 'outside' (hors alternance)
 */
(function () {
    'use strict';

    const C = window.SCHEDULE_CONFIG;
    const pad2 = (n) => String(n).padStart(2, '0');

    const parseISO = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
    const cle = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
    const minuit = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
    const estWeekend = (d) => d.getDay() === 0 || d.getDay() === 6;
    const hhmmToMin = (s) => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };

    const START = parseISO(C.ALTERNANCE_START);
    const END = parseISO(C.ALTERNANCE_END);

    // Jours d'école : Set de clés 'AAAA-MM-JJ'
    const SCHOOL = new Set();
    Object.entries(C.SCHOOL_DAYS).forEach(([mois, jours]) => jours.forEach((j) => SCHOOL.add(`${mois}-${pad2(j)}`)));

    /** Plages de bureau en minutes depuis minuit : [{debut, fin}] */
    const PLAGES = C.WORK_HOURS.map(([a, b]) => ({ debut: hhmmToMin(a), fin: hhmmToMin(b) }));
    const MINUTES_PAR_JOUR = PLAGES.reduce((s, p) => s + (p.fin - p.debut), 0);

    /** Nature d'un jour, sans tenir compte de la période d'alternance. */
    function baseType(date) {
        if (estWeekend(date)) return 'weekend';
        const k = cle(date);
        if (C.HOLIDAYS[k]) return 'holiday';
        if (SCHOOL.has(k)) return 'school';
        return 'company';
    }

    /** Nature d'un jour dans l'alternance ('outside' avant le début ou après la fin). */
    function dayType(date) {
        const d = minuit(date);
        if (d < START || d > END) return estWeekend(d) ? 'weekend' : 'outside';
        return baseType(d);
    }

    const isCompanyDay = (date) => dayType(date) === 'company';
    const PAID = new Set(C.PAID_DAY_TYPES);
    /** Jour qui fait monter le compteur (selon PAID_DAY_TYPES ; jamais le week-end). */
    const isPaidDay = (date) => PAID.has(dayType(date));
    const holidayName = (date) => C.HOLIDAYS[cle(date)] || null;

    /** Jours payés d'un mois, en ne gardant que la période d'alternance. */
    function paidDaysInMonth(year, month) {
        const n = new Date(year, month + 1, 0).getDate();
        const jours = [];
        for (let d = 1; d <= n; d++) if (isPaidDay(new Date(year, month, d))) jours.push(d);
        return jours;
    }

    /** Dénominateur du taux journalier : mois complet (prorata) ou période d'alternance seule. */
    function paidDaysForRate(year, month) {
        if (!C.PRORATE_FIRST_MONTH) return paidDaysInMonth(year, month).length;
        const n = new Date(year, month + 1, 0).getDate();
        let total = 0;
        for (let d = 1; d <= n; d++) if (PAID.has(baseType(new Date(year, month, d)))) total++;
        return total;
    }

    /** Taux journalier du mois : MONTHLY_NET / jours payés. */
    function dailyRate(year, month) {
        const n = paidDaysForRate(year, month);
        return n > 0 ? C.MONTHLY_NET / n : 0;
    }

    /** Fraction (0..1) de la journée de bureau écoulée à l'instant `date`, par minutes entières. */
    function dayFraction(date) {
        const minutes = date.getHours() * 60 + date.getMinutes();
        let fait = 0;
        PLAGES.forEach((p) => { fait += Math.max(0, Math.min(minutes, p.fin) - p.debut); });
        return MINUTES_PAR_JOUR > 0 ? Math.min(1, fait / MINUTES_PAR_JOUR) : 0;
    }

    /** Minutes de bureau entières écoulées aujourd'hui (0 si le jour n'est pas payé). */
    function workedMinutesToday(date) {
        if (!isPaidDay(date)) return 0;
        return Math.round(dayFraction(date) * MINUTES_PAR_JOUR);
    }

    /**
     * Argent acquis à l'instant `now` (hors minutes simulées).
     * @returns {{today:number, month:number, total:number, daily:number, paidDaysMonth:number,
     *            paidDaysDone:number, active:boolean}}
     */
    function earnings(now, minutesJour = workedMinutesToday(now)) {
        const y = now.getFullYear();
        const m = now.getMonth();
        const daily = dailyRate(y, m);
        const jourDuMois = now.getDate();
        const joursMois = paidDaysInMonth(y, m);
        const passes = joursMois.filter((j) => j < jourDuMois).length;
        const today = MINUTES_PAR_JOUR > 0 ? daily * (minutesJour / MINUTES_PAR_JOUR) : 0;

        // Total depuis le début : somme des mois complets passés + mois courant
        let total = 0;
        for (let cursor = new Date(START.getFullYear(), START.getMonth(), 1); cursor < new Date(y, m, 1); cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1)) {
            total += dailyRate(cursor.getFullYear(), cursor.getMonth()) * paidDaysInMonth(cursor.getFullYear(), cursor.getMonth()).length;
        }
        const month = daily * passes + today;
        return {
            today, month, total: total + month, daily,
            paidDaysMonth: joursMois.length,
            paidDaysDone: passes,
            active: isPaidDay(now)
        };
    }

    /** Progression de l'alternance : entreprise, école, total (calendaire). */
    function yearProgress(now) {
        const auj = minuit(now);
        const frac = dayFraction(now);
        let compTotal = 0, compFait = 0, ecoleTotal = 0, ecoleFait = 0;
        for (let d = new Date(START); d <= END; d = addDays(d, 1)) {
            const t = baseType(d);
            if (t !== 'company' && t !== 'school') continue;
            const passe = d < auj ? 1 : (d.getTime() === auj.getTime() ? frac : 0);
            if (t === 'company') { compTotal++; compFait += passe; } else { ecoleTotal++; ecoleFait += passe; }
        }
        const totalMs = END.getTime() + 86400000 - START.getTime();
        const ecoule = Math.min(totalMs, Math.max(0, now.getTime() - START.getTime()));
        return {
            company: { done: compFait, total: compTotal, ratio: compTotal ? compFait / compTotal : 0 },
            school: { done: ecoleFait, total: ecoleTotal, ratio: ecoleTotal ? ecoleFait / ecoleTotal : 0 },
            overall: { done: ecoule / 86400000, total: totalMs / 86400000, ratio: ecoule / totalMs }
        };
    }

    window.Schedule = {
        CONFIG: C, START, END, PLAGES, MINUTES_PAR_JOUR,
        cle, parseISO, minuit, addDays,
        dayType, isCompanyDay, isPaidDay, holidayName,
        paidDaysInMonth, dailyRate, dayFraction, workedMinutesToday, earnings, yearProgress
    };
})();
