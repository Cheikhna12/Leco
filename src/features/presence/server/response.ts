import "server-only";

import { NextResponse } from "next/server";

import { AppError, toPublicError } from "@/lib/errors/app-error";
import { RateLimitError } from "@/lib/security/rate-limit";
import {
  RequestTooLargeError,
  RequestValidationError,
} from "@/lib/security/validation";
import { RequestOriginError } from "@/features/auth/server/request";

const PRIVATE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
  Pragma: "no-cache",
} as const;

export function presenceJson(body: object, init?: ResponseInit) {
  const response = NextResponse.json(body, init);

  for (const [name, value] of Object.entries(PRIVATE_HEADERS)) {
    response.headers.set(name, value);
  }

  return response;
}

export function toPresenceErrorResponse(error: unknown) {
  if (error instanceof RateLimitError) {
    return presenceJson(
      {
        error: {
          code: "RATE_LIMITED",
          message: "Patiente un instant avant de réessayer.",
        },
      },
      {
        status: error.status,
        headers: { "Retry-After": String(error.retryAfterSeconds) },
      },
    );
  }

  if (
    error instanceof RequestValidationError ||
    error instanceof RequestTooLargeError ||
    error instanceof RequestOriginError
  ) {
    return presenceJson(
      {
        error: {
          code: "INVALID_REQUEST",
          message: "Les informations envoyées ne sont pas valides.",
        },
      },
      { status: error.status },
    );
  }

  const publicError = toPublicError(error);

  return presenceJson(
    {
      error: {
        code: publicError.code,
        message: publicError.message,
      },
    },
    { status: error instanceof AppError ? publicError.status : 503 },
  );
}
