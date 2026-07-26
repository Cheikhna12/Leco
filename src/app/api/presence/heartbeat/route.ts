import type { NextRequest } from "next/server";

import { assertSameOrigin } from "@/features/auth/server/request";
import { createPresenceService } from "@/features/presence/server/factory";
import {
  presenceJson,
  toPresenceErrorResponse,
} from "@/features/presence/server/response";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const service = await createPresenceService();
    return presenceJson(await service.heartbeat());
  } catch (error) {
    return toPresenceErrorResponse(error);
  }
}
