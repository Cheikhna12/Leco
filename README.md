# Leco

Leco est une application web mobile-first de découverte sociale spontanée et
sécurisée à Abidjan. Elle permet de découvrir les personnes disponibles
maintenant selon leur humeur, sans exposer leur position exacte.

## État du projet

La vague 1 est terminée :

- socle Next.js App Router, TypeScript strict et Tailwind CSS ;
- clients Supabase navigateur, serveur et administrateur ;
- schéma PostgreSQL/PostGIS, migrations et seed ;
- politiques RLS de moindre privilège ;
- design system mobile-first et aperçu de découverte ;
- helpers de sécurité, validation, redaction et rate limiting ;
- 63 tests unitaires et statiques ;
- build de production validé.

L’interface présente actuellement des données fictives clairement signalées.
L’authentification, l’onboarding et la présence réelle commencent en vague 2.

## Démarrage

Prérequis : Node.js 20.19 ou supérieur et npm.

```powershell
Copy-Item .env.example .env.local
npm install
npm run dev
```

L’application est ensuite disponible sur `http://localhost:3000`. L’aperçu UI
fonctionne sans projet Supabase configuré.

## Commandes

```text
npm run dev             Serveur local
npm run build           Build de production
npm run typecheck       TypeScript strict
npm run lint            ESLint
npm run test            Suite Vitest complète
npm run test:database   Contrôles statiques SQL/PostGIS
npm run test:security   Tests sécurité et RLS
npm run test:ui         Tests des fondations UI
npm run check           TypeScript + ESLint + tests
npm run format:check    Vérification Prettier
```

Avec Docker Desktop actif et suffisamment d’espace disque :

```text
npm run db:start
npm run db:reset
npm run db:lint
npm run db:stop
```

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
│   └── 0002_rls_policies.sql
├── config.toml
└── seed.sql

tests/
├── database/
├── security/
├── ui/
└── unit/
```

Les décisions détaillées se trouvent dans `docs/architecture.md`,
`docs/database.md`, `docs/security.md` et `docs/design-system.md`. Le bilan
complet de la vague est dans `docs/wave-1-summary.md`.

## Variables d’environnement

Copier `.env.example` vers `.env.local` et renseigner uniquement les services
utilisés. Ne jamais committer `.env.local`.

La clé `SUPABASE_SERVICE_ROLE_KEY`, les secrets Cloudinary, SMS, CAPTCHA et le
secret HMAC de rate limiting sont exclusivement côté serveur. Le navigateur ne
reçoit que les variables préfixées par `NEXT_PUBLIC_`.

## Sécurité

- `user_locations` n’accorde aucun accès direct au client.
- La découverte retourne uniquement une catégorie de distance.
- Les RPC sensibles sont `security definer`, fixent leur `search_path` et ont
  des droits d’exécution explicites.
- Les tables exposées activent et forcent RLS.
- La CSP est actuellement en mode `Report-Only` jusqu’à la propagation des
  nonces et la validation Sentry/PostHog.
- Un stockage durable et atomique doit implémenter `RateLimitStore` avant
  ouverture au public.

## Avant la vague 2

Les migrations doivent encore être appliquées à une vraie base locale avec
`db:reset` et `db:lint`. Cette validation a été différée parce que le disque
système manque actuellement d’espace pour les images Docker.

Il faut également créer les projets Supabase/Cloudinary de développement,
choisir le fournisseur SMS et CAPTCHA, configurer le stockage de rate limiting,
et traiter les alertes transitives signalées par `npm audit` dès qu’une version
stable corrigée de Next.js est disponible.
