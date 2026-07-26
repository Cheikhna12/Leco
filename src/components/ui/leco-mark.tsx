import type { SVGProps } from "react";

type LecoMarkProps = SVGProps<SVGSVGElement>;

export function LecoMark({ className, ...props }: LecoMarkProps) {
  const classes = ["leco-mark", className].filter(Boolean).join(" ");

  return (
    <svg
      aria-hidden="true"
      className={classes}
      fill="none"
      focusable="false"
      viewBox="0 0 64 64"
      {...props}
    >
      <rect
        className="leco-mark__surface"
        height="56"
        rx="15"
        width="56"
        x="4"
        y="4"
      />
      <path
        className="leco-mark__route"
        d="M18 15.5v23.25C18 45.65 21.85 49.5 28.75 49.5H47"
      />
      <path className="leco-mark__signal" d="m46.5 15.5-15.25 26" />
      <circle className="leco-mark__junction" cx="31.25" cy="41.5" r="2.75" />
    </svg>
  );
}
