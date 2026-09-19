/**
 * GTA 6 COUNTDOWN // affichage : chiffres, impact visuel à chaque seconde (flash + tremblement).
 */
(function () {
    'use strict';

    const { onTick, prefersReducedMotion, audio } = window.SP;
    const { RELEASE_DATE, RELEASE_LABEL } = window.GTA_CONFIG;
    const $ = (id) => document.getElementById(id);
    const pad2 = (n) => String(n).padStart(2, '0');

    const card = $('gtaCard');
    const flash = $('gtaFlash');
    const cases = { days: $('gtaDays'), hours: $('gtaHours'), minutes: $('gtaMinutes'), seconds: $('gtaSeconds') };
    let derniereSeconde = null;

    $('gtaDate').textContent = RELEASE_LABEL;

    function rejouer(el, classe, ms) {
        el.classList.remove(classe);
        void el.offsetWidth;
        el.classList.add(classe);
        setTimeout(() => el.classList.remove(classe), ms);
    }

    /** Impact : léger tremblement de la carte + éclair rouge (désactivés en reduced-motion). */
    function impact() {
        if (prefersReducedMotion()) return;
        rejouer(card, 'is-hit', 130);
        rejouer(flash, 'is-flash', 220);
        rejouer(cases.seconds.parentElement, 'is-slam', 260);
        window.SP.ui.glitch(cases.seconds);
    }

    function afficher(t) {
        const largeurJours = t.days > 99 ? String(t.days) : pad2(t.days);
        cases.days.textContent = largeurJours;
        cases.hours.textContent = pad2(t.hours);
        cases.minutes.textContent = pad2(t.minutes);
        cases.seconds.textContent = pad2(t.seconds);
    }

    function marquerTermine() {
        card.classList.add('is-released');
        $('gtaTitleState').textContent = 'DISPONIBLE';
        $('gtaMessage').textContent = 'LE JOUR J EST ARRIVÉ. VICE CITY VOUS ATTEND.';
    }

    onTick((now) => {
        const t = window.GtaCountdown.compute(RELEASE_DATE, now);
        afficher(t);
        if (t.done) { marquerTermine(); return; }
        if (derniereSeconde !== null && t.seconds !== derniereSeconde) {
            impact();
            audio.play('hover');
        }
        derniereSeconde = t.seconds;
    });
})();
