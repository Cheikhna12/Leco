import type { NextRequest } from "next/server";

import { assertSameOrigin } from "@/features/auth/server/request";
import { authJson, toAuthErrorResponse } from "@/features/auth/server/response";
import { getServerSession } from "@/lib/supabase/session";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const session = await getServerSession();

    return authJson(
      session
        ? {
            authenticated: true,
            expiresAt: session.expiresAt?.toISOString() ?? null,
          }
        : { authenticated: false, expiresAt: null },
      { status: session ? 200 : 401 },
    );
  } catch (error) {
    return toAuthErrorResponse(error);
  }
}
