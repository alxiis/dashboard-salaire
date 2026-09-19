/**
 * MAIN MENU // sélection des modules
 * Source de vérité unique : selectedModuleIndex (0 Dashboard · 1 Calendrier · 2 GTA 6).
 * Clavier, souris, tactile et focus passent tous par select() → render().
 */
(function () {
    'use strict';

    const { CONFIG, audio, nav, hud, work, onTick } = window.SP;

    const commandes = Array.from(document.querySelectorAll('.mm-cmd'));
    const pointeur = document.getElementById('mmPointer');
    const LAUNCH_IMPACT_MS = 150;

    // Composition « plein écran asymétrique » ou empilée (mobile / portrait)
    const compositionLarge = window.matchMedia('(min-width: 820px) and (min-aspect-ratio: 5/4)');

    let selectedModuleIndex = 0;
    let lancement = false;

    /* ---------- rendu dérivé de l'état ---------- */
    function placerPointeur() {
        const cmd = commandes[selectedModuleIndex];
        if (!cmd || !pointeur) return;
        const w = pointeur.offsetWidth;
        const h = pointeur.offsetHeight;
        // offsetLeft/Top ignorent les transforms : position stable pendant l'animation
        const large = compositionLarge.matches;
        // large : à gauche, centré · empilé : accroché au coin bas-gauche (le n° occupe le haut)
        const x = large ? cmd.offsetLeft - w * 0.7 : Math.max(0, cmd.offsetLeft - w * 0.4);
        const y = large ? cmd.offsetTop + cmd.offsetHeight / 2 - h / 2 : cmd.offsetTop + cmd.offsetHeight - h * 0.75;
        pointeur.style.setProperty('--px', `${Math.round(x)}px`);
        pointeur.style.setProperty('--py', `${Math.round(y)}px`);
    }

    function render() {
        document.body.style.setProperty('--sel', selectedModuleIndex);
        commandes.forEach((cmd, i) => {
            const actif = i === selectedModuleIndex;
            cmd.style.setProperty('--rel', i - selectedModuleIndex);
            cmd.classList.toggle('is-selected', actif);
            if (actif) cmd.setAttribute('aria-current', 'true');
            else cmd.removeAttribute('aria-current');
        });
        placerPointeur();
    }

    function select(index, { son = true, focus = false } = {}) {
        const suivant = (index + commandes.length) % commandes.length;
        if (suivant === selectedModuleIndex) return;
        selectedModuleIndex = suivant;
        render();
        if (son) audio.play('hover');
        if (focus) commandes[suivant].focus({ preventScroll: true });
    }

    /* ---------- lancement : sélection → impact → expansion → wipe → module ---------- */
    function ouvrir(index) {
        if (lancement) return;
        lancement = true;
        select(index, { son: false });
        document.body.classList.add('is-launching');
        commandes[selectedModuleIndex].classList.add('is-launching');
        setTimeout(() => nav.goModule(selectedModuleIndex), window.SP.prefersReducedMotion() ? 0 : LAUNCH_IMPACT_MS);
    }

    /* ---------- entrées ---------- */
    commandes.forEach((cmd, i) => {
        cmd.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse' && !lancement) select(i); });
        cmd.addEventListener('focus', () => { if (!lancement) select(i); });
        cmd.addEventListener('click', (e) => { e.preventDefault(); ouvrir(i); });
    });

    window.addEventListener('keydown', (e) => {
        if (lancement || e.ctrlKey || e.metaKey || e.altKey) return;
        // e.key : indépendant de la disposition (AZERTY : Z/S, QWERTY : W/S)
        switch (e.key.length === 1 ? e.key.toLowerCase() : e.key) {
            case 'ArrowDown': case 's':
                e.preventDefault(); select(selectedModuleIndex + 1, { focus: true }); break;
            case 'ArrowUp': case 'w': case 'z':
                e.preventDefault(); select(selectedModuleIndex - 1, { focus: true }); break;
            case 'Enter': case ' ':
                // Un vrai <button> focalisé (ex. SFX) garde son comportement natif
                if (e.target instanceof HTMLElement && e.target.closest('button')) return;
                e.preventDefault(); if (!e.repeat) ouvrir(selectedModuleIndex); break;
            default:
        }
    });

    // Retour depuis le cache navigateur : on repart d'un état propre
    window.addEventListener('pageshow', (e) => {
        if (!e.persisted) return;
        lancement = false;
        document.body.classList.remove('is-launching');
        commandes.forEach((c) => c.classList.remove('is-launching'));
        placerPointeur();
    });

    let resizeRaf = 0;
    window.addEventListener('resize', () => {
        cancelAnimationFrame(resizeRaf);
        resizeRaf = requestAnimationFrame(placerPointeur);
    });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(placerPointeur);

    /* ---------- données vivantes (taux issus du moteur, jamais hardcodés) ---------- */
    document.getElementById('mmRate').textContent = CONFIG.TAUX_HORAIRE_NET.toFixed(2);
    document.getElementById('mmMinute').textContent = `+${CONFIG.TAUX_MINUTE.toFixed(4)} € / MIN`;

    const live = document.getElementById('mmGtaCount');
    const liveEl = document.getElementById('mmLive');
    onTick((now) => {
        const statut = work.statutCourant(now);
        hud.update(now, statut);
        hud.setText('mmLiveText', statut.enPoste ? 'EN DIRECT' : statut.label);
        liveEl.classList.toggle('is-live', statut.enPoste);
        const reste = window.GtaCountdown.compute(window.GTA_CONFIG.RELEASE_DATE, now);
        live.textContent = reste.done ? 'DISPONIBLE' : `J-${reste.days}`;
    });

    /* ---------- init ---------- */
    render();
    // 1er placement sans transition, puis activation du déplacement animé
    requestAnimationFrame(() => {
        placerPointeur();
        requestAnimationFrame(() => pointeur.classList.add('is-ready'));
    });
})();
