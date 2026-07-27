"use client";

import Script from "next/script";
import { useEffect, useId } from "react";

type CaptchaWidgetProps = {
  onToken: (token: string) => void;
};

declare global {
  interface Window {
    [key: `lecoCaptcha${string}`]: ((token: string) => void) | undefined;
  }
}

export function CaptchaWidget({ onToken }: CaptchaWidgetProps) {
  const id = useId().replaceAll(":", "");
  const callbackName = `lecoCaptcha${id}` as const;
  const provider = process.env.NEXT_PUBLIC_CAPTCHA_PROVIDER;
  const siteKey = process.env.NEXT_PUBLIC_CAPTCHA_SITE_KEY;

  useEffect(() => {
    window[callbackName] = onToken;
    return () => {
      delete window[callbackName];
    };
  }, [callbackName, onToken]);

  if (process.env.NODE_ENV !== "production" && provider === "test") {
    return (
      <button
        className="auth-captcha__test"
        type="button"
        onClick={() => onToken("development-captcha")}
      >
        Valider le contrôle local
      </button>
    );
  }

  if (!siteKey || (provider !== "turnstile" && provider !== "hcaptcha")) {
    return (
      <p className="auth-captcha__unavailable" role="alert">
        Le contrôle de sécurité n’est pas configuré. Réessaie plus tard.
      </p>
    );
  }

  const isTurnstile = provider === "turnstile";

  return (
    <>
      <Script
        src={
          isTurnstile
            ? "https://challenges.cloudflare.com/turnstile/v0/api.js"
            : "https://js.hcaptcha.com/1/api.js"
        }
        strategy="afterInteractive"
      />
      <div
        className={isTurnstile ? "cf-turnstile" : "h-captcha"}
        data-sitekey={siteKey}
        data-callback={callbackName}
        data-theme="auto"
      />
    </>
  );
}
