import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SparkIcon } from "@/components/ui/icons";

const moods = ["On peut causer", "Sortir", "Manger", "Plan tranquille"];

export function PresenceComposer() {
  return (
    <Card className="presence-card" id="vibe">
      <div className="presence-card__topline">
        <span className="presence-card__icon">
          <SparkIcon />
        </span>
        <div>
          <p className="eyebrow">Présence temporaire</p>
          <h2>J’active ma vibe</h2>
        </div>
        <label className="presence-switch">
          <span className="sr-only">Activer ma disponibilité</span>
          <input aria-describedby="presence-preview-note" disabled type="checkbox" />
          <span aria-hidden="true" />
        </label>
      </div>
      <p className="presence-card__prompt">Tu es dans quel mood ?</p>
      <div aria-label="Choix du mood — aperçu" className="mood-list">
        {moods.map((mood, index) => (
          <Badge aria-disabled="true" key={mood} tone={index === 0 ? "coral" : "neutral"}>
            {mood}
          </Badge>
        ))}
      </div>
      <p className="preview-note" id="presence-preview-note">
        Aperçu UI — l’activation sera reliée à la présence sécurisée en vague 2.
      </p>
    </Card>
  );
}
