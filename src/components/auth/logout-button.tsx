"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <button
      className="auth-submit auth-submit--compact"
      type="button"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        await fetch("/api/auth/logout", { method: "POST" });
        window.dispatchEvent(new Event("leco:session-ended"));
        router.replace("/connexion");
        router.refresh();
      }}
    >
      {pending ? "Déconnexion…" : "Se déconnecter"}
    </button>
  );
}
