import { describe, expect, it, vi } from "vitest";

import { birthDateSchema, profileBioSchema } from "@/lib/validation/profile";

describe("profile validation", () => {
  it("enforces the 150 character bio limit", () => {
    expect(profileBioSchema.safeParse("a".repeat(151)).success).toBe(false);
  });

  it("rejects minors", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-26T12:00:00Z"));

    expect(birthDateSchema.safeParse("2009-07-26").success).toBe(false);
    expect(birthDateSchema.safeParse("2008-07-26").success).toBe(true);

    vi.useRealTimers();
  });
});
