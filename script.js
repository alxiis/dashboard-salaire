/**
 * Configuration & Constantes du contrat
 */
const TAUX_HORAIRE_NET = 7.89;
const TAUX_SECONDE = TAUX_HORAIRE_NET / 3600;
const TAUX_MINUTE = TAUX_HORAIRE_NET / 60;
const GAIN_JOUR_MAX = 7 * TAUX_HORAIRE_NET;
const DATE_DEBUT_CONTRAT = new Date(2026, 8, 14, 8, 30, 0);

const PLAGES = [
    { debut: 8 * 60 + 30, fin: 12 * 60 + 30 },
    { debut: 13 * 60 + 30, fin: 16 * 60 + 30 }
];

let audioActif = false;
let modeDemo = false;
let bonusSimule = 0;
let dernierMinuteEnregistree = -1;
let audioCtx = null;

function estJourOuvre(date) {
    const jour = date.getDay();
    return jour >= 1 && jour <= 5;
}

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
                cumulSecondes += 7 * 3600;
            }
        }
        curseur.setDate(curseur.getDate() + 1);
        curseur.setHours(0, 0, 0, 0);
    }
    return cumulSecondes;
}

function emettreSonGain() {
    if (!audioActif) return;
    try {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        const maintenant = audioCtx.currentTime;

        const osc1 = audioCtx.createOscillator();
        const osc2 = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(880, maintenant);
        osc1.frequency.exponentialRampToValueAtTime(1760, maintenant + 0.15);

        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(1318.5, maintenant);

        gain.gain.setValueAtTime(0.08, maintenant);
        gain.gain.exponentialRampToValueAtTime(0.0001, maintenant + 0.55);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(audioCtx.destination);

        osc1.start(maintenant);
        osc2.start(maintenant);
        osc1.stop(maintenant + 0.55);
        osc2.stop(maintenant + 0.55);
    } catch (e) {
        console.warn('Audio non supporté ou bloqué:', e);
    }
}

function animerValeur(element, debut, fin, duree, decimales = 4) {
    if (!element) return;
    const debutTemps = performance.now();

    function tick(tempsActuel) {
        const ecoule = tempsActuel - debutTemps;
        const progression = Math.min(ecoule / duree, 1);
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

function declencherNotificationGain(montant = TAUX_MINUTE, estSimulation = false) {
    const anchor = document.getElementById('floatingGainAnchor');
    const heroCard = document.getElementById('mainHeroCard');
    const jourEl = document.getElementById('jour');
    const moisEl = document.getElementById('mois');
    const totalEl = document.getElementById('total');
    if (!anchor || !heroCard) return;

    const badge = document.createElement('div');
    badge.className = 'floating-gain-badge';

    const montantFormatte = montant.toFixed(4);
    badge.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="18 15 12 9 6 15"></polyline>
        </svg>
        <span>+${montantFormatte} €</span>
    `;

    anchor.appendChild(badge);

    heroCard.classList.remove('gain-pulse-flash');
    void heroCard.offsetWidth;
    heroCard.classList.add('gain-pulse-flash');

    if (jourEl) {
        const valActuelle = parseFloat(jourEl.innerText) || 0;
        const nouvValeur = valActuelle + montant;
        animerValeur(jourEl, valActuelle, nouvValeur, 750, 4);
    }

    if (estSimulation) {
        bonusSimule += montant;
        if (moisEl) {
            const moisVal = parseFloat(moisEl.innerText) || 0;
            animerValeur(moisEl, moisVal, moisVal + montant, 750, 2);
        }
        if (totalEl) {
            const totalVal = parseFloat(totalEl.innerText) || 0;
            animerValeur(totalEl, totalVal, totalVal + montant, 750, 2);
        }
    }

    emettreSonGain();

    setTimeout(() => {
        if (badge.parentNode) {
            badge.parentNode.removeChild(badge);
        }
    }, 2200);
}

function formaterDateFr(date) {
    const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    const dateStr = date.toLocaleDateString('fr-FR', options);
    const heureStr = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    return `${dateStr.charAt(0).toUpperCase() + dateStr.slice(1)} • ${heureStr}`;
}

function mettreAJour() {
    const maintenant = new Date();

    const dateDisplayEl = document.getElementById('liveDateDisplay');
    if (dateDisplayEl) {
        dateDisplayEl.innerText = formaterDateFr(maintenant);
    }

    let secondesAujourdhui = getSecondesJournee(maintenant);
    if (modeDemo) {
        secondesAujourdhui = Math.max(secondesAujourdhui, 3.5 * 3600);
    }
    const gagneAujourdhui = (secondesAujourdhui * TAUX_SECONDE) + bonusSimule;

    const debutMois = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1, 0, 0, 0);
    const debutMoisEffectif = debutMois < DATE_DEBUT_CONTRAT ? DATE_DEBUT_CONTRAT : debutMois;
    const secondesMois = calculerSecondesPeriode(debutMoisEffectif, maintenant);
    const gagneMois = (secondesMois * TAUX_SECONDE) + bonusSimule;

    const secondesTotal = calculerSecondesPeriode(DATE_DEBUT_CONTRAT, maintenant);
    const gagneTotal = (secondesTotal * TAUX_SECONDE) + bonusSimule;

    const minutes = maintenant.getHours() * 60 + maintenant.getMinutes();
    const reelEnPoste = estJourOuvre(maintenant) && PLAGES.some(p => minutes >= p.debut && minutes < p.fin);
    const enPoste = modeDemo || reelEnPoste;

    const badge = document.getElementById('statutBadge');
    const texteStatut = document.getElementById('statutTexte');

    if (modeDemo) {
        badge.className = 'status-pill en-poste';
        texteStatut.innerText = 'En poste (Mode Démo actif)';
    } else if (reelEnPoste) {
        badge.className = 'status-pill en-poste';
        texteStatut.innerText = 'En poste (compteur actif)';
    } else {
        badge.className = 'status-pill hors-poste';
        texteStatut.innerText = 'Hors horaires de travail';
    }

    const maxSecondesJour = 7 * 3600;
    const pourcentageJour = Math.min(100, (secondesAujourdhui / maxSecondesJour) * 100);

    const progressFill = document.getElementById('progressBarFill');
    const progressText = document.getElementById('progressionPourcent');
    if (progressFill && progressText) {
        progressFill.style.width = `${pourcentageJour.toFixed(1)}%`;
        progressText.innerText = `${pourcentageJour.toFixed(1)}% (${(secondesAujourdhui / 3600).toFixed(1)}h / 7h)`;
    }

    const heroCard = document.getElementById('mainHeroCard');
    const jourEl = document.getElementById('jour');
    const moisEl = document.getElementById('mois');
    const totalEl = document.getElementById('total');

    if (jourEl && !heroCard.classList.contains('gain-pulse-flash')) {
        jourEl.innerText = gagneAujourdhui.toFixed(4);
    }
    if (moisEl && !heroCard.classList.contains('gain-pulse-flash')) {
        moisEl.innerText = gagneMois.toFixed(2);
    }
    if (totalEl && !heroCard.classList.contains('gain-pulse-flash')) {
        totalEl.innerText = gagneTotal.toFixed(2);
    }

    const minuteActuelle = maintenant.getMinutes();
    if (dernierMinuteEnregistree !== -1 && minuteActuelle !== dernierMinuteEnregistree) {
        if (enPoste) {
            declencherNotificationGain(TAUX_MINUTE, false);
        }
    }
    dernierMinuteEnregistree = minuteActuelle;
}

document.addEventListener('DOMContentLoaded', () => {
    mettreAJour();
    setInterval(mettreAJour, 1000);

    const btnSimuler = document.getElementById('btnSimulerGain');
    if (btnSimuler) {
        btnSimuler.addEventListener('click', () => {
            declencherNotificationGain(TAUX_MINUTE, true);
        });
    }

    const btnDemo = document.getElementById('btnDemoToggle');
    const demoLabel = document.getElementById('demoLabel');
    if (btnDemo && demoLabel) {
        btnDemo.addEventListener('click', () => {
            modeDemo = !modeDemo;
            if (modeDemo) {
                btnDemo.classList.add('active');
                demoLabel.innerText = 'Démo live : Active';
                declencherNotificationGain(TAUX_MINUTE, true);
            } else {
                btnDemo.classList.remove('active');
                demoLabel.innerText = 'Démo live : Inactive';
                bonusSimule = 0;
            }
            mettreAJour();
        });
    }

    const btnAudio = document.getElementById('btnAudioToggle');
    const audioLabel = document.getElementById('audioLabel');
    const audioIcon = document.getElementById('audioIcon');

    if (btnAudio && audioLabel && audioIcon) {
        btnAudio.addEventListener('click', () => {
            audioActif = !audioActif;
            if (audioActif) {
                btnAudio.classList.add('active');
                audioLabel.innerText = 'Son : Actif';
                audioIcon.innerHTML = `
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                `;
                emettreSonGain();
            } else {
                btnAudio.classList.remove('active');
                audioLabel.innerText = 'Son : Désactivé';
                audioIcon.innerHTML = `
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                    <line x1="23" y1="9" x2="17" y2="15"></line>
                    <line x1="17" y1="9" x2="23" y2="15"></line>
                `;
            }
        });
    }
});
