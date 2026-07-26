export interface ValidationIssue {
  path?: ReadonlyArray<PropertyKey>;
  message: string;
  code?: string;
}

export type SafeParseResult<T> =
  | { success: true; data: T }
  | { success: false; error: { issues: readonly ValidationIssue[] } };

/**
 * Compatible with a Zod schema without coupling these primitives to a specific
 * Zod version.
 */
export interface SafeParser<T> {
  safeParse(input: unknown): SafeParseResult<T>;
}

export class RequestValidationError extends Error {
  readonly status = 400;

  constructor(readonly issues: readonly ValidationIssue[]) {
    super("La requête contient des données invalides.");
    this.name = "RequestValidationError";
  }
}

export class RequestTooLargeError extends Error {
  readonly status = 413;

  constructor(readonly maxBytes: number) {
    super("La requête dépasse la taille autorisée.");
    this.name = "RequestTooLargeError";
  }
}

export function parseServerInput<T>(parser: SafeParser<T>, input: unknown): T {
  const result = parser.safeParse(input);

  if (!result.success) {
    throw new RequestValidationError(result.error.issues);
  }

  return result.data;
}

export function assertJsonContentType(contentType: string | null): void {
  const mediaType = contentType?.split(";", 1)[0]?.trim().toLowerCase();

  if (mediaType !== "application/json") {
    throw new RequestValidationError([
      { path: ["headers", "content-type"], message: "JSON est requis." },
    ]);
  }
}

export function assertDeclaredRequestSize(
  contentLength: string | null,
  maxBytes: number,
): void {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1) {
    throw new TypeError("maxBytes doit être un entier strictement positif.");
  }

  if (contentLength === null) {
    return;
  }

  const byteLength = Number(contentLength);

  if (!Number.isSafeInteger(byteLength) || byteLength < 0) {
    throw new RequestValidationError([
      {
        path: ["headers", "content-length"],
        message: "Content-Length est invalide.",
      },
    ]);
  }

  if (byteLength > maxBytes) {
    throw new RequestTooLargeError(maxBytes);
  }
}

export function assertActualRequestSize(
  payload: string | ArrayBuffer | Uint8Array,
  maxBytes: number,
): void {
  const byteLength =
    typeof payload === "string"
      ? new TextEncoder().encode(payload).byteLength
      : payload.byteLength;

  if (byteLength > maxBytes) {
    throw new RequestTooLargeError(maxBytes);
  }
}
