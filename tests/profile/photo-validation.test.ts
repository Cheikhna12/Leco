import { describe, expect, it } from "vitest";

import {
  MAX_PROFILE_PHOTO_BYTES,
  PhotoValidationError,
  detectPhotoFormat,
  validateProfilePhoto,
} from "@/lib/cloudinary/photo-validation";

describe("validation binaire des photos", () => {
  it("détecte JPEG, PNG et WebP depuis les octets", () => {
    expect(detectPhotoFormat(new Uint8Array([0xff, 0xd8, 0xff, 0x00]))).toBe(
      "jpeg",
    );
    expect(
      detectPhotoFormat(
        new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      ),
    ).toBe("png");
    expect(
      detectPhotoFormat(
        new Uint8Array([
          0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50,
        ]),
      ),
    ).toBe("webp");
  });

  it("refuse un MIME mensonger ou un HEIC non converti", () => {
    expect(() =>
      validateProfilePhoto(
        new Uint8Array([
          0, 0, 0, 0x18, 0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x63,
        ]),
      ),
    ).toThrow(PhotoValidationError);
  });

  it("refuse une image vide ou trop volumineuse", () => {
    expect(() => validateProfilePhoto(new Uint8Array())).toThrow("vide");
    expect(() =>
      validateProfilePhoto(new Uint8Array(MAX_PROFILE_PHOTO_BYTES + 1)),
    ).toThrow("8 Mo");
  });
});
