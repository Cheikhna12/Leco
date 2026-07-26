import { describe, expect, it } from "vitest";

import { DISTANCE_BANDS, MOODS } from "@/types/domain";

describe("domain constants", () => {
  it("keeps the public distance model approximate", () => {
    expect(DISTANCE_BANDS).not.toContain("EXACT_DISTANCE");
  });

  it("offers the MVP mood set", () => {
    expect(MOODS).toHaveLength(8);
  });
});
