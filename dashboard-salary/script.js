/**
 * ==========================================================================
 * DASHBOARD SALARY // ENGINE CONTROLLER (PERSONA 5 ROYAL JRPG × FINTECH)
 * Moteur de calcul discret à la minute (+0.1315 €), graphiques SVG et tabs
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {

    // 1. ÉTAT DU MOTEUR SALARIAL DISCRET
    let creditedMinutesAujourdhui = 0;
    let bonusSimuleMinutes = 0;
    let dateDernierCalculJour = null;
    let isInitialBoot = true;
    let modeDemo = false;
    let demoInterval = null;

    // Récupération de l'état persistant
    const maintenant = new Date();
    const dateJourChaine = maintenant.toDateString();
    const etatSauvegarde = chargerEtatPartage();

    if (etatSauvegarde.dateJour === dateJourChaine) {
        creditedMinutesAujourdhui = etatSauvegarde.creditedMinutes || 0;
        bonusSimuleMinutes = etatSauvegarde.bonusSimuleMinutes || 0;
        modeDemo = etatSauvegarde.modeDemo || false;
    } else {
        creditedMinutesAujourdhui = 0;
        bonusSimuleMinutes = 0;
        modeDemo = false;
    }
    dateDernierCalculJour = dateJourChaine;

    function synchroniserPersistance() {
        sauvegarderEtatPartage({
            creditedMinutes: creditedMinutesAujourdhui,
            bonusSimuleMinutes: bonusSimuleMinutes,
            dateJour: dateDernierCalculJour,
            audioActif: audioActif,
            modeDemo: modeDemo
        });
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
     * Calcule le cumul de secondes pour les jours passés (strictement avant aujourd'hui)
     */
    function calculerSecondesJoursPrecedents(debut, dateCourante) {
        if (dateCourante < debut) return 0;

        let cumulSecondes = 0;
        const curseur = new Date(debut.getFullYear(), debut.getMonth(), debut.getDate(), 0, 0, 0);
        const limiteJour = new Date(dateCourante.getFullYear(), dateCourante.getMonth(), dateCourante.getDate(), 0, 0, 0);

        while (curseur < limiteJour) {
            if (estJourOuvre(curseur)) {
                cumulSecondes += MAX_MINUTES_JOUR * 60;
            }
            curseur.setDate(curseur.getDate() + 1);
        }
        return cumulSecondes;
    }

    /**
     * Déclenche l'animation visuelle et sonore du gain de minute
     */
    function declencherAnimationGain(montant = TAUX_MINUTE, estSimulation = false) {
        const anchor = document.getElementById('floatingGainAnchor');
        const heroCard = document.getElementById('mainHeroCard');
        const amountWrap = document.getElementById('mainAmountWrap');
        const btnSimuler = document.getElementById('btnSimulerGain');

        if (estSimulation && btnSimuler) {
            btnSimuler.classList.remove('btn-vibrating');
            void btnSimuler.offsetWidth;
            btnSimuler.classList.add('btn-vibrating');
            setTimeout(() => {
                if (btnSimuler) btnSimuler.classList.remove('btn-vibrating');
            }, 400);
        }

        if (anchor) {
            const badge = document.createElement('div');
            badge.className = 'p5-floating-badge';
            const montantFormatte = montant.toFixed(4);
            badge.innerHTML = `
                <span class="p5-badge-slash-icon">★</span>
                <span>+${montantFormatte} €</span>
            `;
            anchor.appendChild(badge);

            setTimeout(() => {
                if (badge.parentNode) {
                    badge.parentNode.removeChild(badge);
                }
            }, 850);
        }

        if (amountWrap) {
            amountWrap.classList.remove('minute-tick');
            void amountWrap.offsetWidth;
            amountWrap.classList.add('minute-tick');
            setTimeout(() => {
                if (amountWrap) amountWrap.classList.remove('minute-tick');
            }, 450);
        }

        if (heroCard) {
            heroCard.classList.remove('p5-gain-flash');
            void heroCard.offsetWidth;
            heroCard.classList.add('p5-gain-flash');
            setTimeout(() => {
                if (heroCard) heroCard.classList.remove('p5-gain-flash');
            }, 450);
        }

        emettreSonGain();
    }

    /**
     * Crédite un nombre donné de minutes complètes de salaire
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

        synchroniserPersistance();
        const gain = minutesACrediter * TAUX_MINUTE;
        declencherAnimationGain(gain, estSimulation);
        rafraichirAffichageMontants(new Date());
    }

    /**
     * Met à jour l'affichage de tous les montants et indicateurs
     */
    function rafraichirAffichageMontants(dateCible) {
        const totalMinutesAujourdhui = Math.min(MAX_MINUTES_JOUR, creditedMinutesAujourdhui + bonusSimuleMinutes);
        const gagneAujourdhui = totalMinutesAujourdhui * TAUX_MINUTE;

        const debutMois = new Date(dateCible.getFullYear(), dateCible.getMonth(), 1, 0, 0, 0);
        const debutMoisEffectif = debutMois < DATE_DEBUT_CONTRAT ? DATE_DEBUT_CONTRAT : debutMois;
        const secondesPasseesMois = calculerSecondesJoursPrecedents(debutMoisEffectif, dateCible);
        const gagneMois = (secondesPasseesMois * TAUX_SECONDE) + gagneAujourdhui;

        const secondesPasseesTotal = calculerSecondesJoursPrecedents(DATE_DEBUT_CONTRAT, dateCible);
        const gagneTotal = (secondesPasseesTotal * TAUX_SECONDE) + gagneAujourdhui;

        const jourEl = document.getElementById('jour');
        const moisEl = document.getElementById('mois');
        const totalEl = document.getElementById('total');

        if (jourEl) jourEl.innerText = gagneAujourdhui.toFixed(4);
        if (moisEl) moisEl.innerText = gagneMois.toFixed(2);
        if (totalEl) totalEl.innerText = gagneTotal.toFixed(2);

        const ratioJour = Math.min(1, totalMinutesAujourdhui / MAX_MINUTES_JOUR);
        const pourcentageJour = Math.min(100, ratioJour * 100);
        const heuresTravailleesTotal = totalMinutesAujourdhui / 60;

        const progressFill = document.getElementById('progressBarFill');
        const progressText = document.getElementById('progressionPourcent');
        const heuresText = document.getElementById('heuresTravaillees');

        if (progressFill) progressFill.style.width = `${pourcentageJour.toFixed(1)}%`;
        if (progressText) progressText.innerText = `${pourcentageJour.toFixed(1)} %`;
        if (heuresText) heuresText.innerText = `(${heuresTravailleesTotal.toFixed(1)}h / 7h)`;

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
     * Met à jour le curseur dynamique sur le graphique SVG
     */
    function mettreAJourGraphiqueCurseur(secondesAujourdhui) {
        const cursor = document.getElementById('svgLiveCursor');
        const dot = document.getElementById('svgLiveDot');
        if (!cursor || !dot) return;

        const ratio = Math.min(1, Math.max(0, secondesAujourdhui / 25200));
        const targetX = 60 + ratio * 700;

        cursor.setAttribute('x1', targetX);
        cursor.setAttribute('x2', targetX);
        dot.setAttribute('cx', targetX);

        const targetY = 185 - ratio * 185;
        dot.setAttribute('cy', Math.max(10, targetY));
    }

    /**
     * Boucle principale de rafraîchissement temps réel (1 seconde)
     */
    function mettreAJour() {
        const dateNow = new Date();
        const jourChaine = dateNow.toDateString();

        if (dateDernierCalculJour !== null && dateDernierCalculJour !== jourChaine) {
            creditedMinutesAujourdhui = 0;
            bonusSimuleMinutes = 0;
            dateDernierCalculJour = jourChaine;
            synchroniserPersistance();
        }

        const statusInfo = getWorkStatus(dateNow, creditedMinutesAujourdhui, bonusSimuleMinutes, modeDemo);
        mettreAJourDateHUD(dateNow, statusInfo);

        const completedMinutes = getMinutesTravailleesAujourdhui(dateNow);

        if (isInitialBoot) {
            creditedMinutesAujourdhui = Math.min(MAX_MINUTES_JOUR, completedMinutes);
            isInitialBoot = false;
            synchroniserPersistance();
            rafraichirAffichageMontants(dateNow);
        } else {
            if (completedMinutes > creditedMinutesAujourdhui) {
                const diff = completedMinutes - creditedMinutesAujourdhui;
                crediterMinutes(diff, false);
            }
        }

        const secondesAujourdhui = getSecondesJournee(dateNow);
        mettreAJourGraphiqueCurseur(secondesAujourdhui);
    }

    // 2. CONTRÔLES INTERACTIFS DU DASHBOARD

    // Onglets JRPG
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

    // Bouton Simuler Gain (+1 min)
    const btnSimuler = document.getElementById('btnSimulerGain');
    if (btnSimuler) {
        btnSimuler.addEventListener('click', () => {
            jouerSonMenu();
            crediterMinutes(1, true);
        });
    }

    // Bouton Démo Live
    const btnDemo = document.getElementById('btnDemoToggle');
    const demoLabel = document.getElementById('demoLabel');
    if (btnDemo && demoLabel) {
        if (modeDemo) {
            btnDemo.classList.add('active');
            demoLabel.innerText = 'ACTIVE // TEMPS RÉEL';
            demoInterval = setInterval(() => {
                crediterMinutes(1, true);
            }, 5000);
        }

        btnDemo.addEventListener('click', () => {
            jouerSonMenu();
            modeDemo = !modeDemo;
            if (modeDemo) {
                btnDemo.classList.add('active');
                demoLabel.innerText = 'ACTIVE // TEMPS RÉEL';
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
            synchroniserPersistance();
            mettreAJour();
        });
    }

    // Bouton Audio SFX (Dashboard)
    const btnAudio = document.getElementById('btnAudioToggle');
    const audioLabel = document.getElementById('audioLabel');
    function rafraichirAudioLabel() {
        if (btnAudio && audioLabel) {
            if (audioActif) {
                btnAudio.classList.add('active');
                audioLabel.innerText = 'ACTIVÉ // STÉRÉO';
            } else {
                btnAudio.classList.remove('active');
                audioLabel.innerText = 'DÉSACTIVÉ';
            }
        }
    }
    rafraichirAudioLabel();

    if (btnAudio) {
        btnAudio.addEventListener('click', () => {
            basculerAudioGlobale();
            rafraichirAudioLabel();
        });
    }

    // 3. NAVIGATION DE RETOUR AU MENU PRINCIPAL
    function retournerAuMenu() {
        declencherWipe('../main-menu/', 'return', 'SYSTEM HUB', 'RETURNING TO MAIN MENU...');
    }

    const btnBack = document.getElementById('btnBackToMenu');
    if (btnBack) {
        btnBack.addEventListener('click', (e) => {
            e.preventDefault();
            retournerAuMenu();
        });
    }

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            e.preventDefault();
            retournerAuMenu();
        }
    });

    // Lancement de la boucle temps réel
    mettreAJour();
    setInterval(mettreAJour, 1000);
});

