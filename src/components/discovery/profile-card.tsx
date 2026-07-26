import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckIcon, WaveIcon } from "@/components/ui/icons";

export interface DiscoveryProfile {
  age: number;
  distance: "Tout près" | "Dans ton secteur" | "À moins d’un km";
  firstName: string;
  id: string;
  initials: string;
  interests: string[];
  mood: string;
  note: string;
  tone: "coral" | "lilac" | "apricot";
}

interface ProfileCardProps {
  compact?: boolean;
  featured?: boolean;
  onSelect?: () => void;
  profile: DiscoveryProfile;
  selected?: boolean;
}

export function ProfileCard({
  compact = false,
  featured = false,
  onSelect,
  profile,
  selected = false,
}: ProfileCardProps) {
  const { age, distance, firstName, initials, interests, mood, note, tone } =
    profile;

  return (
    <article
      className={[
        "person-card",
        compact ? "person-card--compact" : "",
        featured ? "person-card--featured" : "",
        selected ? "is-selected" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <Avatar
        initials={initials}
        label={`Portrait illustré de ${firstName}`}
        online
        tone={tone}
      />
      <div className="person-card__body">
        <div className="person-card__heading">
          <div>
            <h3>
              {firstName}, {age}
            </h3>
            <p className="person-card__distance">
              <span aria-hidden="true" />
              {distance}
            </p>
          </div>
          {compact ? null : (
            <Badge tone={selected ? "coral" : "neutral"}>{mood}</Badge>
          )}
        </div>
        <p className="person-card__note">{note}</p>
        <ul
          aria-label={`Centres d’intérêt de ${firstName}`}
          className="interest-list"
        >
          {interests.map((interest) => (
            <li key={interest}>{interest}</li>
          ))}
        </ul>
        {compact ? (
          <Button
            aria-label={`Afficher le profil de ${firstName}`}
            className="person-card__action"
            onClick={onSelect}
            size={selected ? "icon" : "default"}
            variant={selected ? "primary" : "quiet"}
          >
            {selected ? <CheckIcon /> : "Voir"}
          </Button>
        ) : (
          <Button
            aria-label={`Dire bonjour à ${firstName} — aperçu non interactif`}
            className="person-card__action"
            disabled
            title="Aperçu UI — cette action sera connectée en vague 3"
          >
            <WaveIcon />
            Dire bonjour
          </Button>
        )}
      </div>
    </article>
  );
}
