import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PresenceControl } from "@/components/presence/presence-control";
import { getServerSession } from "@/lib/supabase/session";

export const metadata: Metadata = {
  title: "Ma présence",
};

export default async function PresencePage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/connexion?retour=%2Fpresence");
  }

  if (session.accountState === "suspended") {
    redirect("/acces-restreint");
  }

  if (session.profileState !== "complete") {
    redirect("/onboarding");
  }

  return <PresenceControl />;
}
