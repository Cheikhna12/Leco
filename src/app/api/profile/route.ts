import { profileDraftSchema } from "@/features/profiles/profile-schema";
import {
  getOnboardingState,
  saveProfileDraft,
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
      profile: await getOnboardingState(await createClient()),
    });
  } catch (error) {
    return toProfileErrorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    await requireProfileSession();
    const input = await readJson(request, profileDraftSchema);
    const client = await createClient();
    await saveProfileDraft(client, input);
    return profileJson({ profile: await getOnboardingState(client) });
  } catch (error) {
    return toProfileErrorResponse(error);
  }
}
