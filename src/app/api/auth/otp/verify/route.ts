import type { NextRequest } from "next/server";

import { getPostAuthenticationDestination } from "@/features/auth/session-contract";
import { verifyOtpSchema } from "@/features/auth/phone";
import { createAuthenticationService } from "@/features/auth/server/factory";
import {
  getRemoteAddress,
  readJsonInput,
} from "@/features/auth/server/request";
import { authJson, toAuthErrorResponse } from "@/features/auth/server/response";
import { getServerSession } from "@/lib/supabase/session";

export async function POST(request: NextRequest) {
  try {
    const input = await readJsonInput(request, verifyOtpSchema);
    const service = await createAuthenticationService();

    await service.verifyOtp(input, getRemoteAddress(request));

    const session = await getServerSession();

    if (!session) {
      throw new Error("La session n’a pas pu être établie.");
    }

    return authJson({
      authenticated: true,
      destination: getPostAuthenticationDestination(session),
    });
  } catch (error) {
    return toAuthErrorResponse(error);
  }
}
