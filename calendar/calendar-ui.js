/**
 * CALENDRIER // affichage et interactions (s'appuie sur window.CalendarEngine et window.Schedule)
 * Vues : Mois (grille détaillée) · Année (13 mois de l'alternance). Barres de progression en tête.
 * Navigation : boutons ‹ ›, PageUp/PageDown, flèches dans la grille, « aujourd'hui ».
 */
(function () {
    'use strict';

    const { CONFIG, onTick, audio, prefersReducedMotion, Schedule } = window.SP;
    const E = window.CalendarEngine;
    const $ = (id) => document.getElementById(id);

    const INTRO_MS = 1900;
    const eur = (n) => n.toFixed(2).replace('.', ',');
    const plage = Schedule.CONFIG.WORK_HOURS.map(([a, b]) => `${a} → ${b}`).join('  ·  ');

    let today = new Date();
    let vue = { year: today.getFullYear(), month: today.getMonth() };
    let mode = 'month';
    let selection = E.cle(today);
    let grille = null;

    const grilleEl = $('calGrid');

    /* ---------- barres de progression ---------- */
    let barresPretes = false; // les barres se remplissent une fois l'intro terminée
    let minuteBarres = '';

    function setBar(id, ratio, pct, jours) {
        const root = $(id);
        root.querySelector('.hp-track').style.setProperty('--p', Math.min(1, Math.max(0, ratio)).toFixed(4));
        root.querySelector('[data-bar-pct]').textContent = `${(ratio * 100).toFixed(1)} %`;
        root.querySelector('[data-bar-days]').textContent = jours;
    }

    function renderBars(now, delaiEntreBarres = 0) {
        const p = Schedule.yearProgress(now);
        const fmt = (b) => `${Math.floor(b.done)} / ${Math.round(b.total)} jours`;
        [['barCompany', p.company], ['barSchool', p.school], ['barOverall', p.overall]].forEach(([id, b], i) => {
            setTimeout(() => setBar(id, b.ratio, null, fmt(b)), i * delaiEntreBarres);
        });
    }

    /* ---------- bloc « jour actuel » ---------- */
    function renderToday() {
        $('calTodayDow').textContent = E.JOURS[today.getDay()];
        $('calTodayNum').textContent = today.getDate();
        $('calTodayMonth').textContent = `${E.MOIS[today.getMonth()]} ${today.getFullYear()}`;
        const cell = E.buildMonthGrid(today.getFullYear(), today.getMonth(), today).cells.find((c) => c.isToday);
        const d = E.describeDay(cell);
        $('calTodayInfo').textContent = d.paid ? `${d.label} // ${eur(Schedule.dailyRate(today.getFullYear(), today.getMonth()))} € / JOUR` : d.label;
    }

    /* ---------- vue Mois ---------- */
    function renderMonth() {
        grille = E.buildMonthGrid(vue.year, vue.month, today);
        const titre = $('calTitle');
        titre.textContent = `${E.MOIS[vue.month]} ${vue.year}`;
        window.SP.ui.ransom(titre);

        grilleEl.textContent = '';
        const frag = document.createDocumentFragment();
        grille.cells.forEach((cell, i) => {
            const d = E.describeDay(cell);
            const b = document.createElement('button');
            b.type = 'button';
            b.className = `cal-day t-${cell.type}`;
            b.dataset.key = cell.key;
            b.style.setProperty('--i', i);
            b.tabIndex = cell.key === selection ? 0 : -1;
            if (!cell.inMonth) b.classList.add('is-out');
            if (cell.isToday) b.classList.add('is-today');
            if (cell.key === selection) { b.classList.add('is-selected'); b.setAttribute('aria-current', 'date'); }
            b.setAttribute('aria-label', `${E.formatLong(cell.date)} — ${d.label}${cell.isToday ? ' — aujourd\'hui' : ''}`);
            b.innerHTML = `<span class="cal-face"><b>${cell.day}</b>${cell.isToday ? '<i aria-hidden="true">★</i>' : ''}</span>`;
            frag.appendChild(b);
        });
        grilleEl.appendChild(frag);

        const r = E.summarizeMonth(grille);
        $('calStatCompany').textContent = r.count.company;
        $('calStatSchool').textContent = r.count.school;
        $('calStatAmount').textContent = `${eur(r.amount)} €`;
        renderDetail();
    }

    /* ---------- vue Année : 13 mini-mois ---------- */
    function renderYear() {
        const conteneur = $('calYearView');
        conteneur.textContent = '';
        const frag = document.createDocumentFragment();
        E.alternanceMonths().forEach(({ year, month }, idx) => {
            const g = E.buildMonthGrid(year, month, today);
            const bloc = document.createElement('div');
            bloc.className = 'cal-mini';
            bloc.style.setProperty('--i', idx);
            const courant = year === vue.year && month === vue.month;
            bloc.innerHTML = `<button type="button" class="cal-mini-title${courant ? ' is-current' : ''}" data-y="${year}" data-m="${month}" aria-label="Ouvrir ${E.MOIS[month]} ${year}">${E.MOIS_COURTS[month]} <em>${String(year).slice(2)}</em></button>` +
                `<div class="cal-mini-grid" aria-hidden="true">${g.cells.map((c) => `<i class="mc t-${c.type}${c.inMonth ? '' : ' is-out'}${c.isToday ? ' is-today' : ''}"></i>`).join('')}</div>`;
            frag.appendChild(bloc);
        });
        conteneur.appendChild(frag);
        $('calTitle').textContent = 'ALTERNANCE 2026-2027';
        window.SP.ui.ransom($('calTitle'));
    }

    function renderDetail() {
        const cell = (grille && grille.cells.find((c) => c.key === selection)) || null;
        if (!cell) return;
        const d = E.describeDay(cell);
        $('calDetailDate').textContent = E.formatLong(cell.date);
        $('calDetailKind').textContent = cell.isToday ? `${d.label} // AUJOURD'HUI` : d.label;
        $('calDetailHours').textContent = d.paid ? plage : '—';
        $('calDetailAmount').textContent = d.paid ? `${eur(Schedule.dailyRate(cell.date.getFullYear(), cell.date.getMonth()))} € NET` : '0,00 € // ACQUISITION EN PAUSE';
        $('calDetail').dataset.kind = d.kind;
    }

    /* ---------- bascule Mois / Année ---------- */
    function setMode(nouveau) {
        if (nouveau === mode) return;
        mode = nouveau;
        const annee = mode === 'year';
        $('calMonthView').hidden = annee;
        $('calYearView').hidden = !annee;
        $('calNavGroup').hidden = annee;
        $('calToday').hidden = annee;
        document.querySelectorAll('.cal-switch-btn').forEach((b) => {
            const actif = b.dataset.view === mode;
            b.classList.toggle('is-active', actif);
            b.setAttribute('aria-pressed', String(actif));
        });
        audio.play('menu');
        if (annee) renderYear(); else renderMonth();
    }

    document.querySelectorAll('.cal-switch-btn').forEach((b) => b.addEventListener('click', () => setMode(b.dataset.view)));

    $('calYearView').addEventListener('click', (e) => {
        const t = e.target.closest('.cal-mini-title');
        if (!t) return;
        vue = { year: Number(t.dataset.y), month: Number(t.dataset.m) };
        selection = E.cle(new Date(vue.year, vue.month, 1));
        setMode('month');
    });

    /* ---------- sélection & navigation (vue Mois) ---------- */
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
        vue = E.shiftMonth(vue.year, vue.month, delta);
        const jour = Number(selection.slice(8));
        const max = new Date(vue.year, vue.month + 1, 0).getDate();
        selection = E.cle(new Date(vue.year, vue.month, Math.min(jour, max)));
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
        if (prefersReducedMotion()) {
            intro.remove();
            document.body.classList.add('cal-ready');
            barresPretes = true;
            renderBars(new Date());
            return;
        }
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
            barresPretes = true;
            setTimeout(() => renderBars(new Date(), 220), 250); // les barres se remplissent l'une après l'autre
            setTimeout(() => window.SP.ui.glitch($('calTodayNum')), 450);
            setTimeout(() => intro.remove(), 600);
        };
        setTimeout(terminer, INTRO_MS);
        ['pointerdown', 'keydown'].forEach((t) => window.addEventListener(t, terminer, { once: true }));
        setTimeout(() => audio.play('confirm'), 700);
    }

    /* ---------- horloge : minute (barres) et passage à minuit ---------- */
    onTick((now) => {
        if (E.cle(now) !== E.cle(today)) {
            today = now;
            renderToday();
            if (mode === 'month') renderMonth(); else renderYear();
        }
        const minute = `${now.getHours()}:${now.getMinutes()}`;
        if (barresPretes && minute !== minuteBarres) {
            minuteBarres = minute;
            renderBars(now);
        }
    });

    renderToday();
    renderMonth();
    jouerIntro();
})();
