import type { NextRequest } from "next/server";

import {
  assertSameOrigin,
  readJsonInput,
} from "@/features/auth/server/request";
import { activatePresenceSchema } from "@/features/presence/domain";
import { createPresenceService } from "@/features/presence/server/factory";
import {
  presenceJson,
  toPresenceErrorResponse,
} from "@/features/presence/server/response";

export async function GET() {
  try {
    const service = await createPresenceService();
    return presenceJson(await service.getSnapshot());
  } catch (error) {
    return toPresenceErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const input = await readJsonInput(request, activatePresenceSchema);
    const service = await createPresenceService();
    return presenceJson(await service.activate(input));
  } catch (error) {
    return toPresenceErrorResponse(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const service = await createPresenceService();
    return presenceJson(await service.deactivate());
  } catch (error) {
    return toPresenceErrorResponse(error);
  }
}
