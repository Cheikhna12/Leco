export const MOODS = [
  "sortir",
  "discuter",
  "manger",
  "match",
  "rencontre",
  "sport",
  "evenement",
  "plan_tranquille",
] as const;

export type Mood = (typeof MOODS)[number];

export const DISTANCE_BANDS = [
  "TOUT_PRES",
  "MOINS_DE_500_M",
  "ENTRE_500_M_ET_1_KM",
  "DANS_TON_SECTEUR",
] as const;

export type DistanceBand = (typeof DISTANCE_BANDS)[number];

export type AvailabilityStatus = "offline" | "available" | "hidden";
