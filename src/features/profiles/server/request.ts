import "server-only";

import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";

import type { AuthenticatedSession } from "@/features/auth/session-contract";
import { getServerSession } from "@/lib/supabase/session";

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
  request: Request,
  schema: ZodType<T>,
): Promise<T> {
  if (!request.headers.get("content-type")?.startsWith("application/json")) {
    throw new ProfileRequestError(
      "INVALID_REQUEST",
      "Une requête JSON est attendue.",
      400,
    );
  }
  return schema.parse(await request.json());
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
