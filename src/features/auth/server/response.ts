import "server-only";

import { NextResponse } from "next/server";

import { AppError } from "@/lib/errors/app-error";
import { RateLimitError } from "@/lib/security/rate-limit";
import {
  RequestTooLargeError,
  RequestValidationError,
} from "@/lib/security/validation";

import { CaptchaRequiredError } from "../auth-service";
import { OtpProviderError } from "../otp-provider";
import { RequestOriginError } from "./request";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
  Pragma: "no-cache",
} as const;

export function authJson(
  body: Readonly<Record<string, unknown>>,
  init?: ResponseInit,
) {
  const response = NextResponse.json(body, init);

  for (const [key, value] of Object.entries(NO_STORE_HEADERS)) {
    response.headers.set(key, value);
  }

  return response;
}

export function toAuthErrorResponse(error: unknown) {
  if (error instanceof RateLimitError) {
    return authJson(
      {
        error: {
          code: "RATE_LIMITED",
          message: "Trop de tentatives. Réessaie un peu plus tard.",
        },
      },
      {
        status: 429,
        headers: { "Retry-After": String(error.retryAfterSeconds) },
      },
    );
  }

  if (error instanceof CaptchaRequiredError) {
    return authJson(
      {
        error: {
          code: error.code,
          message: "Une vérification de sécurité est nécessaire.",
        },
      },
      { status: error.status },
    );
  }

  if (
    error instanceof RequestValidationError ||
    error instanceof RequestTooLargeError ||
    error instanceof RequestOriginError
  ) {
    return authJson(
      {
        error: {
          code: "INVALID_REQUEST",
          message: "La demande n’a pas pu être traitée.",
        },
      },
      { status: error.status },
    );
  }

  if (error instanceof OtpProviderError) {
    if (error.code === "EXPIRED_OTP") {
      return authJson(
        {
          error: {
            code: "OTP_EXPIRED",
            message: "Ce code a expiré. Demande un nouveau code.",
          },
        },
        { status: 400 },
      );
    }

    if (error.code === "INVALID_OTP") {
      return authJson(
        {
          error: {
            code: "OTP_INVALID",
            message: "Ce code n’est pas valide ou a expiré.",
          },
        },
        { status: 400 },
      );
    }
  }

  if (error instanceof AppError) {
    return authJson(
      { error: { code: error.code, message: error.message } },
      { status: error.status },
    );
  }

  return authJson(
    {
      error: {
        code: "AUTH_UNAVAILABLE",
        message:
          "Nous n’avons pas pu traiter la demande. Réessaie dans un instant.",
      },
    },
    { status: 503 },
  );
}
