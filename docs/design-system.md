# Design system Leco

## Direction

Leco adopte une direction « Night Foundry » : graphite chaud, ivoire lumineux
et braise ponctuelle. La typographie éditoriale apporte le statut de marque
tandis que l’interface reste directe, dense et rassurante.

Les surfaces actuellement livrées correspondent exclusivement aux parcours
réels : authentification, onboarding, profil, localisation et présence. Aucun
profil, message, compteur ou état utilisateur fictif ne doit être rendu dans
l’application.

## Fondations

Les tokens sémantiques sont centralisés dans `tokens.css`, chargé avant
Tailwind par `src/app/globals.css`. Les styles métier restent colocalisés avec
leurs parcours ou composants.

| Rôle              | Token principal      | Usage                            |
| ----------------- | -------------------- | -------------------------------- |
| Fond              | `--color-paper`      | Toile graphite ou ivoire chaud   |
| Surface           | `--color-paper-2`    | Panneaux de travail              |
| Texte             | `--color-ink`        | Texte principal                  |
| Texte secondaire  | `--color-muted`      | Métadonnées                      |
| Action            | `--color-accent`     | Action primaire et état actif    |
| Texte sur action  | `--color-accent-ink` | Contraste des boutons braise     |
| Succès / présence | `--color-success`    | Présence et confidentialité      |
| Focus             | `--color-focus`      | Anneau clavier à contraste élevé |

L’échelle d’espacement est basée sur 4 px. Les rayons, couleurs, ombres,
durées et courbes de mouvement sont consommés via des tokens.

## Typographie

- Titres : `Bodoni Moda Variable`, chargé localement.
- Interface et texte : `Jost Variable`, chargé localement.
- Corps de texte mobile : 16 px minimum.
- Micro-libellés : capitales espacées réservées aux métadonnées.

Les polices sont embarquées par Fontsource : aucun appel vers un service
externe n’est nécessaire au rendu.

## Composants

- `Button` : variantes `primary`, `secondary`, `quiet`.
- `Badge` : tons `coral`, `lilac`, `neutral`, `success`.
- `Card` : surface générique composable.
- `Avatar` : représentation contrôlée par les vraies données du profil.
- `StatePanel` : états vide et erreur accessibles.
- `LoadingState` et `Skeleton` : chargement annoncé par `aria-live`.
- `OnboardingFlow` : édition persistée du profil, des photos et intérêts.
- `PresenceControl` : localisation consentie et présence persistée.

Les composants génériques acceptent les propriétés HTML natives. Les données
métier proviennent des routes API et de Supabase.

## Accessibilité

- Cibles tactiles de 44 × 44 px minimum.
- Focus visible, jamais supprimé.
- Icônes décoratives masquées aux technologies d’assistance.
- Erreurs annoncées avec `role="alert"`.
- Chargements et états vides annoncés avec `role="status"`.
- Aucune latitude, longitude, adresse ou distance exacte affichée.
- Prise en charge de `prefers-color-scheme` et `prefers-reduced-motion`.

## Responsive

Le socle part de 320 px en une seule colonne. Les compositions s’élargissent
progressivement sans réduire les cibles tactiles ni exposer de données
supplémentaires sur grand écran.

## Règles d’usage

1. La braise indique une action ou un état actif.
2. Le vert signale uniquement disponibilité, vérification ou confidentialité.
3. Ne jamais afficher latitude, longitude, adresse ou nombre de mètres exact.
4. Éviter les piles de cartes et les codes visuels de Tinder.
5. Ne jamais introduire de donnée fictive dans une route de l’application.
6. Utiliser une microcopie française simple.
7. Utiliser le système SVG Leco ; ne jamais introduire d’emoji comme icône.
