import "server-only";

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";

import type { AuthenticatedSession } from "@/features/auth/session-contract";
import {
  assertSameOrigin,
  RequestOriginError,
} from "@/features/auth/server/request";
import {
  assertActualRequestSize,
  assertDeclaredRequestSize,
  assertJsonContentType,
  RequestTooLargeError,
  RequestValidationError,
} from "@/lib/security/validation";
import { getServerSession } from "@/lib/supabase/session";

const MAX_PROFILE_JSON_BYTES = 16 * 1024;

export function profileJson(
  body: Readonly<Record<string, unknown>>,
  init?: ResponseInit,
) {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "no-store, max-age=0");
  response.headers.set("Pragma", "no-cache");
  return response;
}

export async function requireProfileSession(): Promise<AuthenticatedSession> {
  const session = await getServerSession();
  if (!session) {
    throw new ProfileRequestError(
      "AUTHENTICATION_REQUIRED",
      "Connecte-toi pour continuer.",
      401,
    );
  }
  if (session.accountState !== "active") {
    throw new ProfileRequestError(
      "FORBIDDEN",
      "Ce compte ne peut pas modifier de profil.",
      403,
    );
  }
  return session;
}

export async function readJson<T>(
  request: NextRequest,
  schema: ZodType<T>,
): Promise<T> {
  assertSameOrigin(request);
  assertJsonContentType(request.headers.get("content-type"));
  assertDeclaredRequestSize(
    request.headers.get("content-length"),
    MAX_PROFILE_JSON_BYTES,
  );

  const rawBody = await request.text();
  assertActualRequestSize(rawBody, MAX_PROFILE_JSON_BYTES);

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    body = null;
  }

  return schema.parse(body);
}

export function assertProfileMutationOrigin(request: NextRequest): void {
  assertSameOrigin(request);
}

export function assertProfileMultipartRequest(
  request: NextRequest,
  maxBytes: number,
): void {
  assertSameOrigin(request);

  const mediaType = request.headers
    .get("content-type")
    ?.split(";", 1)[0]
    ?.trim()
    .toLowerCase();
  if (mediaType !== "multipart/form-data") {
    throw new ProfileRequestError(
      "INVALID_REQUEST",
      "Un formulaire multipart est attendu.",
      400,
    );
  }

  const declaredLength = request.headers.get("content-length");
  if (declaredLength === null) {
    throw new ProfileRequestError(
      "LENGTH_REQUIRED",
      "La taille de la requête est requise.",
      411,
    );
  }
  assertDeclaredRequestSize(declaredLength, maxBytes);
}

export class ProfileRequestError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ProfileRequestError";
  }
}

export function toProfileErrorResponse(error: unknown) {
  if (
    error instanceof RequestOriginError ||
    error instanceof RequestValidationError ||
    error instanceof RequestTooLargeError
  ) {
    return profileJson(
      {
        error: {
          code:
            error instanceof RequestTooLargeError
              ? "REQUEST_TOO_LARGE"
              : "INVALID_REQUEST",
          message:
            error instanceof RequestTooLargeError
              ? "La requête dépasse la taille autorisée."
              : "Les informations envoyées ne sont pas valides.",
        },
      },
      { status: error.status },
    );
  }
  if (error instanceof ProfileRequestError) {
    return profileJson(
      { error: { code: error.code, message: error.message } },
      { status: error.status },
    );
  }
  if (error instanceof ZodError) {
    return profileJson(
      {
        error: {
          code: "VALIDATION_FAILED",
          message:
            error.issues[0]?.message ?? "Vérifie les informations saisies.",
          fields: error.flatten().fieldErrors,
        },
      },
      { status: 400 },
    );
  }
  return profileJson(
    {
      error: {
        code: "PROFILE_UNAVAILABLE",
        message: "Impossible de sauvegarder pour le moment. Réessaie.",
      },
    },
    { status: 503 },
  );
}
