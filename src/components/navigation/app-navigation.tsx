import Link from "next/link";

import { ChatIcon, CompassIcon, SparkIcon, UserIcon } from "@/components/ui/icons";

const items = [
  { href: "#decouvrir", icon: CompassIcon, label: "Découvrir", active: true },
  { href: "#vibe", icon: SparkIcon, label: "Ma vibe", active: false },
  { href: "#messages", icon: ChatIcon, label: "Messages", active: false },
  { href: "#profil", icon: UserIcon, label: "Profil", active: false },
];

export function AppNavigation() {
  return (
    <nav aria-label="Navigation principale" className="app-navigation">
      <Link aria-label="Accueil Leco" className="app-navigation__brand" href="#decouvrir">
        <span aria-hidden="true">L</span>
        <strong>Leco</strong>
      </Link>
      <ul>
        {items.map(({ active, href, icon: Icon, label }) => (
          <li key={href}>
            <Link aria-current={active ? "page" : undefined} className="app-navigation__link" href={href}>
              <Icon />
              <span>{label}</span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="app-navigation__privacy">Ta position exacte reste privée.</p>
    </nav>
  );
}
