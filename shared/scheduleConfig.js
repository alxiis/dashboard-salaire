/**
 * SALARY PULSE // PLANNING & PARAMÈTRES D'ALTERNANCE
 * ---------------------------------------------------------------------------
 * C'est LE fichier à modifier quand le planning ou le salaire change.
 * Règle : tout jour de semaine qui n'est ni « école » ni « férié » est un JOUR D'ENTREPRISE (SAS NOOUS).
 * Le salaire ne s'acquiert que les jours listés dans PAID_DAY_TYPES (par défaut : tous sauf le week-end).
 * Source des jours d'école : « Planning - Bachelor - ASRS - 2026-2027 » (71 jours, rentrée le 24/09/2026).
 */
window.SCHEDULE_CONFIG = Object.freeze({

    // --- Contrat -------------------------------------------------------------
    ALTERNANCE_START: '2026-09-14',   // 1er jour en entreprise
    ALTERNANCE_END: '2027-09-15',     // dernier jour (examens / soutenance)
    MONTHLY_NET: 1170,                // salaire net mensuel (€), réparti sur les jours payés du mois

    // Heures de bureau : le compteur ne monte que dans ces plages, les jours payés.
    // Pour une pause déjeuner : [['08:30', '12:30'], ['13:30', '16:30']]
    WORK_HOURS: [['08:30', '16:30']],

    // Types de jour qui font monter le compteur : 'company' | 'school' | 'holiday'
    // (le week-end ne rapporte jamais). Retirer 'school' pour geler le salaire les jours d'école.
    PAID_DAY_TYPES: ['company', 'school', 'holiday'],

    // true  : 1 170 € est divisé par les jours payés du MOIS COMPLET, seuls les jours
    //         à partir de ALTERNANCE_START comptent (le 1er mois est proratisé).
    // false : on divise par les seuls jours payés à partir de ALTERNANCE_START.
    PRORATE_FIRST_MONTH: true,

    // --- Jours d'école (Igensia) : 'AAAA-MM': [jours du mois] ------------------
    SCHOOL_DAYS: {
        '2026-09': [24, 25, 28, 29, 30],                                      // SEPTEMBRE 2026 (5 j)
        '2026-10': [1, 2, 5, 6, 7, 8, 9],                                     // OCTOBRE 2026 (7 j)
        '2026-11': [2, 3, 4, 5, 6],                                           // NOVEMBRE 2026 (5 j)
        '2026-12': [7, 8, 9, 10, 11, 14, 15, 16, 17, 18],                     // DÉCEMBRE 2026 (10 j)
        '2027-01': [4, 5, 6, 7, 8],                                           // JANVIER 2027 (5 j)
        '2027-02': [1, 2, 3, 4, 5],                                           // FÉVRIER 2027 (5 j)
        '2027-03': [1, 2, 3, 4, 5, 22, 23, 24, 25, 26],                       // MARS 2027 (10 j)
        '2027-04': [26, 27, 28, 29, 30],                                      // AVRIL 2027 (5 j)
        '2027-05': [31],                                                      // MAI 2027 (1 j)
        '2027-06': [1, 2, 3, 4, 7, 8, 9, 10, 11],                             // JUIN 2027 (9 j)
        '2027-07': [5, 6, 7, 8, 9],                                           // JUILLET 2027 (5 j)
        '2027-09': [10, 13, 14, 15],                                          // SEPTEMBRE 2027 (4 j)
    },

    // --- Jours fériés en semaine (payés ou non selon PAID_DAY_TYPES) ------------------
    // Format 'AAAA-MM-JJ': 'nom'. Les fériés tombant un week-end n'ont aucun effet.
    HOLIDAYS: {
        '2026-11-11': 'Armistice',
        '2026-12-25': 'Noël',
        '2027-01-01': "Jour de l'an",
        '2027-03-29': 'Lundi de Pâques',
        '2027-05-01': 'Fête du Travail',
        '2027-05-06': 'Ascension',
        '2027-05-08': 'Victoire 1945',
        '2027-05-17': 'Lundi de Pentecôte',
        '2027-07-14': 'Fête nationale'
    }
});
