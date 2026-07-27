import { z } from "zod";

const NON_DIGIT_PATTERN = /[^\d+]/g;
const IVORY_COAST_MOBILE_PATTERN = /^\+225(?:01|05|07)\d{8}$/;

export function normalizeIvoryCoastPhone(input: string): string {
  const compact = input.trim().replace(NON_DIGIT_PATTERN, "");
  const withoutInternationalPrefix = compact.startsWith("00225")
    ? compact.slice(5)
    : compact.startsWith("+225")
      ? compact.slice(4)
      : compact.startsWith("225") && compact.length === 13
        ? compact.slice(3)
        : compact;
  const local = withoutInternationalPrefix.startsWith("0")
    ? withoutInternationalPrefix
    : `0${withoutInternationalPrefix}`;

  return `+225${local}`;
}

export function isIvoryCoastMobilePhone(value: string): boolean {
  return IVORY_COAST_MOBILE_PATTERN.test(value);
}

export function maskPhoneNumber(phoneNumber: string): string {
  const normalized = normalizeIvoryCoastPhone(phoneNumber);

  if (!isIvoryCoastMobilePhone(normalized)) {
    return "+225 •• •• •• ••";
  }

  return `${normalized.slice(0, 7)} •• •• ${normalized.slice(-2)}`;
}

export const phoneNumberSchema = z
  .string()
  .trim()
  .min(1, "Entre ton numéro de téléphone.")
  .transform(normalizeIvoryCoastPhone)
  .refine(isIvoryCoastMobilePhone, {
    message: "Entre un numéro mobile ivoirien valide.",
  });

export const requestOtpSchema = z.object({
  phoneNumber: phoneNumberSchema,
  consent: z.literal(true, {
    error: "Tu dois accepter les conditions pour continuer.",
  }),
  captchaToken: z.string().trim().min(1).max(4096).optional(),
});

export const verifyOtpSchema = z.object({
  phoneNumber: phoneNumberSchema,
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Le code doit contenir exactement six chiffres."),
});

export type RequestOtpInput = z.infer<typeof requestOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
