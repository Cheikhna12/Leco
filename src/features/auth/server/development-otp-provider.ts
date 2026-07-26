import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createPrivateRateLimitKey } from "@/lib/security/rate-limit";

import type { OtpProvider } from "../otp-provider";
import { OtpProviderError } from "../otp-provider";

type DevelopmentOtpProviderOptions = {
  adminClient: Pick<SupabaseClient, "auth">;
  sessionClient: Pick<SupabaseClient, "auth">;
  code: string;
  secret: string;
  production: boolean;
  now?: () => number;
};

const DEVELOPMENT_OTP_LIFETIME_MS = 5 * 60 * 1_000;

declare global {
  var __lecoDevelopmentOtpChallenges: Map<string, number> | undefined;
}

function getChallengeStore(): Map<string, number> {
  globalThis.__lecoDevelopmentOtpChallenges ??= new Map();
  return globalThis.__lecoDevelopmentOtpChallenges;
}

async function constantTimeEqual(
  left: string,
  right: string,
): Promise<boolean> {
  const encoder = new TextEncoder();
  const [leftDigest, rightDigest] = await Promise.all(
    [left, right].map((value) =>
      crypto.subtle.digest("SHA-256", encoder.encode(value)),
    ),
  );
  const leftBytes = new Uint8Array(leftDigest);
  const rightBytes = new Uint8Array(rightDigest);
  let difference = leftBytes.length ^ rightBytes.length;

  for (let index = 0; index < leftBytes.length; index += 1) {
    difference |= leftBytes[index]! ^ rightBytes[index]!;
  }

  return difference === 0;
}

export class DevelopmentOtpProvider implements OtpProvider {
  constructor(private readonly options: DevelopmentOtpProviderOptions) {
    if (options.production) {
      throw new Error(
        "Le fournisseur OTP de développement est interdit en production.",
      );
    }

    if (!/^\d{6}$/.test(options.code)) {
      throw new Error(
        "Le code OTP de développement doit contenir six chiffres.",
      );
    }
  }

  private async getCredentials(phoneNumber: string) {
    const accountKey = await createPrivateRateLimitKey(
      "development-otp-account",
      phoneNumber,
      this.options.secret,
    );
    const passwordKey = await createPrivateRateLimitKey(
      "development-otp-password",
      phoneNumber,
      this.options.secret,
    );
    const digest = accountKey.split(":")[1];

    return {
      challengeKey: accountKey,
      email: `${digest?.slice(0, 48)}@otp.leco.invalid`,
      password: passwordKey.split(":")[1]!,
    };
  }

  async requestOtp(input: { phoneNumber: string }): Promise<void> {
    const credentials = await this.getCredentials(input.phoneNumber);
    const { error } = await this.options.adminClient.auth.admin.createUser({
      email: credentials.email,
      password: credentials.password,
      email_confirm: true,
    });

    if (error && !/already|registered|exists|unique/i.test(error.message)) {
      throw new OtpProviderError("PROVIDER_UNAVAILABLE");
    }

    getChallengeStore().set(
      credentials.challengeKey,
      (this.options.now?.() ?? Date.now()) + DEVELOPMENT_OTP_LIFETIME_MS,
    );
  }

  async verifyOtp(input: {
    phoneNumber: string;
    code: string;
  }): Promise<{ userId: string }> {
    const credentials = await this.getCredentials(input.phoneNumber);
    const challengeStore = getChallengeStore();
    const expiresAt = challengeStore.get(credentials.challengeKey);

    if (!expiresAt || expiresAt <= (this.options.now?.() ?? Date.now())) {
      challengeStore.delete(credentials.challengeKey);
      throw new OtpProviderError("EXPIRED_OTP");
    }

    if (!(await constantTimeEqual(input.code, this.options.code))) {
      throw new OtpProviderError("INVALID_OTP");
    }

    const { data, error } =
      await this.options.sessionClient.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

    if (error || !data.user) {
      throw new OtpProviderError("EXPIRED_OTP");
    }

    challengeStore.delete(credentials.challengeKey);
    return { userId: data.user.id };
  }
}
