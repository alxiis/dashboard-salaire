/**
 * GRILLE RNCP // RÉFÉRENTIEL (ne change pas en cours d'année)
 * ---------------------------------------------------------------------------
 * Source : « Fiche missions ASRS » (Groupe IGENSIA) — Bachelor Réseaux Cloud & Cybersécurité,
 * titre certifié « Administrateur Systèmes, Réseaux et Base de données »,
 * RNCP n°41996, niveau 6 (EU), code NSF 326, décision France Compétences du 27/02/2026.
 *
 * Structure : blocs de compétences (BC01 → BC04) > types de missions en entreprise > compétences.
 * Chaque compétence a un identifiant stable (BC01-01…) : c'est la clé utilisée par
 * rncp-progress.js pour rattacher ce qui a été fait.
 *
 * Ce fichier n'est PAS à modifier chaque semaine : la mise à jour hebdomadaire se fait
 * uniquement dans rncp-progress.js (ou via le bouton d'import de la page).
 */
(function () {
    'use strict';

    /** compétence : id, titre court (affiché sur la carte), texte intégral du référentiel */
    const c = (id, titre, texte) => ({ id, titre, texte });
    /** mission type : titre, exemples de livrables attendus (fiche missions), compétences visées */
    const m = (titre, items, competences) => ({ titre, items, competences });

    const BLOCS = [
        {
            id: 'BC01',
            titre: "ADMINISTRER LE SYSTÈME D'INFORMATION",
            missions: [
                m("Mise en place et paramétrage d'un réseau fonctionnel et sécurisé",
                    ['Configurer routeurs, commutateurs et interconnexions', "Définir un plan d'adressage IP", 'Produire un schéma réseau'], [
                        c('BC01-01', 'Configurer les équipements réseaux',
                            "Configurer les équipements réseaux (routeurs, commutateurs, …) des sites de l'entreprise selon les recommandations du responsable du système d'information, ou des constructeurs, pour garantir la fluidité, la sécurité et la continuité des échanges de données en veillant à l'efficacité énergétique des équipements.")
                    ]),
                m('Déploiement de serveurs physiques ou virtuels',
                    ["Installer un système d'exploitation serveur", 'Configurer les services (stockage, accès, applications)', 'Assurer la disponibilité et performance'], [
                        c('BC01-02', 'Installer et configurer des serveurs',
                            "Installer et configurer des serveurs physiques ou virtuels (Cloud) et leurs systèmes d'exploitation afin de garantir la disponibilité, la stabilité, la performance des services numériques de l'entreprise (ERP) en respectant les besoins métiers exprimés et les politiques de sécurité, tout en optimisant la consommation énergétique (Green IT).")
                    ]),
                m('Mutualisation des ressources via des environnements virtualisés',
                    ['Mettre en place un hyperviseur', 'Créer et gérer des machines virtuelles', 'Optimiser CPU, RAM et stockage'], [
                        c('BC01-03', 'Virtualiser et mutualiser les ressources',
                            "Concevoir et optimiser l'infrastructure de plateformes virtuelles en mutualisant les ressources (stockage, CPU, RAM, …) des machines physiques dans un environnement centralisé (hyperviseurs), afin d'améliorer la flexibilité du système d'information et simplifier sa gestion.")
                    ]),
                m("Administration d'un parc mobile centralisé",
                    ['Déployer une solution MDM', 'Gérer les accès et la sécurité des terminaux', 'Maintenir un inventaire à jour'], [
                        c('BC01-04', 'Gérer le parc mobile (MDM)',
                            "Mettre en place une gestion unique et commune des terminaux mobiles (MDM) afin d'assurer une administration centralisée, cohérente et sécurisée de l'ensemble de l'infrastructure informatique.")
                    ]),
                m('Garantie de la continuité de service',
                    ['Mettre en place clustering, load balancing', 'Appliquer mises à jour et correctifs', 'Surveiller la disponibilité'], [
                        c('BC01-05', 'Maintenir en conditions opérationnelles',
                            "Maintenir en conditions opérationnelles l'infrastructure de l'entreprise en utilisant des logiciels de gestion de haute disponibilité (clustering, load balancing, réplication, mises à jour), pour réduire les interruptions de services en appliquant les règles de santé et sécurité au travail lors des interventions.")
                    ]),
                m('Identification et résolution de pannes',
                    ['Analyser logs et alertes', 'Identifier les causes racines', 'Proposer et appliquer des solutions'], [
                        c('BC01-06', 'Diagnostiquer les défaillances',
                            "Diagnostiquer les défaillances système ou réseau en analysant les logs, les symptômes et les dépendances entre services, afin d'assurer l'exploitation du Système d'Information, réduire les interruptions de service et limiter l'impact sur les utilisateurs.")
                    ]),
                m('Gestion et sécurisation des données',
                    ['Installer et configurer une base de données', 'Gérer les accès et sauvegardes', 'Garantir intégrité et performance'], [
                        c('BC01-07', 'Administrer les bases de données',
                            "Administrer les bases de données avec méthode en respectant les configurations requises (instances, paramètres système, schémas, droits d'accès, stockages, …) et en appliquant les bonnes pratiques d'exploitation, afin d'assurer la disponibilité, l'intégrité et la performance des données en privilégiant les solutions économes en énergie.")
                    ]),
                m('Amélioration des performances',
                    ['Analyser les requêtes', 'Optimiser index et stockage', 'Réduire les temps de réponse'], [
                        c('BC01-08', 'Analyser les performances des bases',
                            "Analyser les performances des bases de données installées sur la base des rapports d'usage collectés, afin d'accélérer les temps de traitement des requêtes."),
                        c('BC01-09', 'Optimiser le stockage des bases',
                            "Améliorer les performances des bases de données en optimisant l'emplacement des fichiers de stockage (données, journaux, index) sur les supports les plus adaptés pour garantir la réactivité des applications.")
                    ]),
                m('Automatisation des tâches techniques',
                    ['Développer des scripts (PowerShell, Bash…)', 'Automatiser sauvegardes et déploiements', 'Documenter les procédures'], [
                        c('BC01-10', "Automatiser l'exploitation courante",
                            "Automatiser les tâches d'exploitation courante (sauvegarde, mises à jour, déploiement) afin de fiabiliser les processus et gagner en productivité, en développant des scripts (Bash, PowerShell…) ou en utilisant des outils d'orchestration (Ansible, Python, IA, etc.), pour éviter les erreurs humaines et optimiser le temps d'administration.")
                    ])
            ]
        },
        {
            id: 'BC02',
            titre: "GÉRER LE SYSTÈME D'INFORMATION",
            missions: [
                m('Proposition de solutions techniques adaptées aux besoins métier',
                    ['Recueillir les besoins utilisateurs', 'Analyser contraintes techniques', 'Proposer des solutions adaptées'], [
                        c('BC02-01', 'Analyser les besoins techniques et métiers',
                            "Analyser les besoins techniques et métiers en identifiant les contraintes et opportunités, pour garantir la cohérence entre les choix techniques et les objectifs métiers, en intégrant les aspects d'accessibilité numérique pour tous les profils utilisateurs.")
                    ]),
                m('Gestion des évolutions SI',
                    ['Suivre les évolutions techniques', 'Appliquer les bonnes pratiques ITSM', 'Assurer conformité et qualité'], [
                        c('BC02-02', 'Gérer les évolutions (ITSM / ISO 20000)',
                            "Gérer les évolutions des infrastructures informatiques en appliquant les principes et les limites de la norme IT Service Management ISO/CEI 20000 pour garantir une évolution conforme aux standards de gestion des services informatiques et assurer leur alignement avec les besoins métiers et les exigences de qualité de service, dans le respect des standards environnementaux et de sobriété numérique."),
                        c('BC02-03', 'Anticiper les technologies émergentes',
                            "Assurer l'évolution des équipements en tenant compte des technologies émergentes en anticipant les besoins futurs, pour garantir la pérennité des infrastructures, optimiser les investissements et accompagner les évolutions stratégiques de l'organisation."),
                        c('BC02-04', "Proposer un renouvellement d'infrastructure",
                            "Élaborer des propositions de renouvellement d'infrastructures, en analysant leurs performances et leur compatibilité, tout en tenant compte des contraintes budgétaires, en privilégiant des solutions à faible consommation énergétique, afin d'effectuer des choix d'investissement éclairés, durables et cohérents avec la stratégie de l'entreprise.")
                    ]),
                m("Construction d'un plan d'évolution",
                    ['Construire un plan projet', 'Identifier risques et ressources', 'Suivre budget et délais'], [
                        c('BC02-05', "Élaborer un plan d'évolution",
                            "Élaborer un plan d'évolution des équipements informatiques en identifiant les ressources, les étapes et les risques, pour garantir le bon déroulement du plan dans le respect des délais et des budgets afin de piloter la mise en œuvre des évolutions du Système d'Information."),
                        c('BC02-06', 'Maquetter dans un environnement de test',
                            "Maquetter les solutions de déploiements dans un environnement de test (virtualisation, conteneurisation, sandbox, …) pour détecter les incompatibilités et valider les choix techniques retenus avant leur mise en production, en s'assurant de l'accessibilité des interfaces testées pour les publics en situation de handicap."),
                        c('BC02-07', 'Ordonnancer le plan de déploiement',
                            "Ordonnancer le plan de déploiement afin de coordonner efficacement les étapes d'installation ou de mise en production en tenant compte des disponibilités des différents acteurs concernés (équipes techniques, métiers, prestataires)."),
                        c('BC02-08', 'Attribuer les ressources informatiques',
                            "Attribuer les ressources informatiques nécessaires au bon déroulement du plan en tenant compte du budget alloué, des priorités opérationnelles, de la consommation énergétique et de la disponibilité des moyens (humains, matériels, logiciels), afin d'assurer la faisabilité technique et organisationnelle."),
                        c('BC02-09', "Suivre l'avancement et coordonner",
                            "Suivre l'avancement des tâches et assurer la coordination avec les parties prenantes afin de maintenir la dynamique du projet, pour faciliter la réussite et la communication interservices.")
                    ]),
                m('Supervision du SI',
                    ['Installer outils de supervision', "Définir KPI et seuils d'alerte", 'Analyser les performances'], [
                        c('BC02-10', 'Configurer les outils de supervision',
                            "Configurer les outils de supervision selon les indicateurs clés (taux de disponibilité, statuts du service, taux de perte de paquets, consommation énergétique, …) en paramétrant des alertes adaptées, afin d'anticiper les dysfonctionnements."),
                        c('BC02-11', "Superviser l'infrastructure",
                            "Superviser l'infrastructure informatique et le patrimoine applicatif en utilisant les outils de supervision installés (supervision réseau, analyse de logs, alertes automatisées) afin d'améliorer les performances globales du système d'information.")
                    ]),
                m('Urbanisation du SI',
                    ['Cartographier le SI', 'Gérer les architectures (API, microservices)', 'Piloter les migrations'], [
                        c('BC02-12', 'Cartographier le SI',
                            "Cartographier les composants du Système d'information (processus métiers, applications, fonctions, données, infrastructures…) pour faciliter la compréhension globale du SI, appuyer les prises de décision techniques et garantir la cohérence des évolutions à venir."),
                        c('BC02-13', "Modéliser l'infrastructure technique",
                            "Organiser l'infrastructure en modélisant l'environnement technique (conteneurs, environnements de test, gestion des dépendances) pour accélérer les cycles de mise à jour, garantir la stabilité des services et soutenir l'agilité des équipes de développement et d'exploitation."),
                        c('BC02-14', 'Accompagner les applications métiers (API, micro-services)',
                            "Accompagner les évolutions des applications métiers en adoptant une logique modulaire ou de composants (micro-services, APIs, …) dans l'objectif de limiter les failles de sécurité, d'assurer la traçabilité des changements et de maintenir la continuité des services métiers, tout en veillant à la compatibilité avec les normes d'accessibilité numérique (RGAA)."),
                        c('BC02-15', 'Migrer une architecture système ou réseau',
                            "Migrer une architecture système ou réseau dans le respect des principes d'urbanisation du SI en planifiant les interventions, en optimisant les opérations techniques et en identifiant les risques associés pour les anticiper afin de garantir la continuité de service, de limiter les interruptions et de sécuriser l'évolution du système d'information."),
                        c('BC02-16', 'Maintenir un inventaire à jour',
                            "Maintenir un inventaire à jour des équipements et logiciels en intégrant les contraintes de maintenance, de licence, de durabilité, de recyclabilité et de sécurité pour optimiser les coûts et la performance du SI en cohérence avec la stratégie d'entreprise.")
                    ]),
                m('Support aux utilisateurs',
                    ['Gérer les tickets 3/4', 'Résoudre incidents complexes', 'Produire tableaux de suivi'], [
                        c('BC02-17', 'Centraliser les incidents (ITSM, helpdesk)',
                            "Centraliser le traitement des incidents en un point unique d'accès (ITSM, helpdesk) permettant de qualifier, affecter et historiser les incidents, pour mieux prioriser les interventions, optimiser la productivité des équipes support et améliorer la qualité du service rendu aux utilisateurs y compris ceux en situation de handicap."),
                        c('BC02-18', 'Résoudre les tickets de niveau 3 & 4',
                            "Résoudre les tickets de niveau 3 & 4 à l'aide d'outils de prise en main à distance ou en intervenant sur place, pour limiter l'impact des incidents complexes sur l'activité de l'organisation et améliorer la satisfaction des utilisateurs."),
                        c('BC02-19', 'Piloter le support par un tableau de bord',
                            "Élaborer un tableau de bord sur la résolution des tickets d'incidents par niveau de support par la collecte et l'analyse des indicateurs clés (temps de réponse, taux de résolution, escalades, …) afin d'identifier les points de blocage, d'améliorer l'efficacité de la résolution des incidents et de piloter la qualité du support utilisateur.")
                    ])
            ]
        },
        {
            id: 'BC03',
            titre: 'DÉFINIR LA POLITIQUE DE SÉCURISATION DU SYSTÈME D’INFORMATION',
            missions: [
                m('Administration de la politique de sécurité (PSSI)',
                    ['Définir les règles de sécurité (RSSI)', 'Définir des mesures de prévention physiques (accès) ou techniques', "Veiller à l'application de la règlementation (RGPD, ANSSI, ISO 27001,…)", 'Encadrer et contrôler les process et les pratiques'], [
                        c('BC03-01', 'Rédiger ou mettre à jour la PSSI',
                            "Rédiger ou mettre à jour la Politique de Sécurisation du Système d'Information (PSSI) en intégrant les recommandations internes (RSSI) et réglementaires (RGPD, ANSSI, ISO 27001 …) pour formaliser les règles de sécurité, cadrer les pratiques et garantir un socle de protection cohérent."),
                        c('BC03-02', "Appliquer la sécurité des accès physiques",
                            "Appliquer les procédures de sécurité liées aux accès physiques de l'entreprise en s'appuyant sur une stratégie d'identification (badges, registres d'accès, vidéosurveillance, droits d'entrée différenciés) afin de limiter les intrusions non autorisées dans les zones sensibles, en respectant les règles d'accessibilité aux bâtiments pour tous les utilisateurs (PMR, …).")
                    ]),
                m('Identification et application des mesures correctives aux failles de sécurité (SOC/SIEM)',
                    ['Réaliser une analyse de risques', 'Mettre en place une surveillance des systèmes (sondes, logs, métriques, seuils…), la journalisation et le suivi des activités', 'Appliquer les correctifs et mises à jour, y compris via des solutions automatisées'], [
                        c('BC03-03', 'Analyser les risques (EBIOS, ISO 27005)',
                            "Identifier les menaces et vulnérabilités du système d'information en réalisant une analyse de risques structurée (EBIOS, ISO 27005…) pour limiter l'exposition aux cyberattaques et renforcer la résilience du SI."),
                        c('BC03-04', 'Automatiser correctifs et mises à jour',
                            "Déployer des solutions automatisées de mise à jour et de correctifs en configurant des outils de gestion centralisée des correctifs (WSUS, Ansible, scripts de déploiement, solutions EDR, IA) et en planifiant leur diffusion de manière contrôlée, pour limiter les surfaces d'attaque, assurer la conformité aux politiques de sécurité."),
                        c('BC03-05', 'Évaluer les perturbations de service',
                            "Évaluer les perturbations de services en exploitant les alertes émises par les sondes de supervision (réseau, système, base de données), en croisant les données collectées (logs, métriques, seuils) et en analysant l'impact sur la qualité de service pour identifier les correctifs à déployer rapidement."),
                        c('BC03-06', 'Journaliser et suivre l’activité (SIEM)',
                            "Mettre en place une journalisation et un suivi d'activité en exploitant les outils de supervision de sécurité (SIEM, log, …), pour assurer une réactivité en cas de comportements suspects ou d'incident et de conserver une traçabilité complète.")
                    ]),
                m('Configuration de pare-feu, VPN, MFA', [], [
                    c('BC03-07', 'Configurer pare-feu, VPN, MFA',
                        "Configurer les dispositifs de sécurité (pare-feu, VPN, MFA, antivirus, etc.) pour garantir l'intégrité, la confidentialité et la disponibilité des données de l'entreprise et protéger les infrastructures contre les intrusions ou les fuites de données.")
                ]),
                m('Gestion des droits utilisateurs (mot de passe, rotation, GPO, …)', [], [
                    c('BC03-08', 'Gérer comptes, groupes et annuaire',
                        "Gérer les comptes utilisateurs et les groupes dans un service d'annuaire en appliquant les politiques internes (mot de passe, rotation, GPO, …) et en respectant les habilitations définies pour chaque utilisateur afin de permettre et tracer l'accès aux données de l'entreprise, tout en s'assurant que les procédures d'authentification restent accessibles.")
                ]),
                m("Mise en place d'un PCA/PRA",
                    ['Préparer le plan de secours en cas de sinistre et mettre en place l\'infrastructure de secours pour les services essentiels', "Mettre en place les redondances nécessaires à la reprise d'activité", "Organiser la reprise d'activité (remise en service) en fonction de l'impact pour chaque métier ou service (criticité)"], [
                        c('BC03-09', 'Identifier les applications critiques',
                            "Identifier les éléments et applications critiques de l'entreprise en vue d'assurer la continuité opérationnelle en prévoyant un site de repli ou une infrastructure de secours adaptée pour maintenir les services essentiels en cas de sinistre, en prenant en compte les besoins spécifiques des utilisateurs en situation de handicap."),
                        c('BC03-10', 'Déployer les protections de continuité',
                            "Déployer des moyens de protections matériels et logiciels pour assurer la disponibilité des données et des applicatifs conformément au plan de continuité établi par la direction de l'entreprise, en privilégiant des solutions à faible consommation énergétique et éco-conçues."),
                        c('BC03-11', "Mesurer la criticité d'une interruption",
                            "Identifier la criticité de l'interruption d'activité en fonction des métiers de l'entreprise en analysant l'impact d'éventuels dysfonctionnements pour préconiser des mesures de redondance et garantir une bonne reprise d'activités."),
                        c('BC03-12', 'Prioriser les besoins de continuité',
                            "Prioriser les besoins de continuité en évaluant les impacts potentiels d'interruption et en classant la reprise selon la criticité de l'activité, en intégrant les contraintes de santé au travail des équipes mobilisées lors des reprises (horaires, stress, charge).")
                    ]),
                m('Mise en place d’un plan de test des sauvegardes',
                    ['Crypter les canaux de transmission', 'Mettre en place un plan périodique de restauration pour tester les sauvegardes'], [
                        c('BC03-13', 'Chiffrer les canaux de sauvegarde',
                            'Crypter les canaux de transmissions des sauvegardes émises via le réseau pour éviter une perte de données.'),
                        c('BC03-14', 'Planifier les tests de restauration',
                            "Mettre en place un plan périodique de restauration permettant de vérifier l'intégrité des données.")
                    ])
            ]
        },
        {
            id: 'BC04',
            titre: 'COMMUNIQUER AVEC TOUS LES ACTEURS INTERNES OU EXTERNES AU SERVICE INFORMATIQUE',
            missions: [
                m('Rédaction de la documentation technique',
                    ['Documenter un incident et sa solution dans une base de connaissance interne', 'Rédiger une documentation technique (en anglais et en français) à destination des techniciens ou des utilisateurs'], [
                        c('BC04-01', 'Collecter l’information auprès des spécialistes',
                            "Collecter des informations auprès de spécialistes techniques en analysant et synthétisant les problèmes décrits afin d'envisager des solutions, en veillant à inclure les besoins spécifiques des utilisateurs en situation de handicap."),
                        c('BC04-02', 'Alimenter la base de connaissances',
                            "Alimenter la base de connaissances interne en documentant les incidents et les solutions apportées afin de faciliter la résolution des incidents similaires avec des contenus clairs, structurés et accessibles à tous les profils d'utilisateurs."),
                        c('BC04-03', 'Concevoir la documentation technique FR / EN',
                            "Concevoir la documentation technique, en français et en anglais, pour répondre aux besoins d'information des techniciens et faciliter l'usage des logiciels de support déployés dans l'entreprise.")
                    ]),
                m('Animation et formation d’une équipe IT',
                    ['Élaborer une fiche de poste', 'Accueillir un nouveau collaborateur / onboarding (formation aux outils, process, technologies,…)', "Organiser un plan de formation de l'équipe sur de nouveaux outils, process, technologies,…"], [
                        c('BC04-04', 'Élaborer une fiche de poste',
                            "Identifier les compétences techniques et relationnelles attendues et le degré d'intégrabilité des futurs collaborateurs au sein de l'équipe en analysant les besoins opérationnels du service afin d'élaborer une fiche de poste précise en vue de conduire un entretien d'embauche, en intégrant des critères favorisant l'inclusion."),
                        c('BC04-05', 'Conduire un entretien annuel',
                            "Conduire un entretien annuel en contrôlant l'atteinte des objectifs fixés et des besoins du collaborateur afin de proposer une montée des compétences, en prenant en compte les besoins spécifiques liés à la santé ou au handicap du collaborateur."),
                        c('BC04-06', "Former l'équipe de techniciens",
                            "Former l'équipe de techniciens en élaborant un plan de formation pour garantir l'autonomie des équipes, standardiser les pratiques et sécuriser les interventions dans le respect des procédures de l'entreprise et des conditions de travail adaptées (rythme, fatigue cognitive, stress, ergonomie, etc…).")
                    ]),
                m("Coordination de l'équipe technique",
                    ['Planification des interventions', 'Répartition des tickets', 'Priorisation des tâches et arbitrage', 'Animation de réunions'], [
                        c('BC04-07', 'Coordonner l’activité de l’équipe',
                            "Coordonner l'activité de son équipe en mettant en place des outils collaboratifs pour fluidifier le partage des instructions en vue d'améliorer l'efficacité, les résultats et la montée en compétence des techniciens."),
                        c('BC04-08', 'Déléguer les tâches de niveau 1 & 2',
                            "Déléguer les tâches de niveau 1 & 2 à réaliser de façon équitable, en hiérarchisant les priorités afin de mobiliser efficacement son équipe, tout en préservant la santé mentale et physique des collaborateurs."),
                        c('BC04-09', 'Définir les rôles et planifier',
                            "Définir les rôles en planifiant les interventions et missions de chacun pour la meilleure atteinte des objectifs afin de garantir une organisation opérationnelle et efficace, dans le respect des obligations de santé au travail."),
                        c('BC04-10', 'Arbitrer les divergences dans l’équipe',
                            "Arbitrer les divergences ou les rivalités au sein de l'équipe par la pratique d'une écoute active pour éviter les tensions contre-productives et préserver un climat de travail serein, propice à l'inclusion de profils divers et à la prévention des RPS (risques psychosociaux)."),
                        c('BC04-11', 'Préparer et animer des réunions',
                            "Diffuser les informations préparatoires nécessaires à la bonne tenue d'une réunion pour favoriser les prises de décisions en adaptant sa communication orale et écrite, en veillant à l'accessibilité des supports pour tous les profils d'interlocuteurs tant en français qu'en anglais.")
                    ]),
                m('Formation des utilisateurs',
                    ['Production de supports (procédures, tutos, vidéos,…)', 'Animation de séances de formation'], [
                        c('BC04-12', 'Produire des supports documentaires',
                            "Produire des supports documentaires à destination des utilisateurs en utilisant un langage accessible pour formaliser les procédures et garantir leur applicabilité."),
                        c('BC04-13', "Diffuser les informations d'exploitation",
                            "Diffuser les informations liées à l'exploitation de l'environnement numérique de travail aux utilisateurs des différents services de l'entreprise afin de permettre l'engagement de tous les acteurs à une meilleure productivité de l'entreprise, en utilisant des formats inclusifs et compréhensibles."),
                        c('BC04-14', 'Former les utilisateurs aux procédures',
                            "Former les utilisateurs aux nouvelles procédures en fonction des enjeux et besoins métiers pour favoriser leur adhésion et limiter les résistances aux changements, en tenant compte des personnes en situation de handicap.")
                    ]),
                m('Sensibilisation aux risques cyber par différents moyens (formation, campagnes de sensibilisation, testing,…)',
                    ['les équipes IT', 'les utilisateurs', 'les décideurs'], [
                        c('BC04-15', 'Informer sur les menaces courantes',
                            "Informer les collaborateurs aux menaces courantes telles que les ransomware, le phishing, la compromission des e-mails professionnels (BEC) à l'aide de supports adaptés (volet sécurité de la charte informatique, campagnes de sensibilisation, newsletters sécurité, webinaires, …) afin qu'ils aient les bonnes pratiques pour protéger les données de l'entreprise dans l'environnement de travail."),
                        c('BC04-16', 'Sensibiliser aux erreurs humaines',
                            "Renforcer les mesures de protection contre les erreurs humaines et opérationnelles en sensibilisant les utilisateurs aux mesures techniques de sécurité (authentification forte, sauvegarde, gestion des accès, usage des équipements, …) afin de réduire les risques liés aux usages non maîtrisés du système d'information."),
                        c('BC04-17', 'Convaincre les décideurs',
                            "Favoriser l'adhésion des décideurs à la protection de l'entreprise aux dangers de la cybercriminalité en communiquant de manière pédagogique sur les risques, les enjeux réglementaires et les impacts économiques d'une cyberattaque afin de mobiliser les moyens humains, techniques, financiers et organisationnels nécessaires à la sécurité du système d'information.")
                    ]),
                m('Relation avec des prestataires / fournisseurs',
                    ['Suivre et contrôler les ententes de niveau de service (SLA)', "Réaliser un devis (étude de marché, analyse de coût,…)", "Participer à l'achat de fournitures pour le service (recherche de fournisseur, négociation de tarif,…)"], [
                        c('BC04-18', 'Faire respecter les SLA',
                            "Faire respecter les ententes de niveau de service (contrat de services) par une bonne connaissance des bonnes pratiques (ITIL) et des aspects commerciaux et juridiques d'un contrat (de location, de maintenance, de service, etc…) afin de maintenir des bonnes relations avec les fournisseurs et prestataires et protéger les intérêts de l'entreprise."),
                        c('BC04-19', 'Comparer le rapport qualité / prix',
                            "Mesurer les rapports qualité/prix du marché et inciter à fournir des services de qualité adaptés en s'appuyant sur une étude d'opportunité et de faisabilité pour faire des choix pertinents et maîtriser les coûts, en tenant compte de la durabilité des solutions proposées (recyclabilité, maintenance responsable, …)."),
                        c('BC04-20', 'Négocier avec les fournisseurs',
                            "Négocier avec les fournisseurs en mobilisant les techniques et les leviers de discussion pour obtenir de meilleures offres et contribuer à la performance économique du service informatique.")
                    ])
            ]
        }
    ];

    window.RNCP_DATA = Object.freeze({
        rncp: '41996',
        titre: 'Administrateur Systèmes, Réseaux et Base de données',
        niveau: 'Niveau 6 (EU)',
        blocs: BLOCS
    });
})();
