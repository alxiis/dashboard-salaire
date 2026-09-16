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
const DATE_DEBUT_CONTRAT = new Date(2026, 8, 14, 8, 30, 0); // 14 septembre 2026 à 08h30

// Plages quotidiennes (08h30-12h30 = 240 min ; 13h30-16h30 = 180 min => 7h = 420 min)
const PLAGES = [
    { debut: 8 * 60 + 30, fin: 12 * 60 + 30, dureeSec: 4 * 3600, maxGain: 31.56 }, // Session Matin (4h)
    { debut: 13 * 60 + 30, fin: 16 * 60 + 30, dureeSec: 3 * 3600, maxGain: 23.67 }  // Session Après-midi (3h)
];

// 2. ÉTATS GLOBAUX
let audioActif = false;
let modeDemo = false;
let bonusSimule = 0; // Minutes simulées ajoutées manuellement
let dernierMinuteEnregistree = -1;
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
            enPoste: true
        };
    }

    if (!estJourOuvre(date)) {
        return {
            status: 'OFF DUTY',
            label: 'OFF DUTY',
            desc: 'WEEK-END // SYSTÈME EN VEILLE',
            badgeClass: 'status-offduty',
            bodyClass: 'state-offduty',
            enPoste: false
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
            enPoste: false
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
            enPoste: true
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
            enPoste: false
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
            enPoste: true
        };
    }

    // Après 16h30 (Journée terminée)
    return {
        status: 'DAY COMPLETE',
        label: 'DAY COMPLETE',
        desc: 'MISSION ACCOMPLIE // 7H EFFECTUÉES',
        badgeClass: 'status-complete',
        bodyClass: 'state-complete',
        enPoste: false
    };
}

/**
 * Calcule le nombre de secondes travaillées aujourd'hui
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
    return totalSecondes;
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
 * Calcule le cumul de secondes entre deux dates historiques
 */
function calculerSecondesPeriode(debut, fin) {
    if (fin < debut) return 0;
    let cumulSecondes = 0;
    let curseur = new Date(debut.getTime());

    while (curseur <= fin) {
        if (estJourOuvre(curseur)) {
            const estMemeJourFin = curseur.toDateString() === fin.toDateString();
            if (estMemeJourFin) {
                cumulSecondes += getSecondesJournee(fin);
            } else {
                cumulSecondes += 7 * 3600; // Journée complète = 25 200 s
            }
        }
        curseur.setDate(curseur.getDate() + 1);
        curseur.setHours(0, 0, 0, 0);
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
 * ANIMATION DU COMPTEUR (TICKER FLUIDE & MICRO-REBOND)
 * ==========================================================================
 */
function animerValeur(element, debut, fin, duree, decimales = 4) {
    if (!element) return;
    const debutTemps = performance.now();

    // Ajoute un micro-sursaut visuel lors des montées
    const wrap = document.getElementById('mainAmountWrap');
    if (wrap) {
        wrap.classList.remove('nudge');
        void wrap.offsetWidth;
        wrap.classList.add('nudge');
    }

    function tick(tempsActuel) {
        const ecoule = tempsActuel - debutTemps;
        const progression = Math.min(ecoule / duree, 1);
        
        // Amortissement easeOutCubic
        const facteur = 1 - Math.pow(1 - progression, 3);
        const valeurCourante = debut + (fin - debut) * facteur;

        element.innerText = valeurCourante.toFixed(decimales);

        if (progression < 1) {
            requestAnimationFrame(tick);
        } else {
            element.innerText = fin.toFixed(decimales);
        }
    }

    requestAnimationFrame(tick);
}

/**
 * Déclenche la notification visuelle de gain (+X.XXXX €)
 * avec pop-up oblique, flash héroïque et carillon sonore
 */
function declencherNotificationGain(montant = TAUX_MINUTE, estSimulation = false) {
    const anchor = document.getElementById('floatingGainAnchor');
    const heroCard = document.getElementById('mainHeroCard');
    const jourEl = document.getElementById('jour');
    const moisEl = document.getElementById('mois');
    const totalEl = document.getElementById('total');
    const btnSimuler = document.getElementById('btnSimulerGain');

    if (!anchor || !heroCard) return;

    // 1. Feedback tactile/vibratoire sur le bouton
    if (estSimulation && btnSimuler) {
        btnSimuler.classList.remove('btn-vibrating');
        void btnSimuler.offsetWidth;
        btnSimuler.classList.add('btn-vibrating');
    }

    // 2. Création du badge flottant pop-up
    const badge = document.createElement('div');
    badge.className = 'p5-floating-badge';

    const montantFormatte = montant.toFixed(4);
    badge.innerHTML = `
        <span class="p5-badge-slash-icon">★</span>
        <span>+${montantFormatte} €</span>
    `;

    anchor.appendChild(badge);

    // 3. Flash d'action rouge/jaune sur la carte principale
    heroCard.classList.remove('p5-gain-flash');
    void heroCard.offsetWidth;
    heroCard.classList.add('p5-gain-flash');

    // 4. Roulement fluide du compteur principal
    if (jourEl) {
        const valActuelle = parseFloat(jourEl.innerText) || 0;
        const nouvValeur = valActuelle + montant;
        animerValeur(jourEl, valActuelle, nouvValeur, 650, 4);
    }

    // Impact sur les totaux mensuel et contrat si simulation
    if (estSimulation) {
        bonusSimule += montant;
        if (moisEl) {
            const moisVal = parseFloat(moisEl.innerText) || 0;
            animerValeur(moisEl, moisVal, moisVal + montant, 650, 2);
        }
        if (totalEl) {
            const totalVal = parseFloat(totalEl.innerText) || 0;
            animerValeur(totalEl, totalVal, totalVal + montant, 650, 2);
        }
    }

    // 5. Carillon sonore
    emettreSonGain();

    // 6. Nettoyage du badge dans le DOM
    setTimeout(() => {
        if (badge.parentNode) {
            badge.parentNode.removeChild(badge);
        }
    }, 2200);
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
    const moisNom = moisAnglais[date.getMonth()];
    const annee = date.getFullYear();

    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');

    // Injection dans le HUD
    const hudDayName = document.getElementById('hudDayName');
    const hudFullDate = document.getElementById('hudFullDate');
    const hudTimeDisplay = document.getElementById('hudTimeDisplay');

    if (hudDayName) hudDayName.innerText = jourNom;
    if (hudFullDate) hudFullDate.innerText = `${jourNum} ${moisNom} ${annee}`;
    if (hudTimeDisplay) hudTimeDisplay.innerText = `${hh}:${mm}:${ss}`;

    // Statut connecté au contrat
    const badge = document.getElementById('statutBadge');
    const texteStatut = document.getElementById('statutTexte');
    const descStatut = document.getElementById('statutDescription');

    if (badge && texteStatut && descStatut) {
        badge.className = `p5-status-badge ${statusInfo.badgeClass}`;
        texteStatut.innerText = statusInfo.label;
        descStatut.innerText = statusInfo.desc;
    }

    // Application de la classe de thème sur le <body>
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
 * BOUCLE PRINCIPALE DE RAFRAÎCHISSEMENT TEMPS RÉEL
 * ==========================================================================
 */
function mettreAJour() {
    const maintenant = new Date();

    // 1. Détermination de l'état de travail & mise à jour du HUD
    const statusInfo = getWorkStatus(maintenant);
    mettreAJourDateHUD(maintenant, statusInfo);

    // 2. Calculs du temps travaillé aujourd'hui
    let secondesAujourdhui = getSecondesJournee(maintenant);
    if (modeDemo) {
        secondesAujourdhui = Math.max(secondesAujourdhui, 4.5 * 3600);
    }
    const gagneAujourdhui = (secondesAujourdhui * TAUX_SECONDE) + bonusSimule;

    // 3. Calculs mensuel et contrat
    const debutMois = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1, 0, 0, 0);
    const debutMoisEffectif = debutMois < DATE_DEBUT_CONTRAT ? DATE_DEBUT_CONTRAT : debutMois;
    const secondesMois = calculerSecondesPeriode(debutMoisEffectif, maintenant);
    const gagneMois = (secondesMois * TAUX_SECONDE) + bonusSimule;

    const secondesTotal = calculerSecondesPeriode(DATE_DEBUT_CONTRAT, maintenant);
    const gagneTotal = (secondesTotal * TAUX_SECONDE) + bonusSimule;

    // 4. Progression journalière (7h = 25 200 secondes)
    const maxSecondesJour = 7 * 3600;
    const ratioJour = Math.min(1, (secondesAujourdhui / maxSecondesJour));
    const pourcentageJour = Math.min(100, ratioJour * 100);
    const heuresTravailleesTotal = Math.min(7, (secondesAujourdhui / 3600));

    const progressFill = document.getElementById('progressBarFill');
    const progressText = document.getElementById('progressionPourcent');
    const heuresText = document.getElementById('heuresTravaillees');

    if (progressFill) progressFill.style.width = `${pourcentageJour.toFixed(1)}%`;
    if (progressText) progressText.innerText = `${pourcentageJour.toFixed(1)} %`;
    if (heuresText) heuresText.innerText = `(${heuresTravailleesTotal.toFixed(1)}h / 7h)`;

    // 5. Décomposition de la section analyse (Créneau Matin & Après-midi)
    const creneaux = getSecondesParCreneau(maintenant);
    const barMatin = document.getElementById('slotBarMorning');
    const barApresMidi = document.getElementById('slotBarAfternoon');
    const txtMatin = document.getElementById('slotMorningText');
    const txtApresMidi = document.getElementById('slotAfternoonText');

    if (barMatin) {
        const pctMatin = Math.min(100, (creneaux.matin / (4 * 3600)) * 100);
        barMatin.style.width = `${pctMatin.toFixed(1)}%`;
        if (txtMatin) txtMatin.innerText = `${pctMatin.toFixed(1)}% accompli • ${(creneaux.matin * TAUX_SECONDE).toFixed(2)} € / 31.56 €`;
    }
    if (barApresMidi) {
        const pctApresMidi = Math.min(100, (creneaux.apresMidi / (3 * 3600)) * 100);
        barApresMidi.style.width = `${pctApresMidi.toFixed(1)}%`;
        if (txtApresMidi) txtApresMidi.innerText = `${pctApresMidi.toFixed(1)}% accompli • ${(creneaux.apresMidi * TAUX_SECONDE).toFixed(2)} € / 23.67 €`;
    }

    // 6. Mise à jour du curseur temporel sur le graphique SVG
    mettreAJourGraphiqueCurseur(secondesAujourdhui);

    // 7. Affichage des montants
    const heroCard = document.getElementById('mainHeroCard');
    const jourEl = document.getElementById('jour');
    const moisEl = document.getElementById('mois');
    const totalEl = document.getElementById('total');

    if (jourEl && !heroCard.classList.contains('p5-gain-flash')) {
        jourEl.innerText = gagneAujourdhui.toFixed(4);
    }
    if (moisEl && !heroCard.classList.contains('p5-gain-flash')) {
        moisEl.innerText = gagneMois.toFixed(2);
    }
    if (totalEl && !heroCard.classList.contains('p5-gain-flash')) {
        totalEl.innerText = gagneTotal.toFixed(2);
    }

    // 8. Détection du passage de minute pour le déclencheur de gain
    const minuteActuelle = maintenant.getMinutes();
    if (dernierMinuteEnregistree !== -1 && minuteActuelle !== dernierMinuteEnregistree) {
        if (statusInfo.enPoste) {
            declencherNotificationGain(TAUX_MINUTE, false);
        }
    }
    dernierMinuteEnregistree = minuteActuelle;
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
            declencherNotificationGain(TAUX_MINUTE, true);
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
                declencherNotificationGain(TAUX_MINUTE, true);
            } else {
                btnDemo.classList.remove('active');
                demoLabel.innerText = 'INACTIVE';
                bonusSimule = 0;
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
