import { redirect } from "next/navigation";

import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";
import {
  getOnboardingState,
  listInterests,
} from "@/features/profiles/server/profile-repository";
import { createClient } from "@/lib/supabase/server";
import { getServerSession } from "@/lib/supabase/session";

import "../../(onboarding)/onboarding.css";

export const metadata = {
  title: "Modifier mon profil",
};

export default async function ProfilePage() {
  const session = await getServerSession();
  if (!session) redirect("/connexion");
  if (session.accountState === "suspended") redirect("/acces-restreint");
  if (session.profileState === "incomplete") redirect("/onboarding");

  const client = await createClient();
  const [initialProfile, interests] = await Promise.all([
    getOnboardingState(client),
    listInterests(client),
  ]);

  return (
    <OnboardingFlow
      initialProfile={initialProfile}
      interests={interests}
      mode="profile"
    />
  );
}
