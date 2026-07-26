import {
  createPrivateRateLimitKey,
  createRateLimitRequest,
  enforceRateLimit,
  type RateLimitStore,
} from "@/lib/security/rate-limit";

import type { CaptchaVerifier } from "./captcha";
import type { OtpProvider } from "./otp-provider";
import type { RequestOtpInput, VerifyOtpInput } from "./phone";

export class CaptchaRequiredError extends Error {
  readonly code = "CAPTCHA_REQUIRED";
  readonly status = 403;

  constructor() {
    super("Une vérification de sécurité est requise.");
    this.name = "CaptchaRequiredError";
  }
}

type AuthenticationServiceOptions = {
  provider: OtpProvider;
  rateLimitStore: RateLimitStore;
  captchaVerifier: CaptchaVerifier;
  rateLimitSecret: string;
};

export class AuthenticationService {
  constructor(private readonly options: AuthenticationServiceOptions) {}

  async requestOtp(
    input: RequestOtpInput,
    remoteAddress: string,
  ): Promise<{ accepted: true }> {
    const requestKey = await createPrivateRateLimitKey(
      "otp-request",
      `${input.phoneNumber}\u0000${remoteAddress}`,
      this.options.rateLimitSecret,
    );
    const cooldownKey = await createPrivateRateLimitKey(
      "otp-cooldown",
      input.phoneNumber,
      this.options.rateLimitSecret,
    );
    const decision = await enforceRateLimit(
      this.options.rateLimitStore,
      createRateLimitRequest("otpRequest", requestKey),
    );

    await enforceRateLimit(this.options.rateLimitStore, {
      key: cooldownKey,
      limit: 1,
      windowSeconds: 60,
    });

    if (decision.remaining <= 1) {
      const captchaIsValid = await this.options.captchaVerifier.verify(
        input.captchaToken,
        remoteAddress,
      );

      if (!captchaIsValid) {
        throw new CaptchaRequiredError();
      }
    }

    await this.options.provider.requestOtp({
      phoneNumber: input.phoneNumber,
      captchaToken: input.captchaToken,
    });

    return { accepted: true };
  }

  async verifyOtp(
    input: VerifyOtpInput,
    remoteAddress: string,
  ): Promise<{ userId: string }> {
    const key = await createPrivateRateLimitKey(
      "otp-verification",
      `${input.phoneNumber}\u0000${remoteAddress}`,
      this.options.rateLimitSecret,
    );

    await enforceRateLimit(
      this.options.rateLimitStore,
      createRateLimitRequest("otpVerification", key),
    );

    return this.options.provider.verifyOtp(input);
  }
}
