import type { NextRequest } from "next/server";

import { assertSameOrigin } from "@/features/auth/server/request";
import { authJson, toAuthErrorResponse } from "@/features/auth/server/response";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const supabase = await createClient();
    await supabase.auth.signOut({ scope: "local" });

    return authJson({ signedOut: true });
  } catch (error) {
    return toAuthErrorResponse(error);
  }
}
