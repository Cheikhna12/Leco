export interface RateLimitRequest {
  /**
   * A namespaced, opaque identifier. Use `createPrivateRateLimitKey` for phone
   * numbers, IP addresses and other personal identifiers.
   */
  key: string;
  limit: number;
  windowSeconds: number;
  cost?: number;
}

export interface RateLimitDecision {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

export type RateLimitOperation =
  | "otpRequest"
  | "otpVerification"
  | "locationUpdate"
  | "heartbeat"
  | "discovery"
  | "hello"
  | "message"
  | "report"
  | "photoUpload";

export const RATE_LIMIT_POLICIES = {
  otpRequest: { limit: 3, windowSeconds: 15 * 60 },
  otpVerification: { limit: 5, windowSeconds: 15 * 60 },
  locationUpdate: { limit: 60, windowSeconds: 60 },
  heartbeat: { limit: 20, windowSeconds: 60 },
  discovery: { limit: 30, windowSeconds: 60 },
  hello: { limit: 5, windowSeconds: 60 * 60 },
  message: { limit: 60, windowSeconds: 60 },
  report: { limit: 5, windowSeconds: 24 * 60 * 60 },
  photoUpload: { limit: 10, windowSeconds: 60 * 60 },
} as const satisfies Record<
  RateLimitOperation,
  Readonly<Pick<RateLimitRequest, "limit" | "windowSeconds">>
>;

/**
 * Production implementations must be atomic and shared between instances
 * (for example Redis or a transactional PostgreSQL function). No in-memory
 * implementation is provided because it is unsafe on serverless deployments.
 */
export interface RateLimitStore {
  consume(request: RateLimitRequest): Promise<RateLimitDecision>;
}

interface RateLimitRpcRow {
  allowed: boolean;
  remaining: number;
  reset_at: string;
}

export interface SupabaseRateLimitRpcClient {
  rpc(
    functionName: "consume_rate_limit",
    parameters: {
      p_cost: number;
      p_key: string;
      p_limit: number;
      p_window_seconds: number;
    },
  ): PromiseLike<{
    data: RateLimitRpcRow[] | null;
    error: { message: string } | null;
  }>;
}

/**
 * Server-only adapter for the service-role-only PostgreSQL RPC created by
 * migration 0003. Callers must pass an admin client and an HMAC-derived key.
 */
export class SupabaseRateLimitStore implements RateLimitStore {
  constructor(private readonly client: SupabaseRateLimitRpcClient) {}

  async consume(request: RateLimitRequest): Promise<RateLimitDecision> {
    const { data, error } = await this.client.rpc("consume_rate_limit", {
      p_cost: request.cost ?? 1,
      p_key: request.key,
      p_limit: request.limit,
      p_window_seconds: request.windowSeconds,
    });
    const result = data?.[0];

    if (error || !result) {
      throw new Error("Le service de limitation est indisponible.");
    }

    return {
      allowed: result.allowed,
      remaining: result.remaining,
      resetAt: new Date(result.reset_at),
    };
  }
}

export class RateLimitError extends Error {
  readonly status = 429;

  constructor(
    readonly retryAfterSeconds: number,
    readonly resetAt: Date,
  ) {
    super("Trop de tentatives. Réessaie plus tard.");
    this.name = "RateLimitError";
  }
}

export async function enforceRateLimit(
  store: RateLimitStore,
  request: RateLimitRequest,
): Promise<RateLimitDecision> {
  if (
    request.limit < 1 ||
    request.windowSeconds < 1 ||
    (request.cost !== undefined && request.cost < 1)
  ) {
    throw new TypeError("La configuration du rate limit est invalide.");
  }

  const decision = await store.consume(request);

  if (!decision.allowed) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((decision.resetAt.getTime() - Date.now()) / 1000),
    );
    throw new RateLimitError(retryAfterSeconds, decision.resetAt);
  }

  return decision;
}

export function createRateLimitRequest(
  operation: RateLimitOperation,
  key: string,
  cost = 1,
): RateLimitRequest {
  return {
    ...RATE_LIMIT_POLICIES[operation],
    cost,
    key,
  };
}

export async function createPrivateRateLimitKey(
  namespace: string,
  identifier: string,
  secret: string,
): Promise<string> {
  if (!namespace || !identifier || secret.length < 32) {
    throw new TypeError(
      "Le namespace, l’identifiant et un secret d’au moins 32 caractères sont requis.",
    );
  }

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(`${namespace}\u0000${identifier}`),
  );
  const encodedDigest = Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");

  return `${namespace}:${encodedDigest}`;
}
