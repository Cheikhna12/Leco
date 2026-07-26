import { Button } from "@/components/ui/button";
import { ClockIcon, SparkIcon } from "@/components/ui/icons";

export function PresenceComposer({
  onOpenVibe,
}: {
  onOpenVibe?: () => void;
} = {}) {
  return (
    <section aria-label="Vibe active" className="presence-strip">
      <span aria-hidden="true" className="presence-strip__mark">
        <SparkIcon />
      </span>
      <div className="presence-strip__copy">
        <span className="surface-label">Ta vibe</span>
        <h2>On peut causer</h2>
        <p>
          Visible dans ton secteur pendant <strong>45 min</strong>.
        </p>
      </div>
      <div className="presence-strip__time">
        <ClockIcon />
        <span>21:45</span>
      </div>
      <Button onClick={onOpenVibe} variant="secondary">
        Modifier
      </Button>
    </section>
  );
}
