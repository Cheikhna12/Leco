/**
 * Authorization primitives for server-side Route Handlers and Server Actions.
 *
 * `SessionIdentity` must be assembled from a Supabase-verified session/JWT. Never
 * populate `role`, `aal` or `isSuspended` from request JSON, query parameters or
 * other client-controlled values.
 */
export type AssuranceLevel = "aal1" | "aal2";

export interface SessionIdentity {
  userId: string;
  role: "user" | "moderator" | "admin";
  aal: AssuranceLevel;
  isSuspended: boolean;
}

export interface MatchAuthorizationContext {
  firstUserId: string;
  secondUserId: string;
  status: "active" | "closed";
  hasBlock: boolean;
}

export type AuthorizationErrorCode =
  | "AUTHENTICATION_REQUIRED"
  | "ACCOUNT_SUSPENDED"
  | "FORBIDDEN"
  | "ADMIN_MFA_REQUIRED"
  | "MATCH_UNAVAILABLE";

export class AuthorizationError extends Error {
  readonly status: 401 | 403;

  constructor(
    readonly code: AuthorizationErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "AuthorizationError";
    this.status = code === "AUTHENTICATION_REQUIRED" ? 401 : 403;
  }
}

export function requireAuthenticated(
  identity: SessionIdentity | null | undefined,
): SessionIdentity {
  if (!identity) {
    throw new AuthorizationError(
      "AUTHENTICATION_REQUIRED",
      "Une session authentifiée est requise.",
    );
  }

  if (identity.isSuspended) {
    throw new AuthorizationError(
      "ACCOUNT_SUSPENDED",
      "Ce compte est suspendu.",
    );
  }

  return identity;
}

export function requireOwnership(
  identity: SessionIdentity | null | undefined,
  resourceOwnerId: string,
): SessionIdentity {
  const authenticatedIdentity = requireAuthenticated(identity);

  if (authenticatedIdentity.userId !== resourceOwnerId) {
    throw new AuthorizationError(
      "FORBIDDEN",
      "Cette ressource ne vous appartient pas.",
    );
  }

  return authenticatedIdentity;
}

export function requireAdminMfa(
  identity: SessionIdentity | null | undefined,
): SessionIdentity {
  const authenticatedIdentity = requireAuthenticated(identity);

  if (
    authenticatedIdentity.role !== "admin" ||
    authenticatedIdentity.aal !== "aal2"
  ) {
    // A single response prevents callers from inferring whether the role or MFA
    // check failed.
    throw new AuthorizationError(
      "ADMIN_MFA_REQUIRED",
      "Un accès administrateur avec MFA est requis.",
    );
  }

  return authenticatedIdentity;
}

export function requireActiveMatchMember(
  identity: SessionIdentity | null | undefined,
  match: MatchAuthorizationContext,
): SessionIdentity {
  const authenticatedIdentity = requireAuthenticated(identity);
  const isMember =
    authenticatedIdentity.userId === match.firstUserId ||
    authenticatedIdentity.userId === match.secondUserId;

  if (!isMember || match.status !== "active" || match.hasBlock) {
    throw new AuthorizationError(
      "MATCH_UNAVAILABLE",
      "Cette conversation n’est pas disponible.",
    );
  }

  return authenticatedIdentity;
}
