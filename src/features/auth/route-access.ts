import {
  getPostAuthenticationDestination,
  type AuthenticatedSession,
  type SessionDestination,
} from "./session-contract";

const PROTECTED_PREFIXES = ["/onboarding", "/profil", "/presence"] as const;
const AUTH_ROUTES = ["/connexion", "/verification-otp"] as const;

export type RouteAccessDecision =
  { allowed: true } | { allowed: false; destination: SessionDestination };

function startsWithRoute(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => startsWithRoute(pathname, prefix));
}

export function resolveRouteAccess(
  pathname: string,
  session: AuthenticatedSession | null,
): RouteAccessDecision {
  const isAuthRoute = AUTH_ROUTES.some((route) =>
    startsWithRoute(pathname, route),
  );

  if (!session) {
    return isProtectedRoute(pathname)
      ? { allowed: false, destination: "/connexion" }
      : { allowed: true };
  }

  if (session.accountState === "suspended") {
    return startsWithRoute(pathname, "/acces-restreint")
      ? { allowed: true }
      : { allowed: false, destination: "/acces-restreint" };
  }

  if (isAuthRoute) {
    return {
      allowed: false,
      destination: getPostAuthenticationDestination(session),
    };
  }

  if (session.profileState === "incomplete") {
    return startsWithRoute(pathname, "/onboarding")
      ? { allowed: true }
      : isProtectedRoute(pathname)
        ? { allowed: false, destination: "/onboarding" }
        : { allowed: true };
  }

  if (startsWithRoute(pathname, "/onboarding")) {
    return { allowed: false, destination: "/" };
  }

  return { allowed: true };
}
