import { beforeEach, describe, expect, it, vi } from "vitest";

import { OtpProviderError } from "@/features/auth/otp-provider";

vi.mock("server-only", () => ({}));

const SECRET = "development-provider-secret-at-least-32-characters";

describe("DevelopmentOtpProvider", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    globalThis.__lecoDevelopmentOtpChallenges?.clear();
  });

  it("est strictement interdit en production", async () => {
    const { DevelopmentOtpProvider } =
      await import("@/features/auth/server/development-otp-provider");

    expect(
      () =>
        new DevelopmentOtpProvider({
          adminClient: {} as never,
          sessionClient: {} as never,
          code: "123456",
          secret: SECRET,
          production: true,
        }),
    ).toThrow(/interdit en production/i);
  });

  it("crée une identité locale puis une vraie session Supabase", async () => {
    const { DevelopmentOtpProvider } =
      await import("@/features/auth/server/development-otp-provider");
    const createUser = vi.fn().mockResolvedValue({ error: null });
    const signInWithPassword = vi.fn().mockResolvedValue({
      data: { user: { id: "local-user-id" } },
      error: null,
    });
    const provider = new DevelopmentOtpProvider({
      adminClient: { auth: { admin: { createUser } } } as never,
      sessionClient: { auth: { signInWithPassword } } as never,
      code: "123456",
      secret: SECRET,
      production: false,
    });

    await provider.requestOtp({ phoneNumber: "+2250701020304" });
    await expect(
      provider.verifyOtp({
        phoneNumber: "+2250701020304",
        code: "123456",
      }),
    ).resolves.toEqual({ userId: "local-user-id" });
    expect(createUser).toHaveBeenCalledOnce();
    expect(signInWithPassword).toHaveBeenCalledOnce();
  });

  it("refuse un OTP incorrect sans appeler Supabase", async () => {
    const { DevelopmentOtpProvider } =
      await import("@/features/auth/server/development-otp-provider");
    const signInWithPassword = vi.fn();
    const provider = new DevelopmentOtpProvider({
      adminClient: {
        auth: {
          admin: { createUser: vi.fn().mockResolvedValue({ error: null }) },
        },
      } as never,
      sessionClient: { auth: { signInWithPassword } } as never,
      code: "123456",
      secret: SECRET,
      production: false,
    });

    await provider.requestOtp({ phoneNumber: "+2250701020304" });
    await expect(
      provider.verifyOtp({
        phoneNumber: "+2250701020304",
        code: "000000",
      }),
    ).rejects.toMatchObject({ code: "INVALID_OTP" });
    expect(signInWithPassword).not.toHaveBeenCalled();
  });

  it("signale un code expiré si la session locale n’existe plus", async () => {
    const { DevelopmentOtpProvider } =
      await import("@/features/auth/server/development-otp-provider");
    let now = 1_000;
    const provider = new DevelopmentOtpProvider({
      adminClient: {
        auth: {
          admin: { createUser: vi.fn().mockResolvedValue({ error: null }) },
        },
      } as never,
      sessionClient: {
        auth: {
          signInWithPassword: vi.fn().mockResolvedValue({
            data: { user: null },
            error: { message: "Invalid credentials" },
          }),
        },
      } as never,
      code: "123456",
      secret: SECRET,
      production: false,
      now: () => now,
    });

    await provider.requestOtp({ phoneNumber: "+2250701020304" });
    now += 5 * 60 * 1_000 + 1;
    await expect(
      provider.verifyOtp({
        phoneNumber: "+2250701020304",
        code: "123456",
      }),
    ).rejects.toMatchObject({ code: "EXPIRED_OTP" });
  });

  it("ne journalise jamais le numéro ou le code", async () => {
    const { DevelopmentOtpProvider } =
      await import("@/features/auth/server/development-otp-provider");
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const error = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const provider = new DevelopmentOtpProvider({
      adminClient: { auth: { admin: { createUser: vi.fn() } } } as never,
      sessionClient: { auth: { signInWithPassword: vi.fn() } } as never,
      code: "123456",
      secret: SECRET,
      production: false,
    });

    await expect(
      provider.verifyOtp({
        phoneNumber: "+2250701020304",
        code: "000000",
      }),
    ).rejects.toBeInstanceOf(OtpProviderError);
    expect(log).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
  });
});

describe("EnvironmentCaptchaVerifier", () => {
  it("désactive le CAPTCHA uniquement hors production", async () => {
    const { EnvironmentCaptchaVerifier } =
      await import("@/features/auth/captcha");

    await expect(
      new EnvironmentCaptchaVerifier({
        provider: "disabled",
        production: false,
      }).verify(undefined),
    ).resolves.toBe(true);

    expect(
      () =>
        new EnvironmentCaptchaVerifier({
          provider: "disabled",
          production: true,
        }),
    ).toThrow(/interdit en production/i);
  });
});

describe("SupabaseOtpProvider", () => {
  it("demande puis vérifie un OTP valide", async () => {
    const { SupabaseOtpProvider } =
      await import("@/features/auth/server/supabase-otp-provider");
    const signInWithOtp = vi.fn().mockResolvedValue({ error: null });
    const verifyOtp = vi.fn().mockResolvedValue({
      data: { user: { id: "supabase-user-id" } },
      error: null,
    });
    const provider = new SupabaseOtpProvider({
      auth: { signInWithOtp, verifyOtp },
    } as never);

    await expect(
      provider.requestOtp({ phoneNumber: "+2250701020304" }),
    ).resolves.toBeUndefined();
    await expect(
      provider.verifyOtp({
        phoneNumber: "+2250701020304",
        code: "123456",
      }),
    ).resolves.toEqual({ userId: "supabase-user-id" });
  });

  it.each([
    ["Token has expired", "EXPIRED_OTP"],
    ["Token is invalid", "INVALID_OTP"],
  ])("traduit l’erreur %s", async (message, code) => {
    const { SupabaseOtpProvider } =
      await import("@/features/auth/server/supabase-otp-provider");
    const provider = new SupabaseOtpProvider({
      auth: {
        verifyOtp: vi.fn().mockResolvedValue({
          data: { user: null },
          error: { message },
        }),
      },
    } as never);

    await expect(
      provider.verifyOtp({
        phoneNumber: "+2250701020304",
        code: "123456",
      }),
    ).rejects.toMatchObject({ code });
  });
});
