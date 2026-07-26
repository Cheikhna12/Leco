import { cn } from "@/lib/utils";

type AvatarTone = "coral" | "lilac" | "apricot";

interface AvatarProps {
  initials: string;
  label: string;
  online?: boolean;
  tone?: AvatarTone;
}

export function Avatar({
  initials,
  label,
  online = false,
  tone = "coral",
}: AvatarProps) {
  return (
    <span
      aria-label={`${label}${online ? ", disponible maintenant" : ""}`}
      className={cn("avatar", `avatar--${tone}`)}
      role="img"
    >
      <svg
        aria-hidden="true"
        className="avatar__art"
        fill="none"
        viewBox="0 0 120 140"
      >
        <path
          className="avatar__art-field"
          d="M-5 96C20 46 49 13 97-4l30 21v128H-5V96Z"
        />
        <path
          className="avatar__art-orbit"
          d="M21 121c8-51 35-85 86-105M-3 82c39-4 79 17 116 63"
        />
        <circle className="avatar__art-signal" cx="88" cy="38" r="9" />
      </svg>
      <span aria-hidden="true" className="avatar__initials">
        {initials}
      </span>
      {online ? <span aria-hidden="true" className="avatar__presence" /> : null}
    </span>
  );
}
