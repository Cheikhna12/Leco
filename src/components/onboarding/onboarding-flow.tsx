"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { ArrowIcon, CheckIcon, ShieldIcon } from "@/components/ui/icons";
import { InlineFeedback } from "@/components/ui/inline-feedback";
import { LocationOrbIllustration } from "@/components/ui/location-orb-illustration";
import {
  GENDERS,
  profileDraftSchema,
  type Gender,
} from "@/features/profiles/profile-schema";
import type {
  Interest,
  OnboardingState,
  ProfilePhoto,
} from "@/features/profiles/profile-types";
import { useGeolocation, type GeolocationState } from "@/hooks/use-geolocation";

const STEPS = [
  { number: 1, label: "À propos de toi" },
  { number: 2, label: "Tes photos" },
  { number: 3, label: "Tes affinités" },
  { number: 4, label: "Autour de toi" },
] as const;

const GENDER_LABELS: Record<Gender, string> = {
  woman: "Femme",
  man: "Homme",
  non_binary: "Non-binaire",
  other: "Autre",
  prefer_not_to_say: "Je préfère ne pas dire",
};

type Props = {
  initialProfile: OnboardingState;
  interests: Interest[];
  mode?: "onboarding" | "profile";
};

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const payload = (await response.json()) as T & {
    error?: { message?: string };
  };
  if (!response.ok) {
    throw new Error(payload.error?.message ?? "Impossible de sauvegarder.");
  }
  return payload;
}

export function OnboardingFlow({
  initialProfile,
  interests,
  mode = "onboarding",
}: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState(initialProfile);
  const [step, setStep] = useState(
    mode === "profile" ? 1 : Math.min(initialProfile.onboardingStep, 4),
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const location = useGeolocation();

  const progress = `${(step / STEPS.length) * 100}%`;
  const selectedInterests = useMemo(
    () => new Set(profile.interestIds),
    [profile.interestIds],
  );

  function update<K extends keyof OnboardingState>(
    key: K,
    value: OnboardingState[K],
  ) {
    setProfile((current) => ({ ...current, [key]: value }));
    setError("");
  }

  async function saveInformation() {
    const parsed = profileDraftSchema.safeParse({
      firstName: profile.firstName,
      birthDate: profile.birthDate,
      gender: profile.gender,
      searchingFor: profile.searchingFor,
      bio: profile.bio,
      adultConfirmed: profile.adultConfirmed,
      onboardingStep: 2,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Vérifie tes informations.");
      return false;
    }
    const payload = await api<{ profile: OnboardingState }>("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });
    setProfile(payload.profile);
    return true;
  }

  async function next() {
    setBusy(true);
    setError("");
    try {
      if (step === 1 && !(await saveInformation())) return;
      if (
        step === 2 &&
        (profile.photos.length < 2 || profile.photos.length > 4)
      ) {
        setError("Ajoute entre 2 et 4 photos pour continuer.");
        return;
      }
      if (step === 3) {
        await api("/api/profile/interests", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ interestIds: profile.interestIds }),
        });
      }
      setStep((current) => Math.min(4, current + 1));
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Impossible de sauvegarder.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function uploadPhoto(file: File) {
    setBusy(true);
    setError("");
    try {
      const body = new FormData();
      body.set("photo", file);
      const payload = await api<{ profile: OnboardingState }>("/api/photos", {
        method: "POST",
        body,
      });
      setProfile(payload.profile);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "L’envoi a échoué.");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
      setBusy(false);
    }
  }

  async function removePhoto(photoId: string) {
    setBusy(true);
    setError("");
    try {
      await api(`/api/photos/${photoId}`, { method: "DELETE" });
      setProfile((current) => ({
        ...current,
        photos: current.photos
          .filter((photo) => photo.id !== photoId)
          .map((photo, index) => ({ ...photo, displayOrder: index + 1 })),
      }));
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Suppression impossible.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function movePhoto(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= profile.photos.length) return;
    const photos = [...profile.photos];
    [photos[index], photos[nextIndex]] = [photos[nextIndex], photos[index]];
    const ordered = photos.map((photo, position) => ({
      ...photo,
      displayOrder: position + 1,
    }));
    setProfile((current) => ({ ...current, photos: ordered }));
    try {
      await api("/api/photos/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoIds: ordered.map((photo) => photo.id) }),
      });
    } catch (caught) {
      setProfile((current) => ({ ...current, photos: profile.photos }));
      setError(
        caught instanceof Error ? caught.message : "Ordre non sauvegardé.",
      );
    }
  }

  function toggleInterest(id: number) {
    const next = selectedInterests.has(id)
      ? profile.interestIds.filter((interestId) => interestId !== id)
      : [...profile.interestIds, id];
    if (next.length > 3) {
      setError("Choisis au maximum 3 centres d’intérêt.");
      return;
    }
    update("interestIds", next);
  }

  async function requestLocation() {
    setError("");
    await location.requestLocation();
  }

  async function finish() {
    if (location.state !== "ready") {
      setError("Autorise ta localisation pour continuer vers la présence.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await api("/api/profile/complete", { method: "POST" });
      setSuccess(true);
      window.setTimeout(() => {
        router.replace(mode === "profile" ? "/" : "/presence");
        router.refresh();
      }, 700);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Profil incomplet.");
    } finally {
      setBusy(false);
    }
  }

  if (success) {
    return (
      <section className="onboarding-success" aria-live="polite">
        <span className="onboarding-success__mark">
          <CheckIcon />
        </span>
        <h1>Bienvenue dans le mouvement.</h1>
      </section>
    );
  }

  return (
    <main className="onboarding-shell">
      <aside className="onboarding-rail">
        <div>
          <p className="onboarding-kicker">
            {mode === "profile" ? "Mon profil" : "Première rencontre"}
          </p>
          <h1>
            Un profil qui te <em>ressemble.</em>
          </h1>
        </div>

        <ol className="onboarding-steps" aria-label="Progression">
          {STEPS.map((item) => (
            <li
              aria-current={item.number === step ? "step" : undefined}
              className={item.number <= step ? "is-active" : undefined}
              key={item.number}
            >
              <span>{String(item.number).padStart(2, "0")}</span>
              <span>{item.label}</span>
            </li>
          ))}
        </ol>
        <div className="onboarding-privacy">
          <ShieldIcon />
          <p>
            Ta date de naissance et ta position exacte ne sont jamais publiques.
          </p>
        </div>
      </aside>

      <section className="onboarding-stage">
        <div className="onboarding-mobile-progress">
          <span>Étape {step} sur 4</span>
          <span>{STEPS[step - 1].label}</span>
          <i style={{ "--progress": progress } as React.CSSProperties} />
        </div>

        <div className="onboarding-panel">
          <div className="onboarding-step-content" key={step}>
            {step === 1 ? (
              <InformationStep profile={profile} update={update} />
            ) : null}
            {step === 2 ? (
              <PhotosStep
                busy={busy}
                fileInputRef={fileInputRef}
                movePhoto={movePhoto}
                photos={profile.photos}
                removePhoto={removePhoto}
                uploadPhoto={uploadPhoto}
              />
            ) : null}
            {step === 3 ? (
              <InterestsStep
                interests={interests}
                selected={selectedInterests}
                toggle={toggleInterest}
              />
            ) : null}
            {step === 4 ? (
              <LocationStep
                errorMessage={location.errorMessage}
                requestLocation={() => void requestLocation()}
                state={location.state}
              />
            ) : null}
          </div>

          {error ? (
            <InlineFeedback live="assertive">{error}</InlineFeedback>
          ) : null}

          <footer className="onboarding-actions">
            <button
              className="onboarding-back"
              disabled={step === 1 || busy}
              onClick={() => setStep((current) => Math.max(1, current - 1))}
              type="button"
            >
              Précédent
            </button>
            <button
              className="onboarding-next"
              disabled={busy}
              onClick={step === 4 ? finish : next}
              type="button"
            >
              <span>
                {busy ? "Sauvegarde…" : step === 4 ? "Terminer" : "Continuer"}
              </span>
              <ArrowIcon />
            </button>
          </footer>
        </div>
      </section>
    </main>
  );
}

function InformationStep({
  profile,
  update,
}: {
  profile: OnboardingState;
  update: <K extends keyof OnboardingState>(
    key: K,
    value: OnboardingState[K],
  ) => void;
}) {
  return (
    <>
      <header className="onboarding-heading">
        <h2>Comment veux-tu être présenté·e&nbsp;?</h2>
      </header>
      <div className="onboarding-form-grid">
        <label className="onboarding-field">
          <span>Prénom</span>
          <input
            autoComplete="given-name"
            maxLength={40}
            onChange={(event) => update("firstName", event.target.value)}
            placeholder="Ton prénom"
            value={profile.firstName}
          />
        </label>
        <label className="onboarding-field">
          <span>Date de naissance</span>
          <input
            disabled={Boolean(profile.birthDate && profile.adultConfirmed)}
            onChange={(event) => update("birthDate", event.target.value)}
            type="date"
            value={profile.birthDate}
          />
        </label>
      </div>
      <fieldset className="onboarding-choice-group">
        <legend>Je me présente comme</legend>
        <div className="onboarding-choice-grid">
          {GENDERS.map((gender) => (
            <label key={gender}>
              <input
                checked={profile.gender === gender}
                name="gender"
                onChange={() => update("gender", gender)}
                type="radio"
              />
              <span>{GENDER_LABELS[gender]}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className="onboarding-choice-group">
        <legend>J’aimerais rencontrer</legend>
        <div className="onboarding-choice-grid">
          {GENDERS.map((gender) => (
            <label key={gender}>
              <input
                checked={profile.searchingFor.includes(gender)}
                onChange={() =>
                  update(
                    "searchingFor",
                    profile.searchingFor.includes(gender)
                      ? profile.searchingFor.filter((item) => item !== gender)
                      : [...profile.searchingFor, gender],
                  )
                }
                type="checkbox"
              />
              <span>{GENDER_LABELS[gender]}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <label className="onboarding-field onboarding-field--bio">
        <span>Quelques mots</span>
        <textarea
          maxLength={150}
          onChange={(event) => update("bio", event.target.value)}
          placeholder="Ce qui donne envie de venir te parler…"
          rows={4}
          value={profile.bio}
        />
        <small>{profile.bio.length}/150</small>
      </label>
      <label className="onboarding-majority">
        <input
          checked={profile.adultConfirmed}
          disabled={profile.adultConfirmed}
          onChange={(event) => update("adultConfirmed", event.target.checked)}
          type="checkbox"
        />
        <span>Je confirme avoir au moins 18 ans.</span>
      </label>
    </>
  );
}

function PhotosStep({
  busy,
  fileInputRef,
  movePhoto,
  photos,
  removePhoto,
  uploadPhoto,
}: {
  busy: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  movePhoto: (index: number, direction: -1 | 1) => void;
  photos: ProfilePhoto[];
  removePhoto: (id: string) => void;
  uploadPhoto: (file: File) => void;
}) {
  return (
    <>
      <header className="onboarding-heading">
        <h2>Ajoute tes photos.</h2>
        <p>2 à 4 · la première est principale.</p>
      </header>
      <div className="photo-studio">
        {photos.map((photo, index) => (
          <article className="photo-tile" key={photo.id}>
            <div
              aria-label={`Photo ${index + 1}`}
              className="photo-tile__image"
              role="img"
              style={{ backgroundImage: `url("${photo.secureUrl}")` }}
            />
            <div className="photo-tile__meta">
              <strong>
                {index === 0 ? "Principale" : `Photo ${index + 1}`}
              </strong>
              <span>
                {photo.moderationStatus === "pending"
                  ? "En vérification"
                  : "Validée"}
              </span>
            </div>
            <div className="photo-tile__actions">
              <button
                aria-label="Déplacer vers la gauche"
                disabled={index === 0 || busy}
                onClick={() => movePhoto(index, -1)}
                type="button"
              >
                ←
              </button>
              <button
                aria-label="Déplacer vers la droite"
                disabled={index === photos.length - 1 || busy}
                onClick={() => movePhoto(index, 1)}
                type="button"
              >
                →
              </button>
              <button
                className="photo-tile__delete"
                disabled={busy}
                onClick={() => removePhoto(photo.id)}
                type="button"
              >
                Retirer
              </button>
            </div>
          </article>
        ))}
        {photos.length < 4 ? (
          <button
            className="photo-add"
            disabled={busy}
            onClick={() => fileInputRef.current?.click()}
            type="button"
          >
            <span>+</span>
            <strong>Ajouter une photo</strong>
            <small>JPEG, PNG ou WebP · 8 Mo max.</small>
          </button>
        ) : null}
      </div>
      <input
        accept="image/jpeg,image/png,image/webp"
        className="visually-hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void uploadPhoto(file);
        }}
        ref={fileInputRef}
        type="file"
      />
    </>
  );
}

function InterestsStep({
  interests,
  selected,
  toggle,
}: {
  interests: Interest[];
  selected: Set<number>;
  toggle: (id: number) => void;
}) {
  return (
    <>
      <header className="onboarding-heading">
        <h2>Qu’est-ce qui pourrait lancer la conversation&nbsp;?</h2>
      </header>
      <div className="interest-counter" aria-live="polite">
        <span>{selected.size}</span>
        <p>
          sélection{selected.size > 1 ? "s" : ""}
          <small>minimum 2 · maximum 3</small>
        </p>
      </div>
      <div className="interest-cloud">
        {interests.map((interest) => (
          <button
            aria-pressed={selected.has(interest.id)}
            key={interest.id}
            onClick={() => toggle(interest.id)}
            type="button"
          >
            <span>{interest.label}</span>
            {selected.has(interest.id) ? <CheckIcon /> : null}
          </button>
        ))}
      </div>
    </>
  );
}

function LocationStep({
  errorMessage,
  requestLocation,
  state,
}: {
  errorMessage: string | null;
  requestLocation: () => void;
  state: GeolocationState;
}) {
  const isReady = state === "ready";
  const isPending = state === "checking" || state === "requesting";
  const stateLabel = isReady
    ? "Position enregistrée"
    : state === "insecure"
      ? "HTTPS requis"
      : state === "blocked"
        ? "Permission bloquée"
        : state === "denied"
          ? "Permission refusée"
          : state === "inaccurate"
            ? "Signal trop imprécis"
            : state === "timeout"
              ? "Délai dépassé"
              : state === "unavailable"
                ? "Position indisponible"
                : state === "unsupported"
                  ? "Navigateur incompatible"
                  : "À toi de choisir";

  return (
    <>
      <header className="onboarding-heading">
        <h2>Découvre le mouvement autour de toi.</h2>
      </header>
      <div className="location-consent">
        <LocationOrbIllustration
          className="location-consent__illustration"
          status={isReady ? "ready" : isPending ? "locating" : "idle"}
        />
        <div>
          <strong>{stateLabel}</strong>
          <p>Utilisée pendant ta présence · aucun historique.</p>
          {errorMessage ? (
            <InlineFeedback live="assertive">{errorMessage}</InlineFeedback>
          ) : null}
          <button
            disabled={
              isPending ||
              isReady ||
              state === "unsupported" ||
              state === "insecure"
            }
            onClick={requestLocation}
            type="button"
          >
            {isPending
              ? "Localisation en cours…"
              : isReady
                ? "Position enregistrée"
                : state === "insecure"
                  ? "Ouvre Leco en HTTPS"
                  : "Autoriser et enregistrer"}
          </button>
        </div>
      </div>
    </>
  );
}
