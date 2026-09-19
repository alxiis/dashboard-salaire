/**
 * CALENDRIER // affichage et interactions (s'appuie sur window.CalendarEngine)
 * Navigation : boutons ‹ ›, PageUp/PageDown, flèches dans la grille, « aujourd'hui ».
 */
(function () {
    'use strict';

    const { CONFIG, onTick, audio, prefersReducedMotion } = window.SP;
    const E = window.CalendarEngine;
    const $ = (id) => document.getElementById(id);

    const INTRO_MS = 1900;
    const contrat = { debut: CONFIG.DATE_DEBUT_CONTRAT };

    let today = new Date();
    let vue = { year: today.getFullYear(), month: today.getMonth() };
    let selection = E.cle(today);
    let grille = null;

    const grilleEl = $('calGrid');
    const euro = (n) => n.toFixed(2).replace('.', ',');

    /* ---------- bloc « jour actuel » ---------- */
    function renderToday() {
        $('calTodayDow').textContent = E.JOURS[today.getDay()];
        $('calTodayNum').textContent = today.getDate();
        $('calTodayMonth').textContent = `${E.MOIS[today.getMonth()]} ${today.getFullYear()}`;
        const cell = todayCell();
        $('calTodayInfo').textContent = cell ? infoJour(cell) : '';
    }

    const todayCell = () => E.buildMonthGrid(today.getFullYear(), today.getMonth(), today, contrat).cells.find((c) => c.isToday);

    function infoJour(cell) {
        const d = E.describeDay(cell);
        return d.worked
            ? `${d.label} // 7H // ${euro(CONFIG.GAIN_JOUR_MAX)} € NET MAX`
            : d.label;
    }

    /* ---------- grille du mois ---------- */
    function renderMonth() {
        grille = E.buildMonthGrid(vue.year, vue.month, today, contrat);
        const titre = $('calTitle');
        titre.textContent = `${E.MOIS[vue.month]} ${vue.year}`;
        window.SP.ui.ransom(titre);

        grilleEl.textContent = '';
        const frag = document.createDocumentFragment();

        grille.cells.forEach((cell, i) => {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'cal-day';
            b.dataset.key = cell.key;
            b.style.setProperty('--i', i);
            b.tabIndex = cell.key === selection ? 0 : -1;
            if (!cell.inMonth) b.classList.add('is-out');
            if (cell.isWeekend) b.classList.add('is-weekend');
            if (cell.isToday) b.classList.add('is-today');
            if (cell.beforeContract) b.classList.add('is-before');
            if (cell.isContractStart) b.classList.add('is-start');
            if (cell.key === selection) b.classList.add('is-selected');
            b.setAttribute('aria-label', `${E.formatLong(cell.date)} — ${E.describeDay(cell).label}${cell.isToday ? ' — aujourd\'hui' : ''}`);
            if (cell.key === selection) b.setAttribute('aria-current', 'date');
            b.innerHTML = `<span class="cal-face"><b>${cell.day}</b>${cell.isContractStart ? '<i aria-hidden="true">★</i>' : ''}</span>`;
            frag.appendChild(b);
        });
        grilleEl.appendChild(frag);

        const r = E.summarizeMonth(grille, CONFIG.TAUX_HORAIRE_NET, CONFIG.MAX_MINUTES_JOUR / 60);
        $('calStatDays').textContent = r.workdays;
        $('calStatHours').textContent = `${r.hours}H`;
        $('calStatAmount').textContent = `${euro(r.amount)} €`;
        renderDetail();
    }

    function renderDetail() {
        const cell = (grille && grille.cells.find((c) => c.key === selection)) || null;
        if (!cell) return;
        const d = E.describeDay(cell);
        $('calDetailDate').textContent = E.formatLong(cell.date);
        $('calDetailKind').textContent = cell.isToday ? `${d.label} // AUJOURD'HUI` : d.label;
        $('calDetailHours').textContent = d.worked ? '08:30 → 12:30  ·  13:30 → 16:30' : '—';
        $('calDetailAmount').textContent = d.worked ? `${euro(CONFIG.GAIN_JOUR_MAX)} € NET MAX` : '0,00 €';
        $('calDetail').dataset.kind = d.kind;
    }

    /* ---------- sélection & navigation ---------- */
    function selectionner(key, { focus = false, son = true } = {}) {
        const [y, m] = key.split('-').map(Number);
        const changeMois = y !== vue.year || m - 1 !== vue.month;
        selection = key;
        if (changeMois) {
            vue = { year: y, month: m - 1 };
            renderMonth();
        } else {
            grilleEl.querySelectorAll('.cal-day').forEach((b) => {
                const actif = b.dataset.key === key;
                b.classList.toggle('is-selected', actif);
                b.tabIndex = actif ? 0 : -1;
                if (actif) b.setAttribute('aria-current', 'date'); else b.removeAttribute('aria-current');
            });
            renderDetail();
        }
        if (focus) {
            const b = grilleEl.querySelector(`[data-key="${key}"]`);
            if (b) b.focus({ preventScroll: true });
        }
        if (son) audio.play('hover');
    }

    function changerMois(delta) {
        const n = E.shiftMonth(vue.year, vue.month, delta);
        vue = n;
        // garde un jour cohérent dans le nouveau mois
        const jour = Number(selection.slice(8));
        const max = new Date(n.year, n.month + 1, 0).getDate();
        selection = E.cle(new Date(n.year, n.month, Math.min(jour, max)));
        audio.play('menu');
        renderMonth();
    }

    function aujourdhui() {
        vue = { year: today.getFullYear(), month: today.getMonth() };
        selection = E.cle(today);
        audio.play('menu');
        renderMonth();
    }

    grilleEl.addEventListener('click', (e) => {
        const b = e.target.closest('.cal-day');
        if (b) selectionner(b.dataset.key);
    });

    grilleEl.addEventListener('keydown', (e) => {
        const pas = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];
        if (pas !== undefined) {
            e.preventDefault();
            const [y, m, d] = selection.split('-').map(Number);
            selectionner(E.cle(new Date(y, m - 1, d + pas)), { focus: true });
        } else if (e.key === 'PageUp' || e.key === 'PageDown') {
            e.preventDefault();
            changerMois(e.key === 'PageUp' ? -1 : 1);
            const b = grilleEl.querySelector(`[data-key="${selection}"]`);
            if (b) b.focus({ preventScroll: true });
        }
    });

    $('calPrev').addEventListener('click', () => changerMois(-1));
    $('calNext').addEventListener('click', () => changerMois(1));
    $('calToday').addEventListener('click', aujourdhui);

    /* ---------- intro : « changement de jour » ---------- */
    function jouerIntro() {
        const intro = $('calIntro');
        if (prefersReducedMotion()) { intro.remove(); document.body.classList.add('cal-ready'); return; }
        const veille = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
        $('calIntroPrev').textContent = veille.getDate();
        $('calIntroNext').textContent = today.getDate();
        $('calIntroDow').textContent = E.JOURS[today.getDay()];
        document.body.classList.add('cal-intro-on');

        let fini = false;
        const terminer = () => {
            if (fini) return;
            fini = true;
            document.body.classList.remove('cal-intro-on');
            document.body.classList.add('cal-ready');
            setTimeout(() => window.SP.ui.glitch($('calTodayNum')), 450);
            setTimeout(() => intro.remove(), 600);
        };
        setTimeout(terminer, INTRO_MS);
        // n'importe quelle touche / clic passe l'intro
        ['pointerdown', 'keydown'].forEach((t) => window.addEventListener(t, terminer, { once: true }));
        setTimeout(() => audio.play('confirm'), 700);
    }

    /* ---------- horloge : passage à minuit ---------- */
    onTick((now) => {
        if (E.cle(now) !== E.cle(today)) {
            today = now;
            renderToday();
            renderMonth();
        }
    });

    renderToday();
    renderMonth();
    jouerIntro();
})();
