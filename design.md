# Design — Leco

Système visuel verrouillé pour l’application Leco. Chaque vue lit ce document
avant toute modification. Le produit doit paraître composé, confidentiel et
ancré à Abidjan — jamais comme une déclinaison de réseau social générique.

## Genre

Atmospheric, registre Lumen « Night Foundry » : graphite chaud, lumière ambre,
surfaces d’outil et typographie romaine.

## Macrostructure family

- Marketing pages : Marquee Hero, enrichissement limité à un artefact CSS ou SVG.
- App pages : Workbench — rail de commande, surface fonctionnelle centrale,
  panneau contextuel; variation Map / Diagram autorisée pour la proximité.
- Content pages : Long Document, typographie et règles uniquement.

## Theme

- `--color-paper` : `oklch(15% 0.012 55)`
- `--color-paper-2` : `oklch(19% 0.014 55)`
- `--color-ink` : `oklch(95% 0.014 82)`
- `--color-ink-2` : `oklch(86% 0.012 76)`
- `--color-rule` : `oklch(29% 0.014 55)`
- `--color-accent` : `oklch(72% 0.16 63)`
- `--color-focus` : `oklch(80% 0.17 65)`

Une variante claire conserve le même axe chromatique. L’accent braise occupe
moins de 5 % de chaque vue et signale uniquement présence, action ou focus.

## Typography

- Display : Bodoni Moda Variable, poids 600, style normal.
- Body : Jost Variable, poids 400.
- Outlier : Jost Variable en capitales espacées, réservé au mot-symbole et aux
  données de statut.
- Display tracking : `-0.035em`.
- Type scale anchor : `--text-display = clamp(2.7rem, 4.8vw + 1rem, 5.25rem)`.

## Spacing

Échelle nommée sur une base de 4 points, définie dans `tokens.css`. Les vues
emploient les tokens `--space-*`; aucune valeur de couleur ou police ne doit
être improvisée dans un composant.

## Motion

- Entrée : `--ease-out`, fondu avec translation maximale de 8 px.
- Sortie : `--ease-in`, 75 % de la durée d’entrée.
- Changement de vue : fondu croisé, sans glissement latéral.
- Mouvement réduit : fondu seul, 150 ms maximum.
- Trois primitives maximum : changement de vue, pression du bouton, réaction du
  champ de proximité au pointeur.

## Microinteractions stance

- Succès silencieux.
- Actions réversibles optimistes avec annulation.
- Focus immédiat et visible; aucun anneau animé.
- Cibles tactiles de 44 px minimum.
- Les survols ont un équivalent clavier et tactile.

## CTA voice

- Primaire : surface encre, trait ambre et verbe précis.
- Secondaire : transparent, règle visible, libellé court.
- Aucun libellé interactif ne passe sur deux lignes.

## Per-page allowances

- Les pages marketing peuvent employer un artefact CSS ou SVG unique.
- Les vues d’application n’emploient aucun enrichissement décoratif. La
  visualisation Three.js de proximité est autorisée uniquement comme contrôle
  fonctionnel, avec repli statique et chargement différé.
- Les pages de contenu restent typographiques.

## What pages MUST share

- Le mot-symbole Leco et son monogramme `L/`.
- L’accent ambre et son placement parcimonieux.
- Bodoni Moda + Jost.
- La voix des boutons, le rayon et le rythme vertical.
- Le dock mobile et le rail de commande desktop.
- La mention explicite des données fictives et des distances approximatives.

## What pages MAY differ on

- La proportion entre surface principale et panneau contextuel.
- La densité des listes.
- Une structure Map / Diagram sur la découverte.
- Les contrôles métier nécessaires à la vue.

## Exports

### tokens.css

La source complète est le fichier `tokens.css` à la racine. Noyau portable :

```css
:root {
  --color-paper: oklch(15% 0.012 55);
  --color-paper-2: oklch(19% 0.014 55);
  --color-paper-3: oklch(23% 0.015 55);
  --color-ink: oklch(95% 0.014 82);
  --color-ink-2: oklch(86% 0.012 76);
  --color-rule: oklch(29% 0.014 55);
  --color-rule-2: oklch(39% 0.016 55);
  --color-muted: oklch(70% 0.012 70);
  --color-accent: oklch(72% 0.16 63);
  --color-accent-ink: oklch(17% 0.016 52);
  --color-focus: oklch(80% 0.17 65);
  --font-display: "Bodoni Moda Variable", serif;
  --font-body: "Jost Variable", sans-serif;
  --space-sm: 1rem;
  --space-md: 1.5rem;
  --space-lg: 2rem;
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --dur-short: 200ms;
  --radius-card: 1.25rem;
}
```

### Tailwind v4 `@theme`

```css
@theme {
  --color-paper: oklch(15% 0.012 55);
  --color-paper-2: oklch(19% 0.014 55);
  --color-paper-3: oklch(23% 0.015 55);
  --color-ink: oklch(95% 0.014 82);
  --color-ink-2: oklch(86% 0.012 76);
  --color-rule: oklch(29% 0.014 55);
  --color-accent: oklch(72% 0.16 63);
  --color-focus: oklch(80% 0.17 65);
  --font-display: "Bodoni Moda Variable", serif;
  --font-body: "Jost Variable", sans-serif;
  --spacing-sm: 1rem;
  --spacing-md: 1.5rem;
  --spacing-lg: 2rem;
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
}
```

### DTCG `tokens.json`

```json
{
  "$schema": "https://design-tokens.github.io/community-group/format/",
  "color": {
    "paper": { "$value": "oklch(15% 0.012 55)", "$type": "color" },
    "paper-2": { "$value": "oklch(19% 0.014 55)", "$type": "color" },
    "ink": { "$value": "oklch(95% 0.014 82)", "$type": "color" },
    "accent": { "$value": "oklch(72% 0.16 63)", "$type": "color" },
    "focus": { "$value": "oklch(80% 0.17 65)", "$type": "color" }
  },
  "font": {
    "display": {
      "$value": "Bodoni Moda Variable, serif",
      "$type": "fontFamily"
    },
    "body": {
      "$value": "Jost Variable, sans-serif",
      "$type": "fontFamily"
    }
  },
  "space": {
    "sm": { "$value": "1rem", "$type": "dimension" },
    "md": { "$value": "1.5rem", "$type": "dimension" },
    "lg": { "$value": "2rem", "$type": "dimension" }
  },
  "duration": {
    "micro": { "$value": "120ms", "$type": "duration" },
    "short": { "$value": "200ms", "$type": "duration" },
    "long": { "$value": "360ms", "$type": "duration" }
  }
}
```

### shadcn/ui CSS variables

```css
:root {
  --background: 15% 0.012 55;
  --foreground: 95% 0.014 82;
  --card: 19% 0.014 55;
  --card-foreground: 95% 0.014 82;
  --popover: 19% 0.014 55;
  --popover-foreground: 95% 0.014 82;
  --primary: 72% 0.16 63;
  --primary-foreground: 17% 0.016 52;
  --secondary: 23% 0.015 55;
  --secondary-foreground: 86% 0.012 76;
  --muted: 29% 0.014 55;
  --muted-foreground: 70% 0.012 70;
  --border: 29% 0.014 55;
  --input: 29% 0.014 55;
  --ring: 80% 0.17 65;
  --radius: 1.25rem;
}
```
