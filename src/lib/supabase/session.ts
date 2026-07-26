import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  ApplicationRole,
  AuthenticatedSession,
  SessionAssuranceLevel,
  SessionReader,
} from "@/features/auth/session-contract";
import type { Database } from "@/types/database";

import { createClient } from "./server";

type SessionSupabaseClient = Pick<SupabaseClient<Database>, "auth" | "rpc">;

function toRole(value: unknown): ApplicationRole {
  return value === "admin" || value === "moderator" ? value : "user";
}

function toAssuranceLevel(value: unknown): SessionAssuranceLevel {
  return value === "aal2" ? "aal2" : "aal1";
}

export async function readVerifiedSession(
  client: SessionSupabaseClient,
): Promise<AuthenticatedSession | null> {
  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const { data: sessionContext, error: profileError } = await client.rpc(
    "get_my_session_context",
  );
  const profile = sessionContext?.[0];

  if (profileError) {
    throw new Error("Impossible de vérifier l’état du profil.");
  }

  const [sessionResult, claimsResult] = await Promise.all([
    client.auth.getSession(),
    client.auth.getClaims(),
  ]);
  const jwt = sessionResult.data.session;
  const claims = claimsResult.data?.claims;

  return {
    userId: user.id,
    role: toRole(user.app_metadata.role),
    assuranceLevel: toAssuranceLevel(claims?.aal),
    accountState:
      profile?.account_status === "suspended" ? "suspended" : "active",
    profileState: profile?.is_profile_complete ? "complete" : "incomplete",
    expiresAt: jwt?.expires_at ? new Date(jwt.expires_at * 1000) : null,
  };
}

export class SupabaseSessionReader implements SessionReader {
  async getSession(): Promise<AuthenticatedSession | null> {
    return readVerifiedSession(await createClient());
  }
}

export async function getServerSession(): Promise<AuthenticatedSession | null> {
  return new SupabaseSessionReader().getSession();
}
