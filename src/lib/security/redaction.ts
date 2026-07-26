const SENSITIVE_KEY_PATTERN =
  /(?:authorization|cookie|secret|token|jwt|otp|password|phone|latitude|longitude|coordinates?|location|message|body|content)/i;
const BEARER_TOKEN_PATTERN = /\bBearer\s+[A-Za-z0-9._~+/-]+=*/gi;
const JWT_PATTERN = /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g;
const INTERNATIONAL_PHONE_PATTERN = /\+\d[\d\s().-]{6,}\d/g;

export const REDACTED_VALUE = "[REDACTED]";

function redactString(value: string): string {
  return value
    .replace(BEARER_TOKEN_PATTERN, `Bearer ${REDACTED_VALUE}`)
    .replace(JWT_PATTERN, REDACTED_VALUE)
    .replace(INTERNATIONAL_PHONE_PATTERN, REDACTED_VALUE);
}

export function redactForLogs(
  value: unknown,
  seen: WeakSet<object> = new WeakSet(),
): unknown {
  if (typeof value === "string") {
    return redactString(value);
  }

  if (
    value === null ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "undefined"
  ) {
    return value;
  }

  if (typeof value !== "object") {
    return String(value);
  }

  if (seen.has(value)) {
    return "[CIRCULAR]";
  }

  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((entry) => redactForLogs(entry, seen));
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [
      key,
      SENSITIVE_KEY_PATTERN.test(key)
        ? REDACTED_VALUE
        : redactForLogs(entry, seen),
    ]),
  );
}
