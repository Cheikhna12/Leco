import type { NextRequest } from "next/server";

import { readJsonInput } from "@/features/auth/server/request";
import { locationUpdateSchema } from "@/features/presence/domain";
import { createPresenceService } from "@/features/presence/server/factory";
import {
  presenceJson,
  toPresenceErrorResponse,
} from "@/features/presence/server/response";

export async function POST(request: NextRequest) {
  try {
    const input = await readJsonInput(request, locationUpdateSchema);
    const service = await createPresenceService();

    return presenceJson(await service.updateLocation(input));
  } catch (error) {
    return toPresenceErrorResponse(error);
  }
}
