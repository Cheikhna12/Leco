import { describe, expect, it } from "vitest";

import { redactForLogs, REDACTED_VALUE } from "@/lib/security";

describe("log redaction", () => {
  it("redacts sensitive keys recursively without mutating safe context", () => {
    const event = {
      requestId: "request-123",
      auth: {
        authorization: "Bearer secret",
        phoneNumber: "+2250102030405",
      },
      location: { latitude: 5.3, longitude: -4.0 },
      error: { code: "RATE_LIMITED" },
    };

    expect(redactForLogs(event)).toEqual({
      requestId: "request-123",
      auth: {
        authorization: REDACTED_VALUE,
        phoneNumber: REDACTED_VALUE,
      },
      location: REDACTED_VALUE,
      error: { code: "RATE_LIMITED" },
    });
  });

  it("redacts bearer tokens, JWTs and international phone numbers in strings", () => {
    const result = redactForLogs(
      "Bearer abc.def.ghi phone +225 01 02 03 04 05",
    );

    expect(result).not.toContain("abc.def.ghi");
    expect(result).not.toContain("+225");
    expect(result).toContain(REDACTED_VALUE);
  });
});
