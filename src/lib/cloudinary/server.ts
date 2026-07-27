import "server-only";

import { createHash } from "node:crypto";

import { serverEnv } from "@/lib/env/server";

import { sanitizeProfilePhoto } from "./photo-sanitizer";

const PROFILE_TRANSFORMATION = "c_fill,g_auto,h_1600,q_auto:good,w_1200";

type CloudinaryAsset = {
  public_id: string;
  secure_url: string;
  version: number;
  width: number;
  height: number;
};

function config() {
  const cloudName = serverEnv.CLOUDINARY_CLOUD_NAME;
  const apiKey = serverEnv.CLOUDINARY_API_KEY;
  const apiSecret = serverEnv.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary n’est pas configuré.");
  }
  return { cloudName, apiKey, apiSecret };
}

function signature(
  parameters: Record<string, string | number>,
  secret: string,
): string {
  const payload = Object.entries(parameters)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
  return createHash("sha1").update(`${payload}${secret}`).digest("hex");
}

export async function uploadProfilePhoto(
  userId: string,
  file: File,
): Promise<{
  publicId: string;
  secureUrl: string;
  version: number;
  width: number;
  height: number;
}> {
  const source = new Uint8Array(await file.arrayBuffer());
  const sanitized = await sanitizeProfilePhoto(source);
  const { apiKey, apiSecret, cloudName } = config();
  const parameters = {
    folder: `leco/profiles/${userId}`,
    overwrite: "false",
    timestamp: Math.floor(Date.now() / 1000),
    transformation: PROFILE_TRANSFORMATION,
    unique_filename: "true",
    use_filename: "false",
  };
  const uploadBytes = new Uint8Array(sanitized.bytes.byteLength);
  uploadBytes.set(sanitized.bytes);
  const body = new FormData();
  body.set("file", new Blob([uploadBytes], { type: "image/webp" }));
  for (const [key, value] of Object.entries(parameters)) {
    body.set(key, String(value));
  }
  body.set("api_key", apiKey);
  body.set("signature", signature(parameters, apiSecret));

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`,
    { body, method: "POST", cache: "no-store" },
  );
  if (!response.ok) {
    throw new Error("L’envoi de la photo a échoué.");
  }
  const asset = (await response.json()) as CloudinaryAsset;
  if (
    !asset.public_id ||
    !asset.secure_url?.startsWith("https://res.cloudinary.com/") ||
    !Number.isInteger(asset.version) ||
    !Number.isInteger(asset.width) ||
    !Number.isInteger(asset.height)
  ) {
    throw new Error("Cloudinary a retourné une réponse invalide.");
  }
  return {
    publicId: asset.public_id,
    secureUrl: asset.secure_url,
    version: asset.version,
    width: asset.width,
    height: asset.height,
  };
}

export async function deleteProfilePhoto(publicId: string): Promise<void> {
  const { apiKey, apiSecret, cloudName } = config();
  const parameters = {
    invalidate: "true",
    public_id: publicId,
    timestamp: Math.floor(Date.now() / 1000),
  };
  const body = new URLSearchParams();
  for (const [key, value] of Object.entries(parameters)) {
    body.set(key, String(value));
  }
  body.set("api_key", apiKey);
  body.set("signature", signature(parameters, apiSecret));

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/destroy`,
    { body, method: "POST", cache: "no-store" },
  );
  if (!response.ok) {
    throw new Error("La suppression Cloudinary a échoué.");
  }
}
