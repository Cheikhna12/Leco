import { describe, expect, it } from "vitest";

import {
  assertActualRequestSize,
  assertDeclaredRequestSize,
  assertJsonContentType,
  parseServerInput,
  RequestTooLargeError,
  RequestValidationError,
  type SafeParser,
} from "@/lib/security";

describe("server input validation primitives", () => {
  it("returns only parser-validated data", () => {
    const parser: SafeParser<{ mood: string }> = {
      safeParse: () => ({ success: true, data: { mood: "discuter" } }),
    };

    expect(parseServerInput(parser, { mood: "ignored" })).toEqual({
      mood: "discuter",
    });
  });

  it("exposes normalized validation issues without echoing input", () => {
    const parser: SafeParser<never> = {
      safeParse: () => ({
        success: false,
        error: {
          issues: [{ path: ["bio"], code: "too_big", message: "Trop long" }],
        },
      }),
    };

    expect(() => parseServerInput(parser, { bio: "sensitive value" })).toThrow(
      RequestValidationError,
    );
  });

  it("enforces JSON content type and both declared and actual sizes", () => {
    expect(() =>
      assertJsonContentType("application/json; charset=utf-8"),
    ).not.toThrow();
    expect(() => assertJsonContentType("text/plain")).toThrow(
      RequestValidationError,
    );
    expect(() => assertDeclaredRequestSize("101", 100)).toThrow(
      RequestTooLargeError,
    );
    expect(() => assertActualRequestSize("éé", 3)).toThrow(
      RequestTooLargeError,
    );
  });
});
