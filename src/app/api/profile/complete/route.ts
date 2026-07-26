import {
  completeOnboarding,
  getOnboardingState,
} from "@/features/profiles/server/profile-repository";
import {
  profileJson,
  requireProfileSession,
  toProfileErrorResponse,
} from "@/features/profiles/server/request";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    await requireProfileSession();
    const client = await createClient();
    await completeOnboarding(client);
    return profileJson({
      completed: true,
      profile: await getOnboardingState(client),
    });
  } catch (error) {
    return toProfileErrorResponse(error);
  }
}
