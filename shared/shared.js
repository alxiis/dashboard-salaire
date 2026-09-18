/**
 * ==========================================================================
 * SALARY PULSE // SHARED JAVASCRIPT (PERSONA 5 ROYAL JRPG × FINTECH)
 * Moteur audio Web Audio API, horloge Date HUD, persistance et transitions
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

// 2. PERSISTANCE D'ÉTAT GLOBALE (LOCALSTORAGE)
const STORAGE_KEY = 'salary_pulse_state_v2';

function chargerEtatPartage() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const data = JSON.parse(raw);
            return {
                creditedMinutes: Number(data.creditedMinutes) || 0,
                bonusSimuleMinutes: Number(data.bonusSimuleMinutes) || 0,
                dateJour: data.dateJour || null,
                audioActif: Boolean(data.audioActif),
                modeDemo: Boolean(data.modeDemo)
            };
        }
    } catch (e) {
        console.warn('Erreur lecture localStorage:', e);
    }
    return {
        creditedMinutes: 0,
        bonusSimuleMinutes: 0,
        dateJour: null,
        audioActif: false,
        modeDemo: false
    };
}

function sauvegarderEtatPartage(etat) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(etat));
    } catch (e) {
        console.warn('Erreur sauvegarde localStorage:', e);
    }
}

// 3. SYNTHÉTISEUR AUDIO WEB AUDIO API (EFFETS JRPG HAUTE FIDÉLITÉ)
let audioActif = false;
let audioCtx = null;

// Restauration de la préférence audio
const etatInitialAudio = chargerEtatPartage();
audioActif = etatInitialAudio.audioActif;

function initialiserAudioContext() {
    if (!audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
            audioCtx = new AudioContextClass();
        }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

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
    } catch (e) {}
}

function jouerSonSurvol() {
    if (!audioActif) return;
    try {
        initialiserAudioContext();
        const t = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(850, t);
        osc.frequency.exponentialRampToValueAtTime(1300, t + 0.035);

        gain.gain.setValueAtTime(0.025, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start(t);
        osc.stop(t + 0.04);
    } catch (e) {}
}

function jouerSonConfirmation() {
    if (!audioActif) return;
    try {
        initialiserAudioContext();
        const t = audioCtx.currentTime;
        const osc1 = audioCtx.createOscillator();
        const osc2 = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(523.25, t); // C5
        osc1.frequency.setValueAtTime(659.25, t + 0.06); // E5
        osc1.frequency.setValueAtTime(1046.50, t + 0.12); // C6

        osc2.type = 'sawtooth';
        osc2.frequency.setValueAtTime(261.63, t); // C4
        osc2.frequency.setValueAtTime(523.25, t + 0.12); // C5

        gain.gain.setValueAtTime(0.045, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(audioCtx.destination);

        osc1.start(t);
        osc2.start(t);
        osc1.stop(t + 0.28);
        osc2.stop(t + 0.28);
    } catch (e) {}
}

function jouerSonRetour() {
    if (!audioActif) return;
    try {
        initialiserAudioContext();
        const t = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(920, t);
        osc.frequency.exponentialRampToValueAtTime(360, t + 0.12);

        gain.gain.setValueAtTime(0.035, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start(t);
        osc.stop(t + 0.14);
    } catch (e) {}
}

function emettreSonGain() {
    if (!audioActif) return;
    try {
        initialiserAudioContext();
        const t = audioCtx.currentTime;

        const osc1 = audioCtx.createOscillator();
        const osc2 = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(880, t); // A5
        osc1.frequency.exponentialRampToValueAtTime(1760, t + 0.15); // A6

        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(1318.5, t); // E6

        gain.gain.setValueAtTime(0.09, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(audioCtx.destination);

        osc1.start(t);
        osc2.start(t);
        osc1.stop(t + 0.55);
        osc2.stop(t + 0.55);
    } catch (e) {}
}

function synchroniserHeaderAudio() {
    const btnHeaderAudio = document.getElementById('btnHeaderAudio');
    const headerAudioIcon = document.getElementById('headerAudioIcon');
    const headerAudioLabel = document.getElementById('headerAudioLabel');

    if (btnHeaderAudio && headerAudioIcon && headerAudioLabel) {
        if (audioActif) {
            btnHeaderAudio.classList.add('active');
            headerAudioIcon.innerText = '🔊';
            headerAudioLabel.innerText = 'SFX ON';
        } else {
            btnHeaderAudio.classList.remove('active');
            headerAudioIcon.innerText = '🔈';
            headerAudioLabel.innerText = 'SFX OFF';
        }
    }
}

function basculerAudioGlobale() {
    audioActif = !audioActif;
    if (audioActif) {
        initialiserAudioContext();
        emettreSonGain();
    }
    const etat = chargerEtatPartage();
    etat.audioActif = audioActif;
    sauvegarderEtatPartage(etat);
    synchroniserHeaderAudio();
}

// 4. LOGIQUE DE STATUT DE TRAVAIL & ÉVALUATION DES DATES
function estJourOuvre(date) {
    const jour = date.getDay();
    return jour >= 1 && jour <= 5;
}

function getWorkStatus(date, creditedMinutes = 0, bonusSimule = 0, demoActive = false) {
    if (demoActive) {
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

    if ((creditedMinutes + bonusSimule) >= MAX_MINUTES_JOUR) {
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

    if (minutes >= PLAGES[0].debut && minutes < PLAGES[0].fin) {
        return {
            status: 'WORKING',
            label: 'WORKING',
            desc: 'SESSION MATIN // POSTE ACTIF',
            badgeClass: 'status-working',
            bodyClass: 'state-working',
            enPoste: true,
            contextText: 'WORKING',
            contextClass: 'context-working'
        };
    }

    if (minutes >= PLAGES[0].fin && minutes < PLAGES[1].debut) {
        return {
            status: 'BREAK',
            label: 'LUNCH BREAK',
            desc: 'PAUSE DÉJEUNER // REPRISE À 13H30',
            badgeClass: 'status-break',
            bodyClass: 'state-break',
            enPoste: false,
            contextText: 'LUNCH BREAK',
            contextClass: 'context-break'
        };
    }

    if (minutes >= PLAGES[1].debut && minutes < PLAGES[1].fin) {
        return {
            status: 'WORKING',
            label: 'WORKING',
            desc: 'SESSION APRÈS-MIDI // POSTE ACTIF',
            badgeClass: 'status-working',
            bodyClass: 'state-working',
            enPoste: true,
            contextText: 'WORKING',
            contextClass: 'context-working'
        };
    }

    return {
        status: 'DAY COMPLETE',
        label: 'AFTER WORK',
        desc: 'JOURNÉE TERMINÉE // 16H30 DÉPASSÉ',
        badgeClass: 'status-complete',
        bodyClass: 'state-complete',
        enPoste: false,
        contextText: 'AFTER WORK',
        contextClass: 'context-afterwork'
    };
}

// 5. RAFRAÎCHISSEMENT DU STICKER DATE HUD (COLLAGE P5R)
const JOURS_SEMAINE = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
const MOIS_NOMS = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];

function mettreAJourDateHUD(date, statusInfo) {
    const jourIndex = date.getDay();
    const jourNom = JOURS_SEMAINE[jourIndex];
    const moisIndex = date.getMonth();
    const moisNum = String(moisIndex + 1).padStart(2, '0');
    const moisNom = MOIS_NOMS[moisIndex];
    const jourNum = String(date.getDate()).padStart(2, '0');
    const annee = date.getFullYear();

    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');

    // Éléments du sticker
    const hudDayVal = document.getElementById('hudDayVal');
    const hudMonthNum = document.getElementById('hudMonthNum');
    const hudMonthName = document.getElementById('hudMonthName');
    const hudWeekdayText = document.getElementById('hudWeekdayText');
    const hudContextPill = document.getElementById('hudContextPill');
    const hudContextText = document.getElementById('hudContextText');
    const hudLiveClock = document.getElementById('hudLiveClock');
    const hudYearVal = document.getElementById('hudYearVal');

    if (hudDayVal) hudDayVal.innerText = jourNum;
    if (hudMonthNum) hudMonthNum.innerText = moisNum;
    if (hudMonthName) hudMonthName.innerText = moisNom;
    if (hudWeekdayText) hudWeekdayText.innerText = jourNom;

    if (hudContextPill && hudContextText) {
        hudContextPill.className = `sticker-context-pill ${statusInfo.contextClass}`;
        hudContextText.innerText = statusInfo.contextText;
    }

    if (hudLiveClock) hudLiveClock.innerText = `${hh}:${mm}:${ss}`;
    if (hudYearVal) hudYearVal.innerText = annee;

    // Statut header
    const badge = document.getElementById('statutBadge');
    const texteStatut = document.getElementById('statutTexte');
    const descStatut = document.getElementById('statutDescription');

    if (badge && texteStatut && descStatut) {
        badge.className = `p5-status-badge ${statusInfo.badgeClass}`;
        texteStatut.innerText = statusInfo.label;
        descStatut.innerText = statusInfo.desc;
    }
}

// 6. RIDEAU DE TRANSITION UNIVERSEL (WIPE SLASH CINÉMATIQUE)
let transitionEnCours = false;

function declencherWipe(cibleUrl, typeSfx = 'confirm', wipeText = 'TAKE YOUR TIME', wipeSub = 'SYSTEM SHIFTING...') {
    if (transitionEnCours) return;
    transitionEnCours = true;

    if (typeSfx === 'return') {
        jouerSonRetour();
    } else {
        jouerSonConfirmation();
    }

    const wipeEl = document.getElementById('p5TransitionWipe');
    const wipeTextEl = document.getElementById('wipeText');
    const wipeSubEl = document.getElementById('wipeSub');

    if (wipeTextEl) wipeTextEl.innerText = wipeText;
    if (wipeSubEl) wipeSubEl.innerText = wipeSub;

    if (wipeEl) wipeEl.classList.add('is-wiping');

    // Navigation au zénith de la transition (~240ms)
    setTimeout(() => {
        window.location.href = cibleUrl;
    }, 240);
}

// 7. INITIALISATION DU BOUTON AUDIO HEADER PAR DÉFAUT
document.addEventListener('DOMContentLoaded', () => {
    synchroniserHeaderAudio();
    const btnHeaderAudio = document.getElementById('btnHeaderAudio');
    if (btnHeaderAudio) {
        btnHeaderAudio.addEventListener('click', () => {
            basculerAudioGlobale();
        });
    }

    // Gestion du boot screen rapide
    const bootScreen = document.getElementById('p5BootScreen');
    if (bootScreen) {
        setTimeout(() => {
            bootScreen.classList.add('boot-done');
        }, 420);
    }
});

