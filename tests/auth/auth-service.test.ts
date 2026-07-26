import { describe, expect, it, vi } from "vitest";

import {
  AuthenticationService,
  CaptchaRequiredError,
} from "@/features/auth/auth-service";
import type { CaptchaVerifier } from "@/features/auth/captcha";
import type { OtpProvider } from "@/features/auth/otp-provider";
import type {
  RateLimitDecision,
  RateLimitRequest,
  RateLimitStore,
} from "@/lib/security/rate-limit";
import { RateLimitError } from "@/lib/security/rate-limit";

const SECRET = "wave-2-test-secret-with-at-least-32-characters";

class MemoryRateLimitStore implements RateLimitStore {
  private readonly buckets = new Map<string, number>();

  async consume(request: RateLimitRequest): Promise<RateLimitDecision> {
    const consumed = (this.buckets.get(request.key) ?? 0) + (request.cost ?? 1);
    this.buckets.set(request.key, consumed);

    return {
      allowed: consumed <= request.limit,
      remaining: Math.max(0, request.limit - consumed),
      resetAt: new Date(Date.now() + request.windowSeconds * 1_000),
    };
  }
}

class SequenceRateLimitStore implements RateLimitStore {
  constructor(private readonly decisions: RateLimitDecision[]) {}

  async consume(): Promise<RateLimitDecision> {
    const decision = this.decisions.shift();
    if (!decision) {
      throw new Error("Décision manquante");
    }
    return decision;
  }
}

function allowed(remaining: number): RateLimitDecision {
  return {
    allowed: true,
    remaining,
    resetAt: new Date(Date.now() + 60_000),
  };
}

function createService(
  store: RateLimitStore,
  captchaVerifier: CaptchaVerifier = {
    verify: vi.fn().mockResolvedValue(true),
  },
) {
  const provider: OtpProvider = {
    requestOtp: vi.fn().mockResolvedValue(undefined),
    verifyOtp: vi.fn().mockResolvedValue({ userId: "user-id" }),
  };

  return {
    provider,
    service: new AuthenticationService({
      provider,
      rateLimitStore: store,
      captchaVerifier,
      rateLimitSecret: SECRET,
    }),
  };
}

describe("protections OTP", () => {
  const request = {
    phoneNumber: "+2250701020304",
    consent: true as const,
  };

  it("applique un délai entre deux demandes", async () => {
    const { service } = createService(new MemoryRateLimitStore());
    await expect(service.requestOtp(request, "192.0.2.1")).resolves.toEqual({
      accepted: true,
    });
    await expect(
      service.requestOtp(request, "192.0.2.1"),
    ).rejects.toBeInstanceOf(RateLimitError);
  });

  it("bloque les essais de vérification au-delà de la limite", async () => {
    const { service } = createService(new MemoryRateLimitStore());
    const verification = {
      phoneNumber: request.phoneNumber,
      code: "123456",
    };

    for (let attempt = 0; attempt < 5; attempt += 1) {
      await expect(
        service.verifyOtp(verification, "192.0.2.1"),
      ).resolves.toEqual({ userId: "user-id" });
    }

    await expect(
      service.verifyOtp(verification, "192.0.2.1"),
    ).rejects.toBeInstanceOf(RateLimitError);
  });

  it("exige un CAPTCHA après un comportement anormal", async () => {
    const captchaVerifier = { verify: vi.fn().mockResolvedValue(false) };
    const { provider, service } = createService(
      new SequenceRateLimitStore([allowed(1), allowed(0)]),
      captchaVerifier,
    );

    await expect(
      service.requestOtp(request, "192.0.2.1"),
    ).rejects.toBeInstanceOf(CaptchaRequiredError);
    expect(provider.requestOtp).not.toHaveBeenCalled();
  });

  it("accepte la demande anormale avec un CAPTCHA valide", async () => {
    const captchaVerifier = { verify: vi.fn().mockResolvedValue(true) };
    const { provider, service } = createService(
      new SequenceRateLimitStore([allowed(1), allowed(0)]),
      captchaVerifier,
    );

    await expect(
      service.requestOtp(
        { ...request, captchaToken: "verified-token" },
        "192.0.2.1",
      ),
    ).resolves.toEqual({ accepted: true });
    expect(provider.requestOtp).toHaveBeenCalledOnce();
  });
});
