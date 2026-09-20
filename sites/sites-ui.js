/**
 * MES SITES // affichage : une carte par entrée de SITES_CONFIG (sites-config.js).
 * Les liens s'ouvrent dans un nouvel onglet : le hub Salary Pulse reste ouvert.
 */
(function () {
    'use strict';

    const liste = document.getElementById('sitesList');
    const sites = Array.isArray(window.SITES_CONFIG) ? window.SITES_CONFIG : [];

    /** Crée <tag class="cls">texte</tag> (textContent : aucune injection HTML possible). */
    function el(tag, cls, texte) {
        const n = document.createElement(tag);
        if (cls) n.className = cls;
        if (texte !== undefined) n.textContent = texte;
        return n;
    }

    const hote = (url) => { try { return new URL(url).host + new URL(url).pathname.replace(/\/$/, ''); } catch (e) { return url; } };

    sites.forEach((site, i) => {
        const carte = el('a', 'site-card sp-slab');
        carte.href = site.url;
        carte.target = '_blank';
        carte.rel = 'noopener noreferrer';
        carte.style.setProperty('--i', i);
        carte.setAttribute('aria-label', `${site.title} ${site.subtitle} — ouvrir ${hote(site.url)} dans un nouvel onglet`);

        carte.append(
            el('span', 'site-num', String(i + 1).padStart(2, '0')),
            (() => {
                const t = el('span', 'site-title');
                t.append(el('span', 'site-t1', site.title), el('span', 'site-t2', site.subtitle));
                return t;
            })(),
            el('span', 'site-desc', site.description),
            (() => {
                const tags = el('span', 'site-tags');
                (site.tags || []).forEach((tag) => tags.append(el('span', 'site-tag', tag)));
                return tags;
            })(),
            el('span', 'site-url', hote(site.url)),
            el('span', 'site-open', 'OUVRIR ▶')
        );
        liste.append(carte);
    });

    if (!sites.length) liste.append(el('p', 'sites-empty', 'AUCUN SITE CONFIGURÉ // sites/sites-config.js'));
})();
