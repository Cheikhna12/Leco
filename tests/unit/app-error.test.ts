import { describe, expect, it } from "vitest";

import { AppError, toPublicError } from "@/lib/errors/app-error";

describe("toPublicError", () => {
  it("keeps deliberate public errors", () => {
    const result = toPublicError(
      new AppError("RATE_LIMITED", "Trop de tentatives.", 429),
    );

    expect(result).toEqual({
      code: "RATE_LIMITED",
      message: "Trop de tentatives.",
      status: 429,
    });
  });

  it("does not leak unknown internal errors", () => {
    const result = toPublicError(new Error("database password leaked"));

    expect(result.code).toBe("INTERNAL_ERROR");
    expect(result.message).not.toContain("password");
  });
});
