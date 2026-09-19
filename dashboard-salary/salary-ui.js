/**
 * DASHBOARD SALARY // couche d'affichage (window.SalaryUI)
 * Aucune règle métier ici : le moteur (script.js) lui transmet des valeurs déjà calculées.
 */
(function () {
    'use strict';

    const reduit = () => window.SP.prefersReducedMotion();
    const $ = (id) => document.getElementById(id);
    const SVG_NS = 'http://www.w3.org/2000/svg';

    /* ---------- compteur à défilement nerveux (façon gain d'XP) ---------- */
    const ROLL_MS = 520;
    const ROLL_STEP_MS = 45; // rafraîchissement « saccadé » volontaire
    const rouleaux = new WeakMap(); // el -> { texte, raf }

    function afficher(el, texte) {
        if (el.textContent !== texte) el.textContent = texte;
    }

    /** Fait défiler les chiffres jusqu'à `valeur` ; premier appel et reduced-motion : affichage direct. */
    function roll(el, valeur, decimales) {
        if (!el) return;
        const cible = valeur.toFixed(decimales);
        const etat = rouleaux.get(el);
        if (!etat || reduit()) {
            afficher(el, cible);
            rouleaux.set(el, { texte: cible, raf: 0 });
            return;
        }
        if (etat.texte === cible) return;
        cancelAnimationFrame(etat.raf);
        etat.texte = cible;

        const chiffres = [...cible].reduce((acc, c, i) => (/\d/.test(c) ? acc.concat(i) : acc), []);
        const debut = performance.now();
        let dernier = 0;
        el.classList.add('is-rolling');

        const image = (now) => {
            const t = Math.min(1, (now - debut) / ROLL_MS);
            if (now - dernier >= ROLL_STEP_MS || t === 1) {
                dernier = now;
                // les chiffres se verrouillent de gauche à droite ; les autres tournent
                const verrouilles = Math.floor(t * (chiffres.length + 1));
                const sortie = [...cible];
                chiffres.forEach((pos, rang) => {
                    if (rang >= verrouilles && t < 1) sortie[pos] = String(Math.floor(Math.random() * 10));
                });
                afficher(el, sortie.join(''));
            }
            if (t < 1) etat.raf = requestAnimationFrame(image);
            else el.classList.remove('is-rolling');
        };
        etat.raf = requestAnimationFrame(image);
    }

    /* ---------- montants & jauges ---------- */
    function setAmounts({ jour, mois, total }) {
        roll($('jour'), jour, 4);
        roll($('mois'), mois, 2);
        roll($('total'), total, 2);
    }

    const setGauge = (barId, ratio) => $(barId).style.setProperty('--p', Math.min(1, Math.max(0, ratio)).toFixed(4));

    function setProgress({ ratio, pctTexte, heuresTexte, sessions }) {
        setGauge('progressBarFill', ratio);
        afficher($('progressionPourcent'), pctTexte);
        afficher($('heuresTravaillees'), heuresTexte);
        sessions.forEach(({ barId, textId, ratio: r, texte }) => {
            setGauge(barId, r);
            afficher($(textId), texte);
        });
    }

    /* ---------- courbe SVG ---------- */
    function el(nom, attrs, texte) {
        const n = document.createElementNS(SVG_NS, nom);
        Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
        if (texte) n.textContent = texte;
        return n;
    }

    function buildChart({ ligne, aire, pause, marks }) {
        $('chartLine').setAttribute('points', ligne);
        $('chartFill').setAttribute('points', aire);
        $('chartFillDots').setAttribute('points', aire);
        $('chartLunch').setAttribute('x', pause.x.toFixed(1));
        $('chartLunch').setAttribute('width', pause.largeur.toFixed(1));
        const label = $('chartLunchLabel');
        label.setAttribute('x', (pause.x + 14).toFixed(1));
        label.setAttribute('transform', `rotate(-90 ${(pause.x + 14).toFixed(1)} 115)`);

        const groupe = $('chartMarks');
        groupe.textContent = '';
        marks.forEach(({ x, y, texte, cle, fin }) => {
            groupe.append(
                el('circle', { cx: x.toFixed(1), cy: y.toFixed(1), r: fin ? 8 : 5, class: cle ? 'mark mark-key' : 'mark' }),
                el('text', { x: x.toFixed(1), y: 214, 'text-anchor': 'middle', class: fin ? 'axis-label axis-end' : 'axis-label' }, texte)
            );
        });
    }

    function moveCursor(x, y) {
        const c = $('svgLiveCursor');
        const p = $('svgLiveDot');
        c.setAttribute('x1', x.toFixed(1));
        c.setAttribute('x2', x.toFixed(1));
        p.setAttribute('cx', x.toFixed(1));
        p.setAttribute('cy', y.toFixed(1));
    }

    /* ---------- animation de gain ---------- */
    function rejouer(node, classe, duree) {
        if (!node) return;
        node.classList.remove(classe);
        void node.offsetWidth; // relance l'animation CSS
        node.classList.add(classe);
        setTimeout(() => node.classList.remove(classe), duree);
    }

    function playGain(montant, estSimulation) {
        if (estSimulation) rejouer($('btnSimulerGain'), 'btn-vibrating', 400);
        const ancre = $('floatingGainAnchor');
        if (ancre) {
            const badge = document.createElement('div');
            badge.className = 'sp-floating-badge';
            badge.innerHTML = `<span class="sp-badge-slash-icon" aria-hidden="true">★</span><span>+${montant.toFixed(4)} €</span>`;
            ancre.appendChild(badge);
            setTimeout(() => badge.remove(), 900);
        }
        rejouer($('mainAmountWrap'), 'minute-tick', 450);
        rejouer($('mainHeroCard'), 'sp-gain-flash', 450);
        window.SP.ui.glitch($('jour'));
    }

    /* ---------- boutons & onglets ---------- */
    function setToggle(id, actif, libelleId, libelle) {
        const b = $(id);
        b.classList.toggle('active', actif);
        b.setAttribute('aria-pressed', String(actif));
        if (libelleId) afficher($(libelleId), libelle);
    }

    const setDemo = (actif) => setToggle('btnDemoToggle', actif, 'demoLabel', actif ? 'ACTIVE // TEMPS RÉEL' : 'INACTIVE');
    const setAudio = (actif) => setToggle('btnAudioToggle', actif);

    function setActiveTab(cible) {
        document.querySelectorAll('.sp-tab-btn').forEach((b) => {
            const actif = b.dataset.target === cible;
            b.classList.toggle('active', actif);
            if (actif) b.setAttribute('aria-current', 'true');
            else b.removeAttribute('aria-current');
        });
    }

    function setStaticTexts(map) {
        Object.entries(map).forEach(([id, texte]) => afficher($(id), texte));
    }

    window.SalaryUI = { setAmounts, setProgress, buildChart, moveCursor, playGain, setDemo, setAudio, setActiveTab, setStaticTexts };
})();
