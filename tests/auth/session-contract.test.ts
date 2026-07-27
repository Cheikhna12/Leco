import { describe, expect, it } from "vitest";

import {
  getPostAuthenticationDestination,
  type AuthenticatedSession,
} from "@/features/auth/session-contract";
import { resolveRouteAccess } from "@/features/auth/route-access";

function session(
  overrides: Partial<AuthenticatedSession> = {},
): AuthenticatedSession {
  return {
    userId: "7f5c7ee3-8604-44d1-8a53-af9d8f606f11",
    role: "user",
    assuranceLevel: "aal1",
    accountState: "active",
    profileState: "complete",
    expiresAt: null,
    ...overrides,
  };
}

describe("contrat de session", () => {
  it("redirige un profil incomplet vers l’onboarding", () => {
    const current = session({ profileState: "incomplete" });
    expect(getPostAuthenticationDestination(current)).toBe("/onboarding");
    expect(resolveRouteAccess("/presence", current)).toEqual({
      allowed: false,
      destination: "/onboarding",
    });
  });

  it("redirige un compte suspendu vers l’accès restreint", () => {
    const current = session({ accountState: "suspended" });
    expect(getPostAuthenticationDestination(current)).toBe("/acces-restreint");
    expect(resolveRouteAccess("/", current)).toEqual({
      allowed: false,
      destination: "/acces-restreint",
    });
  });

  it("protège une route sans session", () => {
    expect(resolveRouteAccess("/presence", null)).toEqual({
      allowed: false,
      destination: "/connexion",
    });
  });

  it("autorise un profil incomplet sur l’onboarding uniquement", () => {
    const current = session({ profileState: "incomplete" });
    expect(resolveRouteAccess("/onboarding/photos", current)).toEqual({
      allowed: true,
    });
  });

  it("éloigne un profil complet de l’onboarding", () => {
    expect(resolveRouteAccess("/onboarding", session())).toEqual({
      allowed: false,
      destination: "/",
    });
  });
});
