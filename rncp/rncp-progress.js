/**
 * GRILLE RNCP // SUIVI (LE fichier à mettre à jour chaque semaine)
 * ---------------------------------------------------------------------------
 * Chaque entrée de `competences` est rattachée à une compétence de rncp-data.js par son id.
 *
 *   'BC01-02': {
 *       statut: 'en-cours',            // 'en-cours' | 'validee'   (omis = en-cours dès qu'il y a une preuve)
 *       preuves: [
 *           {
 *               date: '2026-11-12',                        // AAAA-MM-JJ : jour où le travail a été fait
 *               titre: 'Installation du serveur de fichiers',   // 80 caractères max
 *               detail: 'Contexte, ce que j’ai fait, résultat, outils utilisés (2 à 4 phrases).',
 *               source: 'Claude Chat · NOOUS · « titre de la conversation »'   // d'où ça vient
 *           }
 *       ]
 *   }
 *
 * Règles :
 *   - une compétence sans preuve est « À FAIRE » ; avec au moins une preuve : « EN COURS » ;
 *   - « VALIDÉE » se pose à la main, quand la compétence est démontrée de bout en bout ;
 *   - `maj` = date de la dernière mise à jour (la page signale un retard au-delà de 7 jours).
 *
 * Mise à jour : demander à Claude Chat (projet NOOUS) le JSON de la semaine avec le prompt
 * de la page « Mise à jour hebdo », puis soit le coller dans la page (bouton IMPORTER),
 * soit le copier ici et publier. Voir README.
 */
window.RNCP_PROGRESS = {
    maj: null,          // ex. '2026-11-15'
    competences: {
        // 'BC01-01': { statut: 'en-cours', preuves: [ { date: '2026-11-12', titre: '…', detail: '…', source: '…' } ] },
    }
};
