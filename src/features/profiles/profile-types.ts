import type { Gender } from "./profile-schema";

export type PhotoModerationStatus = "pending" | "approved" | "rejected";

export interface ProfilePhoto {
  id: string;
  secureUrl: string;
  displayOrder: number;
  moderationStatus: PhotoModerationStatus;
}

export interface Interest {
  id: number;
  slug: string;
  label: string;
}

export interface OnboardingState {
  firstName: string;
  birthDate: string;
  gender: Gender | "";
  searchingFor: Gender[];
  bio: string;
  adultConfirmed: boolean;
  onboardingStep: number;
  isProfileComplete: boolean;
  photos: ProfilePhoto[];
  interestIds: number[];
}
