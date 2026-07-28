import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/auth-shell";
import { LogoutButton } from "@/components/auth/logout-button";

export const metadata: Metadata = {
  title: "Accès restreint",
};

export default function RestrictedAccessPage() {
  return (
    <AuthShell
      title={
        <>
          Accès temporairement
          <br />
          <em>restreint.</em>
        </>
      }
    >
      <div className="auth-card auth-card--restricted">
        <p>
          <a href="mailto:securite@leco.app">securite@leco.app</a>
        </p>
        <LogoutButton />
      </div>
    </AuthShell>
  );
}
