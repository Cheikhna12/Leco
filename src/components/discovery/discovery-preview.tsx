import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshIcon, ShieldIcon, SlidersIcon } from "@/components/ui/icons";
import { StatePanel } from "@/components/ui/states";

import { PresenceComposer } from "./presence-composer";
import { ProfileCard, type DiscoveryProfile } from "./profile-card";

const previewProfiles: DiscoveryProfile[] = [
  {
    age: 24,
    distance: "Tout près",
    firstName: "Awa",
    initials: "AW",
    interests: ["Afrobeats", "Brunch", "Design"],
    mood: "On peut causer",
    note: "Partante pour un jus et une bonne conversation, sans programme compliqué.",
    tone: "coral",
  },
  {
    age: 27,
    distance: "Dans ton secteur",
    firstName: "Yann",
    initials: "YN",
    interests: ["Basket", "Cinéma", "Cuisine"],
    mood: "Sortir",
    note: "Je cherche un plan posé après le boulot. Une terrasse et on improvise.",
    tone: "apricot",
  },
  {
    age: 23,
    distance: "À moins d’1 km",
    firstName: "Mariam",
    initials: "MA",
    interests: ["Photo", "Garba", "Concerts"],
    mood: "Manger",
    note: "Une nouvelle adresse à tester et quelques photos de la ville au passage.",
    tone: "lilac",
  },
];

export function DiscoveryPreview() {
  return (
    <div className="discovery-shell">
      <header className="discovery-header">
        <div>
          <Badge className="preview-badge" tone="coral">
            Aperçu UI · données fictives
          </Badge>
          <p className="eyebrow">Dimanche, Abidjan</p>
          <h1>
            Ça bouge
            <br />
            comment ?
          </h1>
          <p className="discovery-header__intro">
            Découvre les personnes disponibles maintenant, selon leur vibe —
            jamais selon leurs coordonnées exactes.
          </p>
        </div>
        <div aria-hidden="true" className="sun-mark">
          <span />
          <strong>18</strong>
          <small>dispos</small>
        </div>
      </header>

      <PresenceComposer />

      <section
        aria-labelledby="nearby-title"
        className="nearby-section"
        id="decouvrir"
      >
        <div className="section-heading">
          <div>
            <p className="eyebrow">Maintenant autour de toi</p>
            <h2 id="nearby-title">Les vibes du moment</h2>
          </div>
          <Button
            aria-label="Filtrer les profils — aperçu"
            disabled
            size="icon"
            title="Aperçu UI"
            variant="secondary"
          >
            <SlidersIcon />
          </Button>
        </div>

        <div className="privacy-note">
          <ShieldIcon />
          <p>
            <strong>Distance approximative uniquement.</strong>
            <span>
              {" "}
              Ton adresse et ta position exacte ne sont jamais affichées.
            </span>
          </p>
        </div>

        <div className="profile-list">
          {previewProfiles.map((profile) => (
            <ProfileCard key={profile.firstName} profile={profile} />
          ))}
        </div>

        <Button
          aria-disabled="true"
          className="refresh-button"
          disabled
          variant="quiet"
        >
          <RefreshIcon />
          Rafraîchir les vibes
        </Button>
      </section>

      <details className="states-preview">
        <summary>Voir les états d’interface prévus</summary>
        <div className="states-preview__grid">
          <StatePanel
            description="Active une vibe ou élargis tes préférences pour voir du monde."
            kind="empty"
            title="C’est calme par ici"
          />
          <StatePanel
            actionLabel="Réessayer"
            description="La connexion a fait une petite pause. Tes données restent en sécurité."
            kind="error"
            title="On se retrouve juste après"
          />
        </div>
      </details>
    </div>
  );
}
