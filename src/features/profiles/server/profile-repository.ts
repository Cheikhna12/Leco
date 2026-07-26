import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

import type { ProfileDraftInput } from "../profile-schema";
import type {
  Interest,
  OnboardingState,
  PhotoModerationStatus,
  ProfilePhoto,
} from "../profile-types";

type ProfileClient = SupabaseClient<Database>;

function assertNoError(error: { message: string } | null): void {
  if (error) {
    throw new Error("L’opération sur le profil a échoué.");
  }
}

function toPhoto(value: unknown): ProfilePhoto | null {
  if (!value || typeof value !== "object") return null;
  const photo = value as Record<string, unknown>;
  const moderationStatus = photo.moderationStatus;

  if (
    typeof photo.id !== "string" ||
    typeof photo.secureUrl !== "string" ||
    typeof photo.displayOrder !== "number" ||
    (moderationStatus !== "pending" &&
      moderationStatus !== "approved" &&
      moderationStatus !== "rejected")
  ) {
    return null;
  }

  return {
    id: photo.id,
    secureUrl: photo.secureUrl,
    displayOrder: photo.displayOrder,
    moderationStatus: moderationStatus as PhotoModerationStatus,
  };
}

export async function getOnboardingState(
  client: ProfileClient,
): Promise<OnboardingState> {
  const { data, error } = await client.rpc("get_my_onboarding_state");
  assertNoError(error);
  const state = data?.[0];

  if (!state) {
    throw new Error("Profil introuvable.");
  }

  const photos = Array.isArray(state.photos)
    ? state.photos
        .map(toPhoto)
        .filter((photo): photo is ProfilePhoto => Boolean(photo))
    : [];

  return {
    firstName: state.first_name ?? "",
    birthDate: state.birth_date ?? "",
    gender: state.gender ?? "",
    searchingFor: state.searching_for ?? [],
    bio: state.bio ?? "",
    adultConfirmed: state.adult_confirmed,
    onboardingStep: state.onboarding_step,
    isProfileComplete: state.is_profile_complete,
    photos,
    interestIds: state.interest_ids ?? [],
  };
}

export async function listInterests(
  client: ProfileClient,
): Promise<Interest[]> {
  const { data, error } = await client.rpc("list_onboarding_interests");
  assertNoError(error);

  return (data ?? []).map((interest) => ({
    id: interest.id,
    slug: interest.slug,
    label: interest.label_fr,
  }));
}

export async function saveProfileDraft(
  client: ProfileClient,
  input: ProfileDraftInput,
): Promise<void> {
  const { error } = await client.rpc("save_my_profile_draft", {
    p_adult_confirmed: input.adultConfirmed,
    p_bio: input.bio,
    p_birth_date: input.birthDate,
    p_first_name: input.firstName,
    p_gender: input.gender,
    p_onboarding_step: input.onboardingStep,
    p_searching_for: input.searchingFor,
  });
  assertNoError(error);
}

export async function replaceInterests(
  client: ProfileClient,
  interestIds: number[],
): Promise<void> {
  const { error } = await client.rpc("replace_my_interests", {
    p_interest_ids: interestIds,
  });
  assertNoError(error);
}

export async function addPhoto(
  client: ProfileClient,
  photo: {
    publicId: string;
    secureUrl: string;
    version: number;
    width: number;
    height: number;
  },
): Promise<string> {
  const { data, error } = await client.rpc("add_my_profile_photo", {
    p_cloudinary_public_id: photo.publicId,
    p_cloudinary_version: photo.version,
    p_height: photo.height,
    p_secure_url: photo.secureUrl,
    p_width: photo.width,
  });
  assertNoError(error);
  return data as string;
}

export async function removePhoto(
  client: ProfileClient,
  photoId: string,
): Promise<string> {
  const { data, error } = await client.rpc("delete_my_profile_photo", {
    p_photo_id: photoId,
  });
  assertNoError(error);
  return data as string;
}

export async function reorderPhotos(
  client: ProfileClient,
  photoIds: string[],
): Promise<void> {
  const { error } = await client.rpc("reorder_my_profile_photos", {
    p_photo_ids: photoIds,
  });
  assertNoError(error);
}

export async function completeOnboarding(client: ProfileClient): Promise<void> {
  const { data, error } = await client.rpc("complete_my_onboarding");
  assertNoError(error);
  if (!data) throw new Error("Le profil est encore incomplet.");
}
