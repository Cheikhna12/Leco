import { useId } from "react";

type LocationOrbIllustrationProps = {
  className?: string;
};

/**
 * Illustration 2.5D propre à Leco.
 *
 * Les couches évoquent un secteur approximatif plutôt qu'un point GPS :
 * l'illustration accompagne le message de confidentialité sans afficher ni
 * encoder de coordonnées.
 */
export function LocationOrbIllustration({
  className,
}: LocationOrbIllustrationProps) {
  const id = useId().replaceAll(":", "");
  const surface = `leco-surface-${id}`;
  const beacon = `leco-beacon-${id}`;
  const glow = `leco-glow-${id}`;
  const shadow = `leco-shadow-${id}`;

  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      focusable="false"
      viewBox="0 0 260 220"
    >
      <defs>
        <linearGradient id={surface} x1="76" x2="195" y1="59" y2="183">
          <stop stopColor="var(--illustration-surface-top, #fff5df)" />
          <stop
            offset="1"
            stopColor="var(--illustration-surface-side, #e9b58d)"
          />
        </linearGradient>
        <linearGradient id={beacon} x1="113" x2="151" y1="71" y2="145">
          <stop stopColor="var(--illustration-accent-top, #ff8f70)" />
          <stop
            offset="1"
            stopColor="var(--illustration-accent-side, #b6434b)"
          />
        </linearGradient>
        <radialGradient id={glow}>
          <stop
            stopColor="var(--illustration-glow, #f0a24c)"
            stopOpacity=".5"
          />
          <stop
            offset="1"
            stopColor="var(--illustration-glow, #f0a24c)"
            stopOpacity="0"
          />
        </radialGradient>
        <filter id={shadow} x="-30%" y="-30%" width="160%" height="180%">
          <feDropShadow
            dx="0"
            dy="14"
            floodColor="var(--illustration-shadow, #522a28)"
            floodOpacity=".2"
            stdDeviation="12"
          />
        </filter>
      </defs>

      <ellipse cx="130" cy="183" fill={`url(#${glow})`} rx="104" ry="29" />
      <g filter={`url(#${shadow})`}>
        <path d="m36 125 94-54 94 54-94 55-94-55Z" fill={`url(#${surface})`} />
        <path
          d="m36 125 94 55v23l-94-55v-23Z"
          fill="var(--illustration-surface-left, #d59473)"
        />
        <path
          d="m224 125-94 55v23l94-55v-23Z"
          fill="var(--illustration-surface-right, #bd735f)"
        />
      </g>

      <path
        d="m70 126 60-35 60 35-60 35-60-35Z"
        stroke="var(--illustration-line, #6e3941)"
        strokeDasharray="5 7"
        strokeOpacity=".42"
        strokeWidth="2"
      />
      <path
        d="m92 126 38-22 38 22-38 22-38-22Z"
        fill="var(--illustration-zone, #ffd7c5)"
        opacity=".8"
      />

      <path
        d="M130 42c-22 0-39 17-39 39 0 31 39 66 39 66s39-35 39-66c0-22-17-39-39-39Z"
        fill={`url(#${beacon})`}
      />
      <ellipse
        cx="130"
        cy="81"
        fill="var(--illustration-core, #fff8ea)"
        rx="14"
        ry="16"
      />
      <path
        d="M130 31v-12M92 46l-9-10M168 46l9-10"
        stroke="var(--illustration-line, #6e3941)"
        strokeLinecap="round"
        strokeWidth="3"
      />

      <g fill="var(--illustration-detail, #6e3941)" opacity=".75">
        <circle cx="60" cy="104" r="4" />
        <circle cx="200" cy="111" r="3" />
        <circle cx="185" cy="151" r="4" />
      </g>
    </svg>
  );
}
