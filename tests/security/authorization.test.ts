import { describe, expect, it } from "vitest";

import {
  AuthorizationError,
  requireActiveMatchMember,
  requireAdminMfa,
  requireAuthenticated,
  requireModerationPermission,
  requireOwnership,
  type SessionIdentity,
} from "@/lib/security";

const user: SessionIdentity = {
  userId: "7c3d7584-f5ec-4da5-8e72-e41cad0b4df8",
  role: "user",
  aal: "aal1",
  isSuspended: false,
};

describe("authorization primitives", () => {
  it("rejects missing and suspended sessions", () => {
    expect(() => requireAuthenticated(null)).toThrowError(
      expect.objectContaining({ code: "AUTHENTICATION_REQUIRED", status: 401 }),
    );
    expect(() =>
      requireAuthenticated({ ...user, isSuspended: true }),
    ).toThrowError(
      expect.objectContaining({ code: "ACCOUNT_SUSPENDED", status: 403 }),
    );
  });

  it("enforces ownership", () => {
    expect(requireOwnership(user, user.userId)).toBe(user);
    expect(() => requireOwnership(user, crypto.randomUUID())).toThrowError(
      AuthorizationError,
    );
  });

  it("requires both an administrator role and aal2", () => {
    expect(() =>
      requireAdminMfa({ ...user, role: "admin", aal: "aal1" }),
    ).toThrowError(expect.objectContaining({ code: "ADMIN_MFA_REQUIRED" }));
    expect(() =>
      requireAdminMfa({ ...user, role: "user", aal: "aal2" }),
    ).toThrowError(expect.objectContaining({ code: "ADMIN_MFA_REQUIRED" }));

    const admin: SessionIdentity = {
      ...user,
      role: "admin",
      aal: "aal2",
    };
    expect(requireAdminMfa(admin)).toBe(admin);
  });

  it("scopes moderator permissions and requires aal2", () => {
    const moderator: SessionIdentity = {
      ...user,
      aal: "aal2",
      permissions: ["reports:read"],
      role: "moderator",
    };

    expect(requireModerationPermission(moderator, "reports:read")).toBe(
      moderator,
    );
    expect(() =>
      requireModerationPermission(moderator, "reports:write"),
    ).toThrowError(expect.objectContaining({ code: "MODERATOR_MFA_REQUIRED" }));
    expect(() =>
      requireModerationPermission(
        { ...moderator, aal: "aal1" },
        "reports:read",
      ),
    ).toThrowError(expect.objectContaining({ code: "MODERATOR_MFA_REQUIRED" }));
  });

  it("authorizes only active, unblocked match members", () => {
    const match = {
      firstUserId: user.userId,
      secondUserId: crypto.randomUUID(),
      status: "active" as const,
      hasBlock: false,
    };

    expect(requireActiveMatchMember(user, match)).toBe(user);
    expect(() =>
      requireActiveMatchMember(user, { ...match, hasBlock: true }),
    ).toThrowError(expect.objectContaining({ code: "MATCH_UNAVAILABLE" }));
    expect(() =>
      requireActiveMatchMember({ ...user, userId: crypto.randomUUID() }, match),
    ).toThrowError(expect.objectContaining({ code: "MATCH_UNAVAILABLE" }));
  });
});
