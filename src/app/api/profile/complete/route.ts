import type { NextRequest } from "next/server";

import {
  completeOnboarding,
  getOnboardingState,
} from "@/features/profiles/server/profile-repository";
import {
  assertProfileMutationOrigin,
  profileJson,
  requireProfileSession,
  toProfileErrorResponse,
} from "@/features/profiles/server/request";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    assertProfileMutationOrigin(request);
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
