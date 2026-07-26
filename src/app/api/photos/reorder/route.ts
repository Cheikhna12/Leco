import { photoOrderSchema } from "@/features/profiles/profile-schema";
import { reorderPhotos } from "@/features/profiles/server/profile-repository";
import {
  profileJson,
  readJson,
  requireProfileSession,
  toProfileErrorResponse,
} from "@/features/profiles/server/request";
import { createClient } from "@/lib/supabase/server";

export async function PUT(request: NextRequest) {
  try {
    const { photoIds } = await readJson(request, photoOrderSchema);
    await requireProfileSession();
    await reorderPhotos(await createClient(), photoIds);
    return profileJson({ reordered: true });
  } catch (error) {
    return toProfileErrorResponse(error);
  }
}
import type { NextRequest } from "next/server";
