/**
 * DASHBOARD SALARY // moteur salarial à la minute
 *
 * Moteur : calculs, persistance, événements. Tout l'affichage passe par window.SalaryUI (salary-ui.js).
 *
 * Règles (inchangées) :
 *   - 7,89 €/h ≈ 0,1315 €/min ; le compteur ne bouge qu'à la minute entière travaillée
 *   - plages 08h30–12h30 et 13h30–16h30, lundi–vendredi, plafond 420 min/jour
 *   - les minutes « simulées » (bouton +1 min, démo) s'ajoutent au réel dans la limite du plafond
 */
(function () {
    'use strict';

    const { CONFIG, store, audio, work, hud, onTick } = window.SP;
    const { TAUX_HORAIRE_NET, TAUX_MINUTE, TAUX_SECONDE, MAX_MINUTES_JOUR, GAIN_JOUR_MAX, PLAGES } = CONFIG;

    const DEMO_INTERVAL_MS = 5000;
    const [MATIN, APRES_MIDI] = PLAGES;
    const DUREE_MATIN = MATIN.fin - MATIN.debut; // 240
    const DUREE_APRES_MIDI = APRES_MIDI.fin - APRES_MIDI.debut; // 180

    const UI = window.SalaryUI;
    const $ = (id) => document.getElementById(id);
    const euros = (minutes) => (minutes * TAUX_MINUTE).toFixed(2);

    /* ---------- état ---------- */
    const sauvegarde = store.charger(); // déjà remis à zéro si la date a changé
    let creditedMinutes = sauvegarde.creditedMinutes;
    let bonusSimuleMinutes = sauvegarde.bonusSimuleMinutes;
    let modeDemo = sauvegarde.modeDemo;
    let jourCourant = store.jourCle();
    let premierPassage = true;
    let demoTimer = null;

    // Cumul des jours strictement passés : ne change qu'une fois par jour
    let cachePasse = { jour: null, mois: 0, total: 0 };

    const totalMinutes = () => Math.min(MAX_MINUTES_JOUR, creditedMinutes + bonusSimuleMinutes);

    function persister() {
        store.sauvegarder({
            creditedMinutes,
            bonusSimuleMinutes,
            dateJour: jourCourant,
            audioActif: audio.isOn(),
            modeDemo
        });
    }

    /* ---------- calculs ---------- */
    function secondesJoursPrecedents(debut, fin) {
        if (fin <= debut) return 0;
        let cumul = 0;
        const curseur = new Date(debut.getFullYear(), debut.getMonth(), debut.getDate());
        const limite = new Date(fin.getFullYear(), fin.getMonth(), fin.getDate());
        while (curseur < limite) {
            if (work.estJourOuvre(curseur)) cumul += MAX_MINUTES_JOUR * 60;
            curseur.setDate(curseur.getDate() + 1);
        }
        return cumul;
    }

    function actualiserCachePasse(date) {
        const jour = store.jourCle(date);
        if (cachePasse.jour === jour) return;
        const debutMois = new Date(date.getFullYear(), date.getMonth(), 1);
        const debutMoisEffectif = debutMois < CONFIG.DATE_DEBUT_CONTRAT ? CONFIG.DATE_DEBUT_CONTRAT : debutMois;
        cachePasse = {
            jour,
            mois: secondesJoursPrecedents(debutMoisEffectif, date) * TAUX_SECONDE,
            total: secondesJoursPrecedents(CONFIG.DATE_DEBUT_CONTRAT, date) * TAUX_SECONDE
        };
    }

    /* ---------- valeurs à afficher ---------- */
    function rafraichirMontants(date) {
        actualiserCachePasse(date);
        const minutes = totalMinutes();
        const gagneAujourdhui = minutes * TAUX_MINUTE;
        const ratio = Math.min(1, minutes / MAX_MINUTES_JOUR);

        UI.setAmounts({
            jour: gagneAujourdhui,
            mois: cachePasse.mois + gagneAujourdhui,
            total: cachePasse.total + gagneAujourdhui
        });

        const minMatin = Math.min(DUREE_MATIN, minutes);
        const minApresMidi = Math.max(0, Math.min(DUREE_APRES_MIDI, minutes - DUREE_MATIN));
        const session = (barId, textId, fait, duree) => ({
            barId,
            textId,
            ratio: fait / duree,
            texte: `${((fait / duree) * 100).toFixed(1)}% accompli • ${euros(fait)} € / ${euros(duree)} €`
        });
        UI.setProgress({
            ratio,
            pctTexte: `${(ratio * 100).toFixed(1)} %`,
            heuresTexte: `(${(minutes / 60).toFixed(1)}h / 7h)`,
            sessions: [
                session('slotBarMorning', 'slotMorningText', minMatin, DUREE_MATIN),
                session('slotBarAfternoon', 'slotAfternoonText', minApresMidi, DUREE_APRES_MIDI)
            ]
        });
    }

    /* ---------- courbe SVG : coordonnées dérivées du contrat ---------- */
    const CHART = { x0: 60, x1: 760, yBase: 185, yMax: 35 };
    const minuteX = (m) => CHART.x0 + ((m - MATIN.debut) / (APRES_MIDI.fin - MATIN.debut)) * (CHART.x1 - CHART.x0);
    const euroY = (e) => CHART.yBase - (e / GAIN_JOUR_MAX) * (CHART.yBase - CHART.yMax);
    /** minutes travaillées à l'heure `m` (minutes depuis minuit) */
    const travailleA = (m) =>
        Math.max(0, Math.min(m, MATIN.fin) - MATIN.debut) + Math.max(0, Math.min(m, APRES_MIDI.fin) - APRES_MIDI.debut);
    const pointA = (m) => [minuteX(m), euroY(travailleA(m) * TAUX_MINUTE)];
    const hhmm = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

    function construireCourbe() {
        const sommets = [MATIN.debut, MATIN.fin, APRES_MIDI.debut, APRES_MIDI.fin].map(pointA);
        const ligne = sommets.map((p) => p.map((v) => v.toFixed(1)).join(',')).join(' ');
        const [xPauseDebut] = pointA(MATIN.fin);
        const [xPauseFin] = pointA(APRES_MIDI.debut);
        // jalons horaires : [minute, afficher le montant]
        const jalons = [[MATIN.debut, true], [630, true], [MATIN.fin, true], [APRES_MIDI.debut, false], [900, true], [APRES_MIDI.fin, true]];

        UI.buildChart({
            ligne,
            aire: `${CHART.x0},${CHART.yBase} ${ligne} ${CHART.x1},${CHART.yBase}`,
            pause: { x: xPauseDebut, largeur: xPauseFin - xPauseDebut },
            marks: jalons.map(([m, avecMontant], i) => {
                const [x, y] = pointA(m);
                return {
                    x, y,
                    texte: avecMontant ? `${hhmm(m)} (${euros(travailleA(m))}€)` : hhmm(m),
                    cle: i === 2 || i === jalons.length - 1,
                    fin: i === jalons.length - 1
                };
            })
        });
    }

    function deplacerCurseur(date) {
        const minuteJour = work.estJourOuvre(date)
            ? Math.min(APRES_MIDI.fin, Math.max(MATIN.debut, date.getHours() * 60 + date.getMinutes() + date.getSeconds() / 60))
            : MATIN.debut;
        UI.moveCursor(minuteX(minuteJour), euroY((work.secondesTravaillees(date) / 60) * TAUX_MINUTE));
    }

    function animerGain(montant, estSimulation) {
        UI.playGain(montant, estSimulation);
        audio.play('gain');
    }

    /* ---------- crédit de minutes ---------- */
    function crediterReel(nbMinutes) {
        const avant = creditedMinutes;
        creditedMinutes = Math.min(MAX_MINUTES_JOUR, creditedMinutes + nbMinutes);
        if (creditedMinutes === avant) return;
        persister();
        animerGain((creditedMinutes - avant) * TAUX_MINUTE, false);
        rafraichirMontants(new Date());
    }

    function crediterSimule(nbMinutes) {
        const ajout = Math.min(nbMinutes, MAX_MINUTES_JOUR - totalMinutes());
        if (ajout <= 0) return;
        bonusSimuleMinutes += ajout;
        persister();
        animerGain(ajout * TAUX_MINUTE, true);
        rafraichirMontants(new Date());
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
            rafraichirMontants(now);
        }

        hud.update(now, work.getWorkStatus(now, creditedMinutes, bonusSimuleMinutes, modeDemo));

        const termine = Math.min(MAX_MINUTES_JOUR, Math.floor(work.secondesTravaillees(now) / 60));
        if (premierPassage) {
            creditedMinutes = termine;
            premierPassage = false;
            persister();
            rafraichirMontants(now);
        } else if (termine > creditedMinutes) {
            crediterReel(termine - creditedMinutes);
        }
        deplacerCurseur(now);
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
        rafraichirMontants(new Date());
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
    UI.setStaticTexts({
        gainMinute: `+${TAUX_MINUTE.toFixed(4)} € / min`,
        tauxHoraire: `${TAUX_HORAIRE_NET.toFixed(2)} € / heure`,
        objectifJour: `${GAIN_JOUR_MAX.toFixed(2)} € net`,
        gainSeconde: `≈ ${TAUX_SECONDE.toFixed(5)}`,
        svgTargetLabel: `OBJECTIF ${GAIN_JOUR_MAX.toFixed(2)}€`
    });

    construireCourbe();
    afficherDemo();
    if (modeDemo) demarrerDemo();
    window.addEventListener('pagehide', () => clearInterval(demoTimer));
    onTick(tick);
})();
