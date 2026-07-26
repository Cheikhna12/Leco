import { describe, expect, it, vi } from "vitest";

import {
  createRateLimitRequest,
  createPrivateRateLimitKey,
  enforceRateLimit,
  RATE_LIMIT_POLICIES,
  RateLimitError,
  SupabaseRateLimitStore,
  type RateLimitStore,
} from "@/lib/security";

describe("rate limit primitives", () => {
  it("delegates atomic consumption to an injected durable store", async () => {
    const consume = vi.fn().mockResolvedValue({
      allowed: true,
      remaining: 4,
      resetAt: new Date("2026-01-01T00:01:00.000Z"),
    });
    const store: RateLimitStore = { consume };

    await expect(
      enforceRateLimit(store, {
        key: "hello:user-hash",
        limit: 5,
        windowSeconds: 3_600,
      }),
    ).resolves.toMatchObject({ allowed: true, remaining: 4 });
    expect(consume).toHaveBeenCalledOnce();
  });

  it("returns retry metadata when a durable store rejects a request", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:30.000Z"));
    const resetAt = new Date("2026-01-01T00:01:00.000Z");
    const store: RateLimitStore = {
      consume: vi.fn().mockResolvedValue({
        allowed: false,
        remaining: 0,
        resetAt,
      }),
    };

    await expect(
      enforceRateLimit(store, {
        key: "otp:phone-hash",
        limit: 3,
        windowSeconds: 900,
      }),
    ).rejects.toEqual(new RateLimitError(30, resetAt));
    vi.useRealTimers();
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

  it("defines distinct policies for every sensitive operation", () => {
    expect(Object.keys(RATE_LIMIT_POLICIES).sort()).toEqual(
      [
        "discovery",
        "heartbeat",
        "hello",
        "locationUpdate",
        "message",
        "otpRequest",
        "otpVerification",
        "photoUpload",
        "report",
      ].sort(),
    );
    expect(createRateLimitRequest("message", "message:hash")).toEqual({
      ...RATE_LIMIT_POLICIES.message,
      cost: 1,
      key: "message:hash",
    });
  });

  it("adapts the service-role-only PostgreSQL RPC", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: [
        {
          allowed: true,
          remaining: 2,
          reset_at: "2026-01-01T00:01:00.000Z",
        },
      ],
      error: null,
    });
    const store = new SupabaseRateLimitStore({ rpc });

    await expect(
      store.consume({
        key: `message:${"a".repeat(64)}`,
        limit: 3,
        windowSeconds: 60,
      }),
    ).resolves.toEqual({
      allowed: true,
      remaining: 2,
      resetAt: new Date("2026-01-01T00:01:00.000Z"),
    });
    expect(rpc).toHaveBeenCalledWith("consume_rate_limit", {
      p_cost: 1,
      p_key: `message:${"a".repeat(64)}`,
      p_limit: 3,
      p_window_seconds: 60,
    });
  });
});
