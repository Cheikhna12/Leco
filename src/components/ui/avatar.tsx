import { cn } from "@/lib/utils";

type AvatarTone = "coral" | "lilac" | "apricot";

interface AvatarProps {
  initials: string;
  label: string;
  online?: boolean;
  tone?: AvatarTone;
}

export function Avatar({ initials, label, online = false, tone = "coral" }: AvatarProps) {
  return (
    <span
      aria-label={`${label}${online ? ", disponible maintenant" : ""}`}
      className={cn("avatar", `avatar--${tone}`)}
      role="img"
    >
      <span aria-hidden="true" className="avatar__halo" />
      <span aria-hidden="true" className="avatar__initials">
        {initials}
      </span>
      {online ? <span aria-hidden="true" className="avatar__presence" /> : null}
    </span>
  );
}
