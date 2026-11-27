# LOUTIGUI — SaaS de gestion locative (UEMOA / Afrique francophone)

Plateforme multi-locataires pour propriétaires bailleurs, diaspora et agences immobilières : patrimoine, baux, échéanciers, encaissements, quittances certifiées, relances et abonnements.

> **Aucun mode démonstration, aucune interface factice et aucun paiement simulé.** Chaque action est persistée et contrôlée côté serveur.

---

## 1. Démarrage

```bash
npm install
cp .env.example .env.local
# Renseigner au minimum SESSION_SECRET, puis les fournisseurs souhaités
npm run dev
```

Variables obligatoires et optionnelles : voir `.env.example`.

| Variable | Rôle | Obligatoire |
| --- | --- | --- |
| `TURSO_DATABASE_URL` | Base Turso/libSQL persistante (`libsql://…`) | **Oui en production** |
| `TURSO_AUTH_TOKEN` | Token d'accès à la base Turso | **Oui en production** |
| `SESSION_SECRET` | Signature HMAC du cookie de session (≥ 32 caractères aléatoires) | **Oui en production** |
| `CRON_SECRET` | Protection du cron `/api/cron/reminders` | **Oui en production** |
| `APP_URL` | URL publique utilisée dans les liens email / paiement | Recommandé |
| `SASPAY_API_KEY`, `SASPAY_WEBHOOK_SECRET` | Abonnements SasPay | Pour les abonnements |
| `PAYMENT_PROVIDER`, `PAYMENT_API_URL`, `PAYMENT_API_KEY`, `PAYMENT_WEBHOOK_SECRET` | Passerelle Mobile Money des loyers | Pour le paiement en ligne |
| `SMS_PROVIDER`, `TWILIO_*` ou `SMS_GATEWAY_*` | Relances SMS réelles | Pour les SMS |
| `EMAIL_PROVIDER` (`resend`, `brevo`, `sendgrid`), `RESEND_API_KEY` / `BREVO_API_KEY` / `SENDGRID_API_KEY`, `EMAIL_FROM` | Relances email réelles | Pour les emails |

Générer un secret :

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Commandes :

```bash
npm run dev     # développement
npm run lint    # ESLint
npx tsc --noEmit
npm run build   # build de production
npm run start   # serveur de production
```

---

## 2. Sécurité implémentée

- **Sessions serveur** : cookie `loutigui_session` `HttpOnly`, `SameSite=Lax`, `Secure` en production, signé HMAC-SHA256, durée 7 jours. Aucun jeton ni mot de passe dans `localStorage`.
- **Vérification réelle** : le cookie est vérifié cryptographiquement dans chaque route API via `requireAuth()` ; le middleware bloque les pages privées.
- **Isolation multi-tenant** : toutes les lectures/écritures sont filtrées par `organizationId`. Une organisation ne peut jamais accéder aux données d'une autre.
- **Mots de passe** : hachage `scrypt` avec sel aléatoire (`src/lib/password.ts`). Migration automatique des anciens mots de passe en clair au premier chargement. Aucun champ de credential n'est renvoyé par les API ni les exports.
- **Validation runtime** : tous les payloads sont validés avec `zod` (`src/lib/validation.ts`).
- **Rôles** : `OWNER`, `AGENCY_ADMIN`, `MANAGER`, `ACCOUNTANT`, `FIELD_AGENT` ; contrôle fin par route (organisation, encaissement, export).
- **Rate limiting** : connexion, inscription, réinitialisation et vérification de quittance.
- **Réinitialisation de mot de passe** : jeton à usage unique, valable 1 heure, stocké haché, envoyé uniquement si une passerelle email est réellement configurée.
- **En-têtes de sécurité** : `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, HSTS.
- **Journal d'audit** : connexions, créations/modifications/suppressions, encaissements, export, activation d'abonnement. Consultable dans Paramètres (administrateurs).

---

## 3. Paiements — aucun simulateur

- Le bouton « Payer maintenant » crée une **session de paiement réelle** chez le fournisseur configuré (`POST /api/payments/intent`) et redirige vers sa page sécurisée.
- Aucune quittance n'est émise à cette étape. Seul le **webhook signé** `POST /api/webhooks/payments` (`x-payment-signature: sha256=…`, HMAC du corps brut) confirme la transaction et génère la quittance.
- Les webhooks rejoués sont idempotents (référence de transaction unique).
- Si la passerelle n'est pas configurée, l'API répond **503** avec un message explicite : jamais de succès factice.
- Les abonnements utilisent SasPay : checkout réel, vérification du statut auprès de l'API, métadonnées signées contrôlées côté serveur, webhook `SASPAY_WEBHOOK_SECRET` idempotent.

---

## 4. Relances

Le cron quotidien `GET/POST /api/cron/reminders` (protégé par `CRON_SECRET`, déclaré dans `vercel.json`) :

1. génère les échéances du mois pour chaque bail actif (idempotent),
2. met à jour les statuts (`UPCOMING` → `OVERDUE`) et applique les pénalités après le délai de grâce,
3. envoie les séquences J-3 / Jour J / J+3 / J+7 / mise en demeure J+15 par SMS et/ou email, sans doublon,
4. envoie le rapport quotidien à l'organisation si le digest est activé.

Un fournisseur non configuré renvoie une erreur explicite et l'échec est journalisé : aucun envoi n'est simulé.

---

## 5. Persistance Turso (libSQL)

### Production (Vercel, serveur sans disque persistant)

Définir `TURSO_DATABASE_URL` et `TURSO_AUTH_TOKEN` dans les variables d'environnement. Créez la base sur [turso.tech](https://turso.tech) ; l'URL ressemble à `libsql://ma-base-org.turso.io`.

La table `loutigui_state` est créée automatiquement au premier accès. Chaque opération du store s'exécute de façon atomique :

1. le document d'état et sa version sont lus depuis Turso ;
2. la logique métier existante s'applique sur une copie isolée ;
3. l'écriture utilise un **compare-and-swap** (`UPDATE … WHERE version = ?`) ; en cas de conflit, l'opération est rejouée sur la version la plus récente (8 tentatives maximum).

Plusieurs instances serverless ne peuvent donc pas écraser les données de l'autre, sans transaction interactive ni verrou de ligne. Ainsi `recordPayment()` (échéance + paiement + quittance + séquence), `createLease()`, les relances et le journal d'audit restent atomiques. Aucun fichier n'est écrit sur le serveur. `SESSION_SECRET` et `CRON_SECRET` sont obligatoires en production.

### Import des données locales

Pour transférer un `data/db.json` existant vers Turso :

```bash
TURSO_DATABASE_URL="libsql://…" TURSO_AUTH_TOKEN="…" npm run db:import
```

Le script applique un `UPSERT` de la base complète ; la migration des anciens formats et des mots de passe en clair s'applique ensuite automatiquement au premier accès. `data/db.json` et `data/.session-secret` restent exclus du dépôt.

### Développement local

Sans `TURSO_DATABASE_URL`, le même store utilise `data/db.json` avec écriture atomique (fichier temporaire + `rename`). Ce mode est réservé au poste de travail : le système de fichiers de Vercel est en lecture seule et éphémère.

Pour tester le backend libSQL sans cloud : `TURSO_DATABASE_URL=file:data/loutigui.db npm run dev`. Aucun Docker n'est nécessaire.

> Le schéma relationnel normalisé (`organizations`, `users`, `leases`, `installments`, `receipts`, …) décrit dans les versions précédentes du README n'a pas été retenu : le document transactionnel conserve exactement les règles métier validées, avec contrôle de concurrence et isolation multi-tenant. Une normalisation ultérieure peut être faite sans changer les routes API, le store étant le seul point d'accès aux données.

### Déploiement Vercel

1. Créer une base Turso et récupérer son URL (`libsql://…`) et son token.
2. Dans **Vercel → Project → Settings → Environment Variables**, définir au minimum :

   ```text
   TURSO_DATABASE_URL=libsql://…
   TURSO_AUTH_TOKEN=<token Turso>
   SESSION_SECRET=<secret aléatoire ≥ 32 caractères>
   CRON_SECRET=<secret aléatoire>
   NEXT_PUBLIC_SITE_URL=https://<votre-domaine>
   APP_URL=https://<votre-domaine>
   ```

3. Si vous migrez depuis une installation locale : `TURSO_DATABASE_URL="libsql://…" TURSO_AUTH_TOKEN="…" npm run db:import`.
4. Redéployer. La table `loutigui_state` est créée automatiquement au premier accès.
5. Ajouter les variables des fournisseurs réels (Twilio, Resend/Brevo/SendGrid, passerelle Mobile Money, SasPay) uniquement si les services sont activés.

Aucune écriture sur le système de fichiers n'est nécessaire en production. Une URL `DATABASE_URL` PostgreSQL est refusée explicitement.

---

## 6. Forfaits

| Forfait | Lots | Utilisateurs | SMS / mois |
| --- | ---: | ---: | ---: |
| STARTER | 10 | 1 | 50 |
| PRO | 35 | 5 | 300 |
| AGENCE | illimité | 20 | 2 000 |

Les limites sont contrôlées côté serveur (`src/lib/plans.ts`) à la création d'un lot ou d'un utilisateur. Le statut d'abonnement (essai 7 jours, actif, expiré) est calculé serveur.

---

## 7. Structure utile

```
src/lib/data-store.ts        logique métier multi-tenant, migration, CRUD
src/lib/db-state.ts          backend Turso/libSQL avec CAS / repli JSON local
src/lib/db-types.ts          contrat de sérialisation de l'état
src/lib/auth.ts              sessions, rôles, sanitization, erreurs API
src/lib/session.ts           cookie signé
src/lib/password.ts          scrypt + politique mot de passe
src/lib/validation.ts        schémas zod
src/lib/payment-provider.ts  passerelle de paiement + webhook HMAC
src/lib/notification-service.ts  SMS/email réels
src/lib/reminder-engine.ts   envoi de relances partagé (cron + manuel)
src/middleware.ts            protection des pages
src/app/api/                 routes API contrôlées
```

*Développé dans le respect du PRD et du TRD LOUTIGUI V1.0.*
