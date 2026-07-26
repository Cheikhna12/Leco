export interface ContentSecurityPolicyOptions {
  appOrigin: string;
  nonce?: string;
  supabaseUrl?: string;
  cloudinaryCloudName?: string;
  reportUri?: string;
}

export type SecurityHeader = Readonly<{
  key: string;
  value: string;
}>;

const NONCE_PATTERN = /^[A-Za-z0-9_-]{16,256}$/;

function toHttpOrigin(value: string): string {
  const url = new URL(value);

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("Seules les origines HTTP(S) sont autorisées.");
  }

  return url.origin;
}

function toWebSocketOrigin(value: string): string {
  const url = new URL(value);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  return url.origin;
}

export function buildContentSecurityPolicy(
  options: ContentSecurityPolicyOptions,
): string {
  const appOrigin = toHttpOrigin(options.appOrigin);
  const supabaseOrigin = options.supabaseUrl
    ? toHttpOrigin(options.supabaseUrl)
    : undefined;
  const supabaseSocketOrigin = options.supabaseUrl
    ? toWebSocketOrigin(options.supabaseUrl)
    : undefined;
  const cloudinaryOrigin = options.cloudinaryCloudName
    ? `https://res.cloudinary.com/${encodeURIComponent(options.cloudinaryCloudName)}`
    : undefined;

  if (options.nonce && !NONCE_PATTERN.test(options.nonce)) {
    throw new Error(
      "Le nonce CSP doit être une valeur base64url imprévisible.",
    );
  }

  const scriptSources = options.nonce
    ? ["'self'", `'nonce-${options.nonce}'`, "'strict-dynamic'"]
    : ["'self'"];
  const connectSources = [
    "'self'",
    appOrigin,
    supabaseOrigin,
    supabaseSocketOrigin,
  ].filter((source): source is string => Boolean(source));
  const imageSources = ["'self'", "data:", "blob:", cloudinaryOrigin].filter(
    (source): source is string => Boolean(source),
  );
  const directives = [
    "default-src 'self'",
    `script-src ${scriptSources.join(" ")}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src ${imageSources.join(" ")}`,
    "font-src 'self' data:",
    `connect-src ${connectSources.join(" ")}`,
    "media-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "upgrade-insecure-requests",
  ];

  if (options.reportUri) {
    const reportUrl = new URL(options.reportUri, appOrigin);
    directives.push(`report-uri ${reportUrl.toString()}`);
  }

  return directives.join("; ");
}

export function buildSecurityHeaders(
  options: ContentSecurityPolicyOptions & { production: boolean },
): SecurityHeader[] {
  const headers: SecurityHeader[] = [
    {
      key: "Content-Security-Policy",
      value: buildContentSecurityPolicy(options),
    },
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
    { key: "Cross-Origin-Resource-Policy", value: "same-site" },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=(self)",
    },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
  ];

  if (options.production) {
    headers.push({
      key: "Strict-Transport-Security",
      value: "max-age=63072000; includeSubDomains; preload",
    });
  }

  return headers;
}

export function isAllowedOrigin(
  requestOrigin: string | null,
  allowedOrigins: readonly string[],
): boolean {
  if (!requestOrigin) {
    return false;
  }

  let normalizedRequestOrigin: string;

  try {
    normalizedRequestOrigin = toHttpOrigin(requestOrigin);
  } catch {
    return false;
  }

  return allowedOrigins.some((origin) => {
    try {
      return toHttpOrigin(origin) === normalizedRequestOrigin;
    } catch {
      return false;
    }
  });
}

export function buildCorsHeaders(
  requestOrigin: string | null,
  allowedOrigins: readonly string[],
): Readonly<Record<string, string>> {
  if (!isAllowedOrigin(requestOrigin, allowedOrigins) || !requestOrigin) {
    return {};
  }

  return {
    "Access-Control-Allow-Origin": toHttpOrigin(requestOrigin),
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Headers": "authorization, content-type, x-csrf-token",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    Vary: "Origin",
  };
}
