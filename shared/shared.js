/**
 * ==========================================================================
 * SALARY PULSE // NOYAU PARTAGÉ  (window.SP)
 *
 *   SP.CONFIG   constantes issues du planning (voir scheduleConfig.js)
 *   SP.Schedule moteur de planning (window.Schedule)
 *   SP.store    persistance LocalStorage défensive
 *   SP.audio    SFX Web Audio (aucun fichier externe, activé après un geste)
 *   SP.work     statut de travail + calculs de temps
 *   SP.hud      sticker date/heure + badge de statut
 *   SP.nav      transition « module access » + retour ESC
 *   SP.onTick   horloge unique (1 Hz, alignée sur la seconde)
 *
 * Les pages déclarent <body data-sp-page="menu|dashboard|calendar|gta"> et
 * un <header data-sp-header> ; le shell (fond, header, transition) est monté ici.
 * ==========================================================================
 */
(function () {
    'use strict';

    /* ---------------------------------------------------------------------
       1. CONFIGURATION DU CONTRAT
       --------------------------------------------------------------------- */
    // Données issues de shared/scheduleConfig.js + schedule-engine.js (à charger avant ce fichier)
    const Schedule = window.Schedule;
    const CONFIG = Object.freeze({
        MONTHLY_NET: Schedule.CONFIG.MONTHLY_NET,
        MAX_MINUTES_JOUR: Schedule.MINUTES_PAR_JOUR, // minutes de bureau par jour d'entreprise
        PLAGES: Schedule.PLAGES,
        DATE_DEBUT_CONTRAT: Schedule.START
    });

    const MODULES = Object.freeze([
        { id: 'dashboard', url: '../dashboard-salary/', title: 'DASHBOARD', sub: 'SALARY', kicker: 'MODULE ACCESS // 01' },
        { id: 'calendar', url: '../calendar/', title: 'CALENDRIER', sub: '', kicker: 'MODULE ACCESS // 02' },
        { id: 'gta', url: '../gta-countdown/', title: 'GTA 6', sub: 'COUNTDOWN', kicker: 'MODULE ACCESS // 03' }
    ]);
    const MENU_URL = '../main-menu/';

    const prefersReducedMotion = () =>
        Boolean(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

    /* ---------------------------------------------------------------------
       2. PERSISTANCE (LocalStorage défensif)
       Une seule clé ; toute lecture est validée, toute écriture protégée.
       --------------------------------------------------------------------- */
    const STORAGE_KEY = 'salary_pulse_state_v2';

    const jourCle = (date = new Date()) => date.toDateString();

    function entierBorne(valeur, max) {
        const n = Math.floor(Number(valeur));
        return Number.isFinite(n) ? Math.min(max, Math.max(0, n)) : 0;
    }

    const etatVide = () => ({
        creditedMinutes: 0,
        bonusSimuleMinutes: 0,
        dateJour: null,
        audioActif: false,
        modeDemo: false
    });

    function lireBrut() {
        try {
            const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
            if (data && typeof data === 'object' && !Array.isArray(data)) return data;
        } catch (e) { /* JSON corrompu ou storage indisponible : état vide */ }
        return null;
    }

    /** État persistant validé. Les minutes d'un autre jour sont remises à zéro. */
    function charger() {
        const data = lireBrut();
        if (!data) return etatVide();
        const dateJour = typeof data.dateJour === 'string' ? data.dateJour : null;
        const memeJour = dateJour === jourCle();
        return {
            creditedMinutes: memeJour ? entierBorne(data.creditedMinutes, CONFIG.MAX_MINUTES_JOUR) : 0,
            bonusSimuleMinutes: memeJour ? entierBorne(data.bonusSimuleMinutes, CONFIG.MAX_MINUTES_JOUR) : 0,
            dateJour: memeJour ? dateJour : null,
            audioActif: data.audioActif === true,
            modeDemo: memeJour && data.modeDemo === true
        };
    }

    function sauvegarder(etat) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...etatVide(), ...etat }));
        } catch (e) { /* quota / navigation privée : on continue sans persistance */ }
    }

    /** Met à jour quelques champs sans écraser les autres. */
    function patch(champs) {
        sauvegarder({ ...charger(), ...champs });
    }

    /* ---------------------------------------------------------------------
       3. AUDIO (Web Audio, synthèse pure)
       Le contexte n'est créé qu'après un geste utilisateur (autoplay policy).
       --------------------------------------------------------------------- */
    const audio = (() => {
        let ctx = null;
        let actif = charger().audioActif;
        const abonnes = new Set();

        function debloquer() {
            try {
                if (!ctx) {
                    const Ctor = window.AudioContext || window.webkitAudioContext;
                    if (!Ctor) return;
                    ctx = new Ctor();
                }
                if (ctx.state === 'suspended') ctx.resume().catch(() => {});
            } catch (e) { ctx = null; }
        }

        // Débloque au premier geste, quel que soit le module
        ['pointerdown', 'keydown', 'touchstart'].forEach((type) =>
            window.addEventListener(type, debloquer, { once: true, passive: true, capture: true }));

        /** voix : { type, f0, f1?, at? } ; enveloppe commune */
        function jouer(voix, vol, dur) {
            if (!actif || !ctx || ctx.state !== 'running') return;
            try {
                const t = ctx.currentTime;
                const gain = ctx.createGain();
                gain.gain.setValueAtTime(vol, t);
                gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
                gain.connect(ctx.destination);
                voix.forEach(({ type, f0, f1, at = 0 }) => {
                    const osc = ctx.createOscillator();
                    osc.type = type;
                    osc.frequency.setValueAtTime(f0, t + at);
                    if (f1) osc.frequency.exponentialRampToValueAtTime(f1, t + at + Math.min(dur, 0.15));
                    osc.connect(gain);
                    osc.start(t + at);
                    osc.stop(t + dur);
                });
            } catch (e) { /* SFX best-effort */ }
        }

        const sons = {
            hover: () => jouer([{ type: 'sine', f0: 850, f1: 1300 }], 0.025, 0.04),
            menu: () => jouer([{ type: 'sawtooth', f0: 650, f1: 1800 }], 0.04, 0.07),
            confirm: () => jouer([
                { type: 'triangle', f0: 523.25 }, { type: 'triangle', f0: 659.25, at: 0.06 },
                { type: 'triangle', f0: 1046.5, at: 0.12 }, { type: 'sawtooth', f0: 261.63 }
            ], 0.045, 0.28),
            back: () => jouer([{ type: 'sawtooth', f0: 920, f1: 360 }], 0.035, 0.14),
            gain: () => jouer([{ type: 'sine', f0: 880, f1: 1760 }, { type: 'triangle', f0: 1318.5 }], 0.09, 0.55)
        };

        const notifier = () => abonnes.forEach((fn) => fn(actif));

        return {
            play: (nom) => { if (sons[nom]) sons[nom](); },
            isOn: () => actif,
            toggle() {
                actif = !actif;
                patch({ audioActif: actif });
                if (actif) { debloquer(); sons.gain(); }
                notifier();
            },
            /** appelle fn(actif) immédiatement puis à chaque changement */
            subscribe(fn) { abonnes.add(fn); fn(actif); }
        };
    })();

    /* ---------------------------------------------------------------------
       4. STATUT DE TRAVAIL & TEMPS
       --------------------------------------------------------------------- */
    const fmtH = (min) => `${String(Math.floor(min / 60)).padStart(2, '0')}H${String(min % 60).padStart(2, '0')}`;
    const PAUSE = 'ACQUISITION EN PAUSE';

    const STATUTS = {
        working: (desc, contextText = 'WORKING') => ({ label: 'WORKING', desc, badgeClass: 'status-working', contextText, contextClass: 'context-working', enPoste: true }),
        offduty: (desc, label = 'OFF DUTY') => ({ label, desc, badgeClass: 'status-offduty', contextText: label, contextClass: 'context-offduty', enPoste: false }),
        break: (reprise) => ({ label: 'LUNCH BREAK', desc: `PAUSE // REPRISE À ${fmtH(reprise)}`, badgeClass: 'status-break', contextText: 'LUNCH BREAK', contextClass: 'context-break', enPoste: false }),
        complete: (label, desc) => ({ label, desc, badgeClass: 'status-complete', contextText: 'AFTER WORK', contextClass: 'context-afterwork', enPoste: false })
    };

    /**
     * Statut selon le type de jour (entreprise / école / week-end / férié) et l'heure.
     * Un jour non payé (week-end, ou type absent de PAID_DAY_TYPES) met l'acquisition en pause.
     * creditedMinutes + bonusSimule : minutes déjà comptées aujourd'hui (réelles + simulées).
     */
    function getWorkStatus(date, creditedMinutes = 0, bonusSimule = 0, demoActive = false) {
        if (demoActive) return { ...STATUTS.working('DÉMO ACTIVE // FLUX EN CONTINU'), contextText: 'DEMO MODE' };

        const type = Schedule.dayType(date);
        if (!Schedule.isPaidDay(date)) {
            const noms = { weekend: 'WEEK-END', holiday: 'JOUR FÉRIÉ', school: "JOUR D'ÉCOLE", outside: 'HORS ALTERNANCE' };
            const contexte = type === 'school' ? 'SCHOOL DAY' : type === 'holiday' ? 'HOLIDAY' : 'OFF DUTY';
            return STATUTS.offduty(`${noms[type] || 'JOUR NON PAYÉ'} // ${PAUSE}`, contexte);
        }
        if (creditedMinutes + bonusSimule >= CONFIG.MAX_MINUTES_JOUR) {
            return STATUTS.complete('DAY COMPLETE', `MISSION ACCOMPLIE // ${CONFIG.MAX_MINUTES_JOUR / 60}H EFFECTUÉES`);
        }
        const minutes = date.getHours() * 60 + date.getMinutes();
        const plages = CONFIG.PLAGES;
        if (minutes < plages[0].debut) return STATUTS.offduty(`HORS HORAIRES // DÉBUT À ${fmtH(plages[0].debut)}`);
        const lieu = type === 'school' ? "JOUR D'ÉCOLE" : "JOUR D'ENTREPRISE";
        const contexte = type === 'school' ? 'SCHOOL DAY' : 'WORKING';
        for (let i = 0; i < plages.length; i++) {
            if (minutes < plages[i].fin) {
                if (minutes >= plages[i].debut) return STATUTS.working(`${lieu} // POSTE ACTIF`, contexte);
                return STATUTS.break(plages[i].debut);
            }
        }
        return STATUTS.complete('AFTER WORK', `JOURNÉE TERMINÉE // ${fmtH(plages[plages.length - 1].fin)} DÉPASSÉ`);
    }

    /** Statut à partir de l'état persistant (menu, calendrier, GTA). */
    function statutCourant(date = new Date()) {
        const e = charger();
        return getWorkStatus(date, e.creditedMinutes, e.bonusSimuleMinutes, e.modeDemo);
    }

    /* ---------------------------------------------------------------------
       5. HORLOGE UNIQUE (1 Hz, alignée sur la seconde)
       --------------------------------------------------------------------- */
    const tickers = new Set();
    let tickTimer = null;

    function tick() {
        const now = new Date();
        tickers.forEach((fn) => fn(now));
        tickTimer = setTimeout(tick, 1000 - now.getMilliseconds() + 5);
    }

    function onTick(fn) {
        tickers.add(fn);
        fn(new Date());
        if (!tickTimer) tickTimer = setTimeout(tick, 1000);
    }

    // Les onglets en arrière-plan sont bridés : on rattrape immédiatement au retour
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && tickers.size) {
            clearTimeout(tickTimer);
            tick();
        }
    });

    /* ---------------------------------------------------------------------
       6. HUD (sticker date + statut)
       --------------------------------------------------------------------- */
    const JOURS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const MOIS = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
    const pad2 = (n) => String(n).padStart(2, '0');

    const hudRefs = {};
    function hudRef(id) {
        if (!(id in hudRefs) || (hudRefs[id] && !hudRefs[id].isConnected)) hudRefs[id] = document.getElementById(id);
        return hudRefs[id];
    }
    function setText(id, valeur) {
        const el = hudRef(id);
        if (el && el.textContent !== String(valeur)) el.textContent = valeur;
    }

    function updateHUD(date, statut) {
        setText('hudDayVal', pad2(date.getDate()));
        setText('hudMonthNum', pad2(date.getMonth() + 1));
        setText('hudMonthName', MOIS[date.getMonth()]);
        setText('hudWeekdayText', JOURS[date.getDay()]);
        setText('hudLiveClock', `${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`);
        setText('hudYearVal', date.getFullYear());

        const pill = hudRef('hudContextPill');
        if (pill) {
            const cls = `sticker-context-pill ${statut.contextClass}`;
            if (pill.className !== cls) pill.className = cls;
            setText('hudContextText', statut.contextText);
        }
        const badge = hudRef('statutBadge');
        if (badge) {
            const cls = `sp-status-badge ${statut.badgeClass}`;
            if (badge.className !== cls) badge.className = cls;
            setText('statutTexte', statut.label);
            setText('statutDescription', statut.desc);
        }
    }

    /** HUD autonome pour les pages sans moteur (menu, calendrier, GTA). */
    function startHUD() {
        onTick((now) => updateHUD(now, statutCourant(now)));
    }

    /* ---------------------------------------------------------------------
       7. NAVIGATION & TRANSITION « MODULE ACCESS »
       --------------------------------------------------------------------- */
    const WIPE_FLAG = 'sp_wipe_reveal';
    let navigationEnCours = false;
    let wipeEl = null;

    const PULSE_PATH = 'M0 30 H120 L140 30 L158 4 L182 56 L200 30 H220 L232 18 L244 30 H400';

    function buildWipe() {
        const el = document.createElement('div');
        el.className = 'sp-transition-wipe';
        el.setAttribute('aria-hidden', 'true');
        el.innerHTML = `
            <div class="wipe-band band-a"></div>
            <div class="wipe-band band-white"></div>
            <div class="wipe-band band-black"></div>
            <div class="wipe-band band-red">
                <div class="wipe-content">
                    <span class="wipe-kicker" id="wipeKicker">SALARY PULSE // ACCESS</span>
                    <span class="wipe-text" id="wipeText">SYSTEM</span>
                    <svg class="wipe-pulse" viewBox="0 0 400 60" preserveAspectRatio="xMidYMid meet"><path pathLength="400" d="${PULSE_PATH}"/></svg>
                </div>
            </div>
        </div>`;
        document.body.appendChild(el);
        return el;
    }

    function setWipeText(kicker, titre) {
        const k = document.getElementById('wipeKicker');
        const t = document.getElementById('wipeText');
        if (k) k.textContent = kicker;
        if (t) t.textContent = titre;
    }

    /**
     * Ferme l'écran avec la transition puis navigue.
     * Sur la page suivante, le shell rejoue la sortie (voir mountShell).
     */
    function go(url, { sfx = 'confirm', kicker = 'SALARY PULSE // ACCESS', title = 'SYSTEM' } = {}) {
        if (navigationEnCours) return;
        navigationEnCours = true;
        audio.play(sfx);

        if (prefersReducedMotion() || !wipeEl) {
            window.location.href = url;
            return;
        }
        setWipeText(kicker, title);
        try { sessionStorage.setItem(WIPE_FLAG, JSON.stringify({ kicker, title })); } catch (e) { /* facultatif */ }
        wipeEl.classList.remove('is-revealing');
        wipeEl.classList.add('is-covering');
        setTimeout(() => { window.location.href = url; }, 340);
    }

    function goMenu() {
        go(MENU_URL, { sfx: 'back', kicker: 'SALARY PULSE // RETOUR', title: 'MENU PRINCIPAL' });
    }

    function goModule(index) {
        const m = MODULES[index];
        if (!m) return;
        go(m.url, { sfx: 'confirm', kicker: m.kicker, title: `${m.title}${m.sub ? ' ' + m.sub : ''}` });
    }

    /** Rejoue la sortie de transition si la page précédente en a lancé une. */
    function playReveal() {
        let payload = null;
        try {
            payload = sessionStorage.getItem(WIPE_FLAG);
            sessionStorage.removeItem(WIPE_FLAG);
        } catch (e) { /* facultatif */ }
        if (!payload || !wipeEl || prefersReducedMotion()) return;
        try {
            const { kicker, title } = JSON.parse(payload);
            setWipeText(String(kicker), String(title));
        } catch (e) { return; }
        wipeEl.classList.add('is-revealing');
        setTimeout(() => wipeEl.classList.remove('is-revealing'), 560);
    }

    // Retour arrière navigateur (bfcache) : on nettoie l'état de transition
    window.addEventListener('pageshow', (e) => {
        if (!e.persisted) return;
        navigationEnCours = false;
        if (wipeEl) wipeEl.classList.remove('is-covering', 'is-revealing');
    });

    /* ---------------------------------------------------------------------
       7b. HELPERS D'AFFICHAGE (lettres découpées, glitch)
       --------------------------------------------------------------------- */
    /** Transforme le texte d'un élément en tuiles « lettre anonyme » (lisible par les lecteurs d'écran). */
    function ransom(el) {
        const texte = el.textContent.trim();
        el.setAttribute('aria-label', texte);
        el.classList.add('sp-ransom');
        el.textContent = '';
        texte.split(/\s+/).forEach((mot) => {
            const w = document.createElement('span');
            w.className = 'w';
            w.setAttribute('aria-hidden', 'true');
            [...mot].forEach((c) => {
                const l = document.createElement('span');
                l.className = 'l';
                l.textContent = c;
                w.appendChild(l);
            });
            el.appendChild(w);
        });
    }

    /** Petit glitch ponctuel sur un élément .sp-glitch (data-text requis). */
    function glitch(el) {
        if (prefersReducedMotion() || !el) return;
        el.dataset.text = el.textContent; // les calques du glitch recopient le texte courant
        el.classList.remove('is-glitching');
        void el.offsetWidth;
        el.classList.add('is-glitching');
    }

    /* ---------------------------------------------------------------------
       8. SHELL (fond, header, bouton audio, touche ESC)
       --------------------------------------------------------------------- */
    function stickerMarkup() {
        return `
        <div class="sp-date-hud-sticker" role="group" aria-label="Date et heure">
            <div class="hud-sticker-daybox">
                <span class="sticker-pin" aria-hidden="true">★</span>
                <div class="sticker-num-row">
                    <span class="sticker-big-day" id="hudDayVal">--</span>
                    <div class="sticker-month-col">
                        <span class="sticker-month-tag" id="hudMonthNum">--</span>
                        <div class="sticker-month-name" id="hudMonthName">------</div>
                    </div>
                </div>
            </div>
            <div class="hud-sticker-slash-group">
                <div class="sticker-weekday-banner"><span class="weekday-text" id="hudWeekdayText">-------</span></div>
                <div class="sticker-context-pill context-afterwork" id="hudContextPill">
                    <span class="context-dot" aria-hidden="true">◆</span>
                    <span class="context-text" id="hudContextText">AFTER WORK</span>
                </div>
                <div class="sticker-time-tag">
                    <span class="time-clock-icon" aria-hidden="true">◷</span>
                    <span class="time-clock-val" id="hudLiveClock">--:--:--</span>
                    <span class="time-year-val" id="hudYearVal">----</span>
                </div>
            </div>
        </div>`;
    }

    const audioButtonMarkup = () => `
        <button type="button" class="sp-btn-audio-header" id="btnHeaderAudio" aria-pressed="false" aria-label="Effets sonores">
            <span id="headerAudioIcon" aria-hidden="true">♪</span>
            <span id="headerAudioLabel">SFX OFF</span>
        </button>`;

    const statusMarkup = () => `
        <div class="hud-status-wrapper">
            <div id="statutBadge" class="sp-status-badge status-offduty">
                <span class="sp-status-radar" aria-hidden="true">◆</span>
                <div class="sp-status-text-block">
                    <span class="status-prefix">STATUS //</span>
                    <span id="statutTexte" class="status-main">--</span>
                </div>
            </div>
            <div class="hud-status-caption" id="statutDescription"></div>
        </div>`;

    function moduleHeaderMarkup() {
        return `
        ${stickerMarkup()}
        <div class="sp-header-right-group">
            <a href="${MENU_URL}" id="btnBackToMenu" class="sp-btn-back" aria-keyshortcuts="Escape">
                <span class="back-arrow" aria-hidden="true">◀</span>
                <span class="back-text">MENU PRINCIPAL</span>
                <kbd class="back-kbd">ESC</kbd>
            </a>
            <div class="sp-brand-block" aria-hidden="true">
                <div class="sp-logo-icon"><span class="sp-star">★</span></div>
                <div class="sp-brand-text">
                    <div class="sp-brand-title"><span class="title-main">SALARY</span><span class="title-sub">PULSE</span></div>
                    <div class="sp-tag-ribbon"><span class="sp-pill-black">SYSTEM // V3</span><span class="sp-pill-red">PULSE OS</span></div>
                </div>
            </div>
            ${statusMarkup()}
            ${audioButtonMarkup()}
        </div>`;
    }

    function mountShell() {
        const page = document.body.dataset.spPage || '';

        // Fond partagé (le menu apporte le sien)
        if (document.body.dataset.spBg !== 'custom') {
            const bg = document.createElement('div');
            bg.className = 'sp-bg-overlay';
            bg.setAttribute('aria-hidden', 'true');
            bg.innerHTML = '<div class="sp-stripe-band"></div><div class="sp-halftone"></div><div class="sp-action-slash slash-1"></div><div class="sp-action-slash slash-2"></div>';
            document.body.prepend(bg);
        }

        // Lien d'évitement
        const main = document.querySelector('main');
        if (main) {
            if (!main.id) main.id = 'spMain';
            main.tabIndex = -1;
            const skip = document.createElement('a');
            skip.className = 'sp-skip';
            skip.href = `#${main.id}`;
            skip.textContent = 'Aller au contenu';
            document.body.prepend(skip);
        }

        // Header : le menu fournit le sien, les modules utilisent le gabarit commun
        const header = document.querySelector('[data-sp-header]');
        if (header && header.dataset.spHeader === 'module') header.innerHTML = moduleHeaderMarkup();
        if (header && header.dataset.spHeader === 'menu') {
            header.innerHTML = `${stickerMarkup()}<div class="mm-hud-right">${statusMarkup()}${audioButtonMarkup()}</div>`;
        }

        wipeEl = buildWipe();
        playReveal();

        // Pages sans moteur propre (calendrier, GTA 6) : HUD piloté par l'état persistant
        if (document.body.dataset.spHud === 'auto') startHUD();

        // Bouton SFX (présent dans tous les headers)
        const btn = document.getElementById('btnHeaderAudio');
        if (btn) {
            btn.addEventListener('click', () => audio.toggle());
            audio.subscribe((on) => {
                btn.setAttribute('aria-pressed', String(on));
                setText('headerAudioLabel', on ? 'SFX ON' : 'SFX OFF');
                setText('headerAudioIcon', on ? '♪' : '✕');
                document.querySelectorAll('[data-sp-audio-state]').forEach((el) => { el.textContent = on ? 'ACTIVÉ // STÉRÉO' : 'DÉSACTIVÉ'; });
            });
        }

        // Retour au menu (lien + touche ESC) depuis tout module
        if (page && page !== 'menu') {
            const back = document.getElementById('btnBackToMenu');
            [back, ...document.querySelectorAll('[data-sp-back]')].filter(Boolean).forEach((el) =>
                el.addEventListener('click', (e) => { e.preventDefault(); goMenu(); }));
            window.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && !e.defaultPrevented && !e.repeat) { e.preventDefault(); goMenu(); }
            });
        }
    }

    // Les éléments [data-ransom] deviennent des tuiles découpées
    const initRansom = () => document.querySelectorAll('[data-ransom]').forEach(ransom);

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { mountShell(); initRansom(); });
    else { mountShell(); initRansom(); }

    window.SP = {
        CONFIG, MODULES, MENU_URL,
        store: { charger, sauvegarder, patch, jourCle },
        audio,
        work: { getWorkStatus, statutCourant },
        Schedule,
        hud: { update: updateHUD, start: startHUD, setText },
        nav: { go, goMenu, goModule },
        onTick,
        ui: { ransom, glitch },
        prefersReducedMotion
    };
})();
