/**
 * Stable Wave 2 authentication boundary.
 *
 * Onboarding and presence code must depend on this contract instead of reading
 * Supabase cookies or JWT claims directly.
 */
export type AccountAccessState = "active" | "suspended";
export type ProfileCompletionState = "complete" | "incomplete";
export type ApplicationRole = "user" | "moderator" | "admin";
export type SessionAssuranceLevel = "aal1" | "aal2";

export interface AuthenticatedSession {
  userId: string;
  role: ApplicationRole;
  assuranceLevel: SessionAssuranceLevel;
  accountState: AccountAccessState;
  profileState: ProfileCompletionState;
  expiresAt: Date | null;
}

export interface SessionReader {
  getSession(): Promise<AuthenticatedSession | null>;
}

export type SessionDestination =
  "/" | "/connexion" | "/onboarding" | "/acces-restreint";

export function getPostAuthenticationDestination(
  session: AuthenticatedSession,
): SessionDestination {
  if (session.accountState === "suspended") {
    return "/acces-restreint";
  }

  return session.profileState === "complete" ? "/" : "/onboarding";
}
