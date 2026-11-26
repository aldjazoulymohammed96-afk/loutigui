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
| `SESSION_SECRET` | Signature HMAC du cookie de session (≥ 32 caractères aléatoires) | **Oui en production** |
| `CRON_SECRET` | Protection du cron `/api/cron/reminders` | **Oui en production** |
| `APP_URL` | URL publique utilisée dans les liens email / paiement | Recommandé |
| `SASPAY_API_KEY`, `SASPAY_WEBHOOK_SECRET` | Abonnements SasPay | Pour les abonnements |
| `PAYMENT_PROVIDER`, `PAYMENT_API_URL`, `PAYMENT_API_KEY`, `PAYMENT_WEBHOOK_SECRET` | Passerelle Mobile Money des loyers | Pour le paiement en ligne |
| `SMS_PROVIDER`, `TWILIO_*` ou `SMS_GATEWAY_*` | Relances SMS réelles | Pour les SMS |
| `EMAIL_PROVIDER`, `BREVO_API_KEY` ou `SENDGRID_API_KEY`, `EMAIL_FROM` | Relances email réelles | Pour les emails |

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

## 5. Stockage et migration PostgreSQL

La persistance actuelle utilise un stockage JSON multi-tenant atomique (`data/db.json` : écriture temporaire + `rename`, verrou en mémoire, détection des changements externes). Ce choix permet un déploiement sans base de données. `data/db.json` et `data/.session-secret` sont exclus du dépôt.

Pour passer à PostgreSQL en production, le contrat à respecter est défini par `DatabaseSchema` dans `src/lib/data-store.ts` :

- tables `organizations`, `users`, `buildings`, `units`, `tenants`, `leases`, `installments`, `payments`, `receipts`, `tickets`, `reminders`, `audit_logs`, `password_resets` ;
- `organization_id` sur **toutes** les tables métier, avec index composite `(organization_id, …)` ;
- `users.password_hash` (jamais de mot de passe en clair) ;
- `receipts.verification_hash` unique, `numéro de quittance` unique par organisation (`organization.receipt_seq`) ;
- `payments.external_transaction_ref` unique pour l'idempotence des webhooks ;
- transactions autour de `recordPayment()` (échéance + paiement + quittance + séquence) et de `createLease()`.

Les getters de `dataStore` sont déjà isolés par `organizationId` : le remplacement du backend peut se faire sans modifier les routes API.

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
src/lib/data-store.ts        persistance multi-tenant, migration, métier
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
