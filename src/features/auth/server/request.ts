import "server-only";

import type { NextRequest } from "next/server";

import {
  assertActualRequestSize,
  assertDeclaredRequestSize,
  assertJsonContentType,
  parseServerInput,
  type SafeParser,
} from "@/lib/security/validation";

const MAX_AUTH_BODY_BYTES = 8_192;

export function getRemoteAddress(request: NextRequest): string {
  const forwarded = request.headers
    .get("x-forwarded-for")
    ?.split(",")[0]
    ?.trim();
  return forwarded || request.headers.get("x-real-ip") || "unknown";
}

export function assertSameOrigin(request: NextRequest): void {
  const origin = request.headers.get("origin");
  const configuredOrigin = process.env.NEXT_PUBLIC_APP_URL;
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost || request.headers.get("host");
  const forwardedProtocol = request.headers
    .get("x-forwarded-proto")
    ?.split(",")[0]
    ?.trim();
  const requestProtocol =
    forwardedProtocol || request.nextUrl.protocol.replace(/:$/, "");
  const headerOrigin =
    host && (requestProtocol === "http" || requestProtocol === "https")
      ? `${requestProtocol}://${host}`
      : undefined;
  const candidates =
    process.env.NODE_ENV === "production"
      ? [configuredOrigin]
      : [configuredOrigin, request.nextUrl.origin, headerOrigin];
  const allowedOrigins = new Set(
    candidates.filter((value): value is string => Boolean(value)),
  );

  if (!origin || !allowedOrigins.has(origin)) {
    throw new RequestOriginError();
  }
}

export class RequestOriginError extends Error {
  readonly status = 403;

  constructor() {
    super("Origine de requête refusée.");
    this.name = "RequestOriginError";
  }
}

export async function readJsonInput<T>(
  request: NextRequest,
  schema: SafeParser<T>,
): Promise<T> {
  assertSameOrigin(request);
  assertJsonContentType(request.headers.get("content-type"));
  assertDeclaredRequestSize(
    request.headers.get("content-length"),
    MAX_AUTH_BODY_BYTES,
  );

  const rawBody = await request.text();
  assertActualRequestSize(rawBody, MAX_AUTH_BODY_BYTES);

  let body: unknown;

  try {
    body = JSON.parse(rawBody);
  } catch {
    body = null;
  }

  return parseServerInput(schema, body);
}
