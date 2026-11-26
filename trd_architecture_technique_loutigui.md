# Technical Requirements Document (TRD) – LOUTIGUI

**Système :** Plateforme SaaS Multi-Tenant « LOUTIGUI »  
**Version :** 1.0  
**Date :** 21 novembre 2026  
**Auteur :** Architecture & Ingénierie Produit  

> **Note d'implémentation (novembre 2026) :** ce TRD décrit l'architecture cible recommandée. L'implémentation livrée utilise **Next.js (API Routes) + Turso/libSQL** avec un document d'état transactionnel protégé par compare-and-swap (`src/lib/db-state.ts`), et non PostgreSQL/RLS. Les références PostgreSQL, NestJS et Redis ci-dessous sont des recommandations d'architecture, pas le choix technique retenu pour cette version. Voir `README.md` § 5 pour la configuration réelle.

---

## 1. Architecture Globale & Principes Techniques

### 1.1 Paradigme Architectural
LOUTIGUI repose sur une architecture **Monolithe Modulaire (Modular Monolith)** côté Back-end couplée à une **Progressive Web App (PWA) Offline-First** côté Front-end. Ce choix garantit une vélocité de développement maximale pour le MVP tout en maintenant une séparation stricte des domaines métier (Bounded Contexts) afin de faciliter une future extraction en microservices si la charge l'exige.

### 1.2 Stack Technologique Recommandée

| Couche | Technologie Recommandée | Justification Technique |
| :--- | :--- | :--- |
| **Front-end (Web & Mobile)** | **Next.js / React + TypeScript + Tailwind CSS** | Rendu hybride performant, écosystème PWA mature (Workbox), typage strict, bundle léger optimisé pour la 3G. |
| **Stockage Local (Offline)** | **IndexedDB (via Dexie.js ou RxDB)** | Persistance locale structurée pour la consultation hors ligne et la file d'attente de synchronisation (Sync Queue). |
| **Back-end API** | **Node.js (NestJS) + TypeScript** | Architecture modulaire native, injection de dépendances, gestion robuste des Webhooks et typage partagé avec le front-end. |
| **Base de Données Principale** | **PostgreSQL 16+** | Intégrité transactionnelle ACID indispensable pour la finance, support natif du JSONB (champs personnalisés) et du Row-Level Security (RLS). |
| **Cache & File de Tâches** | **Redis + BullMQ** | Gestion des files asynchrones (relances WhatsApp/SMS, génération PDF, rapprochements paiements) avec mécanismes de retry exponentiel. |
| **Stockage Objet & CDN** | **AWS S3 / Cloudflare R2 + Cloudflare CDN** | Stockage chiffré des photos, pièces d'identité et quittances PDF avec compression d'images à la volée et distribution rapide en Afrique. |
| **Moteur PDF** | **Puppeteer (Headless Chrome) ou Gotenberg** | Rendu fidèle de modèles HTML/CSS complexes incluant polices personnalisées et génération dynamique de QR codes. |

### 1.3 Schéma d'Architecture Logique

```text
+-------------------------------------------------------------------+
|                        CLIENTS (MOBILE / WEB)                     |
|  [PWA Offline-First (Proprio/Agence)]   [Web-App Lien Magique]    |
|          | (IndexedDB + Service Worker)           |               |
+----------|----------------------------------------|---------------+
           | HTTPS / TLS 1.3 (REST / JSON)          |
           v                                        v
+-------------------------------------------------------------------+
|                   API GATEWAY & WAF (Cloudflare)                  |
|         Rate Limiting · DDoS Protection · SSL Termination         |
+-------------------------------------------------------------------+
           |
           v
+-------------------------------------------------------------------+
|                    BACK-END MODULAIRE (NestJS)                    |
|  +-------------+  +---------------+  +-------------------------+  |
|  | Auth & RBAC |  | Core Property |  | Billing & Ledger Engine |  |
|  +-------------+  +---------------+  +-------------------------+  |
|  +-------------+  +---------------+  +-------------------------+  |
|  | Comms & Bot |  |  PDF & Vault  |  |   AI & OCR Orchestrator |  |
|  +-------------+  +---------------+  +-------------------------+  |
+----------|----------------|-----------------------|---------------+
           |                |                       |
           v                v                       v
+-------------------+ +-------------+ +-----------------------------+
| PostgreSQL (RLS)  | | Redis/Bull  | |   INTÉGRATIONS EXTERNES     |
| + Read Replicas   | | (Workers)   | | - Agrégateurs (CinetPay...) |
+-------------------+ +-------------+ | - Meta WhatsApp Business    |
                                      | - Passerelles SMS (Orange)  |
                                      | - LLM / Vision API          |
                                      +-----------------------------+
```

---

## 2. Architecture Multi-Tenant & Isolation des Données

### 2.1 Stratégie d'Isolation
LOUTIGUI utilise une approche **Shared Database, Shared Schema** avec isolation logique stricte garantie à deux niveaux :
1. **Niveau Applicatif :** Un middleware extrait systématiquement le `tenant_id` (identifiant de l'Organisation) depuis le jeton JWT authentifié et l'injecte dans le contexte de requête.
2. **Niveau Base de Données (PostgreSQL RLS) :** Activation des politiques de sécurité au niveau des lignes (*Row-Level Security*) sur toutes les tables métier.

```sql
-- Exemple de politique RLS PostgreSQL garantissant l'étanchéité inter-clients
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_policy ON payments
    USING (organization_id = current_setting('app.current_tenant_id')::uuid);
```

### 2.2 Gestion des Accès Transverses (Cas Spécifiques)
* **Locataire multi-baux :** Un utilisateur `Locataire` (identifié par son numéro de téléphone unique) peut être rattaché à plusieurs baux dans différentes organisations. Son portail agrège ses contrats en requêtant via son `user_id` sur une vue sécurisée dédiée.
* **Propriétaire Diaspora multi-agences :** Un propriétaire ayant confié ses biens à deux agences distinctes dispose d'une vue consolidée en lecture seule via des liaisons `owner_profiles` autorisées.

---

## 3. Modèle de Données (Schéma Relationnel Core)

### 3.1 Conventions de Modélisation
* **Identifiants :** `UUID v7` (ordonnés chronologiquement pour optimiser l'indexation B-Tree PostgreSQL).
* **Montants financiers :** Stockés exclusivement en `BIGINT` représentant la plus petite unité monétaire (ex. `150000` pour 150 000 FCFA, ou centimes pour l'Euro) afin d'éliminer toute erreur d'arrondi flottant.
* **Horodatage :** Toutes les dates en `TIMESTAMPTZ` (UTC) avec conversion côté client selon le fuseau horaire du pays.
* **Suppression :** Soft-delete (`deleted_at`) uniquement sur les entités non comptables. Interdiction stricte de suppression physique ou logique sur les écritures financières (remplacées par des écritures d'annulation/contre-passation).

### 3.2 Entités Principales & Relations

```text
[organizations] 1---* [users_roles] *---1 [users]
       |
       +---* [portfolios] 1---* [buildings] 1---* [units (lots)]
       |                                             |
       +---* [owners] *---* [building_owners]        | (0..1 actif)
       |                                             v
       +---* [tenants] *---* [lease_tenants] *---1 [leases (baux)]
       |                                             |
       |                                             v
       +---* [payments] *---1 [installments (échéances)]
       |        |
       |        +---0..1 [receipts (quittances)]
       |
       +---* [maintenance_tickets] *---0..1 [vendors (prestataires)]
       +---* [audit_logs] (Append-only)
```

### 3.3 Détail des Tables Critiques (DDL Simplifié)

```sql
CREATE TABLE organizations (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    country_code CHAR(2) NOT NULL DEFAULT 'CI',
    default_currency CHAR(3) NOT NULL DEFAULT 'XOF',
    subscription_plan VARCHAR(50) NOT NULL,
    settings JSONB NOT NULL DEFAULT '{}', -- Règles pays, seuils, marque blanche
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE leases (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    unit_id UUID NOT NULL REFERENCES units(id),
    lease_type VARCHAR(30) NOT NULL, -- RESIDENTIAL, COMMERCIAL, FURNISHED, VERBAL
    status VARCHAR(20) NOT NULL, -- DRAFT, ACTIVE, NOTICE_GIVEN, TERMINATED
    start_date DATE NOT NULL,
    end_date DATE,
    rent_amount BIGINT NOT NULL,
    charges_amount BIGINT NOT NULL DEFAULT 0,
    deposit_amount BIGINT NOT NULL DEFAULT 0,
    billing_frequency VARCHAR(20) NOT NULL DEFAULT 'MONTHLY',
    payment_due_day SMALLINT NOT NULL DEFAULT 5,
    grace_period_days SMALLINT NOT NULL DEFAULT 5,
    late_fee_config JSONB, -- { "type": "PERCENTAGE", "value": 5 }
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE installments (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    lease_id UUID NOT NULL REFERENCES leases(id),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    due_date DATE NOT NULL,
    total_due BIGINT NOT NULL,
    amount_paid BIGINT NOT NULL DEFAULT 0,
    penalty_applied BIGINT NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL, -- UPCOMING, PARTIAL, PAID, OVERDUE, CANCELLED
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE payments (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    installment_id UUID NOT NULL REFERENCES installments(id),
    amount BIGINT NOT NULL,
    currency CHAR(3) NOT NULL,
    exchange_rate_to_base NUMERIC(12,6) NOT NULL DEFAULT 1.0,
    payment_method VARCHAR(30) NOT NULL, -- CASH, MOBILE_MONEY, BANK_TRANSFER, CHECK, CARD
    provider VARCHAR(50), -- WAVE, ORANGE_MONEY, MTN_MOMO, MOOV, CINETPAY
    external_transaction_ref VARCHAR(255) UNIQUE,
    status VARCHAR(20) NOT NULL, -- PENDING, CONFIRMED, FAILED, REVERSED
    paid_at TIMESTAMPTZ NOT NULL,
    recorded_by UUID REFERENCES users(id),
    offline_sync_id UUID UNIQUE, -- Idempotence synchronisation hors ligne
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE receipts (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    payment_id UUID NOT NULL UNIQUE REFERENCES payments(id),
    receipt_number VARCHAR(50) NOT NULL, -- Format: QUITT-2026-000142
    verification_hash VARCHAR(64) NOT NULL UNIQUE, -- Pour QR Code public
    pdf_storage_key VARCHAR(512) NOT NULL,
    issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id, receipt_number)
);
```

---

## 4. Spécifications des Intégrations & API Externes

### 4.1 Abstraction des Paiements (Payment Gateway Pattern)
Pour éviter toute dépendance critique à un seul opérateur, le back-end implémente une interface `IPaymentProvider` permettant de router les transactions selon le pays et la disponibilité des APIs (ex. Wave Direct API en Côte d'Ivoire/Sénégal, CinetPay ou PayDunya en agrégation multi-opérateurs).

* **Flux de Paiement & Rapprochement (Webhook Idempotent) :**
  1. Le système génère une intention de paiement avec un `reference_id` unique lié à l'échéance.
  2. Le locataire paie via USSD, application Wave/OM ou lien web.
  3. L'agrégateur envoie un Webhook `POST /api/v1/webhooks/payments/{provider}`.
  4. **Sécurité :** Vérification systématique de la signature cryptographique HMAC-SHA256 du header et double vérification via appel API sortant (`GET /transactions/{id}/status`).
  5. **Idempotence :** Utilisation d'un verrou distribué Redis (`SETNX`) sur `external_transaction_ref` pour éviter tout double traitement en cas de renvoi du webhook.
  6. **Transaction ACID :** Insertion du paiement confirmé $\rightarrow$ Mise à jour du solde de l'échéance $\rightarrow$ Émission du numéro séquentiel de quittance $\rightarrow$ Mise en file BullMQ de la génération PDF et de l'envoi WhatsApp.

### 4.2 Moteur de Communication (WhatsApp Business API & SMS)
* **Architecture d'envoi :** Worker BullMQ dédié avec gestion de quotas par organisation et respect des fenêtres horaires (ex. interdiction d'envoi entre 20h00 et 08h00 heure locale).
* **Stratégie de repli (Fallback) :** Si un message WhatsApp échoue (numéro non inscrit sur WhatsApp ou erreur API Meta après 2 tentatives), le système bascule automatiquement sur une passerelle SMS locale (ex. Orange SMS API, Twilio, Infobip) avec un lien raccourci vers la quittance.
* **Bot WhatsApp (V2) :** Webhook entrant analysant les messages reçus via détection d'intention (mots-clés stricts en P2 puis NLU léger) authentifiant l'expéditeur via son numéro de téléphone (`from_phone`).

### 4.3 Pipeline Intelligence Artificielle & OCR
* **Lecture de reçus & cahiers :** Appel asynchrone vers un modèle multimodal (Vision LLM) avec prompt structuré imposant une sortie JSON stricte (`Structured Outputs`) contenant les champs extraits et un indice de confiance par champ.
* **Garde-fous :** Aucune écriture comptable n'est validée automatiquement par l'IA ; les données sont présentées pré-remplies à l'utilisateur dans l'interface pour confirmation.
* **Anonymisation :** Suppression des données nominatives non nécessaires avant envoi aux API LLM externes et utilisation d'endpoints garantissant l'absence d'entraînement sur les données clients (*Zero Data Retention*).

---

## 5. Architecture Offline-First & Synchronisation

Pour pallier l'instabilité des réseaux 3G/4G sur le terrain (notamment lors des visites, états des lieux ou encaissements en espèces) :

1. **Cache de Lecture :** Le Service Worker et IndexedDB stockent localement le référentiel actif de l'utilisateur (biens, locataires, baux actifs, échéances du mois en cours et du mois précédent).
2. **File d'Attente de Mutations (Outbox Pattern) :** Toute action effectuée hors ligne (encaissement manuel, création de ticket, saisie d'état des lieux) est enregistrée localement avec un UUID v4 généré par le client (`offline_sync_id`) et un horodatage local.
3. **Synchronisation Automatique :** Dès détection du retour réseau (`navigator.onLine` + ping healthcheck API), la file est dépiler séquentiellement vers `POST /api/v1/sync/batch`.
4. **Résolution des Conflits :**
   * *Encaissements :* Approche **Append-Only** (deux encaissements saisis hors ligne sur une même échéance sont tous deux enregistrés ; si la somme dépasse le dû, l'excédent est automatiquement basculé en crédit/avoir locataire avec alerte au gestionnaire).
   * *Fiches descriptives / États des lieux :* Stratégie *Last-Write-Wins* au niveau du champ modifié, avec conservation de l'historique dans l'audit log.

---

## 6. Sécurité, Conformité & Résilience

### 6.1 Sécurité Applicative & Authentification
* **Authentification :** JWT courte durée (15 min) + Refresh Token rotatif stocké en cookie `HttpOnly, Secure, SameSite=Strict`.
* **MFA / OTP :** Validation obligatoire par code OTP à 6 chiffres (expiration 5 min, max 3 essais) pour l'inscription, la signature électronique de bail et les opérations sensibles (changement de RIB de reversement).
* **Chiffrement :**
  * *En transit :* TLS 1.3 obligatoire (HSTS activé).
  * *Au repos :* Chiffrement AES-256 des bases de données, des sauvegardes et des buckets S3. Les pièces d'identité (CNI/Passeports) sont stockées dans un bucket privé accessible uniquement via des URLs présignées expirant après 15 minutes.
* **Vérification publique des quittances :** Endpoint public `GET /api/v1/public/verify-receipt/{verification_hash}` permettant à toute banque, ambassade ou employeur de vérifier l'authenticité d'une quittance en scannant son QR code, sans exposer d'autres données privées.

### 6.2 Conformité Réglementaire & Protection des Données
* **Cadre légal :** Conformité avec la **Loi n° 2013-450 relative à la protection des données à caractère personnel en Côte d'Ivoire (ARTCI)** et les législations équivalentes de la zone UEMOA/CEDEAO (CDP au Sénégal, APDP au Bénin, etc.).
* **Droits des personnes :** Mécanismes intégrés d'export des données personnelles (portabilité) et d'anonymisation sur demande (droit à l'oubli) tout en préservant l'intégrité des pièces comptables obligatoires (conservation légale de 10 ans sous forme archivée).
* **Conformité financière (BCEAO) :** LOUTIGUI agit strictement comme prestataire technique de logiciel. Les fonds transitent directement via des établissements de monnaie électronique (EME) et agrégateurs agréés par la BCEAO ; LOUTIGUI ne détient aucun compte de cantonnement ni fonds tiers.

### 6.3 Haute Disponibilité, Sauvegardes & Observabilité
* **SLA Cible :** $99,9\%$ de disponibilité mensuelle.
* **Sauvegardes & PRA :** Point-in-Time Recovery (PITR) activé sur PostgreSQL (RPO $< 5$ minutes), snapshots quotidiens chiffrés répliqués dans une région géographique distincte, tests de restauration automatisés mensuels (RTO $< 2$ heures).
* **Observabilité :**
  * *Logs structurés (JSON) :* Centralisation via OpenTelemetry / Datadog / Grafana Loki avec masquage automatique des PII (numéros de téléphone, tokens).
  * *Alerting temps réel :* Alertes PagerDuty/Slack sur les taux d'erreur HTTP 5xx, les échecs de webhooks de paiement et la latence des files BullMQ.

---

## 7. Performance & Critères Techniques d'Acceptation

### 7.1 Budgets de Performance (Réseau 3G Simulé – 750 kbps, RTT 150 ms)
* **First Contentful Paint (FCP) :** $< 1,5\text{ seconde}$.
* **Time to Interactive (TTI) :** $< 3,0\text{ secondes}$.
* **Taille du bundle JS initial (gzippé) :** $< 180\text{ Ko}$.
* **Temps de réponse API (p95) :** $< 300\text{ ms}$ pour les lectures, $< 600\text{ ms}$ pour les écritures transactionnelles.
* **Génération d'une quittance PDF :** $< 2,5\text{ secondes}$ entre la confirmation du paiement et la disponibilité du fichier sur CDN.

### 7.2 Stratégie de Tests & CI/CD
* **Pipeline CI/CD (GitHub Actions) :** Linting, analyse statique de sécurité (SAST), tests unitaires (couverture $> 80\%$ sur le moteur comptable et les règles de gestion), tests d'intégration API et déploiement Blue/Green sans interruption de service.
* **Tests E2E Critiques (Playwright) :** Exécution automatique avant chaque mise en production des scénarios d'onboarding, d'encaissement partiel/total, de génération de quittance et de bascule hors ligne.