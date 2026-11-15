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
 *               titre: 'Installation du serveur de fichiers',   // 120 caractères max
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
 *
 * Mise à jour du 2026-11-15 : premier import (28/10 → 13/11/2026), JSON de Claude Chat.
 */
window.RNCP_PROGRESS = {
    "maj": "2026-11-15",
    "competences": {
        "BC01-01": {
            "statut": "en-cours",
            "preuves": [
                { "date": "2026-10-28", "titre": "Routeur/pare-feu OPNsense pour le lab de déploiement FOG", "detail": "Dans le cadre du remplacement de WDS/MDT, j'ai installé et configuré OPNsense comme routeur/pare-feu d'un réseau virtuel isolé (VMnet5). J'ai ensuite relié ce réseau à une carte Ethernet dédiée de l'hôte pour tester un portable physique. J'ai corrigé un conflit de routage : mon PC passait par la passerelle du lab au lieu du réseau de l'entreprise, à cause d'une carte VMnet5 en double. Outils : OPNsense, VMware Workstation.", "source": "Claude Chat · NOOUS · « Alternatives à WDS MDT »" }
            ]
        },
        "BC01-02": {
            "statut": "en-cours",
            "preuves": [
                { "date": "2026-10-28", "titre": "Contrôleur de domaine et serveur FOG installés pour le lab de déploiement", "detail": "J'ai installé un Windows Server contrôleur de domaine (AD DS, DNS, DHCP, domaine lab.internal, OU Postes-Deploiement) et un serveur FOG 1.5 stable sur Debian 13. Le DHCP Windows sert le démarrage PXE UEFI. J'ai contourné un bug connu de FOG (mmx64.efi non publié) pour faire fonctionner le Secure Boot. Le lab a été validé du 28/10 au 08/11/2026.", "source": "Claude Chat · NOOUS · « Alternatives à WDS MDT »" }
            ]
        },
        "BC01-03": {
            "statut": "en-cours",
            "preuves": [
                { "date": "2026-10-28", "titre": "Lab virtualisé sous VMware Workstation pour tester FOG", "detail": "Sur mon poste, j'ai monté un lab de plusieurs VM (OPNsense, contrôleur de domaine, serveur FOG, master et postes Windows 11) sur un réseau virtuel isolé. J'ai utilisé des snapshots nommés par version du master. J'ai aussi récupéré une VM corrompue après un plantage de l'hôte. Outils : VMware Workstation.", "source": "Claude Chat · NOOUS · « Alternatives à WDS MDT »" }
            ]
        },
        "BC01-05": {
            "statut": "en-cours",
            "preuves": [
                { "date": "2026-10-29", "titre": "Boîte aux lettres et archive Exchange Online proches de la saturation", "detail": "Pour un ticket sur une archive pleine, j'ai lancé des commandes PowerShell de diagnostic en lecture seule (Get-Mailbox, Get-MailboxStatistics). Résultat : archive à 100 Go (environ 501 000 éléments) et boîte principale à 49,18 Go, presque au quota de 50 Go. J'ai signalé l'urgence et prévu de faire valider par mon tuteur l'archivage à extension automatique, irréversible. Outils : Exchange Online PowerShell.", "source": "Claude Chat · NOOUS · « Boîte : comment faire »" },
                { "date": "2026-11-13", "titre": "Réactivation de BitLocker et contrôle de l'état remonté par Atera", "detail": "Atera indiquait que BitLocker n'était pas actif sur le PC d'une utilisatrice. J'ai désactivé puis réactivé BitLocker. J'ai ensuite vérifié l'état réel avec manage-bde : le rechiffrement était en cours (86 %), d'où la protection affichée comme désactivée. Outils : Atera, manage-bde.", "source": "Claude Chat · NOOUS · « Échec de connexion VPN OpenVPN »" }
            ]
        },
        "BC01-06": {
            "statut": "validee",
            "preuves": [
                { "date": "2026-10-26", "titre": "Pièces jointes impossibles à ouvrir dans le nouvel Outlook", "detail": "Une utilisatrice ne pouvait ouvrir ses pièces jointes qu'avec « Enregistrer sous ». J'ai vérifié les associations de fichiers et réinstallé, puis comparé avec une collègue sans problème. J'ai aussi comparé en PowerShell, en lecture seule, les stratégies OWA (Get-CASMailbox, ForceSaveFileTypes) des deux boîtes : elles étaient identiques, ce qui écarte une cause côté tenant. Outils : nouvel Outlook, Exchange Online PowerShell.", "source": "Claude Chat · NOOUS · « Pièce jointe Outlook »" },
                { "date": "2026-10-27", "titre": "Boîte partagée absente après suppression du cache Outlook", "detail": "Après la suppression du cache Outlook d'un collègue, une boîte partagée n'est pas réapparue. J'ai retiré puis réattribué la délégation dans Exchange. J'ai ensuite confirmé avec Get-MailboxPermission que le droit FullAccess était bien en place, ce qui orientait vers un délai de propagation ou un problème côté client. Outils : centre d'administration Exchange, PowerShell.", "source": "Claude Chat · NOOUS · « Suppression du cache Outlook »" },
                { "date": "2026-10-29", "titre": "Diagnostic de quotas d'une boîte et d'une archive Exchange saturées", "detail": "J'ai mesuré la taille de l'archive (100 Go, pleine) et de la boîte principale (49,18 Go pour 50 Go), à l'aide de commandes en lecture seule. Le risque était un blocage imminent de l'envoi et de la réception. J'ai séparé les vérifications des actions irréversibles, à soumettre au tuteur. Outils : Exchange Online PowerShell.", "source": "Claude Chat · NOOUS · « Boîte : comment faire »" },
                { "date": "2026-10-29", "titre": "Analyse d'un classeur Excel très lent", "detail": "Un classeur de revue trimestrielle était très lent. Avec l'assistance de Claude, je l'ai analysé sans le modifier : formule RECHERCHEX cassée sur environ 150 lignes, 2 934 fonctions AUJOURDHUI volatiles, références à des colonnes entières et une mise en forme conditionnelle sur environ un million de cellules. Une copie corrigée a ensuite été livrée, avec un résumé des changements. Outils : Excel, analyse du XML du fichier.", "source": "Claude Chat · NOOUS · « Analyse de fichier lent »" },
                { "date": "2026-11-08", "titre": "Résolution d'incidents pendant la mise au point de la chaîne FOG", "detail": "Pendant le lab FOG (du 28/10 au 08/11), j'ai diagnostiqué plusieurs pannes : une résolution DNS en échec, un bug de Secure Boot (mmx64.efi), une image capturée depuis le mauvais snapshot, une boucle TaskReboot due à une tâche FOG en attente, et un clavier QWERTY dans FOS. Sur un Latitude réel, j'ai aussi traité un arrêt thermique, puis une restauration Windows Update bloquée (récupération BitLocker, chkdsk, DISM /revertpendingactions). Outils : FOG, VMware, outils Windows.", "source": "Claude Chat · NOOUS · « Alternatives à WDS MDT »" },
                { "date": "2026-11-09", "titre": "Non-remise reçue alors que le suivi Exchange indique « Remis »", "detail": "Un utilisateur a reçu une notification de non-remise alors que le suivi des messages Exchange montrait le mail comme remis. L'analyse de la notification a montré que le mail avait bien été reçu chez le destinataire externe, puis que c'est un transfert automatique configuré chez lui qui avait échoué (adresse réécrite par SRS). La cause était donc hors de NOOUS. Outils : suivi des messages Exchange.", "source": "Claude Chat · NOOUS · « Mail remis mais message reçu »" },
                { "date": "2026-11-09", "titre": "Mails envoyés affichés « Planifié » dans Outlook", "detail": "Les mails envoyés par une collègue apparaissaient avec l'étiquette « Planifié » et ne s'affichaient pas toujours. Le suivi des messages Exchange a confirmé que les mails étaient bien distribués, ce qui situe le problème dans le client Outlook et non dans l'acheminement. Outils : suivi des messages Exchange, Outlook.", "source": "Claude Chat · NOOUS · « Mails bloqués en « Planification » »" },
                { "date": "2026-11-10", "titre": "Pièce jointe impossible à ouvrir dans le nouvel Outlook", "detail": "Une pièce jointe ne s'ouvrait pas dans le nouvel Outlook mais s'ouvrait dans Outlook sur le web. J'ai fait une réparation puis une réinitialisation du nouvel Outlook depuis les paramètres Windows, sans résoudre le problème. La réinitialisation a fait perdre les signatures ; des pistes de récupération ont été identifiées. Outils : nouvel Outlook, OWA.", "source": "Claude Chat · NOOUS · « Ouverture d'un mail impossible »" },
                { "date": "2026-11-10", "titre": "Écran sur station d'accueil qui ne s'allume pas", "detail": "Un écran branché sur une station d'accueil restait éteint. J'avais déjà changé le câble DisplayPort et l'alimentation, réinstallé le pilote et mis à jour le firmware de la station. Un test sur le PC d'un collègue a montré que l'écran fonctionnait, et Windows détectait bien l'écran : le problème venait donc du PC. Outils : paramètres d'affichage Windows, Gestionnaire de périphériques.", "source": "Claude Chat · NOOUS · « Écran qui ne s'allume pas »" },
                { "date": "2026-11-10", "titre": "Erreur d'impression sur l'étiqueteuse Brother P-touch CUBE", "detail": "Une impression d'étiquette échouait avec un message d'erreur. La cause était un écart entre le ruban installé (18 mm) et le format du document dans P-touch Editor (12 mm). Outils : P-touch Editor.", "source": "Claude Chat · NOOUS · « Étiquette Brother P-touch Cube »" },
                { "date": "2026-11-12", "titre": "« Répondre à tous » qui cible la boîte partagée au lieu des clients", "detail": "Dans le nouvel Outlook, « Répondre à tous » mettait la boîte partagée en destinataire au lieu des clients. J'ai vérifié qu'il n'y avait aucune règle de transfert sur la boîte partagée, ce qui a écarté la première hypothèse. Il restait à analyser les en-têtes From/Reply-To et l'affichage en conversation. Outils : nouvel Outlook, Exchange.", "source": "Claude Chat · NOOUS · « Réponse à tous dans Outlook »" },
                { "date": "2026-11-13", "titre": "Échec de connexion VPN : compte AD au mot de passe expiré", "detail": "Les journaux OpenVPN montraient des AUTH_FAILED répétés alors que la connexion TLS aboutissait. J'ai vérifié le compte dans l'AD : le mot de passe était expiré. Après la réinitialisation, le VPN a fonctionné. Au redémarrage, le nouveau mot de passe était refusé à cause des identifiants mis en cache sur le portable. Outils : OpenVPN, Active Directory.", "source": "Claude Chat · NOOUS · « Échec de connexion VPN OpenVPN »" },
                { "date": "2026-11-13", "titre": "Origine de dossiers « apparus » dans un SharePoint", "detail": "Un ticket signalait des dossiers apparus dans une bibliothèque SharePoint. J'ai fait une recherche dans le journal d'audit Purview, puis j'ai examiné les métadonnées (créé par, dates de création et de modification). Conclusion : une utilisatrice avait ajouté ces dossiers en mars et septembre 2025, hors de la durée de rétention de l'audit. Ce n'était ni un bug ni une synchronisation inconnue. Outils : SharePoint Online, Microsoft Purview.", "source": "Claude Chat · NOOUS · « Historique SharePoint »" }
            ]
        },
        "BC01-10": {
            "statut": "en-cours",
            "preuves": [
                { "date": "2026-11-08", "titre": "Chaîne de déploiement automatisée : FOG, fichier de réponse, Chocolatey", "detail": "J'ai fait évoluer le master Windows 11 sur quatre versions. La v2 ajoute un fichier unattend.xml pour passer les écrans d'accueil, la v3 intègre les pilotes Dell. La v4 installe Chrome, Firefox, PDFsam et OpenVPN par Chocolatey au premier démarrage, via SetupComplete.cmd, puis copie un profil VPN et renomme et joint le poste au domaine. La v4 a été validée sur un Latitude 5440 le 08/11/2026. Outils : FOG, sysprep, Chocolatey.", "source": "Claude Chat · NOOUS · « Alternatives à WDS MDT »" }
            ]
        },
        "BC02-01": {
            "statut": "en-cours",
            "preuves": [
                { "date": "2026-10-28", "titre": "Besoins pour le remplacement de WDS/MDT", "detail": "Avant le lab, j'ai défini le besoin de remplacement de WDS/MDT : environ 10 déploiements par mois, démarrage PXE comme l'existant, jonction AD obligatoire, licences M365 Business Premium. Le déploiement par clé USB a été écarté. FOG et WAPT/WADS sont ressortis comme les options réalistes.", "source": "Claude Chat · NOOUS · « Alternatives à WDS MDT »" },
                { "date": "2026-10-29", "titre": "Existant et contraintes pour déléguer les accès SharePoint", "detail": "Le projet vise à réduire les tickets de demande d'accès en déléguant aux managers l'ajout d'internes et d'externes. J'ai vérifié l'existant : groupes AD par bibliothèque, groupes utilisés uniquement pour SharePoint, Entra Connect actif, licence Business Premium (Entra ID P1) et invitations d'invités déjà permises. Ces éléments ont écarté les packages d'accès (licence P2) et orienté vers la conversion des groupes en groupes cloud.", "source": "Claude Chat · NOOUS · « Délégation gestion accès SharePoint »" },
                { "date": "2026-11-08", "titre": "Cadrage du benchmark d'outil sandbox", "detail": "Pour la tâche « Benchmark outil sandbox », j'ai fixé moi-même les contraintes, car aucun livrable n'était imposé : solution locale si possible, gratuite au regard des licences déjà payées, réservée à l'équipe IT, volume de 0 à quelques cas par semaine. Ce cadrage a conduit à comparer une VM VMware et Windows Sandbox.", "source": "Claude Chat · NOOUS · « Benchmark sandbox analyse liens et fichiers »" }
            ]
        },
        "BC02-03": {
            "statut": "en-cours",
            "preuves": [
                { "date": "2026-11-09", "titre": "Veille sur la fin de MDT : Autopilot/Intune et DeployR évalués", "detail": "Suite à l'annonce du retrait de MDT, j'ai étudié Autopilot + Intune et DeployR Community (2Pint), le successeur de MDT. Conclusion sur Autopilot : direction valable à long terme, mais pas un remplacement direct, car il faudrait revoir la jonction AD et les GPO. Le test de DeployR a été abandonné, le site de l'éditeur étant bloqué par le filtrage web de l'entreprise.", "source": "Claude Chat · NOOUS · « Alternatives à WDS MDT »" }
            ]
        },
        "BC02-04": {
            "statut": "en-cours",
            "preuves": [
                { "date": "2026-11-09", "titre": "Proposition de FOG pour remplacer WDS/MDT", "detail": "Après comparaison de FOG, WAPT/WADS, Autopilot + Intune et DeployR, j'ai retenu FOG pour remplacer WDS/MDT, car il garde le PXE et la jonction AD. La solution est validée techniquement en lab et sur un poste réel. Le passage en pilote reste soumis à la décision du tuteur.", "source": "Claude Chat · NOOUS · « Alternatives à WDS MDT »" }
            ]
        },
        "BC02-06": {
            "statut": "validee",
            "preuves": [
                { "date": "2026-11-08", "titre": "Maquette complète de déploiement FOG, validée sur VM et sur Latitude 5440", "detail": "J'ai maquetté toute la chaîne dans un lab isolé : PXE UEFI, Secure Boot, capture et déploiement de Windows 11, fichier de réponse, pilotes Dell, renommage et jonction au domaine, applications par Chocolatey. La chaîne a été testée sur VM puis sur un Dell Latitude 5440 réel, et un PC neuf a été enregistré par Quick Registration. Ce qui n'a pas été testé a été listé (mode RAID On, Dell Command Update, agent Atera, proxy de l'entreprise).", "source": "Claude Chat · NOOUS · « Alternatives à WDS MDT »" }
            ]
        },
        "BC02-17": {
            "statut": "en-cours",
            "preuves": [
                { "date": "2026-11-12", "titre": "Ticket de mail suspect : qualification puis clôture en faux positif", "detail": "Pour des tickets de signalement de mails suspects, j'ai analysé les en-têtes et le contenu de deux messages. Le premier, envoyé depuis la boîte piratée d'un partenaire, a été traité comme du phishing. Le second, une demande de l'Opco Atlas aux RH, a été jugé légitime et documenté comme faux positif. Outils : en-têtes de messages, Microsoft Defender.", "source": "Claude Chat · NOOUS · « Mail suspect signalé »" }
            ]
        },
        "BC02-18": {
            "statut": "en-cours",
            "preuves": [
                { "date": "2026-11-12", "titre": "Réponse à une campagne de phishing venant d'un partenaire compromis", "detail": "L'analyse des en-têtes a montré un mail authentifié (SPF, DKIM et DMARC conformes), envoyé depuis la vraie boîte d'un partenaire, avec les destinataires en copie cachée. Dans l'Explorateur Defender, j'ai constaté que l'expéditeur avait écrit à de nombreuses personnes. J'ai bloqué l'expéditeur et signalé le mail comme hameçonnage. Outils : Microsoft Defender for Office 365 (Explorateur, Soumissions, liste d'autorisation/blocage).", "source": "Claude Chat · NOOUS · « Mail suspect signalé »" }
            ]
        },
        "BC03-02": {
            "statut": "en-cours",
            "preuves": [
                { "date": "2026-11-12", "titre": "QR code d'accès perdu : révocation et réémission dans VISOR", "detail": "Un agent de ménage a perdu son QR code d'accès aux locaux. J'ai supprimé l'ancien identifiant dans VISOR, le logiciel de contrôle d'accès de Vauban Systems, puis j'en ai généré un nouveau. J'ai aussi constaté que la fiche concernée est un compte partagé par une société de ménage. Outils : VISOR.", "source": "Claude Chat · NOOUS · « QR code Visor et RNCP »" }
            ]
        },
        "BC03-06": {
            "statut": "en-cours",
            "preuves": [
                { "date": "2026-11-12", "titre": "Contrôle des journaux de passage après la perte d'un QR code", "detail": "Après avoir révoqué le QR code perdu, j'ai vérifié dans les journaux de VISOR qu'aucun passage n'avait eu lieu avec cet identifiant depuis sa perte. Outils : VISOR.", "source": "Claude Chat · NOOUS · « QR code Visor et RNCP »" },
                { "date": "2026-11-12", "titre": "Étendue d'un phishing mesurée dans l'Explorateur Defender", "detail": "Pour mesurer l'impact d'un mail de phishing, j'ai consulté l'Explorateur Microsoft Defender : l'expéditeur avait écrit à de nombreux destinataires. Ce constat m'a conduit à bloquer l'expéditeur et à signaler le mail. Outils : Microsoft Defender for Office 365.", "source": "Claude Chat · NOOUS · « Mail suspect signalé »" },
                { "date": "2026-11-13", "titre": "Recherche dans le journal d'audit Purview sur un site SharePoint", "detail": "J'ai lancé une recherche d'audit Purview (dates, opérations sur les dossiers, site) pour comprendre l'apparition de dossiers dans une bibliothèque. Les événements, datés de 2025, dépassaient la rétention de l'audit. J'ai donc complété avec les métadonnées SharePoint pour identifier qui avait ajouté les dossiers et quand. Outils : Microsoft Purview, SharePoint Online.", "source": "Claude Chat · NOOUS · « Historique SharePoint »" }
            ]
        },
        "BC03-07": {
            "statut": "en-cours",
            "preuves": [
                { "date": "2026-10-28", "titre": "Pare-feu OPNsense isolant le lab de déploiement du réseau de l'entreprise", "detail": "J'ai placé le lab FOG derrière un routeur/pare-feu OPNsense, sur un réseau virtuel séparé, pour que le DHCP et le PXE du lab ne touchent jamais le réseau de l'entreprise. Pour les tests sur poste physique, j'ai utilisé une carte Ethernet dédiée, jamais branchée au réseau de l'entreprise. Outils : OPNsense, VMware Workstation.", "source": "Claude Chat · NOOUS · « Alternatives à WDS MDT »" }
            ]
        },
        "BC03-08": {
            "statut": "validee",
            "preuves": [
                { "date": "2026-10-27", "titre": "Délégation FullAccess sur une boîte partagée, réattribuée et vérifiée", "detail": "J'ai retiré puis réattribué la délégation d'un collègue sur une boîte partagée dans Exchange Online. J'ai ensuite vérifié en PowerShell (Get-MailboxPermission) que le droit FullAccess était bien accordé (Deny:False). Outils : centre d'administration Exchange, PowerShell.", "source": "Claude Chat · NOOUS · « Suppression du cache Outlook »" },
                { "date": "2026-10-28", "titre": "OU de déploiement et compte de jonction à faibles privilèges dans l'AD du lab", "detail": "Dans l'AD du lab, j'ai créé l'OU Postes-Deploiement et un compte dédié à faibles privilèges (svc-fogjoin) pour joindre les postes au domaine depuis FOG. L'objectif est d'appliquer le moindre privilège au compte de jonction. Outils : Active Directory, FOG.", "source": "Claude Chat · NOOUS · « Alternatives à WDS MDT »" },
                { "date": "2026-10-29", "titre": "Analyse des groupes AD synchronisés pour déléguer les accès SharePoint", "detail": "J'ai vérifié que les groupes de sécurité AD synchronisés par Entra Connect donnent accès à des bibliothèques précises et ne servent qu'à SharePoint. Un groupe synchronisé n'étant pas gérable depuis le cloud, la piste retenue est la conversion de ces groupes en groupes cloud, avec la manager comme propriétaire. Cette piste reste soumise à la validation du tuteur. Outils : Entra ID, Entra Connect, SharePoint Online.", "source": "Claude Chat · NOOUS · « Délégation gestion accès SharePoint »" },
                { "date": "2026-11-13", "titre": "Réinitialisation d'un compte AD au mot de passe expiré", "detail": "Le mot de passe AD d'une utilisatrice avait expiré, ce qui bloquait son VPN. J'ai réinitialisé le mot de passe dans l'AD, puis vérifié que la connexion VPN fonctionnait. J'ai ensuite traité la désynchronisation avec les identifiants en cache sur son portable. Outils : Active Directory, OpenVPN.", "source": "Claude Chat · NOOUS · « Échec de connexion VPN OpenVPN »" }
            ]
        },
        "BC04-03": {
            "statut": "en-cours",
            "preuves": [
                { "date": "2026-11-08", "titre": "Procédure technique du lab FOG (version 1.4)", "detail": "J'ai produit, avec l'assistance de Claude, une procédure structurée du lab FOG : architecture, master et chaîne de déploiement, test sur portable Dell. Elle distingue ce qui a été exécuté et validé (du 28/10 au 08/11/2026), ce qui reste à confirmer et ce qui n'est pas testé. Elle a été mise à jour à chaque version du master.", "source": "Claude Chat · NOOUS · « Alternatives à WDS MDT »" },
                { "date": "2026-11-08", "titre": "Document de benchmark : VM VMware ou Windows Sandbox", "detail": "J'ai construit, avec l'assistance de Claude, un document de benchmark structuré : contexte, périmètre, comparatif, grille de critères pondérés, protocole de test en six étapes et risques. Les tableaux de résultats restent à remplir. La pondération et la mise à disposition d'un PC dédié sont en attente de validation par le tuteur.", "source": "Claude Chat · NOOUS · « Benchmark sandbox analyse liens et fichiers »" }
            ]
        },
        "BC04-19": {
            "statut": "en-cours",
            "preuves": [
                { "date": "2026-11-08", "titre": "Comparaison coût/intérêt des solutions sandbox", "detail": "J'ai comparé les sandbox cloud gratuites, leurs offres payantes, CAPEv2, une VM VMware Workstation Pro (gratuite en usage commercial) et Windows Sandbox, en tenant compte de Defender for Office 365 P1, déjà inclus dans Business Premium. Les offres cloud ont été écartées pour risque de fuite de données ou coût disproportionné, et CAPEv2 pour sa charge de maintenance.", "source": "Claude Chat · NOOUS · « Benchmark sandbox analyse liens et fichiers »" },
                { "date": "2026-11-09", "titre": "Comparaison des alternatives à WDS/MDT au regard des licences", "detail": "J'ai comparé FOG, WAPT/WADS, Autopilot + Intune, Configuration Manager et des outils commerciaux, en fonction des licences disponibles (M365 Business Premium) et du volume (environ 10 déploiements par mois). FOG a été retenu comme solution gratuite qui répond aux contraintes PXE et AD.", "source": "Claude Chat · NOOUS · « Alternatives à WDS MDT »" }
            ]
        }
    }
};
