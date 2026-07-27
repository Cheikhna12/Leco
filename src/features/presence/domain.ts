import { z } from "zod";

import { MOODS, type Mood } from "@/types/domain";

export { MOODS, type Mood };

export const MOOD_PRESENTATION: Readonly<
  Record<Mood, { label: string; detail: string }>
> = {
  discuter: { label: "Discuter", detail: "Une conversation sans pression" },
  sortir: { label: "Sortir", detail: "Bouger et voir où la soirée mène" },
  manger: { label: "Manger", detail: "Partager une table ou une adresse" },
  match: { label: "Match", detail: "Laisser la rencontre décider" },
  rencontre: { label: "Rencontre", detail: "Faire vraiment connaissance" },
  sport: { label: "Sport", detail: "Bouger à deux ou en groupe" },
  plan_tranquille: {
    label: "Plan tranquille",
    detail: "Un moment calme, tout simplement",
  },
  evenement: {
    label: "Événement",
    detail: "Rejoindre une ambiance déjà lancée",
  },
};

export const PRESENCE_DURATIONS = [30, 60, 120, 240] as const;
export type PresenceDuration = (typeof PRESENCE_DURATIONS)[number];

export const MAX_LOCATION_ACCURACY_METERS = 150;
export const MAX_LOCATION_AGE_MS = 2 * 60 * 1000;
export const MAX_LOCATION_FUTURE_DRIFT_MS = 30 * 1000;
export const HEARTBEAT_INTERVAL_MS = 50 * 1000;
export const HEARTBEAT_EXPIRY_MS = 5 * 60 * 1000;

export const locationUpdateSchema = z
  .object({
    latitude: z.number().finite().min(-90).max(90),
    longitude: z.number().finite().min(-180).max(180),
    accuracy: z
      .number()
      .finite()
      .nonnegative()
      .max(MAX_LOCATION_ACCURACY_METERS),
    capturedAt: z.iso.datetime({ offset: true }),
  })
  .strict()
  .superRefine((value, context) => {
    const capturedAt = Date.parse(value.capturedAt);
    const now = Date.now();

    if (
      capturedAt < now - MAX_LOCATION_AGE_MS ||
      capturedAt > now + MAX_LOCATION_FUTURE_DRIFT_MS
    ) {
      context.addIssue({
        code: "custom",
        path: ["capturedAt"],
        message: "La position n’est plus assez récente.",
      });
    }
  });

export type LocationUpdateInput = z.infer<typeof locationUpdateSchema>;

export const activatePresenceSchema = z
  .object({
    mood: z.enum(MOODS),
    durationMinutes: z.union([
      z.literal(30),
      z.literal(60),
      z.literal(120),
      z.literal(240),
    ]),
  })
  .strict();

export type ActivatePresenceInput = z.infer<typeof activatePresenceSchema>;

export type PresenceAvailability = "AVAILABLE" | "OFFLINE" | "HIDDEN";

export interface PresenceSnapshot {
  status: PresenceAvailability;
  mood: Mood | null;
  availableUntil: string | null;
  hasValidLocation: boolean;
}
