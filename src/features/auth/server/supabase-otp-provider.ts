import "server-only";

import type { AuthError, SupabaseClient } from "@supabase/supabase-js";

import type { OtpProvider } from "../otp-provider";
import { OtpProviderError } from "../otp-provider";

type AuthClient = Pick<SupabaseClient, "auth">;

function mapVerificationError(error: AuthError): OtpProviderError {
  const normalized = error.message.toLowerCase();

  if (normalized.includes("expired")) {
    return new OtpProviderError("EXPIRED_OTP");
  }

  return new OtpProviderError("INVALID_OTP");
}

export class SupabaseOtpProvider implements OtpProvider {
  constructor(private readonly client: AuthClient) {}

  async requestOtp(input: {
    phoneNumber: string;
    captchaToken?: string;
  }): Promise<void> {
    const { error } = await this.client.auth.signInWithOtp({
      phone: input.phoneNumber,
      options: {
        shouldCreateUser: true,
        captchaToken: input.captchaToken,
      },
    });

    if (error) {
      throw new OtpProviderError("PROVIDER_UNAVAILABLE");
    }
  }

  async verifyOtp(input: {
    phoneNumber: string;
    code: string;
  }): Promise<{ userId: string }> {
    const { data, error } = await this.client.auth.verifyOtp({
      phone: input.phoneNumber,
      token: input.code,
      type: "sms",
    });

    if (error || !data.user) {
      throw error
        ? mapVerificationError(error)
        : new OtpProviderError("INVALID_OTP");
    }

    return { userId: data.user.id };
  }
}
