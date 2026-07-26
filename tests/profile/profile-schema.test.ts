import { describe, expect, it, vi } from "vitest";

import {
  ageAt,
  interestsSelectionSchema,
  profileDraftSchema,
} from "@/features/profiles/profile-schema";

const validProfile = {
  firstName: "Awa",
  birthDate: "2000-05-14",
  gender: "woman",
  searchingFor: ["man"],
  bio: "Une bio sincère.",
  adultConfirmed: true,
  onboardingStep: 2,
} as const;

describe("validation du profil", () => {
  it("calcule l’âge depuis la date de naissance sans âge stocké", () => {
    expect(ageAt("2000-08-01", new Date("2026-07-26T10:00:00Z"))).toBe(25);
    expect(ageAt("2000-07-26", new Date("2026-07-26T10:00:00Z"))).toBe(26);
  });

  it("refuse un utilisateur mineur", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-26T10:00:00Z"));
    expect(
      profileDraftSchema.safeParse({
        ...validProfile,
        birthDate: "2009-01-01",
      }).success,
    ).toBe(false);
    vi.useRealTimers();
  });

  it("refuse une date impossible", () => {
    expect(
      profileDraftSchema.safeParse({
        ...validProfile,
        birthDate: "2000-02-31",
      }).success,
    ).toBe(false);
  });

  it("refuse une bio de plus de 150 caractères", () => {
    expect(
      profileDraftSchema.safeParse({
        ...validProfile,
        bio: "a".repeat(151),
      }).success,
    ).toBe(false);
  });

  it("refuse un prénom invalide", () => {
    expect(
      profileDraftSchema.safeParse({ ...validProfile, firstName: "A7" })
        .success,
    ).toBe(false);
  });

  it("exige la confirmation explicite de majorité", () => {
    expect(
      profileDraftSchema.safeParse({
        ...validProfile,
        adultConfirmed: false,
      }).success,
    ).toBe(false);
  });

  it("impose deux à trois centres d’intérêt uniques", () => {
    expect(
      interestsSelectionSchema.safeParse({ interestIds: [1] }).success,
    ).toBe(false);
    expect(
      interestsSelectionSchema.safeParse({ interestIds: [1, 2, 3, 4] }).success,
    ).toBe(false);
    expect(
      interestsSelectionSchema.safeParse({ interestIds: [1, 1] }).success,
    ).toBe(false);
    expect(
      interestsSelectionSchema.safeParse({ interestIds: [1, 2, 3] }).success,
    ).toBe(true);
  });
});
