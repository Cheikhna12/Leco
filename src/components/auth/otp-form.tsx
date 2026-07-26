"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ClipboardEvent,
  type FormEvent,
  type KeyboardEvent,
} from "react";

import { ArrowIcon, LockIcon, RefreshIcon } from "@/components/ui/icons";
import { maskPhoneNumber } from "@/features/auth/phone";

const OTP_LENGTH = 6;
const RESEND_DELAY_SECONDS = 60;

type ApiError = {
  error?: { code?: string; message?: string };
  destination?: string;
};

function digitsFrom(value: string): string[] {
  return value.replace(/\D/g, "").slice(0, OTP_LENGTH).split("");
}

export function OtpForm() {
  const router = useRouter();
  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  const phoneNumber = useSyncExternalStore(
    () => () => undefined,
    () => sessionStorage.getItem("leco:otp-phone") ?? "",
    () => "",
  );
  const [digits, setDigits] = useState<string[]>(
    Array.from({ length: OTP_LENGTH }, () => ""),
  );
  const [remainingSeconds, setRemainingSeconds] =
    useState(RESEND_DELAY_SECONDS);
  const [pending, setPending] = useState(false);
  const [resending, setResending] = useState(false);
  const [status, setStatus] = useState<
    "idle" | "error" | "expired" | "success"
  >("idle");
  const [message, setMessage] = useState<string>();

  useEffect(() => {
    const storedPhone = sessionStorage.getItem("leco:otp-phone");

    if (!storedPhone) {
      router.replace("/connexion");
      return;
    }

    inputs.current[0]?.focus();
  }, [router]);

  useEffect(() => {
    if (remainingSeconds <= 0) {
      return;
    }

    const interval = window.setInterval(() => {
      setRemainingSeconds((current) => Math.max(0, current - 1));
    }, 1_000);

    return () => window.clearInterval(interval);
  }, [remainingSeconds]);

  function setCode(nextDigits: string[], focusIndex?: number) {
    const padded = Array.from(
      { length: OTP_LENGTH },
      (_, index) => nextDigits[index] ?? "",
    );
    setDigits(padded);
    setStatus("idle");
    setMessage(undefined);

    if (focusIndex !== undefined) {
      inputs.current[Math.min(focusIndex, OTP_LENGTH - 1)]?.focus();
    }
  }

  function handleChange(index: number, value: string) {
    const pastedDigits = digitsFrom(value);

    if (pastedDigits.length > 1) {
      const next = [...digits];
      pastedDigits.forEach((digit, offset) => {
        if (index + offset < OTP_LENGTH) {
          next[index + offset] = digit;
        }
      });
      setCode(next, Math.min(index + pastedDigits.length, OTP_LENGTH - 1));
      return;
    }

    const next = [...digits];
    next[index] = pastedDigits[0] ?? "";
    setCode(next, pastedDigits[0] ? index + 1 : index);
  }

  function handleKeyDown(
    index: number,
    event: KeyboardEvent<HTMLInputElement>,
  ) {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      event.preventDefault();
      const next = [...digits];
      next[index - 1] = "";
      setCode(next, index - 1);
    } else if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      inputs.current[index - 1]?.focus();
    } else if (event.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      event.preventDefault();
      inputs.current[index + 1]?.focus();
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLDivElement>) {
    const pastedDigits = digitsFrom(event.clipboardData.getData("text"));

    if (pastedDigits.length) {
      event.preventDefault();
      setCode(pastedDigits, Math.min(pastedDigits.length, OTP_LENGTH - 1));
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = digits.join("");

    if (code.length !== OTP_LENGTH) {
      setStatus("error");
      setMessage("Entre les six chiffres du code.");
      return;
    }

    setPending(true);
    setMessage(undefined);

    try {
      const response = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, code }),
      });
      const result = (await response.json()) as ApiError;

      if (!response.ok) {
        setStatus(result.error?.code === "OTP_EXPIRED" ? "expired" : "error");
        throw new Error(
          result.error?.message ?? "Ce code n’est pas valide ou a expiré.",
        );
      }

      setStatus("success");
      setMessage("Code confirmé. Bienvenue sur Leco.");
      sessionStorage.removeItem("leco:otp-phone");
      router.replace(result.destination || "/");
      router.refresh();
    } catch (caughtError) {
      setMessage(
        caughtError instanceof Error
          ? caughtError.message
          : "La vérification n’a pas abouti.",
      );
      setDigits(Array.from({ length: OTP_LENGTH }, () => ""));
      inputs.current[0]?.focus();
    } finally {
      setPending(false);
    }
  }

  async function handleResend() {
    if (remainingSeconds > 0 || resending) {
      return;
    }

    setResending(true);
    setStatus("idle");
    setMessage(undefined);

    try {
      const response = await fetch("/api/auth/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, consent: true }),
      });
      const result = (await response.json()) as ApiError;

      if (!response.ok) {
        throw new Error(
          result.error?.message ?? "Le code n’a pas pu être renvoyé.",
        );
      }

      setRemainingSeconds(RESEND_DELAY_SECONDS);
      setMessage("Un nouveau code a été demandé.");
    } catch (caughtError) {
      setStatus("error");
      setMessage(
        caughtError instanceof Error
          ? caughtError.message
          : "Le code n’a pas pu être renvoyé.",
      );
    } finally {
      setResending(false);
    }
  }

  return (
    <form className="auth-card auth-card--otp" onSubmit={handleSubmit}>
      <div className="auth-card__heading">
        <span className="auth-step">02 / 02</span>
        <h2>Entre le code</h2>
        <p>
          Six chiffres envoyés au{" "}
          <strong>
            {phoneNumber ? maskPhoneNumber(phoneNumber) : "numéro indiqué"}
          </strong>
          .
        </p>
      </div>

      <fieldset className="otp-fieldset" disabled={pending}>
        <legend className="sr-only">Code de vérification à six chiffres</legend>
        <div
          className="otp-inputs"
          onPaste={handlePaste}
          aria-describedby={message ? "otp-status" : "otp-hint"}
        >
          {digits.map((digit, index) => (
            <input
              // The position is stable and is the semantic identity of a digit.
              key={index}
              ref={(element) => {
                inputs.current[index] = element;
              }}
              aria-label={`Chiffre ${index + 1} sur ${OTP_LENGTH}`}
              autoComplete={index === 0 ? "one-time-code" : "off"}
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={index === 0 ? OTP_LENGTH : 1}
              value={digit}
              onChange={(event) => handleChange(index, event.target.value)}
              onKeyDown={(event) => handleKeyDown(index, event)}
              aria-invalid={status === "error" || status === "expired"}
            />
          ))}
        </div>
      </fieldset>

      <p className="auth-otp-hint" id="otp-hint">
        Le code est temporaire et ne doit être partagé avec personne.
      </p>

      {message ? (
        <p
          className={`auth-status auth-status--${status}`}
          id="otp-status"
          role={status === "error" || status === "expired" ? "alert" : "status"}
          aria-live="polite"
        >
          {message}
        </p>
      ) : null}

      <button className="auth-submit" type="submit" disabled={pending}>
        <span>{pending ? "Vérification…" : "Confirmer le code"}</span>
        <ArrowIcon />
      </button>

      <div className="auth-resend">
        <button
          type="button"
          onClick={handleResend}
          disabled={remainingSeconds > 0 || resending}
        >
          <RefreshIcon />
          {resending
            ? "Renvoi…"
            : remainingSeconds > 0
              ? `Nouveau code dans ${remainingSeconds} s`
              : "Renvoyer un code"}
        </button>
        <Link
          href="/connexion"
          onClick={() => sessionStorage.removeItem("leco:otp-phone")}
        >
          Modifier le numéro
        </Link>
      </div>

      <p className="auth-security-note">
        <LockIcon />
        Nous ne te demanderons jamais ce code par message.
      </p>
    </form>
  );
}
