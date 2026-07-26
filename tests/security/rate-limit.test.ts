import { describe, expect, it, vi } from "vitest";

import {
  createPrivateRateLimitKey,
  enforceRateLimit,
  RateLimitError,
  type RateLimitStore,
} from "@/lib/security";

describe("rate limit primitives", () => {
  it("delegates atomic consumption to an injected durable store", async () => {
    const consume = vi.fn().mockResolvedValue({
      allowed: true,
      remaining: 4,
      retryAfterMs: 0,
      resetAt: new Date("2026-01-01T00:01:00.000Z"),
    });
    const store: RateLimitStore = { consume };

    await expect(
      enforceRateLimit(store, {
        key: "hello:user-hash",
        limit: 5,
        windowMs: 3_600_000,
      }),
    ).resolves.toMatchObject({ allowed: true, remaining: 4 });
    expect(consume).toHaveBeenCalledOnce();
  });

  it("returns retry metadata when a durable store rejects a request", async () => {
    const resetAt = new Date("2026-01-01T00:01:00.000Z");
    const store: RateLimitStore = {
      consume: vi.fn().mockResolvedValue({
        allowed: false,
        remaining: 0,
        retryAfterMs: 30_000,
        resetAt,
      }),
    };

    await expect(
      enforceRateLimit(store, {
        key: "otp:phone-hash",
        limit: 3,
        windowMs: 900_000,
      }),
    ).rejects.toEqual(new RateLimitError(30_000, resetAt));
  });

  it("HMAC-hashes personal identifiers before storage", async () => {
    const phone = "+2250102030405";
    const key = await createPrivateRateLimitKey(
      "otp",
      phone,
      "a-development-only-secret-that-is-long-enough",
    );

    expect(key).toMatch(/^otp:[a-f0-9]{64}$/);
    expect(key).not.toContain(phone);
  });
});
