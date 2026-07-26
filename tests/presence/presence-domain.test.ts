import { describe, expect, it } from "vitest";

import { activatePresenceSchema, MOODS } from "@/features/presence/domain";

describe("contrat des moods", () => {
  it("partage exactement les huit valeurs PostgreSQL", () => {
    expect(MOODS).toEqual([
      "sortir",
      "discuter",
      "manger",
      "match",
      "rencontre",
      "sport",
      "evenement",
      "plan_tranquille",
    ]);
  });

  it("accepte un mood et une durée valides", () => {
    expect(
      activatePresenceSchema.safeParse({
        durationMinutes: 120,
        mood: "plan_tranquille",
      }).success,
    ).toBe(true);
  });

  it("refuse un mood ou une durée arbitraire", () => {
    expect(
      activatePresenceSchema.safeParse({
        durationMinutes: 61,
        mood: "afterwork",
      }).success,
    ).toBe(false);
  });
});
