/**
 * ==========================================================================
 * SALARY PULSE // P5R ROYALE ENGINE (JAVASCRIPT VANILLA)
 * Moteur haute précision pour le suivi salarial, les animations et les SFX
 * ==========================================================================
 */

// Paramètres légaux & financiers du contrat
const TAUX_HORAIRE_NET = 7.89;
const TAUX_SECONDE = TAUX_HORAIRE_NET / 3600;
const TAUX_MINUTE = TAUX_HORAIRE_NET / 60; // ≈ 0.1315 €
const GAIN_JOUR_MAX = 7 * TAUX_HORAIRE_NET; // 55.23 €
const DATE_DEBUT_CONTRAT = new Date(2026, 8, 14, 8, 30, 0); // 14 septembre 2026 à 08h30

// Plages quotidiennes en minutes depuis minuit (08h30-12h30 = 240 min ; 13h30-16h30 = 180 min => 7h = 420 min)
const PLAGES = [
    { debut: 8 * 60 + 30, fin: 12 * 60 + 30, dureeSec: 4 * 3600, maxGain: 4 * TAUX_HORAIRE_NET }, // Matin (31.56 €)
    { debut: 13 * 60 + 30, fin: 16 * 60 + 30, dureeSec: 3 * 3600, maxGain: 3 * TAUX_HORAIRE_NET }  // Après-midi (23.67 €)
];

// États globaux de l'application
let audioActif = false;
let modeDemo = false;
let bonusSimule = 0; // Cumul des minutes simulées
let dernierMinuteEnregistree = -1;
let audioCtx = null;

/**
 * Détermine si une date correspond à un jour ouvré (Lundi = 1 à Vendredi = 5)
 */
function estJourOuvre(date) {
    const jour = date.getDay();
    return jour >= 1 && jour <= 5;
}

/**
 * Calcule le nombre de secondes travaillées sur une journée donnée jusqu'à une date précise
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
 * Calcule la décomposition des secondes travaillées par créneau (Matin vs Après-midi)
 */
function getSecondesParCreneau(dateCible) {
    if (!estJourOuvre(dateCible)) return { matin: 0, apresMidi: 0 };

    const minutesActuelles = dateCible.getHours() * 60 + dateCible.getMinutes() + dateCible.getSeconds() / 60;
    let secMatin = 0;
    let secApresMidi = 0;

    // Créneau 1 : Matin (08h30 - 12h30)
    if (minutesActuelles > PLAGES[0].debut) {
        const finEffective = Math.min(minutesActuelles, PLAGES[0].fin);
        secMatin = (finEffective - PLAGES[0].debut) * 60;
    }

    // Créneau 2 : Après-midi (13h30 - 16h30)
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
 * Son de menu JRPG : Slash / Bip métallique rapide lors des interactions
 */
function jouerSonMenu() {
    if (!audioActif) return;
    try {
        initialiserAudioContext();
        const t = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(600, t);
        osc.frequency.exponentialRampToValueAtTime(1600, t + 0.06);

        gain.gain.setValueAtTime(0.04, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start(t);
        osc.stop(t + 0.08);
    } catch (e) {
        console.warn('Audio non disponible:', e);
    }
}

/**
 * Son de gain : Carillon éclatant type pièce d'or / récompense JRPG
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

        gain.gain.setValueAtTime(0.08, t);
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
 * Animation fluide de roulement de chiffres (Smooth Counter / Ticker)
 */
function animerValeur(element, debut, fin, duree, decimales = 4) {
    if (!element) return;
    const debutTemps = performance.now();

    function tick(tempsActuel) {
        const ecoule = tempsActuel - debutTemps;
        const progression = Math.min(ecoule / duree, 1);
        
        // Formule d'amortissement easeOutCubic
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
 * Déclenche la notification visuelle de gain flottante (+X.XXXX €)
 * avec pop-up oblique, flash héroïque et carillon sonore
 */
function declencherNotificationGain(montant = TAUX_MINUTE, estSimulation = false) {
    const anchor = document.getElementById('floatingGainAnchor');
    const heroCard = document.getElementById('mainHeroCard');
    const jourEl = document.getElementById('jour');
    const moisEl = document.getElementById('mois');
    const totalEl = document.getElementById('total');
    if (!anchor || !heroCard) return;

    // 1. Création du badge flottant
    const badge = document.createElement('div');
    badge.className = 'p5-floating-badge';

    const montantFormatte = montant.toFixed(4);
    badge.innerHTML = `
        <span class="p5-badge-slash-icon">★</span>
        <span>+${montantFormatte} €</span>
    `;

    anchor.appendChild(badge);

    // 2. Flash d'action rouge/jaune sur la carte principale
    heroCard.classList.remove('p5-gain-flash');
    void heroCard.offsetWidth; // Force le reflow du navigateur
    heroCard.classList.add('p5-gain-flash');

    // 3. Roulement fluide du compteur principal
    if (jourEl) {
        const valActuelle = parseFloat(jourEl.innerText) || 0;
        const nouvValeur = valActuelle + montant;
        animerValeur(jourEl, valActuelle, nouvValeur, 700, 4);
    }

    // Impact sur les totaux si simulation manuelle
    if (estSimulation) {
        bonusSimule += montant;
        if (moisEl) {
            const moisVal = parseFloat(moisEl.innerText) || 0;
            animerValeur(moisEl, moisVal, moisVal + montant, 700, 2);
        }
        if (totalEl) {
            const totalVal = parseFloat(totalEl.innerText) || 0;
            animerValeur(totalEl, totalVal, totalVal + montant, 700, 2);
        }
    }

    // 4. Carillon sonore
    emettreSonGain();

    // 5. Nettoyage automatique du DOM à la fin de l'animation
    setTimeout(() => {
        if (badge.parentNode) {
            badge.parentNode.removeChild(badge);
        }
    }, 2200);
}

/**
 * Formate la date et l'heure courante en français
 */
function formaterDateFr(date) {
    const jours = ['DIMANCHE', 'LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI'];
    const mois = ['JAN', 'FEV', 'MAR', 'AVR', 'MAI', 'JUIN', 'JUIL', 'AOU', 'SEP', 'OCT', 'NOV', 'DEC'];
    
    const jourSemaine = jours[date.getDay()];
    const jourNum = String(date.getDate()).padStart(2, '0');
    const moisNom = mois[date.getMonth()];
    const heure = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    const seconde = String(date.getSeconds()).padStart(2, '0');

    return `${jourSemaine} ${jourNum} ${moisNom} // ${heure}:${minute}:${seconde}`;
}

/**
 * Boucle principale de rafraîchissement temps réel
 */
function mettreAJour() {
    const maintenant = new Date();

    // 1. Horloge système du header
    const dateDisplayEl = document.getElementById('liveDateDisplay');
    if (dateDisplayEl) {
        dateDisplayEl.innerText = formaterDateFr(maintenant);
    }

    // 2. Calculs du temps travaillé aujourd'hui
    let secondesAujourdhui = getSecondesJournee(maintenant);
    if (modeDemo) {
        // En mode démo, simuler une activité de milieu d'après-midi dynamique
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

    // 4. Statut en direct (En poste vs Hors horaires)
    const minutes = maintenant.getHours() * 60 + maintenant.getMinutes();
    const reelEnPoste = estJourOuvre(maintenant) && PLAGES.some(p => minutes >= p.debut && minutes < p.fin);
    const enPoste = modeDemo || reelEnPoste;

    const badge = document.getElementById('statutBadge');
    const texteStatut = document.getElementById('statutTexte');

    if (badge && texteStatut) {
        if (modeDemo) {
            badge.className = 'p5-status-badge en-poste';
            texteStatut.innerText = 'EN MISSION // MODE DÉMO';
        } else if (reelEnPoste) {
            badge.className = 'p5-status-badge en-poste';
            texteStatut.innerText = 'EN MISSION // ACTIF';
        } else {
            badge.className = 'p5-status-badge hors-poste';
            texteStatut.innerText = 'HORS HORAIRES';
        }
    }

    // 5. Progression journalière (7h = 25 200 secondes)
    const maxSecondesJour = 7 * 3600;
    const pourcentageJour = Math.min(100, (secondesAujourdhui / maxSecondesJour) * 100);
    const heuresTravailleesTotal = Math.min(7, (secondesAujourdhui / 3600));

    const progressFill = document.getElementById('progressBarFill');
    const progressText = document.getElementById('progressionPourcent');
    const heuresText = document.getElementById('heuresTravaillees');

    if (progressFill) progressFill.style.width = `${pourcentageJour.toFixed(1)}%`;
    if (progressText) progressText.innerText = `${pourcentageJour.toFixed(1)} %`;
    if (heuresText) heuresText.innerText = `(${heuresTravailleesTotal.toFixed(1)}h / 7h)`;

    // 6. Décomposition de la section analyse (Créneau Matin & Après-midi)
    const creneaux = getSecondesParCreneau(maintenant);
    const barMatin = document.getElementById('slotBarMorning');
    const barApresMidi = document.getElementById('slotBarAfternoon');

    if (barMatin) {
        const pctMatin = Math.min(100, (creneaux.matin / (4 * 3600)) * 100);
        barMatin.style.width = `${pctMatin.toFixed(1)}%`;
    }
    if (barApresMidi) {
        const pctApresMidi = Math.min(100, (creneaux.apresMidi / (3 * 3600)) * 100);
        barApresMidi.style.width = `${pctApresMidi.toFixed(1)}%`;
    }

    // 7. Affichage des montants avec chiffres tabulaires
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

    // 8. Détection du passage de minute pour déclencher la notification en temps réel
    const minuteActuelle = maintenant.getMinutes();
    if (dernierMinuteEnregistree !== -1 && minuteActuelle !== dernierMinuteEnregistree) {
        if (enPoste) {
            declencherNotificationGain(TAUX_MINUTE, false);
        }
    }
    dernierMinuteEnregistree = minuteActuelle;
}

/**
 * ==========================================================================
 * INITIALISATION DES ÉVÉNEMENTS DU DOM
 * ==========================================================================
 */
document.addEventListener('DOMContentLoaded', () => {
    // 1. Démarrage de la boucle de calcul
    mettreAJour();
    setInterval(mettreAJour, 1000);

    // 2. Navigation par onglets biseautés P5R
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

    // 3. Bouton Simuler Gain (+1 min)
    const btnSimuler = document.getElementById('btnSimulerGain');
    if (btnSimuler) {
        btnSimuler.addEventListener('click', () => {
            jouerSonMenu();
            declencherNotificationGain(TAUX_MINUTE, true);
        });
    }

    // 4. Bouton Mode Démo Live
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

    // 5. Bouton Audio SFX
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
