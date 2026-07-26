# Design system Leco

## Direction

Le concept « salon ouvert d’Abidjan » associe la lisibilité scandinave à une chaleur locale discrète. L’ivoire donne de l’air, le corail signale l’action, le prune remplace le noir pur et le lilas reste un accent ponctuel. La découverte est une liste de présences contextualisées, jamais une pile de cartes à swiper.

Les portraits de démonstration sont abstraits et autonomes afin de ne pas introduire de dépendance à des photos distantes. Les noms et contenus de la page d’accueil sont explicitement fictifs.

## Fondations

Les tokens sont définis dans `src/components/ui/foundations.css`, puis chargés par `src/app/globals.css`. Les styles de composition sont séparés entre découverte et navigation afin de garder chaque feuille focalisée.

| Rôle | Token principal | Usage |
| --- | --- | --- |
| Fond | `--background` | Toile ivoire ou charbon chaud |
| Surface | `--surface-raised` | Cartes et navigation |
| Texte | `--foreground` | Prune sombre ou ivoire |
| Texte secondaire | `--foreground-soft` | Métadonnées |
| Action | `--accent` | CTA et disponibilité |
| Succès / présence | `--success` | Présence et confidentialité |
| Bordure | `--border` | Séparation douce |
| Focus | `--focus` | Anneau clavier à contraste élevé |

L’échelle d’espacement est basée sur 4 px. Les rayons `sm`, `md`, `lg` et `pill` ne doivent pas être redéfinis dans les composants.

## Typographie

- Titres : pile éditoriale `Iowan Old Style`, `Palatino Linotype`, `Book Antiqua`, Georgia.
- Interface et texte : `Avenir Next`, `Nunito Sans`, puis `Segoe UI`.
- Corps de texte mobile : 16 px minimum.
- Micro-libellés : capitales espacées réservées aux métadonnées, jamais aux longs textes.

Ces piles évitent tout téléchargement bloquant et gardent une personnalité chaleureuse même lorsque les premiers choix ne sont pas installés.

## Composants

- `Button` : variantes `primary`, `secondary`, `quiet`; taille standard ou `icon`; accepte les attributs natifs et une ref.
- `Badge` : tons `coral`, `lilac`, `neutral`, `success`.
- `Card` : surface générique composable.
- `Avatar` : portrait illustré avec initiales, tonalité et présence optionnelle.
- `StatePanel` : états vide et erreur avec région accessible.
- `LoadingState` et `Skeleton` : chargement annoncé par `aria-live`.
- `AppNavigation` : barre inférieure sur mobile, rail latéral dès 768 px.
- `PresenceComposer` et `ProfileCard` : compositions métier visuelles sans logique de données.

Les composants génériques suivent le modèle shadcn : propriétés HTML natives, `className` fusionnable, ref sur le bouton et variantes explicites. Leur logique métier reste nulle.

## Accessibilité

- Cibles tactiles de 44 × 44 px minimum.
- Focus visible de 3 px, jamais supprimé.
- Navigation principale nommée et page active annoncée avec `aria-current`.
- Icônes décoratives masquées aux technologies d’assistance.
- États d’erreur annoncés avec `role="alert"`; chargement et vide avec `role="status"`.
- Les distances sont exclusivement des catégories textuelles approximatives.
- Le système prend en charge `prefers-color-scheme`, `[data-theme="dark"]`, `[data-theme="light"]` et `prefers-reduced-motion`.
- Les contrôles de la démonstration sont désactivés et nommés comme aperçus afin de ne pas simuler un backend fonctionnel.

## Responsive

Le socle part de 320–375 px avec une seule colonne et une navigation basse. À 480 px, la marque solaire et des portraits plus larges apparaissent. À 768 px, la navigation devient un rail latéral. À 1088 px, la liste se compose sur deux colonnes tout en gardant le premier profil prioritaire.

Les textes courants restent limités à environ 45–75 caractères par ligne.

## Mouvement

Le mouvement est fonctionnel : pression légère des boutons, élévation douce des profils et respiration du skeleton. Toutes les durées sont neutralisées en préférence de mouvement réduit. Framer Motion n’est pas requis pour ces fondations; il pourra être réservé aux transitions de présence lorsque les interactions réelles seront intégrées.

## Règles d’usage

1. Le corail indique une action ou un état actif, pas une décoration omniprésente.
2. Le lilas ne concurrence jamais le CTA.
3. Ne jamais afficher latitude, longitude, adresse ou nombre de mètres exact.
4. Éviter les piles de cartes, le swipe et les codes visuels de Tinder.
5. Toute donnée de démonstration doit porter la mention « aperçu » ou « fictive ».
6. Préférer une microcopie française simple; les expressions locales restent ponctuelles.
