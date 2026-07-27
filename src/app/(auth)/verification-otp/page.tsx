import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/auth-shell";
import { OtpForm } from "@/components/auth/otp-form";

export const metadata: Metadata = {
  title: "Vérification",
  description: "Confirme ton code de connexion Leco.",
};

export default function VerificationOtpPage() {
  return (
    <AuthShell
      eyebrow="Vérification privée"
      title={
        <>
          Une dernière
          <br />
          étape, <em>juste toi.</em>
        </>
      }
      description="Le code confirme ton numéro sans mot de passe à mémoriser."
      asideTitle="Une session protégée"
      asideText="Le code expire rapidement. Ta session est ensuite conservée dans des cookies sécurisés."
    >
      <OtpForm />
    </AuthShell>
  );
}
