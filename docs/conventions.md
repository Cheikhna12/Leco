# Conventions de contribution

## TypeScript et modules

- TypeScript strict ; aucun `any` non justifié.
- Imports internes via l’alias `@/`.
- Un fichier garde une responsabilité principale.
- Les erreurs publiques passent par `AppError` et ne contiennent aucun détail
  d’infrastructure.

## Sécurité

- Toute entrée externe est validée côté serveur.
- Une session seule ne vaut pas autorisation.
- Aucun log ne contient OTP, JWT complet, téléphone complet, GPS, secret ou
  conversation complète.
- Les coordonnées d’un autre utilisateur ne traversent jamais l’API.

## Tests

- `tests/unit` : fonctions pures et composants isolés.
- `tests/integration` : Route Handlers, RPC et adaptateurs.
- `tests/security` : RLS, redaction et abus.
- `tests/e2e` : parcours utilisateurs depuis un navigateur.

## Git

Les commits suivent Conventional Commits, par exemple
`feat(location): add approximate distance bands`. Une branche n’est intégrée
que si typecheck, ESLint et les tests concernés passent.
