import "server-only";

import type { AuthenticatedSession } from "@/features/auth/session-contract";
import type {
  ActivatePresenceInput,
  LocationUpdateInput,
  Mood,
  PresenceSnapshot,
} from "@/features/presence/domain";
import { AppError } from "@/lib/errors/app-error";
import {
  createPrivateRateLimitKey,
  createRateLimitRequest,
  enforceRateLimit,
  type RateLimitOperation,
  type RateLimitStore,
} from "@/lib/security/rate-limit";

interface RpcResult<T> {
  data: T | null;
  error: { message: string } | null;
}

export interface PresenceRpcClient {
  rpc(
    name:
      | "activate_presence"
      | "deactivate_presence"
      | "get_my_presence"
      | "heartbeat_presence"
      | "update_my_location",
    args?: Readonly<Record<string, unknown>>,
  ): PromiseLike<RpcResult<unknown>>;
}

interface PresenceRow {
  availability_status: "available" | "hidden" | "offline";
  available_until: string | null;
  mood: Mood | null;
}

export interface PresenceServiceDependencies {
  session: AuthenticatedSession | null;
  client: PresenceRpcClient;
  rateLimitStore: RateLimitStore;
  rateLimitSecret: string;
}

function requireUsableSession(
  session: AuthenticatedSession | null,
): AuthenticatedSession {
  if (!session || (session.expiresAt && session.expiresAt <= new Date())) {
    throw new AppError(
      "AUTHENTICATION_REQUIRED",
      "Reconnecte-toi pour continuer.",
      401,
    );
  }

  if (session.accountState === "suspended") {
    throw new AppError(
      "FORBIDDEN",
      "Cette action n’est pas disponible pour ce compte.",
      403,
    );
  }

  return session;
}

function requireCompleteProfile(
  session: AuthenticatedSession,
): AuthenticatedSession {
  if (session.profileState !== "complete") {
    throw new AppError(
      "FORBIDDEN",
      "Termine ton profil avant d’activer ta présence.",
      403,
    );
  }

  return session;
}

function assertRpcSucceeded(error: { message: string } | null): void {
  if (error) {
    throw new AppError(
      "FORBIDDEN",
      "Cette action n’a pas pu être effectuée.",
      403,
    );
  }
}

export class PresenceService {
  constructor(private readonly dependencies: PresenceServiceDependencies) {}

  private async limit(operation: RateLimitOperation): Promise<void> {
    const session = requireUsableSession(this.dependencies.session);
    const key = await createPrivateRateLimitKey(
      operation,
      session.userId,
      this.dependencies.rateLimitSecret,
    );

    await enforceRateLimit(
      this.dependencies.rateLimitStore,
      createRateLimitRequest(operation, key),
    );
  }

  async updateLocation(input: LocationUpdateInput) {
    requireUsableSession(this.dependencies.session);
    await this.limit("locationUpdate");

    const { error } = await this.dependencies.client.rpc("update_my_location", {
      p_accuracy_m: input.accuracy,
      p_latitude: input.latitude,
      p_longitude: input.longitude,
    });
    assertRpcSucceeded(error);

    return { updated: true as const, locationStatus: "AVAILABLE" as const };
  }

  async activate(input: ActivatePresenceInput) {
    requireCompleteProfile(requireUsableSession(this.dependencies.session));
    await this.limit("presenceChange");

    const { data, error } = await this.dependencies.client.rpc(
      "activate_presence",
      {
        p_duration_minutes: input.durationMinutes,
        p_mood: input.mood,
      },
    );
    assertRpcSucceeded(error);

    return {
      active: true as const,
      status: "AVAILABLE" as const,
      mood: input.mood,
      availableUntil: typeof data === "string" ? data : null,
    };
  }

  async deactivate() {
    requireUsableSession(this.dependencies.session);
    await this.limit("presenceChange");

    const { error } = await this.dependencies.client.rpc(
      "deactivate_presence",
      { p_hidden: false },
    );
    assertRpcSucceeded(error);

    return { active: false as const, status: "OFFLINE" as const };
  }

  async heartbeat() {
    requireCompleteProfile(requireUsableSession(this.dependencies.session));
    await this.limit("heartbeat");

    const { data, error } =
      await this.dependencies.client.rpc("heartbeat_presence");
    assertRpcSucceeded(error);

    return {
      active: true as const,
      status: "AVAILABLE" as const,
      availableUntil: typeof data === "string" ? data : null,
    };
  }

  async getSnapshot(): Promise<PresenceSnapshot> {
    requireUsableSession(this.dependencies.session);

    const { data, error } =
      await this.dependencies.client.rpc("get_my_presence");
    assertRpcSucceeded(error);
    const row = Array.isArray(data)
      ? (data[0] as PresenceRow | undefined)
      : undefined;
    const active =
      row?.availability_status === "available" &&
      Boolean(row.available_until) &&
      Date.parse(row.available_until ?? "") > Date.now();

    return {
      status: active
        ? "AVAILABLE"
        : row?.availability_status === "hidden"
          ? "HIDDEN"
          : "OFFLINE",
      mood: active ? (row?.mood ?? null) : null,
      availableUntil: active ? (row?.available_until ?? null) : null,
    };
  }
}
