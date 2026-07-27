import sharp from "sharp";
import { describe, expect, it, vi } from "vitest";

import { sanitizeProfilePhoto } from "@/lib/cloudinary/photo-sanitizer";
import { PhotoValidationError } from "@/lib/cloudinary/photo-validation";

vi.mock("server-only", () => ({}));

describe("sanitizeProfilePhoto", () => {
  it("décode, réoriente et retire les métadonnées avant Cloudinary", async () => {
    const source = await sharp({
      create: {
        background: { alpha: 1, b: 84, g: 112, r: 228 },
        channels: 4,
        height: 24,
        width: 16,
      },
    })
      .withMetadata({ orientation: 6 })
      .jpeg()
      .toBuffer();

    const sanitized = await sanitizeProfilePhoto(source);
    const metadata = await sharp(sanitized.bytes).metadata();

    expect(metadata.format).toBe("webp");
    expect(metadata.orientation).toBeUndefined();
    expect(metadata.exif).toBeUndefined();
    expect(sanitized.width).toBe(24);
    expect(sanitized.height).toBe(16);
  });

  it("refuse un fichier qui imite seulement une signature JPEG", async () => {
    const disguisedExecutable = new Uint8Array([
      0xff, 0xd8, 0xff, 0x4d, 0x5a, 0x90, 0x00, 0x03,
    ]);

    await expect(
      sanitizeProfilePhoto(disguisedExecutable),
    ).rejects.toBeInstanceOf(PhotoValidationError);
  });
});
