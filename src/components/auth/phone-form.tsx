"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState, type FormEvent } from "react";

import { ArrowIcon } from "@/components/ui/icons";
import { InlineFeedback } from "@/components/ui/inline-feedback";
import {
  isIvoryCoastMobilePhone,
  normalizeIvoryCoastPhone,
} from "@/features/auth/phone";

import { CaptchaWidget } from "./captcha-widget";

type ApiError = {
  error?: { code?: string; message?: string };
};

export function PhoneForm() {
  const router = useRouter();
  const [localNumber, setLocalNumber] = useState("");
  const [consent, setConsent] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string>();
  const [captchaRequired, setCaptchaRequired] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);

  const handleCaptchaToken = useCallback((token: string) => {
    setCaptchaToken(token);
    setError(undefined);
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const phoneNumber = normalizeIvoryCoastPhone(localNumber);

    if (!isIvoryCoastMobilePhone(phoneNumber)) {
      setError("Entre un numéro mobile ivoirien valide.");
      return;
    }

    if (!consent) {
      setError("Accepte les conditions pour continuer.");
      return;
    }

    setPending(true);
    setError(undefined);

    try {
      const response = await fetch("/api/auth/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, consent, captchaToken }),
      });
      const result = (await response.json()) as ApiError;

      if (!response.ok) {
        if (result.error?.code === "CAPTCHA_REQUIRED") {
          setCaptchaRequired(true);
        }
        throw new Error(
          result.error?.message ??
            "Le code n’a pas pu être envoyé. Réessaie dans un instant.",
        );
      }

      sessionStorage.setItem("leco:otp-phone", phoneNumber);
      router.push("/verification-otp");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Le code n’a pas pu être envoyé.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="auth-card" onSubmit={handleSubmit} noValidate>
      <label className="auth-field" htmlFor="phone">
        <span className="sr-only">Numéro mobile</span>
        <span className="auth-phone">
          <span className="auth-phone__prefix" aria-hidden="true">
            CI&nbsp;&nbsp;+225
          </span>
          <input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            placeholder="07 01 02 03 04"
            value={localNumber}
            onChange={(event) => {
              setLocalNumber(event.target.value);
              setError(undefined);
            }}
            aria-describedby={error ? "phone-error" : undefined}
            aria-invalid={Boolean(error)}
            disabled={pending}
            required
          />
        </span>
      </label>

      <label className="auth-consent">
        <input
          type="checkbox"
          checked={consent}
          onChange={(event) => {
            setConsent(event.target.checked);
            setError(undefined);
          }}
          disabled={pending}
        />
        <span>
          J’accepte les <a href="/conditions">conditions d’utilisation</a> et la{" "}
          <a href="/confidentialite">politique de confidentialité</a>.
        </span>
      </label>

      {captchaRequired ? (
        <div className="auth-captcha" aria-label="Vérification de sécurité">
          <p>Une étape rapide pour protéger la communauté.</p>
          <CaptchaWidget onToken={handleCaptchaToken} />
        </div>
      ) : null}

      {error ? (
        <InlineFeedback id="phone-error" live="assertive">
          {error}
        </InlineFeedback>
      ) : null}

      <button className="auth-submit" type="submit" disabled={pending}>
        <span>{pending ? "Envoi en cours…" : "Recevoir mon code"}</span>
        <ArrowIcon />
      </button>
    </form>
  );
}
