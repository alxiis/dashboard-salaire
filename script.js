/**
 * ==========================================================================
 * SALARY PULSE // P5R ROYALE ENGINE (JAVASCRIPT VANILLA)
 * Moteur haute précision pour le suivi salarial, HUD temporel, animations et SFX
 * ==========================================================================
 */

// 1. CONFIGURATION & DONNÉES DU CONTRAT
const TAUX_HORAIRE_NET = 7.89;
const TAUX_SECONDE = TAUX_HORAIRE_NET / 3600;
const TAUX_MINUTE = TAUX_HORAIRE_NET / 60; // ≈ 0.1315 €
const GAIN_JOUR_MAX = 7 * TAUX_HORAIRE_NET; // 55.23 €
const MAX_MINUTES_JOUR = 420; // 7h * 60 = 420 minutes
const DATE_DEBUT_CONTRAT = new Date(2026, 8, 14, 8, 30, 0); // 14 septembre 2026 à 08h30

// Plages quotidiennes (08h30-12h30 = 240 min ; 13h30-16h30 = 180 min => 7h = 420 min)
const PLAGES = [
    { debut: 8 * 60 + 30, fin: 12 * 60 + 30, dureeSec: 4 * 3600, maxGain: 31.56 }, // Session Matin (4h)
    { debut: 13 * 60 + 30, fin: 16 * 60 + 30, dureeSec: 3 * 3600, maxGain: 23.67 }  // Session Après-midi (3h)
];

// 2. ÉTATS GLOBAUX DU SYSTÈME (HORLOGE DISCRÈTE)
let audioActif = false;
let modeDemo = false;
let demoInterval = null;
let creditedMinutesAujourdhui = 0; // Minutes de travail réelles déjà créditées aujourd'hui
let bonusSimuleMinutes = 0;        // Minutes simulées manuellement ou via mode démo
let dateDernierCalculJour = null;   // Détection du changement de jour (minuit)
let isInitialBoot = true;          // Flag pour affichage instantané sans animation au boot
let audioCtx = null;

/**
 * Vérifie si la date est un jour ouvré (Lundi au Vendredi)
 */
function estJourOuvre(date) {
    const jour = date.getDay();
    return jour >= 1 && jour <= 5;
}

/**
 * Évalue l'état de mission courant (4 États Métier Réels)
 * WORKING | BREAK | DAY COMPLETE | OFF DUTY
 */
function getWorkStatus(date) {
    if (modeDemo) {
        return {
            status: 'WORKING',
            label: 'WORKING',
            desc: 'DÉMO ACTIVE // FLUX EN CONTINU',
            badgeClass: 'status-working',
            bodyClass: 'state-working',
            enPoste: true,
            contextText: 'DEMO MODE',
            contextClass: 'context-working'
        };
    }

    if (!estJourOuvre(date)) {
        return {
            status: 'OFF DUTY',
            label: 'OFF DUTY',
            desc: 'WEEK-END // SYSTÈME EN VEILLE',
            badgeClass: 'status-offduty',
            bodyClass: 'state-offduty',
            enPoste: false,
            contextText: 'OFF DUTY',
            contextClass: 'context-offduty'
        };
    }

    // Plafond journalier atteint (420 minutes = 55.23 €)
    if ((creditedMinutesAujourdhui + bonusSimuleMinutes) >= MAX_MINUTES_JOUR) {
        return {
            status: 'DAY COMPLETE',
            label: 'DAY COMPLETE',
            desc: 'MISSION ACCOMPLIE // 7H EFFECTUÉES',
            badgeClass: 'status-complete',
            bodyClass: 'state-complete',
            enPoste: false,
            contextText: 'AFTER WORK',
            contextClass: 'context-afterwork'
        };
    }

    const minutes = date.getHours() * 60 + date.getMinutes();

    // Avant 08h30
    if (minutes < PLAGES[0].debut) {
        return {
            status: 'OFF DUTY',
            label: 'OFF DUTY',
            desc: 'HORS HORAIRES // DÉBUT À 08H30',
            badgeClass: 'status-offduty',
            bodyClass: 'state-offduty',
            enPoste: false,
            contextText: 'OFF DUTY',
            contextClass: 'context-offduty'
        };
    }

    // 08h30 - 12h30 (Session Matin)
    if (minutes >= PLAGES[0].debut && minutes < PLAGES[0].fin) {
        return {
            status: 'WORKING',
            label: 'WORKING',
            desc: 'SESSION 01 // MATIN ACTIF',
            badgeClass: 'status-working',
            bodyClass: 'state-working',
            enPoste: true,
            contextText: 'WORKING',
            contextClass: 'context-working'
        };
    }

    // 12h30 - 13h30 (Pause Déjeuner)
    if (minutes >= PLAGES[0].fin && minutes < PLAGES[1].debut) {
        return {
            status: 'BREAK',
            label: 'BREAK',
            desc: 'PAUSE MÉRIDIENNE // REPRISE À 13H30',
            badgeClass: 'status-break',
            bodyClass: 'state-break',
            enPoste: false,
            contextText: 'LUNCH BREAK',
            contextClass: 'context-break'
        };
    }

    // 13h30 - 16h30 (Session Après-midi)
    if (minutes >= PLAGES[1].debut && minutes < PLAGES[1].fin) {
        return {
            status: 'WORKING',
            label: 'WORKING',
            desc: 'SESSION 02 // APRÈS-MIDI ACTIF',
            badgeClass: 'status-working',
            bodyClass: 'state-working',
            enPoste: true,
            contextText: 'WORKING',
            contextClass: 'context-working'
        };
    }

    // Après 16h30 (Journée terminée) -> AFTER WORK (correspond à l'image de référence)
    return {
        status: 'DAY COMPLETE',
        label: 'DAY COMPLETE',
        desc: 'MISSION ACCOMPLIE // 7H EFFECTUÉES',
        badgeClass: 'status-complete',
        bodyClass: 'state-complete',
        enPoste: false,
        contextText: 'AFTER WORK',
        contextClass: 'context-afterwork'
    };
}

/**
 * Calcule le nombre de secondes travaillées aujourd'hui (plafonnées à 25 200 s = 7h)
 */
function getSecondesJournee(dateCible) {
    if (!estJourOuvre(dateCible)) return 0;

    const minutesActuelles = dateCible.getHours() * 60 + dateCible.getMinutes() + dateCible.getSeconds() / 60;
    let totalSecondes = 0;

    for (const plage of PLAGES) {
        if (minutesActuelles > plage.debut) {
            const finEffective = Math.min(minutesActuelles, plage.fin);
            totalSecondes += (finEffective - plage.debut) * 60;
        }
    }
    return Math.min(MAX_MINUTES_JOUR * 60, totalSecondes);
}

/**
 * Calcule le nombre de minutes entières de travail complétées aujourd'hui
 */
function getMinutesTravailleesAujourdhui(dateCible) {
    return Math.floor(getSecondesJournee(dateCible) / 60);
}

/**
 * Calcule les secondes travaillées par session (Matin vs Après-midi)
 */
function getSecondesParCreneau(dateCible) {
    if (!estJourOuvre(dateCible)) return { matin: 0, apresMidi: 0 };

    const minutesActuelles = dateCible.getHours() * 60 + dateCible.getMinutes() + dateCible.getSeconds() / 60;
    let secMatin = 0;
    let secApresMidi = 0;

    // Matin (08h30 - 12h30)
    if (minutesActuelles > PLAGES[0].debut) {
        const finEffective = Math.min(minutesActuelles, PLAGES[0].fin);
        secMatin = (finEffective - PLAGES[0].debut) * 60;
    }

    // Après-midi (13h30 - 16h30)
    if (minutesActuelles > PLAGES[1].debut) {
        const finEffective = Math.min(minutesActuelles, PLAGES[1].fin);
        secApresMidi = (finEffective - PLAGES[1].debut) * 60;
    }

    return { matin: secMatin, apresMidi: secApresMidi };
}

/**
 * Calcule le cumul de secondes pour les jours passés (strictement avant aujourd'hui)
 */
function calculerSecondesJoursPrecedents(debut, dateCourante) {
    if (dateCourante < debut) return 0;

    let cumulSecondes = 0;
    const curseur = new Date(debut.getFullYear(), debut.getMonth(), debut.getDate(), 0, 0, 0);
    const limiteJour = new Date(dateCourante.getFullYear(), dateCourante.getMonth(), dateCourante.getDate(), 0, 0, 0);

    while (curseur < limiteJour) {
        if (estJourOuvre(curseur)) {
            cumulSecondes += MAX_MINUTES_JOUR * 60; // 7h complètes par jour ouvré passé (25 200 s = 55.23 €)
        }
        curseur.setDate(curseur.getDate() + 1);
    }
    return cumulSecondes;
}

/**
 * ==========================================================================
 * EFFETS SONORES JRPG / PERSONA (WEB AUDIO API)
 * ==========================================================================
 */
function initialiserAudioContext() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

/**
 * Son de menu JRPG (Slash métallique rapide)
 */
function jouerSonMenu() {
    if (!audioActif) return;
    try {
        initialiserAudioContext();
        const t = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(650, t);
        osc.frequency.exponentialRampToValueAtTime(1800, t + 0.05);

        gain.gain.setValueAtTime(0.04, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start(t);
        osc.stop(t + 0.07);
    } catch (e) {
        console.warn('Audio non disponible:', e);
    }
}

/**
 * Son de gain financier JRPG (Carillon d'or triomphant)
 */
function emettreSonGain() {
    if (!audioActif) return;
    try {
        initialiserAudioContext();
        const t = audioCtx.currentTime;

        const osc1 = audioCtx.createOscillator();
        const osc2 = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(880, t); // Note La (A5)
        osc1.frequency.exponentialRampToValueAtTime(1760, t + 0.15); // A6

        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(1318.5, t); // Note Mi (E6)

        gain.gain.setValueAtTime(0.09, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(audioCtx.destination);

        osc1.start(t);
        osc2.start(t);
        osc1.stop(t + 0.55);
        osc2.stop(t + 0.55);
    } catch (e) {
        console.warn('Audio non supporté:', e);
    }
}

/**
 * ==========================================================================
 * ANIMATION DU GAIN (P5R 400MS : BADGE FLOTTANT, REBOND & FLASH)
 * ==========================================================================
 */

/**
 * Déclenche l'animation visuelle et sonore du gain de minute
 * - Pop-up "+0.1315 €" avec envol rapide (850ms)
 * - Micro-rebond JRPG sur le montant principal (scale-up, déplacement vertical, rotation ~420ms)
 * - Flash héroïque rouge/jaune sur la carte principale
 * - Carillon d'or triomphant (Web Audio API)
 */
function declencherAnimationGain(montant = TAUX_MINUTE, estSimulation = false) {
    const anchor = document.getElementById('floatingGainAnchor');
    const heroCard = document.getElementById('mainHeroCard');
    const amountWrap = document.getElementById('mainAmountWrap');
    const btnSimuler = document.getElementById('btnSimulerGain');

    // 1. Feedback tactile sur le bouton de simulation
    if (estSimulation && btnSimuler) {
        btnSimuler.classList.remove('btn-vibrating');
        void btnSimuler.offsetWidth;
        btnSimuler.classList.add('btn-vibrating');
        setTimeout(() => {
            if (btnSimuler) btnSimuler.classList.remove('btn-vibrating');
        }, 400);
    }

    // 2. Création du badge pop-up flottant "+0.1315 €"
    if (anchor) {
        const badge = document.createElement('div');
        badge.className = 'p5-floating-badge';
        const montantFormatte = montant.toFixed(4);
        badge.innerHTML = `
            <span class="p5-badge-slash-icon">★</span>
            <span>+${montantFormatte} €</span>
        `;
        anchor.appendChild(badge);

        // Nettoyage garanti dans le DOM après l'animation rapide (850ms)
        setTimeout(() => {
            if (badge.parentNode) {
                badge.parentNode.removeChild(badge);
            }
        }, 850);
    }

    // 3. Micro-rebond dynamique sur le montant principal (#mainAmountWrap)
    if (amountWrap) {
        amountWrap.classList.remove('minute-tick');
        void amountWrap.offsetWidth; // Force reflow
        amountWrap.classList.add('minute-tick');
        setTimeout(() => {
            if (amountWrap) amountWrap.classList.remove('minute-tick');
        }, 450);
    }

    // 4. Flash héroïque bref sur la carte principale (#mainHeroCard)
    if (heroCard) {
        heroCard.classList.remove('p5-gain-flash');
        void heroCard.offsetWidth; // Force reflow
        heroCard.classList.add('p5-gain-flash');
        setTimeout(() => {
            if (heroCard) heroCard.classList.remove('p5-gain-flash');
        }, 450);
    }

    // 5. Carillon sonore P5R
    emettreSonGain();
}

/**
 * ==========================================================================
 * GESTION DU CRÉDIT DES MINUTES & SYNCHRONISATION DES COMPTEURS
 * ==========================================================================
 */

/**
 * Crédite un nombre donné de minutes complètes de salaire
 * Applique strictement le plafond journalier de 420 minutes (55.23 €)
 * Déclenche l'animation et met à jour immédiatement l'UI
 */
function crediterMinutes(nbMinutes = 1, estSimulation = false) {
    const totalActuel = creditedMinutesAujourdhui + bonusSimuleMinutes;
    if (totalActuel >= MAX_MINUTES_JOUR) return;

    const minutesRestantes = MAX_MINUTES_JOUR - totalActuel;
    const minutesACrediter = Math.min(nbMinutes, minutesRestantes);
    if (minutesACrediter <= 0) return;

    if (estSimulation) {
        bonusSimuleMinutes += minutesACrediter;
    } else {
        creditedMinutesAujourdhui += minutesACrediter;
    }

    const gain = minutesACrediter * TAUX_MINUTE;
    declencherAnimationGain(gain, estSimulation);
    rafraichirAffichageMontants(new Date());
}

/**
 * Rétrocompatibilité : fonction passerelle
 */
function declencherNotificationGain(montant = TAUX_MINUTE, estSimulation = false) {
    crediterMinutes(1, estSimulation);
}

/**
 * Met à jour l'affichage de tous les montants et indicateurs (synchrone et cohérent)
 */
function rafraichirAffichageMontants(maintenant) {
    const totalMinutesAujourdhui = Math.min(MAX_MINUTES_JOUR, creditedMinutesAujourdhui + bonusSimuleMinutes);
    const gagneAujourdhui = totalMinutesAujourdhui * TAUX_MINUTE;

    // Calcul des totaux mensuel et contrat synchronisés avec le jour
    const debutMois = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1, 0, 0, 0);
    const debutMoisEffectif = debutMois < DATE_DEBUT_CONTRAT ? DATE_DEBUT_CONTRAT : debutMois;
    const secondesPasseesMois = calculerSecondesJoursPrecedents(debutMoisEffectif, maintenant);
    const gagneMois = (secondesPasseesMois * TAUX_SECONDE) + gagneAujourdhui;

    const secondesPasseesTotal = calculerSecondesJoursPrecedents(DATE_DEBUT_CONTRAT, maintenant);
    const gagneTotal = (secondesPasseesTotal * TAUX_SECONDE) + gagneAujourdhui;

    // 1. Affichage du montant principal (strictement discret à la minute)
    const jourEl = document.getElementById('jour');
    const moisEl = document.getElementById('mois');
    const totalEl = document.getElementById('total');

    if (jourEl) jourEl.innerText = gagneAujourdhui.toFixed(4);
    if (moisEl) moisEl.innerText = gagneMois.toFixed(2);
    if (totalEl) totalEl.innerText = gagneTotal.toFixed(2);

    // 2. Progression journalière (7h = 420 minutes)
    const ratioJour = Math.min(1, totalMinutesAujourdhui / MAX_MINUTES_JOUR);
    const pourcentageJour = Math.min(100, ratioJour * 100);
    const heuresTravailleesTotal = totalMinutesAujourdhui / 60;

    const progressFill = document.getElementById('progressBarFill');
    const progressText = document.getElementById('progressionPourcent');
    const heuresText = document.getElementById('heuresTravaillees');

    if (progressFill) progressFill.style.width = `${pourcentageJour.toFixed(1)}%`;
    if (progressText) progressText.innerText = `${pourcentageJour.toFixed(1)} %`;
    if (heuresText) heuresText.innerText = `(${heuresTravailleesTotal.toFixed(1)}h / 7h)`;

    // 3. Décomposition des créneaux (Matin & Après-midi) dans la section Analyse
    const barMatin = document.getElementById('slotBarMorning');
    const barApresMidi = document.getElementById('slotBarAfternoon');
    const txtMatin = document.getElementById('slotMorningText');
    const txtApresMidi = document.getElementById('slotAfternoonText');

    const minutesMatin = Math.min(240, totalMinutesAujourdhui);
    const minutesApresMidi = Math.max(0, Math.min(180, totalMinutesAujourdhui - 240));

    if (barMatin) {
        const pctMatin = Math.min(100, (minutesMatin / 240) * 100);
        barMatin.style.width = `${pctMatin.toFixed(1)}%`;
        if (txtMatin) txtMatin.innerText = `${pctMatin.toFixed(1)}% accompli • ${(minutesMatin * TAUX_MINUTE).toFixed(2)} € / 31.56 €`;
    }
    if (barApresMidi) {
        const pctApresMidi = Math.min(100, (minutesApresMidi / 180) * 100);
        barApresMidi.style.width = `${pctApresMidi.toFixed(1)}%`;
        if (txtApresMidi) txtApresMidi.innerText = `${pctApresMidi.toFixed(1)}% accompli • ${(minutesApresMidi * TAUX_MINUTE).toFixed(2)} € / 23.67 €`;
    }
}

/**
 * ==========================================================================
 * DATE & HEURE — HUD TEMPOREL STYLE PERSONA 5 ROYAL
 * ==========================================================================
 */
function mettreAJourDateHUD(date, statusInfo) {
    const joursAnglais = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const moisAnglais = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];

    const jourNom = joursAnglais[date.getDay()];
    const jourNum = String(date.getDate()).padStart(2, '0');
    const moisNum = String(date.getMonth() + 1).padStart(2, '0');
    const moisNom = moisAnglais[date.getMonth()];
    const annee = date.getFullYear();

    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');

    // 1. HUD Temporel Sticker Persona 5 Royal (Top-Left)
    const hudBigDay = document.getElementById('hudBigDay');
    const hudMonthNum = document.getElementById('hudMonthNum');
    const hudMonthName = document.getElementById('hudMonthName');
    const hudWeekdayText = document.getElementById('hudWeekdayText');
    const hudContextPill = document.getElementById('hudContextPill');
    const hudContextText = document.getElementById('hudContextText');
    const hudLiveClock = document.getElementById('hudLiveClock');
    const hudYearVal = document.getElementById('hudYearVal');

    if (hudBigDay) hudBigDay.innerText = jourNum;
    if (hudMonthNum) hudMonthNum.innerText = moisNum;
    if (hudMonthName) hudMonthName.innerText = moisNom;
    if (hudWeekdayText) hudWeekdayText.innerText = jourNom;
    if (hudContextText && statusInfo.contextText) hudContextText.innerText = statusInfo.contextText;
    if (hudContextPill && statusInfo.contextClass) {
        hudContextPill.className = `sticker-context-pill ${statusInfo.contextClass}`;
    }
    if (hudLiveClock) hudLiveClock.innerText = `${hh}:${mm}:${ss}`;
    if (hudYearVal) hudYearVal.innerText = annee;

    // 2. Rétrocompatibilité éventuelle
    const hudDayName = document.getElementById('hudDayName');
    const hudFullDate = document.getElementById('hudFullDate');
    const hudTimeDisplay = document.getElementById('hudTimeDisplay');

    if (hudDayName) hudDayName.innerText = jourNom;
    if (hudFullDate) hudFullDate.innerText = `${jourNum} ${moisNom} ${annee}`;
    if (hudTimeDisplay) hudTimeDisplay.innerText = `${hh}:${mm}:${ss}`;

    // 3. Statut connecté au contrat (Header droit)
    const badge = document.getElementById('statutBadge');
    const texteStatut = document.getElementById('statutTexte');
    const descStatut = document.getElementById('statutDescription');

    if (badge && texteStatut && descStatut) {
        badge.className = `p5-status-badge ${statusInfo.badgeClass}`;
        texteStatut.innerText = statusInfo.label;
        descStatut.innerText = statusInfo.desc;
    }

    // 4. Application de la classe de thème sur le <body>
    document.body.className = statusInfo.bodyClass;
}

/**
 * Met à jour le curseur dynamique sur le graphique SVG
 */
function mettreAJourGraphiqueCurseur(secondesAujourdhui) {
    const cursor = document.getElementById('svgLiveCursor');
    const dot = document.getElementById('svgLiveDot');
    if (!cursor || !dot) return;

    // Plage temporelle : 08h30 (X = 60) à 16h30 (X = 760) => Largeur = 700
    const ratio = Math.min(1, Math.max(0, secondesAujourdhui / 25200));
    const targetX = 60 + ratio * 700;

    cursor.setAttribute('x1', targetX);
    cursor.setAttribute('x2', targetX);
    dot.setAttribute('cx', targetX);

    // Calcul de la hauteur Y approchée sur la courbe polygonale
    const targetY = 185 - ratio * 185;
    dot.setAttribute('cy', Math.max(10, targetY));
}

/**
 * ==========================================================================
 * BOUCLE PRINCIPALE DE RAFRAÎCHISSEMENT TEMPS RÉEL (1 SECONDE)
 * ==========================================================================
 */
function mettreAJour() {
    const maintenant = new Date();
    const dateJourChaine = maintenant.toDateString();

    // 1. Détection du passage à un nouveau jour (minuit)
    if (dateDernierCalculJour !== null && dateDernierCalculJour !== dateJourChaine) {
        creditedMinutesAujourdhui = 0;
        bonusSimuleMinutes = 0;
    }
    dateDernierCalculJour = dateJourChaine;

    // 2. Détermination de l'état de travail & mise à jour du Date HUD (seconde par seconde)
    const statusInfo = getWorkStatus(maintenant);
    mettreAJourDateHUD(maintenant, statusInfo);

    // 3. Calcul des minutes de travail entières réellement complétées aujourd'hui
    const completedMinutes = getMinutesTravailleesAujourdhui(maintenant);

    // 4. Traitement initial (Boot) vs régime continu
    if (isInitialBoot) {
        // Initialisation silencieuse sans animation
        creditedMinutesAujourdhui = Math.min(MAX_MINUTES_JOUR, completedMinutes);
        isInitialBoot = false;
        rafraichirAffichageMontants(maintenant);
    } else {
        // Régime continu : détection d'une nouvelle minute complète franchie
        if (completedMinutes > creditedMinutesAujourdhui) {
            const diff = completedMinutes - creditedMinutesAujourdhui;
            crediterMinutes(diff, false);
        }
    }

    // 5. Mise à jour du curseur temporel sur le graphique SVG
    const secondesAujourdhui = getSecondesJournee(maintenant);
    mettreAJourGraphiqueCurseur(secondesAujourdhui);
}

/**
 * ==========================================================================
 * INITIALISATION DU SYSTÈME & ÉVÉNEMENTS DU DOM
 * ==========================================================================
 */
document.addEventListener('DOMContentLoaded', () => {
    // 1. Séquence de boot ultra-rapide (500ms maximum)
    const bootScreen = document.getElementById('p5BootScreen');
    const bootStatusText = document.getElementById('bootStatusText');

    setTimeout(() => {
        if (bootStatusText) bootStatusText.innerText = 'STATUS // CONNECTED';
    }, 280);

    setTimeout(() => {
        if (bootScreen) {
            bootScreen.classList.add('boot-done');
        }
    }, 480);

    // 2. Lancement immédiat de la boucle de suivi
    mettreAJour();
    setInterval(mettreAJour, 1000);

    // 3. Navigation par onglets biseautés JRPG
    const tabButtons = document.querySelectorAll('.p5-tab-btn');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            jouerSonMenu();
            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const targetId = btn.getAttribute('data-target');
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // 4. Bouton d'action principal : Simuler Gain (+1 min)
    const btnSimuler = document.getElementById('btnSimulerGain');
    if (btnSimuler) {
        btnSimuler.addEventListener('click', () => {
            jouerSonMenu();
            crediterMinutes(1, true);
        });
    }

    // 5. Bouton Démo Live (Simulation en Continu)
    const btnDemo = document.getElementById('btnDemoToggle');
    const demoLabel = document.getElementById('demoLabel');
    if (btnDemo && demoLabel) {
        btnDemo.addEventListener('click', () => {
            jouerSonMenu();
            modeDemo = !modeDemo;
            if (modeDemo) {
                btnDemo.classList.add('active');
                demoLabel.innerText = 'ACTIVE // TEMPS RÉEL';
                // Crédite immédiatement 1 minute, puis 1 minute toutes les 5 secondes
                crediterMinutes(1, true);
                if (demoInterval) clearInterval(demoInterval);
                demoInterval = setInterval(() => {
                    crediterMinutes(1, true);
                }, 5000);
            } else {
                btnDemo.classList.remove('active');
                demoLabel.innerText = 'INACTIVE';
                if (demoInterval) {
                    clearInterval(demoInterval);
                    demoInterval = null;
                }
                bonusSimuleMinutes = 0;
                rafraichirAffichageMontants(new Date());
            }
            mettreAJour();
        });
    }

    // 6. Bouton Audio SFX
    const btnAudio = document.getElementById('btnAudioToggle');
    const audioLabel = document.getElementById('audioLabel');
    if (btnAudio && audioLabel) {
        btnAudio.addEventListener('click', () => {
            audioActif = !audioActif;
            if (audioActif) {
                btnAudio.classList.add('active');
                audioLabel.innerText = 'ACTIVÉ // STÉRÉO';
                initialiserAudioContext();
                emettreSonGain();
            } else {
                btnAudio.classList.remove('active');
                audioLabel.innerText = 'DÉSACTIVÉ';
            }
        });
    }
});
