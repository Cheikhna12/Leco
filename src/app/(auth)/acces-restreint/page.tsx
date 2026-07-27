import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/auth-shell";
import { LogoutButton } from "@/components/auth/logout-button";

export const metadata: Metadata = {
  title: "Accès restreint",
};

export default function RestrictedAccessPage() {
  return (
    <AuthShell
      eyebrow="Compte en pause"
      title={
        <>
          Ton accès est
          <br />
          <em>temporairement restreint.</em>
        </>
      }
      description="La sécurité de la communauté passe avant tout. Tu peux contacter l’assistance si tu penses qu’il s’agit d’une erreur."
      asideTitle="Tes données restent protégées"
      asideText="Ton profil n’est pas présenté aux autres membres pendant cette restriction."
    >
      <div className="auth-card auth-card--restricted">
        <span className="auth-step">ACCÈS LIMITÉ</span>
        <h2>Besoin d’aide ?</h2>
        <p>
          Écris à <a href="mailto:securite@leco.app">securite@leco.app</a>{" "}
          depuis l’adresse liée à ton dossier. Notre équipe te répondra sans
          demander ton code OTP.
        </p>
        <LogoutButton />
      </div>
    </AuthShell>
  );
}
