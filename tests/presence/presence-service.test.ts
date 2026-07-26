import { describe, expect, it, vi } from "vitest";

import type { AuthenticatedSession } from "@/features/auth/session-contract";
import {
  PresenceService,
  type PresenceRpcClient,
} from "@/features/presence/server/service";
import type { RateLimitStore } from "@/lib/security/rate-limit";

vi.mock("server-only", () => ({}));

const ACTIVE_SESSION: AuthenticatedSession = {
  accountState: "active",
  assuranceLevel: "aal1",
  expiresAt: new Date(Date.now() + 60_000),
  profileState: "complete",
  role: "user",
  userId: "00000000-0000-4000-8000-000000000001",
};

function createService({
  session = ACTIVE_SESSION,
  rpc = vi.fn().mockResolvedValue({ data: null, error: null }),
}: {
  session?: AuthenticatedSession | null;
  rpc?: ReturnType<typeof vi.fn>;
} = {}) {
  const rateLimitStore: RateLimitStore = {
    consume: vi.fn().mockResolvedValue({
      allowed: true,
      remaining: 8,
      resetAt: new Date(Date.now() + 60_000),
    }),
  };
  const service = new PresenceService({
    client: { rpc: rpc as unknown as PresenceRpcClient["rpc"] },
    rateLimitSecret: "s".repeat(32),
    rateLimitStore,
    session,
  });

  return { rateLimitStore, rpc, service };
}

describe("PresenceService", () => {
  it("écrit uniquement la position de l’utilisateur de session via RPC", async () => {
    const { rpc, service } = createService();

    await expect(
      service.updateLocation({
        accuracy: 20,
        capturedAt: new Date().toISOString(),
        latitude: 5.3364,
        longitude: -4.0267,
      }),
    ).resolves.toEqual({
      locationStatus: "AVAILABLE",
      updated: true,
    });

    expect(rpc).toHaveBeenCalledWith("update_my_location", {
      p_accuracy_m: 20,
      p_latitude: 5.3364,
      p_longitude: -4.0267,
    });
    expect(rpc.mock.calls[0]?.[1]).not.toHaveProperty("user_id");
  });

  it("ne retourne aucune coordonnée", async () => {
    const { service } = createService();
    const response = await service.updateLocation({
      accuracy: 20,
      capturedAt: new Date().toISOString(),
      latitude: 5.3364,
      longitude: -4.0267,
    });

    expect(JSON.stringify(response)).toBe(
      '{"updated":true,"locationStatus":"AVAILABLE"}',
    );
    expect(JSON.stringify(response)).not.toMatch(
      /latitude|longitude|accuracy|coordinates|5\.3364|-4\.0267/i,
    );
  });

  it("refuse une session absente ou suspendue avant la RPC", async () => {
    for (const session of [
      null,
      { ...ACTIVE_SESSION, accountState: "suspended" as const },
    ]) {
      const { rpc, service } = createService({ session });

      await expect(
        service.updateLocation({
          accuracy: 20,
          capturedAt: new Date().toISOString(),
          latitude: 5.3364,
          longitude: -4.0267,
        }),
      ).rejects.toMatchObject({ status: session ? 403 : 401 });
      expect(rpc).not.toHaveBeenCalled();
    }
  });

  it("refuse l’activation d’un profil incomplet", async () => {
    const { rpc, service } = createService({
      session: { ...ACTIVE_SESSION, profileState: "incomplete" },
    });

    await expect(
      service.activate({ durationMinutes: 60, mood: "discuter" }),
    ).rejects.toMatchObject({ status: 403 });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("propage un refus RPC lorsque la position valide est absente", async () => {
    const { service } = createService({
      rpc: vi.fn().mockResolvedValue({
        data: null,
        error: { message: "presence activation is not allowed" },
      }),
    });

    await expect(
      service.activate({ durationMinutes: 60, mood: "sortir" }),
    ).rejects.toMatchObject({ status: 403 });
  });

  it("active avec un mood partagé et une durée bornée", async () => {
    const rpc = vi
      .fn()
      .mockResolvedValue({ data: "2026-07-26T21:00:00.000Z", error: null });
    const { service } = createService({ rpc });

    await expect(
      service.activate({ durationMinutes: 60, mood: "sport" }),
    ).resolves.toMatchObject({
      active: true,
      mood: "sport",
      status: "AVAILABLE",
    });
  });

  it("rend la désactivation idempotente", async () => {
    const { rpc, service } = createService();

    await service.deactivate();
    await service.deactivate();

    expect(rpc).toHaveBeenCalledTimes(2);
    expect(rpc).toHaveBeenLastCalledWith("deactivate_presence", {
      p_hidden: false,
    });
  });
});
