"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { LecoMark } from "@/components/ui/leco-mark";
import { LockIcon, VibeIcon } from "@/components/ui/icons";
import { InlineFeedback } from "@/components/ui/inline-feedback";
import {
  MOODS,
  MOOD_PRESENTATION,
  PRESENCE_DURATIONS,
  type Mood,
  type PresenceDuration,
} from "@/features/presence/domain";
import { GEOLOCATION_MESSAGES, useGeolocation } from "@/hooks/use-geolocation";
import { usePresence } from "@/hooks/use-presence";

import styles from "./presence-control.module.css";

function formatRemaining(availableUntil: string | null): string {
  if (!availableUntil) {
    return "0 min";
  }

  const minutes = Math.max(
    0,
    Math.ceil((Date.parse(availableUntil) - Date.now()) / 60_000),
  );
  return `${minutes} min`;
}

export function PresenceControl() {
  const location = useGeolocation();
  const presence = usePresence();
  const [showConsent, setShowConsent] = useState(false);
  const [sessionLocationReady, setSessionLocationReady] = useState(false);
  const [mood, setMood] = useState<Mood>("discuter");
  const [duration, setDuration] = useState<PresenceDuration>(60);
  const active = presence.snapshot.status === "AVAILABLE";
  const activeMood = presence.snapshot.mood
    ? MOOD_PRESENTATION[presence.snapshot.mood]
    : null;
  const remaining = useMemo(
    () => formatRemaining(presence.snapshot.availableUntil),
    [presence.snapshot.availableUntil],
  );
  const locationReady =
    sessionLocationReady ||
    (!presence.loading && presence.snapshot.hasValidLocation);

  async function allowLocation() {
    const updated = await location.requestLocation();
    setSessionLocationReady(updated);

    if (updated) {
      setShowConsent(false);
    }
  }

  async function activate() {
    const activated = await presence.activate({
      durationMinutes: duration,
      mood,
    });

    if (activated) {
      setSessionLocationReady(false);
    }
  }

  const showConfiguration = locationReady && !active;
  const showLocationError =
    !locationReady &&
    location.state !== "idle" &&
    location.state !== "checking" &&
    location.state !== "requesting" &&
    location.state !== "ready";

  return (
    <main className={styles.shell}>
      <div className={styles.frame}>
        <div className={styles.topline}>
          <Link aria-label="Retour à Leco" className={styles.brand} href="/">
            <LecoMark />
            Leco
          </Link>
          <span className={styles.privacy}>
            <LockIcon aria-hidden="true" />
            Position privée
          </span>
        </div>

        <div className={styles.layout}>
          <section className={styles.intro}>
            <h1>
              Dispo, juste <em>maintenant.</em>
            </h1>
            <div className={styles.signal} data-active={active}>
              <span aria-hidden="true" className={styles.signalMark}>
                <VibeIcon className={styles.signalIcon} />
              </span>
              <span>
                <strong>{active ? "Actif" : "Inactif"}</strong>
              </span>
            </div>
          </section>

          <section
            aria-busy={presence.loading || presence.pending}
            aria-label="Présence"
            className={styles.panel}
          >
            <div aria-live="polite" className={styles.body}>
              {presence.loading ? (
                <p>Vérification de ta présence…</p>
              ) : active ? (
                <div className={styles.activeView}>
                  <div aria-hidden="true" className={styles.activeDial}>
                    <span>Encore</span>
                    <strong>{remaining}</strong>
                  </div>
                  <div>
                    <p className={styles.activeMood}>{activeMood?.label}</p>
                  </div>
                  <p className={styles.activeMeta}>
                    Secteur approximatif
                    <span aria-hidden="true">·</span>
                    arrêt automatique
                  </p>
                  {presence.error ? (
                    <InlineFeedback live="assertive">
                      {presence.error}
                    </InlineFeedback>
                  ) : null}
                  <button
                    className={styles.secondary}
                    disabled={presence.pending}
                    onClick={() => void presence.deactivate()}
                    type="button"
                  >
                    {presence.pending ? "Désactivation…" : "Je suis off"}
                  </button>
                </div>
              ) : showConfiguration ? (
                <div className={styles.configuration}>
                  <fieldset className={styles.fieldset}>
                    <legend className={styles.legend}>
                      <strong>Ton mood</strong>
                    </legend>
                    <div className={styles.moods}>
                      {MOODS.map((value) => (
                        <button
                          aria-pressed={mood === value}
                          className={styles.mood}
                          key={value}
                          onClick={() => setMood(value)}
                          type="button"
                        >
                          <strong>{MOOD_PRESENTATION[value].label}</strong>
                        </button>
                      ))}
                    </div>
                  </fieldset>

                  <fieldset className={styles.fieldset}>
                    <legend className={styles.legend}>
                      <strong>Durée</strong>
                    </legend>
                    <div className={styles.durations}>
                      {PRESENCE_DURATIONS.map((value) => (
                        <button
                          aria-label={`${value} minutes`}
                          aria-pressed={duration === value}
                          className={styles.duration}
                          key={value}
                          onClick={() => setDuration(value)}
                          type="button"
                        >
                          {value < 60 ? `${value}m` : `${value / 60}h`}
                        </button>
                      ))}
                    </div>
                  </fieldset>

                  {presence.error ? (
                    <InlineFeedback live="assertive">
                      {presence.error}
                    </InlineFeedback>
                  ) : null}

                  <button
                    className={styles.primary}
                    disabled={presence.pending}
                    onClick={() => void activate()}
                    type="button"
                  >
                    {presence.pending
                      ? "Activation…"
                      : `Je suis dispo · ${duration < 60 ? `${duration} min` : `${duration / 60} h`}`}
                  </button>
                </div>
              ) : showConsent ? (
                <div className={styles.consent}>
                  <div aria-hidden="true" className={styles.consentVisual}>
                    <span className={styles.orbit} />
                    <span className={styles.core} />
                  </div>
                  <div>
                    <h3>Un secteur, jamais un point.</h3>
                  </div>
                  <div className={styles.assurances}>
                    <div className={styles.assurance}>
                      <LockIcon aria-hidden="true" />
                      Supprimée dès que tu repasses hors ligne
                    </div>
                  </div>
                  {showLocationError ? (
                    <InlineFeedback live="assertive">
                      {location.errorMessage ??
                        GEOLOCATION_MESSAGES.error ??
                        "Réessaie dans un instant."}
                    </InlineFeedback>
                  ) : null}
                  <button
                    className={styles.primary}
                    disabled={
                      location.state === "checking" ||
                      location.state === "requesting" ||
                      location.state === "insecure" ||
                      location.state === "unsupported"
                    }
                    onClick={() => void allowLocation()}
                    type="button"
                  >
                    {location.state === "checking"
                      ? "Vérification…"
                      : location.state === "requesting"
                        ? "Localisation…"
                        : location.state === "insecure"
                          ? "Ouvre Leco en HTTPS"
                          : "Autoriser pour continuer"}
                  </button>
                  <button
                    className={styles.secondary}
                    onClick={() => {
                      location.reset();
                      setShowConsent(false);
                    }}
                    type="button"
                  >
                    Pas maintenant
                  </button>
                </div>
              ) : (
                <div className={styles.consent}>
                  <div aria-hidden="true" className={styles.consentVisual}>
                    <span className={styles.orbit} />
                    <span className={styles.core} />
                  </div>
                  {presence.error ? (
                    <InlineFeedback live="assertive">
                      {presence.error}
                    </InlineFeedback>
                  ) : null}
                  <button
                    className={styles.primary}
                    onClick={() => setShowConsent(true)}
                    type="button"
                  >
                    Je veux être visible
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
