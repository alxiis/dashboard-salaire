/**
 * GRILLE RNCP // affichage et interactions
 * Données : window.RNCP_DATA (référentiel) + window.RNCP_PROGRESS (suivi) + import local (localStorage).
 * Tout le texte passe par textContent : aucune injection HTML possible, même depuis un JSON importé.
 */
(function () {
    'use strict';

    const DATA = window.RNCP_DATA;
    const SP = window.SP;
    const $ = (id) => document.getElementById(id);

    if (!DATA || !SP) {
        const board = $('rnBoard');
        if (board) board.textContent = 'Fichiers du site en cache obsolètes : rechargez la page avec Ctrl+F5.';
        return;
    }

    const LS_KEY = 'salary_pulse_rncp_local_v1';
    const RETARD_JOURS = 7; // au-delà, la mise à jour hebdo est signalée en retard

    /* ---------------------------------------------------------------------
       1. RÉFÉRENTIEL : index des compétences
       --------------------------------------------------------------------- */
    const index = new Map(); // id -> { comp, mission, bloc }
    const ordre = [];        // ids dans l'ordre du référentiel
    DATA.blocs.forEach((bloc) => bloc.missions.forEach((mission) => mission.competences.forEach((comp) => {
        index.set(comp.id, { comp, mission, bloc });
        ordre.push(comp.id);
    })));
    const TOTAL = ordre.length;

    const STATUTS = {
        'a-faire': { label: 'À FAIRE', court: 'À FAIRE' },
        'en-cours': { label: 'EN COURS', court: 'EN COURS' },
        validee: { label: 'VALIDÉE', court: 'VALIDÉE' }
    };

    /* ---------------------------------------------------------------------
       2. SUIVI : validation, fusion, persistance locale
       --------------------------------------------------------------------- */
    const RE_DATE = /^\d{4}-\d{2}-\d{2}$/;

    function dateValide(s) {
        if (typeof s !== 'string' || !RE_DATE.test(s)) return false;
        const [y, m, d] = s.split('-').map(Number);
        const dt = new Date(y, m - 1, d);
        return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
    }
    const texte = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
    const rang = (statut) => (statut === 'validee' ? 2 : statut === 'en-cours' ? 1 : 0);

    /** Nettoie n'importe quelle entrée : ids inconnus ignorés, champs bornés, dates vérifiées. */
    function normaliser(brut) {
        const sortie = { maj: null, competences: {}, ignores: [] };
        if (!brut || typeof brut !== 'object') return sortie;
        if (dateValide(brut.maj)) sortie.maj = brut.maj;
        const source = brut.competences && typeof brut.competences === 'object' ? brut.competences : {};
        Object.keys(source).forEach((id) => {
            if (!index.has(id)) { sortie.ignores.push(id); return; }
            const e = source[id];
            if (!e || typeof e !== 'object') return;
            const preuves = (Array.isArray(e.preuves) ? e.preuves : [])
                .map((p) => ({
                    date: p && dateValide(p.date) ? p.date : null,
                    titre: texte(p && p.titre, 120),
                    detail: texte(p && p.detail, 1500),
                    source: texte(p && p.source, 200)
                }))
                .filter((p) => p.date && p.titre);
            const statut = e.statut === 'validee' || e.statut === 'en-cours' ? e.statut : null;
            if (preuves.length || statut) sortie.competences[id] = { statut, preuves };
        });
        return sortie;
    }

    /** Union de deux suivis : meilleur statut, preuves dédoublonnées (date + titre), plus récentes d'abord. */
    function fusionner(a, b) {
        const sortie = { maj: [a.maj, b.maj].filter(Boolean).sort().pop() || null, competences: {} };
        [a, b].forEach((src) => Object.entries(src.competences).forEach(([id, e]) => {
            const cur = sortie.competences[id] || (sortie.competences[id] = { statut: null, preuves: [] });
            if (rang(e.statut) > rang(cur.statut)) cur.statut = e.statut;
            e.preuves.forEach((p) => {
                if (!cur.preuves.some((q) => q.date === p.date && q.titre === p.titre)) cur.preuves.push(p);
            });
        }));
        Object.values(sortie.competences).forEach((e) => e.preuves.sort((x, y) => y.date.localeCompare(x.date)));
        return sortie;
    }

    function lireLocal() {
        try { return JSON.parse(localStorage.getItem(LS_KEY)); } catch (e) { return null; }
    }
    function ecrireLocal(valeur) {
        try {
            if (valeur) localStorage.setItem(LS_KEY, JSON.stringify(valeur)); else localStorage.removeItem(LS_KEY);
            return true;
        } catch (e) { return false; }
    }

    const base = normaliser(window.RNCP_PROGRESS);
    let etat = fusionner(base, normaliser(lireLocal()));

    const nbPreuves = (id) => (etat.competences[id] ? etat.competences[id].preuves.length : 0);
    function statutDe(id) {
        const e = etat.competences[id];
        if (!e) return 'a-faire';
        if (e.statut === 'validee') return 'validee';
        return e.preuves.length || e.statut === 'en-cours' ? 'en-cours' : 'a-faire';
    }
    const totalPreuves = () => Object.values(etat.competences).reduce((n, e) => n + e.preuves.length, 0);

    /* ---------------------------------------------------------------------
       3. OUTILS
       --------------------------------------------------------------------- */
    function el(tag, cls, contenu) {
        const n = document.createElement(tag);
        if (cls) n.className = cls;
        if (contenu !== undefined) n.textContent = contenu;
        return n;
    }
    const pluriel = (n, un, plusieurs) => `${n} ${n > 1 ? plusieurs : un}`;
    const sansAccent = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    const parseJour = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
    const cleJour = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const fmtDate = (s) => parseJour(s).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    const fmtCourt = (d) => d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }).replace('.', '').toUpperCase();
    const minuit = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const ecartJours = (a, b) => Math.round((minuit(a) - minuit(b)) / 86400000);

    /** Semaine ISO : { cle: '2026-W46', num: 46, lundi: Date } */
    function semaineIso(d) {
        const lundi = minuit(d);
        lundi.setDate(lundi.getDate() - ((lundi.getDay() + 6) % 7));
        const jeudi = new Date(lundi);
        jeudi.setDate(lundi.getDate() + 3);
        const an = jeudi.getFullYear();
        const jan4 = new Date(an, 0, 4);
        const num = 1 + Math.round(((jeudi - jan4) / 86400000 - 3 + ((jan4.getDay() + 6) % 7)) / 7);
        return { cle: `${an}-W${String(num).padStart(2, '0')}`, num, lundi };
    }

    async function copier(valeur, zone) {
        try {
            await navigator.clipboard.writeText(valeur);
            return true;
        } catch (e) {
            try {
                const tmp = zone || el('textarea');
                if (!zone) { tmp.value = valeur; tmp.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(tmp); }
                tmp.focus();
                tmp.select();
                const ok = document.execCommand('copy');
                if (!zone) tmp.remove();
                return ok;
            } catch (e2) { return false; }
        }
    }

    function message(texteMsg, genre) {
        const m = $('rnMsg');
        m.textContent = texteMsg;
        m.dataset.kind = genre || 'info';
    }

    /* ---------------------------------------------------------------------
       4. SYNTHÈSE : barres, compteurs, dates
       --------------------------------------------------------------------- */
    function setBar(id, ratio, compte) {
        const racine = $(id);
        racine.querySelector('.hp-track').style.setProperty('--p', Math.min(1, Math.max(0, ratio)).toFixed(4));
        racine.querySelector('[data-bar-pct]').textContent = `${Math.round(ratio * 100)} %`;
        racine.querySelector('[data-bar-count]').textContent = `${compte} / ${TOTAL}`;
    }

    function compter() {
        const n = { 'a-faire': 0, 'en-cours': 0, validee: 0 };
        ordre.forEach((id) => { n[statutDe(id)]++; });
        return n;
    }

    function renderSynthese() {
        const n = compter();
        const couvertes = n['en-cours'] + n.validee;
        setBar('rnBarCovered', couvertes / TOTAL, couvertes);
        setBar('rnBarValidated', n.validee / TOTAL, n.validee);
        $('rnCountTodo').textContent = n['a-faire'];
        $('rnCountDoing').textContent = n['en-cours'];
        $('rnCountDone').textContent = n.validee;

        const now = new Date();
        const fact = $('rnFactUpdate');
        if (!etat.maj) {
            $('rnUpdateText').textContent = 'JAMAIS';
            $('rnUpdateSub').textContent = 'Lance la 1re mise à jour (section 03)';
            fact.dataset.late = 'true';
        } else {
            const jours = ecartJours(now, parseJour(etat.maj));
            $('rnUpdateText').textContent = parseJour(etat.maj).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase();
            const enRetard = jours > RETARD_JOURS;
            $('rnUpdateSub').textContent = jours <= 0 ? "Aujourd'hui" : enRetard ? `En retard de ${jours - RETARD_JOURS} j · à refaire` : jours === 1 ? 'Hier' : `Il y a ${jours} jours`;
            fact.dataset.late = String(enRetard);
        }

        const fin = SP.Schedule.END;
        const reste = ecartJours(fin, now);
        $('rnEndText').textContent = fin.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase();
        $('rnEndSub').textContent = reste > 0 ? `J-${reste} · ${pluriel(Math.ceil(reste / 7), 'semaine', 'semaines')} pour tout couvrir` : 'Alternance terminée';
    }

    /* ---------------------------------------------------------------------
       5. FILTRES & GRILLE
       --------------------------------------------------------------------- */
    const filtre = { statut: 'all', bloc: 'all', q: '' };

    function renderFiltreBlocs() {
        const zone = $('rnBlocFilter');
        zone.textContent = '';
        const tous = el('button', 'rn-chip', 'TOUS LES BLOCS');
        tous.type = 'button';
        tous.dataset.bloc = 'all';
        zone.append(tous);
        DATA.blocs.forEach((bloc) => {
            const ids = bloc.missions.flatMap((m) => m.competences.map((c) => c.id));
            const couvertes = ids.filter((id) => statutDe(id) !== 'a-faire').length;
            const b = el('button', 'rn-chip');
            b.type = 'button';
            b.dataset.bloc = bloc.id;
            b.append(bloc.id, el('small', '', ` ${couvertes}/${ids.length}`));
            zone.append(b);
        });
        majBoutonsFiltres();
    }

    function majBoutonsFiltres() {
        document.querySelectorAll('#rnStatusFilter .rn-chip').forEach((b) => {
            const actif = b.dataset.status === filtre.statut;
            b.classList.toggle('is-active', actif);
            b.setAttribute('aria-pressed', String(actif));
        });
        document.querySelectorAll('#rnBlocFilter .rn-chip').forEach((b) => {
            const actif = b.dataset.bloc === filtre.bloc;
            b.classList.toggle('is-active', actif);
            b.setAttribute('aria-pressed', String(actif));
        });
    }

    function correspond(id) {
        const { comp, mission, bloc } = index.get(id);
        if (filtre.bloc !== 'all' && bloc.id !== filtre.bloc) return false;
        if (filtre.statut !== 'all' && statutDe(id) !== filtre.statut) return false;
        if (!filtre.q) return true;
        const e = etat.competences[id];
        const foin = sansAccent([
            id, comp.titre, comp.texte, mission.titre, ...mission.items,
            ...(e ? e.preuves.flatMap((p) => [p.titre, p.detail, p.source]) : [])
        ].join(' '));
        return filtre.q.split(/\s+/).every((mot) => foin.includes(mot));
    }

    function carte(id) {
        const { comp } = index.get(id);
        const st = statutDe(id);
        const n = nbPreuves(id);
        const b = el('button', 'rn-card');
        b.type = 'button';
        b.dataset.id = id;
        b.dataset.statut = st;
        b.setAttribute('aria-label', `${id} — ${comp.titre} — ${STATUTS[st].label}${n ? `, ${pluriel(n, 'preuve', 'preuves')}` : ''}`);
        const pied = el('span', 'rn-card-foot');
        pied.append(el('span', 'rn-badge', STATUTS[st].court), el('span', 'rn-card-count', n ? pluriel(n, 'preuve', 'preuves') : 'aucune preuve'));
        b.append(el('span', 'rn-card-id', id), el('span', 'rn-card-title', comp.titre), pied);
        return b;
    }

    function renderBoard() {
        const board = $('rnBoard');
        board.textContent = '';
        let affichees = 0;

        DATA.blocs.forEach((bloc) => {
            const missions = bloc.missions
                .map((mission) => ({ mission, ids: mission.competences.map((c) => c.id).filter(correspond) }))
                .filter((x) => x.ids.length);
            if (!missions.length) return;

            const tousIds = bloc.missions.flatMap((m) => m.competences.map((c) => c.id));
            const couvertes = tousIds.filter((id) => statutDe(id) !== 'a-faire').length;
            const validees = tousIds.filter((id) => statutDe(id) === 'validee').length;

            const section = el('section', 'rn-bloc');
            section.setAttribute('aria-labelledby', `rnBloc-${bloc.id}`);

            const tete = el('header', 'rn-bloc-head');
            const titre = el('h2', 'rn-bloc-title');
            titre.id = `rnBloc-${bloc.id}`;
            titre.append(el('span', 'rn-bloc-tag', bloc.id), el('span', 'rn-bloc-name', bloc.titre));
            const jauge = el('p', 'rn-bloc-gauge');
            jauge.style.setProperty('--c', (couvertes / tousIds.length).toFixed(3));
            jauge.style.setProperty('--v', (validees / tousIds.length).toFixed(3));
            jauge.append(el('span', 'rn-bloc-bar'), el('span', 'rn-bloc-count', `${couvertes} / ${tousIds.length} couvertes · ${validees} validées`));
            tete.append(titre, jauge);
            section.append(tete);

            const grilleMissions = el('div', 'rn-missions');
            missions.forEach(({ mission, ids }) => {
                const bloc2 = el('div', 'rn-mission');
                const mt = el('h3', 'rn-mission-title', mission.titre);
                bloc2.append(mt);
                if (mission.items.length) {
                    const ex = el('ul', 'rn-mission-items');
                    mission.items.forEach((it) => ex.append(el('li', '', it)));
                    bloc2.append(ex);
                }
                const liste = el('ul', 'rn-cards');
                ids.forEach((id) => { const li = el('li'); li.append(carte(id)); liste.append(li); affichees++; });
                bloc2.append(liste);
                grilleMissions.append(bloc2);
            });
            section.append(grilleMissions);
            board.append(section);
        });

        const filtreActif = filtre.statut !== 'all' || filtre.bloc !== 'all' || filtre.q;
        $('rnResult').textContent = filtreActif ? `${pluriel(affichees, 'compétence affichée', 'compétences affichées')} sur ${TOTAL}` : `${TOTAL} compétences`;
        if (!affichees) {
            const vide = el('div', 'rn-empty-board');
            vide.append(el('b', '', 'AUCUNE COMPÉTENCE'), el('span', '', 'Aucun résultat avec ces filtres.'));
            const raz = el('button', 'rn-btn', 'RÉINITIALISER LES FILTRES');
            raz.type = 'button';
            raz.addEventListener('click', reinitialiserFiltres);
            vide.append(raz);
            board.append(vide);
        }
    }

    function reinitialiserFiltres() {
        filtre.statut = 'all';
        filtre.bloc = 'all';
        filtre.q = '';
        $('rnSearch').value = '';
        majBoutonsFiltres();
        renderBoard();
    }

    $('rnStatusFilter').addEventListener('click', (e) => {
        const b = e.target.closest('.rn-chip');
        if (!b) return;
        filtre.statut = b.dataset.status;
        SP.audio.play('menu');
        majBoutonsFiltres();
        renderBoard();
    });
    $('rnBlocFilter').addEventListener('click', (e) => {
        const b = e.target.closest('.rn-chip');
        if (!b) return;
        filtre.bloc = b.dataset.bloc;
        SP.audio.play('menu');
        majBoutonsFiltres();
        renderBoard();
    });
    $('rnSearch').addEventListener('input', (e) => {
        filtre.q = sansAccent(e.target.value.trim());
        renderBoard();
    });

    /* ---------------------------------------------------------------------
       6. FICHE D'UNE COMPÉTENCE (panneau latéral)
       --------------------------------------------------------------------- */
    const panneau = $('rnPanel');
    const voile = $('rnBackdrop');
    let courant = null;      // id affiché
    let declencheur = null;  // élément à refocaliser à la fermeture

    function blocFiche(titre, ...contenus) {
        const s = el('section', 'rn-panel-block');
        s.append(el('h3', 'rn-panel-h', titre), ...contenus);
        return s;
    }

    function preuve(p) {
        const a = el('article', 'rn-proof');
        const tete = el('header', 'rn-proof-head');
        const date = el('time', 'rn-proof-date', fmtDate(p.date));
        date.dateTime = p.date;
        tete.append(date);
        a.append(tete, el('h4', 'rn-proof-title', p.titre));
        p.detail.split(/\n+/).filter(Boolean).forEach((ligne) => a.append(el('p', 'rn-proof-detail', ligne)));
        if (p.source) a.append(el('p', 'rn-proof-source', `SOURCE · ${p.source}`));
        return a;
    }

    function renderFiche(id) {
        const { comp, mission, bloc: b } = index.get(id);
        const st = statutDe(id);
        const e = etat.competences[id];
        const corps = $('rnPanelBody');
        corps.textContent = '';

        const tags = el('p', 'rn-panel-tags');
        tags.append(el('span', 'rn-bloc-tag', b.id), el('span', 'rn-panel-id', id), el('span', 'rn-badge', STATUTS[st].label));
        tags.lastChild.dataset.statut = st;
        const titre = el('h2', 'rn-panel-title', comp.titre);
        titre.id = 'rnPanelTitle';
        corps.append(tags, titre);

        // Ce qui a été fait (le cœur de la fiche)
        const preuves = e ? e.preuves : [];
        const fait = blocFiche(`CE QUI A ÉTÉ FAIT · ${preuves.length}`);
        if (preuves.length) {
            preuves.forEach((p) => fait.append(preuve(p)));
        } else {
            const vide = el('div', 'rn-empty');
            vide.append(
                el('b', '', 'RIEN D’ENREGISTRÉ POUR L’INSTANT'),
                el('span', '', 'Aucun travail n’est rattaché à cette compétence. Elle sera complétée à la prochaine mise à jour hebdo, si une mission la couvre. Les exemples ci-dessous disent quoi viser.')
            );
            fait.append(vide);
        }
        corps.append(fait);

        corps.append(blocFiche('COMPÉTENCE DU RÉFÉRENTIEL', el('p', 'rn-panel-text', comp.texte)));

        const mission2 = [el('p', 'rn-panel-text rn-panel-strong', mission.titre)];
        if (mission.items.length) {
            const ul = el('ul', 'rn-panel-list');
            mission.items.forEach((it) => ul.append(el('li', '', it)));
            mission2.push(ul);
        }
        corps.append(blocFiche('MISSION TYPE · EXEMPLES ATTENDUS', ...mission2));

        // Navigation entre compétences
        const pos = ordre.indexOf(id);
        const nav = el('nav', 'rn-panel-nav');
        nav.setAttribute('aria-label', 'Compétence précédente ou suivante');
        [[-1, '◀ PRÉCÉDENTE'], [1, 'SUIVANTE ▶']].forEach(([pas, libelle]) => {
            const cible = ordre[pos + pas];
            const btn = el('button', 'rn-btn', libelle);
            btn.type = 'button';
            if (!cible) btn.disabled = true;
            else btn.addEventListener('click', () => { SP.audio.play('hover'); ouvrir(cible, { garderFocus: true }); });
            nav.append(btn);
        });
        corps.append(nav);
    }

    function ouvrir(id, { garderFocus = false } = {}) {
        if (!index.has(id)) return;
        if (!garderFocus) declencheur = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        const dejaOuvert = courant !== null;
        courant = id;
        renderFiche(id);
        panneau.scrollTop = 0;
        $('rnPanelBody').scrollTop = 0;
        if (!dejaOuvert) {
            voile.hidden = false;
            panneau.hidden = false;
            $('rnApp').inert = true;
            document.documentElement.classList.add('rn-locked');
            void panneau.offsetWidth; // déclenche la transition d'entrée
            panneau.classList.add('is-open');
            voile.classList.add('is-open');
            SP.audio.play('hover');
        }
        $('rnPanelClose').focus({ preventScroll: true });
        try { history.replaceState(null, '', `#${id}`); } catch (e) { /* facultatif */ }
    }

    function fermer() {
        if (courant === null) return;
        const cible = declencheur;
        courant = null;
        declencheur = null;
        panneau.classList.remove('is-open');
        voile.classList.remove('is-open');
        $('rnApp').inert = false;
        document.documentElement.classList.remove('rn-locked');
        const fin = () => { panneau.hidden = true; voile.hidden = true; };
        if (SP.prefersReducedMotion()) fin(); else setTimeout(() => { if (courant === null) fin(); }, 260);
        SP.audio.play('back');
        try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* facultatif */ }
        if (cible && cible.isConnected) cible.focus({ preventScroll: true });
    }

    // Délégation : cartes de la grille et éléments du journal
    document.addEventListener('click', (e) => {
        const t = e.target.closest('[data-id]');
        if (t && t.closest('#rnBoard, #rnWeeks')) ouvrir(t.dataset.id);
    });
    $('rnPanelClose').addEventListener('click', fermer);
    voile.addEventListener('click', fermer);

    // Capture : passe avant le raccourci global « ESC = menu » de shared.js
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const t = e.target;
            if (courant !== null) { e.preventDefault(); fermer(); return; }
            if (t instanceof HTMLInputElement && t.value) { e.preventDefault(); t.value = ''; t.dispatchEvent(new Event('input')); return; }
            if (t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement) { e.preventDefault(); t.blur(); }
            return;
        }
        if (courant !== null && (e.key === 'ArrowLeft' || e.key === 'ArrowRight') && !e.ctrlKey && !e.metaKey && !e.altKey) {
            const cible = ordre[ordre.indexOf(courant) + (e.key === 'ArrowLeft' ? -1 : 1)];
            if (cible) { e.preventDefault(); ouvrir(cible, { garderFocus: true }); }
        }
    }, true);

    /* ---------------------------------------------------------------------
       7. JOURNAL HEBDOMADAIRE
       --------------------------------------------------------------------- */
    function renderJournal() {
        const liste = $('rnWeeks');
        liste.textContent = '';
        const semaines = new Map();
        Object.entries(etat.competences).forEach(([id, e]) => e.preuves.forEach((p) => {
            const w = semaineIso(parseJour(p.date));
            if (!semaines.has(w.cle)) semaines.set(w.cle, { ...w, items: [] });
            semaines.get(w.cle).items.push({ id, p });
        }));

        if (!semaines.size) {
            const li = el('li', 'rn-empty');
            li.append(el('b', '', 'AUCUNE SEMAINE ENREGISTRÉE'), el('span', '', 'Chaque mise à jour hebdo ajoute ici ce qui a été fait, semaine par semaine.'));
            liste.append(li);
            return;
        }

        [...semaines.values()].sort((a, b) => b.cle.localeCompare(a.cle)).forEach((w) => {
            const dimanche = new Date(w.lundi);
            dimanche.setDate(w.lundi.getDate() + 6);
            const comps = new Set(w.items.map((x) => x.id));
            const li = el('li', 'rn-week');
            const tete = el('div', 'rn-week-head');
            tete.append(
                el('span', 'rn-week-num', `S${String(w.num).padStart(2, '0')}`),
                el('span', 'rn-week-range', `${fmtCourt(w.lundi)} → ${fmtCourt(dimanche)} ${dimanche.getFullYear()}`),
                el('span', 'rn-week-count', `${pluriel(w.items.length, 'preuve', 'preuves')} · ${pluriel(comps.size, 'compétence', 'compétences')}`)
            );
            const ul = el('ul', 'rn-week-items');
            w.items.sort((a, b) => b.p.date.localeCompare(a.p.date)).forEach(({ id, p }) => {
                const item = el('li');
                const btn = el('button', 'rn-week-item');
                btn.type = 'button';
                btn.dataset.id = id;
                btn.append(el('span', 'rn-card-id', id), el('span', 'rn-week-item-title', p.titre));
                item.append(btn);
                ul.append(item);
            });
            li.append(tete, ul);
            liste.append(li);
        });
    }

    /* ---------------------------------------------------------------------
       8. MISE À JOUR HEBDO : prompt, import, export
       --------------------------------------------------------------------- */
    function construirePrompt() {
        const S = SP.Schedule;
        const aujourdhui = cleJour(new Date());
        const depuis = etat.maj ? `le ${fmtDate(etat.maj)}` : `le début de l'alternance (${fmtDate(S.CONFIG.ALTERNANCE_START)})`;
        const lignes = [];
        DATA.blocs.forEach((b) => {
            lignes.push('', `${b.id} — ${b.titre}`);
            b.missions.forEach((m) => m.competences.forEach((c) => lignes.push(`${c.id} · ${c.titre}`)));
        });
        const deja = ordre.filter((id) => nbPreuves(id)).map((id) => `${id} (${nbPreuves(id)})`).join(', ');

        return [
            `Tu m'aides à suivre mon mémoire d'alternance : Bachelor Réseaux Cloud & Cybersécurité, titre « ${DATA.titre} », RNCP ${DATA.rncp}, en entreprise chez NOOUS.`,
            '',
            'MISSION',
            `Parcours les conversations de ce projet depuis ${depuis} (inclus) jusqu'au ${fmtDate(aujourdhui)}. Relève chaque travail concret que j'ai réalisé ou observé en entreprise et rattache-le aux compétences RNCP de la liste ci-dessous, par leur identifiant.`,
            '',
            'RÈGLES',
            "- N'invente rien : une preuve doit être attestée par une conversation. Si c'est flou, ne la retiens pas.",
            "- Une preuve = un travail précis : date (AAAA-MM-JJ), titre court (80 caractères max), détail (2 à 4 phrases : contexte, ce que j'ai fait, résultat, outils utilisés), source (titre de la conversation).",
            '- Une même action peut couvrir plusieurs compétences : répète-la sous chaque identifiant concerné.',
            '- statut : "en-cours" par défaut ; "validee" seulement si la compétence est démontrée de bout en bout (réalisation complète ou plusieurs preuves).',
            '- Ignore tout ce qui n\'est pas du travail en entreprise.',
            deja ? `- Compétences déjà documentées (nombre de preuves) : ${deja}. Ne ressors que les nouveautés.` : '- Aucune compétence n\'est encore documentée : repars de zéro.',
            '',
            'FORMAT DE SORTIE',
            'Réponds UNIQUEMENT avec un bloc JSON valide, sans commentaire autour :',
            `{"maj":"${aujourdhui}","competences":{"BC01-01":{"statut":"en-cours","preuves":[{"date":"AAAA-MM-JJ","titre":"…","detail":"…","source":"Claude Chat · NOOUS · « titre de la conversation »"}]}}}`,
            '',
            'COMPÉTENCES (identifiant · intitulé)',
            ...lignes
        ].join('\n');
    }

    function renderPrompt() { $('rnPrompt').value = construirePrompt(); }

    /** Le JSON peut arriver dans un bloc ```json ... ``` : on isole le premier objet. */
    function extraireJson(brut) {
        const a = brut.indexOf('{');
        const z = brut.lastIndexOf('}');
        if (a === -1 || z <= a) throw new Error('Aucun objet JSON trouvé.');
        return JSON.parse(brut.slice(a, z + 1));
    }

    function importer() {
        const zone = $('rnImport');
        const brut = zone.value.trim();
        if (!brut) { message('Colle d\'abord le JSON renvoyé par Claude Chat.', 'error'); return; }
        let entree;
        try { entree = extraireJson(brut); } catch (e) { message(`JSON illisible : ${e.message}`, 'error'); return; }

        const propre = normaliser(entree);
        const nbComp = Object.keys(propre.competences).length;
        if (!nbComp) {
            message(propre.ignores.length ? `Aucun identifiant reconnu (ignorés : ${propre.ignores.slice(0, 5).join(', ')}).` : 'Aucune compétence ni preuve valide dans ce JSON.', 'error');
            return;
        }
        if (!propre.maj) propre.maj = cleJour(new Date());

        const avant = totalPreuves();
        const local = fusionner(normaliser(lireLocal()), propre);
        if (!ecrireLocal({ maj: local.maj, competences: local.competences })) {
            message('Import appliqué pour cette session, mais le navigateur refuse de le mémoriser (navigation privée ?).', 'error');
        }
        etat = fusionner(base, local);
        const ajoutees = totalPreuves() - avant;
        zone.value = '';
        SP.audio.play('gain');
        rafraichir();
        const ignores = propre.ignores.length ? ` ${pluriel(propre.ignores.length, 'identifiant inconnu ignoré', 'identifiants inconnus ignorés')} (${propre.ignores.slice(0, 5).join(', ')}).` : '';
        message(`Import réussi : ${pluriel(nbComp, 'compétence', 'compétences')}, ${pluriel(ajoutees, 'nouvelle preuve', 'nouvelles preuves')}.${ignores}`, 'ok');
    }

    function exporter() {
        const sortie = { maj: etat.maj, competences: {} };
        ordre.forEach((id) => {
            const e = etat.competences[id];
            if (!e) return;
            sortie.competences[id] = {};
            if (e.statut) sortie.competences[id].statut = e.statut;
            sortie.competences[id].preuves = e.preuves;
        });
        copier(`window.RNCP_PROGRESS = ${JSON.stringify(sortie, null, 4)};\n`).then((ok) =>
            message(ok ? 'JSON fusionné copié : remplace le bloc « window.RNCP_PROGRESS = … » de rncp/rncp-progress.js, puis publie.' : 'Copie impossible : autorise le presse-papiers ou copie à la main.', ok ? 'ok' : 'error'));
    }

    $('rnCopyPrompt').addEventListener('click', () => {
        copier($('rnPrompt').value, $('rnPrompt')).then((ok) => message(ok ? 'Prompt copié : colle-le dans Claude Chat (projet NOOUS).' : 'Copie impossible : sélectionne le texte à la main.', ok ? 'ok' : 'error'));
    });
    $('rnImportBtn').addEventListener('click', importer);
    $('rnExportBtn').addEventListener('click', exporter);
    $('rnResetBtn').addEventListener('click', () => {
        if (!lireLocal()) { message('Aucun import local à effacer.', 'info'); return; }
        if (!window.confirm('Effacer l\'import local de ce navigateur ? Les données de rncp-progress.js restent intactes.')) return;
        ecrireLocal(null);
        etat = fusionner(base, normaliser(null));
        rafraichir();
        message('Import local effacé.', 'ok');
    });

    /* ---------------------------------------------------------------------
       9. INIT
       --------------------------------------------------------------------- */
    function rafraichir() {
        renderSynthese();
        renderFiltreBlocs();
        renderBoard();
        renderJournal();
        renderPrompt();
        if (courant !== null) renderFiche(courant);
    }

    // Barres : première valeur posée après le premier rendu pour déclencher l'animation
    rafraichir();

    const initial = decodeURIComponent(location.hash.slice(1));
    if (index.has(initial)) ouvrir(initial);
})();
