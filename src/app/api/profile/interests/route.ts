import { interestsSelectionSchema } from "@/features/profiles/profile-schema";
import {
  listInterests,
  replaceInterests,
} from "@/features/profiles/server/profile-repository";
import {
  profileJson,
  readJson,
  requireProfileSession,
  toProfileErrorResponse,
} from "@/features/profiles/server/request";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    await requireProfileSession();
    return profileJson({
      interests: await listInterests(await createClient()),
    });
  } catch (error) {
    return toProfileErrorResponse(error);
  }
}

export async function PUT(request: Request) {
  try {
    await requireProfileSession();
    const { interestIds } = await readJson(request, interestsSelectionSchema);
    const client = await createClient();
    await replaceInterests(client, interestIds);
    return profileJson({ saved: true });
  } catch (error) {
    return toProfileErrorResponse(error);
  }
}
