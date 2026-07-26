export interface OtpProvider {
  requestOtp(input: {
    phoneNumber: string;
    captchaToken?: string;
  }): Promise<void>;

  verifyOtp(input: { phoneNumber: string; code: string }): Promise<{
    userId: string;
  }>;
}

export type OtpProviderErrorCode =
  "INVALID_OTP" | "EXPIRED_OTP" | "PROVIDER_UNAVAILABLE";

export class OtpProviderError extends Error {
  constructor(
    readonly code: OtpProviderErrorCode,
    message = "La vérification n’a pas abouti.",
  ) {
    super(message);
    this.name = "OtpProviderError";
  }
}
