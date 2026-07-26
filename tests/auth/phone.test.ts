import { describe, expect, it } from "vitest";

import {
  isIvoryCoastMobilePhone,
  maskPhoneNumber,
  normalizeIvoryCoastPhone,
  phoneNumberSchema,
  requestOtpSchema,
  verifyOtpSchema,
} from "@/features/auth/phone";

describe("numéros mobiles ivoiriens", () => {
  it.each([
    ["07 01 02 03 04", "+2250701020304"],
    ["+225 05 12 34 56 78", "+2250512345678"],
    ["002250112345678", "+2250112345678"],
    ["2250701020304", "+2250701020304"],
  ])("normalise %s", (input, expected) => {
    expect(normalizeIvoryCoastPhone(input)).toBe(expected);
    expect(isIvoryCoastMobilePhone(expected)).toBe(true);
  });

  it.each(["", "1234", "+2250212345678", "+33123456789"])(
    "refuse le numéro invalide %s",
    (input) => {
      expect(phoneNumberSchema.safeParse(input).success).toBe(false);
    },
  );

  it("exige le consentement lors de la demande", () => {
    expect(
      requestOtpSchema.safeParse({
        phoneNumber: "0701020304",
        consent: false,
      }).success,
    ).toBe(false);
  });

  it("exige un code de six chiffres", () => {
    expect(
      verifyOtpSchema.safeParse({
        phoneNumber: "0701020304",
        code: "123456",
      }).success,
    ).toBe(true);
    expect(
      verifyOtpSchema.safeParse({
        phoneNumber: "0701020304",
        code: "12345a",
      }).success,
    ).toBe(false);
  });

  it("masque le numéro complet", () => {
    const masked = maskPhoneNumber("+2250701020304");
    expect(masked).not.toContain("0701020304");
    expect(masked).toBe("+225070 •• •• 04");
  });
});
