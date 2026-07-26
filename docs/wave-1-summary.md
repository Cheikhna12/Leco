# Bilan de la vague 1

## Livrables

### Architecture

- Next.js App Router, React, TypeScript strict et Tailwind CSS.
- Séparation `app` / `components` / `features` / `lib` / `types`.
- TanStack Query fourni au niveau du layout.
- Clients Supabase SSR conformes à Next.js 16 et proxy de renouvellement des
  sessions fondé sur `getClaims`.
- Erreurs publiques et validations de profil partagées.

### Base de données

La migration `0001_initial_schema.sql` crée :

- `profiles`, `profile_photos`, `interests`, `user_interests` ;
- `user_locations`, `user_presence` ;
- `likes`, `matches`, `messages`, `blocks` ;
- `reports`, `moderation_actions`, `audit_logs` ;
- `private.app_settings`.

La position est une `GEOGRAPHY(POINT, 4326)` indexée par GiST. Les RPC couvrent
la mise à jour de position, l’activation et le heartbeat, la désactivation, la
découverte approximative, `send_hello` atomique et l’expiration des présences.
La base ne conserve aucun historique de déplacement.

### Sécurité

La migration `0002_rls_policies.sql` retire les privilèges implicites et ajoute
les politiques de lecture strictement nécessaires. `user_locations` n’a aucune
politique ni aucun grant client. Les matchs/messages respectent les blocages ;
la modération exige un rôle administrateur et le niveau MFA `aal2`.

Les helpers applicatifs couvrent :

- autorisation utilisateur et administrateur MFA ;
- CSP, permissions navigateur et CORS par origine exacte ;
- validation et limites de taille ;
- clés privées HMAC pour le rate limiting ;
- redaction défensive des logs.

### Design system

Direction « salon ouvert d’Abidjan » : structure scandinave chaleureuse, ivoire,
corail, prune et lilas ponctuel. Le système fournit thèmes clair/sombre, motion
réduite, focus visible, cibles tactiles de 44 px, navigation mobile/desktop,
cartes de présence et états loading/empty/error.

L’aperçu ne simule aucun backend : ses données fictives sont indiquées dans
l’interface et les actions sont volontairement désactivées.

## Variables préparées

Voir `.env.example` pour Supabase, Cloudinary, Sentry, PostHog, SMS, CAPTCHA et
le secret HMAC de rate limiting. Aucune valeur secrète n’est versionnée.

## Validation effectuée

```text
TypeScript strict        réussi
ESLint                   réussi
Prettier                 réussi
Vitest                   63/63 tests
Next.js production build réussi
Revue visuelle           mobile clair/sombre + desktop
```

## Risques et prérequis avant la vague 2

1. Exécuter `supabase db reset` puis `supabase db lint` sur PostgreSQL local.
   Docker n’a pas été démarré afin de ne pas saturer le disque C: presque plein.
2. Créer les projets Supabase et Cloudinary de développement et renseigner
   `.env.local`.
3. Choisir le fournisseur SMS, le CAPTCHA et le stockage durable/atomique du
   rate limiting.
4. Tester la CSP en Report-Only avec les services d’observabilité, propager des
   nonces, puis passer en mode bloquant.
5. Installer les navigateurs Playwright et écrire les parcours E2E à mesure que
   les écrans réels remplacent l’aperçu.
6. Suivre les trois alertes `npm audit` transitives au Next.js stable courant
   (`postcss` et `sharp`) et mettre à niveau dès publication d’une version
   corrigée compatible.

## Dépendances de la vague 2

- Auth/OTP dépend du projet Supabase et du fournisseur SMS.
- Onboarding/photos dépend de Cloudinary et des tables profils/intérêts.
- Géolocalisation/présence dépend des RPC de `0001` et des politiques de `0002`.
- Toute Route Handler sensible dépend des helpers d’autorisation, validation,
  redaction et du futur adaptateur durable de rate limiting.
