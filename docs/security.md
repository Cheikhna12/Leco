# Sécurité — Leco

Ce document décrit le socle de sécurité de la vague 1. Il ne remplace ni une
revue de menaces avant mise en production, ni les contrôles applicatifs des
Route Handlers.

## Frontières de confiance

- Le navigateur utilise uniquement `NEXT_PUBLIC_SUPABASE_URL` et la clé
  publique/anon Supabase. `SUPABASE_SERVICE_ROLE_KEY` ne doit être importée que
  par des modules serveur.
- Le rôle applicatif doit venir de `auth.users.raw_app_meta_data`, jamais de
  `raw_user_meta_data` ni d’un champ envoyé par le navigateur.
- Les opérations sensibles passent par un Route Handler authentifié et validé,
  ou par une RPC `security definer` étroitement auditée. `0001` fournit
  `update_my_location`, `activate_presence`, `heartbeat_presence`,
  `deactivate_presence`, `get_nearby_profiles` et `send_hello`. Message,
  blocage, signalement, suppression de compte et toute action de modération
  restent réservés aux Route Handlers tant qu’une RPC équivalente n’est pas
  auditée.
- Un Route Handler utilisant `service_role` doit refaire l’authentification,
  l’autorisation, la validation, le rate limit et l’audit. La clé contourne RLS :
  RLS n’est alors pas un contrôle suffisant.
- Une fonction SQL `security definer` fixe toujours son `search_path`, qualifie
  les objets et n’est exécutable que par les rôles explicitement prévus.

## Hypothèses d’intégration avec `0001`

La migration `0002_rls_policies.sql` dépend des objets suivants. Tout écart de
nom dans `0001` doit être harmonisé avant application :

| Table                | Colonnes utilisées par les politiques                                                                        |
| -------------------- | ------------------------------------------------------------------------------------------------------------ |
| `profiles`           | `id`, `account_status`, `is_discoverable`, `is_profile_complete`, `suspended_until`, `deletion_requested_at` |
| `profile_photos`     | `profile_id`, `deleted_at`                                                                                   |
| `interests`          | `is_active`                                                                                                  |
| `user_interests`     | `user_id`                                                                                                    |
| `user_locations`     | aucune colonne n’est exposée directement                                                                     |
| `user_presence`      | `user_id`, `availability_status`, `available_until`, `last_heartbeat_at`                                     |
| `likes`              | `sender_id`, `recipient_id`                                                                                  |
| `matches`            | `user_low_id`, `user_high_id`, `status`                                                                      |
| `messages`           | `match_id`, `sender_id`                                                                                      |
| `blocks`             | `blocker_id`, `blocked_id`                                                                                   |
| `reports`            | `reporter_id`                                                                                                |
| `moderation_actions` | `moderator_id`                                                                                               |
| `audit_logs`         | `actor_id`                                                                                                   |

Les valeurs attendues sont `active` pour un compte utilisable, `available` pour
une présence visible et `active` pour un match utilisable. Les identifiants
utilisateur sont des UUID référant `auth.users(id)`. Les politiques supposent
que le numéro de téléphone reste exclusivement dans `auth.users` et qu’aucune
coordonnée n’est copiée dans `profiles` ou `user_presence`.

RLS filtre des lignes, pas des colonnes. Si `profiles` contient plus tard des
champs privés (date de naissance complète, téléphone, paramètres internes), ils
ne doivent pas être accordés en lecture globale. Exposer à la place une vue à
invocateur (`security_invoker = true`) ne contenant que les champs publics, et
servir les données privées du propriétaire via une route dédiée.

## Modèle RLS

- Toutes les tables métier ont RLS activé et forcé.
- `anon` n’a aucun accès aux tables métier.
- `user_locations` n’a aucun privilège direct pour `authenticated`, y compris
  sur sa propre ligne. L’enregistrement et la suppression passent par les RPC
  dédiées ; seule `get_nearby_profiles` retourne une catégorie de distance
  approximative.
- Un profil visible est complet, non suspendu, non désactivé et sans blocage
  dans aucun sens. Le propriétaire peut toujours lire sa propre ligne.
- Photos, intérêts et présence reprennent la visibilité du profil. Une présence
  tierce doit en plus être disponible, non expirée et avoir un heartbeat datant
  de moins de cinq minutes.
- Un utilisateur ne lit que les likes qu’il a envoyés. Les écritures directes
  sont retirées afin d’empêcher de contourner les limites (5/heure, limite
  quotidienne, absence de relance, blocages) et la création transactionnelle du
  match.
- Un membre lit ses matchs/messages uniquement s’il n’existe aucun blocage.
  Les envois passent par une route serveur, qui vérifie aussi le statut du match,
  la suspension, le format texte/emoji, la taille et l’anti-spam.
- Un bloqueur peut relire les blocs qu’il a créés. Un utilisateur bloqué ne voit
  pas qui l’a bloqué.
- Un auteur de signalement peut relire son signalement, sans voir la décision
  interne. Si cette décision est stockée sur la même table, une vue publique
  restreinte est requise avant d’accorder la lecture directe.
- Les données de modération et d’audit sont lisibles uniquement par un
  administrateur en `aal2`. Toutes les écritures passent par une route serveur.

Le rôle `service_role` n’apparaît volontairement dans aucune politique : il
contourne RLS nativement et ne doit jamais atteindre le client.

## Admin et MFA

`private.current_user_is_admin_mfa()` vérifie simultanément :

1. `app_metadata.role = admin`, donnée contrôlée par le serveur ;
2. le niveau d’assurance Supabase `aal2`.

Chaque Route Handler `/admin/**` doit aussi appeler `requireAdminMfa()` après
avoir construit l’identité depuis une session Supabase vérifiée. Les décisions
administratives écrivent un `moderation_actions` et un `audit_logs` dans la même
transaction. Ne pas logger la preuve complète ni le contenu complet d’un chat.

## Headers, CORS et sessions

`src/lib/security/headers.ts` fournit une CSP restrictive et les autres headers.
L’architecte doit l’intégrer dans un middleware/une configuration Next.js. Un
nonce base64url imprévisible par réponse est recommandé pour les scripts. Après
intégration, vérifier les routes Next.js et les scripts de monitoring en mode
`Content-Security-Policy-Report-Only`, puis resserrer explicitement les domaines
nécessaires avant activation bloquante.

La liste CORS doit contenir des origines exactes par environnement. Ne jamais
réfléchir arbitrairement l’en-tête `Origin`. Les cookies applicatifs éventuels
utilisent `HttpOnly`, `Secure` en production, `SameSite=Lax` ou `Strict`, un
chemin minimal et aucune donnée d’authentification lisible en JavaScript.

## Validation, taille et rate limiting

Toutes les entrées sont validées côté serveur avec Zod. Les helpers de
`validation.ts` acceptent directement un schéma Zod via son interface
`safeParse`. Vérifier à la fois `Content-Length` et la taille réellement lue :
un client peut omettre ou falsifier le header.

`RateLimitStore` est une interface, pas une implémentation en mémoire. Son
adaptateur de production doit effectuer `consume` atomiquement dans un stockage
durable partagé (Redis ou PostgreSQL). En particulier :

- OTP : téléphone HMAC + IP, fenêtres courte et quotidienne, réponse constante
  anti-énumération, CAPTCHA après signal anormal ;
- « Dire bonjour » : utilisateur, 5/heure, limite quotidienne configurable ;
- messages : utilisateur + match, détection des duplications en masse ;
- signalements et uploads : limites utilisateur et IP.

Les téléphones et IP sont transformés avec
`createPrivateRateLimitKey(namespace, identifier, secret)` avant stockage. Le
secret HMAC doit être distinct par environnement, conservé côté serveur et
rotatable.

## Journalisation et données personnelles

`redactForLogs` retire les clés et motifs sensibles avant émission. Il s’agit
d’une défense supplémentaire : les appelants doivent d’abord construire des
événements minimaux. Ne jamais envoyer aux logs, Sentry ou PostHog :

- OTP, JWT complet, cookies, secrets et clés ;
- numéro complet ou identifiant publicitaire brut ;
- latitude, longitude, adresse ou géométrie PostGIS ;
- contenu complet des conversations ou pièces de signalement.

Les `user_locations` expirées doivent être supprimées par un job planifié avec
un compte serveur minimal. Aucun historique de mouvement ne doit être créé.
Définir avant production les durées de conservation des signalements, preuves,
audits et comptes supprimés conformément au droit applicable en Côte d’Ivoire.

## Vérifications avant la vague 2

1. Aligner les noms/valeurs de `0001` sur les hypothèses ci-dessus.
2. Appliquer les migrations sur une base Supabase locale propre.
3. Tester au minimum deux utilisateurs, un blocage dans chaque sens, un
   administrateur `aal1`, puis `aal2`.
4. Vérifier via PostgREST que `user_locations` ne retourne jamais de ligne et
   qu’aucune mutation sensible directe n’est possible avec une clé anon/auth.
5. Ajouter l’adaptateur de rate limiting durable et tester sa consommation
   atomique sous concurrence.
6. Tester la CSP en Report-Only, le retrait EXIF Cloudinary et la rotation des
   secrets.
