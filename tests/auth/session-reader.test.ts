import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

describe("lecture de session Supabase", () => {
  it("assemble une session vérifiée et l’état du profil", async () => {
    const { readVerifiedSession } = await import("@/lib/supabase/session");
    const rpc = vi.fn().mockResolvedValue({
      data: [
        {
          user_id: "verified-user-id",
          account_status: "active",
          is_profile_complete: false,
        },
      ],
      error: null,
    });
    const client = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: "verified-user-id",
              app_metadata: { role: "moderator" },
            },
          },
          error: null,
        }),
        getClaims: vi.fn().mockResolvedValue({
          data: { claims: { aal: "aal2" } },
          error: null,
        }),
        getSession: vi.fn().mockResolvedValue({
          data: {
            session: {
              expires_at: 2_000_000_000,
            },
          },
          error: null,
        }),
      },
      rpc,
    };

    await expect(readVerifiedSession(client as never)).resolves.toMatchObject({
      userId: "verified-user-id",
      role: "moderator",
      assuranceLevel: "aal2",
      accountState: "active",
      profileState: "incomplete",
    });
  });

  it("retourne null quand le JWT n’est pas vérifié", async () => {
    const { readVerifiedSession } = await import("@/lib/supabase/session");
    const client = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: { message: "expired" },
        }),
      },
    };

    await expect(readVerifiedSession(client as never)).resolves.toBeNull();
  });

  it.each(["deactivated", "pending_deletion", "suspended", undefined])(
    "restreint par défaut un profil au statut %s",
    async (accountStatus) => {
      const { readVerifiedSession } = await import("@/lib/supabase/session");
      const client = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: {
              user: { id: "restricted-user", app_metadata: {} },
            },
            error: null,
          }),
          getClaims: vi.fn().mockResolvedValue({
            data: { claims: { aal: "aal1" } },
            error: null,
          }),
          getSession: vi.fn().mockResolvedValue({
            data: { session: { expires_at: 2_000_000_000 } },
            error: null,
          }),
        },
        rpc: vi.fn().mockResolvedValue({
          data:
            accountStatus === undefined
              ? []
              : [
                  {
                    account_status: accountStatus,
                    is_profile_complete: true,
                  },
                ],
          error: null,
        }),
      };

      await expect(readVerifiedSession(client as never)).resolves.toMatchObject(
        {
          accountState: "suspended",
        },
      );
    },
  );
});
