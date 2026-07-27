import { z } from "zod";

export const GENDERS = [
  "woman",
  "man",
  "non_binary",
  "other",
  "prefer_not_to_say",
] as const;

export const genderSchema = z.enum(GENDERS);

const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Choisis une date valide.")
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return (
      !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
    );
  }, "Choisis une date valide.");

export function ageAt(date: string, now = new Date()): number {
  const [year, month, day] = date.split("-").map(Number);
  let age = now.getUTCFullYear() - year;
  const beforeBirthday =
    now.getUTCMonth() + 1 < month ||
    (now.getUTCMonth() + 1 === month && now.getUTCDate() < day);

  if (beforeBirthday) {
    age -= 1;
  }

  return age;
}

export const birthDateSchema = isoDateSchema.refine((value) => {
  const age = ageAt(value);
  return age >= 18 && age <= 100;
}, "Tu dois avoir entre 18 et 100 ans pour utiliser Leco.");

export const profileDraftSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, "Ton prénom doit contenir au moins 2 caractères.")
    .max(40, "Ton prénom est trop long.")
    .regex(
      /^[\p{L}][\p{L}\p{M}' -]*$/u,
      "Utilise uniquement des lettres pour ton prénom.",
    ),
  birthDate: birthDateSchema,
  gender: genderSchema,
  searchingFor: z
    .array(genderSchema)
    .min(1, "Choisis au moins une préférence.")
    .max(5),
  bio: z
    .string()
    .trim()
    .max(150, "Ta bio ne peut pas dépasser 150 caractères."),
  adultConfirmed: z.literal(true, {
    error: "Confirme que tu as au moins 18 ans.",
  }),
  onboardingStep: z.number().int().min(1).max(4).default(2),
});

export const interestsSelectionSchema = z.object({
  interestIds: z
    .array(z.number().int().positive())
    .min(2, "Choisis au moins 2 centres d’intérêt.")
    .max(3, "Choisis au maximum 3 centres d’intérêt.")
    .refine((items) => new Set(items).size === items.length, {
      message: "Chaque centre d’intérêt doit être unique.",
    }),
});

export const photoOrderSchema = z.object({
  photoIds: z
    .array(z.string().uuid())
    .min(1)
    .max(4)
    .refine((items) => new Set(items).size === items.length),
});

export const photoIdSchema = z.string().uuid();

export type ProfileDraftInput = z.infer<typeof profileDraftSchema>;
export type Gender = z.infer<typeof genderSchema>;
