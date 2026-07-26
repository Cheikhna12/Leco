import type { NextRequest } from "next/server";

import {
  addPhoto,
  getOnboardingState,
} from "@/features/profiles/server/profile-repository";
import {
  assertProfileMultipartRequest,
  ProfileRequestError,
  profileJson,
  requireProfileSession,
  toProfileErrorResponse,
} from "@/features/profiles/server/request";
import {
  MAX_PROFILE_PHOTO_BYTES,
  PhotoValidationError,
} from "@/lib/cloudinary/photo-validation";
import {
  deleteProfilePhoto,
  uploadProfilePhoto,
} from "@/lib/cloudinary/server";
import { createClient } from "@/lib/supabase/server";

const MAX_MULTIPART_BYTES = MAX_PROFILE_PHOTO_BYTES + 256 * 1024;

export async function POST(request: NextRequest) {
  let uploadedPublicId: string | null = null;
  try {
    assertProfileMultipartRequest(request, MAX_MULTIPART_BYTES);
    const session = await requireProfileSession();
    const formData = await request.formData();
    const file = formData.get("photo");
    if (!(file instanceof File)) {
      throw new ProfileRequestError(
        "PHOTO_REQUIRED",
        "Choisis une photo.",
        400,
      );
    }
    if (file.size === 0 || file.size > MAX_PROFILE_PHOTO_BYTES) {
      throw new ProfileRequestError(
        file.size === 0 ? "PHOTO_REQUIRED" : "PHOTO_TOO_LARGE",
        file.size === 0
          ? "Choisis une photo."
          : "La photo dépasse la limite de 8 Mo.",
        file.size === 0 ? 400 : 413,
      );
    }

    const asset = await uploadProfilePhoto(session.userId, file);
    uploadedPublicId = asset.publicId;
    const client = await createClient();
    const id = await addPhoto(client, asset);
    uploadedPublicId = null;
    return profileJson({
      photoId: id,
      profile: await getOnboardingState(client),
    });
  } catch (error) {
    if (uploadedPublicId) {
      await deleteProfilePhoto(uploadedPublicId).catch(() => undefined);
    }
    if (error instanceof PhotoValidationError) {
      return profileJson(
        {
          error: {
            code: `PHOTO_${error.code}`,
            message: error.message,
          },
        },
        { status: error.code === "SIZE" ? 413 : 400 },
      );
    }
    return toProfileErrorResponse(error);
  }
}
