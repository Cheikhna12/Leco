# Leco

Leco est une application web mobile-first de découverte sociale spontanée et
sécurisée à Abidjan. Elle permet de découvrir les personnes disponibles
maintenant selon leur humeur, sans exposer leur position exacte.

## État du projet

La vague 1 fournit :

- Next.js App Router, TypeScript strict et Tailwind CSS ;
- schéma PostgreSQL 15/PostGIS, migrations reproductibles et seed ;
- politiques RLS forcées et RPC `security definer` à privilèges minimaux ;
- tests pgTAP réels pour les identités, RLS, RPC, blocages et la concurrence ;
- rate limiting atomique PostgreSQL et adaptateur serveur Supabase ;
- helpers de validation, autorisation, headers et redaction ;
- interface mobile-first utilisant uniquement des données fictives signalées.

La vague 2 ajoute l’authentification OTP, les sessions SSR, l’onboarding
transactionnel avec photos et intérêts, la géolocalisation consentie, la
disponibilité temporaire et le heartbeat sur un même contrat de session.

## Prérequis

- Node.js 20.19 ou supérieur ;
- npm ;
- Docker Desktop avec le moteur Linux démarré ;
- environ 3 Go d’espace libre au premier téléchargement des images Supabase ;
- ports locaux `3000`, `54321`, `54322`, `54323` et `54324` disponibles.

Vérifier l’environnement :

```powershell
node --version
docker version
npx supabase --version
```

## Installation et démarrage local

```powershell
npm install
Copy-Item .env.example .env.local
npx supabase start
npx supabase db reset
npm run dev
```

L’application est disponible sur `http://localhost:3000` et Supabase Studio sur
`http://127.0.0.1:54323`.

`supabase db reset` recrée la base, applique dans l’ordre toutes les migrations
de `supabase/migrations`, puis exécute `supabase/seed.sql`. Cette commande
supprime les données de la base locale uniquement.

## Variables d’environnement locales

Après `npx supabase start`, exécuter `npx supabase status` et reporter dans
`.env.local` uniquement les valeurs locales nécessaires :

```text
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<clé publique locale>
SUPABASE_SERVICE_ROLE_KEY=<clé service locale, serveur uniquement>
SUPABASE_DB_URL=<URL PostgreSQL locale>
RATE_LIMIT_HMAC_SECRET=<secret local aléatoire d’au moins 32 caractères>
SMS_PROVIDER=test
DEVELOPMENT_OTP_CODE=<code local de six chiffres, jamais en production>
CAPTCHA_PROVIDER=test
NEXT_PUBLIC_CAPTCHA_PROVIDER=test
NEXT_PUBLIC_CAPTCHA_SITE_KEY=<vide pour le fournisseur test>
CAPTCHA_SECRET_KEY=<vide pour le fournisseur test>
```

Ne jamais préfixer une clé service ou un secret par `NEXT_PUBLIC_`. Ne jamais
committer `.env.local`, un OTP, un JWT, une clé Cloudinary ou des coordonnées.

`SMS_PROVIDER=test` utilise `DevelopmentOtpProvider`. Il crée une identité
Supabase locale et établit une vraie session SSR, mais ne transmet aucun SMS. Le
code défini dans `DEVELOPMENT_OTP_CODE` doit être fourni localement à l’équipe,
jamais écrit dans les logs ou versionné. Le fournisseur lève une erreur au
démarrage s’il est sélectionné avec `NODE_ENV=production`.

Pour un environnement connecté, utiliser `SMS_PROVIDER=supabase` et configurer
le fournisseur SMS dans Supabase. Le CAPTCHA prend en charge `turnstile` et
`hcaptcha`; les variables serveur et `NEXT_PUBLIC_CAPTCHA_*` doivent désigner le
même fournisseur.

## Authentification et contrat de session

- `/connexion` normalise les mobiles ivoiriens en `+225`, recueille le
  consentement et demande un OTP avec un message anti-énumération ;
- `/verification-otp` accepte six chiffres, le collage et la navigation clavier,
  puis crée la session Supabase dans des cookies SSR ;
- `/api/auth/session`, `/api/auth/refresh` et `/api/auth/logout` exposent les
  opérations minimales de session sans retourner de JWT ;
- les routes `/onboarding`, `/profil` et `/presence` sont protégées par le proxy ;
- un profil incomplet va vers `/onboarding`, un compte suspendu vers
  `/acces-restreint`, et un profil complet vers l’accueil.

Le contrat partagé se trouve dans
`src/features/auth/session-contract.ts`. Les autres fonctionnalités doivent
utiliser `SessionReader` ou `getServerSession()` depuis
`src/lib/supabase/session.ts`, et ne jamais décoder directement les cookies ou
les JWT.

## Géolocalisation et présence

- `/presence` explique l’usage de la position avant tout appel à l’API du
  navigateur et gère refus, blocage, timeout, indisponibilité et précision
  insuffisante ;
- `POST /api/location` valide une position récente, applique le rate limiting et
  appelle `update_my_location` sans jamais retourner les coordonnées ;
- `GET`, `POST` et `DELETE /api/presence` lisent, activent et désactivent la
  présence de l’utilisateur courant ;
- `POST /api/presence/heartbeat` maintient uniquement une présence active,
  toutes les 50 secondes lorsque l’onglet est visible ;
- le heartbeat s’arrête à la déconnexion, à la désactivation et à l’expiration.
  Cinq minutes sans heartbeat rendent la présence invisible côté base ;
- les coordonnées exactes restent absentes des réponses, de l’interface et des
  logs.

## Validation de la base

```powershell
npx supabase db reset
npx supabase db lint
npx supabase db lint --schema public,private --fail-on error
npm run test:db:local
```

Le lint global peut signaler des faux positifs dans les fonctions fournies par
l’extension PostGIS. Le lint strict des schémas applicatifs `public,private`
doit retourner zéro erreur. Les tests pgTAP valident les permissions sur la base
réelle et exécutent des appels concurrents via plusieurs connexions PostgreSQL.

## Commandes principales

```text
npm run dev             Serveur Next.js local
npm run typecheck       TypeScript strict
npm run lint            ESLint
npm run format:check    Vérification Prettier
npm run test            Suite Vitest
npm run test:e2e        Smoke tests Playwright
npm run test:database   Contrôles statiques des migrations
npm run test:db:local   Tests pgTAP réels sur Supabase local
npm run test:security   Tests des helpers de sécurité
npm run build           Build Next.js de production
npm run db:start        Démarrage Supabase
npm run db:reset        Réinitialisation locale et migrations
npm run db:lint         Lint de tous les schémas
npm run db:lint:strict  Lint bloquant de public et private
npm run db:stop         Arrêt Supabase
npm run validate:wave1  Validation locale complète
npm run validate:wave2  Validation complète des vagues 1 et 2
```

Les commandes demandées peuvent également être lancées directement :

```powershell
npm install
npx supabase start
npx supabase db reset
npx supabase db lint
npm run dev
npm run typecheck
npm run lint
npm run test
npm run build
```

## Erreurs fréquentes

- `Cannot connect to the Docker daemon` : démarrer Docker Desktop et attendre
  que `docker version` affiche une section `Server`.
- Port déjà utilisé : arrêter l’ancien projet Supabase avec
  `npx supabase stop`, puis relancer.
- Migration en erreur : lire la première erreur SQL, corriger par une nouvelle
  migration si elle a déjà été publiée, puis relancer `npx supabase db reset`.
- Avertissements `extensions.st_findextent` ou `populate_geometry_columns` :
  relancer le lint strict `--schema public,private`; ne pas modifier PostGIS.
- Login téléphone désactivé : configurer un fournisseur SMS local avant les
  tests OTP, ou utiliser `SMS_PROVIDER=test` avec les variables locales
  documentées ci-dessus.
- Le conteneur Vector peut redémarrer lorsque Docker Desktop ne fournit pas son
  endpoint interne. Ce défaut d’agrégation des logs locaux ne bloque pas
  PostgreSQL, PostGIS, Auth, API, Studio ou Realtime, et ne bloque donc pas la
  vague 2. Ne jamais exposer un daemon Docker non authentifié sur le port `2375`
  pour le contourner.
- Ne jamais exécuter `npm audit fix --force` : la correction actuellement
  proposée rétrograde Next.js vers la version 9 et casserait l’application.
  Surveiller une mise à jour compatible et faire accepter le risque avant la
  production.
- Navigateur Playwright absent : définir `PLAYWRIGHT_CHANNEL=msedge` sur
  Windows ou exécuter `npx playwright install chromium` si l’espace disque le
  permet.

## Architecture

```text
src/
├── app/                 routes, providers et Route Handlers
├── components/          UI, navigation et aperçu découverte
├── features/            frontières des futures capacités métier
├── lib/
│   ├── env/             validation des variables
│   ├── errors/          erreurs publiques
│   ├── security/        autorisation, headers, limites et redaction
│   ├── supabase/        clients navigateur/serveur/admin et proxy
│   └── validation/      schémas Zod partagés
└── types/               domaine et contrats PostgreSQL

supabase/
├── migrations/
│   ├── 0001_initial_schema.sql
│   ├── 0002_rls_policies.sql
│   ├── 0003_wave1_security_hardening.sql
│   ├── 0004_auth_session_context.sql
│   ├── 0005_wave2_onboarding_profile.sql
│   └── 0006_wave2_location_presence.sql
├── tests/
│   ├── wave1_rls_and_rpc.sql
│   ├── wave1_concurrency.sql
│   ├── wave2_auth_session.sql
│   ├── wave2_onboarding_profile.sql
│   └── wave2_location_presence.sql
├── config.toml
└── seed.sql

tests/
├── database/
├── e2e/
├── security/
├── ui/
└── unit/
```

Les décisions détaillées se trouvent dans `docs/architecture.md`,
`docs/database.md`, `docs/security.md` et `docs/design-system.md`. Le bilan
complet de la vague est dans `docs/wave-1-summary.md`.

## Sécurité

- `user_locations` n’accorde aucun accès direct au client.
- La découverte retourne uniquement une catégorie de distance.
- Les RPC sensibles sont `security definer`, fixent leur `search_path` et ont
  des droits d’exécution explicites.
- Les tables exposées activent et forcent RLS.
- Les modérateurs exigent `aal2` et une permission `app_metadata` explicite.
- Le rate limiting utilise un compteur PostgreSQL partagé et atomique, appelé
  uniquement côté serveur avec une clé HMAC opaque.
- La CSP est actuellement en mode `Report-Only` jusqu’à la propagation des
  nonces et la validation Sentry/PostHog.

## Avant le staging et la vague 3

Il reste à choisir et configurer le fournisseur SMS, le CAPTCHA et Cloudinary,
à exécuter le parcours live opt-in avec ces services, puis à valider la CSP en
mode bloquant avec les services d’observabilité retenus. Les alertes transitives
de `npm audit` dans les dépendances internes de Next.js doivent être réévaluées
dès qu’une version stable corrigée est publiée.

## Vague 2 — onboarding et profil

Le parcours authentifié `/onboarding` sauvegarde progressivement quatre étapes :
informations principales, photos, centres d’intérêt et consentement de
géolocalisation. Un parcours interrompu reprend depuis l’étape conservée en base.
La page `/profil` réutilise le même contrat pour les modifications autorisées.

Les mutations de profil passent exclusivement par les RPC de la migration
`0005_wave2_onboarding_profile.sql`. Elles utilisent `auth.uid()`, un
`search_path` vide et des droits d’exécution limités à `authenticated`. La date
de naissance est verrouillée après sa première validation et devra passer par
une procédure de vérification distincte pour être corrigée.

Les photos sont envoyées à `POST /api/photos`. Le serveur :

- limite les fichiers à 8 Mo ;
- détecte JPEG, PNG ou WebP depuis leur signature binaire ;
- refuse HEIC tant qu’aucun convertisseur serveur n’est configuré ;
- réalise un upload Cloudinary signé avec une transformation d’orientation,
  recadrage et optimisation qui ne conserve pas les métadonnées EXIF ;
- n’expose jamais `CLOUDINARY_API_SECRET` au navigateur.

Cloudinary doit être configuré uniquement dans `.env.local` :

```text
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Le test Playwright complet est opt-in afin de ne pas consommer Cloudinary et
l’OTP à chaque validation :

```powershell
$env:E2E_ONBOARDING_LIVE="true"
$env:E2E_AUTH_LIVE="true"
$env:E2E_DEVELOPMENT_OTP_CODE="000000"
$env:E2E_PROFILE_PHOTO_ONE="D:\fixtures\portrait-1.jpg"
$env:E2E_PROFILE_PHOTO_TWO="D:\fixtures\portrait-2.jpg"
npx playwright test tests/e2e/onboarding/onboarding-live.spec.ts
```

Ces scénarios sont volontairement ignorés lorsque les variables opt-in ou les
identifiants Cloudinary sont absents. Les tests Playwright par défaut utilisent
uniquement des mocks aux frontières réseau pour les erreurs OTP ; ils ne
simulent ni Supabase, ni Cloudinary à l’intérieur du code métier. La validation
live doit être exécutée avant staging avec des comptes et médias de test.

Le consentement de localisation est demandé seulement au dernier écran, après
une explication. La capture et l’enregistrement sécurisé de la position restent
du ressort du module présence/localisation de la vague 2.
