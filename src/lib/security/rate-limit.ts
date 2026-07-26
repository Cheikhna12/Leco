export interface RateLimitRequest {
  /**
   * A namespaced, opaque identifier. Use `createPrivateRateLimitKey` for phone
   * numbers, IP addresses and other personal identifiers.
   */
  key: string;
  limit: number;
  windowMs: number;
  cost?: number;
}

export interface RateLimitDecision {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
  resetAt: Date;
}

/**
 * Production implementations must be atomic and shared between instances
 * (for example Redis or a transactional PostgreSQL function). No in-memory
 * implementation is provided because it is unsafe on serverless deployments.
 */
export interface RateLimitStore {
  consume(request: RateLimitRequest): Promise<RateLimitDecision>;
}

export class RateLimitError extends Error {
  readonly status = 429;

  constructor(
    readonly retryAfterMs: number,
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
    request.windowMs < 1 ||
    (request.cost !== undefined && request.cost < 1)
  ) {
    throw new TypeError("La configuration du rate limit est invalide.");
  }

  const decision = await store.consume(request);

  if (!decision.allowed) {
    throw new RateLimitError(decision.retryAfterMs, decision.resetAt);
  }

  return decision;
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
