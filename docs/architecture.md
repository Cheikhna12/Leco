# Architecture de Leco

## Décision

Leco utilise un monolithe modulaire Next.js App Router. Les interfaces, règles
métier et accès aux données restent séparés sans introduire de services
distribués prématurément.

## Frontières

- `src/app` orchestre les routes, layouts et Route Handlers.
- `src/components` contient la présentation réutilisable.
- `src/features` regroupe chaque capacité métier et ses cas d’usage.
- `src/lib` contient les adaptateurs techniques partagés.
- `src/types` contient les contrats transversaux et les types générés.
- `supabase/migrations` est l’unique source de vérité du schéma et des règles
  RLS.
- `tests` sépare les contrôles unitaires, d’intégration, de sécurité et E2E.

Une feature peut dépendre de `lib` et `types`. `lib` ne dépend jamais d’une
feature. Les composants UI génériques ne connaissent pas Supabase.

## Flux sensible

```text
Navigateur
  -> composant ou formulaire validé
  -> Route Handler / Server Action
  -> validation Zod et autorisation
  -> RPC ou requête Supabase sous RLS
  -> réponse publique sans coordonnée ni secret
```

Les opérations de découverte, matching, blocage et modération sont effectuées
par des fonctions SQL transactionnelles ou des Route Handlers. La clé
`service_role` reste dans les modules marqués `server-only`.

## Authentification

Deux clients Supabase sont exposés : navigateur et serveur. Le proxy Next.js
16 renouvelle les cookies et valide les JWT avec `getClaims`. L’autorisation
finale appartient toujours aux Route Handlers et à PostgreSQL/RLS.

## Données et temps réel

PostgreSQL/PostGIS conserve la position exacte dans une table non lisible par
le client. Une RPC de découverte retourne uniquement une catégorie de distance.
Realtime est limité aux lignes que l’utilisateur peut déjà lire sous RLS.

## Environnements

Développement, staging et production utilisent des projets Supabase,
Cloudinary et Vercel distincts. `.env.example` documente les noms de variables ;
aucune valeur réelle n’est versionnée.

## Décisions reportées

- fournisseur SMS et paramètres CAPTCHA : vague 2 ;
- Cloudinary et politique de modération des images : vague 2 ;
- observabilité Sentry/PostHog et CI/CD : vague 4 ;
- choix du stockage distribué du rate limiting : avant l’ouverture publique.
