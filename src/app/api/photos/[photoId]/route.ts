import { photoIdSchema } from "@/features/profiles/profile-schema";
import { removePhoto } from "@/features/profiles/server/profile-repository";
import {
  profileJson,
  requireProfileSession,
  toProfileErrorResponse,
} from "@/features/profiles/server/request";
import { deleteProfilePhoto } from "@/lib/cloudinary/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ photoId: string }> },
) {
  try {
    await requireProfileSession();
    const { photoId } = await context.params;
    const validatedId = photoIdSchema.parse(photoId);
    const publicId = await removePhoto(await createClient(), validatedId);
    await deleteProfilePhoto(publicId);
    return profileJson({ deleted: true });
  } catch (error) {
    return toProfileErrorResponse(error);
  }
}
