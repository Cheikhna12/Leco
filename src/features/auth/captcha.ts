import "server-only";

export type CaptchaProviderName = "turnstile" | "hcaptcha" | "test";

export interface CaptchaVerifier {
  verify(token: string | undefined, remoteAddress?: string): Promise<boolean>;
}

type CaptchaVerifierOptions = {
  provider?: string;
  secret?: string;
  production: boolean;
};

const CAPTCHA_ENDPOINTS: Record<
  Exclude<CaptchaProviderName, "test">,
  string
> = {
  turnstile: "https://challenges.cloudflare.com/turnstile/v0/siteverify",
  hcaptcha: "https://api.hcaptcha.com/siteverify",
};

export class EnvironmentCaptchaVerifier implements CaptchaVerifier {
  constructor(private readonly options: CaptchaVerifierOptions) {
    if (options.production && options.provider === "test") {
      throw new Error("Le CAPTCHA de test est interdit en production.");
    }
  }

  async verify(
    token: string | undefined,
    remoteAddress?: string,
  ): Promise<boolean> {
    if (!token) {
      return false;
    }

    if (this.options.provider === "test") {
      return !this.options.production && token === "development-captcha";
    }

    if (
      (this.options.provider !== "turnstile" &&
        this.options.provider !== "hcaptcha") ||
      !this.options.secret
    ) {
      return false;
    }

    const body = new URLSearchParams({
      secret: this.options.secret,
      response: token,
    });

    if (remoteAddress) {
      body.set("remoteip", remoteAddress);
    }

    const response = await fetch(CAPTCHA_ENDPOINTS[this.options.provider], {
      method: "POST",
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    });

    if (!response.ok) {
      return false;
    }

    const result = (await response.json()) as { success?: boolean };
    return result.success === true;
  }
}
