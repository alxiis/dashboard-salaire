/**
 * DASHBOARD SALARY // moteur salarial
 *
 * Moteur : calculs, persistance, événements. Tout l'affichage passe par window.SalaryUI (salary-ui.js).
 * Planning et paramètres : shared/scheduleConfig.js — calculs de jours : shared/schedule-engine.js.
 *
 * Règles :
 *   - MONTHLY_NET est réparti sur les jours payés du mois (tous sauf le week-end, cf. PAID_DAY_TYPES)
 *   - taux journalier = MONTHLY_NET / nombre de jours payés du mois
 *   - le compteur ne monte qu'un jour payé, pendant les heures de bureau, à la minute entière
 *   - week-end (ou jour non payé) : le cumul est figé → « acquisition en pause »
 *   - les minutes « simulées » (bouton +1 min, démo) s'ajoutent au réel dans la limite d'une journée
 *     et ne sont PAS persistées : un rechargement remet le compteur à sa valeur réelle
 */
(function () {
    'use strict';

    const { CONFIG, store, audio, work, hud, onTick, Schedule } = window.SP;
    const { MAX_MINUTES_JOUR } = CONFIG;

    const DEMO_INTERVAL_MS = 5000;
    const UI = window.SalaryUI;
    const $ = (id) => document.getElementById(id);
    const eur = (n, d = 2) => n.toFixed(d);

    /* ---------- état ---------- */
    const sauvegarde = store.charger(); // déjà remis à zéro si la date a changé
    let creditedMinutes = sauvegarde.creditedMinutes;
    let bonusSimuleMinutes = 0; // simulation : en mémoire seulement, jamais persistée
    let modeDemo = false;
    let jourCourant = store.jourCle();
    let premierPassage = true;
    let demoTimer = null;

    const totalMinutes = () => Math.min(MAX_MINUTES_JOUR, creditedMinutes + bonusSimuleMinutes);

    function persister() {
        store.sauvegarder({
            creditedMinutes,
            dateJour: jourCourant,
            audioActif: audio.isOn()
        }); // bonusSimuleMinutes et modeDemo restent à leur valeur vide (voir etatVide)
    }

    /* ---------- valeurs à afficher ---------- */
    /** Raison de la pause d'acquisition, ou null si le compteur tourne / peut tourner. */
    function raisonPause(now, gains) {
        if (modeDemo) return null;
        if (!gains.active) {
            const type = Schedule.dayType(now);
            return { weekend: 'WEEK-END', holiday: 'JOUR FÉRIÉ', school: "JOUR D'ÉCOLE", outside: 'HORS ALTERNANCE' }[type] || 'JOUR NON PAYÉ';
        }
        const minutes = now.getHours() * 60 + now.getMinutes();
        const { debut } = Schedule.PLAGES[0];
        const { fin } = Schedule.PLAGES[Schedule.PLAGES.length - 1];
        if (minutes < debut) return 'AVANT LES HEURES DE BUREAU';
        if (minutes >= fin) return 'JOURNÉE TERMINÉE';
        return null;
    }

    function rafraichirMontants(now) {
        const minutes = totalMinutes();
        const g = Schedule.earnings(now, minutes);
        const jourMoisPasses = g.paidDaysDone + (g.active || minutes > 0 ? minutes / MAX_MINUTES_JOUR : 0);
        const ratioMois = g.paidDaysMonth ? Math.min(1, jourMoisPasses / g.paidDaysMonth) : 0;
        const ratioJour = minutes / MAX_MINUTES_JOUR;

        UI.setAmounts({ mois: g.month, jour: g.today, total: g.total });
        UI.setPause(raisonPause(now, g));

        UI.setProgress({
            ratio: ratioMois,
            pctTexte: `${(ratioMois * 100).toFixed(1)} %`,
            heuresTexte: `(${g.paidDaysDone} / ${g.paidDaysMonth} jours payés)`,
            sessions: [
                {
                    barId: 'barToday',
                    textId: 'barTodayText',
                    ratio: ratioJour,
                    texte: `${(ratioJour * 100).toFixed(1)}% accompli • ${eur(g.today)} € / ${eur(g.daily)} €`
                }
            ]
        });
        UI.setStaticTexts({ paidDaysCount: String(g.paidDaysMonth) });
    }

    /* ---------- courbe du mois : cumul par jour, plat quand l'acquisition est en pause ---------- */
    const CHART = { x0: 60, x1: 760, yBase: 185, yMax: 35 };

    function construireCourbe(now) {
        const y = now.getFullYear();
        const m = now.getMonth();
        const n = new Date(y, m + 1, 0).getDate();
        const daily = Schedule.dailyRate(y, m);
        const colonne = (CHART.x1 - CHART.x0) / n;
        const yDe = (euros) => CHART.yBase - (euros / CONFIG.MONTHLY_NET) * (CHART.yBase - CHART.yMax);

        let cumul = 0;
        const points = [[CHART.x0, CHART.yBase]];
        const bandes = [];
        const marks = [];
        for (let d = 1; d <= n; d++) {
            const date = new Date(y, m, d);
            const type = Schedule.dayType(date);
            if (Schedule.isPaidDay(date)) cumul += daily;
            const x = CHART.x0 + d * colonne;
            points.push([x, yDe(cumul)]);
            bandes.push({ x: CHART.x0 + (d - 1) * colonne, largeur: colonne, type });
            if (d === 1 || d % 5 === 0 || d === n) marks.push({ x: x - colonne / 2, y: 214, texte: String(d), cle: d === now.getDate(), fin: d === n });
        }
        const ligne = points.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
        UI.buildChart({ ligne, aire: `${ligne} ${CHART.x1},${CHART.yBase}`, bandes, marks, objectif: `MENSUEL ${eur(CONFIG.MONTHLY_NET, 0)}€` });
        return { colonne, yDe, n };
    }

    let geometrie = null;
    function deplacerCurseur(now, gains) {
        if (!geometrie || geometrie.mois !== now.getMonth()) return;
        const { colonne, yDe } = geometrie;
        const x = CHART.x0 + (now.getDate() - 1) * colonne + Schedule.dayFraction(now) * colonne;
        UI.moveCursor(x, yDe(gains.month));
    }

    /* ---------- animation de gain ---------- */
    function animerGain(montant, estSimulation) {
        UI.playGain(montant, estSimulation);
        audio.play('gain');
    }

    /* ---------- crédit de minutes ---------- */
    function gainParMinute(now) {
        return Schedule.dailyRate(now.getFullYear(), now.getMonth()) / MAX_MINUTES_JOUR;
    }

    function crediterReel(nbMinutes) {
        const avant = creditedMinutes;
        creditedMinutes = Math.min(MAX_MINUTES_JOUR, creditedMinutes + nbMinutes);
        if (creditedMinutes === avant) return;
        persister();
        const now = new Date();
        animerGain((creditedMinutes - avant) * gainParMinute(now), false);
        rafraichirMontants(now);
    }

    function crediterSimule(nbMinutes) {
        const ajout = Math.min(nbMinutes, MAX_MINUTES_JOUR - totalMinutes());
        if (ajout <= 0) return;
        bonusSimuleMinutes += ajout;
        persister();
        const now = new Date();
        animerGain(ajout * gainParMinute(now), true);
        rafraichirMontants(now);
    }

    /* ---------- boucle temps réel ---------- */
    function tick(now) {
        const jour = store.jourCle(now);
        if (jour !== jourCourant) { // passage à minuit
            jourCourant = jour;
            creditedMinutes = 0;
            bonusSimuleMinutes = 0;
            arreterDemo();
            persister();
            geometrie = { ...construireCourbe(now), mois: now.getMonth() };
            initialiserTextes(now);
            rafraichirMontants(now);
        }

        hud.update(now, work.getWorkStatus(now, creditedMinutes, bonusSimuleMinutes, modeDemo));

        const termine = Schedule.workedMinutesToday(now);
        if (premierPassage) {
            creditedMinutes = termine;
            premierPassage = false;
            persister();
            rafraichirMontants(now);
        } else if (termine > creditedMinutes) {
            crediterReel(termine - creditedMinutes);
        } else if (termine === creditedMinutes) {
            rafraichirMontants(now); // met à jour l'état « pause » aux changements d'heure
        }
        deplacerCurseur(now, Schedule.earnings(now, totalMinutes()));
    }

    /* ---------- démo continue ---------- */
    const btnDemo = $('btnDemoToggle');
    const afficherDemo = () => UI.setDemo(modeDemo);

    function demarrerDemo() {
        clearInterval(demoTimer);
        demoTimer = setInterval(() => crediterSimule(1), DEMO_INTERVAL_MS);
    }

    function arreterDemo() {
        clearInterval(demoTimer);
        demoTimer = null;
        modeDemo = false;
        afficherDemo();
    }

    btnDemo.addEventListener('click', () => {
        audio.play('menu');
        if (modeDemo) {
            arreterDemo();
            bonusSimuleMinutes = 0;
        } else {
            modeDemo = true;
            afficherDemo();
            demarrerDemo();
            crediterSimule(1);
        }
        persister();
        tick(new Date());
    });

    /* ---------- autres contrôles ---------- */
    $('btnSimulerGain').addEventListener('click', () => {
        audio.play('menu');
        crediterSimule(1);
    });

    $('btnAudioToggle').addEventListener('click', () => audio.toggle());
    audio.subscribe((on) => {
        UI.setAudio(on);
        persister();
    });

    // Onglets : défilement + onglet actif synchronisé avec la section visible
    const onglets = Array.from(document.querySelectorAll('.sp-tab-btn'));
    onglets.forEach((btn) => btn.addEventListener('click', () => {
        audio.play('menu');
        UI.setActiveTab(btn.dataset.target);
        $(btn.dataset.target).scrollIntoView({ behavior: window.SP.prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
    }));
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entrees) => {
            const visible = entrees.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
            if (visible) UI.setActiveTab(visible.target.id);
        }, { rootMargin: '-25% 0px -55% 0px' });
        onglets.forEach((b) => observer.observe($(b.dataset.target)));
    }

    /* ---------- init ---------- */
    function initialiserTextes(now) {
        const daily = Schedule.dailyRate(now.getFullYear(), now.getMonth());
        const [debut, fin] = Schedule.CONFIG.WORK_HOURS[0];
        UI.setStaticTexts({
            gainMinute: `+${(daily / MAX_MINUTES_JOUR).toFixed(4)} € / min`,
            tauxJournalier: `${eur(daily)} € / jour`,
            salaireMensuel: `${eur(CONFIG.MONTHLY_NET, 0)} € net`,
            gainHeure: `≈ ${eur((daily / MAX_MINUTES_JOUR) * 60)}`,
            btnSimSub: `AJOUTE +${(daily / MAX_MINUTES_JOUR).toFixed(4)} € IMMÉDIATEMENT`,
            cellMensuel: `${eur(CONFIG.MONTHLY_NET, 0)} € / MOIS`,
            cellTaux: `${eur(daily)} € / JOUR PAYÉ`,
            cellHoraires: `${debut.replace(':', 'H')} → ${fin.replace(':', 'H')}`,
            cellSalaireMois: `Total du mois : ${eur(CONFIG.MONTHLY_NET, 0)} € (sauf premier mois, proratisé)`,
            svgTargetLabel: `MENSUEL ${eur(CONFIG.MONTHLY_NET, 0)}€`
        });
    }

    const maintenant = new Date();
    initialiserTextes(maintenant);
    geometrie = { ...construireCourbe(maintenant), mois: maintenant.getMonth() };
    afficherDemo();
    if (modeDemo) demarrerDemo();
    window.addEventListener('pagehide', () => clearInterval(demoTimer));
    onTick(tick);
})();
