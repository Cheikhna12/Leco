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
      title={
        <>
          Confirme ton <em>code.</em>
        </>
      }
    >
      <OtpForm />
    </AuthShell>
  );
}
