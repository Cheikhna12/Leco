import { redirect } from "next/navigation";

import { getServerSession } from "@/lib/supabase/session";

export default async function HomePage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/connexion");
  }

  if (session.accountState === "suspended") {
    redirect("/acces-restreint");
  }

  if (session.profileState !== "complete") {
    redirect("/onboarding");
  }

  redirect("/presence");
}
