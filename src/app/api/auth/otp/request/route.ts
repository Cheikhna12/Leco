import type { NextRequest } from "next/server";

import { requestOtpSchema } from "@/features/auth/phone";
import { createAuthenticationService } from "@/features/auth/server/factory";
import {
  getRemoteAddress,
  readJsonInput,
} from "@/features/auth/server/request";
import { authJson, toAuthErrorResponse } from "@/features/auth/server/response";

export async function POST(request: NextRequest) {
  try {
    const input = await readJsonInput(request, requestOtpSchema);
    const service = await createAuthenticationService();

    await service.requestOtp(input, getRemoteAddress(request));

    // This response is deliberately identical for new and existing accounts.
    return authJson(
      {
        accepted: true,
        message:
          "Si ce numéro peut recevoir un code, il arrivera dans quelques instants.",
      },
      { status: 202 },
    );
  } catch (error) {
    return toAuthErrorResponse(error);
  }
}
