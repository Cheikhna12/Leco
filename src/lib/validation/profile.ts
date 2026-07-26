import { z } from "zod";

export const profileNameSchema = z
  .string()
  .trim()
  .min(2, "Ton prénom doit contenir au moins 2 caractères.")
  .max(40, "Ton prénom est trop long.");

export const profileBioSchema = z
  .string()
  .trim()
  .max(150, "Ta bio ne peut pas dépasser 150 caractères.");

export const birthDateSchema = z.coerce.date().refine(
  (birthDate) => {
    const today = new Date();
    const adultThreshold = Date.UTC(
      today.getUTCFullYear() - 18,
      today.getUTCMonth(),
      today.getUTCDate(),
    );

    return birthDate.getTime() <= adultThreshold;
  },
  { message: "Tu dois avoir au moins 18 ans pour utiliser Leco." },
);
