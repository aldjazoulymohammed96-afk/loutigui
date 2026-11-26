# Product Requirements Document (PRD) – LOUTIGUI

**Produit :** Plateforme SaaS de gestion locative « LOUTIGUI »  
**Zone géographique :** Afrique francophone (Lancement : Côte d'Ivoire / Zone UEMOA)  
**Version :** 1.0  
**Date :** 21 novembre 2026  
**Statut :** Validé pour lancement MVP  

---

## 1. Résumé Exécutif & Vision Produit

### 1.1 Constat et Problématique
En Afrique francophone, des millions de propriétaires bailleurs et de petites agences immobilières gèrent encore leur patrimoine locatif à l'aide de cahiers papier, de feuilles Excel éparses et d'échanges informels sur WhatsApp. Cette gestion artisanale entraîne :
* Un taux élevé de loyers impayés faute de suivi rigoureux et de relances systématiques.
* Des litiges fréquents sur les montants réellement versés ou les dates de paiement.
* Une absence de quittances officielles, fiables et traçables.
* Une opacité totale pour les propriétaires résidant à l'étranger (diaspora), souvent dépendants d'intermédiaires informels.

### 1.2 Vision Produit
Devenir **le système d’exploitation de référence de la gestion locative en Afrique francophone** : une plateforme mobile-first, aussi simple d'utilisation que WhatsApp, mais aussi puissante qu'un ERP d'agence immobilière, où chaque loyer est suivi, encaissé, quittancé et relancé automatiquement.

### 1.3 Objectifs Stratégiques (OKRs à 6 mois)
* **Impact financier client :** Réduire le taux d’impayés des utilisateurs actifs d’au moins **30 %** dans les 6 premiers mois.
* **Gain de productivité :** Faire économiser plus de **5 heures par semaine** aux gestionnaires (automatisation de la saisie, des relances et de l'édition de quittances).
* **Confiance & Transparence :** Offrir un suivi financier en temps réel aux propriétaires, particulièrement ceux de la diaspora.
* **Vélocité d'adoption :** Permettre une prise en main complète et l'envoi d'une première quittance en **moins de 10 minutes**, sans formation préalable.

### 1.4 Périmètre du Produit
* **Inclus (In-Scope) :** Gestion locative résidentielle (appartements, studios, villas, cours communes), commerciale (boutiques, bureaux, entrepôts) et meublée (courte/moyenne durée).
* **Exclus en V1 (Out-of-Scope) :** Transactions d'achat/vente immobilière, gestion complète de syndic de copropriété (assemblées générales, appels de fonds complexes), courtage en crédit immobilier.

---

## 2. Personas & Utilisateurs Cibles

| Persona | Profil & Volume | Objectifs Principaux | Frustrations Actuelles |
| :--- | :--- | :--- | :--- |
| **Propriétaire Individuel** | 2 à 20 logements. Peu technophile, gère en direct. | Savoir qui a payé en un coup d'œil, encaisser sans friction, éviter les impayés. | Oublie de relancer, perd ses cahiers, passe des heures à rédiger des reçus manuels. |
| **Propriétaire Diaspora** | Résidant en Europe/Amérique du Nord. Investisseur à distance. | Suivre ses revenus en temps réel (conversion EUR/USD/FCFA), valider les dépenses, éviter les détournements. | Manque de visibilité, doute sur le taux d'occupation réel et le montant des travaux facturés. |
| **Agence / Gestionnaire** | 50 à 1 000+ logements. Équipe structurée. | Gérer des portefeuilles multi-propriétaires, automatiser les commissions et les reversements. | Saisie manuelle chronophage sur Excel, erreurs de rapprochement bancaire/Mobile Money. |
| **Locataire** | Particulier ou commerçant connecté via smartphone. | Payer son loyer facilement via Mobile Money, recevoir ses quittances instantanément, signaler une panne. | Doit se déplacer ou envoyer des captures d'écran pour prouver son paiement, perd ses reçus papier. |
| **Prestataire** | Plombier, électricien, huissier, notaire. | Recevoir des ordres de mission clairs, soumettre des devis et prouver la réalisation des travaux. | Appels incessants, adresses imprécises, retards de paiement de ses factures. |

---

## 3. Matrice des Rôles et Permissions (RBAC)

Les permissions sont granulaires, configurables par module et par portefeuille. Toute action sensible (annulation de paiement, modification de bail, export massif) est inscrite dans un journal d'audit immuable.

| Rôle | Périmètre d'accès & Droits Principaux |
| :--- | :--- |
| **Super-Administrateur** | Équipe LOUTIGUI. Gestion des tenants (comptes clients), abonnements, paramètres pays, support (accès délégué temporaire avec consentement). |
| **Propriétaire** | Accès complet à ses biens, loyers, rapports financiers, coffre-fort de documents. Validation des dépenses au-dessus d'un seuil défini. |
| **Agence – Administrateur** | Gestion intégrale du portefeuille de l'agence, création d'utilisateurs/équipes, paramétrage des commissions et mandats. |
| **Agence – Gestionnaire** | Gestion opérationnelle uniquement sur les immeubles/locataires qui lui sont assignés (encaissements, relances, baux, états des lieux). |
| **Agence – Comptable** | Gestion des encaissements, rapprochements, calcul des reversements, exports comptables. Lecture seule sur le patrimoine et les baux. |
| **Agent de Terrain** | Réalisation des états des lieux, visites, prise de photos horodatées, suivi des interventions de maintenance. Aucun accès financier global. |
| **Locataire** | Portail dédié : consultation de son bail, historique des paiements, téléchargement des quittances, paiement en ligne, création de tickets d'incident. |
| **Prestataire** | Accès restreint aux tickets de maintenance qui lui sont assignés (dépôt de devis, photos avant/après, factures). |

---

## 4. Spécifications Fonctionnelles Détaillées

*Légende des priorités : **P1** = MVP (Phase 1) | **P2** = Version 2 (Phase 2) | **P3** = Version 3 (Phase 3)*

### 4.1 Onboarding & Gestion des Comptes (P1)
* **Inscription ultra-rapide :** Création de compte via numéro de téléphone et vérification OTP (SMS ou WhatsApp). Email facultatif.
* **Assistant de démarrage (5 étapes) :** Profil $\rightarrow$ Premier bien $\rightarrow$ Premier locataire $\rightarrow$ Premier loyer $\rightarrow$ Émission de la première quittance (objectif $< 10$ min).
* **Migration assistée :** Import en masse via modèles Excel/CSV ou numérisation par photo d'un cahier papier (OCR avec écran de validation humaine avant import).
* **Mode Bac à sable :** Activation/désactivation en un clic de données de démonstration réalistes.
* **Authentification :** Connexion par code OTP, mot de passe ou biométrie (FaceID / Empreinte sur mobile).

### 4.2 Gestion du Patrimoine (P1)
* **Arborescence :** Organisation hiérarchique `Portefeuille` $\rightarrow$ `Immeuble / Résidence` $\rightarrow$ `Lot` (appartement, studio, boutique, chambre, entrepôt).
* **Fiche détaillée du bien :** Adresse, coordonnées GPS, galerie photos, plans, liste des équipements, numéros de compteurs (eau, électricité), coffre-fort documentaire (titre foncier, ACD, attestation villageoise).
* **Cycle de vie :** Statuts dynamiques (`Occupé`, `Vacant`, `En travaux`, `En préavis`).
* **Multi-propriété (Indivision) :** Gestion de plusieurs propriétaires sur un même immeuble avec définition des quote-parts (%) pour la répartition des revenus et charges.
* **Navigation :** Vue liste filtrable, vue carte interactive, recherche globale instantanée et champs personnalisés.

### 4.3 Locataires & Dossiers (P1 à P3)
* **Fiche locataire (P1) :** Identité complète, numérisation des pièces d'identité (CNI, passeport, carte consulaire), contact d'urgence, employeur, informations du garant.
* **Colocation (P1) :** Gestion de plusieurs titulaires sur un même bail avec répartition personnalisée de la quote-part de loyer.
* **Candidature digitale (P2) :** Lien de dépôt de dossier de candidature en ligne avec téléversement des justificatifs.
* **Historique 360° (P1) :** Chronologie unifiée des paiements, quittances, relances envoyées, incidents techniques et échanges.
* **Score de fiabilité (P3) :** Calcul d'un indice de ponctualité basé sur l'historique interne (soumis au consentement explicite du locataire).

### 4.4 Baux & Contrats (P1 à P2)
* **Création rapide (P1) :** Génération d'un bail en moins de 2 minutes. Support explicite des baux verbaux enregistrés sous le statut *« Accord enregistré »*.
* **Bibliothèque juridique (P1) :** Modèles pré-paramétrés par pays (habitation, commercial, meublé, professionnel) entièrement personnalisables.
* **Paramètres financiers (P1) :** Durée, montant du loyer hors charges, charges forfaitaires/provisionnelles, dépôt de garantie (caution), loyers d'avance, délai de préavis.
* **Signature électronique (P1/P2) :** Signature simple par validation OTP (P1) et signature manuscrite tactile sur écran (P2).
* **Cycle de vie du bail (P1/P2) :** Alertes automatiques d'échéance ($J-90$, $J-60$, $J-30$), assistant de renouvellement, gestion des avenants, calcul automatique des dates de préavis et révision/indexation annuelle des loyers (P2).

### 4.5 Loyers & Encaissements (P1 à P2)
* **Génération automatique (P1) :** Création des échéances selon la périodicité du bail (mensuelle, trimestrielle, annuelle).
* **Statuts d'échéance (P1) :** `À venir`, `Payé`, `Partiel`, `En retard`, `Contesté`, `Annulé`.
* **Encaissement manuel "3 touches" (P1) :** Enregistrement rapide d'un règlement reçu hors ligne (espèces, virement bancaire, chèque, transfert direct).
* **Paiement digital intégré (P1) :** Génération de liens et QR codes de paiement compatibles Mobile Money (Orange Money, MTN MoMo, Moov Money, Wave) et cartes bancaires via agrégateur.
* **Rapprochement automatique (P1) :** Association instantanée des paiements digitaux à l'échéance correspondante et mise à jour du solde.
* **Cas complexes (P1) :** Gestion des paiements partiels (recalcul automatique du reste à payer), paiements anticipés, règlements groupés sur plusieurs mois, gestion des avoirs/trop-perçus et paiement par un tiers payeur.
* **Pénalités de retard (P1) :** Application automatique (montant fixe ou pourcentage) après expiration d'un délai de grâce configurable.
* **Mandats de prélèvement / rappels programmés (P2) :** Selon les API disponibles auprès des opérateurs télécoms.

### 4.6 Quittances & Documents Officiels (P1)
* **Quittancement automatisé (P1) :** Génération instantanée d'une quittance PDF dès validation d'un paiement total (reçu de paiement partiel si acompte). Numérotation séquentielle inviolable, logo, cachet/signature numérique et QR code d'authenticité.
* **Distribution multicanale (P1) :** Envoi automatique par WhatsApp, SMS (lien court), email et mise à disposition dans l'espace locataire.
* **Documents complémentaires (P1) :** Génération en un clic d'attestations de paiement, relevés de compte locataire, attestations de domicile et soldes de tout compte.
* **GED & Coffre-fort (P1) :** Archivage structuré par bien et par locataire avec gestion des versions, tags et recherche plein texte.

### 4.7 Relances & Communication (P1 à P3)
* **Séquences automatisées (P1) :** Scénarios personnalisables avant échéance ($J-5$, $J-3$), le jour $J$, et après échéance ($J+1$, $J+3$, $J+7$, $J+15$, $J+30$) avec escalade progressive du ton (courtois $\rightarrow$ ferme $\rightarrow$ pré-contentieux).
* **Canaux de diffusion (P1/P3) :** WhatsApp Business API, SMS, Email, notifications Push (P1) et appels vocaux automatisés TTS (P3).
* **Templating dynamique (P1) :** Variables intelligentes (`{{nom_locataire}}`, `{{montant_du}}`, `{{lien_paiement}}`) avec processus d'approbation Meta pour les modèles WhatsApp.
* **Garde-fous d'envoi (P1) :** Respect strict des plages horaires légales, suspension automatique en cas de plan d'apurement actif ou de désactivation manuelle.
* **Messagerie & Bot WhatsApp (P2) :** Chat in-app tripartie (Propriétaire / Gestionnaire / Locataire) et agent conversationnel WhatsApp permettant au locataire d'obtenir son solde, sa dernière quittance ou un lien de paiement par mots-clés (`SOLDE`, `QUITTANCE`, `PAYER`).

### 4.8 Gestion des Impayés & Recouvrement (P1 à P3)
* **Balance âgée (P1) :** Tableau de bord segmentant les impayés par ancienneté ($0-30$ j, $30-60$ j, $60-90$ j, $> 90$ j).
* **Plans d'apurement (P1) :** Création d'échéanciers de remboursement de dette avec suivi dédié.
* **Procédures pré-contentieuses (P1/P2) :** Génération automatique de mises en demeure conformes au droit local avec suivi des preuves de remise (P1). Constitution et export du dossier complet (bail, décompte, relances) pour transmission directe à un huissier ou avocat partenaire (P2).
* **Scoring prédictif (P3) :** Détection précoce des signaux faibles de défaillance locative.

### 4.9 États des Lieux (P2)
* **Application terrain hors ligne :** Réalisation complète sur smartphone sans connexion internet requise.
* **Inspection guidée :** Checklists personnalisables par type de pièce, prise de photos/vidéos horodatées et géolocalisées, outil d'annotation directe sur les photos (entourer une fissure/dégradation), relevé photographique des compteurs.
* **Clôture immédiate :** Double signature sur l'écran du téléphone et génération instantanée du PDF comparatif.
* **Analyse IA (P3) :** Comparaison automatisée entre les photos d'entrée et de sortie pour identifier les dégradations imputables au locataire.

### 4.10 Cautions & Dépôts de Garantie (P2)
* **Conformité légale :** Suivi séparé des cautions et avances de loyer avec contrôle des plafonds légaux paramétrés par pays (ex. plafond légal en Côte d'Ivoire).
* **Clôture financière :** Assistant de restitution en fin de bail calculant automatiquement les retenues (travaux sur devis/facture, reliquat de loyers, régularisation de charges) et générant le solde de tout compte.

### 4.11 Maintenance & Travaux (P2)
* **Portail d'incident :** Déclaration simplifiée par le locataire (catégorie, description texte ou note vocale, photos/vidéos).
* **Workflow de résolution :** Qualification du ticket, priorisation, demande de devis auprès d'un prestataire, validation budgétaire par le propriétaire (si au-dessus du seuil), suivi d'exécution et rattachement de la facture.
* **Annuaire & Préventif :** Base de prestataires évalués et calendrier de maintenance récurrente (entretien climatisation, vidange fosses, renouvellement assurances).
* **Gestion des fluides :** Suivi des factures eau/électricité (CIE, SODECI, SENELEC, etc.) et refacturation aux locataires pour les compteurs divisionnaires.

### 4.12 Comptabilité & Reversements (P2 à P3)
* **Comptabilité locative (P2) :** Journal des recettes et dépenses par bien, par immeuble et par propriétaire. Gestion des provisions et régularisation annuelle des charges.
* **Moteur de commissions (P2) :** Calcul automatique des honoraires de gestion d'agence (taux fixe, dégressif ou forfait par lot).
* **Reversements propriétaires (P2/P3) :** Édition automatique des redditions de comptes mensuelles (P2) et exécution des virements/paiements groupés Mobile Money vers les propriétaires (P3).
* **Fiscalité & Exports (P2) :** Calcul de la TVA sur les baux commerciaux, synthèse fiscale annuelle des revenus fonciers et exports aux formats comptables standards (CSV, Excel, Sage).

### 4.13 Tableaux de Bord & Reporting (P1 à P2)
* **KPIs temps réel (P1) :** Loyers attendus vs encaissés, taux de recouvrement, montant des impayés, taux d'occupation physique et financier, rendement locatif net.
* **Rapports automatisés (P1) :** Envoi automatique le 5 de chaque mois d'un rapport de synthèse (PDF + résumé WhatsApp) à chaque propriétaire.
* **Analytics avancés (P2) :** Comparatifs multi-périodes, performance par gestionnaire d'agence et générateur de rapports personnalisés planifiables.

### 4.14 Espace Locataire (P2)
* **Accès sans friction :** Progressive Web App accessible via un lien magique sécurisé (sans téléchargement obligatoire).
* **Self-service :** Consultation du solde, paiement en un clic, téléchargement des quittances et du bail, déclaration d'incident, notification de préavis de départ en ligne.

### 4.15 Espace Propriétaire & Diaspora (P1 à P2)
* **Vue consolidée multi-devises (P1) :** Agrégation de tout le patrimoine (même réparti sur plusieurs pays) avec conversion en temps réel en FCFA, EUR ou USD.
* **Gouvernance à distance (P1/P2) :** Workflow d'approbation mobile pour les devis de travaux dépassant un montant défini et validation des nouveaux dossiers locataires.
* **Délégation sécurisée (P2) :** Création d'un accès « Invité / Représentant local » pour un membre de la famille avec des droits strictement limités (ex. dépôt de photos de visite sans accès aux comptes bancaires).

### 4.16 Mode Agence & Multi-équipes (P2 à P3)
* **Organisation avancée (P2) :** Gestion multi-agences, structuration en équipes, attribution des portefeuilles et suivi des objectifs par collaborateur.
* **Mandats de gestion (P2) :** Suivi des dates d'expiration et des conditions financières des mandats propriétaires.
* **Marque Blanche (P3) :** Personnalisation intégrale aux couleurs de l'agence (logo, nom de domaine dédié, expéditeur SMS/WhatsApp et emails personnalisés).

### 4.17 Commercialisation & Vacance Locative (P3)
* **Diffusion multicanale :** Création de fiches d'annonces esthétiques partageables en un lien direct sur WhatsApp, Facebook et portails immobiliers.
* **Tunnel de location :** Gestion de l'agenda des visites, rappels automatiques aux prospects, collecte des candidatures et conversion du candidat retenu en locataire actif en un clic.

### 4.18 Intelligence Artificielle Appliquée (P2 à P3)
* **Copilote LOUTIGUI (P2) :** Assistant conversationnel en langage naturel (*« Quels locataires de l'immeuble Riviera ont un retard ce mois-ci ? »*, *« Prépare une mise en demeure pour M. Traoré »*).
* **Vision & OCR financier (P2) :** Extraction automatique des données (montant, date, référence transaction, expéditeur) depuis une photo de reçu ou une capture d'écran Wave/Orange Money pour pré-remplir l'encaissement.
* **Rédaction assistée (P2) :** Génération et reformulation de courriers et messages adaptés au contexte et au ton souhaité.
* **Prédiction & Détection d'anomalies (P3) :** Alerte sur les risques d'impayés et détection automatique d'écarts comptables ou de doublons. *Principe directeur : toute action suggérée par l'IA est explicable et soumise à validation humaine.*

### 4.19 Notifications, Abonnements & Back-Office (P1)
* **Centre de notifications (P1) :** Flux d'activité temps réel et synthèses quotidiennes/hebdomadaires configurables par canal.
* **Facturation SaaS (P1) :** Gestion des abonnements par paliers de lots, période d'essai gratuit, paiement par Mobile Money/Carte, facturation automatique, gestion des quotas (SMS/WhatsApp) et programme d'affiliation/parrainage.
* **Console Super-Admin (P1) :** Pilotage de la plateforme, gestion des paramètres réglementaires par pays, supervision des flux de paiement/messagerie et support client.

---

## 5. Exigences UX/UI & Design System

### 5.1 Principes Directeurs
1. **Mobile-First absolu :** Conçu prioritairement pour des écrans de $360\text{ px}$ de large et une utilisation à une main, tout en offrant une ergonomie riche sur tablette et desktop.
2. **Règle des 3 touches :** Les actions critiques (encaisser un loyer, envoyer une quittance, relancer un retardataire) doivent s'exécuter en 3 interactions maximum depuis l'accueil.
3. **Tolérance aux réseaux faibles :** Chargement progressif (skeleton screens), retour visuel immédiat (Optimistic UI) et gestion explicite des états hors ligne.
4. **Esthétique de confiance :** Design épuré, moderne et institutionnel inspirant la rigueur financière.

### 5.2 Design System & Accessibilité
* **Identité visuelle :** Palette contrastée respectant le ratio WCAG AA ($4.5:1$), incluant des codes couleurs sémantiques universels : Vert (Payé / À jour), Orange (Partiel / À venir), Rouge (En retard / Impayé).
* **Thèmes :** Support natif du mode clair (Light Mode) et du mode sombre (Dark Mode) synchronisé avec le système.
* **Mode Simplifié ("Accessibilité Senior / Novice") :** Option activable augmentant la taille des polices et des boutons, simplifiant le vocabulaire financier et intégrant des guides vocaux.
* **Internationalisation (i18n) :** Français par défaut au lancement, architecture prête pour l'anglais et les langues locales, avec formatage natif des devises (FCFA sans décimales), dates et indicatifs téléphoniques.

### 5.3 Écrans Clés du MVP
1. **Dashboard Accueil :** Résumé financier du mois (Encaissé vs Attendu), alerte impayés, échéances de la semaine et 3 boutons d'action rapide flottants.
2. **Échéancier des Loyers :** Vue liste/calendrier avec filtres par statut et gestes rapides (glisser à droite pour encaisser, à gauche pour relancer).
3. **Fiche Locataire :** En-tête avec solde net, boutons d'action directe (Appeler, WhatsApp, Quittance, Relancer) et fil d'actualité chronologique.
4. **Fiche Bien :** Carrousel photos, statut d'occupation, indicateurs de rentabilité, documents et historique technique.
5. **Modale d'Encaissement Express :** Sélection du montant (pré-rempli), choix du mode de paiement, validation et déclenchement immédiat de la quittance.

---

## 6. Modèle Économique & Tarification

### 6.1 Grilles Tarifaires (Abonnements Mensuels / Annuels)

| Plan | Cible & Capacité | Tarif Indicatif (FCFA / mois) | Fonctionnalités Clés Incluses |
| :--- | :--- | :--- | :--- |
| **Starter** | Particuliers (jusqu'à 5 lots) | 3 000 – 5 000 FCFA | Gestion patrimoine, baux simples, quittances PDF, encaissement manuel, relances email/app. |
| **Pro** | Bailleurs actifs (6 à 30 lots) | 10 000 – 20 000 FCFA | Tout Starter + Mobile Money intégré, relances WhatsApp/SMS (quotas), rapports mensuels auto. |
| **Diaspora** | Investisseurs à distance | 10 000 – 15 000 FCFA | Multi-devises (EUR/USD/FCFA), validation dépenses, accès invité gérant local, coffre-fort. |
| **Agence** | Professionnels (jusqu'à 500 lots) | 30 000 – 100 000 FCFA | Multi-utilisateurs & rôles, commissions, reversements, états des lieux, comptabilité. |
| **Entreprise** | Grandes foncières ($> 500$ lots) | Sur devis | Marque blanche, API dédiée, SLA garanti, gestionnaire de compte dédié. |

### 6.2 Sources de Revenus Complémentaires
* **Commissions transactionnelles :** Frais de service de $0,5\%$ à $1\%$ sur les loyers encaissés numériquement via la plateforme (refacturables au locataire ou absorbés par le bailleur selon configuration).
* **Consommation & Add-ons :** Packs de crédits SMS/WhatsApp supplémentaires, signatures électroniques avancées, module IA avancé.
* **Apport d'affaires (Marketplace services) :** Commissions sur mise en relation qualifiée avec des partenaires (huissiers, artisans certifiés, assureurs multirisque habitation).

---

## 7. Feuille de Route (Roadmap) & Équipe

### 7.1 Découpage Temporel
* **Phase 0 – Discovery & Validation (Semaines 1 à 2) :** 20 entretiens utilisateurs propriétaires, 5 audits d'agences immobilières, tests d'utilisabilité sur prototypes interactifs haute fidélité.
* **Phase 1 – Construction & Lancement MVP (Semaines 3 à 10) :** Développement des modules P1 (Onboarding, Patrimoine, Locataires, Baux simples, Encaissements Mobile Money/Manuel, Quittances QR, Relances automatisées, Dashboard essentiel, Notifications, Facturation SaaS).
* **Phase 2 – Expansion Fonctionnelle V2 (Mois 3 à 5) :** États des lieux hors ligne, gestion des cautions, maintenance & tickets, espace locataire, bot WhatsApp, recouvrement avancé, signature électronique tactile, Copilote IA V1.
* **Phase 3 – Scale & Entreprise V3 (Mois 6 à 9) :** Mode multi-agences, marque blanche, reversements automatisés de masse, comptabilité avancée, module d'annonces, scoring locataire et IA prédictive.

### 7.2 Équipe Projet Minimale
* **1 Product Manager (PM) :** Vision, priorisation, validation métier et juridique.
* **1 Product Designer (UX/UI) :** Recherche utilisateur, Design System, maquettes mobile-first.
* **2 Développeurs Full-Stack Senior :** Architecture back-end, intégrations paiements/WhatsApp, front-end PWA.
* **1 Développeur Mobile (à partir de la V2) :** Optimisation native/hybride et synchronisation hors ligne avancée.
* **1 Customer Success / Onboarding Specialist :** Accompagnement des premiers clients, import de données, support WhatsApp.
* **1 Juriste Immobilier (Consultant ponctuel) :** Rédaction et validation des modèles de contrats et mises en demeure par pays.

---

## 8. Indicateurs de Succès (KPIs) & Critères d'Acceptation MVP

### 8.1 Métriques Cibles à 6 Mois
* **Time-to-Value (TTV) :** $< 10\text{ minutes}$ entre l'inscription et l'envoi de la première quittance.
* **Taux d'activation :** $> 60\%$ des inscrits enregistrent au moins un loyer dans les 7 premiers jours.
* **Impact métier :** Réduction constatée de $> 30\%$ des impayés chez les clients actifs à M+6.
* **Rétention :** Taux de rétention mensuelle (Logo Retention) $> 90\%$.
* **Adoption digitale :** $> 40\%$ du volume total des loyers encaissé directement via les liens/QR Mobile Money de la plateforme.
* **Satisfaction (CSAT / NPS) :** Note moyenne $> 4,5 / 5$.

### 8.2 Critères d'Acceptation (Definition of Done du MVP)
1. **Parcours Novice :** Un utilisateur sans formation parvient à créer un compte, ajouter un lot, créer un locataire, enregistrer un paiement et transmettre une quittance PDF sur WhatsApp en moins de 10 minutes.
2. **Automatisation Mobile Money :** Un paiement effectué via Orange Money ou Wave en environnement de test est rapproché automatiquement en moins de 15 secondes et déclenche l'envoi immédiat de la quittance sans action manuelle.
3. **Moteur de Relance :** Les notifications automatiques programmées à $J-3$, $J+1$ et $J+7$ s'exécutent avec succès via WhatsApp Business API avec repli automatique (fallback) sur SMS en cas d'échec.
4. **Résilience Hors Ligne :** En coupant totalement la connexion réseau (mode avion), un gestionnaire peut consulter ses locataires, saisir un encaissement en espèces et voir les données se synchroniser sans perte ni doublon au retour du réseau.
5. **Étanchéité Multi-Tenant :** Les tests d'intrusion et d'isolation confirment qu'aucune requête API ne permet à un utilisateur d'accéder aux données, fichiers ou statistiques d'une autre organisation.