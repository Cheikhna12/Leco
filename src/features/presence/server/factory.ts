import "server-only";

import { getServerSession } from "@/lib/supabase/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  SupabaseRateLimitStore,
  type SupabaseRateLimitRpcClient,
} from "@/lib/security/rate-limit";

import { PresenceService, type PresenceRpcClient } from "./service";

export async function createPresenceService(): Promise<PresenceService> {
  const secret = process.env.RATE_LIMIT_HMAC_SECRET;

  if (!secret) {
    throw new Error("RATE_LIMIT_HMAC_SECRET est absent.");
  }

  const [session, client] = await Promise.all([
    getServerSession(),
    createClient(),
  ]);
  const adminClient = createAdminClient();

  return new PresenceService({
    session,
    client: client as unknown as PresenceRpcClient,
    rateLimitStore: new SupabaseRateLimitStore(
      adminClient as unknown as SupabaseRateLimitRpcClient,
    ),
    rateLimitSecret: secret,
  });
}
