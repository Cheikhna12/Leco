"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { LecoMark } from "@/components/ui/leco-mark";
import { LockIcon, ShieldIcon } from "@/components/ui/icons";
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
            <span className={styles.eyebrow}>Présence temporaire</span>
            <h1>
              Dispo, juste <em>maintenant.</em>
            </h1>
            <p className={styles.lede}>
              Choisis ton intention, garde le contrôle du temps et repasse hors
              ligne en un geste. Leco ne montre jamais ton point GPS.
            </p>
            <div className={styles.signal} data-active={active}>
              <span aria-hidden="true" className={styles.signalMark} />
              <span>
                <strong>{active ? "Signal actif" : "Signal éteint"}</strong>
                <small>
                  {active
                    ? `Expiration automatique dans ${remaining}`
                    : "Tu n’apparais pas dans la découverte"}
                </small>
              </span>
            </div>
          </section>

          <section
            aria-busy={presence.loading || presence.pending}
            aria-labelledby="presence-title"
            className={styles.panel}
          >
            <header className={styles.panelHeader}>
              <div>
                <h2 id="presence-title">
                  {active ? "Je suis dispo" : "Je suis off"}
                </h2>
                <p>
                  {active
                    ? "Le heartbeat maintient ta présence."
                    : "Aucune présence n’est diffusée."}
                </p>
              </div>
              <span
                className={`${styles.status} ${
                  active ? styles.statusActive : ""
                }`}
              >
                {active ? "En ligne" : "Hors ligne"}
              </span>
            </header>

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
                    <p className={styles.activeCopy}>{activeMood?.detail}</p>
                  </div>
                  <p className={styles.activeMeta}>
                    Secteur approximatif
                    <span aria-hidden="true">·</span>
                    arrêt automatique
                  </p>
                  {presence.error ? (
                    <p className={styles.error} role="alert">
                      {presence.error}
                    </p>
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
                      <span>1 choix</span>
                    </legend>
                    <div className={styles.moods}>
                      {MOODS.map((value, index) => (
                        <button
                          aria-pressed={mood === value}
                          className={styles.mood}
                          key={value}
                          onClick={() => setMood(value)}
                          type="button"
                        >
                          <span aria-hidden="true" className={styles.moodIndex}>
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <strong>{MOOD_PRESENTATION[value].label}</strong>
                          <small>{MOOD_PRESENTATION[value].detail}</small>
                        </button>
                      ))}
                    </div>
                  </fieldset>

                  <fieldset className={styles.fieldset}>
                    <legend className={styles.legend}>
                      <strong>Durée</strong>
                      <span>expiration automatique</span>
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
                    <p className={styles.error} role="alert">
                      {presence.error}
                    </p>
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
                    <p>
                      Ta position nous aide à te montrer les personnes actives
                      autour de toi. Ta position exacte n’est jamais montrée aux
                      autres utilisateurs.
                    </p>
                  </div>
                  <div className={styles.assurances}>
                    <div className={styles.assurance}>
                      <ShieldIcon aria-hidden="true" />
                      Remplacée à chaque nouvelle mise à jour
                    </div>
                    <div className={styles.assurance}>
                      <LockIcon aria-hidden="true" />
                      Supprimée dès que tu repasses hors ligne
                    </div>
                  </div>
                  {showLocationError ? (
                    <p className={styles.error} role="alert">
                      {location.errorMessage ??
                        GEOLOCATION_MESSAGES.error ??
                        "Réessaie dans un instant."}
                    </p>
                  ) : null}
                  <button
                    className={styles.primary}
                    disabled={
                      location.state === "checking" ||
                      location.state === "requesting"
                    }
                    onClick={() => void allowLocation()}
                    type="button"
                  >
                    {location.state === "checking"
                      ? "Vérification…"
                      : location.state === "requesting"
                        ? "Localisation…"
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
                  <div>
                    <h3>Allumer ton signal</h3>
                    <p>
                      Tu choisiras d’abord ce que tu veux faire et pendant
                      combien de temps. Rien ne démarre sans ton accord.
                    </p>
                  </div>
                  {presence.error ? (
                    <p className={styles.error} role="alert">
                      {presence.error}
                    </p>
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
