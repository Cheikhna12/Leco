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
      eyebrow="Entrer dans le moment"
      title={
        <>
          Autour de toi,
          <br />
          la ville est <em>vivante.</em>
        </>
      }
      description="Un numéro, un code, puis tu décides quand tu veux être visible. Rien de plus."
      asideTitle="Présent seulement quand tu le choisis"
      asideText="Ta position exacte et ton numéro ne sont jamais montrés aux autres membres."
    >
      <PhoneForm />
    </AuthShell>
  );
}
