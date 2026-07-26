"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshIcon, SlidersIcon } from "@/components/ui/icons";
import { StatePanel } from "@/components/ui/states";

import { PresenceComposer } from "./presence-composer";
import { ProfileCard, type DiscoveryProfile } from "./profile-card";
import { ProximityField } from "./proximity-field";

const previewProfiles: DiscoveryProfile[] = [
  {
    age: 24,
    distance: "Tout près",
    firstName: "Awa",
    id: "awa",
    initials: "AW",
    interests: ["Afrobeats", "Brunch", "Design"],
    mood: "On peut causer",
    note: "Un jus, une terrasse et une conversation sans programme compliqué.",
    tone: "coral",
  },
  {
    age: 27,
    distance: "Dans ton secteur",
    firstName: "Yann",
    id: "yann",
    initials: "YN",
    interests: ["Basket", "Cinéma", "Cuisine"],
    mood: "Sortir",
    note: "Après le boulot : une terrasse calme, puis on improvise.",
    tone: "apricot",
  },
  {
    age: 23,
    distance: "À moins d’un km",
    firstName: "Mariam",
    id: "mariam",
    initials: "MA",
    interests: ["Photo", "Garba", "Concerts"],
    mood: "Manger",
    note: "Une nouvelle adresse à tester, appareil photo à portée de main.",
    tone: "lilac",
  },
];

export function DiscoveryPreview({
  onOpenVibe,
}: {
  onOpenVibe?: () => void;
} = {}) {
  const [selectedId, setSelectedId] = useState(previewProfiles[0].id);
  const selectedProfile =
    previewProfiles.find((profile) => profile.id === selectedId) ??
    previewProfiles[0];

  return (
    <section
      aria-label="Découverte"
      className="app-surface app-surface--discover"
    >
      <div className="surface-meta">
        <Badge tone="coral">Aperçu UI · données fictives</Badge>
        <span>Dimanche soir · Abidjan</span>
      </div>

      <PresenceComposer onOpenVibe={onOpenVibe} />

      <div className="discovery-workbench">
        <ProximityField
          onSelect={setSelectedId}
          selectedId={selectedProfile.id}
        />
        <aside aria-label="Profil sélectionné" className="profile-focus">
          <div className="profile-focus__heading">
            <span className="surface-label">Sélection</span>
            <p>Une présence, le contexte utile, rien de plus.</p>
          </div>
          <ProfileCard featured profile={selectedProfile} selected />
          <p className="profile-focus__privacy">
            Le bonjour ouvre une demande privée. Aucun message n’est envoyé sans
            ton geste.
          </p>
        </aside>
      </div>

      <section aria-labelledby="nearby-title" className="nearby-section">
        <div className="section-heading">
          <div>
            <h2 id="nearby-title">Présences à proximité</h2>
            <p>Triées par disponibilité, jamais par coordonnées exactes.</p>
          </div>
          <Button
            aria-label="Filtrer les présences — aperçu"
            disabled
            size="icon"
            title="Aperçu UI"
            variant="secondary"
          >
            <SlidersIcon />
          </Button>
        </div>

        <div className="profile-list">
          {previewProfiles.map((profile) => (
            <ProfileCard
              compact
              key={profile.id}
              onSelect={() => setSelectedId(profile.id)}
              profile={profile}
              selected={profile.id === selectedProfile.id}
            />
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
        <summary>États de service prévus</summary>
        <div className="states-preview__grid">
          <StatePanel
            description="Active une vibe ou élargis tes préférences pour voir du monde."
            kind="empty"
            title="Aucune présence disponible"
          />
          <StatePanel
            actionLabel="Réessayer"
            description="La connexion a été interrompue. Réessaie; tes données restent privées."
            kind="error"
            title="La mise à jour n’a pas abouti"
          />
        </div>
      </details>
    </section>
  );
}
