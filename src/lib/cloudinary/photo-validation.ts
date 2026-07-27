export const MAX_PROFILE_PHOTO_BYTES = 8 * 1024 * 1024;

export type AcceptedPhotoFormat = "jpeg" | "png" | "webp";

export class PhotoValidationError extends Error {
  constructor(
    message: string,
    readonly code: "FORMAT" | "SIZE" | "EMPTY",
  ) {
    super(message);
    this.name = "PhotoValidationError";
  }
}

function has(bytes: Uint8Array, offset: number, signature: number[]): boolean {
  return signature.every((byte, index) => bytes[offset + index] === byte);
}

export function detectPhotoFormat(
  bytes: Uint8Array,
): AcceptedPhotoFormat | null {
  if (has(bytes, 0, [0xff, 0xd8, 0xff])) return "jpeg";
  if (has(bytes, 0, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return "png";
  }
  if (
    has(bytes, 0, [0x52, 0x49, 0x46, 0x46]) &&
    has(bytes, 8, [0x57, 0x45, 0x42, 0x50])
  ) {
    return "webp";
  }
  return null;
}

export function validateProfilePhoto(bytes: Uint8Array): AcceptedPhotoFormat {
  if (bytes.byteLength === 0) {
    throw new PhotoValidationError("La photo est vide.", "EMPTY");
  }
  if (bytes.byteLength > MAX_PROFILE_PHOTO_BYTES) {
    throw new PhotoValidationError(
      "La photo dépasse la limite de 8 Mo.",
      "SIZE",
    );
  }

  const format = detectPhotoFormat(bytes);
  if (!format) {
    throw new PhotoValidationError(
      "Choisis une image JPEG, PNG ou WebP. Convertis les photos HEIC avant l’envoi.",
      "FORMAT",
    );
  }
  return format;
}
