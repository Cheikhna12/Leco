import {
  ChatIcon,
  RadarIcon,
  SparkIcon,
  ThemeIcon,
  UserIcon,
} from "@/components/ui/icons";
import { LecoMark } from "@/components/ui/leco-mark";

export type AppView = "discover" | "vibe" | "messages" | "profile";

const items = [
  { icon: RadarIcon, id: "discover" as const, label: "Découvrir" },
  { icon: SparkIcon, id: "vibe" as const, label: "Ma vibe" },
  { icon: ChatIcon, id: "messages" as const, label: "Messages" },
  { icon: UserIcon, id: "profile" as const, label: "Profil" },
] satisfies { icon: typeof RadarIcon; id: AppView; label: string }[];

interface AppNavigationProps {
  activeView?: AppView;
  onNavigate?: (view: AppView) => void;
  onThemeToggle?: () => void;
}

export function AppNavigation({
  activeView = "discover",
  onNavigate,
  onThemeToggle,
}: AppNavigationProps = {}) {
  return (
    <nav aria-label="Navigation principale" className="app-navigation">
      <button
        aria-label="Accueil Leco"
        className="app-navigation__brand"
        onClick={() => onNavigate?.("discover")}
        type="button"
      >
        <span aria-hidden="true" className="app-navigation__mark">
          <LecoMark />
        </span>
        <strong>Leco</strong>
        <small>Abidjan</small>
      </button>
      <ul>
        {items.map(({ icon: Icon, id, label }) => (
          <li key={id}>
            <button
              aria-current={activeView === id ? "page" : undefined}
              className="app-navigation__link"
              onClick={() => onNavigate?.(id)}
              type="button"
            >
              <Icon />
              <span>{label}</span>
              {id === "messages" ? (
                <span
                  aria-label="2 messages non lus"
                  className="app-navigation__count"
                >
                  2
                </span>
              ) : null}
            </button>
          </li>
        ))}
      </ul>
      <div className="app-navigation__utility">
        <button
          aria-label="Changer de thème"
          className="app-navigation__theme"
          onClick={onThemeToggle}
          type="button"
        >
          <ThemeIcon />
          <span>Thème</span>
        </button>
        <p className="app-navigation__privacy">
          Ta position exacte reste privée.
        </p>
      </div>
    </nav>
  );
}
