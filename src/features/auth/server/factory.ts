import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

import { AuthenticationService } from "../auth-service";
import { EnvironmentCaptchaVerifier } from "../captcha";
import type { OtpProvider } from "../otp-provider";
import { DevelopmentOtpProvider } from "./development-otp-provider";
import { SupabaseOtpProvider } from "./supabase-otp-provider";
import {
  createPrivateRateLimitKey,
  SupabaseRateLimitStore,
  type SupabaseRateLimitRpcClient,
} from "@/lib/security/rate-limit";

function requiredServerValue(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Configuration serveur manquante: ${name}.`);
  }

  return value;
}

export async function createOtpProvider(): Promise<OtpProvider> {
  const sessionClient = await createClient();
  const smsProvider = process.env.SMS_PROVIDER || "supabase";
  const production = process.env.NODE_ENV === "production";

  if (smsProvider === "test") {
    if (production) {
      throw new Error("SMS_PROVIDER=test est interdit en production.");
    }

    return new DevelopmentOtpProvider({
      adminClient: createAdminClient(),
      sessionClient,
      code: requiredServerValue("DEVELOPMENT_OTP_CODE"),
      secret: requiredServerValue("RATE_LIMIT_HMAC_SECRET"),
      production,
    });
  }

  return new SupabaseOtpProvider(sessionClient);
}

export async function createAuthenticationService() {
  const secret = requiredServerValue("RATE_LIMIT_HMAC_SECRET");
  const adminClient = createAdminClient();

  // Validate the key before it reaches any request identifier.
  await createPrivateRateLimitKey("configuration-check", "auth", secret);

  return new AuthenticationService({
    provider: await createOtpProvider(),
    rateLimitStore: new SupabaseRateLimitStore(
      adminClient as unknown as SupabaseRateLimitRpcClient,
    ),
    rateLimitSecret: secret,
    captchaVerifier: new EnvironmentCaptchaVerifier({
      provider: process.env.CAPTCHA_PROVIDER,
      secret: process.env.CAPTCHA_SECRET_KEY,
      production: process.env.NODE_ENV === "production",
    }),
  });
}
