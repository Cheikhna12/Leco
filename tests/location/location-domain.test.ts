import { describe, expect, it, vi } from "vitest";

import {
  locationUpdateSchema,
  MAX_LOCATION_ACCURACY_METERS,
} from "@/features/presence/domain";

describe("validation d’une position", () => {
  it("accepte une position récente et suffisamment précise", () => {
    vi.setSystemTime(new Date("2026-07-26T20:00:00.000Z"));

    expect(
      locationUpdateSchema.safeParse({
        accuracy: 32,
        capturedAt: "2026-07-26T19:59:30.000Z",
        latitude: 5.3364,
        longitude: -4.0267,
      }).success,
    ).toBe(true);
  });

  it.each([
    ["latitude", 91, -4.0267],
    ["longitude", 5.3364, -181],
  ])("refuse une %s invalide", (_label, latitude, longitude) => {
    expect(
      locationUpdateSchema.safeParse({
        accuracy: 20,
        capturedAt: new Date().toISOString(),
        latitude,
        longitude,
      }).success,
    ).toBe(false);
  });

  it("refuse une précision insuffisante", () => {
    expect(
      locationUpdateSchema.safeParse({
        accuracy: MAX_LOCATION_ACCURACY_METERS + 1,
        capturedAt: new Date().toISOString(),
        latitude: 5.3364,
        longitude: -4.0267,
      }).success,
    ).toBe(false);
  });

  it("refuse un relevé ancien ou daté dans le futur", () => {
    vi.setSystemTime(new Date("2026-07-26T20:00:00.000Z"));
    const base = {
      accuracy: 20,
      latitude: 5.3364,
      longitude: -4.0267,
    };

    expect(
      locationUpdateSchema.safeParse({
        ...base,
        capturedAt: "2026-07-26T19:57:59.000Z",
      }).success,
    ).toBe(false);
    expect(
      locationUpdateSchema.safeParse({
        ...base,
        capturedAt: "2026-07-26T20:00:31.000Z",
      }).success,
    ).toBe(false);
  });
});
