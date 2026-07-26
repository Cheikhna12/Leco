# Features

Chaque capacité métier possède ici son propre module lorsqu’elle est
implémentée : `auth`, `profiles`, `presence`, `locations`, `discovery`, `likes`,
`matches`, `messages`, `blocks`, `reports` et `moderation`.

Une feature peut importer `@/lib`, `@/types` et les composants UI génériques.
Elle ne doit pas importer les détails internes d’une autre feature. Les
interactions entre features passent par des contrats publics, des Route
Handlers ou des RPC transactionnelles.

Les dossiers ne sont créés qu’avec leur première implémentation afin d’éviter
les modules vides présentés comme terminés.
