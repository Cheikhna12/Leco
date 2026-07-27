import "server-only";

import sharp from "sharp";

import { PhotoValidationError, validateProfilePhoto } from "./photo-validation";

const MAX_PROFILE_PHOTO_PIXELS = 40_000_000;

export type SanitizedProfilePhoto = {
  bytes: Buffer;
  height: number;
  width: number;
};

/**
 * Decode the complete image before it reaches Cloudinary, apply EXIF
 * orientation, bound its dimensions, and re-encode it without metadata.
 */
export async function sanitizeProfilePhoto(
  bytes: Uint8Array,
): Promise<SanitizedProfilePhoto> {
  validateProfilePhoto(bytes);

  try {
    const result = await sharp(bytes, {
      failOn: "error",
      limitInputPixels: MAX_PROFILE_PHOTO_PIXELS,
    })
      .rotate()
      .resize({
        fit: "inside",
        height: 1_600,
        width: 1_200,
        withoutEnlargement: true,
      })
      .webp({ effort: 4, quality: 84 })
      .toBuffer({ resolveWithObject: true });

    if (!result.info.width || !result.info.height) {
      throw new Error("missing dimensions");
    }

    return {
      bytes: result.data,
      height: result.info.height,
      width: result.info.width,
    };
  } catch {
    throw new PhotoValidationError(
      "Le fichier ne contient pas une image valide.",
      "FORMAT",
    );
  }
}
