import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/auth-shell";
import { PhoneForm } from "@/components/auth/phone-form";

export const metadata: Metadata = {
  title: "Connexion",
  description: "Connecte-toi à Leco avec ton numéro de téléphone.",
};

export default function ConnectionPage() {
  return (
    <AuthShell
      compact
      title={
        <span aria-label="Entre dans le moment." className="auth-title-scene">
          <span aria-hidden="true" className="auth-title-line">
            <span>Entre dans</span>
          </span>
          <span aria-hidden="true" className="auth-title-line">
            <span>
              le{" "}
              <em className="auth-title-moment">
                moment<span className="auth-title-stop">.</span>
                <span className="auth-title-trace" />
              </em>
            </span>
          </span>
        </span>
      }
    >
      <PhoneForm />
    </AuthShell>
  );
}
