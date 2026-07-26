# Design system Leco

## Direction

Leco adopte une direction « Night Foundry » : graphite chaud, ivoire lumineux et
braise ponctuelle. La typographie éditoriale apporte le statut de marque tandis
que l’interface reste directe, dense et rassurante. La découverte n’est ni une
carte GPS précise ni une pile de profils à swiper : c’est un champ de proximité
volontairement abstrait.

Les portraits sont des compositions géométriques locales, sans photo distante ni
emoji. Les profils, conversations et présences affichés dans l’aperçu sont
explicitement fictifs.

## Fondations

Les tokens sémantiques sont centralisés dans `tokens.css`, chargé avant Tailwind
par `src/app/globals.css`. Les compositions de l’expérience premium vivent dans
`src/components/experience/experience.css`.

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

L’échelle d’espacement est basée sur 4 px. Les rayons, couleurs, ombres, durées
et courbes de mouvement sont consommés via des tokens, sans valeurs de thème
improvisées dans les composants.

## Typographie

- Titres : `Bodoni Moda Variable`, chargé localement.
- Interface et texte : `Jost Variable`, chargé localement.
- Corps de texte mobile : 16 px minimum.
- Micro-libellés : capitales espacées réservées aux métadonnées, jamais aux longs textes.

Les polices sont embarquées par Fontsource : aucun appel vers un service de
polices externe n’est nécessaire au rendu.

## Composants

- `Button` : variantes `primary`, `secondary`, `quiet`; taille standard ou `icon`; accepte les attributs natifs et une ref.
- `Badge` : tons `coral`, `lilac`, `neutral`, `success`.
- `Card` : surface générique composable.
- `Avatar` : portrait illustré avec initiales, tonalité et présence optionnelle.
- `StatePanel` : états vide et erreur avec région accessible.
- `LoadingState` et `Skeleton` : chargement annoncé par `aria-live`.
- `AppNavigation` : dock N5 en bas sur mobile, rail de travail sur desktop.
- `ProximityField` : scène Three.js chargée à la demande, surmontée de contrôles
  DOM accessibles et accompagnée d’un rendu CSS de secours.
- `LecoExperience` : shell partagé pour Découvrir, Ma vibe, Messages et Profil.
- `PresenceComposer` et `ProfileCard` : compositions métier visuelles sans
  persistance distante.

Les composants génériques suivent le modèle shadcn : propriétés HTML natives, `className` fusionnable, ref sur le bouton et variantes explicites. Leur logique métier reste nulle.

## Accessibilité

- Cibles tactiles de 44 × 44 px minimum.
- Focus visible de 3 px, jamais supprimé.
- Navigation principale nommée et page active annoncée avec `aria-current`.
- Icônes décoratives masquées aux technologies d’assistance.
- États d’erreur annoncés avec `role="alert"`; chargement et vide avec `role="status"`.
- Les distances sont exclusivement des catégories textuelles approximatives.
- Le système prend en charge `prefers-color-scheme`, `[data-theme="dark"]`, `[data-theme="light"]` et `prefers-reduced-motion`.
- Le canvas Three.js est décoratif (`aria-hidden`) ; les profils restent de vrais
  boutons HTML utilisables au clavier.
- Les mutations de démonstration restent locales et sont annoncées comme telles,
  afin de ne pas simuler un backend fonctionnel.

## Responsive

Le socle part de 320 px avec une seule colonne et un dock bas. À 768 px, la
navigation devient un rail latéral. Sur grand écran, une colonne de contexte
sépare les signaux persistants de la zone de travail principale.

Les contrôles tactiles gardent 44 px minimum, les libellés cliquables ne se
brisent pas sur deux lignes et `html` comme `body` utilisent
`overflow-x: clip`.

## Mouvement

Framer Motion est réservé aux fondus courts entre vues. Le champ de proximité
utilise une interpolation finie au pointeur, sans boucle décorative permanente.
Les transitions CSS sont ciblées propriété par propriété. Tout mouvement dispose
d’un mode réduit.

## Règles d’usage

1. La braise indique une action ou un état actif, pas une décoration omniprésente.
2. Le vert signale uniquement disponibilité, vérification ou confidentialité.
3. Ne jamais afficher latitude, longitude, adresse ou nombre de mètres exact.
4. Éviter les piles de cartes, le swipe et les codes visuels de Tinder.
5. Toute donnée de démonstration doit porter la mention « aperçu » ou « fictive ».
6. Préférer une microcopie française simple; les expressions locales restent ponctuelles.
7. Utiliser le système SVG Leco ; ne jamais introduire d’emoji comme icône.
